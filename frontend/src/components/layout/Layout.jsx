import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ChatDrawer } from '../chat/ChatDrawer';

export const Layout = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0F17] text-slate-100 transition-colors duration-200">
      <Navbar onOpenChat={() => setIsChatOpen(true)} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          <Outlet context={{ openChat: () => setIsChatOpen(true) }} />
        </main>
      </div>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};
