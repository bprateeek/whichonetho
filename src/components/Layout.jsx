import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, profile, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);


  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-sm relative z-50">
        <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="font-geist flex items-center gap-2 text-xl font-bold text-primary"
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
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme toggle - always visible */}
            <button
              onClick={toggleTheme}
              className="font-geist p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Desktop navigation - hidden on mobile */}
            <div className="hidden sm:flex items-center gap-4">
              {location.pathname !== "/" && (
                <Link
                  to="/"
                  className="font-geist text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                >
                  Home
                </Link>
              )}
              <Link
                to="/stats"
                className={`font-geist text-sm ${
                  location.pathname === "/stats"
                    ? "text-primary font-medium"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Stats
              </Link>
              <Link
                to="/history"
                className={`font-geist text-sm ${
                  location.pathname === "/history"
                    ? "text-primary font-medium"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                History
              </Link>
              {/* Auth UI - Desktop */}
              {!isLoading && (
                isAuthenticated ? (
                  <Link
                    to="/profile"
                    className={`font-geist text-sm flex items-center gap-1.5 ${
                      location.pathname === "/profile"
                        ? "text-primary font-medium"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                      {profile?.username?.[0]?.toUpperCase() || "U"}
                    </span>
                    <span>@{profile?.username || "user"}</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="font-geist text-sm py-1.5 px-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                )
              )}
            </div>

            {/* Mobile hamburger menu */}
            <div className="relative sm:hidden" ref={menuRef}>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {/* Dropdown menu */}
              {mobileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  {location.pathname !== "/" && (
                    <Link
                      to="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Home
                    </Link>
                  )}
                  <Link
                    to="/stats"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 text-base ${
                      location.pathname === "/stats"
                        ? "text-primary font-medium bg-primary/5"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    Stats
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 text-base ${
                      location.pathname === "/history"
                        ? "text-primary font-medium bg-primary/5"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    History
                  </Link>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  {!isLoading && (
                    isAuthenticated ? (
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-4 py-3 text-base ${
                          location.pathname === "/profile"
                            ? "text-primary font-medium bg-primary/5"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                          {profile?.username?.[0]?.toUpperCase() || "U"}
                        </span>
                        @{profile?.username || "user"}
                      </Link>
                    ) : (
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-3 text-base text-primary font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Sign In
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-sm py-4">
        <div className="font-geist max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Get honest outfit opinions from others
        </div>
      </footer>
    </div>
  );
}
