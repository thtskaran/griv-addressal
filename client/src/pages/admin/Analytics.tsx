import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mockGrievances } from '@/lib/data';
import { motion } from 'framer-motion';

export default function Analytics() {
  // todo: remove mock functionality - Calculate category distribution
  const categoryData = mockGrievances.reduce((acc, g) => {
    const existing = acc.find((item) => item.name === g.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: g.category, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // todo: remove mock functionality - Mock resolution time data
  const resolutionData = [
    { category: 'Academic', avgDays: 5 },
    { category: 'Hostel', avgDays: 3 },
    { category: 'Facilities', avgDays: 4 },
    { category: 'Admin', avgDays: 6 },
    { category: 'Other', avgDays: 4 },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle className="text-2xl">Analytics Dashboard</CardTitle>
            <p className="text-sm text-muted-foreground">Visualize grievance trends and performance metrics</p>
          </CardHeader>
          <CardContent className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-4">Grievances by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap gap-3">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Average Resolution Time (Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resolutionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="avgDays" fill="hsl(var(--primary))" name="Avg Days" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
