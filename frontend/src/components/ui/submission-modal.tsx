import { useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Image, FileText, X, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";

interface SubmissionModalProps {
    submissionLink?: string;
    submissionScreenshotUrl?: string;
    triggerLabel?: string;
    triggerVariant?: "light" | "dark";
    theme?: "light" | "dark";
    /** Custom bg color for the modal (e.g. bounty card color). Overrides theme bg. */
    modalBgColor?: string;
    title?: string;
}

export function SubmissionModal({
    submissionLink,
    submissionScreenshotUrl,
    triggerLabel = "See Submission",
    triggerVariant = "light",
    theme = "light",
    modalBgColor,
    title = "Submission Details",
}: SubmissionModalProps) {
    const [open, setOpen] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    if (!submissionLink && !submissionScreenshotUrl) return null;

    const links = submissionLink ? submissionLink.split(" | ").filter(Boolean) : [];
    const isTriggerDark = triggerVariant === "dark";
    const isDarkModal = theme === "dark";

    // If a custom color is provided, use dark text (since bounty colors are pastel)
    const hasCustomBg = !!modalBgColor;

    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(true);
                }}
                className={`inline-flex items-center gap-2 text-sm font-bold rounded-xl px-4 py-2.5 transition-all ${
                    isTriggerDark
                        ? "bg-black/10 text-black hover:bg-black/20"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
            >
                <FileText className="w-4 h-4" />
                {triggerLabel}
            </button>

            {/* Fullscreen Lightbox — portaled to body */}
            {lightboxOpen && submissionScreenshotUrl && createPortal(
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
                    style={{ margin: 0 }}
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors z-10"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    <img
                        src={submissionScreenshotUrl}
                        alt="Screenshot full view"
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>,
                document.body
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className={`sm:max-w-[540px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden ${
                        hasCustomBg ? "" : isDarkModal ? "bg-[#111111]" : "bg-white"
                    }`}
                    style={hasCustomBg ? { backgroundColor: modalBgColor } : undefined}
                    showCloseButton={false}
                >
                    <div className={`p-6 pb-4 border-b ${
                        hasCustomBg ? "border-black/10" : isDarkModal ? "border-white/10" : "border-slate-100"
                    }`}>
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <DialogTitle className={`text-lg font-bold tracking-tight flex items-center gap-2 ${
                                    hasCustomBg ? "text-black" : isDarkModal ? "text-white" : "text-slate-900"
                                }`}>
                                    <FileText className={`w-5 h-5 ${
                                        hasCustomBg ? "text-black/50" : isDarkModal ? "text-white/60" : "text-blue-600"
                                    }`} />
                                    {title}
                                </DialogTitle>
                                <button
                                    onClick={() => setOpen(false)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                        hasCustomBg
                                            ? "bg-black/10 hover:bg-black/20 text-black/60"
                                            : isDarkModal
                                            ? "bg-white/10 hover:bg-white/20 text-white/60"
                                            : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                                    }`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="px-6 pb-6 pt-4 space-y-4 max-h-[70vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                        {/* Links */}
                        {links.length > 0 && (
                            <div className="space-y-2">
                                <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                                    hasCustomBg ? "text-black/40" : isDarkModal ? "text-white/40" : "text-slate-400"
                                }`}>
                                    <ExternalLink className="w-3.5 h-3.5" /> Project Links
                                </p>
                                <div className="space-y-1.5">
                                    {links.map((link, idx) => (
                                        <a
                                            key={idx}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all group ${
                                                hasCustomBg
                                                    ? "bg-white/40 border-black/10 hover:border-black/20 hover:bg-white/60"
                                                    : isDarkModal
                                                    ? "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                                                    : "bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50"
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                hasCustomBg
                                                    ? "bg-black/10 group-hover:bg-black/20"
                                                    : isDarkModal
                                                    ? "bg-white/10 group-hover:bg-white/20"
                                                    : "bg-blue-100 group-hover:bg-blue-200"
                                            }`}>
                                                <ExternalLink className={`w-4 h-4 ${
                                                    hasCustomBg ? "text-black/60" : isDarkModal ? "text-white/70" : "text-blue-600"
                                                }`} />
                                            </div>
                                            <span className={`text-sm font-bold hover:underline break-all ${
                                                hasCustomBg ? "text-black/80" : isDarkModal ? "text-white/80" : "text-blue-600"
                                            }`}>
                                                {link}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Screenshot */}
                        {submissionScreenshotUrl && (
                            <div className="space-y-2">
                                <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                                    hasCustomBg ? "text-black/40" : isDarkModal ? "text-white/40" : "text-slate-400"
                                }`}>
                                    <Image className="w-3.5 h-3.5" /> Screenshot
                                </p>
                                <button
                                    onClick={() => setLightboxOpen(true)}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                                        hasCustomBg
                                            ? "bg-black/10 text-black hover:bg-black/20"
                                            : isDarkModal
                                            ? "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                                    }`}
                                >
                                    <Maximize2 className="w-4 h-4" />
                                    Expand Screenshot
                                </button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
