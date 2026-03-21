# Mangastore API Documentation

## Authentication

**Method**: Laravel Sanctum — httpOnly `auth_token` cookie (converted to Bearer token via middleware)
**Prefix**: All routes under `/api`
**Rate limiting**: `throttle:auth` on auth endpoints, `throttle:api` elsewhere

---

## Public Routes (no auth)

### POST /api/auth/register
Register a new user.

**Body**:
```json
{ "name": "string", "email": "string", "password": "string", "password_confirmation": "string" }
```
**Response 201**: `UserResource`

---

### POST /api/auth/login
Authenticate and receive session cookie.

**Body**:
```json
{ "email": "string", "password": "string" }
```
**Response 200**: `UserResource` + sets `auth_token` cookie
**Response 401**: Invalid credentials

---

### POST /api/auth/forgot-password
Send password reset email.

**Body**: `{ "email": "string" }`
**Response 200**: `{ "message": "..." }` | **400** on failure

---

### POST /api/auth/reset-password
Reset password using token from email.

**Body**: `{ "token": "string", "email": "string", "password": "string", "password_confirmation": "string" }`
**Response 200**: `{ "message": "..." }` | **400** on failure

---

### GET /api/mangas/search
Search mangas via external API.

**Query params**: `query` (required, min 3), `page` (int), `per_page` (int, max 50)
**Response 200**: `MangaSearchResultResource[]`
```json
{
  "id": 1,
  "api_id": "string",
  "title": "string",
  "authors": ["string"],
  "description": "string|null",
  "published_date": "string|null",
  "page_count": "int|null",
  "cover_url": "string",
  "isbn": "string|null"
}
```

---

### GET /api/mangas/search/isbn
Search a single manga by ISBN (barcode scan). Looks up the volume in the local catalog.

**Query params**: `isbn` (required, string)
**Response 200**: `VolumeSearchResultResource`
```json
{
  "id": 1,
  "api_id": "string",
  "title": "string",
  "authors": ["string"],
  "description": null,
  "published_date": "string|null",
  "page_count": null,
  "cover_url": "string|null",
  "isbn": "string"
}
```
**Response 404**: ISBN not found in local catalog
**Response 422**: `isbn` param missing

---

### GET /api/users/{username}
Get a public user profile.

**Response 200**: `PublicUserResource` | **404** if user not found or profile not public
```json
{ "id": 1, "name": "string", "username": "string", "is_public": true }
```

---

### GET /api/users/{username}/collection
Get a public user's manga collection.

**Response 200**: `MangaResource[]` | **404** if not public

---

## Authenticated Routes (requires `auth:sanctum`)

### POST /api/auth/logout
Invalidate current session and clear cookie.

**Response 200**: `{ "message": "Successfully logged out." }`

---

### GET /api/user
Get the authenticated user.

**Response 200**: `UserResource`
```json
{ "id": 1, "name": "string", "username": "string|null", "email": "string", "is_public": false }
```

---

### PUT /api/user/settings
Update profile settings.

**Body**: `{ "username": "string|null", "is_public": true }`
`username`: nullable, max 50, alpha_dash, unique
**Response 200**: `UserResource`

---

---

### POST /api/user/settings/import/mangacollec
Import a user's collection from a MangaCollec profile.

**Body**: `{ "url": "string" }`
`url`: required, must be a valid MangaCollec collection URL (e.g., `https://www.mangacollec.com/user/xutech/collection`).
**Response 200**:
```json
{
  "data": {
    "imported": 15,
    "failed": 2
  }
}
```
**Response 403**: Profile is private or invalid (`MangaCollecProfilePrivateException`).
**Response 422**: Validation failure or invalid URL format (`InvalidMangaCollecUrlException`).

## Catalog Routes (authenticated)

### GET /api/series/{id}
Get a series with its editions and box sets.

**Response 200**: `SeriesResource` | **404**
```json
{
  "id": 1, "title": "string", "authors": ["string"], "cover_url": "string",
  "editions": ["EditionResource[]"],
  "box_sets": ["BoxSetResource[]"]
}
```

---

### GET /api/series/{id}/editions
List editions of a series.

**Response 200**: `EditionResource[]`

---

