import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getUserConversations } from "../lib/chatbot";

export default function AdopterConversationsPanel() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getUserConversations(user.id, 50);
        if (res && res.success) setConversations(res.conversations || []);
      } catch (err) {
        console.warn("[AdopterConversationsPanel] failed to load:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const openConversation = (conv) => {
    try {
      localStorage.setItem("chatbot_open_conversation", JSON.stringify(conv));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent("openChatbotConversation", { detail: conv }));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Your Conversations</h3>
        <button
          type="button"
          onClick={() => openConversation({ id: `new-${Date.now()}`, messages: [{ id: Date.now(), sender: "ai", text: "Hello! How can I help you today? 🐾", created_at: new Date().toISOString() }] })}
          className="text-sm text-amber-600"
        >
          New
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading conversations...</div>
      ) : conversations.length === 0 ? (
        <div className="text-sm text-gray-500">No conversations yet. Click New to start.</div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const msgs = c.messages || [];
            const lastTwo = msgs.slice(-2);
            const ai = lastTwo.find((m) => m.sender === "ai") || lastTwo[0];
            const usr = lastTwo.find((m) => m.sender === "user") || lastTwo[1];
            return (
              <button
                key={c.id}
                onClick={() => openConversation(c)}
                className="w-full text-left p-3 border rounded hover:bg-gray-50 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="text-sm text-gray-700 truncate">{ai ? ai.text : "Conversation"}</div>
                  {usr && <div className="text-xs text-gray-500 mt-1 truncate">{usr.text}</div>}
                </div>
                <div className="text-[10px] text-gray-400 ml-3">{new Date(c.created_at).toLocaleDateString()}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
