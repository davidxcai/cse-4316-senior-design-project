type Props = { value: number; max: number; /** daisyUI color class, e.g. `progress-primary` */ color?: string; showCount?: boolean };

/** daisyUI progress with an optional "n/m" [L.3, S.3]. */
export default function ProgressBar({ value, max, color = "progress-primary", showCount = false }: Props) {
  return (
    <div className="flex items-center gap-3">
      <progress className={`progress ${color} w-full`} value={value} max={max} />
      {showCount && (
        <span className="shrink-0 text-sm tabular-nums text-base-content/70">
          {value}/{max}
        </span>
      )}
    </div>
  );
}
