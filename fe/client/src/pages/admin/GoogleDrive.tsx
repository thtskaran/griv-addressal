import { useState } from 'react';
import { useLocation } from 'wouter';
import { FolderOpen, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { registerGDriveFolder } from '@/lib/grievancesApi';

export default function GoogleDrive() {
  const [, setLocation] = useLocation();
  const [folderId, setFolderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const extractFolderId = (url: string): string => {
    // Extract folder ID from Google Drive URL
    // Example URL: https://drive.google.com/drive/folders/1AxVrJ2fd...
    const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const extractedId = extractFolderId(folderId);
      const response = await registerGDriveFolder(extractedId);

      toast({
        title: 'Success',
        description: `Google Drive folder registered successfully. Polling status: ${response.status}`,
      });

      // Store the response in localStorage for the dashboard
      localStorage.setItem('gdrive_folder', JSON.stringify(response));

      setLocation('/admin/drive-dashboard');
    } catch (error) {
      console.error('Failed to register Google Drive folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to register Google Drive folder. Please check your folder ID and permissions.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <p className="text-sm text-muted-foreground">
              Connect a Google Drive folder to sync knowledge base documents
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="folder-link">Google Drive Folder Link or ID</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="folder-link"
                    placeholder="https://drive.google.com/drive/folders/... or folder ID"
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="input-folder-link"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Make sure the folder has been shared with read access to the service account
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>The system will index all documents in the folder</li>
                  <li>A background poller will sync changes every 5 minutes</li>
                  <li>Documents will be available for AI-powered suggestions</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg" 
                data-testid="button-connect"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect to Drive'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
