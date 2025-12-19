import { z } from "zod";

export const doctorSchema = z.object({
  id: z.string(),
  name: z.string(),
  specialty: z.string(),
  rating: z.number().min(0).max(5),
  description: z.string(),
  category: z.string(),
  reviews: z.string().optional(),
  image: z.string().url(),
  cloudinaryId: z.string().optional(),
});

export type Doctor = z.infer<typeof doctorSchema>;
