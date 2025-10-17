import { useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Star } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mockGrievances, type Grievance } from '@/lib/data';
import { useRecoilState } from 'recoil';
import { isAnonymousAtom } from '@/lib/atoms';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';


export default function UserDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [isAnonymous, setIsAnonymous] = useRecoilState(isAnonymousAtom);
    const [, setLocation] = useLocation();
  

  // todo: remove mock functionality - Filter for current user's grievances
  const userGrievances = mockGrievances.filter(g => g.userId === 'user123');
  
  const filteredGrievances = userGrievances.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'In Progress':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader>
      <div className="flex items-center justify-between flex-wrap gap-4">
  <div>
    <CardTitle className="text-2xl">My Grievances</CardTitle>
    <p className="text-sm text-muted-foreground mt-1">
      Track and manage your submitted grievances
    </p>
  </div>

  <div className="flex items-center gap-4 ml-auto">
    <div className="flex items-center gap-2">
      <Label htmlFor="anonymous-mode" className="text-sm font-medium">
        Anonymous Mode
      </Label>
      <Switch
        id="anonymous-mode"
        checked={isAnonymous}
        onCheckedChange={setIsAnonymous}
        data-testid="switch-anonymous-mode"
      />
    </div>

    <Button
      onClick={() => setLocation('/user/submit-grievance')}
      data-testid="button-submit-new"
    >
      <Plus className="w-4 h-4 mr-2" />
      Submit New
    </Button>
  </div>
</div>

          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search grievances..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-grievances"
              />
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrievances.map((grievance) => (
                    <TableRow key={grievance.id} className="hover-elevate">
                      <TableCell className="font-medium">{grievance.id}</TableCell>
                      <TableCell>{grievance.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{grievance.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(grievance.status)} variant="outline">
                          {grievance.status}
                        </Badge>
                      </TableCell>
                        <TableCell>
                          {grievance.rating ? (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: grievance.rating }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not rated</span>
                          )}
                        </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedGrievance(grievance)}
                          data-testid={`button-view-${grievance.id}`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={!!selectedGrievance} onOpenChange={() => setSelectedGrievance(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedGrievance?.title}</DialogTitle>
            <DialogDescription>Grievance ID: {selectedGrievance?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant="outline">{selectedGrievance?.category}</Badge>
              <Badge className={getStatusColor(selectedGrievance?.status || '')} variant="outline">
                {selectedGrievance?.status}
              </Badge>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-muted-foreground">{selectedGrievance?.description}</p>
            </div>
            {selectedGrievance?.adminReply && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Admin Response</h4>
                <p className="text-muted-foreground">{selectedGrievance.adminReply}</p>
              </div>
            )}
            {selectedGrievance?.assignedTo && (
              <div>
                <h4 className="font-semibold mb-1">Assigned To</h4>
                <p className="text-muted-foreground">{selectedGrievance.assignedTo}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
