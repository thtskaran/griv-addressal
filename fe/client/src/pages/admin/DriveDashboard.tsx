import { useState } from 'react';
import { FileText, File, Search, Download, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';

interface DriveFile {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'txt';
  lastModified: string;
}

export default function DriveDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);

  // todo: remove mock functionality
  const files: DriveFile[] = [
    { id: '1', name: 'Hostel Guidelines 2025.pdf', type: 'pdf', lastModified: '2025-01-10' },
    { id: '2', name: 'Exam Schedule.pdf', type: 'pdf', lastModified: '2025-01-12' },
    { id: '3', name: 'Campus Rules.doc', type: 'doc', lastModified: '2025-01-08' },
    { id: '4', name: 'Student Handbook.pdf', type: 'pdf', lastModified: '2025-01-05' },
    { id: '5', name: 'Library Regulations.txt', type: 'txt', lastModified: '2025-01-14' },
    { id: '6', name: 'Academic Calendar.pdf', type: 'pdf', lastModified: '2025-01-11' },
  ];

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-12 h-12 text-red-500" />;
      case 'doc':
        return <File className="w-12 h-12 text-blue-500" />;
      default:
        return <File className="w-12 h-12 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Google Drive Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage and view your connected files</p>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-files"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFiles.map((file, index) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover-elevate cursor-pointer" onClick={() => setSelectedFile(file)}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate mb-1">{file.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Modified: {new Date(file.lastModified).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" data-testid={`button-view-${file.id}`}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="bg-muted/30 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              {selectedFile && getFileIcon(selectedFile.type)}
              <p className="text-muted-foreground mt-4">File preview would appear here</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
