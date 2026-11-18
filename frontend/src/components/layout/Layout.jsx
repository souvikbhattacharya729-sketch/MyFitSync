import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ChatDrawer } from '../chat/ChatDrawer';

export const Layout = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col bg-[#F6FAF7] text-[#263D32] transition-colors duration-200 overflow-x-hidden">
      {/* Subtle layered ambient background glow */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-96 w-96 rounded-full bg-[#DCEFE3]/50 blur-3xl" />
      <div className="pointer-events-none fixed top-1/2 -right-40 h-96 w-96 rounded-full bg-[#EDF5EF]/80 blur-3xl" />

      <Navbar onOpenChat={() => setIsChatOpen(true)} />

      <div className="flex flex-1 relative z-10">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          <Outlet context={{ openChat: () => setIsChatOpen(true) }} />
        </main>
      </div>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};
