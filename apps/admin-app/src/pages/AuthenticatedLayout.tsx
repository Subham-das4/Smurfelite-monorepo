import { Outlet, useNavigate } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { AppShell } from "@smurfelite/ui";
import { useLogoutMutation } from "@/api/auth";
import type { RootState } from "@/store/store";

const NAV = [
  { to: "/admins", label: "Admins" },
  { to: "/sellers", label: "Sellers" },
  { to: "/users", label: "Users" },
  { to: "/products", label: "Products" },
  { to: "/orders", label: "Orders" },
  { to: "/enquiries", label: "Enquiries" },
  { to: "/disputes", label: "Disputes" },
  { to: "/games", label: "Games" },
  { to: "/platforms", label: "Platforms" },
  { to: "/wallets", label: "Wallets" },
];

export function AuthenticatedLayout() {
  const profile = useSelector((s: RootState) => s.user.profile);
  const [logout] = useLogoutMutation();
  const navigate = useNavigate();

  return (
    <AppShell
      appName={import.meta.env.VITE_APP_NAME ?? "Admin Panel"}
      navItems={NAV}
      userLabel={profile?.email}
      onLogout={async () => {
        await logout();
        navigate({ to: "/login" });
      }}
    >
      <Outlet />
    </AppShell>
  );
}
