"use client";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: number;
  title: string;
  subtitle?: string;
  datetime: string;
  badge?: string;
  badgeColor?: "blue" | "green" | "amber" | "slate" | "red";
  details?: { label: string; value: string }[];
}

export default function Timeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) return <p className="text-sm text-slate-500 py-4 text-center">Tidak ada data</p>;
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={cn("timeline-dot-blue",
              item.badgeColor === "green" && "timeline-dot-green",
              item.badgeColor === "amber" && "timeline-dot-amber",
              item.badgeColor === "slate" && "timeline-dot-slate",
              item.badgeColor === "red" && "w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/20 flex-shrink-0 mt-0.5",
            )} />
            {i < items.length - 1 && <div className="w-0.5 flex-1 bg-slate-800 mt-1 min-h-4" />}
          </div>
          <div className="pb-4 flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                {item.subtitle && <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-slate-500 whitespace-nowrap">{item.datetime}</span>
                {item.badge && (
                  <span className={cn("badge",
                    item.badgeColor === "green" ? "badge-green" :
                    item.badgeColor === "amber" ? "badge-amber" :
                    item.badgeColor === "red" ? "badge-red" :
                    item.badgeColor === "slate" ? "badge-slate" : "badge-blue")}>
                    {item.badge}
                  </span>
                )}
              </div>
            </div>
            {item.details && (
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                {item.details.map(d => (
                  <div key={d.label}>
                    <span className="text-xs text-slate-500">{d.label}: </span>
                    <span className="text-xs text-slate-300">{d.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
