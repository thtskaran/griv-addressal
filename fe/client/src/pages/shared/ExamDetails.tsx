import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Calendar, FileText, Download, ExternalLink } from 'lucide-react';

const exams = [
  {
    id: 1,
    title: 'End Semester Examination - Spring 2025',
    date: 'March 15 - March 30, 2025',
    status: 'Upcoming',
    forms: ['Exam Form', 'Admit Card'],
  },
  {
    id: 2,
    title: 'Mid Semester Examination - Spring 2025',
    date: 'February 10 - February 15, 2025',
    status: 'Completed',
    forms: ['Result Sheet'],
  },
  {
    id: 3,
    title: 'Supplementary Examination',
    date: 'April 5 - April 10, 2025',
    status: 'Registration Open',
    forms: ['Supplementary Form', 'Fee Payment'],
  },
];

const guidelines = [
  'Students must carry their admit card and valid ID to the examination hall',
  'Mobile phones and electronic devices are strictly prohibited',
  'Arrive at least 30 minutes before the exam start time',
  'Use of unfair means will result in cancellation of examination',
  'Follow the dress code as specified by the university',
];

export default function ExamDetails() {
  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">MAKAUT Exam Details</h1>
          <p className="text-muted-foreground text-lg">
            Important examination information and schedules
          </p>
        </div>

        <div className="grid gap-6 max-w-6xl mx-auto">
          {exams.map((exam, index) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="backdrop-blur-sm bg-card/80">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{exam.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {exam.date}
                      </div>
                    </div>
                    <Badge
                      variant={exam.status === 'Upcoming' ? 'default' : exam.status === 'Completed' ? 'secondary' : 'outline'}
                    >
                      {exam.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {exam.forms.map((form) => (
                      <Button key={form} variant="outline" size="sm" data-testid={`button-${form.toLowerCase().replace(' ', '-')}`}>
                        <FileText className="w-4 h-4 mr-2" />
                        {form}
                        <Download className="w-3 h-3 ml-2" />
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="max-w-4xl mx-auto backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle>Examination Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {guidelines.map((guideline, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary mt-1 font-bold">{index + 1}.</span>
                  <span className="text-muted-foreground">{guideline}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex gap-3">
              <Button data-testid="button-visit-makaut">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit MAKAUT Website
              </Button>
              <Button variant="outline" data-testid="button-download-schedule">
                <Download className="w-4 h-4 mr-2" />
                Download Full Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
