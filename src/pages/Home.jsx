import { Link } from "react-router-dom";
import PollCard from "../components/PollCard";

// Demo poll for the homepage
const demoPoll = {
  id: "demo",
  image_a_url:
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop",
  image_b_url:
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=600&fit=crop",
  context: "Date Night",
  votes_a: 67,
  votes_b: 33,
};

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="font-geist text-3xl font-bold text-gray-900 dark:text-gray-100">
          Which outfit looks better?
        </h1>
        <p className="font-geist text-gray-600 dark:text-gray-400">
          Get honest opinions from others.
          <br />
          Post anonymously, vote honestly.
        </p>
      </div>

      {/* Demo poll */}
      <div className="space-y-2">
        <PollCard poll={demoPoll} showResults={true} />
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            to="/create"
            className="font-geist block w-full py-4 px-6 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-center transition-colors"
          >
            Post Your Outfit Poll
          </Link>
          <Link
            to="/vote"
            className="font-geist block w-full py-4 px-6 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-center border-2 border-gray-200 dark:border-gray-700 transition-colors"
          >
            Help Others Choose
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-4">
        <h2 className="font-geist text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <Step
            number={1}
            title="Upload two outfits"
            description="Share two looks you're deciding between"
          />
          <Step
            number={2}
            title="Get votes from others"
            description="Post your outfit and let others help you decide"
          />
          <Step
            number={3}
            title="See the winner"
            description="Results revealed when your poll expires"
          />
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 md:flex-col md:items-center md:text-center md:p-6">
      <div className="font-geist w-8 h-8 md:w-12 md:h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm md:text-lg shrink-0">
        {number}
      </div>
      <div>
        <h3 className="font-geist font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="font-geist text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}
