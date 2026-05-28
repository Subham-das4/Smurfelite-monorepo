import { Role, User } from "@smurfelite/types";

export interface UserState {
    user: User | null;
}

export interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
    refreshToken: string | null;
    actingAs: Role | null;
    login: {
        loading: boolean;
    };
    forgotPassword: {
        loading: boolean;
    };
    isLoginModalOpen: boolean;
}

export interface CartState {
    cart: any[];
    count: number;
}
