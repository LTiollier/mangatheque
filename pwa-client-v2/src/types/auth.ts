export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    username: string | null;
    is_public: boolean;
    theme: string;
    palette: string;
    notify_planning_releases: boolean;
    view_mode_mobile: string;
    view_mode_desktop: string;
}
