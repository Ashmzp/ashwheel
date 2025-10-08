import React from 'react';
    import { useNavigate, Link } from 'react-router-dom';
    import { useAuth } from '@/contexts/NewSupabaseAuthContext';
    import { Button } from '@/components/ui/button';
    import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuLabel,
      DropdownMenuSeparator,
      DropdownMenuTrigger,
    } from "@/components/ui/dropdown-menu";
    import {
      Avatar,
      AvatarFallback,
      AvatarImage,
    } from "@/components/ui/avatar";
    import { User, LogOut, Menu } from 'lucide-react';
    import { useMobileSidebar } from '@/hooks/useMobileSidebar';
    import AnimatedLogo from '@/components/AnimatedLogo';

    const Header = () => {
      const { user, signOut } = useAuth();
      const navigate = useNavigate();
      const onOpen = useMobileSidebar((state) => state.onOpen);
      const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';

      const handleSignOut = async () => {
        await signOut();
        navigate('/');
      };

      return (
        <header className="flex items-center justify-between lg:justify-end h-16 px-4 md:px-6 bg-background border-b z-40">
          <div className="flex items-center gap-4 lg:hidden">
            <Button
              onClick={onOpen}
              variant="ghost"
              size="icon"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <Link to="/" className="flex items-center gap-2">
                 <AnimatedLogo className="h-12 w-auto" isLink={false} />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                     <AvatarImage src="/placeholder.jpg" alt="User" />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Logged in as</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      );
    };

    export default Header;