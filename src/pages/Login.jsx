import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Get the redirect path from location state, or default to home
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message || "Failed to sign in");
        showToast("Failed to sign in", "error");
      } else {
        showToast("Welcome back!", "success");
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An unexpected error occurred");
      showToast("Failed to sign in", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="font-geist text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back
        </h1>
        <p className="font-geist text-gray-500 dark:text-gray-400 mt-2">
          Sign in to access your polls and history
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="font-geist block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="font-geist w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="font-geist block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="font-geist w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Your password"
          />
        </div>

        {error && (
          <div className="font-geist p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="font-geist w-full py-3 px-6 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="text-center space-y-3">
        <Link
          to="/forgot-password"
          className="font-geist text-sm text-primary hover:underline"
        >
          Forgot your password?
        </Link>

        <p className="font-geist text-gray-500 dark:text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
