import { Bell, LogOut, User, Moon, Sun } from 'lucide-react';
import { useRecoilState, useRecoilValue } from 'recoil';
// **FIX**: Removed isAnonymousAtom as it's no longer needed for this logic.
import { userRoleAtom, unreadNotificationsAtom, isAnonymousAtom } from '@/lib/atoms';
import { useLocation } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

export default function Header() {
  const [userRole, setUserRole] = useRecoilState(userRoleAtom);
  // **FIX**: The 'isAnonymous' status is now correctly derived directly from the user's role.
  // This ensures that if there's no role, the user is always considered anonymous.
const isModeAnonymous = useRecoilValue(isAnonymousAtom);
  const unreadCount = useRecoilValue(unreadNotificationsAtom);
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const handleLogout = () => {
    setUserRole(null);
    setLocation('/login');
  };
  const isAnonymous = userRole === null || isModeAnonymous;

  const displayName = isAnonymous ? 'Anonymous User' : userRole === 'admin' ? 'Admin User' : 'Aman jha';
  const displayEmail = isAnonymous ? 'anonymous@system.local' : userRole === 'admin' ? 'admin@grievance.edu' : 'john.doe@university.edu';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Grievance Portal</h1>
            <p className="text-xs text-muted-foreground capitalize">{userRole ? `${userRole} Dashboard` : 'Welcome'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAnonymous && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-anonymous">
              <User className="w-3 h-3" />
              Anonymous Mode Active
            </Badge>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={toggleDarkMode}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          {userRole === 'user' && (
            <Button
              size="icon"
              variant="ghost"
              className="relative"
              onClick={() => setLocation(`/${userRole}/notifications`)}
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          )}


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hover-elevate" data-testid="button-profile">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={isAnonymous ? '' : 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'} />
                  <AvatarFallback>{isAnonymous ? 'A' : 'JD'}</AvatarFallback>
                </Avatar>
                <span className="font-medium hidden md:inline">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{displayEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!isAnonymous && (
                <DropdownMenuItem onClick={() => setLocation(`/${userRole}/profile`)} data-testid="menu-profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="menu-logout">
                <LogOut className="w-4 h-4 mr-2" />
                {isAnonymous ? 'Login' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}