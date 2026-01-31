import { useAppDispatch, useAppSelector } from "@/hooks"
import { useState } from "react"
import { useLoginMutation, useRegisterMutation } from "@/api/auth"
import { setIsLoginModalOpen } from "@/store"
import { LoginRequest, RegisterRequest } from "@smurfelite/types"
import { toast } from "react-toastify"
export const LoginRegister = () => {
    const dispatch = useAppDispatch()
    const { isLoginModalOpen } = useAppSelector(state => state.auth)
    const [register, { isLoading: isRegisterLoading }] = useRegisterMutation()
    const [login, { isLoading: isLoginLoading }] = useLoginMutation()

    const [formState, setformState] = useState({
        registerUsername: "",
        registerEmail: "",
        registerPassword: "",
        loginEmail: "",
        loginPassword: ""
    })

    const handleInpputChange = (key: keyof typeof formState, value: (typeof formState)[keyof typeof formState]) => {
        setformState(prev => ({ ...prev, [key]: value }))
    }


    const onSubmitSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const payload: RegisterRequest = {
            name: formState.registerUsername,
            email: formState.registerEmail,
            password: formState.registerPassword,
        }
        const res = await register(payload)
        if (res.error) {
            toast("Failed to register")
        } else {
            toast(res.data.data.message)
        }
    }
    const onSubmitLogin = async (e: React.FormEvent<HTMLFormElement>) => {

        e.preventDefault();
        const payload: LoginRequest = {
            email: formState.loginEmail,
            password: formState.loginPassword,
        }
        const res = await login(payload)
        if (res.error) {
            toast("Failed to login")
        } else {
            toast("Login successful")
        }
    }
    return (<>
        <div className="login_overlay"
            style={{ display: isLoginModalOpen ? "block" : "none" }}
            onClick={e => dispatch(setIsLoginModalOpen(false))}></div>
        <div className="login_container" style={{ height: isLoginModalOpen ? "500px" : "0px" }} >
            <input type="checkbox" id="chk" aria-hidden="true" />

            <div className="signup">
                <form onSubmit={e => onSubmitSignUp(e)}>
                    <label htmlFor="chk" aria-hidden="true">Sign up</label>
                    <input type="text" onChange={e => handleInpputChange("registerUsername", e.target.value)} value={formState.registerUsername} name="username" placeholder="User name" required />
                    <input type="email" onChange={e => handleInpputChange("registerEmail", e.target.value)} value={formState.registerEmail} name="email" placeholder="Email" required />
                    <input type="password" onChange={e => handleInpputChange("registerPassword", e.target.value)} value={formState.registerPassword} name="password" placeholder="Password" required />
                    <button disabled={isRegisterLoading} type='submit'>
                        {isRegisterLoading ? <section className='loading'></section>
                            : "Sign up"
                        }
                    </button>
                </form>
            </div>

            <div className="login">
                <form onSubmit={e => onSubmitLogin(e)}>
                    <label htmlFor="chk" aria-hidden="true">Login</label>
                    <input type="email" onChange={e => handleInpputChange("loginEmail", e.target.value)} value={formState.loginEmail} placeholder="Email" required />
                    <input type="password" onChange={e => handleInpputChange("loginPassword", e.target.value)} value={formState.loginPassword} placeholder="Password" required />
                    <button disabled={isLoginLoading} type='submit'>
                        {isLoginLoading ? <section className='loading'></section>
                            : "Login"
                        }
                    </button>
                    {/* <button className='external_login'  ><GoogleOAuth isProcessing={isProcessing} setIsProcessing={setIsProcessing} /></button> */}
                </form>
            </div>
        </div>

    </>
    )
}