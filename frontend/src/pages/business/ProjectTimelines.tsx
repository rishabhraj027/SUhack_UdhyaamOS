import { useState, useEffect, useMemo } from "react";
import { useBountyStore } from "../../store/useBountyStore";
import { Timeline } from "../../components/ui/timeline";
import { getCategoryColor } from "../junior-pro/BiddingModal";
import { formatTimeRemaining, fetchUsersByIds } from "../../services/api";
import type { User } from "../../services/api";
import {
    ArrowLeft,
    Briefcase,
    CheckCircle2,
    Clock,
    TrendingUp,
} from "lucide-react";

export default function ProjectTimelines() {
    const { bounties, loadBounties } = useBountyStore();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [studentProfiles, setStudentProfiles] = useState<Record<string, User>>({});

    useEffect(() => {
        loadBounties();
    }, [loadBounties]);

    // Fetch student profiles for claimed bounties
    useEffect(() => {
        const studentIds = Array.from(new Set(
            bounties.filter(b => b.claimed_by).map(b => b.claimed_by!)
        ));
        if (studentIds.length === 0) return;
        fetchUsersByIds(studentIds)
            .then((users) => {
                const map: Record<string, User> = {};
                users.forEach((user) => { map[user.id] = user; });
                setStudentProfiles(map);
            })
            .catch(() => {});
    }, [bounties]);

    // Awarded/in-progress projects
    const awardedProjects = useMemo(
        () => bounties.filter(b => b.status === "IN_PROGRESS" || b.status === "REVIEW" || b.status === "REVISION_REQUESTED" || b.status === "COMPLETED"),
        [bounties]
    );

    const selectedProject = awardedProjects.find(p => p.id === selectedProjectId);

    // Build timeline data for selected project
    const timelineData = useMemo(() => {
        if (!selectedProject) return [];
        const milestones = selectedProject.milestones || [];
        return milestones.map((ms) => ({
            title: ms.status === "COMPLETED"
                ? (ms.completedAt ? new Date(ms.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Done")
                : ms.status === "IN_PROGRESS" ? "Now" : "Upcoming",
            content: (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5 space-y-3">
                    <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            ms.status === "COMPLETED" ? "bg-emerald-100 text-emerald-600" :
                            ms.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-600" :
                            "bg-slate-100 text-slate-400"
                        }`}>
                            {ms.status === "COMPLETED" ? "✓" : ms.status === "IN_PROGRESS" ? "◉" : "○"}
                        </span>
                        <div className="flex-1">
                            <h4 className={`text-base font-bold ${ms.status === "COMPLETED" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                                {ms.title}
                            </h4>
                            {ms.description && (
                                <p className="text-sm text-slate-500 mt-0.5">{ms.description}</p>
                            )}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 ${
                            ms.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                            ms.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-500"
                        }`}>
                            {ms.status.replace(/_/g, ' ')}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Created {new Date(ms.createdAt).toLocaleDateString()}</span>
                        {ms.completedAt && <span>Completed {new Date(ms.completedAt).toLocaleDateString()}</span>}
                    </div>
                </div>
            ),
        }));
    }, [selectedProject]);

    // ===== PROJECT DETAIL VIEW =====
    if (selectedProject) {
        const milestones = selectedProject.milestones || [];
        const completedCount = milestones.filter(m => m.status === "COMPLETED").length;
        const totalCount = milestones.length;
        const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const bgColor = getCategoryColor(selectedProject.category ?? "Miscellaneous");
        const assignee = selectedProject.claimed_by ? studentProfiles[selectedProject.claimed_by] : null;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-8">
                {/* Back Button */}
                <button
                    onClick={() => setSelectedProjectId(null)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to all projects
                </button>

                {/* Project Header */}
                <div
                    className="rounded-[24px] p-6 md:p-8 text-black"
                    style={{ backgroundColor: bgColor }}
                >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/10">
                                    <span className="w-2 h-2 rounded-full bg-black" />
                                    {selectedProject.status.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-black/50">{selectedProject.category}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                                {selectedProject.title}
                            </h1>
                            <p className="text-sm font-medium text-black/60 mt-2 max-w-2xl leading-relaxed">
                                {selectedProject.description}
                            </p>
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                            {assignee && (
                                <div className="flex items-center gap-2">
                                    <img
                                        src={assignee.avatarUrl}
                                        alt={assignee.name}
                                        className="w-8 h-8 rounded-full border-2 border-black/10 object-cover"
                                    />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Assigned to</p>
                                        <p className="text-sm font-bold">{assignee.name}</p>
                                    </div>
                                </div>
                            )}
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Budget</p>
                                <p className="text-2xl font-black tracking-tight">₹{selectedProject.price.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    {totalCount > 0 && (
                        <div className="mt-6 pt-5 border-t border-black/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-widest text-black/50">Overall Progress</span>
                                <span className="text-sm font-black">{progressPct}% • {completedCount}/{totalCount} milestones</span>
                            </div>
                            <div className="w-full h-3 bg-black/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700 bg-black/70"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Timeline */}
                {timelineData.length > 0 ? (
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                        <div className="px-6 pt-6 pb-0">
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                Milestone Timeline
                            </h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">
                                Scroll through the project milestones
                            </p>
                        </div>
                        <Timeline data={timelineData} theme="light" />
                    </div>
                ) : (
                    <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-[24px] bg-white">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Milestones Yet</h3>
                        <p className="text-slate-500 mt-1 text-sm font-medium">The Junior Pro hasn't added any milestones to this project yet.</p>
                    </div>
                )}
            </div>
        );
    }

    // ===== PROJECTS LIST VIEW =====
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-foreground mb-5">Project Timelines</h1>
                <p className="text-slate-500 text-sm font-medium">
                    Track milestone progress across all your awarded projects
                </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Active", count: awardedProjects.filter(p => p.status === "IN_PROGRESS").length, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "In Review", count: awardedProjects.filter(p => p.status === "REVIEW" || p.status === "REVISION_REQUESTED").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Completed", count: awardedProjects.filter(p => p.status === "COMPLETED").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Total", count: awardedProjects.length, icon: TrendingUp, color: "text-slate-600", bg: "bg-slate-100" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-card rounded-[20px] p-4 border border-slate-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-full ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                        </div>
                        <p className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.count}</p>
                    </div>
                ))}
            </div>

            {/* Project Cards Grid */}
            {awardedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {awardedProjects.map((project) => {
                        const milestones = project.milestones || [];
                        const completedCount = milestones.filter(m => m.status === "COMPLETED").length;
                        const totalCount = milestones.length;
                        const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                        const bgColor = getCategoryColor(project.category ?? "Miscellaneous");

                        return (
                            <div
                                key={project.id}
                                className="bg-card rounded-[20px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col h-full"
                            >
                                <div className="p-5 md:p-6 flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                            project.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                            project.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                            "bg-amber-50 text-amber-700 border-amber-200"
                                        }`}>
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bgColor }} />
                                            {project.status.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{project.category}</span>
                                    </div>

                                    <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-900 mb-2 line-clamp-2">
                                        {project.title}
                                    </h3>

                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed flex-grow">
                                        {project.description}
                                    </p>

                                    {/* Progress */}
                                    <div className="mt-auto space-y-2">
                                        {totalCount > 0 ? (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress</span>
                                                    <span className="text-xs font-bold text-slate-600">{completedCount}/{totalCount} milestones</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-purple-500"
                                                        style={{ width: `${progressPct}%` }}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No milestones yet</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col mt-auto">
                                        <div className="flex items-center justify-between text-sm font-bold border-t border-slate-100 pt-4 mt-4">
                                            <div className="flex items-center text-slate-400">
                                                <Clock className="w-3.5 h-3.5 mr-1" />
                                                <span className="text-xs">{formatTimeRemaining(project.deadline)}</span>
                                            </div>
                                            <span className="text-xl font-black tracking-tight text-slate-900">₹{project.price.toLocaleString()}</span>
                                        </div>

                                        <button
                                            onClick={() => setSelectedProjectId(project.id)}
                                            className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
                                            style={{ backgroundColor: "#111111", color: '#ffffff' }}
                                        >
                                            View Timeline
                                            <TrendingUp className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-[24px] bg-white">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Briefcase className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Awarded Projects</h3>
                    <p className="text-slate-500 mt-2 font-medium max-w-md mx-auto">
                        Once you award a bounty to a Junior Pro, their project timeline will appear here.
                    </p>
                </div>
            )}
        </div>
    );
}
