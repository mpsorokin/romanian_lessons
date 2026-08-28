import { useTranslation } from "react-i18next";

interface ProgressBarProps {
  value: number;
  className?: string;
  label?: string;
}

export function ProgressBar({ value, className = "", label }: ProgressBarProps) {
  const { t } = useTranslation();
  const normalized = Math.min(1, Math.max(0, value));
  return (
    <div
      className={`progress-bar ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(normalized * 100)}
      aria-label={label ?? t("common.progress")}
    >
      <span style={{ width: `${normalized * 100}%` }} />
    </div>
  );
}
