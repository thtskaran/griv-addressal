import { useState, useEffect, useRef } from 'react';
import { Eye, Search, Plus, MessageSquare, Send, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRecoilState } from 'recoil';
import { isAnonymousAtom } from '@/lib/atoms';
import { Textarea } from '@/components/ui/textarea';
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
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { getGrievances, getGrievanceById, addStudentChatMessage } from '@/lib/grievancesApi';
import { useToast } from '@/hooks/use-toast';

// Interface for a single chat message
interface ChatMessage {
    role: 'student' | 'admin';
    message: string;
    timestamp: string;
}

// Updated interface to include description, docs, and chat history
interface APIGrievance {
  id: number;
  title: string;
  description: string;
  status: string;
  assigned_to: string;
  cluster: string;
  created_at: string;
  tags: string[];
  s3_doc_urls?: string[];
  chat?: ChatMessage[];
  rating?: number;
}

export default function UserDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrievance, setSelectedGrievance] = useState<APIGrievance | null>(null);
  const [chatGrievance, setChatGrievance] = useState<APIGrievance | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [grievances, setGrievances] = useState<APIGrievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useRecoilState(isAnonymousAtom);
  const [, setLocation] = useLocation();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to the bottom of chat history
  useEffect(() => {
    if (chatGrievance && chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatGrievance, chatGrievance?.chat]);

  // ✅ Fetch data from API
  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        const response = await getGrievances();
        setGrievances(response.grievances.map(g => ({
          id: g.id,
          title: g.title,
          description: g.description || '',
          status: g.status,
          assigned_to: g.assigned_to,
          cluster: g.cluster,
          created_at: g.created_at,
          tags: g.issue_tags,
          s3_doc_urls: g.s3_doc_urls,
          chat: [],
        })));
      } catch (err) {
        console.error('Error fetching grievances:', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch grievances. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchGrievances();
  }, [toast]);

  // ✅ Load chat history when opening chat dialog
  const handleOpenChat = async (grievance: APIGrievance) => {
    try {
      const response = await getGrievanceById(grievance.id);
      setChatGrievance({
        ...grievance,
        chat: response.chat || [],
      });
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat history.',
        variant: 'destructive',
      });
    }
  };

  // ✅ Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatGrievance) return;

    try {
      const response = await addStudentChatMessage(chatGrievance.id, newMessage);
      
      // Get the newly added message from response
      const newMessages = response.conversations || [];
      const latestMessage = newMessages[newMessages.length - 1];

      if (latestMessage) {
        // Update the chat grievance with the new message
        setChatGrievance(prev => prev ? {
          ...prev,
          chat: [...(prev.chat || []), latestMessage]
        } : null);
      }

      setNewMessage('');
      toast({
        title: 'Message Sent',
        description: 'Your message has been sent successfully.',
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // ✅ Handle grievance rating
  const handleRating = (rating: number) => {
    if (!selectedGrievance) return;
    const updatedGrievances = grievances.map(g =>
        g.id === selectedGrievance.id ? { ...g, rating } : g
    );
    setGrievances(updatedGrievances);
    setSelectedGrievance(prev => prev ? { ...prev, rating } : null);
    
    toast({
      title: 'Rating Submitted',
      description: `You rated this grievance ${rating} stars.`,
    });
  };

  // ✅ Filter grievances (updated to include tags)
  const filteredGrievances = grievances.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.cluster.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ✅ Status badge colors
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SOLVED':
      case 'RESOLVED':
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
                  />
                </div>

                <Button onClick={() => setLocation('/user/submit-grievance')}>
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
                placeholder="Search grievances by title, cluster, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground py-6">Loading grievances...</p>
            ) : filteredGrievances.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No grievances found.</p>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrievances.map((g) => (
                      <TableRow key={g.id} className="hover-elevate">
                        <TableCell className="font-medium">{g.id}</TableCell>
                        <TableCell>{g.title}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(g.status)} variant="outline">
                            {g.status.replaceAll('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {g.tags.map(tag => (
                               <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{g.assigned_to}</Badge>
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedGrievance(g)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleOpenChat(g)}>
                            <MessageSquare className="w-4 h-4" />
                          </Button>
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
      <Dialog open={!!selectedGrievance} onOpenChange={() => setSelectedGrievance(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedGrievance?.title}</DialogTitle>
            <DialogDescription>
              Grievance ID: {selectedGrievance?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedGrievance && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm">Description</h4>
                <p className="text-muted-foreground text-sm">{selectedGrievance.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Status</h4>
                  <Badge className={getStatusColor(selectedGrievance.status)} variant="outline">
                    {selectedGrievance.status.replaceAll('_', ' ')}
                  </Badge>
                </div>
                 <div>
                  <h4 className="font-semibold mb-2 text-sm">Assigned To</h4>
                  <Badge variant="outline">{selectedGrievance.assigned_to}</Badge>
                </div>
                 <div>
                  <h4 className="font-semibold mb-2 text-sm">Cluster</h4>
                  <p className="text-muted-foreground">{selectedGrievance.cluster}</p>
                 </div>
                 <div>
                  <h4 className="font-semibold mb-1 text-sm">Created At</h4>
                  <p className="text-muted-foreground">
                    {new Date(selectedGrievance.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                  <h4 className="font-semibold mb-2 text-sm">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                      {selectedGrievance.tags.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                  </div>
              </div>

               {selectedGrievance.status === 'SOLVED' && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2 text-sm">Rate your experience</h4>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 cursor-pointer transition-colors ${
                            star <= (hoverRating || selectedGrievance?.rating || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => handleRating(star)}
                        />
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={!!chatGrievance} onOpenChange={() => setChatGrievance(null)}>
        <DialogContent className="max-w-lg flex flex-col h-[70vh]">
          <DialogHeader>
            <DialogTitle>{chatGrievance?.title}</DialogTitle>
            <DialogDescription>
              Chat history for Grievance ID: {chatGrievance?.id}
            </DialogDescription>
          </DialogHeader>
          <div ref={chatContainerRef} className="flex-grow space-y-4 overflow-y-auto p-4 border rounded-md bg-muted/50">
            {chatGrievance?.chat?.map((chat, index) => (
              <div key={index} className={`flex flex-col ${chat.role === 'student' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-lg px-4 py-2 max-w-xs md:max-w-md ${chat.role === 'student' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-900'}`}>
                  <p className="text-sm">{chat.message}</p>
                </div>
                <span className="text-xs text-muted-foreground mt-1 px-1">
                  {new Date(chat.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
             {chatGrievance?.chat?.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet.</p>}
          </div>
          <DialogFooter className="mt-auto pt-4">
             <div className="flex w-full items-end gap-2">
                <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={1}
                    className="flex-grow resize-none"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                />
                <Button onClick={handleSendMessage} size="icon" className="shrink-0">
                    <Send className="w-4 h-4" />
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
