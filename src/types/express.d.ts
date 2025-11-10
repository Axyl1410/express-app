import "express";
import type { SessionType } from "./session";
import type { UserType } from "./user";

declare global {
  // biome-ignore lint/style/noNamespace: Required for Express type augmentation
  namespace Express {
    // biome-ignore lint/style/useConsistentTypeDefinitions: Required for declaration merging
    interface Request {
      session?: {
        session: SessionType;
        user: UserType;
      } | null;
      user?: UserType | null;
    }
  }
}
