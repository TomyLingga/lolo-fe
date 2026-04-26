"use client";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  getRowInactive?: (row: T) => boolean;
  keyField?: string;
  searchPlaceholder?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  data, columns, getRowInactive, keyField = "id", searchPlaceholder = "Cari...",
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let rows = [...data];
    // global search
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r =>
        Object.values(r).some(v => String(v ?? "").toLowerCase().includes(s))
      );
    }
    // column filters
    Object.entries(colFilters).forEach(([k, v]) => {
      if (!v) return;
      rows = rows.filter(r => String(r[k] ?? "").toLowerCase().includes(v.toLowerCase()));
    });
    // sort
    if (sortKey) {
      rows.sort((a, b) => {
        const av = String(a[sortKey] ?? "");
        const bv = String(b[sortKey] ?? "");
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }, [data, search, colFilters, sortKey, sortDir]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  return (
    <div>
      {/* Global search */}
      <div className="mb-3">
        <input className="input max-w-xs" placeholder={searchPlaceholder}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className={cn("px-4 py-3 table-header whitespace-nowrap", col.className)}>
                  <div className="space-y-1.5">
                    <button
                      className={cn("flex items-center gap-1 hover:text-white transition-colors",
                        col.sortable !== false && "cursor-pointer")}
                      onClick={() => col.sortable !== false && toggleSort(col.key)}>
                      {col.label}
                      {col.sortable !== false && (
                        <span className="text-slate-600">
                          {sortKey === col.key ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}
                        </span>
                      )}
                    </button>
                    <input
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                      placeholder="Filter..."
                      value={colFilters[col.key] || ""}
                      onChange={e => setColFilters(prev => ({ ...prev, [col.key]: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500 text-sm">Tidak ada data</td></tr>
            ) : filtered.map((row, i) => (
              <tr key={String(row[keyField] ?? i)}
                className={cn("table-row", getRowInactive?.(row) && "opacity-40")}>
                {columns.map(col => (
                  <td key={col.key} className={cn("px-4 py-3 table-cell whitespace-nowrap", col.className)}>
                    {col.render ? col.render(row) : String(row[col.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600 mt-2">{filtered.length} dari {data.length} data</p>
    </div>
  );
}
