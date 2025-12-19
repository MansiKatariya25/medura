import Image from "next/image";
import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

const categories = [
  {
    id: "neuro",
    label: "Neurologist",
    icon: "🧠",
  },
  {
    id: "pediatric",
    label: "Pediatric",
    icon: "👶",
  },
  {
    id: "general",
    label: "General Physician",
    icon: "💪",
  },
  {
    id: "cardio",
    label: "Cardiologist",
    icon: "❤️",
  },
];
const heroDoctors = [
  {
    id: "sakshi",
    name: "Dr. Sakshi Verma",
    specialty: "Neurologist",
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "sharad",
    name: "Dr. Sharad Swamin",
    specialty: "Pediatric",
    rating: 4.0,
    image:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80",
  },
];

const featuredDoctor = {
  id: "featured",
  name: "Dr. Sakshi Verma",
  specialty: "Neurologist - PHD",
  rating: 4.5,
  reviews: "1.2k reviews",
  description:
    "A dedicated and board-certified neurologist specializing in acute brain and spinal care, committed to holistic treatment plans.",
  image:
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80",
};

const listDoctors = [
  {
    id: "anurag",
    name: "Dr. Anurag Ucchan",
    specialty: "Neurologist - PhD",
    rating: 4.0,
    description:
      "Passionate about improving patient recovery outcomes through personalized plans.",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "arjun",
    name: "Dr. Arjun Sen",
    specialty: "General Physician",
    rating: 4.2,
    description:
      "Primary care physician with a focus on preventive health and chronic care.",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
  },
];

