import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Eye, MessageSquare, Star, Send, Loader2, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  getAdminGrievances,
  updateGrievance,
  addAdminChatMessage,
  getGrievanceById,
  getAISuggestions,
  type Grievance,
  type AISuggestionsResponse,
} from '@/lib/grievancesApi';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [selectedGrievanceChat, setSelectedGrievanceChat] = useState<any>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [aiSuggestionsDialogOpen, setAiSuggestionsDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignedTo, setFilterAssignedTo] = useState('all');
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionsResponse | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGrievances();
  }, [filterStatus, filterAssignedTo]);

  const fetchGrievances = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (filterAssignedTo !== 'all') filters.assigned_to = filterAssignedTo;

      const response = await getAdminGrievances(filters);
      setGrievances(response.grievances);
    } catch (error) {
      console.error('Failed to fetch grievances:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch grievances. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (grievanceId: number, newStatus: string) => {
    try {
      await updateGrievance(grievanceId, { status: newStatus as any });
      
      setGrievances(
        grievances.map((g) =>
          g.id === grievanceId ? { ...g, status: newStatus as any, updated_at: new Date().toISOString() } : g
        )
      );
      
      toast({
        title: 'Status Updated',
        description: `Grievance status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAssign = async (grievanceId: number, department: string) => {
    try {
      await updateGrievance(grievanceId, { assigned_to: department });
      
      setGrievances(
        grievances.map((g) =>
          g.id === grievanceId ? { ...g, assigned_to: department, updated_at: new Date().toISOString() } : g
        )
      );
      
      toast({
        title: 'Grievance Assigned',
        description: `Assigned to ${department}`,
      });
    } catch (error) {
      console.error('Failed to assign grievance:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign grievance. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReply = async () => {
    if (!selectedGrievance || !replyText.trim()) return;

    try {
      await addAdminChatMessage(selectedGrievance.id, replyText);
      
      // Update status to IN_PROGRESS if it was NEW
      if (selectedGrievance.status === 'NEW') {
        await updateGrievance(selectedGrievance.id, { status: 'IN_PROGRESS' });
      }

      toast({
        title: 'Reply Sent',
        description: 'Your reply has been sent to the user.',
      });

      setReplyText('');
      setReplyDialogOpen(false);
      setSelectedGrievance(null);
      fetchGrievances(); // Refresh the list
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to send reply. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedGrievance || !messageText.trim()) return;

    try {
      await addAdminChatMessage(selectedGrievance.id, messageText);

      toast({
        title: 'Message Sent',
        description: 'Your message has been sent to the user.',
      });

      setMessageText('');
      setMessageDialogOpen(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewChatHistory = async (grievance: Grievance) => {
    try {
      const response = await getGrievanceById(grievance.id);
      setSelectedGrievanceChat(response);
      setLocation(`/admin/chat-history/${grievance.id}`);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat history.',
        variant: 'destructive',
      });
    }
  };

  const handleLoadAISuggestions = async (grievance: Grievance) => {
    setSelectedGrievance(grievance);
    setIsLoadingAI(true);
    setAiSuggestionsDialogOpen(true);

    try {
      const suggestions = await getAISuggestions(grievance.id);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load AI suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI suggestions.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SOLVED':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'REJECTED':
      case 'DROPPED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  const totalGrievances = grievances.length;
  const resolvedGrievances = grievances.filter((g) => g.status === 'SOLVED').length;
  const pendingGrievances = grievances.filter((g) => g.status === 'NEW').length;
  const inProgressGrievances = grievances.filter((g) => g.status === 'IN_PROGRESS').length;

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Grievances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGrievances}</div>
              <p className="text-xs text-muted-foreground mt-1">All submitted grievances</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingGrievances}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressGrievances}</div>
              <p className="text-xs text-muted-foreground mt-1">Being worked on</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedGrievances}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully solved</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">All Grievances</CardTitle>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="SOLVED">Solved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="DROPPED">Dropped</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterAssignedTo} onValueChange={setFilterAssignedTo}>
                  <SelectTrigger className="w-[140px]" data-testid="select-filter-assigned">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="LIBRARY">Library</SelectItem>
                    <SelectItem value="HOSTEL">Hostel</SelectItem>
                    <SelectItem value="ACADEMICS">Academics</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="OTHERS">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading grievances...</p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grievances.map((grievance) => (
                      <TableRow key={grievance.id} className="hover-elevate">
                        <TableCell className="font-medium">{grievance.id}</TableCell>
                        <TableCell>{grievance.title}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {grievance.issue_tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                            {grievance.issue_tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">+{grievance.issue_tags.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={grievance.status}
                            onValueChange={(value) => handleStatusChange(grievance.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NEW">New</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="SOLVED">Solved</SelectItem>
                              <SelectItem value="REJECTED">Rejected</SelectItem>
                              <SelectItem value="DROPPED">Dropped</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={grievance.assigned_to || 'unassigned'}
                            onValueChange={(value) => handleAssign(grievance.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Assign" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LIBRARY">Library</SelectItem>
                              <SelectItem value="HOSTEL">Hostel</SelectItem>
                              <SelectItem value="ACADEMICS">Academics</SelectItem>
                              <SelectItem value="IT">IT</SelectItem>
                              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                              <SelectItem value="OTHERS">Others</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedGrievance(grievance)}
                              data-testid={`button-view-${grievance.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedGrievance(grievance);
                                setReplyDialogOpen(true);
                              }}
                              data-testid={`button-reply-${grievance.id}`}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLoadAISuggestions(grievance)}
                              data-testid={`button-ai-${grievance.id}`}
                            >
                              <Bot className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedGrievance && !replyDialogOpen && !aiSuggestionsDialogOpen} onOpenChange={() => setSelectedGrievance(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedGrievance?.title}</DialogTitle>
            <DialogDescription>Grievance ID: {selectedGrievance?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge className={getStatusColor(selectedGrievance?.status || '')} variant="outline">
                {selectedGrievance?.status}
              </Badge>
              <Badge variant="outline">{selectedGrievance?.assigned_to}</Badge>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-muted-foreground">{selectedGrievance?.description || 'No description provided'}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedGrievance?.issue_tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Cluster</h4>
              <p className="text-muted-foreground">{selectedGrievance?.cluster}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Created</h4>
                <p className="text-muted-foreground">
                  {selectedGrievance && new Date(selectedGrievance.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Last Updated</h4>
                <p className="text-muted-foreground">
                  {selectedGrievance && new Date(selectedGrievance.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Grievance</DialogTitle>
            <DialogDescription>Send a response to the user</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Type your response here..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={6}
            data-testid="textarea-admin-reply"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReply} data-testid="button-send-reply">
              <Send className="w-4 h-4 mr-2" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Suggestions Dialog */}
      <Dialog open={aiSuggestionsDialogOpen} onOpenChange={setAiSuggestionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Suggestions
            </DialogTitle>
            <DialogDescription>
              AI-powered resolution suggestions for Grievance #{selectedGrievance?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingAI ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading AI suggestions...</p>
              </div>
            ) : aiSuggestions && aiSuggestions.suggestions.length > 0 ? (
              <>
                {aiSuggestions.suggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Source: {suggestion.source.doc_id}
                      </span>
                    </div>
                    <p className="text-sm">{suggestion.summary}</p>
                  </div>
                ))}
                {aiSuggestions.related_grievances.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Related Grievances</h4>
                    <div className="space-y-2">
                      {aiSuggestions.related_grievances.map((related) => (
                        <div key={related.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                          <span>#{related.id}: {related.title}</span>
                          <Badge variant="secondary">{related.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No AI suggestions available for this grievance.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
