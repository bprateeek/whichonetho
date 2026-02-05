import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center space-y-4 py-16">
      <h1 className="font-geist text-6xl font-bold text-gray-900 dark:text-gray-100">
        404
      </h1>
      <p className="font-geist text-lg text-gray-600 dark:text-gray-400">
        Page not found
      </p>
      <Link
        to="/"
        className="font-geist inline-block mt-4 py-3 px-6 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
