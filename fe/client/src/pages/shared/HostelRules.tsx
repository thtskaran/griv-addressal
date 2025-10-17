import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Home, Clock, Users, Shield, AlertTriangle } from 'lucide-react';

const rules = [
  {
    icon: Clock,
    title: 'Timings',
    items: [
      'Entry gate closes at 10:00 PM on weekdays',
      'Extended hours until 11:00 PM on weekends',
      'Late entry requires prior permission from warden',
    ],
  },
  {
    icon: Users,
    title: 'Visitors',
    items: [
      'Visitors allowed only in designated areas',
      'Valid ID required for all visitors',
      'Visiting hours: 4:00 PM - 8:00 PM',
    ],
  },
  {
    icon: Shield,
    title: 'Safety & Security',
    items: [
      'Keep room locked when not present',
      'Report suspicious activities immediately',
      'Fire safety equipment must not be tampered with',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Prohibited Items',
    items: [
      'No cooking equipment in rooms',
      'Alcohol and tobacco strictly prohibited',
      'No pets allowed in hostel premises',
    ],
  },
  {
    icon: Home,
    title: 'Room Maintenance',
    items: [
      'Keep rooms clean and hygienic',
      'Report damages within 24 hours',
      'No structural modifications allowed',
    ],
  },
];

export default function HostelRules() {
  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Hostel Rules & Regulations</h1>
          <p className="text-muted-foreground text-lg">
            Please familiarize yourself with the hostel guidelines
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {rules.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full backdrop-blur-sm bg-card/80">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1">•</span>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Card className="max-w-4xl mx-auto mt-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">Important Notice</h3>
            <p className="text-sm text-muted-foreground">
              Violation of any hostel rules may result in disciplinary action. For any clarifications,
              please contact the hostel warden or administration office.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
