import { useState } from 'react';
import { useLocation } from 'wouter';
import { FolderOpen, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

export default function GoogleDrive() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    folderLink: '',
    email: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation('/admin/drive-dashboard');
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="max-w-2xl mx-auto backdrop-blur-sm bg-card/80">
          <CardHeader className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Google Drive Integration</CardTitle>
            <p className="text-sm text-muted-foreground">Connect to a Google Drive folder</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="folder-link">Google Drive Folder Link</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="folder-link"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={formData.folderLink}
                    onChange={(e) => setFormData({ ...formData, folderLink: e.target.value })}
                    className="pl-10"
                    required
                    data-testid="input-folder-link"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address (for read access)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="input-email"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" data-testid="button-connect">
                Connect to Drive
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
