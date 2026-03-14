import { NavLink, Outlet } from "react-router-dom";
import { Package, Briefcase, Users, LayoutDashboard, LogOut, LineChart, Bell } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function MSMELayout() {
    const { user, logout } = useAuthStore();
    const links = [
        { to: ".", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
        { to: "trade", label: "Inventory", icon: <Package className="w-5 h-5" /> },
        { to: "talent", label: "TalentBridge", icon: <Briefcase className="w-5 h-5" /> },
        { to: "sales", label: "Analytics", icon: <LineChart className="w-5 h-5" /> },
        { to: "network", label: "Network", icon: <Users className="w-5 h-5" /> },
    ];

    return (
        <div className="flex w-full min-h-[100dvh] bg-[#F3F4F6] font-sans text-slate-800 overflow-hidden">

            {/* Sidebar (Clean White) */}
            <aside className="w-72 flex-shrink-0 bg-white flex flex-col border-r border-slate-200 z-10 relative">
                <div className="p-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-900">Udhyaam</span>
                </div>

                <div className="px-6 pb-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 px-2">Menu</div>
                    <nav className="flex flex-col gap-1">
                        {links.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.to === "."}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`
                                }
                            >
                                {link.icon}
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-slate-100">
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="font-bold text-sm text-slate-900 truncate">{user?.name}</div>
                            <div className="text-xs text-slate-500 truncate">MSME Founder</div>
                        </div>
                        <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-xl">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-[100dvh]">
                {/* Top Header */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 flex-shrink-0 z-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Enterprise Overview</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
