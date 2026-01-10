const AdminSettingsActions = ({ onSave, onReset, isLoading }) => {
  const handleSave = () => {
    if (typeof onSave === 'function') {
      onSave();
    }
  };

  const handleReset = () => {
    if (typeof onReset === 'function') {
      onReset();
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row">
      <button className="btn btn-primary sm:px-6" onClick={handleSave} disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save changes'}
      </button>
      <button className="btn btn-secondary sm:px-6" onClick={handleReset} disabled={isLoading}>
        Reset to default
      </button>
    </div>
  );
};

export default AdminSettingsActions;
