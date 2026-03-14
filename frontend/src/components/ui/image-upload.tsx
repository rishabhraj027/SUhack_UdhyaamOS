import { useState, useRef, useCallback } from "react";
import { Image, X, Upload, Clipboard, Loader2 } from "lucide-react";
import { uploadFile } from "../../services/api";

interface ImageUploadProps {
    value: string | null;
    onImageChange: (url: string | null) => void;
    label?: string;
    className?: string;
    variant?: "light" | "dark";
    uploadType?: "avatar" | "submission" | "screenshot" | "image";
}

export function ImageUpload({
    value,
    onImageChange,
    label = "Attach Screenshot",
    className = "",
    variant = "light",
    uploadType = "screenshot",
}: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const isDark = variant === "dark";

    const handleFile = useCallback(
        async (file: File) => {
            if (!file.type.startsWith("image/")) return;
            setIsUploading(true);
            try {
                const url = await uploadFile(file, uploadType);
                onImageChange(url);
            } catch (err) {
                console.error("Upload failed:", err);
            } finally {
                setIsUploading(false);
            }
        },
        [onImageChange, uploadType]
    );

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handlePaste = useCallback(
        (e: React.ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith("image/")) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) handleFile(file);
                    break;
                }
            }
        },
        [handleFile]
    );

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onImageChange(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (isUploading) {
        return (
            <div className={className}>
                <div
                    className={`rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 ${
                        isDark ? "border-black/20 bg-black/5" : "border-slate-200 bg-slate-50"
                    }`}
                >
                    <Loader2 className={`w-6 h-6 animate-spin ${isDark ? "text-black/40" : "text-slate-400"}`} />
                    <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-black/40" : "text-slate-400"}`}>
                        Uploading...
                    </span>
                </div>
            </div>
        );
    }

    if (value) {
        return (
            <div className={`relative group ${className}`}>
                <div
                    className={`rounded-xl overflow-hidden border ${
                        isDark
                            ? "border-black/20 bg-black/5"
                            : "border-slate-200 bg-slate-50"
                    }`}
                >
                    <img
                        src={value}
                        alt="Attached screenshot"
                        className="w-full h-auto max-h-48 object-cover"
                    />
                </div>
                <button
                    onClick={handleRemove}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Remove image"
                >
                    <X className="w-4 h-4" />
                </button>
                <div
                    className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${
                        isDark ? "text-black/50" : "text-slate-400"
                    }`}
                >
                    <Image className="w-3 h-3" /> Screenshot attached
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {label && (
                <label
                    className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5 ${
                        isDark ? "text-black/50" : "text-slate-500"
                    }`}
                >
                    <Image className="w-3.5 h-3.5" /> {label}
                </label>
            )}
            <div
                onPaste={handlePaste}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                tabIndex={0}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all focus:outline-none ${
                    isDragging
                        ? isDark
                            ? "border-black/40 bg-black/10"
                            : "border-primary/40 bg-primary/5"
                        : isDark
                        ? "border-black/15 hover:border-black/30 hover:bg-black/5"
                        : "border-slate-200 hover:border-primary/30 hover:bg-primary/5"
                }`}
            >
                <div
                    className={`flex flex-col items-center gap-2 ${
                        isDark ? "text-black/40" : "text-slate-400"
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                            <Upload className="w-4 h-4" />
                            <span>Browse</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                            or
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                            <Clipboard className="w-4 h-4" />
                            <span>Paste</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-medium opacity-60">
                        Click to browse, drag & drop, or Ctrl+V to paste
                    </span>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                />
            </div>
        </div>
    );
}
