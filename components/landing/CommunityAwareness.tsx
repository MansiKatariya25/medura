"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Users } from "lucide-react";

const highlights = [
  {
    title: "Nearby health sessions",
    description: "Find verified camps, talks, and screenings around you.",
    icon: MapPin,
  },
  {
    title: "Community groups",
    description: "Join local groups to get real-time updates and reminders.",
    icon: Users,
  },
  {
    title: "Register & attend",
    description: "One tap to reserve your spot and track upcoming events.",
    icon: Calendar,
  },
];

export default function CommunityAwareness() {
  return (
    <section className="bg-[#05060B] py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col items-center text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#4D7CFF]">
            Community Awareness
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl font-(family-name:--font-dm-sans)">
            Health awareness, built for your neighborhood
          </h2>
          <p className="mt-4 max-w-2xl text-white/60">
            Medura connects people to trusted community health sessions, support
            groups, and local awareness drives.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-2xl border border-white/10 bg-[#0f1116] p-6"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-[#4D7CFF]">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white font-(family-name:--font-dm-sans)">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
