import { SITE_NAME } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { logout, setIsLoginModalOpen } from "@/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaAngleDown } from "react-icons/fa";
import { SiShopify } from "react-icons/si";

export const NavbarFixed = () => {
    const [scrollY, setScrollY] = useState(0);
    const router = useRouter();
    const { isAuthenticated } = useAppSelector(state => state.auth)
    const { user } = useAppSelector(state => state.user)
    const { count: cartCount } = useAppSelector(state => state.cart)

    const dispatch = useAppDispatch();

    useEffect(() => {
        const handleScroll = () => {
            // Get the current scroll position from the top
            const currentScrollY = window.scrollY;
            setScrollY(currentScrollY);
        };

        // Attach the scroll event listener
        window.addEventListener("scroll", handleScroll);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <nav
            className="nav_fixed"
            id="nav_fixed"
            style={{ top: scrollY > 120 ? 0 : "-100%" }}
        >
            <section className="navbar">
                <section
                    className="logo col-3 pointer"
                    onClick={() => {
                        router.push("/");

                    }}
                >
                    <section className="logo_img"></section>
                    {SITE_NAME}
                </section>

                <section className="nav_links col-5">
                    <span>
                        <Link href="/">Home</Link>
                    </span>
                    <span>
                        <Link href="/#about" >
                            About
                        </Link>
                    </span>
                    <span>
                        <Link href="/games">Games</Link>
                    </span>
                    <span>
                        <Link href="/#contact_us" >
                            Contact
                        </Link>
                    </span>
                </section>

                <section className="user_info col-4 ">
                    {!isAuthenticated ? (
                        <span
                            style={{ cursor: "pointer", minWidth: "160px" }}
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
                            <div
                                className="logout"
                                onClick={() => dispatch(logout())}
                            >
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
            </section>
        </nav>
    );
};