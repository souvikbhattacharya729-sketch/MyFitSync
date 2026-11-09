import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFitness } from '../../context/FitnessContext';
import { Activity } from 'lucide-react';

export const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useFitness();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0B0F17] text-slate-100">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Activity className="h-6 w-6 animate-spin" />
          </div>
          <span className="text-sm font-medium text-slate-400">Loading your fitness data...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
