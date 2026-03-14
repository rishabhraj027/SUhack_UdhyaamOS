import { useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { ChatWindow } from "../../components/ui/chat-window";

export default function JuniorProMessages() {
    const { user } = useAuthStore();
    const {
        conversations,
        messages,
        activeConversationId,
        isLoading,
        loadConversations,
        setActiveConversation,
        sendMessage,
    } = useChatStore();

    const currentUserId = user?.id || "";

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Filter conversations where the junior pro is the current user or the default mock junior pro
    const myConversations = conversations.filter(c => 
        c.juniorProId === currentUserId || c.juniorProId === "stuA"
    );

    const handleSendMessage = (content: string, imageUrl?: string) => {
        if (!activeConversationId || !user) return;
        sendMessage(
            activeConversationId,
            content,
            currentUserId,
            user.name || "Junior Pro",
            "JuniorPro",
            imageUrl
        );
    };

    const activeMessages = activeConversationId ? (messages[activeConversationId] || []) : [];

    return (
        <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto px-4 md:px-8 animate-in fade-in zoom-in-95 duration-700">
            {/* Header */}
            <div className="flex flex-col pt-12 pb-6 border-b border-white/10 mb-6">
                <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-5xl md:text-7xl font-bold text-white uppercase leading-none tracking-tight">
                        Comms
                    </h1>
                </div>
                <p className="text-white/40 text-sm font-medium tracking-wide uppercase">
                    Direct messaging with founders you're working with
                </p>
            </div>

            {/* Chat Container */}
            <div className="flex-1 min-h-0 pb-8" style={{ height: "calc(100vh - 280px)" }}>
                <ChatWindow
                    theme="junior-pro"
                    conversations={myConversations}
                    messages={activeMessages}
                    activeConversationId={activeConversationId}
                    currentUserId={currentUserId}
                    isLoading={isLoading}
                    onSelectConversation={(id) => setActiveConversation(id)}
                    onBack={() => setActiveConversation(null)}
                    onSendMessage={handleSendMessage}
                />
            </div>
        </div>
    );
}
