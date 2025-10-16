import Sidebar from '../Sidebar';
import { RecoilRoot } from 'recoil';

export default function SidebarExample() {
  return (
    <RecoilRoot>
      <div className="h-screen">
        <Sidebar />
      </div>
    </RecoilRoot>
  );
}
