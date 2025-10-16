import { useState } from 'react';
import { Camera, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function AdminProfile() {
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@grievance.edu',
    phone: '+1 234 567 8900',
    adminId: 'ADM2025001',
    department: 'Administration',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  });
  const { toast } = useToast();

  const handleSave = () => {
    // todo: remove mock functionality
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully updated.',
    });
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="max-w-3xl mx-auto backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle className="text-2xl">Admin Profile Settings</CardTitle>
            <p className="text-sm text-muted-foreground">Manage your administrator account information</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileData.avatarUrl} />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8"
                  data-testid="button-change-avatar"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{profileData.name}</h3>
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
                <p className="text-xs text-muted-foreground mt-1">Admin ID: {profileData.adminId}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={profileData.department}
                  onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                  data-testid="input-department"
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full" size="lg" data-testid="button-save-profile">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
