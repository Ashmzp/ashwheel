import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = ({ phoneNumber = "917275277076", message = "Hi, I want Ashwheel Pro demo and pricing" }) => {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.6); }
          70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
        .whatsapp-float {
          animation: pulse 2s infinite;
        }
      `}</style>
      
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float fixed bottom-5 right-5 md:bottom-6 md:right-6 z-[99999] bg-[#25D366] hover:bg-[#20BA5A] text-white w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 pointer-events-auto"
        aria-label="Chat on WhatsApp"
        style={{ position: 'fixed' }}
      >
        <MessageCircle className="w-7 h-7 md:w-8 md:h-8" />
      </a>
    </>
  );
};

export default WhatsAppButton;
