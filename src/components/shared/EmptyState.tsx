import React from 'react';
import * as Icons from 'lucide-react';

interface EmptyStateProps {
  iconName: keyof typeof Icons;
  heading: string;
  subtext: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName,
  heading,
  subtext,
  actionText,
  onAction
}) => {
  const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-app-surface border border-dashed border-border rounded-xl shadow-sm max-w-md mx-auto my-12">
      {IconComponent && (
        <div className="p-3 bg-app-bg rounded-full mb-4 text-text-tertiary">
          <IconComponent className="w-10 h-10" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-primary mb-1">{heading}</h3>
      <p className="text-sm text-text-secondary mb-6 max-w-xs">{subtext}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
