import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      fullName?: string;
      dob?: string;
      gender?: "male" | "female" | "other" | "prefer_not_say";
      profileComplete?: boolean;
      medKey?: {
        abhaNumber?: string;
        bloodGroup?: string;
        allergies?: string[];
        emergencyContact?: { name: string; phone: string; relation: string };
        isKycVerified?: boolean;
      };
    };
  }
}
