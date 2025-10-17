import { useState } from 'react';
import { useLocation } from 'wouter';
import { Upload, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { submitGrievance, type Document } from '@/lib/grievancesApi';

export default function SubmitGrievance() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    issueTags: [] as string[],
    cluster: '',
    clusterTags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [clusterTagInput, setClusterTagInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.issueTags.includes(tagInput.trim())) {
      setFormData({ ...formData, issueTags: [...formData.issueTags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, issueTags: formData.issueTags.filter(t => t !== tag) });
  };

  const handleAddClusterTag = () => {
    if (clusterTagInput.trim() && !formData.clusterTags.includes(clusterTagInput.trim())) {
      setFormData({ ...formData, clusterTags: [...formData.clusterTags, clusterTagInput.trim()] });
      setClusterTagInput('');
    }
  };

  const handleRemoveClusterTag = (tag: string) => {
    setFormData({ ...formData, clusterTags: formData.clusterTags.filter(t => t !== tag) });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert files to base64 documents
      const documents: Document[] = await Promise.all(
        files.map(async (file) => ({
          filename: file.name,
          content_base64: await convertFileToBase64(file),
          content_type: file.type,
        }))
      );

      const grievanceData = {
        title: formData.title,
        description: formData.description || undefined,
        issue_tags: formData.issueTags.length > 0 ? formData.issueTags : undefined,
        cluster: formData.cluster || undefined,
        cluster_tags: formData.clusterTags.length > 0 ? formData.clusterTags : undefined,
        documents: documents.length > 0 ? documents : undefined,
      };

      const response = await submitGrievance(grievanceData);

      toast({
        title: 'Grievance Submitted',
        description: `Your grievance has been submitted successfully. ID: ${response.grievance.id}`,
      });

      setIsSubmitting(false);
      setLocation('/user/dashboard');
    } catch (error) {
      console.error('Error submitting grievance:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit your grievance. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="max-w-3xl mx-auto backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle className="text-2xl">Submit New Grievance</CardTitle>
            <p className="text-sm text-muted-foreground">Fill out the form below to submit your grievance</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief title for your grievance"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your grievance..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  data-testid="textarea-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue-tags">Issue Tags (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="issue-tags"
                    placeholder="Add tags (e.g., library, ac_issue)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.issueTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="pl-2 pr-1">
                      {tag}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cluster">Cluster (Optional)</Label>
                <Input
                  id="cluster"
                  placeholder="e.g., library > ac_issue"
                  value={formData.cluster}
                  onChange={(e) => setFormData({ ...formData, cluster: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cluster-tags">Cluster Tags (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="cluster-tags"
                    placeholder="Add cluster tags"
                    value={clusterTagInput}
                    onChange={(e) => setClusterTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddClusterTag())}
                  />
                  <Button type="button" onClick={handleAddClusterTag} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.clusterTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="pl-2 pr-1">
                      {tag}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer"
                        onClick={() => handleRemoveClusterTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachment">Upload Supporting Documents (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <Input
                    id="attachment"
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="input-file"
                  />
                  <Label htmlFor="attachment" className="cursor-pointer">
                    <span className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG or PDF (max 5MB each)</p>
                  </Label>
                </div>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
                data-testid="button-submit-grievance"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Grievance'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
