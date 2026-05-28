"use client";

import React, { useCallback } from "react";
import { MdClose, MdContentCopy } from "react-icons/md";
import { toast } from "react-toastify";
import { useGetOrderCredentialsQuery } from "@/api";
import { getApiErrorMessage } from "@/lib/apiError";

interface OrderCredentialsModalProps {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
}

function CredentialField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, [label, value]);

  return (
    <div className="space-y-1">
      <span className="text-xs font-bold uppercase tracking-wider text-[#756189] dark:text-gray-400">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm bg-[#f2f0f4] dark:bg-white/10 rounded-lg px-3 py-2 break-all text-[#141118] dark:text-white">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="shrink-0 size-9 flex items-center justify-center rounded-lg text-[#756189] hover:bg-[#f2f0f4] dark:hover:bg-white/10"
        >
          <MdContentCopy className="text-lg" />
        </button>
      </div>
    </div>
  );
}

export const OrderCredentialsModal: React.FC<OrderCredentialsModalProps> = ({
  orderId,
  open,
  onClose,
}) => {
  const { data, isLoading, isError, error } = useGetOrderCredentialsQuery(
    orderId ?? "",
    { skip: !open || !orderId }
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credentials-modal-title"
    >
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-[#1e1829] rounded-2xl border border-[#e0dbe6] dark:border-border-dark shadow-xl">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-[#e0dbe6] dark:border-border-dark bg-white dark:bg-[#1e1829]">
          <h2
            id="credentials-modal-title"
            className="text-lg font-bold text-[#141118] dark:text-white"
          >
            Account credentials
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-9 flex items-center justify-center rounded-lg hover:bg-[#f2f0f4] dark:hover:bg-white/10"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-[#756189] dark:text-gray-400">
            Do not share these credentials. Store them securely after copying.
          </p>

          {isLoading && (
            <p className="text-sm text-[#756189] dark:text-gray-400">
              Loading credentials…
            </p>
          )}

          {isError && (
            <p className="text-sm text-rose-500">
              {getApiErrorMessage(
                error,
                "Could not load credentials. The order may not be completed yet."
              )}
            </p>
          )}

          {data?.credentials.map((cred) => (
            <div
              key={cred.productId}
              className="space-y-3 pb-4 border-b border-[#e0dbe6] dark:border-border-dark last:border-0 last:pb-0"
            >
              <p className="font-semibold text-[#141118] dark:text-white">
                {cred.title}{" "}
                <span className="text-[#756189] dark:text-gray-400 font-normal">
                  ({cred.gameType})
                </span>
              </p>
              <CredentialField label="Username" value={cred.accountUsername} />
              <CredentialField label="Password" value={cred.accountPassword} />
              <CredentialField label="Email" value={cred.accountEmail} />
              <CredentialField
                label="Email password"
                value={cred.accountEmailPassword}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
