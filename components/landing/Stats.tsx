"use client";

import { motion } from "framer-motion";
import { Clock, Users, Activity } from "lucide-react";

const stats = [
    {
        id: 1,
        label: "Active Ambulances",
        value: "5,000+",
        icon: Activity,
        color: "text-blue-500",
    },
    {
        id: 2,
        label: "Avg. Response Time",
        value: "8 mins",
        icon: Clock,
        color: "text-red-500",
    },
    {
        id: 3,
        label: "Lives Impacted",
        value: "10,000+",
        icon: Users,
        color: "text-green-500",
    },
];

export default function Stats() {
    return (
        <section className="border-y border-white/5 bg-black/20 backdrop-blur-sm">
            <div className="container mx-auto max-w-6xl px-4 py-12">
                <div className="grid gap-8 md:grid-cols-3">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col items-center justify-center gap-2 text-center md:flex-row md:text-left"
                        >
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 p-2.5 ${stat.color}`}
                            >
                                <stat.icon className="h-full w-full" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold tracking-tight text-white">
                                    {stat.value}
                                </div>
                                <div className="text-sm font-medium text-white/50">
                                    {stat.label}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
