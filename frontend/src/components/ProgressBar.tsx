import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  animated?: boolean;
  color?: string;
}

export const ProgressBar = ({
  current,
  max,
  label,
  animated = true,
  color = 'bg-primary'
}: ProgressBarProps) => {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-text-secondary mb-1">
        {label && <span>{label}</span>}
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        {animated ? (
          <motion.div
            className={`h-2 rounded-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        ) : (
          <div
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
};
