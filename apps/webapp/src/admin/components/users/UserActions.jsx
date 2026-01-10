import Button from '../../../components/ui/Button';

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
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={handleEdit}>
        Edit
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDelete}>
        Delete
      </Button>
    </div>
  );
};

export default UserActions;
