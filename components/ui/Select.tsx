"use client";

import type { SelectHTMLAttributes } from "react";

type Option = { value: string; label: string };

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Option[];
};

export default function Select({
  label,
  options,
  className = "",
  id,
  ...props
}: Props) {
  const selectId = id ?? props.name ?? label.replace(/\s+/g, "-").toLowerCase();

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-white/85">{label}</span>
      <select
        id={selectId}
        className={`w-full rounded-2xl border border-white/10 bg-[#0C0D14] px-4 py-3 text-sm text-white focus:border-white/25 focus:outline-none ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

