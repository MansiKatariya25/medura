"use client";

import { motion } from "framer-motion";

export default function FluidBackground() {
    return (
        <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden">
            {/* Primary Blue Beam */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    x: [-50, 50, -50],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute -top-40 left-0 h-[500px] w-[500px] rounded-full bg-blue-600/30 blur-[128px]"
            />

            {/* Secondary Red Beam */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2],
                    x: [50, -50, 50],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                }}
                className="absolute top-1/2 right-0 h-[400px] w-[400px] rounded-full bg-red-600/20 blur-[128px]"
            />

            {/* Accent Green Beam */}
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                }}
                className="absolute bottom-0 left-1/3 h-[600px] w-[600px] rounded-full bg-[#34C759]/10 blur-[160px]"
            />
        </div>
    );
}
