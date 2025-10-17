import ProtectedRoute from '../ProtectedRoute';
import { RecoilRoot } from 'recoil';

export default function ProtectedRouteExample() {
  return (
    <RecoilRoot>
      <ProtectedRoute allowedRole="user">
        <div className="p-8">
          <h1 className="text-2xl font-bold">Protected Content</h1>
          <p className="text-muted-foreground">This content is only visible to authenticated users.</p>
        </div>
      </ProtectedRoute>
    </RecoilRoot>
  );
}
