export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

export function applyFontSize(size) {
  const root = document.documentElement;
  const sizeMap = {
    kichik: '14px',
    medium: '16px',
    katta: '18px',
  };
  root.style.setProperty('--font-size-base', sizeMap[size] || '16px');
  root.style.fontSize = sizeMap[size] || '16px';
}
