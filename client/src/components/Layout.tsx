import { useRecoilValue } from 'recoil';
import { userRoleAtom } from '@/lib/atoms';
import Header from './Header';
import Sidebar from './Sidebar';
import ChatBot from './ChatBot';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const userRole = useRecoilValue(userRoleAtom);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      {userRole === 'admin' && <ChatBot />}
    </div>
  );
}
