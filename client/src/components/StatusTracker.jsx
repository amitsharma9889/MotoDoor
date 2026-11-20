import { STEPS, fmtDate } from '../lib';

// history: [{status, at}]  — shows the live booking status (confirmed -> ... -> completed)
export default function StatusTracker({ status, history = [] }) {
  const current = STEPS.findIndex((s) => s.key === status);
  const at = (key) => history.find((h) => h.status === key)?.at;

  return (
    <ol className="space-y-0">
      {STEPS.map((s, i) => {
        const done = i < current || status === 'completed';
        const active = i === current && status !== 'completed';
        return (
          <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
            {i < STEPS.length - 1 && (
              <span className={`absolute left-[11px] top-6 h-full w-0.5 ${i < current ? 'bg-teal' : 'bg-forest/15'}`} />
            )}
            <span
              className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold
              ${done ? 'bg-teal text-white' : active ? 'bg-ember text-white ring-4 ring-ember/20' : 'bg-forest/10 text-ink/40'}`}
            >
              {done ? '✓' : i + 1}
            </span>
            <div>
              <p className={`text-sm font-semibold ${done || active ? 'text-ink' : 'text-ink/40'}`}>{s.label}</p>
              {(done || active) && (
                <p className="text-xs text-ink/60">
                  {at(s.key) ? fmtDate(at(s.key)) : s.hint}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
