import { Button } from '../../../components/ui/Button';
import { RotateCcw, Save } from 'lucide-react';

const AdminSettingsActions = ({ onSave, onReset, isLoading }) => {
  return (
    <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
      <Button onClick={onSave} disabled={isLoading}>
        <Save className="mr-2 h-4 w-4" />
        {isLoading ? 'Saving...' : 'Save changes'}
      </Button>
      <Button variant="outline" onClick={onReset} disabled={isLoading}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset to default
      </Button>
    </div>
  );
};

export default AdminSettingsActions;
