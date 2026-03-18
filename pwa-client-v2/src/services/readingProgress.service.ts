import api, { ApiResponse } from '@/lib/api';
import { ReadingProgress } from '@/types/manga';
import { ReadingProgressSchema } from '@/schemas/manga';
import { z } from 'zod';

export const readingProgressService = {
    getAll: () =>
        api.get<ApiResponse<ReadingProgress[]>>('/reading-progress')
            .then(r => z.array(ReadingProgressSchema).parse(r.data.data) as ReadingProgress[]),

    toggleBulk: (volumeIds: number[]) =>
        api.post<{ toggled: ReadingProgress[], removed: number[] }>(
            '/reading-progress/toggle/bulk',
            { volume_ids: volumeIds }
        ).then(r => r.data),
};
