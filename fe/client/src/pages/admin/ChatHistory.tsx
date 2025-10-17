import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { getGrievanceById, addAdminChatMessage } from '@/lib/grievancesApi';

interface Message {
  role: 'admin' | 'student';
  message: string;
  timestamp: string;
}

export default function ChatHistory() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/admin/chat-history/:grievanceId?');
  const [messages, setMessages] = useState<Message[]>([]);
  const [grievanceInfo, setGrievanceInfo] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params?.grievanceId) {
      loadChatHistory(parseInt(params.grievanceId));
    } else {
      setIsLoading(false);
    }
  }, [params?.grievanceId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatHistory = async (grievanceId: number) => {
    setIsLoading(true);
    try {
      const response = await getGrievanceById(grievanceId);
      setGrievanceInfo(response.grievance);
      setMessages(response.chat || []);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat history.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !grievanceInfo) return;

    setIsSending(true);
    try {
      const response = await addAdminChatMessage(grievanceInfo.id, inputValue);
      
      // Add the new message to the chat
      const newMessages = response.conversations || [];
      const latestMessage = newMessages[newMessages.length - 1];
      
      if (latestMessage) {
        setMessages([...messages, latestMessage]);
      }
      
      setInputValue('');
      toast({
        title: 'Message Sent',
        description: 'Your message has been sent to the student.',
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
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

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          onClick={() => setLocation('/admin/dashboard')}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="max-w-5xl mx-auto backdrop-blur-sm bg-card/80">
          <CardHeader>
            {grievanceInfo ? (
              <>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{grievanceInfo.title}</CardTitle>
                  <Badge className={getStatusColor(grievanceInfo.status)} variant="outline">
                    {grievanceInfo.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Grievance ID: {grievanceInfo.id}</span>
                  <span>Student ID: {grievanceInfo.student_id}</span>
                  <span>Assigned to: {grievanceInfo.assigned_to}</span>
                </div>
              </>
            ) : (
              <CardTitle className="text-2xl">Chat History</CardTitle>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading chat history...</p>
              </div>
            ) : messages.length === 0 && !grievanceInfo ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Select a grievance from the dashboard to view its chat history.
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[500px] pr-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${message.role === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            message.role === 'admin'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm font-medium mb-1">
                            {message.role === 'admin' ? 'Admin' : 'Student'}
                          </p>
                          <p>{message.message}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {messages.length === 0 && grievanceInfo && (
                      <p className="text-center text-muted-foreground py-8">
                        No messages yet. Start the conversation!
                      </p>
                    )}
                  </div>
                </ScrollArea>

                {grievanceInfo && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Input
                      placeholder="Type your message..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      data-testid="input-message"
                      disabled={isSending}
                    />
                    <Button 
                      onClick={handleSend} 
                      data-testid="button-send"
                      disabled={isSending || !inputValue.trim()}
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
