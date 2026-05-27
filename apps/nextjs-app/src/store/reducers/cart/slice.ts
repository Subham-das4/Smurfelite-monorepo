// store/cartSlice.ts
import { cartApi } from "@/api";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CartItemResponse, CartResponse } from "@smurfelite/types";

// export interface CartItem {
//   id: string;
//   name: string;
//   price: number;
//   quantity: number;
//   image: string;
//   subtitle?: string;
//   platform?: string;
// }

interface CartState {
  items: Record<string, CartItemResponse>; // Normalized for faster lookups
  totalAmount: number;
  totalQuantity: number;
}

const initialState: CartState = {
  items: {},
  totalAmount: 0,
  totalQuantity: 0,
};

function applyCartResponse(state: CartState, payload: CartResponse) {
  state.items = payload.items.reduce(
    (acc, item) => {
      acc[item.productId] = item;
      return acc;
    },
    {} as Record<string, CartItemResponse>,
  );
  state.totalAmount = payload.totalPrice;
  state.totalQuantity = payload.count;
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItemResponse>) => {
      const product = action.payload;
      if (state.items[product.productId]) {
        state.items[product.productId].quantity += 1;
      } else {
        state.items[product.productId] = { ...product, quantity: 1 };
      }
      state.totalQuantity += 1;
      state.totalAmount += product.product.price;
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.items[id]) {
        state.totalQuantity -= state.items[id].quantity;
        state.totalAmount -=
          state.items[id].product.price * state.items[id].quantity;
        delete state.items[id];
      }
    },
    clearCart: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addMatcher(cartApi.endpoints.getCart.matchFulfilled, (state, action) => {
      applyCartResponse(state, action.payload);
    });
    builder.addMatcher(cartApi.endpoints.addToCart.matchFulfilled, (state, action) => {
      applyCartResponse(state, action.payload);
    });
    builder.addMatcher(
      cartApi.endpoints.removeFromCart.matchFulfilled,
      (state, action) => {
        applyCartResponse(state, action.payload);
      },
    );
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
