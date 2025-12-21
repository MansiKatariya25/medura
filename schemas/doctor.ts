import { z } from "zod";

export const doctorSchema = z.object({
  id: z.string(),
  name: z.string(),
  emailLower: z.string().email().optional(),
  passwordHash: z.string().optional(),
  specialty: z.string(),
  rating: z.number().min(0).max(5),
  description: z.string(),
  category: z.string(),
  reviews: z.string().optional(),
  image: z.string().url(),
  cloudinaryId: z.string().optional(),
  location: z.string().optional(),
  pricePerMinute: z.number().optional(),
  walletBalance: z.number().optional(),
  earnings: z.number().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type Doctor = z.infer<typeof doctorSchema>;
