import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { getClusterAnalytics, getAISummary, getAdminGrievances } from '@/lib/grievancesApi';
import { useToast } from '@/hooks/use-toast';

export default function Analytics() {
  const [clusterData, setClusterData] = useState<{ cluster: string; count: number; top_tags: string[] }[]>([]);
  const [isLoadingClusters, setIsLoadingClusters] = useState(true);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [grievances, setGrievances] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchClusterData();
    fetchGrievances();
  }, []);

  const fetchClusterData = async () => {
    setIsLoadingClusters(true);
    try {
      const response = await getClusterAnalytics();
      setClusterData(response.analytics);
    } catch (error) {
      console.error('Failed to fetch cluster analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cluster analytics.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingClusters(false);
    }
  };

  const fetchGrievances = async () => {
    try {
      const response = await getAdminGrievances();
      setGrievances(response.grievances);
    } catch (error) {
      console.error('Failed to fetch grievances:', error);
    }
  };

  const fetchAISummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await getAISummary();
      setAiSummary(response.summary);
    } catch (error) {
      console.error('Failed to fetch AI summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI summary.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Calculate status distribution from real data
  const statusData = grievances.reduce((acc: { name: string; value: number }[], g: any) => {
    const existing = acc.find((item: { name: string; value: number }) => item.name === g.status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: g.status, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Calculate department distribution
  const departmentData = grievances.reduce((acc: { name: string; value: number }[], g: any) => {
    const dept = g.assigned_to || 'Unassigned';
    const existing = acc.find((item: { name: string; value: number }) => item.name === dept);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: dept, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const totalGrievances = grievances.length;
  const resolvedCount = grievances.filter((g: any) => g.status === 'SOLVED').length;
  const pendingCount = grievances.filter((g: any) => g.status === 'NEW').length;
  const resolutionRate = totalGrievances > 0 ? ((resolvedCount / totalGrievances) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Grievances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGrievances}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolutionRate}%</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Summary Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }}>
        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI-Generated Summary
              </CardTitle>
              <Button
                onClick={fetchAISummary}
                disabled={isLoadingSummary}
                variant="outline"
              >
                {isLoadingSummary ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Summary'
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {aiSummary ? (
              <p className="text-muted-foreground leading-relaxed">{aiSummary}</p>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Click "Generate Summary" to get AI-powered insights and trends.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.6 }}>
        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle className="text-2xl">Grievance Analytics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8 md:grid-cols-2">
            {/* Status Distribution Pie Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Grievances by Status</h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      dataKey="value"
                    >
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>

            {/* Department Distribution Bar Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Grievances by Department</h3>
              {departmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis allowDecimals={false} className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}/>
                    <Bar dataKey="value" name="Count" radius={[8, 8, 0, 0]}>
                      {departmentData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cluster Analytics Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.7 }}>
        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle>Grievance Clusters</CardTitle>
            <p className="text-sm text-muted-foreground">Automatically identified grievance clusters from your data.</p>
          </CardHeader>
          <CardContent>
            {isLoadingClusters ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading cluster analytics...</p>
              </div>
            ) : clusterData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clusterData} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="cluster" type="category" width={100} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
                            <p className="font-semibold">{data.cluster}</p>
                            <p className="text-sm">Count: {data.count}</p>
                            <p className="text-sm">Top tags: {data.top_tags.join(', ')}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" name="Grievance Count" radius={[0, 8, 8, 0]}>
                    {clusterData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No cluster data available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
