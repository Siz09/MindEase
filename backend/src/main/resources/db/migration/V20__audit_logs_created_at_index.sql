-- Dedicated index for created_at to speed unfiltered newest-first scans
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at DESC);

