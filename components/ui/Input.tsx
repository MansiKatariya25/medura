"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, className = "", id, ...props },
  ref,
) {
  const inputId = id ?? props.name ?? label.replace(/\s+/g, "-").toLowerCase();

  return (
    <label className="block space-y-2">
      <div className="flex items-end justify-between">
        <span className="text-sm font-medium text-white/85">{label}</span>
        {hint ? <span className="text-xs text-white/50">{hint}</span> : null}
      </div>
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none ${className}`}
        {...props}
      />
    </label>
  );
});

export default Input;

