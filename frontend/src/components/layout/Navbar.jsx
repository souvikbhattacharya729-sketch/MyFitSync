import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, MessageSquare, LogOut, Sparkles, User as UserIcon } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';

export const Navbar = ({ onOpenChat }) => {
  const { user, logout } = useFitness();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E5EDE7] bg-white/90 px-4 md:px-8 backdrop-blur-md transition-colors duration-200 shadow-sm">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight text-[#263D32] group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6BA985] to-[#A8D5B5] shadow-md shadow-[#6BA985]/20 group-hover:scale-105 transition-transform text-white">
            <Activity className="h-5 w-5 text-white stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black text-[#263D32] leading-none tracking-tight">
              MyFit<span className="text-[#6BA985]">Sync</span>
            </span>
            <span className="text-[10px] font-semibold text-[#77847C] tracking-wide mt-0.5">
              Fitness Intelligence
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2.5 md:gap-3.5">
        <button
          onClick={onOpenChat}
          className="flex items-center gap-2 rounded-xl bg-[#DCEFE3] px-3.5 py-2 text-xs font-bold text-[#263D32] border border-[#A8D5B5]/60 hover:bg-[#A8D5B5]/40 transition-all shadow-sm hover:shadow-card active:scale-95"
          aria-label="Open Quick Log Chat"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#6BA985]" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-[#E5EDE7]">
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-xl p-1 text-sm text-[#77847C] hover:text-[#263D32] hover:bg-[#EDF5EF] transition-colors"
            >
              <div className="h-8 w-8 rounded-xl bg-[#DCEFE3] flex items-center justify-center font-bold text-xs text-[#263D32] border border-[#A8D5B5]/50 shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
              </div>
              <span className="hidden md:inline font-semibold text-xs max-w-[120px] truncate text-[#263D32]">
                {user.name}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl p-2 text-[#77847C] hover:text-[#D96565] hover:bg-[#D96565]/10 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
