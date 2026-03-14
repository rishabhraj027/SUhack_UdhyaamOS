import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import type { User } from "../services/api";

const mapBackendRoleToUiRole = (role?: string): "Business" | "JuniorPro" => {
  if (role === 'MSME' || role === 'Business') return 'Business';
  return 'JuniorPro';
};

export default function LoginSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");

    if (!token || !userParam) {
      navigate("/login?error=missing_auth", { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(userParam));
      const uiUser: User = {
        id: parsed.id,
        email: parsed.email,
        name: parsed.name,
        role: mapBackendRoleToUiRole(parsed.role),
        walletBalance: 0,
        avatarUrl: parsed.avatar,
        score: parsed.score,
        bio: parsed.bio,
        skills: parsed.skills,
        bannerColor: parsed.bannerColor,
        cin: parsed.cin,
        gstin: parsed.gstin,
        yearEstablished: parsed.yearEstablished,
        industry: parsed.industry,
        website: parsed.website,
        officialEmail: parsed.officialEmail,
        contactPhone: parsed.contactPhone,
        address: parsed.address,
        companyDescription: parsed.companyDescription,
      };
      setAuth(uiUser, token);
      navigate(uiUser.role === "Business" ? "/business" : "/junior-pro", { replace: true });
    } catch {
      navigate("/login?error=bad_auth_payload", { replace: true });
    }
  }, [navigate, searchParams, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Signing you in…</div>
    </div>
  );
}