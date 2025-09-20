"use client";

import Link from "next/link";

export default function BestPracticesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Best Practices for Using VinylFunders</h1>
      <p className="mb-4 text-lg text-neutral-700 dark:text-neutral-200">
        Follow these best practices to get the most out of your experience on our platform, whether you&apos;re an artist, label, or fan.
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">1. Getting Started</h2>
        <ul className="list-disc ml-6">
          <li>Create and verify your account with accurate information.</li>
          <li>Set up your profile and record label details in your account settings.</li>
          <li>Read our <Link href="/help-center#faq" className="text-primary-600 underline">FAQ</Link> for quick answers.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2. Mastering & Preparation</h2>
        <ul className="list-disc ml-6">
          <li>Follow our <Link href="/mastering" className="text-primary-600 underline">Mastering & Preparation</Link> guide for vinyl-specific requirements.</li>
          <li>Leave headroom and ensure your audio is free from clipping.</li>
          <li>Use professional mastering for best results.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3. Uploading Your Music</h2>
        <ul className="list-disc ml-6">
          <li>Prepare high-quality audio files and artwork (see <Link href="/mastering" className="text-primary-600 underline">Mastering & Preparation</Link>).</li>
          <li>Use clear, descriptive album and track names.</li>
          <li>Double-check your metadata before submitting.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">4. Running a PreSale</h2>
        <ul className="list-disc ml-6">
          <li>Set realistic target orders and pricing for your audience.</li>
          <li>Promote your PreSale on social media and to your mailing list.</li>
          <li>Keep your fans updated on progress and milestones.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">5. Engaging Your Fans</h2>
        <ul className="list-disc ml-6">
          <li>Respond to comments and questions on your album page.</li>
          <li>Share behind-the-scenes content and updates.</li>
          <li>Encourage fans to join your PreSale early for exclusive perks.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">6. Order Fulfillment & Shipping</h2>
        <ul className="list-disc ml-6">
          <li>We will use proper vinyl mailers and packaging materials.</li>
          <li>Provide tracking information for all shipments.</li>
          <li>Communicate clearly about shipping timelines and delays.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">7. Support & Community</h2>
        <ul className="list-disc ml-6">
          <li>Reach out to our <Link href="/contact" className="text-primary-600 underline">Support</Link> team for help.</li>
          <li>Participate in the <Link href="/forum" className="text-primary-600 underline">Discussion Forums</Link> to connect with other artists and fans.</li>
          <li>Review our <Link href="/code-of-conduct" className="text-primary-600 underline">Code of Conduct</Link> for a positive experience.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">8. Useful Resources</h2>
        <ul className="list-disc ml-6">
          <li><Link href="/seller-guide" className="text-primary-600 underline">Seller Guide</Link></li>
          <li><Link href="/mastering" className="text-primary-600 underline">Mastering & Preparation</Link></li>
        </ul>
      </section>

      <div className="mt-10">
        <Link href="/" className="text-primary-600 underline">&larr; Back to Home</Link>
      </div>
    </div>
  );
} 