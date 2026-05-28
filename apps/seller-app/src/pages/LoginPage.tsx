import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { GoogleLogin } from "@react-oauth/google";
import { Button, Input, Label } from "@smurfelite/ui";
import { toast } from "react-toastify";
import { useLoginMutation, useGoogleAuthMutation, useLogoutMutation } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/apiError";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const [googleAuth] = useGoogleAuthMutation();
  const [logout] = useLogoutMutation();

  const finishLogin = async (role: string, sellerApprovalStatus?: string) => {
    if (role !== "SELLER") {
      await logout();
      toast.error("Seller account required. Contact support to get seller access.");
      return;
    }
    if (sellerApprovalStatus === "REJECTED") {
      toast.info("Your seller application was rejected. Contact support or re-apply.");
    } else {
      toast.success("Welcome back!");
    }
    navigate({ to: "/products" });
  };

  const onEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
      await finishLogin(res.user.role, res.user.sellerApprovalStatus);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Invalid email or password."));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Seller login</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Sign in with your seller account
        </p>
        <form onSubmit={onEmailLogin} className="mt-6 space-y-4">
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
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-text-muted)]">or</span>
          <div className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (cred) => {
              try {
                const res = await googleAuth(cred).unwrap();
                await finishLogin(res.user.role, res.user.sellerApprovalStatus);
              } catch (err) {
                toast.error(getApiErrorMessage(err, "Google sign-in failed."));
              }
            }}
            onError={() => toast.error("Google sign-in failed.")}
          />
        </div>
        <p className="mt-4 text-center text-sm">
          <Link to="/apply" className="text-primary underline">
            Apply to become a seller
          </Link>
        </p>
      </div>
    </div>
  );
}
