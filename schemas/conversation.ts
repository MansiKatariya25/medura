import { z } from "zod";

export const conversationMessageSchema = z.object({
  _id: z.any().optional(),
  communityId: z.string(),
  authorId: z.string().optional(),
  authorName: z.string(),
  text: z.string(),
  createdAt: z.date().optional(),
});

export type ConversationMessage = z.infer<typeof conversationMessageSchema>;
