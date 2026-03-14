import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedRouteProps {
    allowedRole?: "Business" | "JuniorPro";
}

export default function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
    const { user } = useAuthStore();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
        // If user's role does not match, redirect them to their respective dashboard
        return <Navigate to={user.role === 'Business' ? '/business' : '/junior-pro'} replace />;
    }

    return <Outlet />;
}
