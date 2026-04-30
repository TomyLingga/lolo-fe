"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import WarehouseRegistrationFormModal from "@/components/modals/WarehouseRegistrationFormModal";
import WarehouseRemarkModal from "@/components/modals/WarehouseRemarkModal";
import { warehouseRegistrationsApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatDate, formatDateTime, getErrorMessage, cn, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import type { WarehouseRegistration } from "@/types";

type FilterTab = "ALL" | "OPEN" | "CLOSED";

export default function WarehouseRentPage() {
  const getLocalDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const user = typeof window !== "undefined" ? getUser() : null;
  const isAdmin = user?.role === "admin";

  const [data, setData] = useState<WarehouseRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<FilterTab>("OPEN");
  const [dateFrom, setDateFrom] = useState(getLocalDate(startOfMonth));
  const [dateTo, setDateTo] = useState(getLocalDate(today));
  const [search, setSearch] = useState("");
  const [colFilters, setColFilters] = useState({ ff: "", warehouse: "", chamber: "" });

  const [formOpen, setFormOpen] = useState(false);
  const [editReg, setEditReg] = useState<WarehouseRegistration | null>(null);
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remarkReadOnly, setRemarkReadOnly] = useState(false);
  const [selectedReg, setSelectedReg] = useState<WarehouseRegistration | null>(null);
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [closeDate, setCloseDate] = useState(getLocalDate(today));
  const [closeRemark, setCloseRemark] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (tab === "OPEN") res = await warehouseRegistrationsApi.getActive();
      else if (tab === "CLOSED") res = await warehouseRegistrationsApi.getClosed({ date_from: dateFrom || undefined, date_to: dateTo || undefined });
      else res = await warehouseRegistrationsApi.getAll({ date_from: dateFrom || undefined, date_to: dateTo || undefined });
      setData(res.data.data || []);
    } catch (err: any) {
      if (err?.response?.status === 404) setData([]);
      else toast.error(getErrorMessage(err));
    } finally { setLoading(false); }
  }, [tab, dateFrom, dateTo]);

  useEffect(() => {
    if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    fetchTimeout.current = setTimeout(() => { fetchData(); }, 50);
    return () => { if (fetchTimeout.current) clearTimeout(fetchTimeout.current); };
  }, [fetchData]);

  let filtered = search
    ? data.filter(r => [r.freight_forwarder?.name, r.chamber?.warehouse?.name, r.chamber?.code]
      .some(v => v?.toLowerCase().includes(search.toLowerCase())))
    : data;

  if (colFilters.ff) filtered = filtered.filter(r => r.freight_forwarder?.name?.toLowerCase().includes(colFilters.ff.toLowerCase()));
  if (colFilters.warehouse) filtered = filtered.filter(r => r.chamber?.warehouse?.name?.toLowerCase().includes(colFilters.warehouse.toLowerCase()));
  if (colFilters.chamber) filtered = filtered.filter(r => r.chamber?.code?.toLowerCase().includes(colFilters.chamber.toLowerCase()));

  async function handleClose(e: React.FormEvent) {
    e.preventDefault(); if (!selectedReg) return;
    if (!closeDate) { toast.error("Tanggal penutupan wajib diisi"); return; }
    if (!closeRemark.trim()) { toast.error("Catatan penutupan wajib diisi"); return; }
    setActionLoading(true);
    try {
      await warehouseRegistrationsApi.close(selectedReg.id, {
        rent_end: closeDate,
        remark: closeRemark
      });
      toast.success("Sewa ditutup"); setCloseConfirm(false); fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(false); }
  }

  async function handleDeactivate() {
    if (!selectedReg) return; setActionLoading(true);
    try {
      await warehouseRegistrationsApi.deactivate(selectedReg.id);
      toast.success(selectedReg.is_active ? "Sewa dinonaktifkan" : "Sewa diaktifkan"); setDeactivateConfirm(false); fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(false); }
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader title="Sewa Warehouse" subtitle="Manajemen penyewaan gudang"
          actions={<button className="btn-primary btn-sm sm:btn" onClick={() => { setEditReg(null); setFormOpen(true); }}>+ Tambah Sewa</button>} />

        <div className="card p-4 mb-4 space-y-3">
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg w-fit">
            {(["ALL", "OPEN", "CLOSED"] as FilterTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  tab === t ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white")}>
                {t === "ALL" ? "Semua" : t === "OPEN" ? "ACTIVE" : "CLOSED"}
              </button>
            ))}
          </div>
          {tab !== "OPEN" && (
            <div className="flex flex-wrap gap-3 items-end">
              <div><label className="label">Dari Tanggal</label><input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
              <div><label className="label">Sampai Tanggal</label><input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
            </div>
          )}
          <input className="input max-w-sm" placeholder="Cari FF, Warehouse, Chamber..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  {["Freight Forwarder", "Warehouse", "Chamber", "Luas", "Tarif/m²", "Periode", "Total", "Status", "Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left table-header whitespace-nowrap">{h}</th>
                  ))}
                </tr>
                <tr className="bg-slate-900/40">
                  <td className="px-2 py-1"><input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={colFilters.ff} onChange={e => setColFilters(p => ({ ...p, ff: e.target.value }))} /></td>
                  <td className="px-2 py-1"><input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={colFilters.warehouse} onChange={e => setColFilters(p => ({ ...p, warehouse: e.target.value }))} /></td>
                  <td className="px-2 py-1"><input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={colFilters.chamber} onChange={e => setColFilters(p => ({ ...p, chamber: e.target.value }))} /></td>
                  <td colSpan={6}></td>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">Memuat...</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">Tidak ada data</td></tr>
                    : filtered.map(reg => (
                      <tr key={reg.id} className={cn("table-row", !reg.is_active && "opacity-40")}>
                        <td className="px-4 py-3 text-white font-medium">{reg.freight_forwarder?.name}</td>
                        <td className="px-4 py-3 text-slate-300">{reg.chamber?.warehouse?.name}</td>
                        <td className="px-4 py-3 text-slate-300 font-mono">{reg.chamber?.code}</td>
                        <td className="px-4 py-3 text-slate-400">{reg.area_m2} m²</td>
                        <td className="px-4 py-3 text-slate-400">{formatCurrency(reg.tariff_per_m2)}</td>
                        <td className="px-4 py-3 text-xs">
                          <p className="text-slate-300">{formatDate(reg.rent_start)} - {formatDate(reg.rent_end)}</p>
                          <p className="text-slate-500">{reg.total_rent_days} hari</p>
                        </td>
                        <td className="px-4 py-3 text-brand-400 font-semibold">{formatCurrency(reg.total_rent_cost)}</td>
                        <td className="px-4 py-3">
                          <span className={cn("badge", reg.record_status === "ACTIVE" ? "badge-green" : "badge-slate")}>{reg.record_status}</span>
                          {reg.invoiced && <span className="badge badge-blue ml-1">Invoiced</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setSelectedReg(reg); setRemarkReadOnly(reg.record_status === "CLOSED"); setRemarkOpen(true); }} className="btn btn-sm btn-ghost" title="Catatan">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                            </button>
                            {reg.record_status === "ACTIVE" && reg.is_active && (
                              <button onClick={() => { setSelectedReg(reg); setCloseRemark(""); setCloseConfirm(true); }} className="btn btn-sm btn-success" title="Tutup Sewa">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              </button>
                            )}
                            {isAdmin && reg.record_status === "ACTIVE" && (
                              <button onClick={() => { setEditReg(reg); setFormOpen(true); }} className="btn btn-sm btn-ghost" title="Edit">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                            )}
                            {isAdmin && !reg.invoiced && (
                              <button onClick={() => { setSelectedReg(reg); setDeactivateConfirm(true); }} className={cn("btn btn-sm btn-ghost", reg.is_active ? "text-red-400" : "text-emerald-400")} title={reg.is_active ? "Nonaktifkan" : "Aktifkan"}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  {reg.is_active ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        <WarehouseRegistrationFormModal open={formOpen} onClose={() => setFormOpen(false)} registration={editReg} onSaved={() => { setFormOpen(false); fetchData(); }} />
        <WarehouseRemarkModal open={remarkOpen} onClose={() => setRemarkOpen(false)} registration={selectedReg} readOnly={remarkReadOnly} />

        <Modal open={closeConfirm} onClose={() => setCloseConfirm(false)} title="Tutup Sewa Warehouse" size="md">
          <form onSubmit={handleClose} className="space-y-4">
            <p className="text-sm text-slate-300">Tutup sewa untuk <span className="font-bold text-white">{selectedReg?.freight_forwarder?.name}</span> di chamber <span className="font-bold text-white">{selectedReg?.chamber?.code}</span>?</p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="label">Tanggal Penutupan <span className="text-red-400">*</span></label>
                <input type="date" className="input" required value={closeDate} onChange={e => setCloseDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Catatan Penutupan <span className="text-red-400">*</span></label>
                <textarea className="input" rows={3} required value={closeRemark} onChange={e => setCloseRemark(e.target.value)} placeholder="Catatan penutupan..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={() => setCloseConfirm(false)}>Batal</button>
              <button type="submit" className="btn-success" disabled={actionLoading}>{actionLoading ? "Memproses..." : "Tutup Sewa"}</button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog open={deactivateConfirm} onClose={() => setDeactivateConfirm(false)} onConfirm={handleDeactivate}
          title={selectedReg?.is_active ? "Nonaktifkan Sewa" : "Aktifkan Sewa"} message={`${selectedReg?.is_active ? "Nonaktifkan" : "Aktifkan"} sewa ini?`}
          confirmLabel={selectedReg?.is_active ? "Nonaktifkan" : "Aktifkan"} danger={selectedReg?.is_active} loading={actionLoading} />
      </div>
    </AppLayout>
  );
}
