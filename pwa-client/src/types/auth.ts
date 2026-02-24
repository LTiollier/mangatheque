export interface User {
    id: number;
    name: string;
    email: string;
    username: string | null;
    is_public: boolean;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}
