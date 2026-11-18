import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquareCode,
  Dumbbell,
  Utensils,
  Moon,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chat', label: 'AI Coach', icon: MessageSquareCode },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/nutrition', label: 'Nutrition', icon: Utensils },
  { to: '/recovery', label: 'Recovery & Sleep', icon: Moon },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar = () => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#E5EDE7] bg-white/70 p-4 shrink-0 transition-colors duration-200 backdrop-blur-md shadow-sm">
        <nav className="flex flex-col gap-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#DCEFE3] text-[#263D32] border border-[#A8D5B5]/60 shadow-sm translate-x-1'
                      : 'text-[#77847C] hover:text-[#263D32] hover:bg-[#EDF5EF]'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-[#E5EDE7] bg-white/95 px-2 backdrop-blur-md shadow-lg"
        aria-label="Mobile Bottom Navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[48px] min-h-[48px] py-1 text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-[#6BA985] font-bold' : 'text-[#77847C] hover:text-[#263D32]'
                }`
              }
              aria-label={item.label}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
