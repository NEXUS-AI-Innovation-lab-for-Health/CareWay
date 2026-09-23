import { createContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";

type AuthProps = {
    login: string | null,
      setLogin: (login: string | null) => void
}

export const authContext = createContext<AuthProps | null>(null)

export default ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate()
    const [login, setLogin] = useState<null | string>(null)


    useEffect(() => {
        const loginStr = localStorage.getItem("login")
        console.log('login', loginStr);

        if (loginStr) {
            setLogin(loginStr)
        }
        else navigate("/login")
    }, [])

    useEffect(() => {
        if (login === null) {
            navigate("/login", { replace: true })
        }
    }, [login])

    return <authContext.Provider value={{ login: login, setLogin }}>
        {children}
    </authContext.Provider>
}