import { useState, useEffect, useRef } from "react";
import type { User } from "../../services/api";
import { uploadFile } from "../../services/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { X, Plus, Upload, Loader2 } from "lucide-react";

const BANNER_COLORS = [
    "#F87D3F", "#FFD166", "#B9A1E0", "#804CE4", "#E4F241",
    "#E5E5E5", "#FF6B6B", "#4ECDC4", "#2C3E50", "#1A1A1A",
];

interface EditProfileModalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: Partial<User>) => void;
}

export function EditProfileModal({ user, isOpen, onClose, onSave }: EditProfileModalProps) {
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [portfolioUrl, setPortfolioUrl] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState("");
    const [bannerColor, setBannerColor] = useState("#F87D3F");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setBio(user.bio || "");
            setPortfolioUrl(user.portfolioUrl || "");
            setSkills(user.skills || ["React", "Node.js", "Figma", "TypeScript", "UI Design"]);
            setBannerColor(user.bannerColor || "#F87D3F");
            setAvatarPreview(user.avatarUrl || null);
        }
    }, [user, isOpen]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSave({ name, bio, portfolioUrl, skills, bannerColor, avatarUrl: avatarPreview || undefined });
        onClose();
    };

    const addSkill = () => {
        const trimmed = newSkill.trim();
        if (trimmed && !skills.includes(trimmed)) {
            setSkills([...skills, trimmed]);
        }
        setNewSkill("");
    };

    const removeSkill = (skill: string) => {
        setSkills(skills.filter(s => s !== skill));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploadingAvatar(true);
            try {
                const url = await uploadFile(file, 'avatar');
                setAvatarPreview(url);
            } catch (err) {
                console.error('Avatar upload failed:', err);
            } finally {
                setIsUploadingAvatar(false);
            }
        }
    };

    const inputClasses = "bg-white/5 border border-white/10 focus:border-white/30 focus-visible:border-white/30 text-white placeholder:text-white/40 shadow-inner";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-[700px] border-none p-0 shadow-2xl gap-0 outline-none w-[95vw] md:w-full bg-[#111111] text-white rounded-xl md:rounded-2xl"
            >
                <div className="relative z-10 w-full flex flex-col p-6 md:p-10 overflow-y-auto no-scrollbar max-h-[90vh]">
                    <DialogHeader className="mb-5 text-left space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#B9A1E0] bg-[#B9A1E0]/10 px-3 py-1.5 rounded-sm">
                                Profile Settings
                            </span>
                        </div>
                        <div className="pt-1">
                            <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight leading-none uppercase pr-10">
                                Edit Profile
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="border-t border-white/10 w-full my-4"></div>

                    <div className="text-white/50 text-sm leading-relaxed font-medium mb-6">
                        <DialogDescription className="text-inherit font-medium opacity-60 italic">
                            Customize your professional identity and presence.
                        </DialogDescription>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Avatar Upload */}
                        <div className="space-y-2">
                            <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/50">Profile Picture</label>
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-white/10"
                                    style={{ backgroundColor: bannerColor + '30' }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {isUploadingAvatar ? (
                                        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                                    ) : avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-medium text-white uppercase">
                                            {name?.substring(0, 2) || "?"}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <Button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingAvatar}
                                        className="bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold px-4 h-9 text-xs border border-white/10"
                                    >
                                        {isUploadingAvatar ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Uploading...</> : <><Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Photo</>}
                                    </Button>
                                    <p className="text-[10px] text-white/30 mt-1.5">JPG, PNG or GIF. Max 5MB.</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/50">Display Name</label>
                            <Input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                className={`h-12 ${inputClasses} text-base font-semibold rounded-md px-4`}
                            />
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/50">Public Biography</label>
                            <Textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell founders about your core skills and specialties..."
                                className={`min-h-[100px] ${inputClasses} text-base font-medium rounded-md resize-none p-4`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/50">Portfolio Link</label>
                            <Input
                                type="url"
                                value={portfolioUrl}
                                onChange={(e) => setPortfolioUrl(e.target.value)}
                                placeholder="https://your-portfolio.com"
                                className={`h-12 ${inputClasses} text-base font-semibold rounded-md px-4`}
                            />
                        </div>

                        {/* Banner Color */}
                        <div className="space-y-2">
                            <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/50">Banner Color</label>
                            <div className="flex flex-wrap gap-2.5">
                                {BANNER_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setBannerColor(color)}
                                        className={`w-9 h-9 rounded-xl transition-all duration-200 ${bannerColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111111] scale-110' : 'hover:scale-105 border border-white/10'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="space-y-2">
                            <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/50">Skills</label>
                            <div className="flex flex-wrap gap-2 mb-2.5">
                                {skills.map((skill) => (
                                    <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/70 text-xs font-bold">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    placeholder="Add a skill..."
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                                    className={`h-10 flex-1 ${inputClasses} text-sm font-bold rounded-md px-4`}
                                />
                                <Button type="button" onClick={addSkill} className="h-10 bg-white/10 hover:bg-white/15 text-white rounded-md px-4 border border-white/10">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-3 flex w-full gap-3 mt-2">
                            <Button
                                type="submit"
                                className="flex-1 h-12 md:h-14 bg-white hover:bg-white/90 text-black rounded-md font-bold text-sm tracking-[0.1em] transition-all uppercase"
                            >
                                Save Changes
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className="w-1/3 sm:w-auto px-6 sm:px-10 h-12 md:h-14 bg-white/5 hover:bg-white/10 text-white rounded-md font-bold text-xs tracking-[0.1em] transition-all uppercase"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
