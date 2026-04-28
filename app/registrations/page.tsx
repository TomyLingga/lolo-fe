"use client";
import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RegistrationFormModal from "@/components/modals/RegistrationFormModal";
import LoloFormModal from "@/components/modals/LoloFormModal";
import StorageFormModal from "@/components/modals/StorageFormModal";
import LoloTimelineModal from "@/components/modals/LoloTimelineModal";
import StorageTimelineModal from "@/components/modals/StorageTimelineModal";
import RemarkModal from "@/components/modals/RemarkModal";
import Modal from "@/components/ui/Modal"; // Import ini untuk Modal Close custom
import { registrationsApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatDateTime, getErrorMessage, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import type { Registration } from "@/types";

type FilterTab = "ALL" | "OPEN" | "CLOSED";

export default function RegistrationsPage() {
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

  const [data, setData] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<FilterTab>("OPEN");
  const [dateFrom, setDateFrom] = useState(getLocalDate(startOfMonth));
  const [dateTo, setDateTo] = useState(getLocalDate(today));
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editReg, setEditReg] = useState<Registration | null>(null);
  const [loloOpen, setLoloOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);
  const [loloTimeOpen, setLoloTimeOpen] = useState(false);
  const [storageTimeOpen, setStorageTimeOpen] = useState(false);
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remarkReadOnly, setRemarkReadOnly] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Custom State untuk menutup registrasi
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [closeRemark, setCloseRemark] = useState("");

  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      let res;
      if (tab === "OPEN") res = await registrationsApi.getOpen();
      else if (tab === "CLOSED") res = await registrationsApi.getClosed({ date_from: dateFrom || undefined, date_to: dateTo || undefined });
      else res = await registrationsApi.getAll({ date_from: dateFrom || undefined, date_to: dateTo || undefined });
      setData(res.data.data || []);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    fetchTimeout.current = setTimeout(() => { fetchData(); }, 50);
    return () => { if (fetchTimeout.current) clearTimeout(fetchTimeout.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, dateFrom, dateTo]);

  const filtered = search
    ? data.filter(r => [r.container_number, (r as any).freight_forwarders?.name, r.no_do_jo, r.shipper_tenant]
      .some(v => v?.toLowerCase().includes(search.toLowerCase())))
    : data;

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const regData = filtered.map(r => ({
      "ID": r.id,
      "No. Container": r.container_number,
      "Freight Forwarder": (r as any).freight_forwarders?.name || "-",
      "No. DO/JO": r.no_do_jo || "-",
      "Ukuran": (r as any).size?.description || "-",
      "Tipe": (r as any).type?.description || "-",
      "Shipper/Tenant": r.shipper_tenant || "-",
      "Status Record": r.record_status,
      "Tgl Masuk": formatDateTime(r.created_at),
      "Tgl Keluar": r.closed_at ? formatDateTime(r.closed_at) : "-",
    }));

    const loloData: any[] = [];
    const storageData: any[] = [];
    const remarkData: any[] = [];

    filtered.forEach(r => {
      const loloRecs = (r as any).lolo_records || [];
      loloRecs.forEach((l: any) => {
        loloData.push({
          "No. Container": r.container_number,
          "Operasi": l.operation_type === "LIFT_ON" ? "LIFT ON" : "LIFT OFF",
          "Waktu LOLO": formatDateTime(l.lolo_at),
          "Kendaraan": `${l.vehicle_type || "-"} / ${l.vehicle_number || "-"}`,
          "Status Kargo": l.cargo_status?.description || "-",
          "Tarif": l.tariff_price ? Number(l.tariff_price) : 0,
          "Operator": l.created_by ? `${l.created_by.name} (${l.created_by.jabatan || "-"})` : "-",
        });
      });

      const storageRecs = (r as any).storage_records || [];
      storageRecs.forEach((s: any) => {
        storageData.push({
          "No. Container": r.container_number,
          "Mulai": s.start_date,
          "Selesai": s.end_date || "Masih di Storage",
          "Lokasi": `${s.yard?.name || "-"} / Block ${s.block?.block_code || "-"}`,
          "Posisi": `L${s.pos_length} W${s.pos_width} H${s.pos_height}`,
          "Status Kargo": s.cargo_status?.description || "-",
          "Tarif/Hari": s.storage_price_per_day ? Number(s.storage_price_per_day) : 0,
          "Operator": s.moved_by ? `${s.moved_by.name} (${s.moved_by.jabatan || "-"})` : "-",
        });
      });

      const remarks = (r as any).registration_remarks || [];
      remarks.forEach((rm: any) => {
        remarkData.push({
          "No. Container": r.container_number,
          "Catatan": rm.remark,
          "Waktu": formatDateTime(rm.created_at),
          "Oleh": rm.created_by?.name || rm.created_by || "-",
        });
      });
    });

    const wb = XLSX.utils.book_new();
    
    const wsReg = XLSX.utils.json_to_sheet(regData);
    XLSX.utils.book_append_sheet(wb, wsReg, "Registrasi");

    if (loloData.length > 0) {
      const wsLolo = XLSX.utils.json_to_sheet(loloData);
      XLSX.utils.book_append_sheet(wb, wsLolo, "Riwayat LOLO");
    }
    
    if (storageData.length > 0) {
      const wsStorage = XLSX.utils.json_to_sheet(storageData);
      XLSX.utils.book_append_sheet(wb, wsStorage, "Riwayat Storage");
    }

    if (remarkData.length > 0) {
      const wsRemark = XLSX.utils.json_to_sheet(remarkData);
      XLSX.utils.book_append_sheet(wb, wsRemark, "Catatan");
    }

    XLSX.writeFile(wb, `Export_Registrasi_${getLocalDate(new Date())}.xlsx`);
  };

  // Ubah Fungsi handleClose ini
  async function handleClose(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReg) return;
    if (!closeRemark.trim()) {
      toast.error("Catatan penutupan wajib diisi");
      return;
    }

    setActionLoading(true);
    try {
      // Menambahkan payload { remark: "..." } sesuai dengan permintaan
      await registrationsApi.close(selectedReg.id, { remark: closeRemark });
      toast.success("Registrasi ditutup");
      setCloseConfirm(false);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(false); }
  }

  async function handleDeactivate() {
    if (!selectedReg) return;
    setActionLoading(true);
    try {
      await registrationsApi.deactivate(selectedReg.id);
      toast.success(selectedReg.is_active ? "Registrasi dinonaktifkan" : "Registrasi diaktifkan");
      setDeactivateConfirm(false);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(false); }
  }

  function openLolo(reg: Registration) { setSelectedReg(reg); setLoloOpen(true); }
  function openStorage(reg: Registration) { setSelectedReg(reg); setStorageOpen(true); }
  function openLoloTime(reg: Registration) { setSelectedReg(reg); setLoloTimeOpen(true); }
  function openStorageTime(reg: Registration) { setSelectedReg(reg); setStorageTimeOpen(true); }
  function openRemark(reg: Registration, readOnly = false) { setSelectedReg(reg); setRemarkReadOnly(readOnly); setRemarkOpen(true); }
  function openClose(reg: Registration) {
    setSelectedReg(reg);
    setCloseRemark(""); // Reset isian remark setiap kali modal dibuka
    setCloseConfirm(true);
  }
  function openDeactivate(reg: Registration) { setSelectedReg(reg); setDeactivateConfirm(true); }
  function openEdit(reg: Registration) { setEditReg(reg); setFormOpen(true); }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader
          title="Registrasi"
          subtitle="Manajemen registrasi kontainer"
          actions={
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm sm:btn" onClick={handleExportExcel}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">Export Excel</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button className="btn-primary btn-sm sm:btn" onClick={() => { setEditReg(null); setFormOpen(true); }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Tambah Registrasi</span>
                <span className="sm:hidden">Tambah</span>
              </button>
            </div>
          }
        />

        <div className="card p-4 mb-4 space-y-3">
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg w-fit">
            {(["ALL", "OPEN", "CLOSED"] as FilterTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  tab === t ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white")}>
                {t === "ALL" ? "Semua" : t === "OPEN" ? "OPEN" : "CLOSED"}
              </button>
            ))}
          </div>
          {tab !== "OPEN" && (
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="label">Dari Tanggal</label>
                <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="label">Sampai Tanggal</label>
                <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              {(dateFrom || dateTo) && (
                <button className="btn-ghost btn-sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>Reset</button>
              )}
            </div>
          )}
          <input className="input max-w-sm" placeholder="Cari no. container, FF, DO..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  {["No. Container", "Freight Forwarder", "No. DO/JO", "Ukuran/Tipe", "Status", "Posisi", "Tgl. Masuk", "Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left table-header whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memuat...
                    </div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">Tidak ada data</td></tr>
                ) : filtered.map(reg => {

                  const loloRecs = (reg as any).lolo_records || [];
                  const actualLastLolo = loloRecs.length > 0 ? loloRecs[loloRecs.length - 1].operation_type : null;

                  return (
                    <tr key={reg.id} className={cn("table-row", !reg.is_active && "opacity-40")}>
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold text-white">{reg.container_number}</p>
                        <p className="text-xs text-slate-500">#{reg.id}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {(reg as any).freight_forwarders?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{reg.no_do_jo || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="text-slate-300">{(reg as any).size?.code}</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className="text-slate-300">{(reg as any).type?.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("badge", reg.record_status === "OPEN" ? "badge-green" : "badge-slate")}>{reg.record_status}</span>
                        {actualLastLolo && (
                          <span
                            className={cn(
                              "badge ml-1 w-[40px] text-center",
                              actualLastLolo === "LIFT_ON" ? "badge-amber" : "badge-blue"
                            )}
                          >
                            {actualLastLolo === "LIFT_ON" ? "ON" : "OFF"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {(() => {
                          // activeStorageRecord = single object (new lightweight API)
                          // storageRecords = full array (detail API) — fallback
                          const storageRecs = (reg as any).storage_records || [];
                          const sr = storageRecs.find((s: any) => s.end_date === null)
                            ?? storageRecs[storageRecs.length - 1]
                            ?? null;
                          if (!sr) return "-";
                          return `${sr.yard?.code ?? ""}${sr.block?.block_code ? " - " + sr.block.block_code : ""
                            }${sr.pos_length ?? 0}${sr.pos_width ?? 0}${sr.pos_height ?? 0}`;
                        })()}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDateTime(reg.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">

                          {reg.record_status === "OPEN" && reg.is_active && (
                            <button onClick={() => openLolo(reg)}
                              className={cn("btn btn-sm", actualLastLolo === "LIFT_OFF" ? "btn-warning" : "btn-primary")}
                              title={actualLastLolo === "LIFT_OFF" ? "Lift On" : "Lift Off"}>
                              {actualLastLolo === "LIFT_OFF" ? "LO" : "LF"}
                            </button>
                          )}

                          {reg.record_status === "OPEN" && reg.is_active && (
                            <button onClick={() => openStorage(reg)} className="btn btn-sm btn-secondary" title="Pindah Container">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            </button>
                          )}

                          <button onClick={() => openLoloTime(reg)} className="btn btn-sm btn-ghost" title="Riwayat LOLO">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </button>

                          <button onClick={() => openStorageTime(reg)} className="btn btn-sm btn-ghost" title="Riwayat Storage">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </button>

                          <button onClick={() => openRemark(reg, reg.record_status === "CLOSED")} className="btn btn-sm btn-ghost" title="Catatan">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                          </button>

                          {reg.record_status === "OPEN" && reg.is_active && actualLastLolo === "LIFT_ON" && (
                            <button onClick={() => openClose(reg)} className="btn btn-sm btn-success" title="Tutup Registrasi">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}

                          {isAdmin && (
                            <button onClick={() => openEdit(reg)} className="btn btn-sm btn-ghost" title="Edit">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}

                          {isAdmin && (
                            <button onClick={() => openDeactivate(reg)}
                              className={cn("btn btn-sm", reg.is_active ? "btn-ghost text-red-400 hover:text-red-300" : "btn-ghost text-emerald-400")}
                              title={reg.is_active ? "Nonaktifkan" : "Aktifkan"}>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {reg.is_active
                                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                }
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">{filtered.length} dari {data.length} data</p>
            <button className="btn-ghost btn-sm" onClick={fetchData}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <RegistrationFormModal open={formOpen} onClose={() => setFormOpen(false)}
          registration={editReg} isAdmin={isAdmin!} onSaved={() => { setFormOpen(false); fetchData(); }} />
        <LoloFormModal open={loloOpen} onClose={() => setLoloOpen(false)} registration={selectedReg}
          onSaved={() => { setLoloOpen(false); fetchData(); }} />
        <StorageFormModal open={storageOpen} onClose={() => setStorageOpen(false)} registration={selectedReg}
          onSaved={() => { setStorageOpen(false); fetchData(); }} />
        <LoloTimelineModal open={loloTimeOpen} onClose={() => setLoloTimeOpen(false)} registration={selectedReg} />
        <StorageTimelineModal open={storageTimeOpen} onClose={() => setStorageTimeOpen(false)} registration={selectedReg} />
        <RemarkModal open={remarkOpen} onClose={() => setRemarkOpen(false)} registration={selectedReg} readOnly={remarkReadOnly} />

        {/* CUSTOM MODAL UNTUK TUTUP REGISTRASI */}
        <Modal open={closeConfirm} onClose={() => setCloseConfirm(false)} title="Tutup Registrasi" size="md">
          <form onSubmit={handleClose} className="space-y-4">
            <p className="text-sm text-slate-300">
              Apakah Anda yakin ingin menutup registrasi kontainer <span className="font-bold text-white">{selectedReg?.container_number}</span>?
            </p>
            <div>
              <label className="label">Catatan Penutupan <span className="text-red-400">*</span></label>
              <textarea
                className="input"
                rows={3}
                required
                value={closeRemark}
                onChange={e => setCloseRemark(e.target.value)}
                placeholder="Masukkan catatan saat penutupan kontainer..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" className="btn-secondary" onClick={() => setCloseConfirm(false)}>Batal</button>
              <button type="submit" className="btn-success" disabled={actionLoading}>
                {actionLoading ? "Memproses..." : "Tutup Registrasi"}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog open={deactivateConfirm} onClose={() => setDeactivateConfirm(false)} onConfirm={handleDeactivate}
          title={selectedReg?.is_active ? "Nonaktifkan Registrasi" : "Aktifkan Registrasi"}
          message={`${selectedReg?.is_active ? "Nonaktifkan" : "Aktifkan"} registrasi ${selectedReg?.container_number}?`}
          confirmLabel={selectedReg?.is_active ? "Nonaktifkan" : "Aktifkan"}
          danger={selectedReg?.is_active} loading={actionLoading} />
      </div>
    </AppLayout>
  );
}