"use client";
import AppLayout from "@/components/layout/AppLayout";
import { getUser } from "@/lib/auth";

export default function DashboardPage() {
  const user = typeof window !== "undefined" ? getUser() : null;
  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Selamat datang{user ? `, ${user.name}` : ""}!</h1>
          <p className="text-slate-500 mt-1">Sistem Manajemen Kontainer</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Total Registrasi", icon: "📋", color: "brand" },
            { label: "Kontainer Aktif", icon: "📦", color: "emerald" },
            { label: "Invoice Pending", icon: "🧾", color: "amber" },
          ].map(card => (
            <div key={card.label} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{card.icon}</span>
                <p className="text-sm text-slate-400 font-medium">{card.label}</p>
              </div>
              <p className="text-3xl font-bold text-white">—</p>
              <p className="text-xs text-slate-600 mt-1">Data akan dimuat segera</p>
            </div>
          ))}
        </div>
        <div className="card p-8 mt-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">Dashboard analytics akan hadir segera</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
