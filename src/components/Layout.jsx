import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Layout({ children }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-primary"
          >
            <svg
              className="w-7 h-7"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="10"
                y="6"
                width="18"
                height="22"
                rx="3"
                fill="#EC4899"
                opacity="0.85"
              />
              <rect
                x="4"
                y="4"
                width="18"
                height="22"
                rx="3"
                fill="currentColor"
              />
              <text
                x="13"
                y="20"
                textAnchor="middle"
                fontFamily="Geist,system-ui,sans-serif"
                fontSize="14"
                fontWeight="700"
                fill="white"
              >
                ?
              </text>
            </svg>
            WhichOneTho
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {location.pathname !== "/" && (
              <Link
                to="/"
                className="font-geist text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
              >
                Home
              </Link>
            )}
            <Link
              to="/history"
              className={`text-sm ${
                location.pathname === "/history"
                  ? "font-geist text-primary font-medium"
                  : "font-geist text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              History
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Get honest outfit opinions from the opposite gender
        </div>
      </footer>
    </div>
  );
}
