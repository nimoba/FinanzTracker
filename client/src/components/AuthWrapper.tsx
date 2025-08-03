import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { PasswordForm } from './PasswordForm';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, loading, error, login, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <PasswordForm onLogin={login} loading={loading} error={error || undefined} />;
  }

  return <>{children}</>;
};