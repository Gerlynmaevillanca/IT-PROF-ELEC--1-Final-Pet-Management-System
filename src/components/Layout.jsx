import { useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ChatbotWidget from "./ChatbotWidget";
import { useAuth } from "../hooks/useAuth";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Do not show chatbot on login/signup pages or to guests
  const hideWidgetPaths = ["/login", "/signup"];
  const showChatbot = user && user.id && !hideWidgetPaths.includes(location.pathname);

  return (
    <div className="flex min-h-screen bg-light">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 w-full md:ml-0 ml-0 pt-16 md:pt-0">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-6 flex-1 overflow-auto">{children}</main>
        {showChatbot && <ChatbotWidget />}
      </div>
    </div>
  );
}