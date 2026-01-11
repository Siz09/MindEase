import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/skeleton';
import { Label } from '../../components/ui/Label';
import { AlertTriangle } from 'lucide-react';
import adminApi from '../adminApi';

const getRiskLevel = (score) => {
  if (score >= 8) return 'HIGH';
  if (score >= 5) return 'MEDIUM';
  return 'LOW';
};

const getRiskBadge = (score) => {
  const level = getRiskLevel(score);
  if (level === 'HIGH') {
    return <Badge variant="destructive">HIGH</Badge>;
  }
  if (level === 'MEDIUM') {
    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">MEDIUM</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">LOW</Badge>;
};

export default function CrisisMonitoring() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [_totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    timeRange: '24h',
  });
  const [stats, setStats] = useState({
    high: 0,
    medium: 0,
    low: 0,
  });
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const esRef = useRef(null);
  const inFlightRef = useRef(false);
  const pageRef = useRef(page);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    loadFlags();
  }, [page, pageSize, filters]);

  useEffect(() => {
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
    const sseUrl = `${base}/api/admin/crisis-flags/stream`;

    try {
      if (esRef.current) esRef.current.close();
      const es = new EventSource(sseUrl, { withCredentials: true });
      const fallbackTimer = setTimeout(() => es.close(), 2500);

      es.onopen = () => clearTimeout(fallbackTimer);

      const onFlag = (ev) => {
        try {
          const flag = JSON.parse(ev.data);
          if (
            !flag ||
            !flag.userId ||
            typeof flag.riskScore !== 'number' ||
            !flag.id ||
            (typeof flag.id === 'string' && !flag.id.trim())
          )
            return;
          const flagLevel = getRiskLevel(flag.riskScore * 100).toLowerCase();
          const matchesFilter = filters.riskLevel === 'all' || filters.riskLevel === flagLevel;
          if (pageRef.current === 0 && matchesFilter) {
            setFlags((prev) => [flag, ...prev].slice(0, pageSize));
          }
        } catch {
          // Ignore errors in event handler
        }
      };

      es.onmessage = onFlag;
      es.addEventListener('flag', onFlag);
      es.onerror = () => es.close();
      esRef.current = es;
    } catch {
      // Ignore EventSource initialization errors
    }

    return () => {
      if (esRef.current) esRef.current.close();
    };
  }, [pageSize, filters.riskLevel]);

  const loadFlags = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page, size: pageSize });
      if (filters.riskLevel !== 'all') params.append('riskLevel', filters.riskLevel);
      if (filters.timeRange && filters.timeRange !== 'all') {
        params.append('timeRange', filters.timeRange);
      }

      const [listRes, statsRes] = await Promise.all([
        adminApi.get(`/admin/crisis-flags?${params.toString()}`),
        adminApi
          .get(
            `/admin/crisis-flags/stats${
              filters.timeRange && filters.timeRange !== 'all'
                ? `?timeRange=${encodeURIComponent(filters.timeRange)}`
                : ''
            }`
          )
          .catch(() => ({ data: { high: 0, medium: 0, low: 0 } })),
      ]);

      const data = listRes.data || {};
      setFlags(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalElements || 0);
      setStats(statsRes.data || { high: 0, medium: 0, low: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load data');
      setFlags([]);
      setTotalPages(0);
      setTotalItems(0);
      setStats({ high: 0, medium: 0, low: 0 });
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  const handleResolveFlag = async (flagId) => {
    if (!window.confirm('Mark this flag as resolved?')) return;
    try {
      await adminApi.post(`/admin/crisis-flags/${flagId}/resolve`);
      loadFlags();
      setShowModal(false);
    } catch {
      // Ignore resolve errors
    }
  };

  const statCards = [
    { label: 'High Risk', value: stats.high, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Medium Risk', value: stats.medium, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Low Risk', value: stats.low, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crisis Monitoring</h1>
        <p className="text-muted-foreground">Monitor and manage crisis flags in real-time</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card
            key={stat.label}
            className={`${stat.bg} transition-all duration-300 hover:shadow-md hover:scale-[1.02]`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <AlertTriangle className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold transition-all duration-300 ${stat.color}`}>
                {stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.riskLevel}
              onValueChange={(value) => {
                setFilters({ ...filters, riskLevel: value });
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.timeRange}
              onValueChange={(value) => {
                setFilters({ ...filters, timeRange: value });
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : flags.length > 0 ? (
                  flags.map((flag) => (
                    <TableRow
                      key={flag.id}
                      className="cursor-pointer transition-all duration-200 hover:bg-muted/50"
                      onClick={() => {
                        setSelectedFlag(flag);
                        setShowModal(true);
                      }}
                    >
                      <TableCell className="font-medium">
                        {flag.userId || flag.user?.email || 'Unknown'}
                      </TableCell>
                      <TableCell>{(flag.riskScore * 100).toFixed(1)}</TableCell>
                      <TableCell>{getRiskBadge(flag.riskScore * 100)}</TableCell>
                      <TableCell>
                        {flag.timestamp ? new Date(flag.timestamp).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolveFlag(flag.id);
                          }}
                        >
                          Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No crisis flags found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => page > 0 && setPage(page - 1)}
                      className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (page < 3) {
                      pageNum = i;
                    } else if (page > totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => page < totalPages - 1 && setPage(page + 1)}
                      className={
                        page >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crisis Flag Details</DialogTitle>
            <DialogDescription>Review flag information and take action</DialogDescription>
          </DialogHeader>
          {selectedFlag && (
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">User ID</Label>
                <p className="mt-1 text-sm font-medium">{selectedFlag.userId || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Risk Score</Label>
                <p className="mt-1 text-sm font-medium">
                  {(selectedFlag.riskScore * 100).toFixed(1)} / 100
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Risk Level</Label>
                <div className="mt-1">{getRiskBadge(selectedFlag.riskScore * 100)}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Timestamp</Label>
                <p className="mt-1 text-sm">
                  {selectedFlag.timestamp
                    ? new Date(selectedFlag.timestamp).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              {selectedFlag.context && (
                <div className="sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Context</Label>
                  <p className="mt-1 text-sm">{selectedFlag.context}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => selectedFlag?.id && handleResolveFlag(selectedFlag.id)}
            >
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
