import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#07080F] py-12 px-4">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 max-w-6xl md:flex-row">
        <div className="flex items-center gap-2">
          <img src="/medura.png" alt="Medura Logo" className="h-5 w-5 text-blue-500" />
          <span className="font-bold text-white">Medura</span>
        </div>

        <p className="text-sm text-white/50">
          Built with care for a safer India.
        </p>

        <div className="flex gap-6 text-sm text-white/60">
          <Link href="#" className="hover:text-white transition">Privacy</Link>
          <Link href="#" className="hover:text-white transition">Terms</Link>
          <Link href="#" className="hover:text-white transition">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
