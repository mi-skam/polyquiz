import { useDarkMode } from '../contexts/DarkModeContext';

export default function ThemeToggle() {
  const { theme, actualTheme, toggleTheme } = useDarkMode();

  const getThemeIcon = () => {
    if (theme === 'system') {
      return actualTheme === 'dark' ? '🌙' : '☀️';
    }
    return theme === 'dark' ? '🌙' : '☀️';
  };

  const getThemeLabel = () => {
    if (theme === 'system') {
      return `Auto (${actualTheme})`;
    }
    return theme === 'dark' ? 'Dark' : 'Light';
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      title={`Current theme: ${getThemeLabel()}. Click to cycle through light → dark → auto`}
    >
      <span className="text-base">{getThemeIcon()}</span>
      <span className="text-gray-700 dark:text-gray-300 text-xs">
        {theme === 'system' ? 'Auto' : theme}
      </span>
    </button>
  );
}