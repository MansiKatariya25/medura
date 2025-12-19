"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  leftIcon?: ReactNode;
};

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-[#4D7CFF] text-white shadow-[0_15px_35px_rgba(77,124,255,0.35)] hover:bg-[#426bf0]",
  secondary:
    "bg-white/10 text-white hover:bg-white/15 border border-white/10",
  ghost: "bg-transparent text-white/80 hover:text-white hover:bg-white/5",
};

export default function Button({
  className = "",
  variant = "primary",
  leftIcon,
  children,
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {leftIcon ? <span className="text-base">{leftIcon}</span> : null}
      {children}
    </button>
  );
}

