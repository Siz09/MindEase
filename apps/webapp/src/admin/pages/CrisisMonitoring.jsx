import { useState, useEffect, useRef } from 'react';
import {
  Button,
  Table,
  FilterBar,
  Pagination,
  Modal,
  Badge,
  Select,
  Card,
} from '../components/shared';
import adminApi from '../adminApi';

const getRiskColor = (score) => {
  if (score >= 8) return 'danger';
  if (score >= 5) return 'warning';
  return 'info';
};

const getRiskLevel = (score) => {
  if (score >= 8) return 'HIGH';
  if (score >= 5) return 'MEDIUM';
  return 'LOW';
};

export default function CrisisMonitoring() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);

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

  const esRef = useRef(null);
  const inFlightRef = useRef(false);

  // Load crisis flags
  useEffect(() => {
    loadFlags();
  }, [page, pageSize, filters]);

  // Real-time SSE connection
  useEffect(() => {
    if (esRef.current && typeof esRef.current.close === 'function') {
      esRef.current.close();
    }

    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
    const sseUrl = `${base}/api/admin/crisis-flags/stream`;

    try {
      const es = new EventSource(sseUrl, { withCredentials: true });
      const fallbackTimer = setTimeout(() => {
        es.close();
      }, 2500);

      es.onopen = () => {
        clearTimeout(fallbackTimer);
      };

      const onFlag = (ev) => {
        try {
          const flag = JSON.parse(ev.data);
          if (
            !flag ||
            !flag.userId ||
            typeof flag.riskScore !== 'number' ||
            Number.isNaN(flag.riskScore) ||
            flag.riskScore < 0 ||
            flag.riskScore > 1
          ) {
            console.warn('Invalid flag received from SSE:', flag);
            return;
          }
          const flagLevel = getRiskLevel(flag.riskScore * 100).toLowerCase();
          const matchesFilter = filters.riskLevel === 'all' || filters.riskLevel === flagLevel;
          if (page === 0 && matchesFilter) {
            setFlags((prev) => [flag, ...prev].slice(0, pageSize));
          }
        } catch (error) {
          console.error('Failed to process SSE flag:', error);
          return;
        }
      };

      es.onmessage = onFlag;
      es.addEventListener('flag', onFlag);
      es.onerror = () => {
        es.close();
      };

      esRef.current = es;
    } catch {
      console.log('SSE not available, using polling');
    }

    return () => {
      if (esRef.current && typeof esRef.current.close === 'function') {
        esRef.current.close();
      }
    };
  }, [pageSize, page, filters.riskLevel]);

  const loadFlags = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page,
        size: pageSize,
      });

      if (filters.riskLevel !== 'all') {
        params.append('riskLevel', filters.riskLevel);
      }

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
      setStats(statsRes.data || { high: 0, medium: 0, low: 0 });
    } catch (err) {
      console.error('Failed to load crisis flags:', err.message);
      setFlags([]);
      setTotalPages(0);
      setStats({ high: 0, medium: 0, low: 0 });
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  const handleRiskLevelFilter = (value) => {
    setFilters({ ...filters, riskLevel: value });
    setPage(0);
  };

  const handleTimeRangeFilter = (value) => {
    setFilters({ ...filters, timeRange: value });
    setPage(0);
  };

  const handleFlagClick = (flag) => {
    setSelectedFlag(flag);
    setShowModal(true);
  };

  const handleResolveFlag = async (flagId) => {
    if (!window.confirm('Mark this flag as resolved?')) return;
    try {
      await adminApi.post(`/admin/crisis-flags/${flagId}/resolve`);
      loadFlags();
      setShowModal(false);
    } catch (err) {
      console.error('Failed to resolve flag:', err);
    }
  };

  const handleEscalateFlag = async (flagId) => {
    if (!window.confirm('Escalate this flag for immediate review?')) return;
    try {
      await adminApi.post(`/admin/crisis-flags/${flagId}/escalate`);
      loadFlags();
      setShowModal(false);
    } catch (err) {
      console.error('Failed to escalate flag:', err);
    }
  };

  const tableColumns = [
    { key: 'userId', label: 'User ID' },
    { key: 'riskScore', label: 'Risk Score' },
    { key: 'keyword', label: 'Detected Keyword' },
    { key: 'timestamp', label: 'Time' },
  ];

  const displayData = flags.map((flag) => ({
    ...flag,
    riskScore: flag.riskScore ? `${Math.round(flag.riskScore * 100)}%` : 'N/A',
    keyword: flag.keywordDetected || flag.keyword || 'Unknown',
    timestamp: flag.createdAt ? new Date(flag.createdAt).toLocaleTimeString() : 'N/A',
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Crisis Monitoring</h1>
        <p className="page-subtitle">Real-time detection and response for at-risk users</p>
      </div>

      <div className="bento-grid bento-grid-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Card className="bento-card" header={<div className="card-header-title">High Risk</div>}>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: 'var(--danger)' }}>
              {stats.high || 0}
            </div>
            <p
              style={{ color: 'var(--gray)', fontSize: '12px', margin: 'var(--spacing-sm) 0 0 0' }}
            >
              Urgent attention needed
            </p>
          </div>
        </Card>

        <Card className="bento-card" header={<div className="card-header-title">Medium Risk</div>}>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: 'var(--warning)' }}>
              {stats.medium || 0}
            </div>
            <p
              style={{ color: 'var(--gray)', fontSize: '12px', margin: 'var(--spacing-sm) 0 0 0' }}
            >
              Monitoring recommended
            </p>
          </div>
        </Card>

        <Card className="bento-card" header={<div className="card-header-title">Low Risk</div>}>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: 'var(--info)' }}>
              {stats.low || 0}
            </div>
            <p
              style={{ color: 'var(--gray)', fontSize: '12px', margin: 'var(--spacing-sm) 0 0 0' }}
            >
              Under observation
            </p>
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <FilterBar>
          <Select
            value={filters.riskLevel}
            onChange={(e) => handleRiskLevelFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Risk Levels' },
              { value: 'high', label: 'High Risk' },
              { value: 'medium', label: 'Medium Risk' },
              { value: 'low', label: 'Low Risk' },
            ]}
            style={{ width: '180px' }}
          />
          <Select
            value={filters.timeRange}
            onChange={(e) => handleTimeRangeFilter(e.target.value)}
            options={[
              { value: '1h', label: 'Last Hour' },
              { value: '24h', label: 'Last 24h' },
              { value: '7d', label: 'Last 7 Days' },
              { value: 'all', label: 'All Time' },
            ]}
            style={{ width: '150px' }}
          />
          <Button
            variant="ghost"
            onClick={() => {
              setFilters({ riskLevel: 'all', timeRange: '24h' });
              setPage(0);
            }}
          >
            Reset
          </Button>
        </FilterBar>
      </div>

      <div className="bento-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <Table
          columns={tableColumns}
          data={displayData}
          loading={loading}
          onRowClick={handleFlagClick}
          sortable={true}
          empty="No crisis flags detected"
        />
      </div>

      <div className="bento-card">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
        />
      </div>

      {/* Flag Detail Modal */}
      <Modal
        isOpen={showModal}
        title="Crisis Flag Details"
        onClose={() => setShowModal(false)}
        footer={
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="secondary" onClick={() => handleEscalateFlag(selectedFlag?.id)}>
              Escalate
            </Button>
            <Button variant="primary" onClick={() => handleResolveFlag(selectedFlag?.id)}>
              Mark Resolved
            </Button>
          </div>
        }
      >
        {selectedFlag && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>User ID</label>
              <p style={{ margin: '4px 0 0 0', color: 'var(--dark)' }}>{selectedFlag.userId}</p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Risk Score</label>
              <p style={{ margin: '4px 0 0 0' }}>
                <Badge type={getRiskColor(selectedFlag.riskScore * 100)}>
                  {getRiskLevel(selectedFlag.riskScore * 100)} -{' '}
                  {Math.round(selectedFlag.riskScore * 100)}%
                </Badge>
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Keyword Detected</label>
              <p style={{ margin: '4px 0 0 0', color: 'var(--danger)', fontWeight: 600 }}>
                {selectedFlag.keywordDetected || selectedFlag.keyword || 'Unknown'}
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Chat ID</label>
              <p
                style={{
                  margin: '4px 0 0 0',
                  color: 'var(--dark)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              >
                {selectedFlag.chatId || 'N/A'}
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Detection Time</label>
              <p style={{ margin: '4px 0 0 0', color: 'var(--dark)' }}>
                {selectedFlag.createdAt ? new Date(selectedFlag.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Message Context</label>
              <div
                style={{
                  margin: '4px 0 0 0',
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--gray-lighter)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--dark)',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  maxHeight: '150px',
                  overflow: 'auto',
                }}
              >
                {selectedFlag.messageContext || selectedFlag.message || 'No context available'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
