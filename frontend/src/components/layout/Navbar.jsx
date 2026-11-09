import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Moon, Sun, MessageSquare, LogOut, User } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';

export const Navbar = ({ onOpenChat }) => {
  const { user, logout, theme, toggleTheme } = useFitness();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#0B0F17]/90 px-4 md:px-6 backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight text-white group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Activity className="h-5 w-5 text-slate-950" />
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            MyFitSync
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onOpenChat}
          className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2 text-sm font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95"
          aria-label="Open Quick Log Chat"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Log in Plain English</span>
        </button>

        <button
          onClick={toggleTheme}
          className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-850 hover:border-slate-700 transition-colors"
          aria-label="Toggle dark/light theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-xl p-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-emerald-400 border border-slate-700">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline font-medium text-xs max-w-[100px] truncate">{user.name}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
