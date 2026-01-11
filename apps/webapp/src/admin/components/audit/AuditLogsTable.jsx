import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Card, CardContent } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { AlertTriangle } from 'lucide-react';

const AuditLogsTable = ({ rows, loading, error }) => {
  const safeRows = Array.isArray(rows) ? rows : [];

  const formatCreatedAt = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString();
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>When</TableHead>
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
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {typeof error === 'string' ? error : error?.message || 'An error occurred'}
                      </AlertDescription>
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : safeRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No results
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.userId || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.actionType || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate" title={r.details}>
                      {r.details || 'N/A'}
                    </TableCell>
                    <TableCell>{formatCreatedAt(r.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditLogsTable;
