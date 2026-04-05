"use client";

import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { setIsLoginModalOpen } from "@/store";
import { useGoogleOAuthMutation } from "@/api/auth";
import { toast } from "react-toastify";
import { RegisterForm } from "./RegisterForm";
import { LoginForm } from "./LoginForm";

type Mode = "register" | "login";

export const LoginRegister = () => {
  const dispatch = useAppDispatch();
  const { isLoginModalOpen } = useAppSelector((state) => state.auth);
  const [mode, setMode] = useState<Mode>("register");
  const [googleOAuth, { isLoading: isGoogleLoading }] = useGoogleOAuthMutation();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const res = await googleOAuth({
        credential: tokenResponse.access_token,
      } as Parameters<typeof googleOAuth>[0]);
      if (res.error) {
        toast.error("Google sign-in failed. Please try again.");
      } else {
        dispatch(setIsLoginModalOpen(false));
      }
    },
    onError: () => {
      toast.error("Google sign-in failed. Please try again.");
    },
  });

  if (!isLoginModalOpen) return null;

  return (
    <>
      {/* Backdrop — purely visual, pointer-events-none */}
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm pointer-events-none" />

      {/* Container — clicking outside the card closes the modal */}
      <div
        className="fixed inset-0 z-70 flex items-center justify-center p-4"
        onClick={() => dispatch(setIsLoginModalOpen(false))}
      >
        {/* Card — stop propagation so clicks inside don't close the modal */}
        <div
          className="w-full max-w-md bg-surface rounded-xl shadow-2xl border border-outline-variant overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >

          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <h1 className="text-3xl font-black tracking-tight text-on-surface uppercase mb-2">
              {mode === "register" ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-on-surface-variant font-medium text-sm">
              {mode === "register"
                ? "Welcome to the future of digital assets."
                : "Sign in to your SmurfElite account."}
            </p>
          </div>

          {/* Content */}
          <div className="px-8 pb-10">

            {/* Google Button */}
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-surface border border-outline rounded-xl font-bold text-sm tracking-tight hover:bg-surface-container-low transition-all active:scale-95 mb-6 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {isGoogleLoading ? "Redirecting…" : "Continue with Google"}
            </button>

            {/* Divider */}
            <div className="relative flex items-center mb-6">
              <div className="grow border-t border-outline" />
              <span className="shrink mx-4 text-[10px] font-black text-on-surface-variant tracking-widest uppercase">
                OR
              </span>
              <div className="grow border-t border-outline" />
            </div>

            {/* Forms */}
            {mode === "register" ? (
              <RegisterForm onSwitchToLogin={() => setMode("login")} />
            ) : (
              <LoginForm onSwitchToRegister={() => setMode("register")} />
            )}
          </div>

          {/* Footer */}
          <div className="bg-surface-container-low px-8 py-4 flex items-center justify-center gap-4">
            <span className="text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-tighter cursor-pointer hover:text-on-surface-variant transition-colors">
              Terms of Service
            </span>
            <div className="w-1 h-1 rounded-full bg-outline" />
            <span className="text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-tighter cursor-pointer hover:text-on-surface-variant transition-colors">
              Privacy Policy
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
