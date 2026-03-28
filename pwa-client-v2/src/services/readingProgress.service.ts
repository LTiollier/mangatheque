import api, { ApiResponse } from '@/lib/api';
import { ReadingProgress } from '@/types/volume';

export const readingProgressService = {
    getAll: () =>
        api.get<ApiResponse<ReadingProgress[]>>('/reading-progress')
            .then(r => r.data.data as ReadingProgress[]),

    toggleBulk: (volumeIds: number[]) =>
        api.post<{ toggled: ReadingProgress[], removed: number[] }>(
            '/reading-progress/toggle/bulk',
            { volume_ids: volumeIds }
        ).then(r => r.data),
};
