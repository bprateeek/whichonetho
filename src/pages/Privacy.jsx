import { useMetaTags } from '../hooks/useMetaTags'

export default function Privacy() {
  useMetaTags({
    title: 'Privacy Policy | WhichOneTho',
    description: 'Privacy Policy for WhichOneTho - Learn how we handle your data.',
  })

  return (
    <div className="space-y-6">
      <h1 className="font-geist text-2xl font-bold text-gray-900 dark:text-white">
        Privacy Policy
      </h1>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-gray-600 dark:text-gray-400">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Information We Collect
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            WhichOneTho collects minimal information to provide our service. This includes:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
            <li>Images you upload for polls (outfit photos)</li>
            <li>Votes you cast on other users' polls</li>
            <li>Account information if you choose to sign up (email, username)</li>
            <li>Anonymous identifiers to track your activity across sessions</li>
          </ul>
        </section>

        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            How We Use Your Information
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
            <li>Display your polls and collect votes</li>
            <li>Show you polls to vote on</li>
            <li>Provide statistics about your polls and voting history</li>
            <li>Prevent duplicate voting and abuse</li>
          </ul>
        </section>

        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Data Storage
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your data is stored securely using Supabase infrastructure. Images are stored in secure cloud storage. We do not sell your data to third parties.
          </p>
        </section>

        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Contact Us
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a
              href="mailto:support@whichonetho.com"
              className="text-primary hover:underline"
            >
              support@whichonetho.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
