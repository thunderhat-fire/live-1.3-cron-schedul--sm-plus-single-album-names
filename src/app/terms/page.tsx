import React from 'react';
import Heading from '@/shared/Heading/Heading';

const TermsPage = () => {
  return (
    <div className="container my-16 lg:my-24">
      <Heading desc={null}>Terms and Conditions</Heading>
      
      <div className="prose dark:prose-invert max-w-none">
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          Welcome to VinylFunders™. These Terms and Conditions govern your use of our website and services. By accessing or using VinylFunders™, you agree to be bound by these terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Definitions</h2>
        <ul className="list-disc pl-6 mt-4">
          <li>&quot;Platform&quot; refers to the VinylFunders™ website and services</li>
          <li>&quot;User,&quot; &quot;you,&quot; and &quot;your&quot; refer to users of the Platform</li>
          <li>&quot;We,&quot; &quot;us,&quot; and &quot;our&quot; refer to VinylFunders™</li>
          <li>&quot;Content&quot; refers to all material posted on the Platform</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Account Registration</h2>
        <p>
          To use certain features of the Platform, you must register for an account. You agree to:
        </p>
        <ul className="list-disc pl-6 mt-4">
          <li>Provide accurate and complete information</li>
          <li>Maintain the security of your account credentials</li>
          <li>Promptly update any changes to your information</li>
          <li>Accept responsibility for all activities under your account</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Marketplace Rules</h2>
        <p>When using our marketplace, you agree to:</p>
        <ul className="list-disc pl-6 mt-4">
          <li>List only authentic vinyl records</li>
          <li>Provide accurate descriptions of items</li>
          <li>Honor your commitments as a buyer or seller</li>
          <li>Comply with all applicable laws and regulations</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Prohibited Activities</h2>
        <p>Users are prohibited from:</p>
        <ul className="list-disc pl-6 mt-4">
          <li>Posting false, misleading, or fraudulent content</li>
          <li>Violating intellectual property rights</li>
          <li>Engaging in price manipulation or market abuse</li>
          <li>Using the platform for illegal activities</li>
          <li>Harassing or abusing other users</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Fees and Payments</h2>
        <p>
          We charge fees for certain services. You agree to pay all applicable fees and taxes. All fees are non-refundable unless otherwise stated.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Intellectual Property</h2>
        <p>
          All content on the Platform, including logos, designs, and software, is our property or licensed to us. Users retain ownership of their content but grant us a license to use it on the Platform.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Privacy and Data Protection</h2>
        <p>
          Your use of the Platform is also governed by our Privacy Policy and GDPR Statement. Please review these documents to understand how we handle your personal information.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Limitation of Liability</h2>
        <p>
          We provide the Platform &quot;as is&quot; without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Platform.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Dispute Resolution</h2>
        <p>
          Any disputes will be resolved through binding arbitration in accordance with UK law. You agree to resolve disputes individually, not as part of a class action.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Termination</h2>
        <p>
          We may terminate or suspend your account for violations of these terms. You may terminate your account at any time by contacting us.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Changes to Terms</h2>
        <p>
          We may modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of the modified terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact Information</h2>
        <p>
          For questions about these terms, please contact us at:
        </p>
        <p className="mt-4">
          Email: release@vinylfunders.com
        </p>

        <p className="mt-8 text-sm text-neutral-500">
          Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

export default TermsPage; 