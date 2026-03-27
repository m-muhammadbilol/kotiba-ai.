import React from 'react';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between px-4 pt-14 pb-4 sticky top-0 bg-[var(--bg)] z-10">
      <div>
        <h1 className="text-xl font-extrabold text-[var(--text)] tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
