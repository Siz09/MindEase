import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card';
import { Label } from '../../../components/ui/Label';
import { Badge } from '../../../components/ui/Badge';
import { Slider } from '../../../components/ui/slider';
import { AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';

const CrisisThresholdCard = ({ crisisThreshold, onChange }) => {
  // Clamp and default crisisThreshold to valid range (1-10)
  const safeThreshold = Math.max(1, Math.min(10, Number(crisisThreshold) || 1));
  const level = safeThreshold > 7 ? 'High' : safeThreshold > 4 ? 'Medium' : 'Low';
  const levelStyles = {
    High: 'bg-red-100 text-red-800 hover:bg-red-100',
    Medium: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    Low: 'bg-green-100 text-green-800 hover:bg-green-100',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>Crisis Alert Threshold</CardTitle>
            <CardDescription>
              Adjust the sensitivity level for crisis detection alerts.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="crisis-threshold-slider" className="text-sm font-medium">
            Sensitivity: {safeThreshold}/10
          </Label>
          <Badge className={levelStyles[level]}>{level}</Badge>
        </div>
        <Slider
          id="crisis-threshold-slider"
          min={1}
          max={10}
          value={[safeThreshold]}
          onValueChange={([value]) => onChange(value)}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </CardContent>
    </Card>
  );
};

CrisisThresholdCard.propTypes = {
  crisisThreshold: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default CrisisThresholdCard;
