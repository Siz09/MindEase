import { useId } from 'react';
import { Modal } from '../shared';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const pillStyles = {
  success: 'bg-green-50 text-green-700 ring-green-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200',
  neutral: 'bg-gray-50 text-gray-700 ring-gray-200',
};

function Pill({ tone = 'neutral', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        pillStyles[tone] || pillStyles.neutral
      }`}
    >
      {children}
    </span>
  );
}

function getStatusTone(status) {
  const normalized = (status || 'active').toLowerCase();
  switch (normalized) {
    case 'active':
      return 'success';
    case 'banned':
      return 'danger';
    case 'inactive':
      return 'warning';
    default:
      return 'neutral';
  }
}

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
  userToDelete,
  deleteError,
  onCancelDelete,
  onConfirmDelete,
}) => {
  const editFormId = useId();

  return (
    <>
      <Modal
        isOpen={showDetailsModal}
        title="User Details"
        onClose={onCloseDetailsModal}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={onCloseDetailsModal}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => selectedUser?.id && onEditUser(selectedUser)}
              disabled={!selectedUser?.id}
            >
              Edit
            </Button>
            <Button
              variant={selectedUser?.status === 'banned' ? 'primary' : 'danger'}
              onClick={() => selectedUser?.id && onBanUser(selectedUser)}
              disabled={!selectedUser?.id}
            >
              {selectedUser?.status === 'banned' ? 'Unban' : 'Ban'} user
            </Button>
            <Button
              variant="danger"
              onClick={() => selectedUser?.id && onDeleteUser(selectedUser)}
              disabled={!selectedUser?.id}
            >
              Delete
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-gray-500">Email</div>
              <div className="mt-1 text-sm text-gray-900">{selectedUser.email || 'N/A'}</div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500">Status</div>
              <div className="mt-1">
                <Pill tone={getStatusTone(selectedUser?.status)}>
                  {selectedUser.status || 'active'}
                </Pill>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500">User ID</div>
              <div className="mt-1 font-mono text-xs text-gray-900">
                {selectedUser.id || selectedUser.userId || 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500">Joined</div>
              <div className="mt-1 text-sm text-gray-900">
                {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500">Crisis flags</div>
              <div className="mt-1 text-sm text-gray-900">{selectedUser.crisisFlags || 0}</div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500">Last active</div>
              <div className="mt-1 text-sm text-gray-900">
                {selectedUser.lastActive
                  ? new Date(selectedUser.lastActive).toLocaleString()
                  : 'N/A'}
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="mt-2 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900">Subscription & billing</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium text-gray-500">Current plan</div>
                    <div className="mt-1">
                      <Pill tone={selectedUser.subscriptionPlan === 'PREMIUM' ? 'info' : 'neutral'}>
                        {selectedUser.subscriptionPlan || 'Free'}
                      </Pill>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500">Billing status</div>
                    <div className="mt-1">
                      <Pill
                        tone={selectedUser.subscriptionStatus === 'ACTIVE' ? 'success' : 'warning'}
                      >
                        {selectedUser.subscriptionStatus || 'none'}
                      </Pill>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500">Renews / expires</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedUser.subscriptionRenewsAt
                        ? new Date(selectedUser.subscriptionRenewsAt).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showEditModal}
        title="Edit User"
        onClose={onCloseEditModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCloseEditModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={editFormId} loading={formLoading}>
              Save changes
            </Button>
          </div>
        }
      >
        <form
          id={editFormId}
          onSubmit={(e) => {
            e.preventDefault();
            if (typeof onSubmitForm === 'function') {
              onSubmitForm(e);
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor={`${editFormId}-email`} className="text-sm font-medium text-gray-900">
                Email
              </label>
              <div className="mt-1">
                <Input
                  id={`${editFormId}-email`}
                  type="email"
                  value={formData.email}
                  onChange={(e) => onChangeFormData({ ...formData, email: e.target.value })}
                  error={Boolean(formErrors.email)}
                  required
                />
              </div>
              {formErrors.email && (
                <div className="mt-1 text-sm text-red-600">{formErrors.email}</div>
              )}
            </div>

            <div>
              <label
                htmlFor={`${editFormId}-password`}
                className="text-sm font-medium text-gray-900"
              >
                Password
              </label>
              <div className="mt-1">
                <Input
                  id={`${editFormId}-password`}
                  type="password"
                  value={formData.password}
                  onChange={(e) => onChangeFormData({ ...formData, password: e.target.value })}
                  error={Boolean(formErrors.password)}
                />
              </div>
              {formErrors.password ? (
                <div className="mt-1 text-sm text-red-600">{formErrors.password}</div>
              ) : (
                <div className="mt-1 text-sm text-gray-500">
                  Leave blank to keep current password.
                </div>
              )}
            </div>

            <div>
              <label htmlFor={`${editFormId}-role`} className="text-sm font-medium text-gray-900">
                Role
              </label>
              <div className="mt-1">
                <select
                  id={`${editFormId}-role`}
                  value={formData.role}
                  onChange={(e) => onChangeFormData({ ...formData, role: e.target.value })}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 transition-smooth focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={formData.anonymousMode}
                onChange={(e) => onChangeFormData({ ...formData, anonymousMode: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-900">Anonymous mode</span>
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showBanConfirm}
        title={userToBan?.status === 'banned' ? 'Unban User' : 'Ban User'}
        onClose={onCancelBan}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancelBan}>
              Cancel
            </Button>
            <Button
              variant={userToBan?.status === 'banned' ? 'primary' : 'danger'}
              onClick={onConfirmBan}
              disabled={!userToBan?.id}
            >
              Confirm {userToBan?.status === 'banned' ? 'unban' : 'ban'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {banError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              {banError}
            </div>
          )}
          <p className="text-sm text-gray-700">
            {userToBan?.status === 'banned'
              ? `Are you sure you want to unban ${userToBan?.email || 'this user'}? They will regain access to the platform.`
              : `${userToBan?.email || 'This user'} will be banned and may require review to restore access. This action can be reversed.`}
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        title="Delete User"
        onClose={onCancelDelete}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirmDelete} disabled={!userToDelete?.id}>
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {deleteError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              {deleteError}
            </div>
          )}
          <p className="text-sm text-gray-700">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{userToDelete?.email || 'this user'}</span>? This action
            will anonymize the user account and cannot be undone.
          </p>
        </div>
      </Modal>
    </>
  );
};

export default UserModals;
