export const AuthErrorMessages = {
  INVALID_CREDENTIALS: "Invalid email or password.",
  USER_NOT_FOUND: "User not found.",
  UNAUTHORIZED: "Unauthorized access.",
  FORBIDDEN: "Forbidden: You do not have permission to access this resource.",
  USER_ALREADY_EXISTS: "User with this email already exists.",
  INVALID_REGISTRATION_DATA: "Email, password, and username are required.",
  INVALID_OR_EXPIRED_REFRESH_TOKEN: "Invalid or expired refresh token.",
  EMAIL_NOT_VERIFIED:
    "Email not verified. Please verify your email before logging in.",
  INVALID_VERIFICATION_TOKEN: "Invalid verification token.",
  INVALID_GOOGLE_PROFILE: "Google profile missing email.",
  INVALID_PORTAL_CONTEXT: "Invalid login context for this account.",
  WRONG_BUYER_PORTAL: "This account cannot sign in on the buyer site.",
  WRONG_SELLER_PORTAL: "This account cannot sign in on the seller portal.",
  WRONG_ADMIN_PORTAL: "This account cannot sign in on the admin panel.",
  ADMIN_EMAIL_RESERVED:
    "This email is reserved for admin accounts and cannot be used for registration.",
  ALREADY_APPROVED_SELLER:
    "This email is already registered as an approved seller.",
  INVALID_PASSWORD_RESET_TOKEN: "Invalid or expired password reset token.",
};

export const PASSWORD_RESET_GENERIC_MESSAGE =
  "If that email is registered, a reset link has been sent.";
