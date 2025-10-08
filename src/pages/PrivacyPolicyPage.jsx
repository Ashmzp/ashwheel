import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const PrivacyPolicyPage = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Ashwheel</title>
        <meta name="description" content="Privacy Policy for Ashwheel, detailing how we handle your data, uploaded files for processing, and protect your privacy when using our online tools." />
        <meta name="keywords" content="privacy policy, ashwheel, data protection, user privacy, file security, online tools privacy"/>
      </Helmet>
      <div className="bg-background text-foreground">
        <main className="container mx-auto px-4 py-8 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl mx-auto"
          >
            <div className="prose dark:prose-invert max-w-none">
                <h1>Privacy Policy for Ashwheel</h1>
                <p><strong>Last Updated:</strong> {new Date("2025-09-23").toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                
                <h2>1. Introduction</h2>
                <p>Welcome to Ashwheel ("we," "our," or "us"). Ashwheel is a startup that provides a suite of online tools. We are committed to protecting your privacy and handling your data in an open and transparent manner. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and tools (collectively, the "Services").</p>

                <h2>2. Information We Collect</h2>
                <p>We collect information to provide and improve our Services. The types of information we collect are:</p>
                <ul>
                  <li><strong>Uploaded Files and Data:</strong> When you use our tools (e.g., PDF Merger, QR Code Generator), you may upload files or enter data. This content is processed on our servers solely to perform the requested function.</li>
                  <li><strong>Feedback Information:</strong> When you submit feedback, we may collect your name, comment, and rating. Providing your email is optional.</li>
                  <li><strong>Contact Form Data:</strong> If you contact us via our contact form, we collect your name, email address, and the content of your message.</li>
                  <li><strong>Usage Data:</strong> We automatically collect non-personally identifiable information, such as your IP address, browser type, pages visited, and time spent on those pages, to monitor and analyze the use of our Service.</li>
                </ul>

                <h2>3. How We Use Your Information</h2>
                <p>We use the collected information for various purposes:</p>
                <ul>
                  <li>To provide, operate, and maintain our Services.</li>
                  <li>To process the files and data you submit through our tools.</li>
                  <li>To display public feedback and improve our services.</li>
                  <li>To respond to your inquiries and provide customer support.</li>
                  <li>To monitor usage, prevent fraud, and for analytics.</li>
                </ul>

                <h2>4. File Handling and Data Security</h2>
                <p>Your privacy and data security are our highest priorities. We implement the following measures:</p>
                <ul>
                  <li><strong>Temporary Storage:</strong> All user-uploaded files and data entered into our tools are stored on our servers only for the duration required to perform the operation.</li>
                  <li><strong>Automatic Deletion:</strong> All processed files and their outputs are automatically and permanently deleted from our servers within 1-2 hours. We do not create backups of your files.</li>
                  <li><strong>Secure Transmission:</strong> All data transfers between your browser and our servers are encrypted using SSL/TLS (HTTPS).</li>
                </ul>

                <h2>5. Data Retention Policy</h2>
                <p>We retain your information only for as long as necessary for the purposes set out in this Privacy Policy.</p>
                <ul>
                    <li><strong>Uploaded Files:</strong> Automatically deleted from our servers within 1-2 hours after processing.</li>
                    <li><strong>Feedback Data:</strong> Retained as long as the feedback is displayed on our website. You can request its deletion at any time.</li>
                    <li><strong>Contact Emails:</strong> Retained for a limited period (e.g., up to 6 months) to ensure we can address your queries effectively, after which they are deleted.</li>
                </ul>

                <h2>6. Cookies and Third-Party Analytics</h2>
                <p>We use cookies for basic site functionality. We also use third-party analytics services like Google Analytics to help us understand our website traffic. This service may collect information such as your IP address and browsing behavior. We do not share your personal data or uploaded files with analytics providers.</p>

                <h2>7. Third-Party Sharing</h2>
                <p>We do not sell, trade, or rent your personal identification information to others. We only share aggregated, non-personally identifiable usage data with trusted third parties like Google Analytics for analytical purposes. We may disclose your information if required by law or in response to valid requests by public authorities.</p>

                <h2>8. Children’s Privacy</h2>
                <p>Our Services are not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If we become aware that we have collected personal data from a child under 13, we will take steps to delete that information from our servers.</p>

                <h2>9. Your Rights</h2>
                <p>You have the right to access, update, or request deletion of your personal information. You can:</p>
                <ul>
                    <li>Request a copy of the feedback or contact information you have provided.</li>
                    <li>Request the deletion of your feedback or contact information.</li>
                </ul>
                <p>To exercise these rights, please contact our Grievance Officer.</p>

                <h2>10. Changes to This Privacy Policy</h2>
                <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.</p>

                <h2>11. Grievance Officer and Contact Information</h2>
                <p>In accordance with the Information Technology Act 2000 and rules made thereunder, the name and contact details of the Grievance Officer are provided below:</p>
                <ul>
                    <li><strong>Email:</strong> <a href="mailto:support@ashwheel.com">support@ashwheel.com</a></li>
                </ul>
                <p>If you have any questions or grievances about this Privacy Policy, please contact us.</p>

                <h2>12. Governing Law and Jurisdiction</h2>
                <p>This Privacy Policy is governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with this policy shall be subject to the exclusive jurisdiction of the courts in Mirzapur, Uttar Pradesh, India.</p>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;