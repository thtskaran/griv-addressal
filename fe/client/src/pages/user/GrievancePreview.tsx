import { useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle2, Send, Bot, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function GrievancePreview() {
  const [, setLocation] = useLocation();
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewData = {
    title: 'Library AC Not Working',
    description:
      'The air conditioning system in the main library reading room has been malfunctioning for the past week, making it difficult to study in the hot weather.',
    category: 'Facilities',
  };

  const AIFeedback = {
    AI_feedback: 'The authority is aware of the issue and is actively working to resolve it soon.',
  };

  const handleDidYouGetHelp = () => {
    setShowThankYou(true);
    setTimeout(() => {
      setLocation('/user/dashboard');
    }, 2000);
  };

  const handleStillSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Construct the payload based on the API specification.
      const submissionPayload = {
        title: previewData.title,
        description: "The air conditioning in the central library is broken since last week.",
        docs: ["file1.pdf", "file2.jpg"] // In a real app, this would come from the previous step.
      };

      const response = await fetch('/grievances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionPayload),
      });

      if (!response.ok) {
        // Handle non-successful responses by throwing an error.
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Log the successful response and navigate.
      const responseData = await response.json();
      console.log('Grievance submitted successfully:', responseData);
      setLocation('/user/dashboard');

    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
      // Here you could implement a user-facing error message.
    } finally {
      // Ensure the loading state is reset whether the request succeeded or failed.
      setIsSubmitting(false);
    }
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
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
          <p className="text-base text-muted-foreground">
            Your grievance has been successfully resolved.
          </p>
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
        className="max-w-3xl mx-auto space-y-8"
      >
        {/* Page Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Preview Your Grievance</h1>
          <p className="text-muted-foreground">
            Review the details before final submission
          </p>
        </div>

        {/* Grievance Card */}
        <Card className="overflow-hidden backdrop-blur-sm bg-card/80 shadow-lg border border-border/40">
          <CardContent className="p-8 space-y-4">
            <div>
              <Badge variant="secondary" className="mb-3">
                {previewData.category}
              </Badge>
              <h2 className="text-2xl font-semibold">{previewData.title}</h2>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {previewData.description}
            </p>

            <Separator className="my-4" />

            {/* AI Feedback Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-muted/30 p-4 rounded-xl border border-border/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-primary">AI Feedback</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {AIFeedback.AI_feedback}
              </p>
            </motion.div>
          </CardContent>
        </Card>

        {/* Buttons Section */}
        <div className="grid sm:grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleDidYouGetHelp}
              className="w-full h-14 text-base bg-green-500 hover:bg-green-600"
              data-testid="button-got-help"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Did you get help?
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleStillSubmit}
              variant="outline"
              className="w-full h-14 text-base"
              data-testid="button-still-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Still Submit
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
