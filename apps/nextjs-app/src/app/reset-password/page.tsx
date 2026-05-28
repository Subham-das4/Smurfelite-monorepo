"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { useResetPasswordMutation } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/apiError";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      const res = await resetPassword({ token, newPassword: password }).unwrap();
      toast.success(res.message);
      router.push("/");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Reset failed. Request a new link."));
    }
  };

  if (!token.trim()) {
    return (
      <div className="mt-6 space-y-3 text-sm text-on-surface-variant">
        <p>Invalid or missing reset link.</p>
        <Link href="/forgot-password" className="text-primary font-semibold hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="new-password"
          className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1"
        >
          New password
        </label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          className="w-full bg-surface-container px-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium outline-none"
        />
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="confirm-password"
          className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1"
        >
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          required
          className="w-full bg-surface-container px-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-on-primary font-bold uppercase tracking-widest py-4 rounded-xl disabled:opacity-60"
      >
        {isLoading ? "Resetting…" : "Reset password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface p-8 shadow-lg">
        <h1 className="text-2xl font-black uppercase tracking-tight text-on-surface">
          Set new password
        </h1>
        <Suspense fallback={<p className="mt-6 text-sm text-on-surface-variant">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-primary font-semibold hover:underline">
            Return to store
          </Link>
        </p>
      </div>
    </div>
  );
}
