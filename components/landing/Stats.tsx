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
    <section className="border-y border-white/10 bg-[#07080F]">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0f1116] px-5 py-4"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-semibold tracking-tight text-white">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-wide text-white/50">
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
