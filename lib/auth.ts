import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { z } from "zod";

import clientPromise from "@/lib/mongodb";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["patient", "doctor", "ambulance"]).optional(),
});

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const emailLower = parsed.data.email.toLowerCase();
        const role = parsed.data.role ?? "patient";
        const client = await clientPromise;
        const db = client.db();

        const user = await db.collection("users").findOne<{
          _id: unknown;
          email: string;
          name?: string;
          image?: string | null;
          passwordHash?: string;
          role?: string;
        }>({ emailLower });

        if (!user?.passwordHash) return null;

        if (user.role && user.role !== role) {
          return null;
        }

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: String(user._id),
          email: user.email,
          name: user.name ?? "",
          image: user.image ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (!session.user) return session;

      const userId = token.sub ?? (token.id as string | undefined);
      if (!userId) return session;

      session.user.id = userId;

      const client = await clientPromise;
      const db = client.db();

      const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;

      const stored = await db.collection("users").findOne<{
        fullName?: string;
        dob?: string;
        gender?: "male" | "female" | "other" | "prefer_not_say";
        profileComplete?: boolean;
        role?: string;
        meduraId?: string;
        state?: string;
      }>(userObjectId ? { _id: userObjectId } : { id: userId });

      if (stored?.fullName) session.user.fullName = stored.fullName;
      if (stored?.dob) session.user.dob = stored.dob;
      if (stored?.gender) session.user.gender = stored.gender;
      session.user.profileComplete = Boolean(stored?.profileComplete);
      if (stored?.role) (session.user as any).role = stored.role;
      if (stored?.meduraId) (session.user as any).meduraId = stored.meduraId;
      if (stored?.state) (session.user as any).state = stored.state;

      if (stored?.fullName) session.user.name = stored.fullName;
      return session;
    },
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      const client = await clientPromise;
      const db = client.db();
      const userObjectId = ObjectId.isValid(user.id) ? new ObjectId(user.id) : null;
      await db.collection("users").updateOne(
        userObjectId ? { _id: userObjectId } : { id: user.id },
        {
          $set: {
            emailLower: user.email?.toLowerCase(),
            fullName: user.name ?? undefined,
            profileComplete: false,
          },
        },
      );
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
