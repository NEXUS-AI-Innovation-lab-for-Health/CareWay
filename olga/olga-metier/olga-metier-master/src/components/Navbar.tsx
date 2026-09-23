import { Button } from "@heroui/react"
import { useMemo } from "react"
import { useNavigate } from "react-router"
import useAuth from "../features/auth/hooks/useAuth"

export default () => {
    const navigate = useNavigate()

    const {setLogin} = useAuth()

    const email = useMemo(() => {
        return localStorage.getItem("login")

    }, [])
    return <div className="flex flex justify-between bg-neutral-50 px-50 py-3 ">
        <h1 className="text-xl kings font-bold tracking-wider">DOCTOLIB</h1>
        <div className="flex  items-center">
            {email ? <Button onPress={async () => {
                localStorage.removeItem('login')
                setLogin(null)
                navigate("/login")
            }} size="sm" radius="full" className="font-semibold" color="warning">Deconnexion</Button> :
                <Button size="sm" radius="full" className="font-semibold" color="primary">Se connecter</Button>}
        </div>
    </div>
}