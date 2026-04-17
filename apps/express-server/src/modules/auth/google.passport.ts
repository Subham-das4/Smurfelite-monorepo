import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as PrismaNamespace from "../../types/prisma.js";
import prisma from "../../lib/prisma.js";
import logger from "../../utils/logger.js";

// NOTE: Passport often requires session management, but since we are generating JWTs,
// we often bypass Passport's serialization for API usage.

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0].value;
        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";

        if (!email) {
          return done(new Error("Google profile missing email."), undefined);
        }

        // 1. Find or Create the user (UPSERT logic)
        let user = await prisma.user.findUnique({ where: { googleId } });

        if (!user) {
          // Check for existing user by email (local account linking)
          user = await prisma.user.findUnique({ where: { email } });

          if (user) {
            // User exists via local login, link the Google ID
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: googleId },
            });
            logger.info(
              `Linked Google account for existing user: ${user.email}`
            );
          } else {
            // New user, create the account
            user = await prisma.user.create({
              data: {
                googleId: googleId,
                email: email,
                name: `${firstName} ${lastName}`.trim(),
                isVerified: true, // Auto-verify email from Google
                role: PrismaNamespace.Role.BUYER,
                password: "", // No password for OAuth users
              },
            });
            logger.info(`New user created via Google OAuth: ${user.email}`);
          }
        }

        // Pass the user object to the controller via Express flow
        return done(null, user);
      } catch (error) {
        logger.error("Error during Google OAuth:", error);
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
