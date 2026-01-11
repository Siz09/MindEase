import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/skeleton';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import UserFilters from './UserFilters';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../../components/ui/pagination';

const UserTable = ({
  users,
  loading,
  page,
  totalPages,
  onPageChange,
  filters,
  onSearch,
  onStatusChange,
  onClearFilters,
  onUserClick,
  onEditUser,
  onDeleteUser,
}) => {
  const getStatusBadge = (status) => {
    const statusLower = (status || 'active').toLowerCase();
    switch (statusLower) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case 'banned':
        return <Badge variant="destructive">Banned</Badge>;
      case 'inactive':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800">
            Inactive
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const getPlanBadge = (plan) => {
    if (!plan || plan === 'Free') {
      return <Badge variant="outline">Free</Badge>;
    }
    return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{plan}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <UserFilters
          filters={filters}
          onSearch={onSearch}
          onStatusChange={onStatusChange}
          onClear={onClearFilters}
        />
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Sub Status</TableHead>
                <TableHead>Crisis Flags</TableHead>
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
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users && users.length > 0 ? (
                users
                  .filter((user) => {
                    if (!user.id && !user.userId) {
                      console.warn(
                        'User missing stable ID (id or userId), filtering out:',
                        user.id || user.userId || 'unknown'
                      );
                      return false;
                    }
                    return true;
                  })
                  .map((user) => (
                    <TableRow
                      key={user.id || user.userId}
                      className="cursor-pointer transition-all duration-200 hover:bg-muted/50"
                      onClick={() => onUserClick?.(user)}
                    >
                      <TableCell className="font-medium">
                        {user.email || user.userId || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {user.createdAt && !isNaN(new Date(user.createdAt))
                          ? new Date(user.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{getPlanBadge(user.subscriptionPlan)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.subscriptionStatus || 'none'}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.crisisFlags > 0 ? (
                          <Badge variant="destructive">{user.crisisFlags}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditUser?.(user);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteUser?.(user);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No users found
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
                    onClick={() => page > 0 && onPageChange(page - 1)}
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
                        onClick={() => onPageChange(pageNum)}
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
                    onClick={() => page < totalPages - 1 && onPageChange(page + 1)}
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
  );
};

export default UserTable;
