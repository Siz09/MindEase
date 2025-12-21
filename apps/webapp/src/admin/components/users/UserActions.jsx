import { Button } from '../shared';

const UserActions = ({ user, onEdit, onDelete }) => {
  const handleEdit = (e) => {
    e.stopPropagation();
    if (typeof onEdit === 'function') {
      onEdit(user);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (typeof onDelete === 'function') {
      onDelete(user);
    }
  };

  return (
    <div className="admin-user-actions">
      <Button variant="ghost" size="small" onClick={handleEdit} className="admin-user-action-btn">
        Edit
      </Button>
      <Button variant="ghost" size="small" onClick={handleDelete} className="admin-user-action-btn">
        Delete
      </Button>
    </div>
  );
};

export default UserActions;
