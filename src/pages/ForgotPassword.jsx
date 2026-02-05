import { useState } from "react";
import { Link } from "react-router-dom";
import { resetPassword } from "../services/auth";
import { toast } from "../lib/toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: resetError } = await resetPassword(email);

      if (resetError) {
        setError(resetError.message || "Failed to send reset email");
        toast.error("Failed to send reset email");
      } else {
        setIsSubmitted(true);
        toast.success("Reset email sent!");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("An unexpected error occurred");
      toast.error("Failed to send reset email");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div>
          <h1 className="font-geist text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Check your email
          </h1>
          <p className="font-geist text-gray-500 dark:text-gray-400 mt-2">
            We've sent a password reset link to{" "}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {email}
            </span>
          </p>
        </div>

        <div className="space-y-3">
          <p className="font-geist text-sm text-gray-500 dark:text-gray-400">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="font-geist text-primary hover:underline"
          >
            Try a different email
          </button>
        </div>

        <Link
          to="/login"
          className="font-geist inline-block py-3 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="font-geist text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Reset your password
        </h1>
        <p className="font-geist text-gray-500 dark:text-gray-400 mt-2">
          Enter your email and we'll send you a reset link
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
              Sending...
            </span>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      <p className="font-geist text-center text-gray-500 dark:text-gray-400">
        Remember your password?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
