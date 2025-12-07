/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, PawPrint, Eye, EyeOff, User } from "lucide-react";
import { askAi } from "../lib/ai";
import { useAuth } from "../components/RequireAuth";
import { createChatbotPrompt, createChatbotConversation, getUserConversations } from "../lib/chatbot";
import { getConversationMessages, sendMessage, createOrGetConversation, getUnreadCount, getUserConversations as getUserConversationsMessaging } from "../lib/messaging";
import Supabase from "../lib/supabase";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "Hello! How can I help you today? 🐾" },
  ]);
  const [recentConversations, setRecentConversations] = useState([]);
  const [showRecent, setShowRecent] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [pendingConv, setPendingConv] = useState(null);
  const [openMode, setOpenMode] = useState("chat"); // 'chat' = AI, 'conversation' = messaging with admin
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);
  const [convOther, setConvOther] = useState(null);
  
  const adminPanelRef = useRef();
  const chatHeadRef = useRef();

  // Listen for external requests to open a conversation (store as pending but do NOT auto-open)
  useEffect(() => {
    const handler = (e) => {
      try {
        const conv = e?.detail || null;
        if (!conv) return;
        // store pending conversation and persist to localStorage so user can open it via the user icon
        setPendingConv(conv);
        try { localStorage.setItem("chatbot_open_conversation", JSON.stringify(conv)); } catch (err) {}
      } catch (err) {
        console.warn("[ChatbotWidget] openChatbotConversation handler error:", err);
      }
    };

    window.addEventListener("openChatbotConversation", handler);
    return () => window.removeEventListener("openChatbotConversation", handler);
  }, []);

  // On mount, load any pending conversation reference from localStorage but DO NOT auto-open the widget
  useEffect(() => {
    try {
      const raw = localStorage.getItem("chatbot_open_conversation");
      if (raw) {
        const conv = JSON.parse(raw);
        if (conv) setPendingConv(conv);
      }
    } catch (e) {
      // ignore malformed data
    }
  }, []);

  // load unread count for messaging (chat-head badge)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user || !user.id) return;
      try {
        const res = await getUnreadCount(user.id);
        if (mounted && res && res.success) setUnreadCount(res.unreadCount || 0);
      } catch (err) {
        // ignore
      }
    };
    load();
    const t = setInterval(load, 10000);
    return () => { mounted = false; clearInterval(t); };
  }, [user]);

  // close admin panel on outside click
  useEffect(() => {
    if (!adminPanelOpen) return;
    const handleOutside = (e) => {
      const panel = adminPanelRef.current;
      const head = chatHeadRef.current;
      if (panel && !panel.contains(e.target) && head && !head.contains(e.target)) {
        setAdminPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [adminPanelOpen]);

  // whenever pendingConv changes, try to load the other participant for header display
  useEffect(() => {
    const loadOther = async () => {
      if (!pendingConv || !pendingConv.id) return;
      try {
        const otherId = pendingConv.user_one_id === user?.id ? pendingConv.user_two_id : pendingConv.user_one_id;
        const { data: other } = await Supabase.from('users').select('id, fullname, role').eq('id', otherId).maybeSingle();
        if (other) setConvOther(other);
      } catch (err) {
        // ignore
      }
    };
    loadOther();
  }, [pendingConv, user]);

  const handleOpenSavedConversation = async () => {
    try {
      // If current user is admin/staff, open admin conversation chooser first
      const isAdmin = user && (user.role === "admin" || user.role === "staff");
      if (isAdmin) {
        // toggle admin panel and load list of users to message
        setAdminPanelOpen((p) => !p);
        if (!adminPanelOpen && user?.id) {
            try {
            setLoadingAdminUsers(true);
            const { data, error } = await Supabase.from("users").select("id, fullname").not("id", "eq", user.id).order('created_at', { ascending: false }).limit(200);
            if (!error) setAdminUsers(data || []);
            else console.warn("[ChatbotWidget] users query error:", error);
          } catch (err) {
            console.warn("[ChatbotWidget] failed to load users:", err);
          } finally {
            setLoadingAdminUsers(false);
          }
        }
        return;
      }

      // If a pending conversation exists and is a messaging conversation, open it
      const raw = localStorage.getItem("chatbot_open_conversation");
      let conv = null;
      if (raw) {
        try { conv = JSON.parse(raw); } catch (e) { conv = null; }
      }

      // If conv is a messaging conversation with id, open it
      if (conv && conv.id) {
        // Validate conversation participants and roles: adopters may only chat admins
        try {
          const { data: convRow, error: convErr } = await Supabase.from("conversations")
            .select(`*, user_one:user_one_id(id, role, fullname), user_two:user_two_id(id, role, fullname)`)
            .eq("id", conv.id)
            .maybeSingle();

          if (convErr) throw convErr;

          if (convRow) {
            // Open existing conversation regardless of participant roles
            setOpenMode("conversation");
            setPendingConv(convRow);
            try {
              const res = await getConversationMessages(convRow.id);
              if (res && res.success) {
                setMessages((res.messages || []).map((m) => ({ id: m.id || Date.now(), sender: m.sender_id === (user?.id) ? 'user' : 'admin', text: m.message, created_at: m.created_at })));
              }
            } catch (err) {
              console.warn("[ChatbotWidget] failed to load messages:", err);
            }
            // load other participant info for header
            (async () => {
              try {
                const otherId = convRow.user_one_id === user?.id ? convRow.user_two_id : convRow.user_one_id;
                const { data: other } = await Supabase.from('users').select('id, fullname, role').eq('id', otherId).maybeSingle();
                if (other) setConvOther(other);
              } catch (err) { /* ignore */ }
            })();
            setIsOpen(true);
            return;
          }
        } catch (err) {
          console.warn("[ChatbotWidget] error validating conversation:", err);
          // continue to fallback behavior (create/get admin conv)
        }
      }

      // Otherwise, create or get a conversation with an admin and open it
      if (!user || !user.id) {
        // shouldn't happen (layout hides widget), but guard
        return;
      }

      // find an admin/staff
      try {
        const { data: admins, error } = await Supabase.from("users").select("id").in("role", ["admin", "staff"]).limit(1);
        if (error) throw error;
        const admin = admins && admins[0];
        if (!admin) {
          // Fallback: open chat mode greeting if no admin
          setOpenMode("chat");
          setMessages([{ id: Date.now(), sender: "ai", text: "Hello! How can I help you today? 🐾" }]);
          setIsOpen(true);
          return;
        }

        const res = await createOrGetConversation(user.id, admin.id);
        if (res && res.success) {
          const convRow = res.conversation;
          // persist as open conversation reference
          try { localStorage.setItem("chatbot_open_conversation", JSON.stringify(convRow)); } catch (e) {}
          setPendingConv(convRow);
          setOpenMode("conversation");
          const msgsRes = await getConversationMessages(convRow.id);
          if (msgsRes && msgsRes.success) {
            setMessages((msgsRes.messages || []).map((m) => ({ id: m.id || Date.now(), sender: m.sender_id === (user?.id) ? 'user' : 'admin', text: m.message, created_at: m.created_at })));
          }
          // load other participant info for header
          (async () => {
            try {
              const otherId = convRow.user_one_id === user?.id ? convRow.user_two_id : convRow.user_one_id;
              const { data: other } = await Supabase.from('users').select('id, fullname, role').eq('id', otherId).maybeSingle();
              if (other) setConvOther(other);
            } catch (err) { /* ignore */ }
          })();

          setIsOpen(true);
          return;
        }
      } catch (err) {
        console.warn("[ChatbotWidget] failed to create/get admin conversation:", err);
      }

      // Fallback to opening AI chat
      setOpenMode("chat");
      setMessages([{ id: Date.now(), sender: "ai", text: "Hello! How can I help you today? 🐾" }]);
      setIsOpen(true);
    } catch (err) {
      console.warn("[ChatbotWidget] failed to open saved conversation:", err);
      setIsOpen(true);
    }
  };

  const adminOpenConversation = async (convRow) => {
    try {
      if (!convRow) return;
      // If convRow is an existing conversation row (has user_one_id), open it
      if (convRow.user_one_id) {
        setPendingConv(convRow);
        setOpenMode("conversation");
        try {
          const res = await getConversationMessages(convRow.id);
          if (res && res.success) {
            setMessages((res.messages || []).map((m) => ({ id: m.id || Date.now(), sender: m.sender_id === (user?.id) ? 'user' : 'admin', text: m.message, created_at: m.created_at })));
          }
        } catch (err) {
          console.warn("[ChatbotWidget] failed to load messages for admin convo:", err);
        }
        // load other participant info for header
        (async () => {
          try {
            const otherId = convRow.user_one_id === user?.id ? convRow.user_two_id : convRow.user_one_id;
            const { data: other } = await Supabase.from('users').select('id, fullname, role').eq('id', otherId).maybeSingle();
            if (other) setConvOther(other);
          } catch (err) { /* ignore */ }
        })();
        setIsOpen(true);
        setAdminPanelOpen(false);
        try { localStorage.setItem("chatbot_open_conversation", JSON.stringify(convRow)); } catch (e) {}
        return;
      }

      // Otherwise convRow is a user object; start or get a conversation with that user
      if (convRow && convRow.id) {
        try {
          const res = await createOrGetConversation(user.id, convRow.id);
          if (res && res.success) {
            const conv = res.conversation;
            setPendingConv(conv);
            setOpenMode("conversation");
            const msgsRes = await getConversationMessages(conv.id);
            if (msgsRes && msgsRes.success) setMessages((msgsRes.messages || []).map((m) => ({ id: m.id || Date.now(), sender: m.sender_id === (user?.id) ? 'user' : 'admin', text: m.message, created_at: m.created_at })));
            // load other participant info for header
            (async () => {
              try {
                const otherId = conv.user_one_id === user?.id ? conv.user_two_id : conv.user_one_id;
                const { data: other } = await Supabase.from('users').select('id, fullname, role').eq('id', otherId).maybeSingle();
                if (other) setConvOther(other);
              } catch (err) { /* ignore */ }
            })();
            setIsOpen(true);
            setAdminPanelOpen(false);
            try { localStorage.setItem("chatbot_open_conversation", JSON.stringify(conv)); } catch (e) {}
          }
        } catch (err) {
          console.warn("[ChatbotWidget] failed to create/get conversation with user:", err);
        }
      }
    } catch (err) {
      console.warn("[ChatbotWidget] adminOpenConversation error:", err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Branch behavior by openMode
    if (openMode === "chat") {
      const userMsg = { id: Date.now(), sender: "user", text: input };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const aiResponse = await askAi(input);
        const aiMsg = {
          id: Date.now() + 1,
          sender: "ai",
          text: aiResponse,
        };
        setMessages((prev) => [...prev, aiMsg]);
        // Persist prompt/response and save a conversation snapshot
        try {
          if (user && user.id) {
            // store single prompt/response record
            createChatbotPrompt(user.id, userMsg.text, aiMsg.text, { source: "widget" })
              .then((res) => {
                if (!res.success) console.warn("[ChatbotWidget] Failed to save prompt to DB:", res.error);
              })
              .catch((err) => console.error("[ChatbotWidget] createChatbotPrompt error:", err));

            // snapshot full conversation (previous messages + new pair)
            const snapshot = [...messages, userMsg, aiMsg].map((m) => ({ sender: m.sender, text: m.text, id: m.id, created_at: m.created_at || new Date().toISOString() }));
            createChatbotConversation(user.id, snapshot, { source: "widget" })
              .then((r) => {
                if (!r.success) console.warn("[ChatbotWidget] createChatbotConversation failed:", r.error);
                else setRecentConversations((prev) => [r.conversation, ...prev].slice(0, 50));
              })
              .catch((err) => console.error("[ChatbotWidget] createChatbotConversation error:", err));
          } else {
            // guests: save snapshot to localStorage
            const storeKey = "chatbot_conversations";
            const existing = JSON.parse(localStorage.getItem(storeKey) || "[]");
            const entry = { id: Date.now(), messages: [...messages, userMsg, aiMsg].map((m) => ({ sender: m.sender, text: m.text, id: m.id, created_at: m.created_at || new Date().toISOString() })), created_at: new Date().toISOString() };
            const updated = [entry, ...existing].slice(0, 50);
            localStorage.setItem(storeKey, JSON.stringify(updated));
            setRecentConversations(updated);
          }
        } catch (err) {
          console.warn("[ChatbotWidget] Failed to persist conversation:", err);
        }
      } catch (error) {
        const errorMsg = {
          id: Date.now() + 1,
          sender: "ai",
          text: "Sorry, I couldn't process that. Please try again.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    } else if (openMode === "conversation") {
      // send via messaging API to admin/other participant
      if (!pendingConv || !pendingConv.id) {
        console.warn("[ChatbotWidget] No active conversation to send to");
        return;
      }

      setIsLoading(true);
      try {
        const conv = pendingConv;
        const receiverId = conv.user_one_id === user.id ? conv.user_two_id : conv.user_one_id;
        const res = await sendMessage(conv.id, user.id, receiverId, input.trim());
        if (res && res.success) {
          // append message with sender_id === user.id
          const m = res.messageData;
          setMessages((prev) => [...prev, { id: m.id, sender: "user", text: m.message, created_at: m.created_at }]);
          setInput("");
        } else {
          console.warn("[ChatbotWidget] sendMessage failed:", res?.error);
        }
      } catch (err) {
        console.warn("[ChatbotWidget] error sending message:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Load recent prompts from localStorage on mount
  useEffect(() => {
    try {
      // load recent full conversations instead of recent prompts
      const persisted = localStorage.getItem("chatbot_show_recent");
      if (persisted !== null) setShowRecent(persisted === "true");

      if (user && user.id) {
        // load from DB
        // getUserConversations will be called in a separate effect below
      } else {
        const existing = JSON.parse(localStorage.getItem("chatbot_conversations") || "[]");
        setRecentConversations(existing);
      }
    } catch (err) {
      console.warn("[ChatbotWidget] Failed to load recent conversations:", err);
    }
  }, []);

  // when user changes (login), load from DB
  useEffect(() => {
    const loadRecent = async () => {
      if (user && user.id) {
        try {
          const res = await getUserConversations(user.id);
          if (res.success) setRecentConversations(res.conversations || []);
        } catch (e) {
          console.warn("[ChatbotWidget] Failed to load conversations from DB:", e);
        }
      }
    };
    loadRecent();
  }, [user]);

  // Conversation snapshots are auto-saved after each AI reply; explicit manual save removed

  // templates removed — no template UI or helpers

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {!isOpen && (
        <div className="flex items-center gap-3">
          <div className="relative" ref={chatHeadRef}>
            <button
              onClick={handleOpenSavedConversation}
              className="bg-white text-amber-600 p-3 rounded-full shadow hover:scale-105 transition"
              title="Open conversation"
            >
              <User size={20} />
            </button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
            {/* Admin conversation chooser dropdown */}
            {adminPanelOpen && (
              <div className="absolute bottom-14 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50" ref={adminPanelRef}>
                <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                  {loadingAdminUsers ? (
                    <div className="text-sm text-gray-500 p-2">Loading users...</div>
                  ) : adminUsers.length === 0 ? (
                    <div className="text-sm text-gray-500 p-2">No users found</div>
                  ) : (
                    adminUsers.map((u) => {
                      const name = u?.fullname || 'User';
                      return (
                        <button
                          key={u.id}
                          onClick={() => adminOpenConversation(u)}
                          className="w-full text-left p-2 rounded hover:bg-gray-50 flex items-center gap-2"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            <div className="text-sm font-semibold text-gray-700">{(name || 'U').split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium truncate">{name}</div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                
              </div>
            )}
          </div>

          <button
            onClick={() => { setOpenMode('chat'); setIsOpen(true); }}
            className="bg-linear-amber text-white p-5 rounded-full shadow-lg shadow-amber-200/50 transition-all hover:scale-110"
            title="Open chat"
          >
            <MessageCircle size={32} />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="w-96 h-[500px] bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden border border-gray-200">
          <div className={`${openMode === 'chat' ? 'bg-linear-amber text-white' : 'bg-white text-gray-800 border-b'} flex justify-between items-center p-5`}>
                <h2 className="font-bold text-lg flex items-center gap-2">
                  {openMode === 'chat' ? (<><PawPrint size={24} /> Pet Peeve AI</>) : (<><User size={20} /> {convOther ? ( (convOther.role === 'admin' || convOther.role === 'staff') && user && (user.role !== 'admin' && user.role !== 'staff') ? 'Staff' : (convOther.fullname || 'Conversation') ) : 'Conversation'}</>)}
                </h2>
                <div className="flex items-center gap-2">
                  {openMode === 'chat' && (
                    <button
                      onClick={() => {
                        const next = !showRecent;
                        setShowRecent(next);
                        try { localStorage.setItem("chatbot_show_recent", String(next)); } catch(e){}
                      }}
                      className="bg-white/20 text-white px-2 py-1 rounded-md text-sm hover:bg-white/30"
                      title={showRecent ? "Hide recent conversations" : "Show recent conversations"}
                    >
                      {showRecent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="hover:bg-white/20 rounded-full p-2 transition"
                  >
                    <X size={24} />
                  </button>
                </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-light">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-xl max-w-[80%] text-base ${
                  msg.sender === "user"
                    ? "bg-linear-amber text-white ml-auto shadow-md"
                    : "bg-white text-gray-800 shadow-sm border border-gray-200"
                }`}
              >
                {openMode === 'conversation' && msg.sender !== 'user' && (
                  <div className="text-xs text-gray-500 mb-1">Staff</div>
                )}
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white text-gray-800 p-4 rounded-xl max-w-[80%] shadow-sm border border-gray-200">
                <span className="animate-pulse text-base">Typing...</span>
              </div>
            )}
          </div>

          {/* Recent conversations */}
          {openMode === 'chat' && showRecent && recentConversations && recentConversations.length > 0 && (
            <div className="px-4 pb-2 border-t border-gray-100 bg-white">
              <div className="text-xs text-gray-500 mb-2">Recent conversations</div>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                {recentConversations.map((c) => {
                  const msgs = c.messages || [];
                  const lastTwo = msgs.slice(-2);
                  const ai = lastTwo.find((m) => m.sender === "ai") || lastTwo[0];
                  const usr = lastTwo.find((m) => m.sender === "user") || lastTwo[1] || null;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setMessages(msgs.map((m) => ({ id: m.id || Date.now(), sender: m.sender, text: m.text, created_at: m.created_at })));
                      }}
                      className="text-left text-sm p-2 rounded hover:bg-gray-50 border border-gray-50"
                    >
                      <div className="text-xs text-gray-600 truncate">{ai ? ai.text : "..."}</div>
                      {usr && (
                        <div className="text-xs text-right text-gray-800 font-medium mt-1">{usr.text}</div>
                      )}
                      <div className="text-[10px] text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* templates removed — saving full conversations instead */}

          <div className="p-5 border-t border-gray-200 flex gap-3 items-center bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend(e)}
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1 border border-gray-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-linear-amber text-white px-5 py-3 rounded-lg transition shadow-md disabled:opacity-50 font-semibold"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}