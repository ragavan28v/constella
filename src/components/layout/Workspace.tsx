import React from 'react';

interface WorkspaceProps {
  children: React.ReactNode;
}

export const Workspace: React.FC<WorkspaceProps> = ({ children }) => {
  return (
    <main className="flex-1 h-[calc(100vh-3.5rem-2rem)] overflow-y-auto bg-app-bg px-6 py-6 md:px-8">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {children}
      </div>
    </main>
  );
};
