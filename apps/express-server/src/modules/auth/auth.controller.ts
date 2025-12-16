import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  saveRefreshToken,
  generateTokens,
  refreshTokens,
  verifyEmail,
} from "./auth.service.js";
import ApiError from "../../utils/errors.js";
import { AuthErrorMessages } from "./auth.message.js";
import passport from "passport";
import logger from "../../utils/logger.js";
import { Role, User } from "@smurfelite/types";

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      throw new ApiError(AuthErrorMessages.INVALID_REGISTRATION_DATA, 400);
    }

    const newUser = await registerUser({
      email,
      isVerified: false,
      password,
      name,
      role: role || "USER",
    });

    res.status(201).json({
      message:
        "Registration successful. Please verify your email before logging in.",
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(AuthErrorMessages.INVALID_CREDENTIALS, 401);
    }

    const user = await loginUser(email, password);
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Set refresh token in an HTTP-only cookie for security
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // Prevents client-side JS access
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matching refresh token expiry)
    });

    // Save refresh token in the database
    await saveRefreshToken(user.id, refreshToken);

    // Send the token back to the client
    res.status(200).json({
      message: "Login successful.",
      accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
}

export const googleAuthController = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // passport.authenticate will manage the redirect to Google
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false, // We use JWT, not session cookies
  })(req, res, next);
};

async function sendAuthTokens(res: Response, user: User) {
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  // 1. Save Refresh Token to DB
  await saveRefreshToken(user.id, refreshToken);

  // 2. Set refresh token in an HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // 3. Return user info and access token in JSON body
  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken: accessToken,
    message: "Authentication successful.",
  });
}

export const googleAuthCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "google",
    {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`, // Redirect to frontend login on failure
    },
    async (err: any, user: User | undefined, info: any) => {
      if (err || !user) {
        logger.error("Google callback authentication failed:", err || info);
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
        );
      }

      try {
        // Success: User object is now available, generate and send tokens
        await sendAuthTokens(res, user);
      } catch (tokenError) {
        logger.error(
          "Failed to generate tokens after Google auth:",
          tokenError
        );
        return res
          .status(500)
          .json({ message: "Internal server error during token generation." });
      }
    }
  )(req, res, next);
};

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Get refresh token from HTTP-only cookie
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing." });
  }

  try {
    const result = await refreshTokens(refreshToken);

    // Set the NEW refresh token in an HTTP-only cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      accessToken: result.accessToken,
      message: "Tokens refreshed successfully.",
    });
  } catch (error: any) {
    // Log the error but send a generic unauthorized message to the client
    logger.warn("Refresh token attempt failed:", error.message);
    res.clearCookie("refreshToken"); // Clear bad token
    return res.status(401).json({
      message: AuthErrorMessages.INVALID_OR_EXPIRED_REFRESH_TOKEN,
    });
  }
}

export async function verifyEmailController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { token } = req.query;

  if (typeof token !== "string" || !token) {
    return res
      .status(400)
      .json({ message: "Missing or invalid verification token." });
  }

  try {
    const user = await verifyEmail(token);

    if (user.role === Role.ADMIN) {
      return res.redirect(process.env.ADMIN_PANEL_URL as string);
    }

    return res.redirect(process.env.USER_PANEL_URL as string);
  } catch (error: any) {
    // Check for specific token errors
    if (
      error.message.includes("Invalid") ||
      error.message.includes("expired")
    ) {
      return res.status(401).json({ message: error.message });
    }

    next(error);
  }
}
