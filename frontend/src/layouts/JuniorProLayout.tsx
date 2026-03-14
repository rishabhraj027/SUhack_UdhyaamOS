import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { Briefcase, ListTodo, UserRound, LogOut, Hexagon, MessageSquare } from "lucide-react";
import { Sidebar, SidebarBody, SidebarButton, SidebarLink } from "@/components/ui/sidebar";
import { motion } from "framer-motion";

export default function JuniorProLayout() {
    const { logout, user } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const { conversations } = useChatStore();

    // Count conversations where this junior pro is a participant (unread badge)
    const currentUserId = user?.id || "";
    const myConversationsCount = conversations.filter(c => c.juniorProId === currentUserId).length;

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navItems = [
        { name: "MISSION BOARD", path: "/junior-pro", icon: Briefcase },
        { name: "ACTIVE TASKS", path: "/junior-pro/tasks", icon: ListTodo },
        { name: "COMMS", path: "/junior-pro/messages", icon: MessageSquare },
        { name: "DIGITAL VAULT", path: "/junior-pro/vault", icon: Hexagon },
        { name: "PROFILE", path: "/junior-pro/profile", icon: UserRound },
    ];

    return (
        <div className="theme-junior min-h-screen bg-black text-white flex flex-col md:flex-row w-full overflow-hidden selection:bg-[#804CE4]/30 selection:text-[#804CE4] transition-colors duration-300">
            {/* The Coucher Sidebar: transparent on pure black background */}
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-6 bg-black z-20">
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pt-2">
                        {open ? <Logo /> : <LogoIcon />}

                        <div className="mt-8 flex flex-col gap-3">
                            {navItems.map((item, idx) => {
                                const isActive = location.pathname === item.path || (item.path !== '/junior-pro' && location.pathname.startsWith(item.path));
                                const isComms = item.path === "/junior-pro/messages";
                                const showBadge = isComms && myConversationsCount > 0 && !isActive;
                                return (
                                    <SidebarLink
                                        key={idx}
                                        link={{
                                            label: item.name,
                                            href: item.path,
                                            icon: (
                                                <div className="relative h-5 w-5 flex-shrink-0">
                                                    <item.icon className="h-5 w-5" />
                                                    {showBadge && (
                                                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#804CE4] rounded-full border border-black flex items-center justify-center">
                                                            <span className="text-[8px] font-black text-white leading-none">{myConversationsCount}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        }}
                                        className={`py-3 rounded-[32px] font-bold tracking-widest transition-all duration-300 ${isActive
                                            ? "bg-white text-black"
                                            : "bg-transparent text-white/70 hover:text-white hover:bg-white/5"
                                            }`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="flex flex-col border-t border-white/10 pt-4 mb-2">
                        <SidebarButton
                            onClick={handleLogout}
                            link={{
                                label: "SIGN OUT",
                                href: "#",
                                icon: <LogOut className="h-5 w-5 flex-shrink-0" />
                            }}
                            className="justify-start rounded-[32px] text-white/70 hover:text-white hover:bg-red-600 transition-all font-medium text-sm py-3"
                        />
                    </div>
                </SidebarBody>
            </Sidebar>

            {/* Seamless Main Content Area */}
            <main className="flex-1 flex flex-col w-full h-screen overflow-hidden relative z-10 bg-black">
                <div className="flex-1 w-full overflow-y-auto pb-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

const Logo = () => {
    return (
        <Link
            to="/junior-pro"
            className="flex items-center space-x-2 px-4 py-2 border-b border-white/10 pb-6 mb-2 h-16"
        >
            <div className="flex items-center justify-center shrink-0">
                <Hexagon className="w-8 h-8 text-[#804CE4] fill-[#804CE4]/20 stroke-[2]" />
            </div>
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold tracking-tight text-white whitespace-pre flex items-center"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
                Udhyaam<span className="text-[#804CE4] ml-1">Pro</span>
            </motion.span>
        </Link>
    );
};

const LogoIcon = () => {
    return (
        <Link
            to="/junior-pro"
            className="flex items-center justify-center py-2 border-b border-white/10 pb-6 mb-2 h-16"
        >
            <div className="flex items-center justify-center shrink-0">
                <Hexagon className="w-8 h-8 text-[#804CE4] fill-[#804CE4]/20 stroke-[2]" />
            </div>
        </Link>
    );
};
