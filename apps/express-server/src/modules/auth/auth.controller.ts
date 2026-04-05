import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  saveRefreshToken,
  generateTokens,
  refreshTokens,
  verifyEmail,
  verifyGoogleOAuth,
  logoutUser,
  forgotPassword,
  resetPassword,
} from "./auth.service.js";
import ApiError from "../../utils/errors.js";
import { AuthErrorMessages } from "./auth.message.js";
import passport from "passport";
import logger from "../../utils/logger.js";
import { Role, User } from "@smurfelite/types";

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction,
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
      googleProfilePicture: "",
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
  next: NextFunction,
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
      googleProfilePicture: user.googleProfilePicture,
    },
    accessToken: accessToken,
    message: "Authentication successful.",
  });
}

export const googleAuthController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await verifyGoogleOAuth(req.body.credential);
    return sendAuthTokens(res, user);
  } catch (error) {
    next(error);
  }
};

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction,
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

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    await logoutUser(refreshToken);
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    next(error);
  }
}

export async function forgotPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    const message = await forgotPassword(email);
    return res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required." });
    }
    await resetPassword(token, newPassword);
    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmailController(
  req: Request,
  res: Response,
  next: NextFunction,
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
