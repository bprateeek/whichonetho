import { useMetaTags } from '../hooks/useMetaTags'

export default function Terms() {
  useMetaTags({
    title: 'Terms of Service | WhichOneTho',
    description: 'Terms of Service for WhichOneTho - Rules and guidelines for using our platform.',
  })

  return (
    <div className="space-y-6">
      <h1 className="font-geist text-2xl font-bold text-gray-900 dark:text-white">
        Terms of Service
      </h1>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-gray-600 dark:text-gray-400">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Acceptance of Terms
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            By using WhichOneTho, you agree to these Terms of Service. If you do not agree, please do not use our service.
          </p>
        </section>

        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Use of Service
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            WhichOneTho allows you to:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
            <li>Upload outfit photos for others to vote on</li>
            <li>Vote on other users' outfit polls</li>
            <li>View statistics and results</li>
          </ul>
        </section>

        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Content Guidelines
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You agree not to upload content that:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
            <li>Contains nudity or sexually explicit material</li>
            <li>Is offensive, hateful, or discriminatory</li>
            <li>Violates any laws or regulations</li>
            <li>Infringes on others' intellectual property rights</li>
            <li>Contains personal information of others without consent</li>
          </ul>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            We reserve the right to remove content that violates these guidelines and to suspend accounts that repeatedly violate our terms.
          </p>
        </section>

        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Intellectual Property
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You retain ownership of the images you upload. By uploading, you grant WhichOneTho a license to display your content on our platform.
          </p>
        </section>

        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Disclaimer
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            WhichOneTho is provided "as is" without warranties of any kind. We are not responsible for user-generated content or decisions made based on poll results.
          </p>
        </section>

        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Contact Us
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            If you have questions about these Terms, please contact us at{' '}
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
