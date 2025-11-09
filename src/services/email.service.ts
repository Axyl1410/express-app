import ResetPasswordEmail from "@/components/email/reset-password";
import VerificationEmail from "@/components/email/verification-email";
import logger from "@/lib/logger";
import { resend } from "@/lib/resend";

export type EmailUser = {
  name: string;
  email: string;
};

/**
 * Send reset password email
 * @param user - User information
 * @param resetUrl - Reset password URL
 * @throws Error if email sending fails
 */
export async function sendResetPasswordEmail(
  user: EmailUser,
  resetUrl: string
): Promise<void> {
  const link = new URL(resetUrl);
  link.searchParams.set("callbackURL", "/new-password");

  try {
    await resend.emails.send({
      to: [user.email],
      from: "Axyl Team <onboarding@resend.dev>",
      subject: "Reset your password",
      react: ResetPasswordEmail({
        userFirstname: user.name,
        resetPasswordLink: link.toString(),
      }),
    });
    logger.info(
      { email: user.email },
      "Reset password email sent successfully"
    );
  } catch (error) {
    logger.error(
      { error, email: user.email },
      "Failed to send reset password email"
    );
    throw new Error("Failed to send reset password email");
  }
}

/**
 * Send email verification email
 * @param user - User information
 * @param verificationUrl - Email verification URL
 * @throws Error if email sending fails
 */
export async function sendVerificationEmail(
  user: EmailUser,
  verificationUrl: string
): Promise<void> {
  const link = new URL(verificationUrl);
  link.searchParams.set("callbackURL", "/welcome");

  try {
    await resend.emails.send({
      to: [user.email],
      from: "Axyl Team <onboarding@resend.dev>",
      subject: "Verify your email",
      react: VerificationEmail({
        userFirstname: user.name,
        verificationLink: link.toString(),
      }),
    });
    logger.info({ email: user.email }, "Verification email sent successfully");
  } catch (error) {
    logger.error(
      { error, email: user.email },
      "Failed to send verification email"
    );
    throw new Error("Failed to send verification email");
  }
}

/**
 * Email Service - Object with helper methods
 * @deprecated Use individual functions instead of this object
 */
export const EmailService = {
  sendResetPasswordEmail,
  sendVerificationEmail,
} as const;
