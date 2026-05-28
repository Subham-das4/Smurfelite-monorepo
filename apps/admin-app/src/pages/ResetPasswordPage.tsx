import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Button, Input, Label } from "@smurfelite/ui";
import { toast } from "react-toastify";
import { useResetPasswordMutation } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/apiError";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useSearch({ strict: false }) as { token?: string };
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const missingToken = !token?.trim();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token?.trim()) return;
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
      navigate({ to: "/login" });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Reset failed. Request a new link."));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Set new password</h1>
        {missingToken ? (
          <div className="mt-4 space-y-2 text-sm text-[var(--color-text-muted)]">
            <p>Invalid or missing reset link.</p>
            <Link to="/forgot-password" className="text-primary underline">
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              Reset password
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-primary underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