const navItems = [
  { id: "home", label: "Home", icon: HomeIcon, active: true },
  { id: "chat", label: "Chat", icon: ChatIcon, active: false },
  { id: "records", label: "Records", icon: FileIcon, active: false },
  { id: "profile", label: "Profile", icon: UserIcon, active: false },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#05060B] px-4 py-6 font-sans text-white lg:px-10 lg:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-28">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white">
              <Image
                src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80"
                alt="Jalebi Baby"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold">Jalebi Baby 👋</p>
              <p className="text-sm text-white/70">Good afternoon</p>
            </div>
            <button className="rounded-full border border-white/20 bg-white/25 p-3 text-white/70">
              <BellIcon className="h-4 w-4 text-white" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-white/40 p-1 text-sm text-white/60">
              <div className="flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 text-sm">
                <LocationIcon className="h-5 w-5 text-white" />
                New York
              </div>
              <div className="flex min-w-[220px] flex-1 items-center justify-between text-sm text-white/60">
                <div className="flex items-center gap-3">
                  <span className="h-5 w-px rounded-full bg-white/30" />
                  <span>Search</span>
                </div>
                <button className="rounded-full p-2 text-white">
                  <SearchIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-white">Doctors Category</h2>
            <button className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
              See all
            </button>
          </div>

          {/* Categories Grid */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-1 rounded-4xl bg-white/10 px-3 py-2 text-sm cursor-pointer"
              >
                <div className="flex h-7 w-7 items-center justify-center text-center">
                  {category.icon}
                </div>
                <p className="text-gray-200 leading-tight whitespace-nowrap">{category.label}</p>
              </div>
            ))}
          </div>
          
        </section>
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {heroDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="rounded-[32px] bg-[#191B24] p-3 pb-4"
            >
              <div className="relative h-40 overflow-hidden rounded-[26px]">
                <Image
                  src={doctor.image}
                  alt={doctor.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 230px"
                  className="object-cover"
                />
                <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-semibold">
                  <StarIcon className="h-3.5 w-3.5 text-[#F9D655]" />
                  {doctor.rating.toFixed(1)}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-white">{doctor.name}</p>
                <p className="text-xs text-white/50">{doctor.specialty}</p>
                <div className="mt-3 flex gap-2">
                  <RoundedIconButton>
                    <CameraIcon className="h-4 w-4" />
                  </RoundedIconButton>
                  <RoundedIconButton>
                    <CalendarIcon className="h-4 w-4" />
                  </RoundedIconButton>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 rounded-[36px] bg-[#1B1C24] p-5">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative h-28 w-28 overflow-hidden rounded-[28px] border border-white/5">
                <Image
                  src={featuredDoctor.image}
                  alt={featuredDoctor.name}
                  fill
                  sizes="(max-width: 1024px) 120px, 150px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold">{featuredDoctor.name}</p>
                <p className="text-sm text-white/60">
                  {featuredDoctor.specialty}
                </p>
                <div className="mt-2 flex items-center gap-1 text-sm text-white/70">
                  <StarIcon className="h-4 w-4 text-[#F9D655]" />
                  {featuredDoctor.rating}
                  <span className="text-white/40">- {featuredDoctor.reviews}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {featuredDoctor.description}
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-2xl bg-[#4D7CFF] py-3 text-sm font-semibold">
                Book Now
              </button>
              <RoundedIconButton className="w-12 flex-none border border-white/15 bg-transparent">
                <CameraIcon className="h-4 w-4" />
              </RoundedIconButton>
            </div>
          </div>

          <div className="flex-1 space-y-4 rounded-[36px] bg-[#11121A] p-4">
            {listDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex gap-4 rounded-[32px] bg-[#15161E] p-4"
              >
                <div className="relative h-24 w-24 overflow-hidden rounded-[24px] border border-white/5">
                  <Image
                    src={doctor.image}
                    alt={doctor.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="text-base font-semibold text-white">
                    {doctor.name}
                  </p>
                  <p className="text-sm text-white/60">{doctor.specialty}</p>
                  <div className="mt-1 flex items-center gap-1 text-sm text-white/70">
                    <StarIcon className="h-4 w-4 text-[#F9D655]" />
                    {doctor.rating.toFixed(1)}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-white/55">
                    {doctor.description}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 rounded-2xl border border-white/10 py-2 text-sm text-white/80">
                      Book Now
                    </button>
                    <RoundedIconButton>
                      <FileIcon className="h-4 w-4" />
                    </RoundedIconButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <nav className="fixed bottom-6 left-1/2 z-20 w-[90%] max-w-[420px] -translate-x-1/2 rounded-full bg-[#151621] px-6 py-4 text-white shadow-[0_15px_35px_rgba(0,0,0,0.4)] lg:max-w-lg">
        <div className="flex items-center justify-between">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`flex flex-col items-center text-xs ${
                item.active ? "text-white" : "text-white/50"
              }`}
            >
              <item.icon
                className={`mb-1 h-5 w-5 ${
                  item.active ? "text-white" : "text-white/60"
                }`}
              />
              {item.label}
            </button>
          ))}
          <button className="h-12 w-12 rounded-full bg-[#FF3535] shadow-[0_15px_35px_rgba(255,53,53,0.4)]">
            <PlusIcon className="mx-auto h-5 w-5" />
          </button>
        </div>
      </nav>
    </div>
  );
}

function RoundedIconButton({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-[#202331] text-white ${className}`}
    >
      {children}
    </span>
  );
}

function StarIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 3.5l2.36 4.76 5.26.77-3.8 3.7.9 5.23L12 15.88l-4.72 2.48.9-5.23-3.8-3.7 5.26-.77z" />
    </svg>
  );
}

function CameraIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="6" width="18" height="14" rx="3" />
      <circle cx="12" cy="13" r="3" />
      <path d="M7 6l1.5-2h7L17 6" />
    </svg>
  );
}

function CalendarIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  );
}

function FileIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M7 2h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M15 2v6h6" />
    </svg>
  );
}

function ChatIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 11.5a8.5 8.5 0 0 1-12.53 7.52L3 21l1.98-4.69A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}

function HomeIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

function UserIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1" />
    </svg>
  );
}

function BellIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function LocationIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SearchIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}

function FilterIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 6h16M6 12h12M10 18h4" />
    </svg>
  );
}

function PlusIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
