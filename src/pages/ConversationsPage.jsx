import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { createOrGetConversation, getUserConversations, getConversationMessages, sendMessage } from "../lib/messaging";
import Supabase from "../lib/supabase";

export default function ConversationsPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user || !user.id) return;
      setLoading(true);
      const res = await getUserConversations(user.id);
      if (res.success) setConversations(res.conversations || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const openConversation = async (conv) => {
    setActiveConv(conv);
    setMessages([]);
    try {
      const res = await getConversationMessages(conv.id);
      if (res.success) setMessages(res.messages || []);
    } catch (err) {
      console.warn("Failed to load messages:", err);
    }
  };

  const startWithAdmin = async () => {
    if (!user || !user.id) return;
    try {
      // Find any admin or staff user
      const { data: admins, error } = await Supabase.from("users").select("id").in("role", ["admin", "staff"]).limit(1);
      if (error) throw error;
      const admin = admins && admins[0];
      if (!admin) {
        alert("No admin available right now. Try again later.");
        return;
      }

      const res = await createOrGetConversation(user.id, admin.id);
      if (res.success) {
        // refresh list and open
        const conv = res.conversation;
        const list = await getUserConversations(user.id);
        if (list.success) setConversations(list.conversations || []);
        openConversation(conv);
      }
    } catch (err) {
      console.warn("startWithAdmin error:", err);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault?.();
    if (!text.trim() || !activeConv) return;
    setSending(true);
    try {
      // Determine receiver id (other participant)
      const otherId = activeConv.user_one_id === user.id ? activeConv.user_two_id : activeConv.user_one_id;
      const res = await sendMessage(activeConv.id, user.id, otherId, text.trim());
      if (res.success) {
        // append message locally
        const { messageData } = res;
        setMessages((prev) => [...prev, messageData]);
        setText("");
      } else {
        console.warn("sendMessage failed:", res.error);
      }
    } catch (err) {
      console.warn("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Messages</h2>
            <button onClick={startWithAdmin} className="text-amber-600 text-sm">New with Admin</button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="text-sm text-gray-500">No conversations yet. Click "New with Admin" to start.</div>
            ) : (
              <div className="space-y-2">
                {conversations.map((c) => (
                  <button key={c.id} onClick={() => openConversation(c)} className={`w-full text-left p-3 border rounded hover:bg-gray-50 ${activeConv && activeConv.id === c.id ? 'bg-gray-50' : ''}`}>
                    <div className="text-sm font-medium">{(c.user_one && c.user_one.id === user.id ? c.user_two?.fullname : c.user_one?.fullname) || 'Conversation'}</div>
                    <div className="text-xs text-gray-500 truncate">{c.last_message || ''}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow border flex flex-col">
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {!activeConv ? (
              <div className="text-gray-500">Select a conversation to start messaging.</div>
            ) : messages.length === 0 ? (
              <div className="text-gray-500">No messages yet. Say hello!</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`p-3 rounded-lg max-w-[80%] ${m.sender_id === user.id ? 'ml-auto bg-linear-amber text-white' : 'bg-gray-100 text-gray-800'}`}>
                  <div className="text-sm">{m.message}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSend} className="mt-3 flex gap-3 items-center">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={activeConv ? "Type a message..." : "Select a conversation"} className="flex-1 p-3 border rounded" disabled={!activeConv} />
            <button type="submit" disabled={!activeConv || sending} className="px-4 py-2 bg-linear-amber text-white rounded disabled:opacity-50">{sending ? '...' : 'Send'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
