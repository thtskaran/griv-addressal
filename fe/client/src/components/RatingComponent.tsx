import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface RatingComponentProps {
  grievanceId: string;
  grievanceTitle: string;
  onSubmit?: (rating: number, feedback: string) => void;
}

export default function RatingComponent({ grievanceId, grievanceTitle, onSubmit }: RatingComponentProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    // todo: remove mock functionality
    onSubmit?.(rating, feedback);
    setSubmitted(true);
    
    toast({
      title: 'Thank you for your feedback!',
      description: 'Your rating has been submitted successfully.',
    });
  };

  if (submitted) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 fill-green-500 text-green-500" />
          </div>
          <h3 className="font-semibold text-lg mb-2">✅ Thank you for your feedback!</h3>
          <p className="text-sm text-muted-foreground">Your rating has been recorded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Your Experience</CardTitle>
        <p className="text-sm text-muted-foreground">How satisfied are you with the resolution?</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
              data-testid={`star-${star}`}
            >
              <Star
                className={`w-10 h-10 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Share your feedback (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          data-testid="textarea-feedback"
        />

        <Button onClick={handleSubmit} className="w-full" data-testid="button-submit-rating">
          Submit Rating
        </Button>
      </CardContent>
    </Card>
  );
}
