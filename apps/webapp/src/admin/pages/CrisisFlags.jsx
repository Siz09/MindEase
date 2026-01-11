'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../adminApi';
import { useAdminAuth } from '../AdminAuthContext';
import { toCSV } from '../../utils/export';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { Download, X, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const pct = (n) => `${Math.round((n || 0) * 100)}%`;

export default function CrisisFlags() {
  const { adminToken } = useAdminAuth();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const esRef = useRef(null);
  const inFlightRef = useRef(false);
  const debounceRef = useRef(null);

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('size', size);
      if (from) {
        const d = new Date(from);
        if (!isNaN(d.getTime())) params.set('from', d.toISOString());
      }
      if (to) {
        const d = new Date(to);
        if (!isNaN(d.getTime())) params.set('to', d.toISOString());
      }
      const { data } = await api.get(`/admin/crisis-flags?${params.toString()}`);
      setRows(data.content || []);
      setTotalPages(data.totalPages ?? (data.last ? page + 1 : page + 2));
    } catch (err) {
      if (!(err && err.response && err.response.status === 404)) {
        // Failed to load crisis flags - error handled silently
      }
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [page, size, from, to]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (esRef.current && typeof esRef.current.close === 'function') {
      esRef.current.close();
    }

    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
    const sseUrl = `${base}/api/admin/crisis-flags/stream?access_token=${encodeURIComponent(adminToken || '')}`;
    let startedPolling = false;

    function startPolling() {
      if (startedPolling) return;
      startedPolling = true;
      const id = setInterval(load, 10000);
      esRef.current = { close: () => clearInterval(id) };
    }

    try {
      const es = new EventSource(sseUrl, { withCredentials: true });
      let opened = false;
      const fallbackTimer = setTimeout(() => {
        if (!opened) {
          es.close();
          startPolling();
        }
      }, 2500);
      es.onopen = () => {
        opened = true;
        clearTimeout(fallbackTimer);
      };
      const onFlag = (ev) => {
        try {
          const flag = JSON.parse(ev.data);
          if (page === 0 && !from && !to) {
            setRows((prev) => [flag, ...prev].slice(0, size));
          } else {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              if (!inFlightRef.current) {
                load();
              }
            }, 500);
          }
        } catch {
          // Ignore errors in event handler
        }
      };
      es.onmessage = onFlag;
      es.addEventListener('flag', onFlag);
      es.onerror = () => {
        es.close();
        startPolling();
      };
      esRef.current = es;
    } catch {
      startPolling();
    }

    return () => {
      if (esRef.current && typeof esRef.current.close === 'function') {
        esRef.current.close();
      }
    };
  }, [size, page, from, to, load, adminToken]);

  useEffect(() => {
    const name = 'ADMIN_JWT';
    if (adminToken) {
      document.cookie = `${name}=${encodeURIComponent(adminToken)}; Path=/api/admin/crisis-flags; SameSite=Lax`;
    } else {
      document.cookie = `${name}=; Path=/api/admin/crisis-flags; Max-Age=0; SameSite=Lax`;
    }
    return () => {
      document.cookie = `${name}=; Path=/api/admin/crisis-flags; Max-Age=0; SameSite=Lax`;
    };
  }, [adminToken]);

  function exportCSV() {
    toCSV(rows, 'crisis-flags.csv', [
      { key: 'userId', title: 'User ID' },
      { key: 'chatId', title: 'Chat ID' },
      { key: 'keywordDetected', title: 'Keyword' },
      { key: 'riskScore', title: 'Risk' },
      { key: 'status', title: 'Status' },
      { key: 'createdAt', title: 'When' },
    ]);
  }

  const handleViewTranscript = async (flag) => {
    setSelectedFlag(flag);
    setShowTranscriptModal(true);
    setTranscriptLoading(true);
    try {
      const { data } = await api.get(`/admin/crisis-flags/${flag.id}/transcript`);
      setTranscript(data);
    } catch {
      toast.error('Failed to load transcript');
    } finally {
      setTranscriptLoading(false);
    }
  };

  const handleResolve = async (flag) => {
    try {
      await api.post(`/admin/crisis-flags/${flag.id}/resolve`);
      toast.success('Flag resolved');
      load();
      if (selectedFlag?.id === flag.id) {
        try {
          const { data } = await api.get(`/admin/crisis-flags/${flag.id}`);
          setSelectedFlag(data);
        } catch {
          setSelectedFlag({ ...selectedFlag, status: 'RESOLVED' });
        }
      }
    } catch {
      toast.error('Failed to resolve flag');
    }
  };

  const handleEscalate = async (flag) => {
    try {
      await api.post(`/admin/crisis-flags/${flag.id}/escalate`);
      toast.success('Flag escalated');
      load();
      if (selectedFlag?.id === flag.id) {
        setSelectedFlag({ ...selectedFlag, escalated: true });
      }
    } catch {
      toast.error('Failed to escalate flag');
    }
  };

  const getStatusBadge = (flag) => {
    if (flag.status === 'RESOLVED') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>;
    }
    if (flag.escalated) {
      return <Badge variant="destructive">Escalated</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Open</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crisis Flags</h1>
          <p className="text-muted-foreground">Monitor and manage crisis detection flags</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="from-date">From</Label>
              <Input
                id="from-date"
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(0);
                }}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="to-date">To</Label>
              <Input
                id="to-date"
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(0);
                }}
                className="mt-1"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setFrom('');
                setTo('');
                setPage(0);
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No results
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        {r.userId ? `${r.userId.substring(0, 8)}...` : 'N/A'}
                      </TableCell>
                      <TableCell>{r.keywordDetected ?? r.keyword ?? 'N/A'}</TableCell>
                      <TableCell>{r.riskScore != null ? pct(r.riskScore) : '—'}</TableCell>
                      <TableCell>{getStatusBadge(r)}</TableCell>
                      <TableCell>
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewTranscript(r)}>
                            <Eye className="mr-2 h-3 w-3" />
                            View
                          </Button>
                          {r.status !== 'RESOLVED' && (
                            <Button variant="outline" size="sm" onClick={() => handleResolve(r)}>
                              <CheckCircle2 className="mr-2 h-3 w-3" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} / {Math.max(1, totalPages)}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => p + 1)}
                    className={
                      page + 1 >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <div className="flex items-center gap-2">
              <Label htmlFor="page-size" className="text-sm">
                Page size
              </Label>
              <Select
                value={size.toString()}
                onValueChange={(value) => {
                  setPage(0);
                  setSize(Number(value));
                }}
              >
                <SelectTrigger id="page-size" className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showTranscriptModal} onOpenChange={setShowTranscriptModal}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Crisis Context & Transcript</DialogTitle>
            <DialogDescription>Review the conversation that triggered this flag</DialogDescription>
          </DialogHeader>
          {selectedFlag && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div>
                    <strong>Trigger:</strong> {selectedFlag.keywordDetected}
                  </div>
                  <div>
                    <strong>Risk Score:</strong> {pct(selectedFlag.riskScore)}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {transcriptLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading transcript...</div>
            ) : transcript.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No transcript available</div>
            ) : (
              transcript.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender === 'user'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {msg.sender === 'user' ? 'User' : 'AI'} •{' '}
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                    <div>{msg.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTranscriptModal(false)}>
              Close
            </Button>
            {selectedFlag && selectedFlag.status !== 'RESOLVED' && (
              <Button variant="default" onClick={() => handleResolve(selectedFlag)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Resolve Flag
              </Button>
            )}
            {selectedFlag && !selectedFlag.escalated && (
              <Button variant="destructive" onClick={() => handleEscalate(selectedFlag)}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Escalate
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
