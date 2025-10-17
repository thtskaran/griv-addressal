import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Eye, MessageSquare, Star, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import apiClient from '@/lib/apiClient';
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

// Type definition for grievance data from the API
type Grievance = {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  status: GrievanceStatus;
  submittedAt: Date;
  updatedAt: Date;
  adminReply: string | null;
  rating: number | null;
  feedback: string | null;
  assignedTo: string | null;
};

// Type for the status values used in selects and state
type GrievanceStatus = 'Submitted' | 'In Progress' | 'Resolved' | 'Rejected';

const mockGrievances: Grievance[] = [
  {
    id: 'G-001',
    userId: 'user123',
    title: 'Wi-Fi not working in Hostel B',
    description: 'The Wi-Fi has been down for 3 days in the entire B-Block. We are unable to attend online classes or complete assignments.',
    category: 'IT Services',
    status: 'In Progress',
    submittedAt: new Date('2025-10-15T09:00:00Z'),
    updatedAt: new Date('2025-10-16T11:20:00Z'),
    adminReply: 'Our IT team is aware of the issue and is working on a fix. Expected resolution time is 24 hours.',
    rating: null,
    feedback: null,
    assignedTo: 'IT Department',
  },
  {
    id: 'G-002',
    userId: 'user456',
    title: 'Leaky faucet in washroom',
    description: 'The faucet on the 2nd floor, left-side washroom has been leaking continuously for a week.',
    category: 'Maintenance',
    status: 'Resolved',
    submittedAt: new Date('2025-10-12T14:30:00Z'),
    updatedAt: new Date('2025-10-14T17:00:00Z'),
    adminReply: 'The maintenance team has fixed the faucet.',
    rating: 5,
    feedback: 'Excellent and quick service!',
    assignedTo: 'Maintenance',
  },
    {
    id: 'G-003',
    userId: 'user789',
    title: 'Incorrect library book fine',
    description: 'I was charged a late fine for a book I returned on time. Please check the records.',
    category: 'Library',
    status: 'Submitted',
    submittedAt: new Date('2025-10-17T10:00:00Z'),
    updatedAt: new Date('2025-10-17T10:00:00Z'),
    adminReply: null,
    rating: null,
    feedback: null,
    assignedTo: null,
  },
   {
    id: 'G-004',
    userId: 'user101',
    title: 'Food quality in mess',
    description: 'The food quality has deteriorated significantly over the past month.',
    category: 'Food Services',
    status: 'Resolved',
    submittedAt: new Date('2025-09-20T19:00:00Z'),
    updatedAt: new Date('2025-09-25T12:00:00Z'),
    adminReply: 'We have spoken with the caterers and implemented stricter quality checks.',
    rating: 3,
    feedback: 'It is slightly better now, but can still be improved.',
    assignedTo: 'Food Services',
  },
];


export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [grievances, setGrievances] = useState<Grievance[]>(mockGrievances);
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  /*
  useEffect(() => {
    const fetchGrievances = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/grievances');
        if (!response.ok) {
          throw new Error('Failed to fetch grievances');
        }
        const data = await response.json();
        setGrievances(data);
      } catch (err) {
         if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchGrievances();
  }, []);
  */

  const handleStatusChange = (grievanceId: string, newStatus: GrievanceStatus) => {
    setGrievances(
      grievances.map((g) => (g.id === grievanceId ? { ...g, status: newStatus, updatedAt: new Date() } : g))
    );
    toast({
      title: 'Status Updated',
      description: `Grievance status changed to ${newStatus}`,
    });
  };

  const handleAssign = (grievanceId: string, department: string) => {
    setGrievances(
      grievances.map((g) => (g.id === grievanceId ? { ...g, assignedTo: department, updatedAt: new Date() } : g))
    );
     toast({
      title: 'Grievance Assigned',
      description: `Assigned to ${department}`,
    });
  };

  const handleReply = () => {
    if (!selectedGrievance || !replyText.trim()) return;

    setGrievances(
      grievances.map((g) =>
        g.id === selectedGrievance.id
          ? { ...g, adminReply: replyText, status: 'Resolved', updatedAt: new Date() }
          : g
      )
    );

    toast({
      title: 'Reply Sent',
      description: 'Your reply has been sent to the user.',
    });

    setReplyText('');
    setReplyDialogOpen(false);
    setSelectedGrievance(null);
  };

  const handleSendMessage = () => {
    if (!selectedGrievance || !messageText.trim()) return;

    toast({
      title: 'Message Sent',
      description: 'Your message has been sent to the user.',
    });

    setMessageText('');
    setMessageDialogOpen(false);
  };

  const handleViewChatHistory = () => {
    setMessageDialogOpen(false);
    setLocation('/admin/chat-history');
  };

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

  const filteredGrievances = grievances.filter((g) => {
    const ratingMatch =
      filterRating === 'all' ||
      (filterRating === '4+' && (g.rating || 0) >= 4) ||
      (filterRating === '3' && (g.rating || 0) === 3) ||
      (filterRating === '2' && (g.rating || 0) <= 2);

    const statusMatch = filterStatus === 'all' || g.status === filterStatus;

    return ratingMatch && statusMatch;
  });

  const totalGrievances = grievances.length;
  const resolvedGrievances = grievances.filter((g) => g.status === 'Resolved').length;
  const pendingGrievances = grievances.filter((g) => g.status === 'Submitted').length;
  const avgRating =
    grievances.filter((g) => g.rating).reduce((sum, g) => sum + (g.rating || 0), 0) /
      grievances.filter((g) => g.rating).length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRating.toFixed(1)} / 5.0</div>
              <p className="text-xs text-muted-foreground mt-1">From resolved grievances</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedGrievances}</div>
              <p className="text-xs text-muted-foreground mt-1">Out of {totalGrievances} total</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className="w-[140px]" data-testid="select-filter-rating">
                    <SelectValue placeholder="Filter by rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="4+">4+ Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars or less</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
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
                        <Select
                          value={grievance.status}
                          onValueChange={(value) => handleStatusChange(grievance.id, value as GrievanceStatus)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Submitted">Submitted</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={grievance.assignedTo || 'unassigned'}
                          onValueChange={(value) => handleAssign(grievance.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IT Department">IT Department</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Academic">Academic</SelectItem>
                            <SelectItem value="Library">Library</SelectItem>
                            <SelectItem value="Food Services">Food Services</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {grievance.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{grievance.rating}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
                            onClick={() => {
                              setSelectedGrievance(grievance);
                              setMessageDialogOpen(true);
                            }}
                            data-testid={`button-message-${grievance.id}`}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={!!selectedGrievance && !replyDialogOpen && !messageDialogOpen} onOpenChange={() => setSelectedGrievance(null)}>
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
            {selectedGrievance?.rating && (
              <div>
                <h4 className="font-semibold mb-2">User Rating</h4>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= selectedGrievance.rating!
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {selectedGrievance.rating} / 5
                  </span>
                </div>
                {selectedGrievance.feedback && (
                  <p className="text-sm text-muted-foreground mt-2">{selectedGrievance.feedback}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>Send a direct message to the user</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Type your message here..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={6}
            data-testid="textarea-admin-message"
          />
          <DialogFooter className="flex gap-2">
            <Button onClick={handleSendMessage} data-testid="button-send-message">
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
            <Button variant="outline" onClick={handleViewChatHistory} data-testid="button-view-chat-history">
              View Chat History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

