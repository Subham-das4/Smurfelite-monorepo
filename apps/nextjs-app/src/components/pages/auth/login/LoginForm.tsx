import { useForm } from "react-hook-form";
import { useLoginMutation } from "@/api/auth";
import { LoginRequest } from "@smurfelite/types";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/hooks";
import { setIsLoginModalOpen } from "@/store";

type LoginFields = {
  email: string;
  password: string;
};

type Props = {
  onSwitchToRegister: () => void;
};

export const LoginForm = ({ onSwitchToRegister }: Props) => {
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>();

  const onSubmit = async (data: LoginFields) => {
    const payload: LoginRequest = {
      email: data.email,
      password: data.password,
    };
    const res = await login(payload);
    if (res.error) {
      toast.error("Login failed. Check your credentials and try again.");
    } else {
      toast.success("Welcome back!");
      dispatch(setIsLoginModalOpen(false));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Email */}
      <div className="space-y-1.5">
        <label
          className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1"
          htmlFor="login-email"
        >
          Email Address
        </label>
        <input
          id="login-email"
          type="email"
          placeholder="name@domain.com"
          className="w-full bg-surface-container px-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-on-surface-variant/50 transition-all outline-none"
          {...field("email", {
            required: "Email is required.",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address.",
            },
          })}
        />
        {errors.email && (
          <p className="text-error text-xs mt-1 px-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label
          className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1"
          htmlFor="login-password"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          placeholder="••••••••"
          className="w-full bg-surface-container px-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-on-surface-variant/50 transition-all outline-none"
          {...field("password", {
            required: "Password is required.",
          })}
        />
        {errors.password && (
          <p className="text-error text-xs mt-1 px-1">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-on-primary font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all mt-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isLoading ? "Signing in…" : "Log In"}
      </button>

      <div className="mt-8 text-center">
        <p className="text-sm font-medium text-on-surface-variant">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-primary font-bold hover:underline ml-1"
          >
            Sign Up
          </button>
        </p>
      </div>
    </form>
  );
};
