import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Users, UserCheck, UserX, Ban } from 'lucide-react';
import useAnimatedCounter from '../../hooks/useAnimatedCounter';

const UserStats = ({ stats }) => {
  const safeStats = {
    total: stats?.total ?? 0,
    active: stats?.active ?? 0,
    banned: stats?.banned ?? 0,
    inactive: stats?.inactive ?? 0,
  };

  const animatedTotal = useAnimatedCounter(safeStats.total, 800);
  const animatedActive = useAnimatedCounter(safeStats.active, 800);
  const animatedBanned = useAnimatedCounter(safeStats.banned, 800);
  const animatedInactive = useAnimatedCounter(safeStats.inactive, 800);

  const statCards = [
    {
      label: 'Total Users',
      value: animatedTotal,
      icon: Users,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Active',
      value: animatedActive,
      icon: UserCheck,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Banned',
      value: animatedBanned,
      icon: Ban,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Inactive',
      value: animatedInactive,
      icon: UserX,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold transition-all duration-300">
                {stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default UserStats;
