import React from 'react';
import Heading from '@/shared/Heading/Heading';

const CodeOfConductPage = () => {
  return (
    <div className="container my-16 lg:my-24">
      <Heading>Code of Conduct</Heading>
      
      <div className="prose dark:prose-invert max-w-none">
        <h2 className="text-2xl font-semibold mt-8 mb-4">Our Commitment</h2>
        <p>
          At VinylFunders™, we are committed to providing a welcoming, safe, and inclusive environment for all users of our platform. 
          This Code of Conduct outlines our expectations for participant behavior as well as the consequences for unacceptable behavior.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Expected Behavior</h2>
        <p>All members of our community are expected to:</p>
        <ul className="list-disc pl-6 mt-4">
          <li>Be respectful and considerate in communications</li>
          <li>Exercise empathy and kindness toward other people</li>
          <li>Provide accurate and honest information about vinyl records</li>
          <li>Give and gracefully accept constructive feedback</li>
          <li>Accept responsibility for your actions and their impact</li>
          <li>Focus on what is best for the overall community</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Unacceptable Behavior</h2>
        <p>The following behaviors are considered unacceptable:</p>
        <ul className="list-disc pl-6 mt-4">
          <li>Harassment, discrimination, or intimidation in any form</li>
          <li>Posting false or misleading information about records</li>
          <li>Deliberate misrepresentation of record condition or authenticity</li>
          <li>Spam, trolling, or disruptive behavior</li>
          <li>Unauthorized sharing of others private information</li>
          <li>Any form of hate speech or discriminatory language</li>
          <li>Attempts to manipulate prices or market conditions</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Marketplace Guidelines</h2>
        <p>When buying or selling on our platform:</p>
        <ul className="list-disc pl-6 mt-4">
          <li>Provide accurate descriptions and clear photos of items</li>
          <li>Communicate promptly and professionally</li>
          <li>Honor your commitments and agreements</li>
          <li>Package items appropriately for safe shipping</li>
          <li>Report any issues or concerns promptly</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Enforcement</h2>
        <p>
          Violations of this Code of Conduct may result in temporary or permanent suspension of account privileges, 
          removal of content, or other actions deemed appropriate by VinylFunders™ moderators. We reserve the right 
          to enforce these guidelines at our discretion.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Reporting Guidelines</h2>
        <p>
          If you witness or experience behavior that violates this Code of Conduct, please report it immediately. 
          You can report violations by:
        </p>
        <ul className="list-disc pl-6 mt-4">
          <li>Using the report button on the platform</li>
          <li>Contacting our support team</li>
          <li>Emailing release@vinylfunders.com</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Information</h2>
        <p>
          For questions about this Code of Conduct or to report violations, please contact us at:
        </p>
        <p className="mt-4">
          Email: release@vinylfunders.com<br />
          Phone: 02036274240
        </p>

        <p className="mt-8 text-sm text-neutral-500">
          Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

export default CodeOfConductPage; 