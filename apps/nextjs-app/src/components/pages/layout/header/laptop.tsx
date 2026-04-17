import { SITE_NAME } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { setIsLoginModalOpen } from "@/store";
import { logout } from "@/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaAngleDown } from "react-icons/fa";
import { SiShopify } from "react-icons/si";

export const NavbarLarge = () => {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector((state) => state.cart.totalQuantity);
  return (
    <nav className="nav_lg" id="nav_large">
      <div className="navbar navbar_lower">
        <section
          className="logo col-3"
          onClick={(e) => {
            router.push("/");
          }}
        >
          <section className="logo_img pointer"></section>
          {SITE_NAME}
        </section>

        <section className="nav_links col-5">
          <span>
            <Link href="/">Home</Link>
          </span>
          <span>
            <Link href="/#about">About</Link>
          </span>
          <span>
            <Link href="/games">Games</Link>
          </span>
          <span>
            <Link href="/#contact_us">Contact</Link>
          </span>
        </section>

        <section className="user_info col-4 ">
          {!isAuthenticated ? (
            <span
              style={{ cursor: "pointer" }}
              onClick={() => dispatch(setIsLoginModalOpen(true))}
            >
              User Login
            </span>
          ) : (
            <span>
              User {user?.name}
              <span className="">
                <FaAngleDown />
              </span>
              <div className="logout" onClick={() => dispatch(logout())}>
                Logout
              </div>
              <div className="my_orders" onClick={() => router.push("/orders")}>
                My Orders
              </div>
            </span>
          )}
          <span>
            <div className="count">{cartCount}</div>
            <Link href={"/cart"}>
              <SiShopify />
            </Link>
          </span>
        </section>

        <section className="col-1"></section>
      </div>
    </nav>
  );
};
