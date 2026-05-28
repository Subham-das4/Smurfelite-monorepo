import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button, Input, Label } from "@smurfelite/ui";
import { toast } from "react-toastify";
import { useForgotPasswordMutation } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/apiError";

export function ForgotPasswordPage() {
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Reset admin password</h1>
        {submitted ? (
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            {successMessage}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              Send reset link
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
