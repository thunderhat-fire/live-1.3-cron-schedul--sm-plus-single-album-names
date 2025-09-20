import React from 'react';
import Heading from '@/shared/Heading/Heading';

const DataProtectionPage = () => {
  return (
    <div className="container my-16 lg:my-24">
      <Heading>Data Protection & GDPR Statement</Heading>
      
      <div className="prose dark:prose-invert max-w-none">
        <h2 className="text-2xl font-semibold mt-8 mb-4">Introduction</h2>
        <p>
          VinylFunders™ (we, our, us) is committed to protecting and respecting your privacy. This policy explains how we collect, process, and safeguard your personal data in accordance with the General Data Protection Regulation (GDPR) and other applicable data protection laws.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>
        <p>We may collect and process the following information:</p>
        <ul className="list-disc pl-6 mt-4">
          <li>Name and contact information (email address, phone number)</li>
          <li>Account credentials</li>
          <li>Payment and transaction details</li>
          <li>Shipping addresses</li>
          <li>Communication preferences</li>
          <li>Technical data (IP address, browser type, device information)</li>
          <li>Usage data (how you interact with our platform)</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
        <p>We use your personal data for the following purposes:</p>
        <ul className="list-disc pl-6 mt-4">
          <li>To provide and maintain our services</li>
          <li>To process and fulfill your orders</li>
          <li>To communicate with you about your orders and account</li>
          <li>To improve our platform and user experience</li>
          <li>To detect and prevent fraud</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Legal Basis for Processing</h2>
        <p>We process your personal data on the following legal grounds:</p>
        <ul className="list-disc pl-6 mt-4">
          <li>Performance of a contract (when you make a purchase)</li>
          <li>Legal obligation (for tax and business records)</li>
          <li>Legitimate interests (to improve our services)</li>
          <li>Your consent (for marketing communications)</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Data Retention</h2>
        <p>
          We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, including legal, accounting, or reporting requirements. When data is no longer needed, it is securely deleted or anonymized.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Your Rights</h2>
        <p>Under GDPR, you have the following rights:</p>
        <ul className="list-disc pl-6 mt-4">
          <li>Right to access your personal data</li>
          <li>Right to rectification of inaccurate data</li>
          <li>Right to erasure (right to be forgotten)</li>
          <li>Right to restrict processing</li>
          <li>Right to data portability</li>
          <li>Right to object to processing</li>
          <li>Right to withdraw consent</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include:
        </p>
        <ul className="list-disc pl-6 mt-4">
          <li>Encryption of data in transit and at rest</li>
          <li>Regular security assessments</li>
          <li>Access controls and authentication</li>
          <li>Staff training on data protection</li>
          <li>Incident response procedures</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">International Transfers</h2>
        <p>
          We primarily process data within the United Kingdom and European Economic Area (EEA). If we transfer data outside these regions, we ensure appropriate safeguards are in place through standard contractual clauses or other legal mechanisms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Cookies and Tracking</h2>
        <p>
          We use cookies and similar tracking technologies to enhance your browsing experience. You can control these through your browser settings. For detailed information, please see our Cookie Policy.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
        <p>
          For any questions about this policy or our data protection practices, please contact our Data Protection Officer at:
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

export default DataProtectionPage; 