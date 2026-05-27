import { Outlet } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@smurfelite/ui";
import { useLogoutMutation } from "@/api/auth";
import type { RootState } from "@/store/store";

const NAV = [
  { to: "/products", label: "Products" },
  { to: "/sales", label: "Sales" },
  { to: "/wallet", label: "Wallet" },
  { to: "/disputes", label: "Disputes" },
];

export function AuthenticatedLayout() {
  const profile = useSelector((s: RootState) => s.user.profile);
  const [logout] = useLogoutMutation();
  const navigate = useNavigate();

  return (
    <AppShell
      appName={import.meta.env.VITE_APP_NAME ?? "Seller Portal"}
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
