interface ProgressBarProps {
  value: number;
  className?: string;
  label?: string;
}

export function ProgressBar({ value, className = "", label }: ProgressBarProps) {
  const normalized = Math.min(1, Math.max(0, value));
  return (
    <div
      className={`progress-bar ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(normalized * 100)}
      aria-label={label ?? "Прогресс"}
    >
      <span style={{ width: `${normalized * 100}%` }} />
    </div>
  );
}
