import { useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { ChatWindow } from "../../components/ui/chat-window";

export default function BusinessMessages() {
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

    // Filter conversations where the founder is the current user or the default mock founder
    const myConversations = conversations.filter(c => 
        c.founderId === currentUserId || c.founderId === "busA" || c.founderId === "mockFounder"
    );

    const handleSendMessage = (content: string, imageUrl?: string) => {
        if (!activeConversationId || !user) return;
        sendMessage(
            activeConversationId,
            content,
            currentUserId,
            user.name || "Business User",
            "Business",
            imageUrl
        );
    };

    const activeMessages = activeConversationId ? (messages[activeConversationId] || []) : [];

    return (
        <div className="flex flex-col h-full p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-foreground mb-5">Messages</h1>
                    <p className="text-slate-500 text-sm font-medium">
                        Chat with Junior Pros working on your bounties
                    </p>
                </div>
            </div>

            {/* Chat Container */}
            <div className="flex-1 min-h-0" style={{ height: "calc(100vh - 200px)" }}>
                <ChatWindow
                    theme="business"
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
