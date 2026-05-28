"use client";

import React, { useCallback } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";
import { useCapturePayPalOrderMutation } from "@/api";
import { getApiErrorMessage } from "@/lib/apiError";

interface PayPalCheckoutButtonsProps {
  internalOrderId: string;
  paypalOrderId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

function PayPalButtonsInner({
  internalOrderId,
  paypalOrderId,
  onSuccess,
  onCancel,
}: PayPalCheckoutButtonsProps) {
  const [capturePayPalOrder, { isLoading }] = useCapturePayPalOrderMutation();

  const createOrder = useCallback(async () => paypalOrderId, [paypalOrderId]);

  const onApprove = useCallback(
    async (data: { orderID?: string }) => {
      const approvedOrderId = data.orderID ?? paypalOrderId;
      try {
        await capturePayPalOrder({
          paypalOrderId: approvedOrderId,
          internalOrderId,
        }).unwrap();
        onSuccess();
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not complete PayPal payment."));
      }
    },
    [capturePayPalOrder, internalOrderId, onSuccess, paypalOrderId]
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#756189] dark:text-gray-400">
        Complete your payment with PayPal below.
      </p>
      <PayPalButtons
        style={{ layout: "vertical", color: "gold", shape: "rect" }}
        createOrder={createOrder}
        onApprove={onApprove}
        onCancel={onCancel}
        disabled={isLoading}
      />
      {isLoading && (
        <p className="text-sm text-primary animate-pulse">Confirming payment…</p>
      )}
    </div>
  );
}

export function PayPalCheckoutButtons(props: PayPalCheckoutButtonsProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim();

  if (!clientId) {
    return (
      <p className="text-sm text-rose-500">
        PayPal is not configured. Use cryptocurrency or contact support.
      </p>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: "USD",
        intent: "capture",
      }}
    >
      <PayPalButtonsInner {...props} />
    </PayPalScriptProvider>
  );
}