### GET /api/editions/{editionId}
Get a single edition with volumes.

**Response 200**: `EditionResource` | **404**
```json
{
  "id": 1, "series_id": 1, "name": "string", "publisher": "string", "language": "string",
  "total_volumes": 12, "possessed_count": 5, "is_wishlisted": false, "cover_url": "string",
  "possessed_numbers": [1, 2, 3],
  "series": "SeriesResource",
  "volumes": "MangaResource[]"
}
```

---

### GET /api/editions/{editionId}/volumes
List volumes of an edition.

**Response 200**: `MangaResource[]`

---

### GET /api/box-sets/{boxSetId}
Get a box set with its boxes.

**Response 200**: `BoxSetResource` | **404**
```json
{
  "id": 1, "series_id": 1, "title": "string", "publisher": "string",
  "api_id": "string", "cover_url": "string",
  "boxes": "BoxResource[]"
}
```

---

### GET /api/boxes/{boxId}
Get a single box with its volumes.

**Response 200**: `BoxResource` | **404**
```json
{
  "id": 1, "box_set_id": 1, "api_id": "string", "title": "string", "number": 1,
  "isbn": "string", "release_date": "string", "cover_url": "string",
  "is_empty": false, "is_owned": true, "is_wishlisted": false,
  "total_volumes": 5, "possessed_count": 3, "series_id": 1,
  "volumes": "MangaResource[]"
}
```

---

## Collection Routes (authenticated)

### GET /api/mangas
List the authenticated user's collection.

**Response 200**: `MangaResource[]`
```json
{
  "id": 1, "api_id": "string", "isbn": "string", "number": 1,
  "title": "string", "authors": ["string"], "published_date": "string",
  "cover_url": "string", "is_owned": true, "is_loaned": false,
  "loaned_to": "string|null", "is_wishlisted": false,
  "series": "SeriesResource", "edition": "EditionResource"
}
```

---

### POST /api/mangas
Add a single manga by external API ID.

**Body**: `{ "api_id": "string" }`
**Response 201**: `MangaResource`

---

### POST /api/mangas/scan-bulk
Add multiple mangas by ISBN (barcode scanning).

**Body**: `{ "isbns": ["string"] }`
**Response 201**: `MangaResource[]`

---

### POST /api/mangas/bulk
Add multiple volumes from an edition by volume numbers.

**Body**: `{ "edition_id": 1, "numbers": [1, 2, 3] }`
**Response 201**: `MangaResource[]`

---

### DELETE /api/mangas/{id}
Remove a single volume from collection.

**Auth**: User must own the volume
**Response 200**: `{ "message": "Volume removed from collection" }`

---

### DELETE /api/series/{seriesId}
Remove all volumes of a series from collection.

**Auth**: User must own the series
**Response 200**: `{ "message": "Series removed from collection" }`

---

## Box Collection Routes (authenticated)

### POST /api/boxes/{boxId}
Add a box to collection.

**Query**: `include_volumes` (boolean, default: true) — also adds contained volumes
**Response 201**: `{ "message": "Box added to collection" }`

---

### DELETE /api/boxes/{boxId}
Remove a box from collection.

**Response 200**: `{ "message": "Box removed from collection" }`

---

## Loan Routes (authenticated)

### GET /api/loans
List all active and past loans.

**Response 200**: `LoanResource[]`
```json
{
  "id": 1, "loanable_id": 5, "loanable_type": "volume|box",
  "borrower_name": "string", "loaned_at": "ISO8601",
  "returned_at": "ISO8601|null", "is_returned": false,
  "notes": "string|null",
  "loanable": "MangaResource|BoxResource"
}
```

---

### POST /api/loans
Loan a single item (volume or box).

**Body**:
```json
{ "loanable_id": 1, "loanable_type": "volume|box", "borrower_name": "string", "notes": "string|null" }
```
**Auth**: User must own the item
**Response 201**: `LoanResource` | **422** if already loaned

---

### POST /api/loans/bulk
Loan multiple volumes at once.

**Body**:
```json
{ "volume_ids": [1, 2, 3], "borrower_name": "string", "notes": "string|null" }
```
**Auth**: User must own all volumes
**Response 200**: `LoanResource[]`

