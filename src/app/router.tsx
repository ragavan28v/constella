import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import WelcomePage from '../pages/WelcomePage';
import HomePage from '../pages/HomePage';
import SpacePage from '../pages/SpacePage';
import SettingsPage from '../pages/SettingsPage';
import ArchivePage from '../pages/ArchivePage';
import { useSpaceStore } from '../stores/spaceStore';
import { useAuthStore } from '../stores/authStore';
import { searchIndexManager } from '../search/searchIndex';
import { subscribeAuthState } from '../services/firebase';
import { cloudStorageEngine } from '../services/storage';

export const AppRouter: React.FC = () => {
  const { spaces, loadSpaces, loading } = useSpaceStore();
  const { user, authReady, setUser, setAuthReady } = useAuthStore();
  const [initChecked, setInitChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authReady) {
      return;
    }

    const initializeApp = async () => {
      if (!user) {
        setInitChecked(true);
        return;
      }

      // Only try to connect if already connected (reconnect) or if we have a token
      // Don't attempt initial connection here; that's handled in WelcomePage after sign-in
      if (cloudStorageEngine.isConnected()) {
        try {
          await searchIndexManager.initialize();
          await loadSpaces();
        } catch (error) {
          console.error('App initialization failed', error);
        } finally {
          setInitChecked(true);
        }
        return;
      }

      // If we have a user but storage is not connected, don't try to connect here.
      // The connection should have happened in WelcomePage. This prevents errors
      // when there's no token yet or the user needs to go through the welcome flow.
      setInitChecked(true);
    };

    initializeApp();
  }, [authReady, user, loadSpaces]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      unsubscribe = await subscribeAuthState((firebaseUser) => {
        setUser(firebaseUser);
        setAuthReady(true);
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [setAuthReady, setUser]);

  useEffect(() => {
    if (!authReady || !initChecked || loading) {
      return;
    }

    const isWelcomeRoute = location.pathname === '/welcome';
    const isHomeRoute = location.pathname === '/home';
    const isSettingsRoute = location.pathname === '/settings';
    const isArchiveRoute = location.pathname === '/archive';

    if (!user && !isWelcomeRoute) {
      navigate('/welcome');
      return;
    }

    // If user exists but is on welcome page and storage is already connected,
    // move them to home. Otherwise stay on welcome to complete connection.
    if (user && isWelcomeRoute && cloudStorageEngine.isConnected()) {
      navigate('/home');
      return;
    }

    if (spaces.length === 0 && !isWelcomeRoute && !isHomeRoute && !isSettingsRoute && !isArchiveRoute) {
      navigate('/home');
    }
  }, [spaces, user, initChecked, authReady, loading, location.pathname, navigate]);

  if (!initChecked || !authReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-app-bg text-text-primary">
        <div className="text-center">
          <div className="text-lg font-medium animate-pulse">Entering Constella...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/spaces/:id" element={<SpacePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/archive" element={<ArchivePage />} />
      <Route path="*" element={<Navigate to={spaces.length > 0 ? "/home" : "/welcome"} replace />} />
    </Routes>
  );
};
