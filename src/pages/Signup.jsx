import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../lib/toast";
import { validateUsername, checkUsernameAvailable } from "../services/auth";
import { migrateAnonymousHistory } from "../services/migration";

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Username validation state
  const [usernameError, setUsernameError] = useState(null);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Debounced username availability check
  useEffect(() => {
    if (!username) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    // First validate format
    const { valid, error: validationError } = validateUsername(username);
    if (!valid) {
      setUsernameError(validationError);
      setUsernameAvailable(null);
      return;
    }

    setUsernameError(null);
    setCheckingUsername(true);

    const timer = setTimeout(async () => {
      const available = await checkUsernameAvailable(username);
      setUsernameAvailable(available);
      setCheckingUsername(false);
      if (!available) {
        setUsernameError("Username is already taken");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate password match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Validate username
    const { valid, error: validationError } = validateUsername(username);
    if (!valid) {
      setError(validationError);
      return;
    }

    if (!usernameAvailable) {
      setError("Username is not available");
      return;
    }

    setIsSubmitting(true);

    try {
      const { user, error: signUpError } = await signUp(
        email,
        password,
        username
      );

      if (signUpError) {
        setError(signUpError.message || "Failed to create account");
        toast.error("Failed to create account");
      } else if (user) {
        // Migrate anonymous history to the new user
        try {
          await migrateAnonymousHistory(user.id);
        } catch (migrationError) {
          console.error("Failed to migrate history:", migrationError);
          // Don't block signup on migration failure
        }

        toast.success("Account created successfully!");
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError("An unexpected error occurred");
      toast.error("Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUsernameStatus = () => {
    if (!username) return null;
    if (checkingUsername) return "checking";
    if (usernameError) return "error";
    if (usernameAvailable) return "available";
    return null;
  };

  const usernameStatus = getUsernameStatus();

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="font-geist text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Create an account
        </h1>
        <p className="font-geist text-gray-500 dark:text-gray-400 mt-2">
          Save your polls and access them from any device
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username field */}
        <div className="space-y-2">
          <label
            htmlFor="username"
            className="font-geist block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              @
            </span>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
              }
              required
              autoComplete="username"
              className={`font-geist w-full pl-8 pr-10 py-3 rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                usernameStatus === "error"
                  ? "border-red-500 dark:border-red-500"
                  : usernameStatus === "available"
                  ? "border-green-500 dark:border-green-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              placeholder="your_username"
            />
            {usernameStatus && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && (
                  <svg
                    className="animate-spin h-5 w-5 text-gray-400"
                    viewBox="0 0 24 24"
                  >
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
                {usernameStatus === "available" && (
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {usernameStatus === "error" && (
                  <svg
                    className="h-5 w-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </span>
            )}
          </div>
          {usernameError && (
            <p className="font-geist text-sm text-red-600 dark:text-red-400">
              {usernameError}
            </p>
          )}
          <p className="font-geist text-xs text-gray-500 dark:text-gray-400">
            This will be your permanent username shown on polls
          </p>
        </div>

        {/* Email field */}
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

        {/* Password field */}
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
            autoComplete="new-password"
            minLength={6}
            className="font-geist w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="At least 6 characters"
          />
        </div>

        {/* Confirm password field */}
        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="font-geist block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="font-geist w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Confirm your password"
          />
        </div>

        {error && (
          <div className="font-geist p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !usernameAvailable}
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
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="font-geist text-center text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
