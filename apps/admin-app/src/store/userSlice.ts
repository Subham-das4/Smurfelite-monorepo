import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@smurfelite/types";

export type UserState = {
  profile: Omit<User, "password"> | null;
};

const initialState: UserState = { profile: null };

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Omit<User, "password">>) => {
      state.profile = action.payload;
    },
    logout: () => initialState,
  },
});

export const { setUser, logout } = userSlice.actions;
export const userReducer = userSlice.reducer;
