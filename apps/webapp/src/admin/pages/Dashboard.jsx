'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Users, UserPlus, AlertTriangle, Bot, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import adminApi from '../adminApi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import useAnimatedCounter from '../hooks/useAnimatedCounter';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  Tooltip,
  Legend
);

const fmt = (d) => new Date(d).toLocaleDateString();

function normalizeOverview(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  return {
    activeUsers: Number(data.activeUsers ?? data.active_users ?? 0) || 0,
    dailySignups: Number(data.dailySignups ?? data.signupsToday ?? data.signups_today ?? 0) || 0,
    crisisFlags: Number(data.crisisFlags ?? data.crisisLast24h ?? data.crisis_last_24h ?? 0) || 0,
    aiUsage: Number(data.aiUsage ?? data.aiCallsLast24h ?? data.ai_calls_last_24h ?? 0) || 0,
    activeUsersTrend: data.activeUsersTrend ?? data.active_users_trend ?? null,
    dailySignupsTrend: data.dailySignupsTrend ?? data.signupsTrend ?? data.signups_trend ?? null,
    crisisFlagsTrend: data.crisisFlagsTrend ?? data.crisisTrend ?? data.crisis_trend ?? null,
    aiUsageTrend: data.aiUsageTrend ?? data.ai_usage_trend ?? null,
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    dailySignups: 0,
    crisisFlags: 0,
    aiUsage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [crisisStats, setCrisisStats] = useState({ high: 0, medium: 0, low: 0 });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const activityChartRef = useRef(null);
  const crisisChartRef = useRef(null);
  const charts = useRef({ activity: null, crisis: null });
  const isCanvasLive = (canvas) => !!(canvas && canvas.ownerDocument && canvas.isConnected);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setError(null);
        setLoading(true);

        const [statsRes, activityRes, alertsRes, crisisStatsRes] = await Promise.allSettled([
          adminApi.get('/admin/dashboard/overview'),
          adminApi.get('/admin/dashboard/activity-trend'),
          adminApi.get('/admin/dashboard/recent-alerts'),
          adminApi.get('/admin/crisis-flags/stats?timeRange=24h'),
        ]);

        if (mounted) {
          const failures = [];
          if (statsRes.status === 'rejected') failures.push('overview stats');
          if (activityRes.status === 'rejected') failures.push('activity data');
          if (alertsRes.status === 'rejected') failures.push('recent alerts');
          if (crisisStatsRes.status === 'rejected') failures.push('crisis stats');

          if (failures.length > 0) {
            setError(`Failed to load: ${failures.join(', ')}`);
          }

          if (statsRes.status === 'fulfilled') {
            setStats(normalizeOverview(statsRes.value.data));
          }

          const activityPayload =
            activityRes.status === 'fulfilled' && Array.isArray(activityRes.value.data)
              ? activityRes.value.data
              : [];
          const alertsPayload =
            alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value.data)
              ? alertsRes.value.data
              : [];

          setActivityData(activityPayload);
          if (crisisStatsRes.status === 'fulfilled') {
            const raw = crisisStatsRes.value?.data || {};
            setCrisisStats({
              high: Number(raw.high) || 0,
              medium: Number(raw.medium) || 0,
              low: Number(raw.low) || 0,
            });
          } else {
            setCrisisStats({ high: 0, medium: 0, low: 0 });
          }
          setRecentAlerts(alertsPayload);
          setLastUpdated(new Date());
        }
      } catch {
        if (mounted) {
          setError('Failed to load dashboard data');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(charts.current).forEach((c) => c?.destroy?.());
    };
  }, []);

  useEffect(() => {
    if (error) return;

    if (activityChartRef.current) {
      const canvas = activityChartRef.current;
      const labels = (activityData || []).map((pt) => fmt(pt.day));
      const values = (activityData || []).map(
        (pt) => pt.activeUsers ?? pt.active_users ?? pt.count ?? 0
      );

      if (!charts.current.activity && isCanvasLive(canvas) && activityData.length > 0) {
        try {
          charts.current.activity = new Chart(canvas, {
            type: 'line',
            data: {
              labels,
              datasets: [
                {
                  label: 'Daily Active Users',
                  data: values,
                  borderColor: 'hsl(var(--primary))',
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: { y: { beginAtZero: true } },
            },
          });
        } catch {
          // Failed to create activity chart - error handled silently
        }
      } else if (
        charts.current.activity &&
        charts.current.activity.canvas &&
        isCanvasLive(charts.current.activity.canvas)
      ) {
        charts.current.activity.data.labels = labels;
        charts.current.activity.data.datasets[0].data = values;
        try {
          charts.current.activity.update();
        } catch {
          // ignore update errors
        }
      }
    }

    if (crisisChartRef.current) {
      const canvas = crisisChartRef.current;
      const labels = ['High', 'Medium', 'Low'];
      const values = [crisisStats?.high || 0, crisisStats?.medium || 0, crisisStats?.low || 0];

      if (!charts.current.crisis && isCanvasLive(canvas)) {
        try {
          charts.current.crisis = new Chart(canvas, {
            type: 'bar',
            data: {
              labels,
              datasets: [
                {
                  label: 'Crisis Flags',
                  data: values,
                  backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: { y: { beginAtZero: true } },
            },
          });
        } catch {
          // Failed to create crisis chart
        }
      } else if (
        charts.current.crisis &&
        charts.current.crisis.canvas &&
        isCanvasLive(charts.current.crisis.canvas)
      ) {
        charts.current.crisis.data.labels = labels;
        charts.current.crisis.data.datasets[0].data = values;
        try {
          charts.current.crisis.update();
        } catch {
          // ignore update errors
        }
      }
    }
  }, [activityData, crisisStats, error]);

  const formatTrendText = (trendValue) => {
    if (trendValue == null) return 'No trend data';
    if (typeof trendValue === 'string' && trendValue.trim().length) return trendValue;
    if (typeof trendValue === 'number' && !Number.isNaN(trendValue)) {
      if (trendValue === 0) return '→ 0.0% vs last week';
      return `${trendValue > 0 ? '↑' : '↓'} ${Math.abs(trendValue).toFixed(1)}% vs last week`;
    }
    return 'No trend data';
  };

  const getTrendIcon = (trendValue) => {
    if (trendValue == null || typeof trendValue !== 'number') return null;
    if (trendValue > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (trendValue < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const animatedActiveUsers = useAnimatedCounter(stats.activeUsers, 1000);
  const animatedDailySignups = useAnimatedCounter(stats.dailySignups, 1000);
  const animatedCrisisFlags = useAnimatedCounter(stats.crisisFlags, 1000);
  const animatedAIUsage = useAnimatedCounter(stats.aiUsage, 1000);

  const statCards = [
    {
      label: 'Active Users',
      value: animatedActiveUsers,
      trend: stats.activeUsersTrend,
      icon: Users,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Daily Signups',
      value: animatedDailySignups,
      trend: stats.dailySignupsTrend,
      icon: UserPlus,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Crisis Flags',
      value: animatedCrisisFlags,
      trend: stats.crisisFlagsTrend,
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'AI Usage',
      value: animatedAIUsage,
      trend: stats.aiUsageTrend,
      icon: Bot,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with MindEase today.
        </p>
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && !loading && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  className="transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold transition-all duration-300">
                      {stat.value?.toLocaleString() || '0'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      {getTrendIcon(stat.trend)}
                      <span>{formatTrendText(stat.trend)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Activity (Last 30 Days)</CardTitle>
                <CardDescription>Daily active users trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <canvas ref={activityChartRef} style={{ width: '100%', height: '100%' }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Crisis Flags Distribution</CardTitle>
                <CardDescription>Risk level breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <canvas ref={crisisChartRef} style={{ width: '100%', height: '100%' }} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts & Events</CardTitle>
              <CardDescription>Latest system notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAlerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent alerts</p>
              ) : (
                <div className="space-y-2">
                  {recentAlerts.slice(0, 5).map((alert, idx) => (
                    <div
                      key={alert.id || alert.createdAt || alert.timestamp || `alert-${idx}`}
                      className="flex items-center gap-4 rounded-lg border-l-4 border-yellow-500 bg-muted/50 p-4"
                    >
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-semibold">{alert.title || 'Alert'}</p>
                        <p className="text-sm text-muted-foreground">
                          {alert.message || 'System alert'}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {alert.timestamp
                          ? new Date(alert.timestamp).toLocaleTimeString()
                          : 'Recently'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="text-green-600 font-semibold">✓</span>
                <span>All systems operational</span>
                {lastUpdated && (
                  <>
                    <span>•</span>
                    <span>Last updated {lastUpdated.toLocaleTimeString()}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
