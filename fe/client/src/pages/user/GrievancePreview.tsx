import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle2, Send, Bot, Loader2, FileText, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getAISuggestions, confirmAISuggestion, submitGrievance, type AISuggestionsResponse } from '@/lib/grievancesApi';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function GrievancePreview() {
  const [, setLocation] = useLocation();
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionsResponse | null>(null);
  const { toast } = useToast();

  // This would typically come from a previous step or route state
  // For now, we'll use placeholder data
  const previewData = {
    title: 'Library AC Not Working',
    description:
      'The air conditioning system in the main library reading room has been malfunctioning for the past week, making it difficult to study in the hot weather.',
    category: 'Facilities',
  };

  // Load AI suggestions when component mounts (after grievance is created)
  // In a real scenario, you'd pass the grievance_id from the submission step
  useEffect(() => {
    // This is a placeholder - in production, you'd get this from the submission response
    const mockGrievanceId = 123;
    loadAISuggestions(mockGrievanceId);
  }, []);

  const loadAISuggestions = async (grievanceId: number) => {
    setIsLoadingSuggestions(true);
    try {
      const suggestions = await getAISuggestions(grievanceId);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load AI suggestions:', error);
      // Don't show error toast - AI suggestions are optional
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleAcceptSuggestion = async (suggestionId: string) => {
    if (!aiSuggestions) return;

    try {
      await confirmAISuggestion(aiSuggestions.grievance_id, suggestionId, true);
      
      toast({
        title: 'Suggestion Accepted',
        description: 'This grievance has been resolved based on the AI suggestion.',
      });

      setShowThankYou(true);
      setTimeout(() => {
        setLocation('/user/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to process suggestion. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    if (!aiSuggestions) return;

    try {
      await confirmAISuggestion(aiSuggestions.grievance_id, suggestionId, false);
      
      toast({
        title: 'Suggestion Rejected',
        description: 'The AI suggestion has been rejected.',
      });
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to process suggestion. Please try again.',
        variant: 'destructive',
      });
    }
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
      // If we have an existing grievance ID, we don't need to submit again
      // Just navigate to dashboard
      toast({
        title: 'Grievance Confirmed',
        description: 'Your grievance will be reviewed by our team.',
      });

      setLocation('/user/dashboard');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
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
            Your grievance has been successfully processed.
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
            Review the details and AI suggestions before final submission
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

            {/* AI Suggestions Section */}
            {isLoadingSuggestions ? (
              <div className="bg-muted/30 p-6 rounded-xl border border-border/30 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading AI suggestions...</p>
              </div>
            ) : aiSuggestions && aiSuggestions.suggestions.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-primary">AI-Powered Suggestions</h3>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {aiSuggestions.suggestions.map((suggestion, index) => (
                    <AccordionItem key={index} value={`suggestion-${index}`}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {Math.round(suggestion.confidence * 100)}% match
                          </Badge>
                          <span className="text-sm">Suggestion {index + 1}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <p className="text-sm text-muted-foreground">
                            {suggestion.summary}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText className="w-3 h-3" />
                            <span>Source: {suggestion.source.doc_id}</span>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleAcceptSuggestion(suggestion.source.doc_id)}
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleRejectSuggestion(suggestion.source.doc_id)}
                            >
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {/* Related Grievances */}
                {aiSuggestions.related_grievances.length > 0 && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Related Grievances</h4>
                    <div className="space-y-2">
                      {aiSuggestions.related_grievances.map((related) => (
                        <div key={related.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">#{related.id}: {related.title}</span>
                          <Badge
                            variant={related.status === 'SOLVED' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {related.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
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
                  No similar grievances or suggestions found. Your grievance will be reviewed by our team.
                </p>
              </motion.div>
            )}
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
              Issue Resolved
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
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Continue with Submission
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
