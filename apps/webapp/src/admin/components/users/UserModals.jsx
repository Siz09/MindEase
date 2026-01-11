import { useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Badge } from '../../../components/ui/Badge';
import { Switch } from '../../../components/ui/Switch';
import { Alert, AlertDescription } from '../../../components/ui/Alert';
import { AlertTriangle } from 'lucide-react';

const getStatusBadge = (status) => {
  const statusLower = (status || 'active').toLowerCase();
  switch (statusLower) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
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

const UserModals = ({
  selectedUser,
  showDetailsModal,
  onCloseDetailsModal,
  onEditUser,
  onBanUser,
  onDeleteUser,
  showEditModal,
  onCloseEditModal,
  formData,
  formErrors,
  formLoading,
  onChangeFormData,
  onSubmitForm,
  showBanConfirm,
  userToBan,
  banError,
  onCancelBan,
  onConfirmBan,
  showDeleteConfirm,
  deleteError,
  onCancelDelete,
  onConfirmDelete,
}) => {
  const editFormId = useId();

  return (
    <>
      {/* User Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={onCloseDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View and manage user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="mt-1 text-sm font-medium">{selectedUser.email || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedUser?.status)}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">User ID</Label>
                <p className="mt-1 font-mono text-xs">
                  {selectedUser.id || selectedUser.userId || 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Joined</Label>
                <p className="mt-1 text-sm">
                  {selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Crisis Flags</Label>
                <p className="mt-1 text-sm">{selectedUser.crisisFlags || 0}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Last Active</Label>
                <p className="mt-1 text-sm">
                  {selectedUser.lastActive
                    ? new Date(selectedUser.lastActive).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <div className="mt-2 border-t pt-4">
                  <Label className="text-xs text-muted-foreground">Subscription</Label>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline">{selectedUser.subscriptionPlan || 'Free'}</Badge>
                    <Badge variant="outline">{selectedUser.subscriptionStatus || 'none'}</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={onCloseDetailsModal}>
              Close
            </Button>
            <Button variant="outline" onClick={() => selectedUser?.id && onEditUser(selectedUser)}>
              Edit
            </Button>
            <Button
              variant={selectedUser?.status === 'banned' ? 'default' : 'destructive'}
              onClick={() => selectedUser?.id && onBanUser(selectedUser)}
            >
              {selectedUser?.status === 'banned' ? 'Unban' : 'Ban'} User
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser?.id && onDeleteUser(selectedUser)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={onCloseEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <form id={editFormId} onSubmit={onSubmitForm} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => onChangeFormData({ ...formData, email: e.target.value })}
                disabled={formLoading}
              />
              {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => onChangeFormData({ ...formData, password: e.target.value })}
                disabled={formLoading}
              />
              {formErrors.password && (
                <p className="text-sm text-destructive">{formErrors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                value={formData.role}
                onChange={(e) => onChangeFormData({ ...formData, role: e.target.value })}
                disabled={formLoading}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-anonymous"
                checked={formData.anonymousMode}
                onCheckedChange={(checked) =>
                  onChangeFormData({ ...formData, anonymousMode: checked })
                }
                disabled={formLoading}
              />
              <Label htmlFor="edit-anonymous">Anonymous Mode</Label>
            </div>
          </form>
          <DialogFooter>
            <Button variant="ghost" onClick={onCloseEditModal} disabled={formLoading}>
              Cancel
            </Button>
            <Button form={editFormId} type="submit" disabled={formLoading}>
              {formLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Confirmation Modal */}
      <Dialog open={showBanConfirm} onOpenChange={onCancelBan}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{userToBan?.status === 'banned' ? 'Unban User' : 'Ban User'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {userToBan?.status === 'banned' ? 'unban' : 'ban'} this user?
            </DialogDescription>
          </DialogHeader>
          {banError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{banError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={onCancelBan}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirmBan}>
              {userToBan?.status === 'banned' ? 'Unban' : 'Ban'} User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={onCancelDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={onCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirmDelete}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserModals;
