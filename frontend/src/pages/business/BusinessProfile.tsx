import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { Building2, Hash, Calendar, Briefcase, Globe, Mail, Phone, MapPin, Save, CheckCircle2, Shield } from "lucide-react";
import { updateUserProfile } from "../../services/api";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

export default function BusinessProfile() {
    const { user, updateProfile } = useAuthStore();
    
    // Form state
    const [formData, setFormData] = useState({
        name: "",
        cin: "",
        gstin: "",
        yearEstablished: "",
        industry: "",
        website: "",
        officialEmail: "",
        contactPhone: "",
        address: "",
        companyDescription: ""
    });

    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                cin: user.cin || "",
                gstin: user.gstin || "",
                yearEstablished: user.yearEstablished || "",
                industry: user.industry || "",
                website: user.website || "",
                officialEmail: user.officialEmail || "",
                contactPhone: user.contactPhone || "",
                address: user.address || "",
                companyDescription: user.companyDescription || user.bio || ""
            });
        }
    }, [user]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);

        try {
            await updateUserProfile(user.id, {
                ...formData,
                bio: formData.companyDescription,
            });

            updateProfile({
                name: formData.name,
                cin: formData.cin,
                gstin: formData.gstin,
                yearEstablished: formData.yearEstablished,
                industry: formData.industry,
                website: formData.website,
                officialEmail: formData.officialEmail,
                contactPhone: formData.contactPhone,
                address: formData.address,
                companyDescription: formData.companyDescription,
                bio: formData.companyDescription
            });

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to save profile:', err);
        }

        setIsSaving(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-8">
            {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-foreground mb-4">Business Profile</h1>
                    <div className="flex items-center text-slate-500 text-[13px] font-medium bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl border border-slate-200/60 shadow-sm inline-flex">
                        <Shield className="w-4 h-4 text-[#356DDA] mr-2" />
                        Complete your profile with authentic company details to verify your account and prevent fraud.
                    </div>
                </div>
                
                <div className="shrink-0 flex items-center justify-end">
                    {showSuccess && (
                        <span className="flex items-center text-sm font-bold text-emerald-600 mr-4 animate-in slide-in-from-right-2">
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Saved Successfully
                        </span>
                    )}
                    <Button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[#356DDA] hover:bg-[#2563EB] text-white rounded-full px-8 py-6 font-bold shadow-lg flex items-center transition-all hover:shadow-xl hover:scale-[1.02]"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        ) : (
                            <Save className="w-5 h-5 mr-2" />
                        )}
                        Save Profile
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-card rounded-[24px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="p-6 md:p-10 space-y-10">
                    
                    {/* Basic Info Section */}
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Company Identity
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center">
                                    <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                                    Legal Company Name
                                </label>
                                <Input
                                    required
                                    placeholder="e.g. Acme Corporation Pvt. Ltd."
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="h-11 focus-visible:ring-[#356DDA]/30 border-slate-200 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center">
                                    <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                                    Industry / Sector
                                </label>
                                <Input
                                    placeholder="e.g. Information Technology"
                                    value={formData.industry}
                                    onChange={(e) => handleChange('industry', e.target.value)}
                                    className="h-11 focus-visible:ring-[#356DDA]/30 border-slate-200 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Legal & Registration Section */}
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Registration & Tax Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center">
                                    <Hash className="w-4 h-4 mr-2 text-slate-400" />
                                    Registration No. (CIN)
                                </label>
                                <Input
                                    placeholder="Corporate Identity Number"
                                    value={formData.cin}
                                    onChange={(e) => handleChange('cin', e.target.value)}
                                    className="h-11 focus-visible:ring-[#356DDA]/30 border-slate-200 rounded-xl uppercase"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center">
                                    <Hash className="w-4 h-4 mr-2 text-slate-400" />
                                    GSTIN / Tax ID
                                </label>
                                <Input
                                    placeholder="GST Identification Number"
                                    value={formData.gstin}
                                    onChange={(e) => handleChange('gstin', e.target.value)}
                                    className="h-11 focus-visible:ring-[#356DDA]/30 border-slate-200 rounded-xl uppercase"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center">
                                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                    Year Established
                                </label>
                                <Input
                                    type="number"
                                    min="1800"
                                    max={new Date().getFullYear()}
                                    placeholder="YYYY"
                                    value={formData.yearEstablished}
                                    onChange={(e) => handleChange('yearEstablished', e.target.value)}
                                    className="h-11 focus-visible:ring-[#356DDA]/30 border-slate-200 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Contact & Address Section */}
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Contact & Location
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-2.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center">
                                    <Globe className="w-4 h-4 mr-2 text-slate-400" />
                                    Official Website
                                </label>
                                <Input
                                    type="url"
                                    placeholder="https://www.example.com"
                                    value={formData.website}
                                    onChange={(e) => handleChange('website', e.target.value)}
                                    className="h-11 focus-visible:ring-[#356DDA]/30 border-slate-200 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center">
                                    <Mail className="w-4 h-4 mr-2 text-slate-400" />
                                    Official Email
                                </label>
                                <Input
                                    type="email"
                                    placeholder="contact@company.com"
                                    value={formData.officialEmail}
                                    onChange={(e) => handleChange('officialEmail', e.target.value)}
                                    className="h-11 focus-visible:ring-[#356DDA]/30 border-slate-200 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center">
                                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                                    Contact Number
                                </label>
                                <Input
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    value={formData.contactPhone}
                                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                                    className="h-11 focus-visible:ring-[#356DDA]/30 border-slate-200 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center">
                                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                                    Registered Address
                                </label>
                                <Textarea
                                    placeholder="Full company address..."
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    className="focus-visible:ring-[#356DDA]/30 border-slate-200 rounded-xl resize-none min-h-[44px]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-sm font-bold text-slate-700 flex items-center">
                                <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                                Company Description
                            </label>
                            <Textarea
                                placeholder="Tell us about your company, mission, and what you do..."
                                value={formData.companyDescription}
                                onChange={(e) => handleChange('companyDescription', e.target.value)}
                                className="focus-visible:ring-[#356DDA]/30 border-slate-200 rounded-xl resize-none min-h-[140px]"
                            />
                        </div>
                    </div>
                    
                </div>
            </form>
        </div>
    );
}
