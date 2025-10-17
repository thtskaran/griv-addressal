import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { useLocation } from 'wouter';
import { userRoleAtom, type UserRole } from '@/lib/atoms';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: UserRole;
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const userRole = useRecoilValue(userRoleAtom);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!userRole) {
      setLocation('/login');
    } else if (userRole !== allowedRole) {
      setLocation('/login');
    }
  }, [userRole, allowedRole, setLocation]);

  if (!userRole || userRole !== allowedRole) {
    return null;
  }

  return <>{children}</>;
}
