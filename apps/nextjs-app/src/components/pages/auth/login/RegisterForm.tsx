import { useForm } from "react-hook-form";
import { useRegisterMutation } from "@/api/auth";
import { RegisterRequest } from "@smurfelite/types";
import { toast } from "react-toastify";

type RegisterFields = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type Props = {
  onSwitchToLogin: () => void;
};

export const RegisterForm = ({ onSwitchToLogin }: Props) => {
  const [register, { isLoading }] = useRegisterMutation();

  const {
    register: field,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFields>();

  const onSubmit = async (data: RegisterFields) => {
    const payload: RegisterRequest = {
      name: data.name,
      email: data.email,
      password: data.password,
    };
    const res = await register(payload);
    if (res.error) {
      toast.error("Registration failed. Please try again.");
    } else {
      toast.success(res.data?.message ?? "Account created! Please log in.");
      onSwitchToLogin();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Name */}
      <div className="space-y-1.5">
        <label
          className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1"
          htmlFor="reg-name"
        >
          Full Name
        </label>
        <input
          id="reg-name"
          type="text"
          placeholder="John Doe"
          className="w-full bg-surface-container px-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-on-surface-variant/50 transition-all outline-none"
          {...field("name", { required: "Name is required." })}
        />
        {errors.name && (
          <p className="text-error text-xs mt-1 px-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label
          className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1"
          htmlFor="reg-email"
        >
          Email Address
        </label>
        <input
          id="reg-email"
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
          htmlFor="reg-password"
        >
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          placeholder="••••••••"
          className="w-full bg-surface-container px-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-on-surface-variant/50 transition-all outline-none"
          {...field("password", {
            required: "Password is required.",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters.",
            },
          })}
        />
        {errors.password && (
          <p className="text-error text-xs mt-1 px-1">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label
          className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1"
          htmlFor="reg-confirm-password"
        >
          Confirm Password
        </label>
        <input
          id="reg-confirm-password"
          type="password"
          placeholder="••••••••"
          className="w-full bg-surface-container px-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-on-surface-variant/50 transition-all outline-none"
          {...field("confirmPassword", {
            required: "Please confirm your password.",
            validate: (value) =>
              value === watch("password") || "Passwords do not match.",
          })}
        />
        {errors.confirmPassword && (
          <p className="text-error text-xs mt-1 px-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-on-primary font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all mt-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isLoading ? "Creating account…" : "Sign Up"}
      </button>

      <div className="mt-8 text-center">
        <p className="text-sm font-medium text-on-surface-variant">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary font-bold hover:underline ml-1"
          >
            Log In
          </button>
        </p>
      </div>
    </form>
  );
};
