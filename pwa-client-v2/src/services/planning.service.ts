import api from '@/lib/api';
import { PlanningResponse } from '@/types/volume';

export const planningService = {
    getPage: (cursor?: string): Promise<PlanningResponse> =>
        api.get<PlanningResponse>('/planning', {
            params: {
                per_page: 24,
                ...(cursor ? { cursor } : {}),
            },
        }).then(r => r.data as PlanningResponse),
};
