interface StatBarProps {
  label: string;
  value: number;
  icon: string;
  color?: string;
}

export const StatBar = ({ label, value, icon, color = 'bg-primary' }: StatBarProps) => {
  const isCritical = value < 20;
  const barColor = isCritical ? 'bg-danger' : color;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-secondary">{label}</span>
          <span className={`font-semibold ${isCritical ? 'text-danger' : 'text-text-primary'}`}>
            {value}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${barColor}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
};
