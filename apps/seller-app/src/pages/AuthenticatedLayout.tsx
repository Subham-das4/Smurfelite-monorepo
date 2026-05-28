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
      {profile?.sellerApprovalStatus === "PENDING" && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Awaiting admin approval — listings won&apos;t appear on the storefront
          until approved.
        </div>
      )}
      {profile?.sellerApprovalStatus === "REJECTED" && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          Your seller application was rejected.
          {profile.sellerRejectionNote
            ? ` Note: ${profile.sellerRejectionNote}`
            : " Contact support or submit a new application."}
        </div>
      )}
      <Outlet />
    </AppShell>
  );
}
