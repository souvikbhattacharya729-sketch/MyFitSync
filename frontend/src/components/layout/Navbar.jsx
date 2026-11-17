import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Moon, Sun, MessageSquare, LogOut } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';

export const Navbar = ({ onOpenChat }) => {
  const { user, logout, theme, toggleTheme } = useFitness();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#20252E] bg-[#0B0D10]/95 px-4 md:px-6 backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight text-[#F5F7FA] group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C6FF3D] shadow-lg shadow-[#C6FF3D]/10 group-hover:scale-105 transition-transform text-[#0B0D10]">
            <Activity className="h-5 w-5 text-[#0B0D10] stroke-[2.5]" />
          </div>
          <span className="text-xl font-extrabold text-[#F5F7FA]">
            MyFit<span className="text-[#C6FF3D]">Sync</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onOpenChat}
          className="flex items-center gap-2 rounded-xl bg-[#C6FF3D]/10 px-3.5 py-2 text-sm font-bold text-[#C6FF3D] border border-[#C6FF3D]/25 hover:bg-[#C6FF3D]/20 transition-all hover:shadow-lg hover:shadow-[#C6FF3D]/10 active:scale-95"
          aria-label="Open Quick Log Chat"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">AI Quick Log</span>
        </button>

        <button
          onClick={toggleTheme}
          className="rounded-xl border border-[#20252E] p-2 text-[#9AA3B2] hover:text-[#F5F7FA] hover:bg-[#20252E] transition-colors"
          aria-label="Toggle dark/light theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#20252E]">
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-xl p-1.5 text-sm text-[#9AA3B2] hover:text-[#F5F7FA] hover:bg-[#20252E] transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-[#20252E] flex items-center justify-center font-bold text-xs text-[#C6FF3D] border border-[#20252E]">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline font-semibold text-xs max-w-[100px] truncate text-[#F5F7FA]">
                {user.name}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl p-2 text-[#9AA3B2] hover:text-[#FF5A5F] hover:bg-[#FF5A5F]/10 transition-colors"
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
