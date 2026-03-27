import React from 'react';

export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-3xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
        {Icon && <Icon size={28} className="text-surface-400 dark:text-surface-500" />}
      </div>
      <h3 className="font-bold text-surface-700 dark:text-surface-300 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-surface-400 dark:text-surface-500 max-w-xs">{description}</p>
      )}
    </div>
  );
}
