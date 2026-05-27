import {
  createRouter,
  createRootRouteWithContext,
  createRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import { store, type RootState } from "@/store/store";
import { LoginPage } from "@/pages/LoginPage";
import { AuthenticatedLayout } from "@/pages/AuthenticatedLayout";
import { UsersPage } from "@/pages/UsersPage";
import { UserDetailPage } from "@/pages/UserDetailPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { EnquiriesPage } from "@/pages/EnquiriesPage";
import { DisputesPage } from "@/pages/DisputesPage";
import { GamesPage } from "@/pages/GamesPage";
import { PlatformsPage } from "@/pages/PlatformsPage";
import { WalletsPage } from "@/pages/WalletsPage";

export type RouterContext = { store: typeof store };

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/users" });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: ({ context }) => {
    const state = context.store.getState() as RootState;
    if (
      state.auth.isAuthenticated &&
      state.user.profile?.role === "ADMIN"
    ) {
      throw redirect({ to: "/users" });
    }
  },
  component: LoginPage,
});

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "authenticated",
  beforeLoad: ({ context }) => {
    const state = context.store.getState() as RootState;
    if (!state.auth.isAuthenticated) throw redirect({ to: "/login" });
    if (state.user.profile?.role !== "ADMIN") throw redirect({ to: "/login" });
  },
  component: AuthenticatedLayout,
});

const usersRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/users",
  component: UsersPage,
});

const userDetailRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/users/$userId",
  component: UserDetailPage,
});

const productsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/products",
  component: ProductsPage,
});

const productDetailRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/products/$productId",
  component: ProductDetailPage,
});

const ordersRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/orders",
  component: OrdersPage,
});

const orderDetailRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/orders/$orderId",
  component: OrderDetailPage,
});

const enquiriesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/enquiries",
  component: EnquiriesPage,
});

const disputesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/disputes",
  component: DisputesPage,
});

const gamesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/games",
  component: GamesPage,
});

const platformsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/platforms",
  component: PlatformsPage,
});

const walletsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/wallets",
  component: WalletsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  authLayoutRoute.addChildren([
    usersRoute,
    userDetailRoute,
    productsRoute,
    productDetailRoute,
    ordersRoute,
    orderDetailRoute,
    enquiriesRoute,
    disputesRoute,
    gamesRoute,
    platformsRoute,
    walletsRoute,
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
