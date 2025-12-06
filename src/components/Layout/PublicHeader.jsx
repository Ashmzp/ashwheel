import React from 'react';
    import { Link, useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { motion } from 'framer-motion';
    import { LogIn, Wrench, Info, MessageSquare, Star, Zap } from 'lucide-react';
    import { useThemeStore } from '@/stores/themeStore';
    import { Moon, Sun } from 'lucide-react';
    import AnimatedLogo from '@/components/AnimatedLogo';

    const PublicHeader = () => {
      const { theme, setTheme } = useThemeStore();
      const navigate = useNavigate();

      const handleNavClick = (e, path) => {
        e.preventDefault();
        if (path.startsWith('/#')) {
          const targetId = path.substring(2);
          if (window.location.pathname === '/') {
            const element = document.getElementById(targetId);
            if (element) {
              const headerOffset = 80;
              const elementPosition = element.getBoundingClientRect().top;
              const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
              window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
              });
            }
          } else {
            navigate(`/${path.substring(1)}`);
          }
        } else {
          navigate(path);
        }
      };

      return (
        <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
                <AnimatedLogo className="h-12 w-auto" isLink={false} />
            </Link>
            <nav className="flex items-center gap-1">
                <Button variant="ghost" onClick={(e) => handleNavClick(e, '/#tools')} className="hidden sm:flex"><Wrench className="mr-2 h-4 w-4" /> Tools <span className="ml-1 text-xs text-green-500">(Free)</span></Button>
                <Button variant="ghost" asChild>
                  <Link to="/ashwheel-pro" className="relative">
                    <Zap className="mr-2 h-4 w-4 text-yellow-400" /> 
                    <span className="hidden sm:inline">Ashwheel Pro</span>
                    <span className="sm:hidden">Pro</span>
                    <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-400 text-black">SaaS</span>
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="hidden md:flex"><Link to="/about"><Info className="mr-2 h-4 w-4" /> About</Link></Button>
                <Button variant="ghost" asChild className="hidden md:flex"><Link to="/contact"><MessageSquare className="mr-2 h-4 w-4" /> Contact</Link></Button>
                <Button variant="ghost" asChild className="hidden lg:flex"><Link to="/feedback"><Star className="mr-2 h-4 w-4" /> Feedback</Link></Button>
            </nav>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Button asChild>
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            </motion.div>
          </div>
        </header>
      );
    };

    export default PublicHeader;