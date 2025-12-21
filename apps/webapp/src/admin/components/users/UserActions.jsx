import { Button } from '../shared';

const UserActions = ({ user, onEdit, onDelete }) => {
  return (
    <div className="admin-user-actions">
      <Button
        variant="ghost"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(user);
        }}
        className="admin-user-action-btn"
      >
        Edit
      </Button>
      <Button
        variant="ghost"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(user);
        }}
        className="admin-user-action-btn"
      >
        Delete
      </Button>
    </div>
  );
};

export default UserActions;

