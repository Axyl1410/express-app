import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, openAPI } from "better-auth/plugins";
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "@/services/email.service";
import { prisma } from "./prisma";
import { assertValue } from "./utils";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    minPasswordLength: 6,

    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({ name: user.name, email: user.email }, url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: 60 * 60,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ name: user.name, email: user.email }, url);
    },
  },
  socialProviders: {
    github: {
      clientId: assertValue(
        process.env.GITHUB_CLIENT_ID,
        "Missing GITHUB_CLIENT_ID"
      ),
      clientSecret: assertValue(
        process.env.GITHUB_CLIENT_SECRET,
        "Missing GITHUB_CLIENT_SECRET"
      ),
    },
    discord: {
      clientId: assertValue(
        process.env.DISCORD_CLIENT_ID,
        "Missing DISCORD_CLIENT_ID"
      ),
      clientSecret: assertValue(
        process.env.DISCORD_CLIENT_SECRET,
        "Missing DISCORD_CLIENT_SECRET"
      ),
    },
    google: {
      clientId: assertValue(
        process.env.GOOGLE_CLIENT_ID,
        "Missing GOOGLE_CLIENT_ID"
      ),
      clientSecret: assertValue(
        process.env.GOOGLE_CLIENT_SECRET,
        "Missing GOOGLE_CLIENT_SECRET"
      ),
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github", "discord"],
    },
  },
  rateLimit: {
    enabled: true,
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    admin({
      //todo add admin user ids
      adminUserIds: [""],
    }),
    openAPI(),
  ],
});
