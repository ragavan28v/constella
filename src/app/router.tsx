import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import WelcomePage from '../pages/WelcomePage';
import HomePage from '../pages/HomePage';
import SpacePage from '../pages/SpacePage';
import SettingsPage from '../pages/SettingsPage';
import ArchivePage from '../pages/ArchivePage';
import { useSpaceStore } from '../stores/spaceStore';
import { searchIndexManager } from '../search/searchIndex';

export const AppRouter: React.FC = () => {
  const { spaces, loadSpaces, loading } = useSpaceStore();
  const [initChecked, setInitChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize FlexSearch index
      await searchIndexManager.initialize();
      // Load spaces from Dexie
      await loadSpaces();
      setInitChecked(true);
    };
    initializeApp();
  }, [loadSpaces]);

  useEffect(() => {
    if (initChecked && !loading) {
      if (spaces.length === 0) {
        navigate('/welcome');
      }
    }
  }, [spaces, initChecked, loading, navigate]);

  if (!initChecked) {
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
