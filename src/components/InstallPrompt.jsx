import { useState, useEffect } from "react";

const STORAGE_KEY = "installPromptDismissed";

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone) return;

    // Check if user already dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari =
      /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    if (isIOSDevice && isSafari) {
      setIsIOS(true);
      // Show after a short delay
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    // For Android/Chrome - listen for beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after a short delay
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <svg
                className="w-7 h-7 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-geist font-semibold text-gray-900 dark:text-gray-100">
                Add to Home Screen
              </h3>
              <p className="font-geist text-sm text-gray-500 dark:text-gray-400">
                Get the full app experience
              </p>
            </div>
          </div>

          {/* iOS Instructions */}
          {isIOS && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
              <p className="font-geist text-sm text-gray-700 dark:text-gray-300">
                Install this app on your iPhone:
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
                <p className="font-geist text-sm text-gray-600 dark:text-gray-400">
                  Tap the <span className="font-medium">Share</span> button
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <p className="font-geist text-sm text-gray-600 dark:text-gray-400">
                  Then tap{" "}
                  <span className="font-medium">Add to Home Screen</span>
                </p>
              </div>
            </div>
          )}

          {/* Android - simple message */}
          {!isIOS && (
            <p className="font-geist text-sm text-gray-600 dark:text-gray-400">
              Install WhichOneTho for quick access.
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="font-geist flex-1 py-3 px-4 text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Not now
            </button>
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="font-geist flex-1 py-3 px-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors"
              >
                Install
              </button>
            )}
            {isIOS && (
              <button
                onClick={handleDismiss}
                className="font-geist flex-1 py-3 px-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors"
              >
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
