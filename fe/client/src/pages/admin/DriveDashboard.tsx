import { useState, useEffect } from 'react';
import { FileText, File, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { reindexGDriveFolder } from '@/lib/grievancesApi';

export default function DriveDashboard() {
  const [folderInfo, setFolderInfo] = useState<any>(null);
  const [isReindexing, setIsReindexing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load folder info from localStorage
    const savedFolder = localStorage.getItem('gdrive_folder');
    if (savedFolder) {
      setFolderInfo(JSON.parse(savedFolder));
    }
  }, []);

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      const response = await reindexGDriveFolder();
      
      toast({
        title: 'Reindex Complete',
        description: `Discovered ${response.chunks_discovered} chunks, upserted ${response.chunks_upserted}, deleted ${response.chunks_deleted}`,
      });

      // Update folder info with reindex data
      setFolderInfo({
        ...folderInfo,
        ...response,
      });
    } catch (error) {
      console.error('Failed to reindex:', error);
      toast({
        title: 'Error',
        description: 'Failed to reindex Google Drive folder. Make sure a folder is registered.',
        variant: 'destructive',
      });
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Google Drive Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your connected knowledge base</p>
        </div>
        <Button
          onClick={handleReindex}
          disabled={isReindexing || !folderInfo}
          variant="outline"
        >
          {isReindexing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Reindexing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Force Reindex
            </>
          )}
        </Button>
      </div>

      {folderInfo ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Folder ID</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-mono break-all">{folderInfo.folder_id}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={folderInfo.status === 'POLLING' ? 'default' : 'secondary'}>
                  {folderInfo.status || 'UNKNOWN'}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Polling Interval</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {folderInfo.polling_interval_seconds || 300}s
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {folderInfo.chunks_discovered !== undefined && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Chunks Discovered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{folderInfo.chunks_discovered}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Chunks Upserted</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{folderInfo.chunks_upserted}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Chunks Deleted</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-600">{folderInfo.chunks_deleted}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Folder Connected</h3>
            <p className="text-muted-foreground mb-4">
              Connect a Google Drive folder to start syncing your knowledge base documents.
            </p>
            <Button onClick={() => window.location.href = '/admin/google-drive'}>
              Connect Google Drive
            </Button>
          </CardContent>
        </Card>
      )}

      {folderInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="backdrop-blur-sm bg-card/80">
            <CardHeader>
              <CardTitle>Knowledge Base Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm">How it works</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Documents in the Google Drive folder are automatically indexed</li>
                  <li>The system polls for changes every {folderInfo.polling_interval_seconds || 300} seconds</li>
                  <li>Indexed content is used for AI-powered grievance suggestions</li>
                  <li>Use "Force Reindex" to manually trigger a full rescan</li>
                </ul>
              </div>

              {folderInfo.reindexed_at && (
                <div className="text-sm">
                  <span className="font-semibold">Last Reindexed:</span>{' '}
                  <span className="text-muted-foreground">
                    {new Date(folderInfo.reindexed_at).toLocaleString()}
                  </span>
                </div>
              )}

              {folderInfo.next_change_token && (
                <div className="text-sm">
                  <span className="font-semibold">Change Token:</span>{' '}
                  <span className="text-muted-foreground font-mono">{folderInfo.next_change_token}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
