'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/skeleton';
import { AlertTriangle, Download, TrendingUp, Users, Activity } from 'lucide-react';
import adminApi from '../adminApi';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [metrics, setMetrics] = useState({
    dau: 0,
    mau: 0,
    retention: 0,
    churn: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminApi.get(`/admin/analytics/overview?range=${dateRange}`);
      setMetrics(data || { dau: 0, mau: 0, retention: 0, churn: 0 });
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Failed to load analytics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const metricCards = [
    {
      label: 'DAU',
      value: metrics.dau,
      description: 'Daily Active Users',
      icon: Users,
      iconColor: 'text-blue-600',
    },
    {
      label: 'MAU',
      value: metrics.mau,
      description: 'Monthly Active Users',
      icon: Activity,
      iconColor: 'text-purple-600',
    },
    {
      label: 'Retention',
      value: `${(metrics.retention || 0).toFixed(1)}%`,
      description: 'Month-over-Month',
      icon: TrendingUp,
      iconColor: 'text-green-600',
    },
    {
      label: 'Churn',
      value: `${(metrics.churn || 0).toFixed(1)}%`,
      description: 'Monthly Churn Rate',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-muted-foreground">Deep-dive analytics and usage patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="ghost" size="sm" onClick={loadAnalytics} className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="crisis">Crisis Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {metricCards.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <Card
                      key={metric.label}
                      className="transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {metric.label}
                        </CardTitle>
                        <div
                          className={`rounded-lg p-2 bg-${metric.iconColor.replace('text-', '')}/10`}
                        >
                          <Icon className={`h-4 w-4 ${metric.iconColor}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold transition-all duration-300">
                          {metric.value}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>Last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                      [User Growth Chart]
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Feature Usage</CardTitle>
                    <CardDescription>Platform engagement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                      [Feature Usage Chart]
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <span>Premium Subscribers</span>
                  <span className="font-bold text-primary">1,234</span>
                </div>
                <div className="flex items-center justify-between border-b pb-4">
                  <span>Free Users</span>
                  <span className="font-bold">5,678</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Inactive (30+ days)</span>
                  <span className="font-bold text-muted-foreground">2,345</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>Daily requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                [API Usage Chart]
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crisis">
          <Card>
            <CardHeader>
              <CardTitle>Crisis Flags Over Time</CardTitle>
              <CardDescription>Historical trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                [Crisis Trends Chart]
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
