import { missionVisionValues } from '@/lib/data/about';

export function ValuesList() {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {missionVisionValues.map((item, index) => (
        <div key={item.label} className="grid gap-2 p-6 sm:grid-cols-[90px_1fr] sm:gap-6">
          <span className="font-display text-4xl font-bold leading-none text-accent/30">
            0{index + 1}
          </span>
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
              {item.label}
            </h3>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
