import { Inter, Montserrat } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
    title: "Medura - Every Second Counts",
    description: "India's fastest emergency response platform.",
};

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`${inter.variable} ${montserrat.variable} font-sans selection:bg-blue-500/30`}>
            {children}
        </div>
    );
}
