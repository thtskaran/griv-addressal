import { useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle2, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function GrievancePreview() {
  const [, setLocation] = useLocation();
  const [showThankYou, setShowThankYou] = useState(false);

  // todo: remove mock functionality - Mock preview data
  const previewData = {
    title: 'Library AC Not Working',
    description: 'The air conditioning system in the main library reading room has been malfunctioning for the past week, making it difficult to study in the hot weather.',
    category: 'Facilities',
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80',
  };

  const handleDidYouGetHelp = () => {
    setShowThankYou(true);
    setTimeout(() => {
      setLocation('/user/dashboard');
    }, 2000);
  };

  const handleStillSubmit = () => {
    setLocation('/user/dashboard');
  };

  if (showThankYou) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-green-500/10 via-background to-accent/10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Thank You!</h2>
          <p className="text-lg text-muted-foreground">Your grievance has been resolved</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Preview Your Grievance</h1>
          <p className="text-muted-foreground">Review the details before final submission</p>
        </div>

        <Card className="overflow-hidden backdrop-blur-sm bg-card/80">
          <CardContent className="p-0">
            {previewData.imageUrl && (
              <div className="w-full h-80 overflow-hidden">
                <img
                  src={previewData.imageUrl}
                  alt="Grievance evidence"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-8 space-y-4">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
                  {previewData.category}
                </span>
                <h2 className="text-2xl font-bold">{previewData.title}</h2>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">{previewData.description}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleDidYouGetHelp}
              className="w-full h-20 text-lg bg-green-500 hover:bg-green-600"
              data-testid="button-got-help"
            >
              <CheckCircle2 className="w-6 h-6 mr-3" />
              Did you get help?
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleStillSubmit}
              className="w-full h-20 text-lg"
              data-testid="button-still-submit"
            >
              <Send className="w-6 h-6 mr-3" />
              Still Submit
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
