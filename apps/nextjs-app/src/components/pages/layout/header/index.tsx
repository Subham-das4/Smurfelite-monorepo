"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SiShopify } from "react-icons/si";
import { HiMenuAlt3, HiX, HiUser } from "react-icons/hi";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { setIsLoginModalOpen, logout } from "@/store";
import { SITE_NAME } from "@/constants";
import logo from "@/assets/smurf_elite_logo.png";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Games", href: "/products" },
  { label: "Contact", href: "/#contact_us" },
];

export const Header = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.user);
  const { count: cartCount } = useAppSelector((state) => state.cart);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-surface-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <div
            className="shrink-0 flex items-center gap-3 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md" />
              <Image
                src={logo}
                alt="SmurfElite Logo"
                width={40}
                height={40}
                className="w-10 h-10 relative z-10 object-contain"
              />
            </div>
            <span className="font-bold text-2xl tracking-tight dark:text-white text-gray-900">
              {SITE_NAME}
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex space-x-8 items-center">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side — auth + cart + mobile toggle */}
          <div className="flex items-center gap-6">
            {/* Auth — desktop */}
            {!isAuthenticated ? (
              <button
                className="hidden md:block text-gray-600 dark:text-gray-300 hover:text-primary font-medium transition-colors"
                onClick={() => dispatch(setIsLoginModalOpen(true))}
              >
                Login
              </button>
            ) : (
              <div ref={dropdownRef} className="hidden md:block relative">
                {/* Avatar trigger */}
                <button
                  onClick={() => setUserDropdownOpen((v) => !v)}
                  className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-transparent hover:ring-primary/40 transition-all focus:outline-none"
                  aria-label="User menu"
                >
                  {user?.googleProfilePicture ? (
                    <Image
                      src={user.googleProfilePicture}
                      alt={user.name ?? "User avatar"}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : user?.name ? (
                    <span className="w-full h-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold uppercase">
                      {user.name.charAt(0)}
                    </span>
                  ) : (
                    <span className="w-full h-full bg-primary text-on-primary flex items-center justify-center">
                      <HiUser className="text-lg" />
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                    {user?.name && (
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {user.name}
                        </p>
                        {user.email && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    )}
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        router.push("/orders");
                        setUserDropdownOpen(false);
                      }}
                    >
                      My Orders
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        dispatch(logout());
                        setUserDropdownOpen(false);
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
            <Link href="/cart" className="relative cursor-pointer group">
              <SiShopify className="text-2xl text-gray-800 dark:text-white group-hover:text-primary transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-gray-900">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <HiX className="text-2xl" />
              ) : (
                <HiMenuAlt3 className="text-2xl" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-surface-light dark:bg-background-dark px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-gray-600 dark:text-gray-300 hover:text-primary font-medium py-2 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            {!isAuthenticated ? (
              <button
                className="w-full text-left text-gray-600 dark:text-gray-300 hover:text-primary font-medium py-2 transition-colors"
                onClick={() => {
                  dispatch(setIsLoginModalOpen(true));
                  setMobileOpen(false);
                }}
              >
                Login
              </button>
            ) : (
              <>
                <button
                  className="w-full text-left text-gray-700 dark:text-gray-200 font-medium py-2 hover:text-primary transition-colors"
                  onClick={() => {
                    router.push("/orders");
                    setMobileOpen(false);
                  }}
                >
                  My Orders
                </button>
                <button
                  className="w-full text-left text-red-500 font-medium py-2 hover:text-red-400 transition-colors"
                  onClick={() => {
                    dispatch(logout());
                    setMobileOpen(false);
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
