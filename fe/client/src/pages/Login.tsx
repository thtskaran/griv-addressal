import { useSetRecoilState } from 'recoil';
import { useLocation } from 'wouter';
import { userRoleAtom } from '@/lib/atoms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const setUserRole = useSetRecoilState(userRoleAtom);
  const [, setLocation] = useLocation();

  const handleLogin = (role: 'user' | 'admin') => {
    setUserRole(role);
    setLocation(`/${role}/dashboard`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-6">
            <span className="text-primary-foreground font-bold text-4xl">G</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">Grievance Management System</h1>
          <p className="text-muted-foreground text-lg">Select your role to continue</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="backdrop-blur-sm bg-card/50 border-2 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Login as User</CardTitle>
                <CardDescription>
                  Submit grievances, track status, and receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleLogin('user')}
                  className="w-full"
                  size="lg"
                  data-testid="button-login-user"
                >
                  Continue as User
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="backdrop-blur-sm bg-card/50 border-2 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Login as Admin</CardTitle>
                <CardDescription>
                  Manage grievances, respond to users, and view analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleLogin('admin')}
                  className="w-full"
                  size="lg"
                  data-testid="button-login-admin"
                >
                  Continue as Admin
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
