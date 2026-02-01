import { Role, User } from './src/generated/prisma/index';

export * from './src/generated/prisma/index';

export interface EnquiryPayload {
    name: string;
    email: string;
    phone: string;
    message: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}

export interface BaseResponse {
    success: boolean;

}

export interface LoginResponse {
    user: Omit<User, "password">;
    accessToken: string;
    refreshToken: string;
    message: string;
}

export interface ForgotPasswordRequest {
    email: string;

}

export interface ValidateOtpRequest {
    email: string;
    otp: number;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface RegisterResponse extends BaseResponse {
    data: {
        message: string;
    }
}

export interface GoogleOAuthResponse {
    iss: string;
    azp: string;
    aud: string;
    sub: string;
    email: string;
    email_verified: boolean;
    nbf: number;
    name: string;
    picture: string;
}
