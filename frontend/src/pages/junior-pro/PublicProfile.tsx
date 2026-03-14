import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { BadgeCheck, BrainCircuit, Star, Zap, Pencil, TrendingUp, Clock, ArrowRight, CheckCircle2, Briefcase } from "lucide-react";
import { fetchCompanyProfile, updateUserProfile } from "../../services/api";
import type { CompanyProfile } from "../../services/api";
import { EditProfileModal } from "./EditProfileModal";
import { Button } from "../../components/ui/button";

const DEFAULT_SKILLS = ["React", "Node.js", "Figma", "TypeScript", "UI Design"];

export default function PublicProfile() {
    const { user, updateProfile } = useAuthStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [profileData, setProfileData] = useState<CompanyProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            setLoading(true);
            fetchCompanyProfile(user.id)
                .then(data => setProfileData(data))
                .catch(err => console.error('Failed to fetch profile:', err))
                .finally(() => setLoading(false));
        }
    }, [user?.id]);

    const handleSaveProfile = async (updates: any) => {
        if (!user) return;
        try {
            await updateUserProfile(user.id, updates);
            updateProfile(updates);
            // Refresh profile data
            const data = await fetchCompanyProfile(user.id);
            setProfileData(data);
        } catch (err) {
            console.error('Failed to save profile:', err);
        }
    };

    const stats = profileData?.stats;
    const score = stats?.reliabilityScore ?? 0;
    const bannerColor = user?.bannerColor || "#F87D3F";
    const skills = user?.skills || DEFAULT_SKILLS;

    return (
        <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-500 px-4 md:px-8 max-w-[1400px] mx-auto pb-20 pt-10">

            {/* PROFILE HEADER CARD */}
            <div className="bg-[#111111] border border-white/10 rounded-[28px] overflow-hidden">
                <div className="h-40 md:h-48 w-full" style={{ backgroundColor: bannerColor }} />
                <div className="relative px-7 md:px-10 pb-7 md:pb-9">
                    <div className="flex items-end justify-between">
                        <div
                            className="-mt-16 md:-mt-20 w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-[#111111] flex items-center justify-center shadow-xl z-10 overflow-hidden shrink-0"
                            style={{ backgroundColor: bannerColor + '40' }}
                        >
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl md:text-5xl font-bold text-white uppercase tracking-tight">
                                    {user?.name?.substring(0, 2)}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-5">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-none mb-1.5">{user?.name}</h1>
                        <p className="text-white/40 text-sm font-medium mb-1">
                            {user?.bio || "Frontend Specialist • React & Node.js Developer • UI/UX Enthusiast."}
                        </p>
                        {user?.portfolioUrl && (
                            <a
                                href={user.portfolioUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-[10px] font-bold text-[#E8D754] hover:text-white transition-colors mt-3 uppercase tracking-widest bg-[#E8D754]/10 hover:bg-[#E8D754]/20 px-3 py-1.5 rounded-full"
                            >
                                View Portfolio <ArrowRight className="w-3 h-3 ml-1.5" />
                            </a>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between mt-6 pt-5 border-t border-white/10 gap-4">
                        <Button
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-white hover:bg-white/90 text-black rounded-full font-bold px-6 h-10 text-xs tracking-wider transition-all shadow-none w-fit uppercase"
                        >
                            <Pencil className="w-3 h-3 mr-1.5" /> Edit Profile
                        </Button>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white/20 text-xs font-bold uppercase tracking-widest mr-1">Skills</span>
                            {skills.map((skill) => (
                                <span key={skill} className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-bold tracking-tight">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAIL CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                {/* Reliability Score */}
                <div className="lg:col-span-3 rounded-[28px] overflow-hidden hover:-translate-y-1 transition-all duration-500 border border-black/10">
                    <div className="p-7 md:p-8" style={{ backgroundColor: '#E8D754' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-black flex items-center justify-center rounded-xl">
                                    <BrainCircuit className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl md:text-3xl text-black tracking-tight leading-none">Reliability Score</h2>
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-black/30">Algorithmic</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-end gap-3 mb-1">
                            <span className="text-7xl md:text-8xl font-bold text-black tracking-tighter leading-none">
                                {loading ? '—' : score}
                            </span>
                            <span className="text-black/20 text-2xl font-bold mb-2">/100</span>
                        </div>
                    </div>
                    <div className="bg-white p-7 md:p-8 rounded-b-[28px]">
                        <div className="h-2.5 w-full bg-black/5 rounded-full overflow-hidden mb-3">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ width: `${score}%`, background: '#FFD166' }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-black/25 uppercase tracking-widest mb-6">
                            <span>At Risk</span>
                            <span>Neutral</span>
                            <span>Highly Reliable</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-[#F5F5F5] rounded-2xl p-4 text-center border border-black/5">
                                <TrendingUp className="w-3.5 h-3.5 text-black/20 mx-auto mb-2" />
                                <span className="text-black block text-xl font-bold tracking-tight leading-none mb-1">
                                    {loading ? '—' : `${stats?.deadlineAdherence ?? stats?.onTimePercent ?? 0}%`}
                                </span>
                                <span className="text-black/30 text-[8px] font-bold uppercase tracking-[0.1em]">On-Time</span>
                            </div>
                            <div className="bg-[#F5F5F5] rounded-2xl p-4 text-center border border-black/5">
                                <Clock className="w-3.5 h-3.5 text-black/20 mx-auto mb-2" />
                                <span className="text-black block text-xl font-bold tracking-tight leading-none mb-1">
                                    {loading ? '—' : `${(stats as any)?.revisionRate ?? 0}%`}
                                </span>
                                <span className="text-black/30 text-[8px] font-bold uppercase tracking-[0.1em]">Revision Rate</span>
                            </div>
                            <div className="bg-[#F5F5F5] rounded-2xl p-4 text-center border border-black/5">
                                <Star className="w-3.5 h-3.5 text-black/20 fill-black/20 mx-auto mb-2" />
                                <span className="text-black block text-xl font-bold tracking-tight leading-none mb-1">
                                    {loading ? '—' : (stats?.avgRating ? `${stats.avgRating}/5` : '—')}
                                </span>
                                <span className="text-black/30 text-[8px] font-bold uppercase tracking-[0.1em]">Rating</span>
                            </div>
                        </div>
                        <p className="text-black/25 text-[11px] mt-5 leading-relaxed">
                            Score calculated from deadline adherence, revision cycles, and client feedback. Visible to founders during bidding.
                        </p>
                    </div>
                </div>

                {/* Stats & Reviews */}
                <div className="lg:col-span-2 rounded-[28px] overflow-hidden hover:-translate-y-1 transition-all duration-500 border border-black/10">
                    <div className="p-7 md:p-8" style={{ backgroundColor: '#E5E5E5' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-black flex items-center justify-center rounded-xl">
                                    <Zap className="w-5 h-5 text-white fill-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl md:text-3xl text-black tracking-tight leading-none">Track Record</h2>
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-black/30">
                                        {stats?.totalReviews ?? 0} Review{(stats?.totalReviews ?? 0) !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-black/50">Verified by completed missions</span>
                            <ArrowRight className="w-4 h-4 text-black/30" />
                        </div>
                    </div>
                    <div className="bg-white p-7 md:p-8 flex flex-col rounded-b-[28px]">
                        <div className="space-y-2.5 flex-1">
                            {profileData?.reviews && profileData.reviews.length > 0 ? (
                                profileData.reviews.slice(0, 3).map((review) => {
                                    return (
                                        <div key={review.id} className="flex items-center gap-4 p-4 rounded-2xl bg-[#F5F5F5] hover:bg-[#F0F0F0] transition-colors group">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#E8D754]/20 group-hover:scale-105 transition-transform">
                                                <Star className="w-5 h-5 text-[#E8D754] fill-[#E8D754]" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-medium text-black text-[15px] tracking-tight leading-tight">
                                                        {Number(review.rating)}/5
                                                    </span>
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <Star key={s} className={`w-3 h-3 ${s <= Number(review.rating) ? 'text-[#E8D754] fill-[#E8D754]' : 'text-black/10'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-black/35 font-bold uppercase tracking-widest truncate">
                                                    {review.comment || 'No comment'}
                                                </p>
                                            </div>
                                            <BadgeCheck className="w-4 h-4 text-green-600/50 shrink-0" />
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-black/20 text-sm py-8">
                                    {loading ? 'Loading...' : 'No reviews yet. Complete missions to get reviewed!'}
                                </div>
                            )}
                        </div>

                        {/* Stats Footer */}
                        <div className="grid grid-cols-2 gap-2.5 mt-5 pt-5 border-t border-black/5">
                            <div className="bg-[#F5F5F5] rounded-xl p-3.5 text-center border border-black/5">
                                <span className="text-black block text-lg font-bold tracking-tight leading-none mb-0.5">
                                    {loading ? '—' : (stats?.totalMissions ?? stats?.totalDeals ?? 0)}
                                </span>
                                <span className="text-black/30 text-[8px] font-bold uppercase tracking-[0.1em]">Missions Done</span>
                            </div>
                            <div className="bg-[#F5F5F5] rounded-xl p-3.5 text-center border border-black/5">
                                <span className="text-black block text-lg font-bold tracking-tight leading-none mb-0.5">
                                    {loading ? '—' : (stats?.totalReviews ?? 0)}
                                </span>
                                <span className="text-black/30 text-[8px] font-bold uppercase tracking-[0.1em]">Total Reviews</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* COMPLETED PROJECTS */}
            {profileData?.completedProjects && profileData.completedProjects.length > 0 && (
                <div className="rounded-[28px] overflow-hidden border border-white/10 bg-[#111111]">
                    <div className="p-7 md:p-8 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white flex items-center justify-center rounded-xl">
                                <Briefcase className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl text-white tracking-tight leading-none">Completed Projects</h2>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">
                                    {profileData.completedProjects.length} Mission{profileData.completedProjects.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="p-7 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {profileData.completedProjects.map(proj => (
                                <div key={proj.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0 mr-3">
                                            <h3 className="text-white font-bold text-[15px] tracking-tight leading-tight truncate">{proj.title}</h3>
                                            <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{proj.category}</span>
                                        </div>
                                        {proj.rating && (
                                            <div className="flex items-center gap-1 shrink-0 bg-[#E8D754]/10 px-2.5 py-1 rounded-lg">
                                                <Star className="w-3.5 h-3.5 fill-[#E8D754] text-[#E8D754]" />
                                                <span className="text-xs font-bold text-[#E8D754]">{proj.rating}</span>
                                            </div>
                                        )}
                                    </div>
                                    {proj.milestones.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {proj.milestones.map(m => (
                                                <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-white/40">
                                                    <CheckCircle2 className={`w-3 h-3 ${m.status === 'COMPLETED' ? 'text-green-500' : 'text-white/20'}`} />
                                                    {m.title}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/25">
                                        <span>₹{proj.price.toLocaleString()}</span>
                                        <span>by {proj.founderName}</span>
                                    </div>
                                    {proj.reviewComment && (
                                        <p className="mt-2.5 text-[11px] text-white/35 italic leading-relaxed border-t border-white/5 pt-2.5">
                                            "{proj.reviewComment}"
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <EditProfileModal
                user={user}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveProfile}
            />
        </div>
    );
}
