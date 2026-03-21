<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Application\DTOs\PlanningFiltersDTO;
use App\Manga\Domain\Models\PlanningItem;
use App\Manga\Domain\Models\PlanningResult;
use App\Manga\Domain\Repositories\PlanningRepositoryInterface;
use Illuminate\Support\Facades\DB;

/**
 * @phpstan-type PlanningRow array{
 *   id: int|string,
 *   type: string,
 *   sort_type: int|string,
 *   title: string,
 *   number: string|null,
 *   cover_url: string|null,
 *   release_date: string,
 *   series_id: int|string,
 *   series_title: string,
 *   edition_id: int|string|null,
 *   edition_title: string|null,
 *   is_owned: int|string|bool,
 *   is_wishlisted: int|string|bool,
 * }
 */
class EloquentPlanningRepository implements PlanningRepositoryInterface
{
    public function findPlanning(PlanningFiltersDTO $dto): PlanningResult
    {
        $cursor = $dto->cursor !== null ? $this->decodeCursor($dto->cursor) : null;

        ['sql' => $innerSql, 'bindings' => $innerBindings] = $this->buildInnerQuery($dto);

        [$cursorSql, $cursorBindings] = $cursor !== null
            ? $this->buildCursorCondition($cursor)
            : ['', []];

        $sql = "SELECT * FROM ({$innerSql}) AS planning {$cursorSql} ORDER BY release_date ASC, sort_type ASC, id ASC LIMIT ?";
        $bindings = array_merge($innerBindings, $cursorBindings, [$dto->perPage + 1]);

        /** @var list<PlanningRow> $rows */
        $rows = array_map(static fn (object $r) => (array) $r, DB::select($sql, $bindings));

        $total = $this->countTotal($dto);

        $hasMore = count($rows) > $dto->perPage;
        if ($hasMore) {
            array_pop($rows);
        }

        $lastRow = count($rows) > 0 ? $rows[count($rows) - 1] : null;
        $nextCursor = $hasMore && $lastRow !== null ? $this->encodeCursor($lastRow) : null;

        $items = array_map(fn (array $row) => $this->rowToDomain($row), $rows);

        return new PlanningResult($items, $total, $dto->perPage, $nextCursor, $hasMore);
    }

    /**
     * @return array{sql: string, bindings: array<int, mixed>}
     */
    private function buildInnerQuery(PlanningFiltersDTO $dto): array
    {
        if ($dto->type === 'volume') {
            return [
                'sql' => $this->buildVolumeSql($dto->mySeries),
                'bindings' => $this->buildVolumeBindings($dto),
            ];
        }

        if ($dto->type === 'box') {
            return [
                'sql' => $this->buildBoxSql($dto->mySeries),
                'bindings' => $this->buildBoxBindings($dto),
            ];
        }

        $volumeSql = $this->buildVolumeSql($dto->mySeries);
        $boxSql = $this->buildBoxSql($dto->mySeries);

        return [
            'sql' => "{$volumeSql} UNION ALL {$boxSql}",
            'bindings' => array_merge($this->buildVolumeBindings($dto), $this->buildBoxBindings($dto)),
        ];
    }

    private function buildVolumeSql(bool $mySeries): string
    {
        $mySeriesWhere = $mySeries
            ? 'AND s.id IN (SELECT DISTINCT e2.series_id FROM editions e2 JOIN volumes v2 ON v2.edition_id = e2.id JOIN user_volumes uv2 ON uv2.volume_id = v2.id WHERE uv2.user_id = ?)'
            : '';

        return "
            SELECT
                v.id,
                'volume' AS type,
                0 AS sort_type,
                v.title,
                v.number,
                v.cover_url,
                v.published_date AS release_date,
                s.id AS series_id,
                s.title AS series_title,
                e.id AS edition_id,
                e.name AS edition_title,
                EXISTS(SELECT 1 FROM user_volumes uv WHERE uv.volume_id = v.id AND uv.user_id = ?) AS is_owned,
                EXISTS(SELECT 1 FROM wishlist_items wi WHERE wi.wishlistable_id = v.edition_id AND wi.wishlistable_type = 'edition' AND wi.user_id = ?) AS is_wishlisted
            FROM volumes v
            JOIN editions e ON e.id = v.edition_id
            JOIN series s ON s.id = e.series_id
            WHERE v.published_date IS NOT NULL
            AND v.published_date BETWEEN ? AND ?
            {$mySeriesWhere}
        ";
    }

    /**
     * @return array<int, mixed>
     */
    private function buildVolumeBindings(PlanningFiltersDTO $dto): array
    {
        $bindings = [$dto->userId, $dto->userId, $dto->from, $dto->to];
        if ($dto->mySeries) {
            $bindings[] = $dto->userId;
        }

        return $bindings;
    }

