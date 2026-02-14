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
      <footer className="bg-gray-50 dark:bg-gray-950 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] mt-auto">
        <div className="font-geist max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4">
          {/* Links and Social row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-2">
            <div className="flex items-center gap-3 text-xs">
              <Link to="/privacy" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">Privacy</Link>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <Link to="/terms" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">Terms</Link>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <a href="mailto:support@whichonetho.com" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">Contact</a>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <a href="mailto:support@whichonetho.com?subject=Bug%20Report" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">Report Bug</a>
            </div>
            <div className="flex items-center gap-1">
              <span className="p-1.5 text-gray-400 dark:text-gray-500" title="Coming soon">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </span>
              <span className="p-1.5 text-gray-400 dark:text-gray-500" title="Coming soon">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </span>
              <span className="p-1.5 text-gray-400 dark:text-gray-500" title="Coming soon">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
              </span>
            </div>
          </div>
          {/* Copyright */}
          <div className="text-center text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} WhichOneTho
          </div>
        </div>
      </footer>
    </div>
  );
}
