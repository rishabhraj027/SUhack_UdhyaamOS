import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function RootLayout() {
    const { user } = useAuthStore();

    if (!user) return <Navigate to="/login" replace />;

    return (
        <div className="flex flex-col min-h-screen bg-transparent relative">
            <main className="flex-1 flex overflow-hidden relative z-10">
                <Outlet />
            </main>
        </div>
    );
}
