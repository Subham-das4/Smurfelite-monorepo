import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/apiError";

type CreateInvoiceFn = (args: {
  internalOrderId: string;
}) => Promise<{ invoiceUrl: string }>;

export async function payOrderWithCrypto(
  orderId: string,
  createInvoice: CreateInvoiceFn
): Promise<void> {
  try {
    const invoice = await createInvoice({ internalOrderId: orderId });
    window.location.href = invoice.invoiceUrl;
  } catch (err) {
    toast.error(getApiErrorMessage(err, "Could not start crypto payment."));
  }
}
