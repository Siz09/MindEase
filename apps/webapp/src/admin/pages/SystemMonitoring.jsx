'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/skeleton';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/Badge';
import { Activity, Database, Bot, CheckCircle2, XCircle, AlertCircle, Send } from 'lucide-react';
import adminApi from '../adminApi';

export default function SystemMonitoring() {
  const [systemStatus, setSystemStatus] = useState({
    apiStatus: 'checking...',
    database: 'checking...',
    aiEngine: 'checking...',
  });
  const [health, setHealth] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    connectedUsers: 0,
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [sending, setSending] = useState(false);
  const [announcementError, setAnnouncementError] = useState(null);

  const loadSystemStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, healthRes, errorsRes] = await Promise.all([
        adminApi.get('/admin/system/status').catch(() => ({ data: {} })),
        adminApi.get('/admin/system/health').catch(() => ({ data: {} })),
        adminApi.get('/admin/system/errors').catch(() => ({ data: [] })),
      ]);

      setSystemStatus(
        statusRes.data || {
          apiStatus: 'down',
          database: 'unknown',
          aiEngine: 'unknown',
        }
      );
      setHealth(healthRes.data || {});
      setErrors(Array.isArray(errorsRes.data) ? errorsRes.data : []);
    } catch {
      setSystemStatus({
        apiStatus: 'down',
        database: 'unreachable',
        aiEngine: 'unreachable',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcement.trim()) return;

    setSending(true);
    setAnnouncementError(null);
    try {
      await adminApi.post('/admin/system/notifications', { message: announcement });
      setAnnouncement('');
    } catch (err) {
      const errorMessage = err?.message || String(err) || 'Failed to send announcement';
      setAnnouncementError(errorMessage);
      console.error('Failed to send announcement:', err);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 30000);
    return () => clearInterval(interval);
  }, [loadSystemStatus]);

  const getStatusIcon = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('up') || statusLower.includes('ok') || statusLower === 'operational') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (statusLower.includes('down') || statusLower.includes('error')) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-amber-600" />;
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('up') || statusLower.includes('ok') || statusLower === 'operational') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Operational</Badge>;
    }
    if (statusLower.includes('down') || statusLower.includes('error')) {
      return <Badge variant="destructive">Down</Badge>;
    }
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-800">
        Unknown
      </Badge>
    );
  };

  const statusCards = [
    {
      label: 'API Status',
      value: systemStatus.apiStatus,
      icon: Activity,
      iconColor: 'text-blue-600',
    },
    {
      label: 'Database',
      value: systemStatus.database,
      icon: Database,
      iconColor: 'text-purple-600',
    },
    {
      label: 'AI Engine',
      value: systemStatus.aiEngine,
      icon: Bot,
      iconColor: 'text-green-600',
    },
  ];

  const healthMetrics = [
    {
      label: 'CPU Usage',
      value: health.cpu || 0,
    },
    {
      label: 'Memory Usage',
      value: health.memory || 0,
    },
    {
      label: 'Disk Usage',
      value: health.disk || 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health & Monitoring</h1>
        <p className="text-muted-foreground">Real-time system performance and diagnostics</p>
      </div>

      {loading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Loading system status…</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {statusCards.map((status) => {
          const Icon = status.icon;
          return (
            <Card key={status.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{status.label}</CardTitle>
                <Icon className={`h-4 w-4 ${status.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>{getStatusIcon(status.value)}</div>
                  <div>{getStatusBadge(status.value)}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Resource utilization metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthMetrics.map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">{metric.label}</Label>
                  <span className="text-sm font-medium">{metric.value}%</span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            ))}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Connected Users</Label>
                <span className="text-sm font-medium">{health.connectedUsers || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Errors</CardTitle>
            <CardDescription>System error log</CardDescription>
          </CardHeader>
          <CardContent>
            {errors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent errors</p>
            ) : (
              <div className="space-y-2">
                {errors.slice(0, 5).map((error, idx) => (
                  <div key={idx} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                    <p className="font-medium text-red-900">{error.message || 'Error'}</p>
                    {error.timestamp && (
                      <p className="text-xs text-red-700 mt-1">
                        {new Date(error.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send System Announcement</CardTitle>
          <CardDescription>Broadcast a message to all users</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendAnnouncement} className="space-y-4">
            {announcementError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{announcementError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="announcement">Message</Label>
              <Input
                id="announcement"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Enter announcement message..."
                disabled={sending}
              />
            </div>
            <Button type="submit" disabled={sending || !announcement.trim()}>
              <Send className="mr-2 h-4 w-4" />
              {sending ? 'Sending...' : 'Send Announcement'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
