import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "./dialog";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "danger";
    icon?: LucideIcon;
    onConfirm: () => void;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",
    icon: Icon = AlertTriangle,
    onConfirm,
}: ConfirmDialogProps) {
    const isDanger = variant === "danger";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden" showCloseButton={false}>
                <div className="p-6 pb-4">
                    <DialogHeader>
                        <div className="flex items-start gap-4">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                                    isDanger
                                        ? "bg-red-100 text-red-600"
                                        : "bg-amber-100 text-amber-600"
                                }`}
                            >
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
                                    {title}
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                                    {description}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>
                <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-slate-100 bg-slate-50/80">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 rounded-xl font-bold border-slate-200 hover:bg-slate-100 h-11"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className={`flex-1 rounded-xl font-bold shadow-sm h-11 ${
                            isDanger
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
