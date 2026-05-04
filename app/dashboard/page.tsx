"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { getUser } from "@/lib/auth";
import { dashboardApi, YardMapYard } from "@/lib/api";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import Slideshow from "@/components/ui/Slideshow";

const YardMap = dynamic(() => import("@/components/dashboard/YardMap"), { ssr: false });

export default function DashboardPage() {
  const user = typeof window !== "undefined" ? getUser() : null;

  // ─── Master data — fetched ONCE ─────────────────────────────────────────────
  const [allYards, setAllYards] = useState<YardMapYard[]>([]);
  const [stats, setStats] = useState({ monthly_in: 0, monthly_out: 0, projected_revenue: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);   // prevent StrictMode double-fire

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
      const res = await dashboardApi.getYardMap();
      setAllYards(res.data.data.yards ?? []);
      setStats(res.data.data.stats);
      setActivities(res.data.data.activities ?? []);
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

    const fetchTimer = setInterval(fetchYardMap, 120_000);
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
  const totalYards = allYards.length;

  const statCards = [
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
      label: "Container Masuk",
      value: loading ? "—" : String(stats.monthly_in),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      accent: "blue",
      sub: `pada ${time.toLocaleString("id-ID", { month: "long", year: "numeric" })}`,
    },
    {
      label: "Container Keluar",
      value: loading ? "—" : String(stats.monthly_out),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ),
      accent: "rose",
      sub: `pada ${time.toLocaleString("id-ID", { month: "long", year: "numeric" })}`,
    },
    ...(user?.role === "admin" ? [{
      label: "Proyeksi Pendapatan",
      value: loading ? "—" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(stats.projected_revenue),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: "emerald",
      sub: `pada ${time.toLocaleString("id-ID", { month: "long", year: "numeric" })}`,
    }] : []),
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
      sub: "waktu lokal saat ini",
    },
  ];


  const accentMap: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    blue: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    rose: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        {/* Welcome */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
              Container Yard Monitor
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Session</p>
            <p className="text-sm text-brand-400 font-semibold">{user?.name}</p>
          </div>
        </div>

        {/* Hero Slideshow */}
        <Slideshow
          images={["/images/photo1.jpg", "/images/photo2.jpg", "/images/photo3.jpg"]}
          title="Sei Mangkei Dry Port"
          subtitle="Operational View"
          className="h-64 md:h-64 rounded-2xl border border-slate-800 shadow-2xl"
          showIndicators={false}
          objectPosition="50% 61%"
          contentClassName="bottom-4 left-6"
        />

        {/* Stats */}
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", user?.role === "admin" ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
          {statCards.map((card) => (
            <div key={card.label} className="card p-3 flex items-start gap-3 group hover:border-brand-500/50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ring-2 transition-transform group-hover:scale-110 ${accentMap[card.accent]}`}>
                {/* Clone icon with smaller size */}
                {React.cloneElement(card.icon as React.ReactElement, { className: "w-4 h-4" })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">{card.label}</p>
                {card.accent === "amber" ? (
                  <div className="mt-0.5">
                    <p className="text-xl font-black text-white tracking-tighter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] leading-tight">
                      {time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </p>
                    <p className="text-[8px] font-medium text-amber-500/80 uppercase tracking-widest">
                      {time.toLocaleDateString("id-ID", { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className={cn(
                      "font-bold text-white leading-none mt-0.5 tracking-tight text-xl sm:text-2xl"
                    )}>{card.value}</p>
                    <p className="text-[9px] text-slate-500 mt-1.5 truncate font-medium">{card.sub}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Yard Map card */}
        <div className="card p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            <div className="lg:col-span-3">
              <div className="flex flex-col gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-brand-500 rounded-full" />
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Peta Yard
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium">Klik blok untuk melihat detail slot & registrasi</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80 group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      id="yard-map-search"
                      type="text"
                      placeholder="Cari nomor kontainer…"
                      value={searchInput}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-inner"
                    />
                    {searchInput && (
                      <button onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-2 ring-slate-900" />
                      <span>Kosong</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                      <span>Terisi</span>
                    </div>
                    {searchQuery && (
                      <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4 ml-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-brand-500/20" />
                        <span>Hasil Pencarian</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {searchQuery && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-bold border border-brand-500/20 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                    Mencari: {searchQuery}
                  </span>
                  <button onClick={clearSearch} className="text-[10px] font-bold text-slate-500 hover:text-slate-300 underline uppercase tracking-widest">
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

            <div className="lg:col-span-1 border-l border-slate-800/50 pl-6 h-full overflow-visible">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-brand-500 rounded-full" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Activity Feed</h3>
                <div className="flex-1 h-[1px] bg-slate-800" />
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                  <span className="text-[8px] text-brand-400 font-black uppercase">Live</span>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar pb-10">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-3 pb-6">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-800 rounded w-1/2" />
                        <div className="h-2 bg-slate-800 rounded w-3/4" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-2">
                    {activities.map((act, i) => (
                      <div key={i} className="group">
                        {/* Garis penghubung antar item */}
                        {i > 0 && (
                          <div className="w-px h-3 bg-slate-800/50 mx-auto mb-0" />
                        )}

                        <div className="bg-gradient-to-br from-white/10 to-white/[0.02] rounded-2xl p-3.5 border border-white/5 hover:border-white/10 transition-all shadow-xl">
                          {/* Header row: icon + badge + waktu */}
                          <div className="flex items-center gap-2 mb-3">
                            {/* Icon badge — sekarang di dalam card */}
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                              act.type === 'LOLO'
                                ? (act.operation === 'LIFT_OFF' ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400')
                                : (act.type === 'STORAGE_IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400')
                            )}>
                              {act.type === 'LOLO' ? (
                                act.operation === 'LIFT_OFF' ? (
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                )
                              ) : (
                                act.type === 'STORAGE_IN' ? (
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1H3V7h14v4" /></svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 8l4 4m0 0l-4 4m4-4H3m5-4v1h14v10H8v-4" /></svg>
                                )
                              )}
                            </div>

                            <span className={cn(
                              "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                              act.type === 'LOLO'
                                ? (act.operation === 'LIFT_OFF' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400')
                                : (act.type === 'STORAGE_IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400')
                            )}>
                              {act.type === 'LOLO' ? (act.operation === 'LIFT_OFF' ? 'Lift Off' : 'Lift On') : (act.type === 'STORAGE_IN' ? 'Storage Entry' : 'Storage Exit')}
                            </span>

                            <span className="ml-auto text-[9px] text-slate-500 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded-md whitespace-nowrap">
                              {new Date(act.time).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} • {new Date(act.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="mb-3">
                            <h4 className="text-sm font-black text-white group-hover:text-brand-400 transition-colors tracking-tight">
                              {act.container_number}
                            </h4>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 py-1.5 px-2 bg-slate-950/50 rounded-xl border border-white/[0.03]">
                              <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              <span className="text-[10px] text-white font-black uppercase tracking-widest truncate">
                                Slot: {act.location}
                              </span>
                            </div>

                            {act.type === 'LOLO' ? (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-3 h-3 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  <span className="text-[9px] text-slate-500 font-medium truncate">{act.tenant}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-3 h-3 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                  <span className="text-[9px] text-slate-500 font-medium truncate">{act.vehicle}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <svg className="w-3 h-3 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span className="text-[9px] text-slate-500 font-medium truncate">
                                  {act.type === 'STORAGE_IN' ? `Mulai: ${act.start_date}` : `Selesai: ${act.end_date}`}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
                              <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded-full bg-brand-500/20 flex items-center justify-center text-[8px] text-brand-400 font-bold flex-shrink-0">
                                  {act.operator.charAt(0)}
                                </div>
                                <span className="text-[9px] text-brand-500/70 font-bold uppercase tracking-tighter truncate">
                                  Op: {act.operator}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => window.location.href = '/registrations'}
                      className="w-full mt-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all flex items-center justify-center gap-2 group"
                    >
                      View All Activities
                      <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
