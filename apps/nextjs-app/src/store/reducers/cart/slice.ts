import { CartState } from "@/types/slice.types";
import { createSlice } from "@reduxjs/toolkit";

const initialState: CartState = {
    cart: [],
    count: 0,
}

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {

    },
})

export default cartSlice.reducer;

