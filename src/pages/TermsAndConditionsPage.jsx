import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const TermsAndConditionsPage = () => {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions - Ashwheel</title>
        <meta name="description" content="Terms and Conditions for using Ashwheel's services and free online tools. Understand your rights and responsibilities when using our platform." />
        <meta name="keywords" content="terms and conditions, terms of service, legal, user agreement, ashwheel rules" />
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
                <h1>Terms and Conditions</h1>
                <p><strong>Last Updated:</strong> {new Date("2025-09-23").toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                <h2>1. Agreement to Terms</h2>
                <p>By accessing or using Ashwheel ("the Service," "we," "us"), you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with any part of the terms, you may not access the Service. These Terms apply to all visitors and users.</p>

                <h2>2. Description of Service</h2>
                <p>Ashwheel provides a collection of free online tools ("Tools"). The Service is provided on an "as-is" and "as available" basis. We reserve the right to modify or discontinue the Service at any time without notice.</p>
                
                <h2>3. User Responsibilities and Conduct</h2>
                <p>You agree to use the Service only for lawful purposes. You are solely responsible for the content you submit. You agree not to use the Service to:</p>
                <ul>
                    <li>Process any content that is unlawful, harmful, or infringes on the rights of others.</li>
                    <li>Upload any material containing malicious code.</li>
                    <li>Interfere with or disrupt the Service.</li>
                </ul>
                <p>Misuse of the service may result in a ban from accessing our tools.</p>

                <h2>4. Age Restriction</h2>
                <p>The Service is intended for users who are at least 13 years old. By using the Service, you represent and warrant that you are at least 13 years of age.</p>

                <h2>5. Intellectual Property</h2>
                <p>The Service and its original content (excluding user-provided content), features, and functionality are the exclusive property of Ashwheel. You retain all ownership rights to the content you upload. By using the tools, you grant us a temporary license to process your content solely for providing the tool's functionality.</p>
                
                <h2>6. Disclaimer of Warranties and Limitation of Liability</h2>
                <p>The Service is provided "as is." We make no warranties regarding the reliability or accuracy of the Service. In no event shall Ashwheel be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
                
                <h2>7. Privacy Policy</h2>
                <p>Your use of the Service is also governed by our <Link to="/privacy-policy">Privacy Policy</Link>, which details how we handle your data. All uploaded files are automatically deleted from our servers after a short period.</p>
                
                <h2>8. Governing Law and Jurisdiction</h2>
                <p>These Terms shall be governed by the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Mirzapur, Uttar Pradesh, India.</p>
                
                <h2>9. Changes to Terms</h2>
                <p>We reserve the right to modify these Terms at any time. By continuing to use the Service after revisions become effective, you agree to be bound by the revised terms.</p>
                
                <h2>10. Contact Us</h2>
                <p>If you have any questions about these Terms, please contact us at <a href="mailto:support@ashwheel.com">support@ashwheel.com</a>.</p>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default TermsAndConditionsPage;