"use client";

import Link from "next/link";
import React from "react";

interface ButtonProps {
  title: string;
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  href,
  onClick,
  className,
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative z-10 inline-block px-10 py-3 text-white text-xl outline-none border-none ${className ?? ""}`}
    >
      <span className="btn-glass" aria-hidden="true" />
      {title}
    </Link>
  );
};
