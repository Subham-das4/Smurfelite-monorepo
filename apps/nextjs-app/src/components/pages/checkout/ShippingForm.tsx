import React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  MdHome,
  MdPhone,
  MdArrowBack,
  MdArrowForward,
} from "react-icons/md";
import type { ShippingFormData } from "./types";

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Australia",
  "India",
] as const;

interface ShippingFormProps {
  defaultValues?: Partial<ShippingFormData>;
  onSubmit: (data: ShippingFormData) => void;
}

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  colSpan?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  children,
  colSpan,
}) => (
  <div className={colSpan ? "md:col-span-2" : ""}>
    <label className="flex flex-col w-full">
      <span className="text-base font-medium pb-2">{label}</span>
      {children}
    </label>
    {error && (
      <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
    )}
  </div>
);

const inputClass =
  "form-input w-full rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark focus:ring-2 focus:ring-primary focus:border-primary h-14 px-4 text-base placeholder-[#756189] transition-all";

const inputErrorClass =
  "form-input w-full rounded-xl border border-red-400 dark:border-red-500 bg-white dark:bg-surface-dark focus:ring-2 focus:ring-red-400 h-14 px-4 text-base placeholder-[#756189] transition-all";

export const ShippingForm: React.FC<ShippingFormProps> = ({
  defaultValues,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormData>({
    defaultValues: {
      newsletter: false,
      country: "United States",
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-8"
      noValidate
    >
      {/* Contact Information */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Contact Information</h2>
          <span className="text-sm text-[#756189] dark:text-gray-400 hidden sm:inline">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Log in
            </Link>
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <FormField label="Email address" error={errors.email?.message}>
            <input
              type="email"
              placeholder="Enter your email for delivery"
              className={errors.email ? inputErrorClass : inputClass}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
            />
          </FormField>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="newsletter"
              className="rounded border-border-light text-primary focus:ring-primary h-5 w-5 bg-white dark:bg-surface-dark cursor-pointer"
              {...register("newsletter")}
            />
            <label
              htmlFor="newsletter"
              className="text-sm text-[#756189] dark:text-gray-300 cursor-pointer select-none"
            >
              Email me with news and offers
            </label>
          </div>
        </div>
      </div>

      {/* Billing Address */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Billing Address</h2>
        <p className="text-sm text-[#756189] dark:text-gray-400 mb-6">
          Enter the address associated with your payment method.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Country */}
          <FormField label="Country/Region" colSpan>
            <div className="relative">
              <select
                className={`${inputClass} appearance-none cursor-pointer`}
                {...register("country", { required: "Country is required" })}
              >
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#756189] text-lg">
                ▾
              </span>
            </div>
          </FormField>

          {/* First Name */}
          <FormField label="First name" error={errors.firstName?.message}>
            <input
              type="text"
              placeholder="First name"
              className={errors.firstName ? inputErrorClass : inputClass}
              {...register("firstName", {
                required: "First name is required",
              })}
            />
          </FormField>

          {/* Last Name */}
          <FormField label="Last name" error={errors.lastName?.message}>
            <input
              type="text"
              placeholder="Last name"
              className={errors.lastName ? inputErrorClass : inputClass}
              {...register("lastName", {
                required: "Last name is required",
              })}
            />
          </FormField>

          {/* Address */}
          <FormField label="Address" error={errors.address?.message} colSpan>
            <div className="relative">
              <input
                type="text"
                placeholder="Street address"
                className={`${errors.address ? inputErrorClass : inputClass} pl-11`}
                {...register("address", { required: "Address is required" })}
              />
              <MdHome className="absolute left-4 top-1/2 -translate-y-1/2 text-[#756189] text-xl" />
            </div>
          </FormField>

          {/* Apartment (optional) */}
          <FormField label="Apartment, suite, etc. (optional)" colSpan>
            <input
              type="text"
              className={inputClass}
              {...register("apartment")}
            />
          </FormField>

          {/* City */}
          <FormField label="City" error={errors.city?.message}>
            <input
              type="text"
              placeholder="City"
              className={errors.city ? inputErrorClass : inputClass}
              {...register("city", { required: "City is required" })}
            />
          </FormField>

          {/* Postal Code */}
          <FormField label="Postal code" error={errors.postalCode?.message}>
            <input
              type="text"
              placeholder="ZIP code"
              className={errors.postalCode ? inputErrorClass : inputClass}
              {...register("postalCode", {
                required: "Postal code is required",
              })}
            />
          </FormField>

          {/* Phone */}
          <FormField label="Phone" error={errors.phone?.message} colSpan>
            <div className="relative">
              <input
                type="tel"
                placeholder="(555) 555-5555"
                className={`${errors.phone ? inputErrorClass : inputClass} pl-11`}
                {...register("phone", { required: "Phone number is required" })}
              />
              <MdPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#756189] text-xl" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#756189] pointer-events-none bg-background-light dark:bg-background-dark px-1 rounded">
                For updates
              </span>
            </div>
          </FormField>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border-light dark:border-border-dark">
        <Link
          href="/cart"
          className="flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors py-2"
        >
          <MdArrowBack className="text-lg" />
          Return to cart
        </Link>
        <button
          type="submit"
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 active:scale-95 text-white rounded-xl h-14 px-8 text-base font-bold tracking-wide shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
        >
          <span>Continue to Payment</span>
          <MdArrowForward className="text-lg" />
        </button>
      </div>
    </form>
  );
};