    private function buildBoxSql(bool $mySeries): string
    {
        $mySeriesWhere = $mySeries
            ? 'AND s.id IN (SELECT DISTINCT e2.series_id FROM editions e2 JOIN volumes v2 ON v2.edition_id = e2.id JOIN user_volumes uv2 ON uv2.volume_id = v2.id WHERE uv2.user_id = ?)'
            : '';

        return "
            SELECT
                b.id,
                'box' AS type,
                1 AS sort_type,
                b.title,
                b.number,
                b.cover_url,
                b.release_date AS release_date,
                s.id AS series_id,
                s.title AS series_title,
                NULL AS edition_id,
                NULL AS edition_title,
                EXISTS(SELECT 1 FROM user_boxes ub WHERE ub.box_id = b.id AND ub.user_id = ?) AS is_owned,
                EXISTS(SELECT 1 FROM wishlist_items wi WHERE wi.wishlistable_id = b.id AND wi.wishlistable_type = 'box' AND wi.user_id = ?) AS is_wishlisted
            FROM boxes b
            JOIN box_sets bs ON bs.id = b.box_set_id
            JOIN series s ON s.id = bs.series_id
            WHERE b.release_date IS NOT NULL
            AND b.release_date BETWEEN ? AND ?
            {$mySeriesWhere}
        ";
    }

    /**
     * @return array<int, mixed>
     */
    private function buildBoxBindings(PlanningFiltersDTO $dto): array
    {
        $bindings = [$dto->userId, $dto->userId, $dto->from, $dto->to];
        if ($dto->mySeries) {
            $bindings[] = $dto->userId;
        }

        return $bindings;
    }

    private function countTotal(PlanningFiltersDTO $dto): int
    {
        /** @var array<int, mixed> $seriesIds */
        $seriesIds = [];

        if ($dto->mySeries) {
            $seriesIds = DB::table('editions as e2')
                ->join('volumes as v2', 'v2.edition_id', '=', 'e2.id')
                ->join('user_volumes as uv2', 'uv2.volume_id', '=', 'v2.id')
                ->where('uv2.user_id', $dto->userId)
                ->distinct()
                ->pluck('e2.series_id')
                ->toArray();
        }

        $volumeCount = 0;

        if ($dto->type !== 'box') {
            $volumeQuery = DB::table('volumes as v')
                ->join('editions as e', 'e.id', '=', 'v.edition_id')
                ->join('series as s', 's.id', '=', 'e.series_id')
                ->whereNotNull('v.published_date')
                ->whereBetween('v.published_date', [$dto->from, $dto->to]);

            if ($dto->mySeries) {
                $volumeQuery->whereIn('s.id', $seriesIds);
            }

            $volumeCount = $volumeQuery->count();
        }

        $boxCount = 0;

        if ($dto->type !== 'volume') {
            $boxQuery = DB::table('boxes as b')
                ->join('box_sets as bs', 'bs.id', '=', 'b.box_set_id')
                ->join('series as s', 's.id', '=', 'bs.series_id')
                ->whereNotNull('b.release_date')
                ->whereBetween('b.release_date', [$dto->from, $dto->to]);

            if ($dto->mySeries) {
                $boxQuery->whereIn('s.id', $seriesIds);
            }

            $boxCount = $boxQuery->count();
        }

        return $volumeCount + $boxCount;
    }

    /**
     * @param  array{release_date: string, sort_type: int, id: int}  $cursor
     * @return array{string, array<int, mixed>}
     */
    private function buildCursorCondition(array $cursor): array
    {
        $sql = 'WHERE (
            release_date > ?
            OR (release_date = ? AND sort_type > ?)
            OR (release_date = ? AND sort_type = ? AND id > ?)
        )';

        $bindings = [
            $cursor['release_date'],
            $cursor['release_date'],
            $cursor['sort_type'],
            $cursor['release_date'],
            $cursor['sort_type'],
            $cursor['id'],
        ];

        return [$sql, $bindings];
    }

    /**
     * @return array{release_date: string, sort_type: int, id: int}|null
     */
    private function decodeCursor(string $cursor): ?array
    {
        $json = base64_decode($cursor, true);
        if ($json === false) {
            return null;
        }

        $decoded = json_decode($json, true);
        if (! is_array($decoded)) {
            return null;
        }

        if (! isset($decoded['release_date'], $decoded['sort_type'], $decoded['id'])) {
            return null;
        }

        $releaseDate = $decoded['release_date'];
        $sortType = $decoded['sort_type'];
        $id = $decoded['id'];

        if (! is_string($releaseDate) || ! is_int($sortType) || ! is_int($id)) {
            return null;
        }

        return [
            'release_date' => $releaseDate,
            'sort_type' => $sortType,
            'id' => $id,
        ];
    }

    /**
     * @param  PlanningRow  $row
     */
    private function encodeCursor(array $row): string
    {
        return base64_encode((string) json_encode([
            'release_date' => $row['release_date'],
            'sort_type' => (int) $row['sort_type'],
            'id' => (int) $row['id'],
        ]));
    }

    /**
     * @param  PlanningRow  $row
     */
    private function rowToDomain(array $row): PlanningItem
    {
        return new PlanningItem(
            id: (int) $row['id'],
            type: (string) $row['type'],
            title: (string) $row['title'],
            number: $row['number'] !== null ? (string) $row['number'] : null,
            coverUrl: $row['cover_url'] !== null ? (string) $row['cover_url'] : null,
            releaseDate: (string) $row['release_date'],
            seriesId: (int) $row['series_id'],
            seriesTitle: (string) $row['series_title'],
            editionId: $row['edition_id'] !== null ? (int) $row['edition_id'] : null,
            editionTitle: $row['edition_title'] !== null ? (string) $row['edition_title'] : null,
            isOwned: (bool) $row['is_owned'],
            isWishlisted: (bool) $row['is_wishlisted'],
        );
    }
}
