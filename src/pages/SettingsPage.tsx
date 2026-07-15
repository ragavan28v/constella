import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Keyboard, Database } from 'lucide-react';
import { signOutUser } from '../services/firebase';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useUIStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (!confirm('Sign out of your cloud session?')) {
      return;
    }

    await signOutUser();
    navigate('/welcome');
  };

  const shortcuts = [
    { key: 'Ctrl + K', desc: 'Open Global Search overlay' },
    { key: 'Ctrl + N', desc: 'Trigger global Quick Capture' },
    { key: 'Ctrl + Shift + N', desc: 'Open Create New Space Modal' },
    { key: 'Esc', desc: 'Close modals, drawers, and active editors' },
    { key: 'Ctrl + B', desc: 'Bold text (inside BlockEditor)' },
    { key: 'Ctrl + I', desc: 'Italic text (inside BlockEditor)' }
  ];

  return (
    <AppLayout>
      <div className="space-y-8 text-left select-none max-w-3xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Settings</h1>
          <p className="text-xs text-text-secondary mt-0.5">Configure theme preferences and system properties.</p>
        </div>

        {/* Account Settings Section */}
        {user && (
          <section className="bg-app-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-2">
              <Database className="w-4 h-4 text-text-secondary" />
              <span>Cloud Account</span>
            </h2>
            <div className="text-sm text-text-primary">
              <div className="font-semibold">{user.displayName || user.email}</div>
              <div className="text-xs text-text-secondary">{user.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-error hover:bg-error/95 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Sign out
            </button>
          </section>
        )}

        {/* Theme Settings Section */}
        <section className="bg-app-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-2">
            <Sun className="w-4 h-4 text-text-secondary" />
            <span>Appearance & Theme</span>
          </h2>
          <p className="text-xs text-text-secondary">Toggle between light or dark screen themes.</p>
          <div className="flex gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold transition-colors ${
                theme === 'light' 
                  ? 'border-accent bg-accent-light text-accent ring-1 ring-accent' 
                  : 'border-border bg-app-bg text-text-secondary hover:bg-app-hover'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Mode</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold transition-colors ${
                theme === 'dark' 
                  ? 'border-accent bg-accent-light text-accent ring-1 ring-accent' 
                  : 'border-border bg-app-bg text-text-secondary hover:bg-app-hover'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Mode</span>
            </button>
          </div>
        </section>

        {/* Keyboard Shortcuts Section */}
        <section className="bg-app-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-2">
            <Keyboard className="w-4 h-4 text-text-secondary" />
            <span>Keyboard Shortcuts</span>
          </h2>
          <div className="divide-y divide-border">
            {shortcuts.map(sc => (
              <div key={sc.key} className="flex justify-between py-2.5 text-xs">
                <span className="text-text-secondary font-medium">{sc.desc}</span>
                <kbd className="px-2 py-0.5 bg-app-bg border border-border rounded text-[10px] font-bold font-mono text-text-primary">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* Storage Reset Section */}
        <section className="bg-app-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-2">
            <Database className="w-4 h-4 text-text-secondary" />
            <span>Storage Management</span>
          </h2>
          <div className="space-y-2 text-xs text-text-secondary">
            <p>Constella is now cloud-first. There is no local IndexedDB workspace to clear.</p>
            <p>If you want to remove your cloud session, sign out above and disconnect from your Google account.</p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};
export default SettingsPage;
