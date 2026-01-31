import { User } from '@/types';
import { UserState } from '@/types/slice.types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: UserState = {
    user: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState: initialState,
    reducers: {
        logout: (state) => {
            state = initialState;
            return state;
        },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
        },
    },
});

export const { logout, setUser } = userSlice.actions;

export default userSlice.reducer;
