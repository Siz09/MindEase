import { useId, useMemo } from 'react';
import { Badge, Button, Input, Modal, Select } from '../shared';

const getBadgeType = (status) => {
  const normalized = (status || 'active').toLowerCase();
  switch (normalized) {
    case 'active':
      return 'success';
    case 'banned':
      return 'danger';
    case 'inactive':
      return 'warning';
    default:
      return 'secondary';
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
  userToDelete,
  deleteError,
  onCancelDelete,
  onConfirmDelete,
}) => {
  const editFormId = useId();
  const subscriptionPlanBadgeType = useMemo(() => {
    if (!selectedUser?.subscriptionPlan) return 'secondary';
    return selectedUser.subscriptionPlan === 'PREMIUM' ? 'info' : 'secondary';
  }, [selectedUser?.subscriptionPlan]);

  return (
    <>
      <Modal
        isOpen={showDetailsModal}
        title="User Details"
        onClose={onCloseDetailsModal}
        footer={
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onCloseDetailsModal}>
              Close
            </Button>
            <Button
              variant="ghost"
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
              {selectedUser?.status === 'banned' ? 'Unban' : 'Ban'} User
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
          <div className="admin-user-detail-grid">
            <div className="admin-user-detail-item">
              <div className="admin-user-detail-label">Email</div>
              <div className="admin-user-detail-value">{selectedUser.email || 'N/A'}</div>
            </div>

            <div className="admin-user-detail-item">
              <div className="admin-user-detail-label">Status</div>
              <div className="admin-user-detail-value">
                <Badge type={getBadgeType(selectedUser?.status)}>
                  {selectedUser.status || 'active'}
                </Badge>
              </div>
            </div>

            <div className="admin-user-detail-item">
              <div className="admin-user-detail-label">User ID</div>
              <div className="admin-user-detail-value admin-user-detail-value-monospace">
                {selectedUser.id || selectedUser.userId || 'N/A'}
              </div>
            </div>

            <div className="admin-user-detail-item">
              <div className="admin-user-detail-label">Joined</div>
              <div className="admin-user-detail-value">
                {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
              </div>
            </div>

            <div className="admin-user-detail-item">
              <div className="admin-user-detail-label">Crisis Flags</div>
              <div className="admin-user-detail-value">{selectedUser.crisisFlags || 0}</div>
            </div>

            <div className="admin-user-detail-item">
              <div className="admin-user-detail-label">Last Active</div>
              <div className="admin-user-detail-value">
                {selectedUser.lastActive
                  ? new Date(selectedUser.lastActive).toLocaleString()
                  : 'N/A'}
              </div>
            </div>

            <div
              className="admin-user-detail-item"
              style={{
                gridColumn: '1 / -1',
                marginTop: '16px',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '16px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                Subscription & Billing
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div className="admin-user-detail-label">Current Plan</div>
                  <div className="admin-user-detail-value">
                    <Badge type={subscriptionPlanBadgeType}>
                      {selectedUser.subscriptionPlan || 'Free'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="admin-user-detail-label">Billing Status</div>
                  <div className="admin-user-detail-value">
                    <Badge
                      type={selectedUser.subscriptionStatus === 'ACTIVE' ? 'success' : 'warning'}
                    >
                      {selectedUser.subscriptionStatus || 'none'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="admin-user-detail-label">Renews / Expires</div>
                  <div className="admin-user-detail-value">
                    {selectedUser.subscriptionRenewsAt
                      ? new Date(selectedUser.subscriptionRenewsAt).toLocaleDateString()
                      : 'N/A'}
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
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onCloseEditModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={editFormId} disabled={formLoading}>
              {formLoading ? 'Saving...' : 'Save Changes'}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => onChangeFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => onChangeFormData({ ...formData, password: e.target.value })}
              error={formErrors.password}
              helper="Leave blank to keep current password"
            />
            <div>
              <label
                style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}
              >
                Role
              </label>
              <Select
                value={formData.role}
                onChange={(e) => onChangeFormData({ ...formData, role: e.target.value })}
                options={[
                  { value: 'USER', label: 'User' },
                  { value: 'ADMIN', label: 'Admin' },
                ]}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.anonymousMode}
                  onChange={(e) =>
                    onChangeFormData({ ...formData, anonymousMode: e.target.checked })
                  }
                />
                <span>Anonymous Mode</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showBanConfirm}
        title={userToBan?.status === 'banned' ? 'Unban User' : 'Ban User'}
        onClose={onCancelBan}
        footer={
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onCancelBan}>
              Cancel
            </Button>
            <Button
              variant={userToBan?.status === 'banned' ? 'primary' : 'danger'}
              onClick={onConfirmBan}
              disabled={!userToBan?.id}
            >
              Confirm {userToBan?.status === 'banned' ? 'Unban' : 'Ban'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {banError && (
            <div
              style={{
                padding: 'var(--spacing-sm)',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: 'var(--color-danger)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {banError}
            </div>
          )}
          <p>
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
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onCancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirmDelete} disabled={!userToDelete?.id}>
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {deleteError && (
            <div
              style={{
                padding: 'var(--spacing-sm)',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: 'var(--color-danger)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {deleteError}
            </div>
          )}
          <p>
            Are you sure you want to delete <strong>{userToDelete?.email || 'this user'}</strong>?
            This action will anonymize the user account and cannot be undone.
          </p>
        </div>
      </Modal>
    </>
  );
};

export default UserModals;
