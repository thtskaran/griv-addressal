import { Switch, Route, Redirect } from 'wouter';
import { RecoilRoot, useRecoilValue } from 'recoil';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { userRoleAtom } from '@/lib/atoms';

import Login from '@/pages/Login';
import UserDashboard from '@/pages/user/Dashboard';
import SubmitGrievance from '@/pages/user/SubmitGrievance';
import UserNotifications from '@/pages/user/Notifications';
import UserProfile from '@/pages/user/Profile';
import AdminDashboard from '@/pages/admin/Dashboard';
import Analytics from '@/pages/admin/Analytics';
import AdminProfile from '@/pages/admin/Profile';
import NotFound from '@/pages/not-found';

import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';

function AppRouter() {
  const userRole = useRecoilValue(userRoleAtom);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Redirect root to login or dashboard based on auth */}
      <Route path="/">
        {userRole ? <Redirect to={`/${userRole}/dashboard`} /> : <Redirect to="/login" />}
      </Route>

      {/* User Routes */}
      <Route path="/user/dashboard">
        <ProtectedRoute allowedRole="user">
          <Layout>
            <UserDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/user/submit-grievance">
        <ProtectedRoute allowedRole="user">
          <Layout>
            <SubmitGrievance />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/user/notifications">
        <ProtectedRoute allowedRole="user">
          <Layout>
            <UserNotifications />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/user/profile">
        <ProtectedRoute allowedRole="user">
          <Layout>
            <UserProfile />
          </Layout>
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRole="admin">
          <Layout>
            <AdminDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/analytics">
        <ProtectedRoute allowedRole="admin">
          <Layout>
            <Analytics />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/profile">
        <ProtectedRoute allowedRole="admin">
          <Layout>
            <AdminProfile />
          </Layout>
        </ProtectedRoute>
      </Route>

      {/* 404 Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppRouter />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}
