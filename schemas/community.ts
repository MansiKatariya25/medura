import { z } from "zod";

export const communitySchema = z.object({
  _id: z.any().optional(),
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()).optional(),
  members: z.number().optional(),
  createdAt: z.date().optional(),
  locationName: z.string().optional(),
  locationCoords: z
    .object({
      type: z.literal("Point"),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),
});

export type Community = z.infer<typeof communitySchema>;
