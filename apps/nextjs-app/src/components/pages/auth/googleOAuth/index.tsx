import { useGoogleOAuthMutation } from "@/api/auth";
import { useAppDispatch } from "@/hooks";
import { setIsLoginModalOpen } from "@/store";
import { CredentialResponse, GoogleLogin, useGoogleOneTapLogin } from "@react-oauth/google";
import { toast } from "react-toastify";

export const GoogleOAuth: React.FC<{ setIsProcessing: (val: boolean) => void }> = ({ }) => {
    const dispatch = useAppDispatch();
    const [googleOAuth] = useGoogleOAuthMutation();

    const onSuccess = async (credentialResponse: CredentialResponse) => {
        const response = await googleOAuth({
            credential: credentialResponse.credential
        });
        if (!response.error) {
            dispatch(setIsLoginModalOpen(false))
        }
    };

    const onError = () => {
        toast("Login Failed.")
    };

    const login = useGoogleOneTapLogin({
        onSuccess,
        onError
    })

    return <GoogleLogin onSuccess={onSuccess} onError={onError} />;
};