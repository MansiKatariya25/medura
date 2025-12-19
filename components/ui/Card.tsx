import type { ReactNode } from "react";

export default function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#10111A]/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {description ? (
          <p className="text-sm leading-relaxed text-white/60">{description}</p>
        ) : null}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

