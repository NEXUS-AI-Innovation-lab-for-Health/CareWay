import { useContext} from "react"
import { authContext } from "../context/AuthProvider"

export default ()=>{
    const context = useContext(authContext)    
    if(!context) throw new Error("useAuth must be inside an AuthProvider !")
    return context
}