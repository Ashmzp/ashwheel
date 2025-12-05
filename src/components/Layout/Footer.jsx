import React from 'react';
    import { Link, useNavigate } from 'react-router-dom';
    import { Facebook, Instagram, Mail, ShieldCheck, Linkedin, Youtube, Twitter } from 'lucide-react';

    const Footer = () => {
      const navigate = useNavigate();

      const handleToolsClick = (e) => {
        e.preventDefault();
        if (window.location.pathname === '/') {
          const toolsSection = document.getElementById('tools');
          if (toolsSection) {
            toolsSection.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          navigate('/#tools');
        }
      };
      
      const socialLinks = [
        { name: 'Facebook', icon: <Facebook className="w-5 h-5" />, url: 'https://www.facebook.com/share/158pNG3ihR9/' },
        { name: 'Instagram', icon: <Instagram className="w-5 h-5" />, url: 'https://www.instagram.com/ash.mzp' },
        { name: 'X', icon: <Twitter className="w-5 h-5" />, url: 'https://x.com/ash_mzp' },
        { name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, url: 'https://www.linkedin.com/in/ashish-kumar-mzp/' },
        { name: 'YouTube', icon: <Youtube className="w-5 h-5" />, url: 'https://youtube.com' },
      ];

      return (
        <footer className="bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* About Section */}
              <div className="md:col-span-2 lg:col-span-1">
                <h3 className="text-lg font-bold">Ashwheel</h3>
                <p className="mt-4 text-sm text-secondary-foreground/80">
                  Ashwheel is a comprehensive platform offering 50+ productivity tools (PDF, image, video editing) and Ashwheel Pro—a complete management system for automobile showrooms and workshops with GST invoicing, inventory tracking, and business analytics.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold tracking-wide uppercase">Quick Links</h4>
                <ul className="mt-4 space-y-2">
                  <li><Link to="/" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">Home</Link></li>
                  <li><a href="/#tools" onClick={handleToolsClick} className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">Tools</a></li>
                   <li><Link to="/about" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">About Us</Link></li>
                  <li><Link to="/contact" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">Contact Us</Link></li>
                  <li><Link to="/feedback" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">Feedback</Link></li>
                </ul>
              </div>

              {/* Legal Links */}
              <div>
                <h4 className="font-semibold tracking-wide uppercase">Legal</h4>
                <ul className="mt-4 space-y-2">
                  <li><Link to="/privacy-policy" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms-conditions" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">Terms & Conditions</Link></li>
                </ul>
              </div>

              {/* Contact & Social */}
              <div>
                <h4 className="font-semibold tracking-wide uppercase">Stay Connected</h4>
                <div className="mt-4">
                  <a href="mailto:support@ashwheel.com" className="flex items-center gap-2 text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                    <Mail className="w-4 h-4" />
                    <span>support@ashwheel.com</span>
                  </a>
                </div>
                <p className="mt-4 text-sm text-secondary-foreground/80">Stay updated with our new tools and features.</p>
                <div className="flex mt-4 space-x-4">
                  {socialLinks.map(social => (
                    <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                      {social.icon}
                      <span className="sr-only">{social.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-secondary-foreground/20 flex flex-col sm:flex-row justify-between items-center">
              <p className="text-sm text-secondary-foreground/60">
                &copy; {new Date().getFullYear()} Ashwheel. All Rights Reserved.
              </p>
              <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <span className="text-xs text-secondary-foreground/60">Built with ❤️ in India</span>
                <div className="flex items-center gap-1 text-xs text-green-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>SSL Secure</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      );
    };

    export default Footer;