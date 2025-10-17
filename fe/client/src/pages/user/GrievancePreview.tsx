import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle2, Send, Bot, Loader2, FileText, Sparkles, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { submitGrievance } from '@/lib/grievancesApi';
import ReactMarkdown from 'react-markdown';

interface KBSuggestion {
  doc_name: string;
  excerpt: string;
  similarity_score: number;
  chunk_id: string;
}

interface AISuggestion {
  confidence: number;
  source: {
    doc_id: string;
    chunk_id: string;
  };
  summary: string;
}

interface PreviewData {
  preview: boolean;
  grievance: {
    title: string;
    description: string;
    status: string;
    assigned_to: string;
    tags: string[];
    cluster?: string;
    cluster_tags?: string[];
  };
  ai_generated_tags: string[];
  kb_suggestions: KBSuggestion[];
  ai_suggestions?: AISuggestion[];
  ai_summary?: string;
  related_grievances?: any[];
  documents?: any[];
}

const PREVIEW_STORAGE_KEY = 'grievancePreview';

const readCachedPreview = (): PreviewData | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const cached = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
    return cached ? (JSON.parse(cached) as PreviewData) : null;
  } catch (err) {
    console.warn('Failed to parse cached grievance preview payload:', err);
    sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
    return null;
  }
};

const persistPreviewCache = (data: PreviewData) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to persist grievance preview payload:', err);
  }
};

const clearPreviewCache = () => {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
};

export default function GrievancePreview() {
  const [pathname, setLocation] = useLocation();

  const [previewData, setPreviewData] = useState<PreviewData | null>(() => {
    // On initial render, try to load from sessionStorage
    return readCachedPreview();
  });

  const [showThankYou, setShowThankYou] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load preview data from sessionStorage on mount
    console.log('GrievancePreview: Loading preview data from sessionStorage');
    const cached = readCachedPreview();
    console.log('GrievancePreview: Cached data:', cached);
    if (cached) {
      setPreviewData(cached);
    } else {
      // If no cached data, redirect to submit form
      console.log('GrievancePreview: No cached data, redirecting to submit form');
      setLocation('/user/submit-grievance');
    }
  }, [setLocation]);

  if (!previewData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Preparing grievance preview...
        </div>
      </div>
    );
  }

  const handleBackToEdit = () => {
    if (previewData) {
      persistPreviewCache(previewData);
    }
    setLocation('/user/submit-grievance');
  };

  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);
    try {
      // Submit the grievance without preview mode (final submission)
      const finalData = {
        title: previewData.grievance.title,
        description: previewData.grievance.description,
        issue_tags: previewData.ai_generated_tags, // Use AI-generated tags
        cluster: previewData.grievance.cluster,
        cluster_tags: previewData.grievance.cluster_tags,
        documents: previewData.documents,
        status: previewData.grievance.status as 'NEW' | 'IN_PROGRESS' | 'SOLVED' | 'REJECTED' | 'DROPPED',
        assigned_to: previewData.grievance.assigned_to,
        preview: false, // Disable preview mode for final submission
      };

      const response = await submitGrievance(finalData);

      toast({
        title: 'Grievance Submitted',
        description: `Your grievance has been successfully submitted. ID: ${response.grievance.id}`,
      });

      setShowThankYou(true);
      setTimeout(() => {
        clearPreviewCache();
        setLocation('/user/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error submitting grievance:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit your grievance. Please try again.',
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
            Your grievance has been successfully submitted.
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
            AI has analyzed your grievance and generated relevant tags and suggestions
          </p>
        </div>

        {/* Grievance Card */}
        <Card className="overflow-hidden backdrop-blur-sm bg-card/80 shadow-lg border border-border/40">
          <CardContent className="p-8 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2">{previewData.grievance.title}</h2>
              <Badge variant="secondary" className="mb-3">
                {previewData.grievance.assigned_to}
              </Badge>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {previewData.grievance.description}
            </p>

            <Separator className="my-4" />

            {/* AI-Generated Tags */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-primary">AI-Generated Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {previewData.ai_generated_tags.map((tag, index) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                      {tag}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <Separator className="my-4" />

            {/* AI Summary */}
            {previewData.ai_summary && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-primary">AI Suggestion</h3>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="text-sm text-foreground leading-relaxed mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc list-inside text-sm space-y-1 my-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside text-sm space-y-1 my-2">{children}</ol>,
                        li: ({ children }) => <li className="text-foreground">{children}</li>,
                      }}
                    >
                      {previewData.ai_summary}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}

            {previewData.ai_summary && <Separator className="my-4" />}

            
          </CardContent>
        </Card>

        {/* Buttons Section */}
        <div className="grid sm:grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleBackToEdit}
              variant="outline"
              className="w-full h-14 text-base"
              data-testid="button-back-edit"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Edit
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleConfirmSubmission}
              className="w-full h-14 text-base"
              data-testid="button-confirm-submit"
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
                  Confirm & Submit
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
