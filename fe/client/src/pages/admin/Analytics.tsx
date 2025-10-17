import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

// **UPDATED MOCK DATA** with sub-categories for the new drill-down feature.
// In your real app, this would come from your API.
const mockGrievances = [
  // Hostel
  { id: 1, title: 'Slow Wifi in Block C', category: 'Hostel', subCategory: 'Wifi', status: 'Open' },
  { id: 2, title: 'Mess food quality is poor', category: 'Hostel', subCategory: 'Food', status: 'In Progress' },
  { id: 3, title: 'Frequent power cuts', category: 'Hostel', subCategory: 'Electricity', status: 'Resolved' },
  { id: 4, title: 'Another wifi issue', category: 'Hostel', subCategory: 'Wifi', status: 'Open' },
  { id: 5, title: 'Unclean washrooms', category: 'Hostel', subCategory: 'Cleanliness', status: 'Resolved' },
  { id: 6, title: 'Late night food availability', category: 'Hostel', subCategory: 'Food', status: 'In Progress' },
  { id: 7, title: 'AC not working', category: 'Hostel', subCategory: 'Electricity', status: 'Open' },
  { id: 8, title: 'Slow Wifi again', category: 'Hostel', subCategory: 'Wifi', status: 'In Progress' },
  
  // Academic
  { id: 9, title: 'Exam schedule clash', category: 'Academic', subCategory: 'Exams', status: 'Open' },
  { id: 10, title: 'Syllabus not completed for CS101', category: 'Academic', subCategory: 'Syllabus', status: 'In Progress' },
  { id: 11, title: 'Grading error in mid-terms', category: 'Academic', subCategory: 'Grading', status: 'Resolved' },
  { id: 12, title: 'Need more library books', category: 'Academic', subCategory: 'Library', status: 'Open' },
  { id: 13, title: 'Request for course material', category: 'Academic', subCategory: 'Syllabus', status: 'Resolved' },

  // Facilities
  { id: 14, title: 'Broken gym equipment', category: 'Facilities', subCategory: 'Gym', status: 'Open' },
  { id: 15, title: 'Not enough parking space', category: 'Facilities', subCategory: 'Parking', status: 'In Progress' },
  { id: 16, title: 'Water cooler not working', category: 'Facilities', subCategory: 'Water', status: 'Resolved' },
];


export default function Analytics() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // **NEW**: State to hold cluster analytics data from the backend
  const [clusterData, setClusterData] = useState([]);

  // **NEW**: useEffect to fetch cluster data on component mount
  useEffect(() => {
    // TODO: Replace this with an actual API call to GET /admin/analytics/clusters
    const fetchClusterData = () => {
      // This is sample data matching your backend response structure
      const response = {
        analytics: [
          { cluster: "Infrastructure", count: 18, top_tags: ["hostel", "library"] },
          { cluster: "Academics", count: 12, top_tags: ["exams", "syllabus"] },
          { cluster: "Administration", count: 7, top_tags: ["fees", "documents"] },
          { cluster: "Faculty Performance", count: 5, top_tags: ["lectures", "grading"] },
        ],
      };
      setClusterData(response.analytics);
    };

    fetchClusterData();
  }, []); // Empty dependency array ensures this runs only once

  // Calculate category distribution
  const categoryData = mockGrievances.reduce((acc, g) => {
    const existing = acc.find((item) => item.name === g.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: g.category, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const resolutionData = [
    { category: 'Academic', avgDays: 5 },
    { category: 'Hostel', avgDays: 3 },
    { category: 'Facilities', avgDays: 4 },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const handlePieClick = (data: any) => {
    setSelectedCategory(data.name);
  };

  // Filter grievances based on the selected category
  const categoryGrievances = selectedCategory
    ? mockGrievances.filter((g) => g.category === selectedCategory)
    : [];

  // **MODIFIED**: Calculate SUB-CATEGORY distribution for the selected category
  const subCategoryData = categoryGrievances.reduce((acc, g) => {
    const existing = acc.find((item) => item.name === g.subCategory);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: g.subCategory, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle className="text-2xl">Grievance Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8 md:grid-cols-2">
            {/* Pie Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Grievances by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    // ... other props
                    onClick={handlePieClick}
                    dataKey="value"
                    cursor="pointer"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {/* Category buttons */}
            </div>
            {/* Resolution Time Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Average Resolution Time (Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resolutionData}>
                  {/* ... chart components */}
                  <Bar dataKey="avgDays" fill="hsl(var(--primary))" name="Avg Days" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* **MODIFIED**: This section now shows a SUB-CATEGORY bar chart */}
      {selectedCategory && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="backdrop-blur-sm bg-card/80">
            <CardHeader>
              <CardTitle>Sub-Category Breakdown for "{selectedCategory}"</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}/>
                  <Bar dataKey="value" name="Count" radius={[8, 8, 0, 0]}>
                    {subCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* **NEW**: Cluster Analytics Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle>Grievance Clusters</CardTitle>
            <p className="text-sm text-muted-foreground">Automatically identified grievance clusters from your data.</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clusterData} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="cluster" type="category" width={80} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}/>
                  <Bar dataKey="count" name="Grievance Count" radius={[0, 8, 8, 0]}>
                     {clusterData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}