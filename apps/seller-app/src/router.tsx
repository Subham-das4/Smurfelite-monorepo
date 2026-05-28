import {
  createRouter,
  createRootRouteWithContext,
  createRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import { store, type RootState } from "@/store/store";
import { LoginPage } from "@/pages/LoginPage";
import { ApplyPage } from "@/pages/ApplyPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { ProductFormPage } from "@/pages/ProductFormPage";
import { SalesPage } from "@/pages/SalesPage";
import { WalletPage } from "@/pages/WalletPage";
import { DisputesPage } from "@/pages/DisputesPage";
import { AuthenticatedLayout } from "@/pages/AuthenticatedLayout";

export type RouterContext = { store: typeof store };

function redirectIfSellerAuthenticated(context: RouterContext) {
  const state = context.store.getState() as RootState;
  if (
    state.auth.isAuthenticated &&
    state.user.profile?.role === "SELLER"
  ) {
    throw redirect({ to: "/products" });
  }
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/products" });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: ({ context }) => redirectIfSellerAuthenticated(context),
  component: LoginPage,
});

const applyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apply",
  beforeLoad: ({ context }) => redirectIfSellerAuthenticated(context),
  component: ApplyPage,
});

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "authenticated",
  beforeLoad: ({ context }) => {
    const state = context.store.getState() as RootState;
    if (!state.auth.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
    if (state.user.profile?.role !== "SELLER") {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

const productsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/products",
  component: ProductsPage,
});

const productNewRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/products/new",
  component: () => <ProductFormPage mode="create" />,
});

const productEditRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/products/$productId/edit",
  component: () => <ProductFormPage mode="edit" />,
});

const salesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/sales",
  component: SalesPage,
});

const walletRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/wallet",
  component: WalletPage,
});

const disputesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/disputes",
  component: DisputesPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  applyRoute,
  authLayoutRoute.addChildren([
    productsRoute,
    productNewRoute,
    productEditRoute,
    salesRoute,
    walletRoute,
    disputesRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  context: { store },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
