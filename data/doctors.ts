import type { Doctor } from "@/schemas/doctor";

const cloudinaryBase =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`
    : "https://res.cloudinary.com/demo/image/upload";

export const doctors: Doctor[] = [
  {
    id: "sakshi",
    name: "Dr. Sakshi Verma",
    specialty: "Neurologist",
    rating: 4.5,
    description:
      "A board-certified neurologist with a focus on acute brain care and patient education.",
    category: "neuro",
    reviews: "1.2k reviews",
    image: `${cloudinaryBase}/v1677654321/doctor1.jpg`,
    cloudinaryId: "doctor1",
  },
  {
    id: "sharad",
    name: "Dr. Sharad Swamin",
    specialty: "Pediatric",
    rating: 4.4,
    description:
      "Child-friendly pediatric specialist who focuses on preventive wellness visits.",
    category: "pediatric",
    reviews: "980 reviews",
    image: `${cloudinaryBase}/v1677654321/doctor2.jpg`,
    cloudinaryId: "doctor2",
  },
  {
    id: "anurag",
    name: "Dr. Anurag Ucchan",
    specialty: "Neurologist - PhD",
    rating: 4.0,
    description:
      "Research-driven neurologist partnering with tech-enabled diagnostics for faster recovery.",
    category: "neuro",
    reviews: "450 reviews",
    image: `${cloudinaryBase}/v1677654321/doctor3.jpg`,
    cloudinaryId: "doctor3",
  },
  {
    id: "arjun",
    name: "Dr. Arjun Sen",
    specialty: "General Physician",
    rating: 4.2,
    description:
      "Primary care expert focusing on preventive health plans and chronic disease management.",
    category: "general",
    reviews: "710 reviews",
    image: `${cloudinaryBase}/v1677654321/doctor4.jpg`,
    cloudinaryId: "doctor4",
  },
  {
    id: "megha",
    name: "Dr. Megha Rao",
    specialty: "Cardiologist",
    rating: 4.7,
    description:
      "Interventional cardiologist blending telemetry data with lifestyle coaching.",
    category: "cardio",
    reviews: "1.5k reviews",
    image: `${cloudinaryBase}/v1677654321/doctor5.jpg`,
    cloudinaryId: "doctor5",
  },
  {
    id: "rahul",
    name: "Dr. Rahul Dutt",
    specialty: "General Physician",
    rating: 4.1,
    description:
      "Patient-first GP offering flexible follow-ups via teleconsultations.",
    category: "general",
    reviews: "340 reviews",
    image: `${cloudinaryBase}/v1677654321/doctor6.jpg`,
    cloudinaryId: "doctor6",
  },
  {
    id: "navya",
    name: "Dr. Navya Iyer",
    specialty: "Pediatric Nutrition",
    rating: 4.3,
    description:
      "Pediatric dietitian who partners with families to encourage healthy habits.",
    category: "pediatric",
    reviews: "520 reviews",
    image: `${cloudinaryBase}/v1677654321/doctor7.jpg`,
    cloudinaryId: "doctor7",
  },
  {
    id: "saahil",
    name: "Dr. Saahil Mehra",
    specialty: "Cardiovascular Surgeon",
    rating: 4.8,
    description:
      "Leading surgical team focused on minimally invasive heart procedures.",
    category: "cardio",
    reviews: "870 reviews",
    image: `${cloudinaryBase}/v1677654321/doctor8.jpg`,
    cloudinaryId: "doctor8",
  },
];
