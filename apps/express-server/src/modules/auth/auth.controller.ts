import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  applyAsSeller,
  loginUser,
  loginBuyerPortal,
  loginSellerPortal,
  loginAdminPortal,
  saveRefreshToken,
  generateTokens,
  refreshTokens,
  verifyEmail,
  verifyGoogleOAuthForPortal,
  logoutUser,
  forgotPasswordBuyer,
  resetPasswordBuyer,
  forgotPasswordAdmin,
  resetPasswordAdmin,
} from "./auth.service.js";
import ApiError from "../../utils/errors.js";
import { AuthErrorMessages } from "./auth.message.js";
import logger from "../../utils/logger.js";
import { Role, User } from "../../types/prisma.js";

function setLegacyAuthDeprecation(res: Response, successorPath: string) {
  res.setHeader("Deprecation", "true");
  res.setHeader("Link", `<${successorPath}>; rel="successor-version"`);
}

async function issuePortalLogin(
  res: Response,
  user: Omit<User, "password">,
  actingAs?: Role
) {
  const { accessToken, refreshToken, actingAs: issuedActingAs } = generateTokens(
    user.id,
    user.role,
    actingAs
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await saveRefreshToken(user.id, refreshToken);

  return res.status(200).json({
    message: "Login successful.",
    accessToken,
    actingAs: issuedActingAs,
    user,
  });
}

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new ApiError(AuthErrorMessages.INVALID_REGISTRATION_DATA, 400);
    }

    const newUser = await registerUser({
      email,
      isVerified: false,
      password,
      name,
      role: Role.BUYER,
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

export async function sellerApplyController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password, name } = req.body;
    const { user, created } = await applyAsSeller({ email, password, name });
    res.status(created ? 201 : 200).json({
      message: created
        ? "Seller application submitted. Please verify your email if prompted."
        : "Seller application is already pending review.",
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function buyerLoginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(AuthErrorMessages.INVALID_CREDENTIALS, 401);
    }
    const user = await loginBuyerPortal(email, password);
    return issuePortalLogin(res, user, Role.BUYER);
  } catch (error) {
    next(error);
  }
}

export async function sellerLoginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(AuthErrorMessages.INVALID_CREDENTIALS, 401);
    }
    const user = await loginSellerPortal(email, password);
    return issuePortalLogin(res, user, Role.SELLER);
  } catch (error) {
    next(error);
  }
}

export async function adminLoginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(AuthErrorMessages.INVALID_CREDENTIALS, 401);
    }
    const user = await loginAdminPortal(email, password);
    return issuePortalLogin(res, user);
  } catch (error) {
    next(error);
  }
}

/** @deprecated Use portal-specific login endpoints */
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
    setLegacyAuthDeprecation(res, "/api/auth/buyer/login");
    return issuePortalLogin(res, user);
  } catch (error) {
    next(error);
  }
}

async function sendGoogleAuthTokens(
  res: Response,
  user: User,
  actingAs: typeof Role.BUYER | typeof Role.SELLER
) {
  const { accessToken, refreshToken, actingAs: issuedActingAs } = generateTokens(
    user.id,
    user.role,
    actingAs
  );

  await saveRefreshToken(user.id, refreshToken);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      googleProfilePicture: user.googleProfilePicture,
    },
    accessToken,
    actingAs: issuedActingAs,
    message: "Authentication successful.",
  });
}

export const buyerGoogleAuthController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await verifyGoogleOAuthForPortal(req.body.credential, "buyer");
    return sendGoogleAuthTokens(res, user, Role.BUYER);
  } catch (error) {
    next(error);
  }
};

export const sellerGoogleAuthController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await verifyGoogleOAuthForPortal(req.body.credential, "seller");
    return sendGoogleAuthTokens(res, user, Role.SELLER);
  } catch (error) {
    next(error);
  }
};

/** @deprecated Use POST /auth/buyer/google */
export const googleAuthController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    setLegacyAuthDeprecation(res, "/api/auth/buyer/google");
    const user = await verifyGoogleOAuthForPortal(req.body.credential, "buyer");
    return sendGoogleAuthTokens(res, user, Role.BUYER);
  } catch (error) {
    next(error);
  }
};

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing." });
  }

  try {
    const actingAs =
      req.body?.actingAs === Role.BUYER || req.body?.actingAs === Role.SELLER
        ? req.body.actingAs
        : undefined;
    const result = await refreshTokens(refreshToken, { actingAs });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      accessToken: result.accessToken,
      actingAs: result.actingAs,
      message: "Tokens refreshed successfully.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.warn("Refresh token attempt failed:", message);
    res.clearCookie("refreshToken");
    return res.status(401).json({
      message: AuthErrorMessages.INVALID_OR_EXPIRED_REFRESH_TOKEN,
    });
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction
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

export async function buyerForgotPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    const message = await forgotPasswordBuyer(email);
    return res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
}

export async function buyerResetPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required." });
    }
    await resetPasswordBuyer(token, newPassword);
    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    next(error);
  }
}

export async function adminForgotPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    const message = await forgotPasswordAdmin(email);
    return res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
}

export async function adminResetPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required." });
    }
    await resetPasswordAdmin(token, newPassword);
    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    next(error);
  }
}

/** @deprecated Use POST /auth/buyer/forgot-password */
export async function forgotPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    setLegacyAuthDeprecation(res, "/api/auth/buyer/forgot-password");
    return buyerForgotPasswordController(req, res, next);
  } catch (error) {
    next(error);
  }
}

/** @deprecated Use POST /auth/buyer/reset-password */
export async function resetPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    setLegacyAuthDeprecation(res, "/api/auth/buyer/reset-password");
    return buyerResetPasswordController(req, res, next);
  } catch (error) {
    next(error);
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Invalid") || message.includes("expired")) {
      return res.status(401).json({ message });
    }

    next(error);
  }
}
