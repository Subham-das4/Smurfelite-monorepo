"use client";
import Link from "next/link";
import { useState } from "react";
import logo from "@/assets/smurf_elite_logo.png";
import Image from "next/image";

import instagram from "@/assets/footer/instagram.svg";
import facebook from "@/assets/footer/facebook.svg";
import twitter from "@/assets/footer/twitter.svg";
import { TbClipboardCheck } from "react-icons/tb";
import { HiClipboard } from "react-icons/hi";

export const Footer = () => {
  const [textCopied, setTextCopied] = useState(false);

  return (
    <footer className="bg-surface-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm"></div>
                <Image
                  src={logo}
                  alt="SmurfElite Logo"
                  width={32}
                  height={32}
                  className="relative z-10 w-8 h-8 object-contain"
                />
              </div>
              <span className="font-bold text-xl dark:text-white text-gray-900">
                SmurfElite
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              From beginner tips to expert guides, SmurfElite is your ultimate
              gaming resource.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="hover:text-primary transition-colors"
                >
                  Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Games */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Games
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link
                  href="/game"
                  className="hover:text-primary transition-colors"
                >
                  CS GO
                </Link>
              </li>
              <li>
                <Link
                  href="/game"
                  className="hover:text-primary transition-colors"
                >
                  Valorant
                </Link>
              </li>
              <li>
                <Link
                  href="/game"
                  className="hover:text-primary transition-colors"
                >
                  GTA V
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Social Media
            </h3>
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => redirectToSocialMedia("instagram")}
                className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                aria-label="Instagram"
              >
                <Image
                  alt="Instagram"
                  src={instagram}
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              </button>
              <button
                onClick={() => redirectToSocialMedia("facebook")}
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                aria-label="Facebook"
              >
                <Image
                  alt="Facebook"
                  src={facebook}
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              </button>
              <button
                onClick={() => redirectToSocialMedia("twitter")}
                className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                aria-label="Twitter"
              >
                <Image
                  alt="Twitter"
                  src={twitter}
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              For any queries kindly contact <br />
              <span className="inline-flex items-center gap-1">
                <a
                  href="mailto:help@smurfelite.com"
                  className="text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  help@smurfelite.com
                </a>
                {textCopied ? (
                  <TbClipboardCheck className="cursor-pointer text-primary" />
                ) : (
                  <HiClipboard
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => {
                      setTextCopied(true);
                      setTimeout(() => setTextCopied(false), 2000);
                      navigator.clipboard.writeText("help@smurfelite.com");
                    }}
                  />
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © Copyrights. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

const redirectToSocialMedia = (site: string) => {
  switch (site) {
    case "instagram":
      window.open("https://www.instagram.com/smurf.elite/", "_blank");
      break;
    case "facebook":
      break;
    case "twitter":
      break;
    default:
      break;
  }
};
