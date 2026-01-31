import { SITE_NAME } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { logout, setIsLoginModalOpen } from "@/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IoReorderThree } from "react-icons/io5";

export const NavbarMobile = () => {
    const [collapse, setCollapse] = useState(true);
    const router = useRouter();
    const { isAuthenticated } = useAppSelector(state => state.auth)
    const dispatch = useAppDispatch();
    return (
        <nav className="nav_mobile" id="nav_mobile">
            <div className="navbar_mobile_upper">
                <section
                    className="logo col-6"
                    onClick={(e) => {
                        router.push("/");
                    }}
                >
                    <section className="logo_img"></section>
                    <span>{SITE_NAME}</span>
                </section>

                <span
                    className="nav_mob_collapse"
                    onClick={(e) => setCollapse((val) => !val)}
                >
                    <IoReorderThree />
                </span>
            </div>
            <div
                className="navbar_mobile_lower"
                style={{ height: collapse ? "0vh" : "42vh" }}
            >
                <section className="nav_links col-5">
                    <div>
                        <Link href="/">Home</Link>
                    </div>
                    <div>
                        <Link href="/games">Games</Link>
                    </div>
                    <div>
                        <Link href="/cart">Cart</Link>
                    </div>
                    <div>
                        <Link href="/orders">My orders</Link>
                    </div>
                    <div>
                        <Link href="/#contact_us" >
                            Contact
                        </Link>
                    </div>
                    <div>
                        {!isAuthenticated ? (
                            <a onClick={() => dispatch(setIsLoginModalOpen(true))}>User Login</a>
                        ) : (
                            <a onClick={() => dispatch(logout())}>
                                Log out
                            </a>
                        )}
                    </div>
                </section>
            </div>
        </nav>
    );
};