---

### POST /api/loans/return
Return a single loaned item.

**Body**: `{ "loanable_id": 1, "loanable_type": "volume|box" }`
**Auth**: User must own the item
**Response 200**: `LoanResource`

---

### POST /api/loans/return/bulk
Return multiple loaned items.

**Body**:
```json
{ "items": [{ "id": 1, "type": "volume|box" }] }
```
**Auth**: User must own all items
**Response 200**: `LoanResource[]`

---

## Reading Progress Routes (authenticated)

### GET /api/reading-progress
List all reading progress entries for the authenticated user.

**Response 200**: `ReadingProgressResource[]`
```json
{ "id": 1, "volume_id": 5, "read_at": "ISO8601" }
```

---

### POST /api/reading-progress/toggle/bulk
Toggle read/unread status for multiple volumes (idempotent).

**Body**: `{ "volume_ids": [1, 2, 3] }`
`volume_ids.*`: must exist in `volumes` table
**Response 200**:
```json
{
  "toggled": "ReadingProgressResource[]",
  "removed": [1, 3]
}
```
`toggled` = newly marked as read, `removed` = volume IDs unmarked

---

## Planning Routes (authenticated)

### GET /api/planning
List upcoming manga releases (volumes + boxes) in a sliding time window.

**Query params**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `from` | date `Y-m-d` | today − 1 month | Start of the release window |
| `to` | date `Y-m-d` | today + 1 year | End of the release window |
| `type` | `volume\|box\|all` | `all` | Filter by item type |
| `my_series` | boolean | `false` | Only show series where the user owns ≥ 1 volume |
| `per_page` | int | `24` | Items per page |
| `cursor` | string | — | Cursor for next page (opaque, from `meta.next_cursor`) |

**Response 200**:
```json
{
  "data": [
    {
      "id": 42,
      "type": "volume",
      "title": "Berserk T42",
      "number": "42",
      "cover_url": "https://...",
      "release_date": "2026-04-02",
      "series": { "id": 7, "title": "Berserk" },
      "edition": { "id": 3, "title": "Edition originale" },
      "is_owned": false,
      "is_wishlisted": true
    },
    {
      "id": 18,
      "type": "box",
      "title": "One Piece Box 4",
      "number": "4",
      "cover_url": "https://...",
      "release_date": "2026-03-25",
      "series": { "id": 2, "title": "One Piece" },
      "edition": null,
      "is_owned": false,
      "is_wishlisted": false
    }
  ],
  "meta": {
    "per_page": 24,
    "total": 87,
    "next_cursor": "eyJpZCI6...",
    "has_more": true
  }
}
```

**Notes**:
- Results are sorted by `release_date ASC`; volumes come before boxes on the same date
- Items without a release date are excluded
- `edition` is `null` for box items
- `is_owned`: whether the item is in the user's collection
- `is_wishlisted`: volume → wishlist on its edition; box → direct wishlist on the box
- Pagination is cursor-based; pass `meta.next_cursor` as `cursor` to fetch the next page

---

## Wishlist Routes (authenticated)

### GET /api/wishlist
List all wishlisted editions and box sets.

**Response 200**: `WishlistItemResource[]` — each item has a `type` field (`edition` or `box`)

---

### POST /api/wishlist
Add an item to wishlist.

**Body**:
```json
{ "wishlist_id": 1, "wishlist_type": "edition|box" }
```
**Response 201**: `WishlistItemResource`

---

### DELETE /api/wishlist/{id}
Remove an item from wishlist.

**Body**: `{ "wishlist_type": "edition|box" }`
**Auth**: Item must belong to user's wishlist
**Response 200**: `{ "message": "Item removed from wishlist" }`

---

## Error Responses

All errors return `{ "message": "string" }` with appropriate status codes.

| Exception | Status |
|-----------|--------|
| Resource not found (manga, edition, series, volume) | 404 |
| Validation failure | 422 |
| `AlreadyLoanedException` | 422 |
| `LoanNotFoundException` | 422 |
| `InvalidMangaCollecUrlException` | 422 |
| `MangaCollecProfilePrivateException` | 403 |
| Authorization failure (not owner) | 403 |
| Unauthenticated | 401 |
