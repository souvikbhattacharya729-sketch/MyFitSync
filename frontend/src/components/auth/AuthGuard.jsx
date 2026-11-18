import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFitness } from '../../context/FitnessContext';
import { Activity } from 'lucide-react';

export const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useFitness();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-sage-bg text-sage-forest">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-mint text-sage-action border border-sage-sage/40 shadow-sm">
            <Activity className="h-6 w-6 animate-spin" />
          </div>
          <span className="text-sm font-semibold text-sage-muted">Loading your fitness data...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
