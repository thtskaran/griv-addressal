import { Home, FileText, BarChart3, Bell, User as UserIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import { useRecoilValue } from 'recoil';
import { userRoleAtom } from '@/lib/atoms';
import { Button } from '@/components/ui/button';

const userMenuItems = [
  { icon: Home, label: 'Dashboard', path: '/user/dashboard' },
  { icon: FileText, label: 'Submit Grievance', path: '/user/submit-grievance' },
  { icon: Bell, label: 'Notifications', path: '/user/notifications' },
  { icon: UserIcon, label: 'Profile', path: '/user/profile' },
];

const adminMenuItems = [
  { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: UserIcon, label: 'Profile', path: '/admin/profile' },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const userRole = useRecoilValue(userRoleAtom);
  
  const menuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-sm">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.path}
              variant={isActive ? 'default' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => setLocation(item.path)}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
