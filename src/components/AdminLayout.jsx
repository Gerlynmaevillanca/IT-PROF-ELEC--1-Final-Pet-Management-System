import { useState } from "react";
import Header from "./Header";
import AdminSidebar from "./AdminSidebar";
import ChatbotWidget from "./ChatbotWidget";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-light">
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 w-full md:ml-0 ml-0 pt-16 md:pt-0">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-6 flex-1 overflow-auto">{children}</main>
        <ChatbotWidget />
      </div>
    </div>
  );
}