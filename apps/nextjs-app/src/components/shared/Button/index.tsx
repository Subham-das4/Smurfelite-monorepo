'use client'
import Link from "next/link";
import React from "react";
interface ButtonProps {
  title: string;
  href: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ title, href, onClick, className }) => {
  return (
    <button className={`btn_primary_1 ${className}`} onClick={onClick}>
      <Link href={href}>
        <div className="glass_effect"></div>
        {title}
      </Link>
    </button>
  );
};
