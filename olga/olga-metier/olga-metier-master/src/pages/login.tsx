import { Button, Input } from "@heroui/react"
import Navbar from "../components/Navbar"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import useAuth from "../features/auth/hooks/useAuth"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export default () => {
    const navigate = useNavigate()
    const auth = useAuth()
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        if (auth.login) navigate("/dash")
    }, [auth])

    const handleLogin = async () => {
        setError("")
        // Vérifie si l'email appartient à un groupe autorisé
        try {
            const res = await fetch(`${BACKEND_URL}/getAllInventoriesForUser?email=${encodeURIComponent(email)}`)
            const data = await res.json()
            if (res.ok && data && data.length > 0) {
                localStorage.setItem("login", email)
                navigate("/dash")
            } else {
                setError("Email non reconnu ou non autorisé.")
            }
        } catch {
            setError("Erreur de connexion au serveur.")
        }
    }

    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <div className="flex-1 w-full flex items-center justify-center">
                <div className="w-120 flex gap-2 flex-col">
                    <p className="text-2xl semiexpanded font-bold">Se connecter</p>
                    <p className="text-xs semiexpanded font-light pb-6">
                        Entrez votre email pour vous connecter.
                    </p>
                    <Input
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        type="email"
                    />
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                    <Button
                        onPress={handleLogin}
                        color="primary"
                        className="semiexpanded"
                        radius="full"
                    >
                        Se connecter
                    </Button>
                </div>
            </div>
        </div>
    )
}