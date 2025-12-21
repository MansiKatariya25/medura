import { z } from "zod";

export const ambulanceSchema = z.object({
  id: z.string(),
  riderName: z.string(),
  ambulanceNumber: z.string(),
  phoneNumber: z.string(),
  emailLower: z.string().email().optional(),
  passwordHash: z.string().optional(),
  location: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type Ambulance = z.infer<typeof ambulanceSchema>;
