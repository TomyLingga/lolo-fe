"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { getUser } from "@/lib/auth";
import { dashboardApi, YardMapYard } from "@/lib/api";
import dynamic from "next/dynamic";

const YardMap = dynamic(() => import("@/components/dashboard/YardMap"), { ssr: false });

export default function DashboardPage() {
  const user = typeof window !== "undefined" ? getUser() : null;

  // ─── Master data — fetched ONCE ─────────────────────────────────────────────
  const [allYards, setAllYards] = useState<YardMapYard[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const hasFetched               = useRef(false);   // prevent StrictMode double-fire

  // ─── Local search — NO API re-call on search ─────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(val.trim().toUpperCase()), 300);
  }
  function clearSearch() { setSearchInput(""); setSearchQuery(""); }

  // ─── Single fetch on mount ────────────────────────────────────────────────────
  const fetchYardMap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getYardMap();   // no search param — always fetch all
      setAllYards(res.data.data ?? []);
      setError(null);
    } catch {
      setError("Gagal memuat data yard");
    } finally {
      setLoading(false);
    }
  }, []);

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchYardMap();
    }

    const fetchTimer = setInterval(fetchYardMap, 60_000);
    const clockTimer = setInterval(() => setTime(new Date()), 1000);

    return () => {
      clearInterval(fetchTimer);
      clearInterval(clockTimer);
    };
  }, [fetchYardMap]);

  // ─── Client-side search filter ────────────────────────────────────────────────
  const yards: YardMapYard[] = searchQuery
    ? allYards.map(yard => ({
        ...yard,
        blocks: yard.blocks.map(block => ({
          ...block,
          is_highlighted: block.registrations.some(r =>
            r.container_number.includes(searchQuery)
          ),
        })),
      })).filter(yard =>
        yard.blocks.some(b => b.is_highlighted || b.occupied_count > 0)
      )
    : allYards;

  // ─── Stats derived from allYards ─────────────────────────────────────────────
  const totalActive = allYards.reduce((s, y) => s + y.total_occupied, 0);
  const totalYards  = allYards.length;

  const statCards = [
    {
      label: "Yard Aktif",
      value: loading ? "—" : String(totalYards),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
      accent: "indigo",
      sub: "yard terdaftar di sistem",
    },
    {
      label: "Kontainer OPEN",
      value: loading ? "—" : String(totalActive),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      accent: "emerald",
      sub: "sedang tersimpan di yard",
    },
    {
      label: "Waktu Sistem",
      value: loading ? "—" : time.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(',', ''),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: "amber",
      sub: "waktu lokal saat ini (auto-refresh ON)",
    },
  ];

  const accentMap: Record<string, string> = {
    indigo:  "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    amber:   "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Selamat datang{user ? `, ${user.name}` : ""}!
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Sistem Manajemen Kontainer — peta yard diperbarui otomatis setiap 60 detik
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="card p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ring-4 ${accentMap[card.accent]}`}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{card.label}</p>
                <p className="text-3xl font-bold text-white leading-none mt-1">{card.value}</p>
                <p className="text-xs text-slate-600 mt-1 truncate">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Yard Map card */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
                Peta Yard
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Klik blok untuk melihat detail slot &amp; registrasi</p>
            </div>

            {/* Search — filters locally, NO API call */}
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="yard-map-search"
                type="text"
                placeholder="Cari nomor kontainer…"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="input pl-9 pr-8 text-sm h-9"
              />
              {searchInput && (
                <button onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {searchQuery && (
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Mencari: {searchQuery}
              </span>
              <button onClick={clearSearch} className="text-xs text-slate-500 hover:text-slate-300 underline">
                Hapus
              </button>
            </div>
          )}

          <YardMap
            yards={yards}
            loading={loading}
            error={error}
            searchQuery={searchQuery}
            onRetry={fetchYardMap}
          />
        </div>
      </div>
    </AppLayout>
  );
}
