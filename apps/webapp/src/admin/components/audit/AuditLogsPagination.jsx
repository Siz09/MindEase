import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../../components/ui/pagination';

const AuditLogsPagination = ({ page, totalPages, size, onPrev, onNext, onSetSize }) => {
  const currentPage = page + 1;
  const maxPages = Math.max(1, totalPages);

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={onPrev}
                className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} / {maxPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={onNext}
                className={
                  page + 1 >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <div className="flex items-center gap-2">
          <Label htmlFor="page-size-select" className="text-sm">
            Page size
          </Label>
          <Select value={size.toString()} onValueChange={(value) => onSetSize(Number(value))}>
            <SelectTrigger id="page-size-select" className="w-[100px]">
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
  );
};

export default AuditLogsPagination;
