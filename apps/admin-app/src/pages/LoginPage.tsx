import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GoogleLogin } from "@react-oauth/google";
import { Button, Input, Label } from "@smurfelite/ui";
import { toast } from "react-toastify";
import { useLoginMutation, useGoogleAuthMutation, useLogoutMutation } from "@/api/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const [googleAuth] = useGoogleAuthMutation();
  const [logout] = useLogoutMutation();

  const finishLogin = async (role: string) => {
    if (role !== "ADMIN") {
      await logout();
      toast.error("Admin account required.");
      return;
    }
    toast.success("Welcome, admin.");
    navigate({ to: "/users" });
  };

  const onEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
      await finishLogin(res.user.role);
    } catch {
      toast.error("Invalid credentials.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Admin login</h1>
        <form onSubmit={onEmailLogin} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            Sign in
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
                await finishLogin(res.user.role);
              } catch {
                toast.error("Google sign-in failed.");
              }
            }}
            onError={() => toast.error("Google sign-in failed.")}
          />
        </div>
      </div>
    </div>
  );
}
