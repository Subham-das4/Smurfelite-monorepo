import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button, Input, Label } from "@smurfelite/ui";
import { toast } from "react-toastify";
import { useLoginMutation, useLogoutMutation } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/apiError";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading }] = useLoginMutation();
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
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Invalid credentials."));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Admin login</h1>
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
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link to="/forgot-password" className="text-primary underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
