"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import Slideshow from "@/components/ui/Slideshow";
import { dashboardApi, warehouseRegistrationsApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function WarehouseDashboardPage() {
  const user = getUser();
  const [mapData, setMapData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRevenue, setShowRevenue] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const dateFrom = oneYearAgo.toISOString().slice(0, 10);

      // Use independent handling so one failure doesn't block the other
      const mapPromise = dashboardApi.getWarehouseMap()
        .then(res => setMapData(res.data.data || []))
        .catch(err => console.error("Failed to load map data:", err));

      const activityPromise = warehouseRegistrationsApi.getAll({ date_from: dateFrom })
        .then(res => setRecentActivities(res.data.data?.slice(0, 10) || []))
        .catch(err => console.error("Failed to load activity data:", err));

      await Promise.allSettled([mapPromise, activityPromise]);
    } catch (error) {
      console.error("Dashboard unexpected error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const totalWarehouses = mapData.length;
  const totalChambers = mapData.reduce((sum, w) => sum + w.total_chambers, 0);
  const occupiedChambers = mapData.reduce((sum, w) => sum + w.occupied_count, 0);
  const occupancyRate = totalChambers > 0 ? (occupiedChambers / totalChambers) * 100 : 0;

  // Hitung proyeksi pendapatan dari chamber yang sedang aktif
  const estimatedRevenue = mapData.reduce((sum, w) => {
    return sum + (w.chambers?.reduce((cSum: number, c: any) =>
      cSum + (parseFloat(c.active_registration?.total_rent_cost || 0)), 0) || 0);
  }, 0);

  // Pie Chart Component for Occupancy
  const OccupancyPie = ({ rate }: { rate: number }) => {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (rate / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
          <circle
            cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-brand-500 transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-sm font-bold text-white leading-none">{rate.toFixed(1)}%</span>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-4 bg-slate-950 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m10 0h2a2 2 0 002-2v-5a2 2 0 00-2-2H3a2 2 0 00-2 2v5a2 2 0 002 2h2" /></svg>
              Warehouse Monitor
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Session</p>
            <p className="text-sm text-brand-400 font-semibold">{user?.name}</p>
          </div>
        </div>

        {/* Hero Slideshow */}
        <Slideshow
          images={["/images/photo2.jpg", "/images/photo3.jpg", "/images/photo1.jpg"]}
          title="Modern Warehouse Infrastructure"
          subtitle="Facility Management"
          className="h-80 md:h-80 rounded-2xl border border-slate-800 shadow-2xl"
          showIndicators={false}
          objectPosition="50% 60%"
          contentClassName="bottom-4 left-6"
        />

        {/* Stats Grid */}
        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", user?.role === "admin" ? "xl:grid-cols-5" : "xl:grid-cols-4")}>
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-3 shadow-xl">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg>
            </div>
            <div>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Gudang Aktif</p>
              <p className="text-xl font-bold text-white leading-tight">{loading ? "..." : totalWarehouses}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-3 shadow-xl">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>
            </div>
            <div>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Total Chamber</p>
              <p className="text-xl font-bold text-white leading-tight">{loading ? "..." : totalChambers}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-3 shadow-xl">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Terisi</p>
              <p className="text-xl font-bold text-white leading-tight">{loading ? "..." : `${occupiedChambers}/${totalChambers}`}</p>
            </div>
          </div>

          {user?.role === "admin" && (
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-3 shadow-xl">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-amber-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Proyeksi Pendapatan</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-base font-bold text-white leading-tight transition-all duration-300">
                    {loading ? "..." : showRevenue ? formatCurrency(estimatedRevenue) : "Rp ••••••••"}
                  </p>
                  <button
                    onClick={() => setShowRevenue(v => !v)}
                    className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                    title={showRevenue ? "Sembunyikan" : "Tampilkan"}
                  >
                    {showRevenue ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between shadow-xl overflow-hidden relative group">
            <div className="z-10">
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Okupansi</p>
            </div>
            <div className="flex-shrink-0">
              {loading ? <div className="w-12 h-12 rounded-full border-2 border-slate-800 animate-pulse" /> : <div className="scale-75 origin-right"><OccupancyPie rate={occupancyRate} /></div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Map */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                Floor Plan Status
              </h2>
              <div className="space-y-8">
                {loading ? (
                  <p className="text-center py-12 text-slate-600">Loading map...</p>
                ) : mapData.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m10 0h2a2 2 0 002-2v-5a2 2 0 00-2-2H3a2 2 0 00-2 2v5a2 2 0 002 2h2" /></svg>
                    </div>
                    <p className="text-slate-500 text-sm">Belum ada warehouse terdaftar</p>
                  </div>
                ) : (
                  mapData.map((w) => (
                    <div key={w.id} className="space-y-3">
                      <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                        <h3 className="text-white font-bold text-base">{w.name}</h3>
                        <span className="text-[10px] text-slate-500 font-mono">{w.code}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {w.chambers.map((c: any) => (
                          <div key={c.id} className={cn(
                            "relative group aspect-square rounded-xl border flex flex-col items-center justify-center p-2 transition-all duration-300",
                            c.active_registration
                              ? "bg-brand-500/10 border-brand-500/30 ring-1 ring-brand-500/20"
                              : "bg-slate-800/30 border-slate-700/50 hover:border-slate-500"
                          )}>
                            <span className={cn("text-[10px] font-bold mb-1", c.active_registration ? "text-brand-400" : "text-slate-500")}>
                              {c.code}
                            </span>
                            <svg className={cn("w-6 h-6", c.active_registration ? "text-brand-500 animate-pulse" : "text-slate-700")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-900/90 rounded-xl transition-opacity pointer-events-none p-2 text-center">
                              <p className="text-[9px] text-white font-medium leading-tight">
                                {c.active_registration ? c.active_registration.freight_forwarder?.name : "Kosong"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-full">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Activity Timeline
              </h2>
              <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                {loading ? (
                  <p className="text-center py-12 text-slate-600">Loading activities...</p>
                ) : recentActivities.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-slate-600 text-xs italic">Belum ada aktivitas terekam</p>
                  </div>
                ) : (
                  recentActivities.map((act, i) => (
                    <div key={act.id} className="relative">
                      <div className={cn(
                        "absolute -left-[22px] top-1 w-4 h-4 rounded-full border-4 border-slate-900 z-10",
                        act.record_status === "ACTIVE" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-slate-500"
                      )} />
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                            act.record_status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500 border border-slate-700"
                          )}>
                            {act.record_status === "ACTIVE" ? "NEW RENT" : "CLOSED RENT"}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono">
                            {formatDate(act.rent_start)} - {formatDate(act.rent_end)}
                          </span>
                        </div>
                        <p className="text-sm text-white font-semibold">{act.freight_forwarder?.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-800/50 p-2 rounded-lg border border-slate-700/30">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg>
                          {act.chamber?.warehouse?.name} • {act.chamber?.code}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-[10px] text-brand-400">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {act.total_rent_days} Days
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            {formatCurrency(act.total_rent_cost)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-8 pt-4 border-t border-slate-800 text-center">
                <Link href="/warehouse-rent" className="text-[10px] font-bold text-slate-500 uppercase hover:text-brand-400 transition-colors flex items-center justify-center gap-2 group">
                  View All Activities
                  <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
