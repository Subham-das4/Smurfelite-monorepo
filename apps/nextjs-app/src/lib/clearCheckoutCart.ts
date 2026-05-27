import { cartApi } from "@/api/cart";
import { clearCart } from "@/store/reducers/cart/slice";
import type { AppDispatch } from "@/store/store";

/** Clears server cart and Redux cart after confirmed checkout/payment. */
export async function clearCheckoutCart(dispatch: AppDispatch) {
  try {
    await dispatch(cartApi.endpoints.clearCart.initiate()).unwrap();
  } catch {
    // Cart may already be empty or session expired; still clear local state.
  }
  dispatch(clearCart());
}
