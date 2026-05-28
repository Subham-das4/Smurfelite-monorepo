import { AuthState } from '@/types/slice.types';
import { Role } from '@smurfelite/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logout } from '../user/slice';

const initialState: AuthState = {
    token: null,
    isAuthenticated: false,
    refreshToken: null,
    actingAs: null,
    login: {
        loading: false,
    },
    forgotPassword: {
        loading: false,
    },
    isLoginModalOpen: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{
                token: string;
                refreshToken: string;
                actingAs?: Role | null;
            }>
        ) => {
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.refreshToken = action.payload.refreshToken;
            state.actingAs = action.payload.actingAs ?? 'BUYER';
        },
        setIsLoginModalOpen: (state, action: PayloadAction<boolean>) => {
            if (state.isAuthenticated && action.payload) return;
            state.isLoginModalOpen = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(logout, () => initialState);
    },
});

export const authReducer = authSlice.reducer;
export const { setCredentials, setIsLoginModalOpen } = authSlice.actions;
