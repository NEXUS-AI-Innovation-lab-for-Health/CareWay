import { createBrowserRouter } from "react-router";
import Home from "./pages/home";
import Login from "./pages/login";
import AuthProvider from "./features/auth/context/AuthProvider";
import Infermiers from "./pages/infermiers";
import Dash from "./pages/dash";


const router = createBrowserRouter([
    {
        path: "/",
        element: <AuthProvider>
            <Home />
        </AuthProvider>
    },
    {
        path: "/dash",
        element: <AuthProvider><Dash /></AuthProvider>
    },
    {
        path: "/infermier",
        element: <AuthProvider>
            <Infermiers />
        </AuthProvider>
    },
    {
        path: "/login",
        element: <AuthProvider>
            <Login />
        </AuthProvider>
    }
])

export default router