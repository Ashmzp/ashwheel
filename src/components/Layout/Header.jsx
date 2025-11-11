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
        <header className="flex items-center justify-between lg:justify-end h-14 px-3 md:px-4 bg-background border-b z-40">
          <div className="flex items-center gap-2 lg:hidden">
            <Button
              onClick={onOpen}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/" className="flex items-center">
                 <AnimatedLogo className="h-10 w-auto" isLink={false} />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
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