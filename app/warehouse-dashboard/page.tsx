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

  async function fetchData() {
    setLoading(true);
    try {
      const [mapRes, actRes] = await Promise.all([
        dashboardApi.getWarehouseMap(),
        warehouseRegistrationsApi.getAll({ date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) })
      ]);
      setMapData(mapRes.data.data || []);
      setRecentActivities(actRes.data.data?.slice(0, 5) || []);
    } catch {
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const totalWarehouses = mapData.length;
  const totalChambers = mapData.reduce((sum, w) => sum + w.total_chambers, 0);
  const occupiedChambers = mapData.reduce((sum, w) => sum + w.occupied_count, 0);
  const occupancyRate = totalChambers > 0 ? (occupiedChambers / totalChambers) * 100 : 0;

  return (
    <AppLayout>
      <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m10 0h2a2 2 0 002-2v-5a2 2 0 00-2-2H3a2 2 0 00-2 2v5a2 2 0 002 2h2" /></svg>
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
          className="h-80 rounded-2xl border border-slate-800 shadow-2xl"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Gudang Aktif", value: totalWarehouses, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16", color: "text-blue-400" },
            { label: "Total Chamber", value: totalChambers, icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z", color: "text-indigo-400" },
            { label: "Terisi", value: occupiedChambers, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-emerald-400" },
            { label: "Okupansi", value: `${occupancyRate.toFixed(1)}%`, icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", color: "text-amber-400" },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-white/5", s.color)}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} /></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
                <p className="text-2xl font-bold text-white leading-tight">{loading ? "..." : s.value}</p>
              </div>
            </div>
          ))}
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
                {loading ? <p className="text-center py-12 text-slate-600">Loading map...</p>
                  : mapData.map((w) => (
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
                  ))}
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
                {loading ? <p className="text-center py-12 text-slate-600">Loading activities...</p>
                  : recentActivities.map((act, i) => (
                    <div key={act.id} className="relative">
                      <div className={cn(
                        "absolute -left-[22px] top-1 w-4 h-4 rounded-full border-4 border-slate-900 z-10",
                        act.record_status === "ACTIVE" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-slate-500"
                      )} />
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            {act.record_status === "ACTIVE" ? "NEW RENT" : "CLOSED RENT"}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono">{formatDate(act.created_at)}</span>
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
                  ))}
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
