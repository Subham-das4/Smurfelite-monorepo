"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useForgotPasswordMutation } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/apiError";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await forgotPassword({ email }).unwrap();
      setSuccessMessage(res.message);
      setSubmitted(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Request failed. Try again."));
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface p-8 shadow-lg">
        <h1 className="text-2xl font-black uppercase tracking-tight text-on-surface">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        {submitted ? (
          <p className="mt-6 text-sm text-on-surface-variant">{successMessage}</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="forgot-email"
                className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1"
              >
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-container px-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-on-primary font-bold uppercase tracking-widest py-4 rounded-xl disabled:opacity-60"
            >
              {isLoading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-primary font-semibold hover:underline">
            Return to store
          </Link>
        </p>
      </div>
    </div>
  );
}
