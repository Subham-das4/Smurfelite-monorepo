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

export interface LoginResponse extends BaseResponse {
    data: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
    }
}

export interface ForgotPasswordRequest {
    email: string;

}

export interface ValidateOtpRequest {
    email: string;
    otp: number;
}