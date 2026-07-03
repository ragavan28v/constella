import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './app/router';
import { useUIStore } from './stores/uiStore';
import './styles/globals.css';
import './styles/editor.css';

const App: React.FC = () => {
  const { theme } = useUIStore();

  useEffect(() => {
    // Sync initial theme class
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
};

export default App;
