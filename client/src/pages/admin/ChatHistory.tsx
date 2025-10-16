import { useState } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  sender: 'admin' | 'user';
  text: string;
  timestamp: Date;
}

export default function ChatHistory() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'user',
      text: 'Hello, I submitted a grievance about the library AC.',
      timestamp: new Date('2025-01-15T10:30:00'),
    },
    {
      id: '2',
      sender: 'admin',
      text: 'Thank you for reporting this. We have assigned it to the maintenance team.',
      timestamp: new Date('2025-01-15T11:00:00'),
    },
    {
      id: '3',
      sender: 'user',
      text: 'When can I expect this to be resolved?',
      timestamp: new Date('2025-01-15T14:20:00'),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'admin',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue('');
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
            <CardTitle className="text-2xl">Chat History - User: John Doe</CardTitle>
            <p className="text-sm text-muted-foreground">Grievance ID: G001</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.sender === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">
                        {message.sender === 'admin' ? 'Admin' : 'John Doe'}
                      </p>
                      <p>{message.text}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                data-testid="input-message"
              />
              <Button onClick={handleSend} data-testid="button-send">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
