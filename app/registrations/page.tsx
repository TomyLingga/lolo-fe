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
import LoloEditModal from "@/components/modals/LoloEditModal";
import Modal from "@/components/ui/Modal";
import { registrationsApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatDate, formatDateRaw, formatDateTime, formatTime, getErrorMessage, cn, toExcelDate, today as getToday } from "@/lib/utils";
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
  const [sortCol, setSortCol] = useState<string>("");
  const [sortOrd, setSortOrd] = useState<"asc" | "desc">("asc");
  const [colFilters, setColFilters] = useState({
    container_number: "",
    ff: "",
    tenant: "",
    no_do_jo: "",
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editReg, setEditReg] = useState<Registration | null>(null);
  const [loloOpen, setLoloOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);
  const [loloTimeOpen, setLoloTimeOpen] = useState(false);
  const [storageTimeOpen, setStorageTimeOpen] = useState(false);
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remarkReadOnly, setRemarkReadOnly] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [loloEditOpen, setLoloEditOpen] = useState(false);
  const [selectedLoloId, setSelectedLoloId] = useState<number | null>(null);
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Custom State untuk menutup registrasi
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [closeRemark, setCloseRemark] = useState("");

  const [reopenConfirm, setReopenConfirm] = useState(false);

  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      let res;
      if (tab === "OPEN") res = await registrationsApi.getOpen();
      else if (tab === "CLOSED") res = await registrationsApi.getClosed({ date_from: dateFrom || undefined, date_to: dateTo || undefined });
      else res = await registrationsApi.getAll({ date_from: dateFrom || undefined, date_to: dateTo || undefined });
      setData(res.data.data || []);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setData([]);
      } else {
        toast.error(getErrorMessage(err));
      }
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

  let filtered = search
    ? data.filter(r => [r.container_number, (r as any).freight_forwarders?.name, r.no_do_jo, r.shipper_tenant?.name]
      .some(v => v?.toLowerCase().includes(search.toLowerCase())))
    : data;

  if (colFilters.container_number) {
    filtered = filtered.filter(r => r.container_number?.toLowerCase().includes(colFilters.container_number.toLowerCase()));
  }
  if (colFilters.ff) {
    filtered = filtered.filter(r => (r as any).freight_forwarders?.name?.toLowerCase().includes(colFilters.ff.toLowerCase()));
  }
  if (colFilters.tenant) {
    filtered = filtered.filter(r => (r as any).shipper_tenant?.name?.toLowerCase().includes(colFilters.tenant.toLowerCase()));
  }
  if (colFilters.no_do_jo) {
    filtered = filtered.filter(r => r.no_do_jo?.toLowerCase().includes(colFilters.no_do_jo.toLowerCase()));
  }

  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      let valA = "";
      let valB = "";
      if (sortCol === "container_number") { valA = a.container_number || ""; valB = b.container_number || ""; }
      else if (sortCol === "ff") { valA = (a as any).freight_forwarders?.name || ""; valB = (b as any).freight_forwarders?.name || ""; }
      else if (sortCol === "tenant") { valA = (a as any).shipper_tenant?.name || ""; valB = (b as any).shipper_tenant?.name || ""; }
      else if (sortCol === "no_do_jo") { valA = a.no_do_jo || ""; valB = b.no_do_jo || ""; }
      else if (sortCol === "size") { valA = (a as any).size?.code || ""; valB = (b as any).size?.code || ""; }
      else if (sortCol === "type") { valA = (a as any).type?.code || ""; valB = (b as any).type?.code || ""; }

      if (valA < valB) return sortOrd === "asc" ? -1 : 1;
      if (valA > valB) return sortOrd === "asc" ? 1 : -1;
      return 0;
    });
  }

  const renderSortIcon = (col: string) => {
    if (sortCol !== col) return <span className="text-slate-600 ml-1">↕</span>;
    return sortOrd === "asc" ? <span className="text-brand-400 ml-1">↑</span> : <span className="text-brand-400 ml-1">↓</span>;
  };

  const handleSort = (col: string) => {
    if (sortCol === col) { setSortOrd(p => (p === "asc" ? "desc" : "asc")); }
    else { setSortCol(col); setSortOrd("asc"); }
  };

  // const handleExportExcel = () => {
  //   if (filtered.length === 0) {
  //     toast.error("Tidak ada data untuk diexport");
  //     return;
  //   }

  //   const regData = filtered.map(r => {
  //     const loloRecs = (r as any).lolo_records || [];
  //     return {
  //       "ID": r.id,
  //       "No. Container": r.container_number,
  //       "Paket": (r as any).package?.code || "-",
  //       "Freight Forwarder": (r as any).freight_forwarders?.name || "-",
  //       "Tenant": (r as any).shipper_tenant?.name || "-",
  //       "No. DO/JO": r.no_do_jo || "-",
  //       "Ukuran": (r as any).size?.description || "-",
  //       "Tipe": (r as any).type?.description || "-",
  //       "Status Record": r.record_status,
  //       "Tgl Masuk": formatDateRaw(loloRecs.find((l: any) => l.operation_type === "LIFT_OFF")?.lolo_at || r.created_at),
  //       "Jam Masuk": formatTime(loloRecs.find((l: any) => l.operation_type === "LIFT_OFF")?.lolo_at || r.created_at),
  //       "Tgl Keluar": [...loloRecs].reverse().find((l: any) => l.operation_type === "LIFT_ON")?.lolo_at ? formatDateRaw([...loloRecs].reverse().find((l: any) => l.operation_type === "LIFT_ON")?.lolo_at) : "-",
  //       "Jam Keluar": [...loloRecs].reverse().find((l: any) => l.operation_type === "LIFT_ON")?.lolo_at ? formatTime([...loloRecs].reverse().find((l: any) => l.operation_type === "LIFT_ON")?.lolo_at) : "-",
  //     };
  //   });

  //   const loloData: any[] = [];
  //   const storageData: any[] = [];
  //   const remarkData: any[] = [];

  //   filtered.forEach(r => {
  //     const loloRecs = (r as any).lolo_records || [];
  //     loloRecs.forEach((l: any) => {
  //       loloData.push({
  //         "No. Container": r.container_number,
  //         "Operasi": l.operation_type === "LIFT_ON" ? "LIFT ON" : "LIFT OFF",
  //         "Tanggal": formatDateRaw(l.lolo_at),
  //         "Jam": formatTime(l.lolo_at),
  //         "Kendaraan": `${l.vehicle_type || "-"} / ${l.vehicle_number || "-"}`,
  //         "Status Kargo": l.cargo_status?.description || "-",
  //         "Tarif": l.tariff_price ? Number(l.tariff_price) : 0,
  //         "Operator": l.created_by ? `${l.created_by.name} (${l.created_by.jabatan || "-"})` : "-",
  //       });
  //     });

  //     const storageRecs = (r as any).storage_records || [];
  //     storageRecs.forEach((s: any) => {
  //       storageData.push({
  //         "No. Container": r.container_number,
  //         "Mulai": formatDateRaw(s.start_date),
  //         "Selesai": s.end_date ? formatDateRaw(s.end_date) : "Masih di Storage",
  //         "Lokasi": `${s.yard?.name || "-"} / Block ${s.block?.block_code || "-"}`,
  //         "Posisi": `L${s.pos_length} W${s.pos_width} H${s.pos_height}`,
  //         "Status Kargo": s.cargo_status?.description || "-",
  //         "Tarif/Hari": s.storage_price_per_day ? Number(s.storage_price_per_day) : 0,
  //         "Operator": s.moved_by ? `${s.moved_by.name} (${s.moved_by.jabatan || "-"})` : "-",
  //       });
  //     });

  //     const remarks = (r as any).registration_remarks || [];
  //     remarks.forEach((rm: any) => {
  //       remarkData.push({
  //         "No. Container": r.container_number,
  //         "Catatan": rm.remark,
  //         "Tanggal": formatDateRaw(rm.created_at),
  //         "Jam": formatTime(rm.created_at),
  //         "Oleh": rm.created_by?.name || rm.created_by || "-",
  //       });
  //     });
  //   });

  //   const wb = XLSX.utils.book_new();

  //   const wsReg = XLSX.utils.json_to_sheet(regData, { cellDates: true });
  //   XLSX.utils.book_append_sheet(wb, wsReg, "Registrasi");

  //   if (loloData.length > 0) {
  //     const wsLolo = XLSX.utils.json_to_sheet(loloData, { cellDates: true });
  //     XLSX.utils.book_append_sheet(wb, wsLolo, "Riwayat LOLO");
  //   }

  //   if (storageData.length > 0) {
  //     const wsStorage = XLSX.utils.json_to_sheet(storageData, { cellDates: true });
  //     XLSX.utils.book_append_sheet(wb, wsStorage, "Riwayat Storage");
  //   }

  //   if (remarkData.length > 0) {
  //     const wsRemark = XLSX.utils.json_to_sheet(remarkData, { cellDates: true });
  //     XLSX.utils.book_append_sheet(wb, wsRemark, "Catatan");
  //   }

  //   XLSX.writeFile(wb, `Export_Registrasi_${getLocalDate(new Date())}.xlsx`);
  // };

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    // Helper: parse string → Date (untuk Excel date cell)
    // Gunakan toExcelDate dari utils
    const d = (str: string | null | undefined): Date | null => toExcelDate(str);

    // ── Sheet 1: Registrasi ──────────────────────────────────────────────────
    const regData = filtered.map(r => {
      const loloRecs = (r as any).lolo_records || [];
      const firstLiftOff = loloRecs.find((l: any) => l.operation_type === "LIFT_OFF");
      const lastLiftOn = [...loloRecs].reverse().find((l: any) => l.operation_type === "LIFT_ON");

      return {
        "ID": r.id,
        "No. Container": r.container_number,
        "Paket": (r as any).package?.code || "-",
        "Freight Forwarder": (r as any).freight_forwarders?.name || "-",
        "Tenant": r.shipper_tenant || "-",
        "No. DO/JO": r.no_do_jo || "-",
        "Ukuran": (r as any).size?.description || "-",
        "Tipe": (r as any).type?.description || "-",
        "Status Record": r.record_status,
        "Tgl Masuk": d(firstLiftOff?.lolo_at ?? r.created_at),
        "Jam Masuk": formatTime(firstLiftOff?.lolo_at ?? r.created_at),
        "Tgl Keluar": d(lastLiftOn?.lolo_at ?? null),
        "Jam Keluar": lastLiftOn ? formatTime(lastLiftOn.lolo_at) : "-",
      };
    });

    // ── Sheet 2: Riwayat LOLO ────────────────────────────────────────────────
    const loloData: object[] = [];
    filtered.forEach(r => {
      const sortedLolos = [...((r as any).lolo_records || [])].sort((a, b) => 
        new Date(a.lolo_at).getTime() - new Date(b.lolo_at).getTime()
      );
      
      sortedLolos.forEach((l: any, index: number) => {
        const dStr = l.lolo_at?.substring(0, 10);
        let yardName = "-";
        if (l.operation_type === "LIFT_OFF") {
          // LIFT_OFF initiates a storage record
          const s = ((r as any).storage_records || []).find((s: any) => s.start_date?.substring(0, 10) === dStr);
          if (s && s.yard) yardName = s.yard.name;
          else if (((r as any).storage_records || []).length > 0) yardName = (r as any).storage_records[0].yard?.name || "-";
        } else {
          // LIFT_ON closes a storage record
          const s = ((r as any).storage_records || []).find((s: any) => s.end_date?.substring(0, 10) === dStr);
          if (s && s.yard) yardName = s.yard.name;
          else {
            // Fallback to the last storage record
            const recs = (r as any).storage_records || [];
            if (recs.length > 0) yardName = recs[recs.length - 1].yard?.name || "-";
          }
        }

        loloData.push({
          "No. Container": r.container_number,
          "Urutan LOLO": index + 1,
          "Paket": (r as any).package?.code || "-",
          "Status": r.record_status,
          "Operasi": l.operation_type === "LIFT_ON" ? "LIFT ON" : "LIFT OFF",
          "Lokasi Yard": yardName,
          "Tanggal": d(l.lolo_at),
          "Jam": formatTime(l.lolo_at),
          "Kendaraan": `${l.vehicle_type || "-"} / ${l.vehicle_number || "-"}`,
          "Status Kargo": l.cargo_status?.description || "-",
          "Tarif": l.tariff_price ? Number(l.tariff_price) : 0,
          "Operator": l.created_by ? `${l.created_by.name}${l.created_by.jabatan ? " (" + l.created_by.jabatan + ")" : ""}` : "-",
        });
      });
    });

    // ── Sheet 3: Riwayat Storage ─────────────────────────────────────────────
    const storageData: object[] = [];
    filtered.forEach(r => {
      ((r as any).storage_records || []).forEach((s: any) => {
        storageData.push({
          "No. Container": r.container_number,
          "Mulai": d(s.start_date),
          "Selesai": s.end_date ? d(s.end_date) : null,
          "Lokasi": `${s.yard?.name || "-"} / Block ${s.block?.block_code || "-"}`,
          "Posisi": `L${s.pos_length} W${s.pos_width} H${s.pos_height}`,
          "Status Kargo": s.cargo_status?.description || "-",
          "Tarif/Hari": s.storage_price_per_day ? Number(s.storage_price_per_day) : 0,
          "Total Hari": s.total_storage_days ?? "-",
          "Total Biaya": s.total_storage_cost ? Number(s.total_storage_cost) : 0,
          "Operator": s.moved_by ? `${s.moved_by.name}${s.moved_by.jabatan ? " (" + s.moved_by.jabatan + ")" : ""}` : "-",
        });
      });
    });

    // ── Sheet 4: Catatan ─────────────────────────────────────────────────────
    const remarkData: object[] = [];
    filtered.forEach(r => {
      ((r as any).registration_remarks || []).forEach((rm: any) => {
        remarkData.push({
          "No. Container": r.container_number,
          "Catatan": rm.remark,
          "Tanggal": d(rm.created_at),
          "Jam": formatTime(rm.created_at),
          "Oleh": rm.created_by?.name || rm.created_by || "-",
        });
      });
    });

    // ── Build Workbook ───────────────────────────────────────────────────────
    const wb = XLSX.utils.book_new();

    // Format date cell: "DD/MM/YYYY"
    const DATE_FMT = "DD/MM/YYYY";

    const applyDateFormat = (ws: XLSX.WorkSheet, dateColLetters: string[]) => {
      const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
      dateColLetters.forEach(colLetter => {
        const colIdx = XLSX.utils.decode_col(colLetter);
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
          const cellAddr = XLSX.utils.encode_cell({ r: row, c: colIdx });
          const cell = ws[cellAddr];
          if (cell && cell.v instanceof Date) {
            cell.t = "d";
            cell.z = DATE_FMT;
          }
        }
      });
    };

    // Sheet Registrasi — kolom J = Tgl Masuk, L = Tgl Keluar
    const wsReg = XLSX.utils.json_to_sheet(regData, { cellDates: true });
    applyDateFormat(wsReg, ["J", "L"]);
    XLSX.utils.book_append_sheet(wb, wsReg, "Registrasi");

    // Sheet LOLO — kolom C = Tanggal
    if (loloData.length > 0) {
      const wsLolo = XLSX.utils.json_to_sheet(loloData, { cellDates: true });
      applyDateFormat(wsLolo, ["C"]);
      XLSX.utils.book_append_sheet(wb, wsLolo, "Riwayat LOLO");
    }

    // Sheet Storage — kolom B = Mulai, C = Selesai
    if (storageData.length > 0) {
      const wsStorage = XLSX.utils.json_to_sheet(storageData, { cellDates: true });
      applyDateFormat(wsStorage, ["B", "C"]);
      XLSX.utils.book_append_sheet(wb, wsStorage, "Riwayat Storage");
    }

    // Sheet Catatan — kolom C = Tanggal
    if (remarkData.length > 0) {
      const wsRemark = XLSX.utils.json_to_sheet(remarkData, { cellDates: true });
      applyDateFormat(wsRemark, ["C"]);
      XLSX.utils.book_append_sheet(wb, wsRemark, "Catatan");
    }

    XLSX.writeFile(wb, `Export_Registrasi_${getToday()}.xlsx`);
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
  function openReopen(reg: Registration) { setSelectedReg(reg); setReopenConfirm(true); }

  async function handleReopen() {
    if (!selectedReg) return;
    setActionLoading(true);
    try {
      await registrationsApi.reopen(selectedReg.id);
      toast.success("Registrasi berhasil dibuka kembali (Re-Open)");
      setReopenConfirm(false);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(false); }
  }

  function handleEditLolo(loloId: number) {
    setSelectedLoloId(loloId);
    setLoloEditOpen(true);
  }

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
          {tab === "OPEN" && (
            <div className="flex gap-4">
              <div className="card p-4 bg-indigo-500/10 border-indigo-500/20 w-full sm:w-48">
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Total Registrasi OPEN</p>
                <p className="text-2xl font-black text-white">{filtered.length}</p>
              </div>
            </div>
          )}

          {tab === "ALL" && (
            <div className="flex gap-4">
              <div className="card p-4 bg-blue-500/10 border-blue-500/20 w-full sm:w-56">
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Total Container Masuk</p>
                <p className="text-2xl font-black text-white">
                  {filtered.filter(r => {
                    if (r.is_active === false) return false;
                    const loloOff = (r as any).lolo_records?.find((l: any) => l.operation_type === "LIFT_OFF");
                    if (!loloOff) return false;
                    const d = loloOff.lolo_at.substring(0, 10);
                    return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
                  }).length}
                </p>
                <p className="text-[8px] text-slate-500 mt-1 uppercase tracking-wider font-medium">LIFT OFF dlm rentang tanggal</p>
              </div>
              <div className="card p-4 bg-rose-500/10 border-rose-500/20 w-full sm:w-56">
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-1">Total Container Keluar</p>
                <p className="text-2xl font-black text-white">
                  {filtered.filter(r => {
                    if (r.is_active === false) return false;
                    if (r.record_status !== "CLOSED") return false;
                    const loloOn = [...((r as any).lolo_records || [])].reverse().find((l: any) => l.operation_type === "LIFT_ON");
                    if (!loloOn) return false;
                    const d = loloOn.lolo_at.substring(0, 10);
                    return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
                  }).length}
                </p>
                <p className="text-[8px] text-slate-500 mt-1 uppercase tracking-wider font-medium">LIFT ON dlm rentang tanggal</p>
              </div>
            </div>
          )}

          {tab !== "OPEN" && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-400 font-medium">Filter Tanggal Operasional (LIFT OFF Masuk / LIFT ON Keluar)</p>
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
                  <th className="px-4 py-3 text-left table-header whitespace-nowrap">Paket</th>
                  <th className="px-4 py-3 text-left table-header whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort("container_number")}>
                    No. Container {renderSortIcon("container_number")}
                  </th>
                  <th className="px-4 py-3 text-left table-header whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort("ff")}>
                    Freight Forwarder {renderSortIcon("ff")}
                  </th>
                  <th className="px-4 py-3 text-left table-header whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort("tenant")}>
                    Tenant {renderSortIcon("tenant")}
                  </th>
                  <th className="px-4 py-3 text-left table-header whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort("no_do_jo")}>
                    No. DO/JO {renderSortIcon("no_do_jo")}
                  </th>
                  <th className="px-4 py-3 text-left table-header whitespace-nowrap">
                    <span className="cursor-pointer select-none" onClick={() => handleSort("size")}>SZ{renderSortIcon("size")}</span>
                    <span className="mx-1">/</span>
                    <span className="cursor-pointer select-none" onClick={() => handleSort("type")}>TP{renderSortIcon("type")}</span>
                  </th>
                  <th className="px-4 py-3 text-left table-header whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left table-header whitespace-nowrap">Posisi</th>
                  <th className="px-4 py-3 text-left table-header whitespace-nowrap">In / Out</th>
                  <th className="px-4 py-3 text-left table-header whitespace-nowrap">Aksi</th>
                </tr>
                <tr className="bg-slate-900/40">
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1">
                    <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={colFilters.container_number} onChange={e => setColFilters(p => ({ ...p, container_number: e.target.value }))} />
                  </td>
                  <td className="px-2 py-1">
                    <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={colFilters.ff} onChange={e => setColFilters(p => ({ ...p, ff: e.target.value }))} />
                  </td>
                  <td className="px-2 py-1">
                    <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={colFilters.tenant} onChange={e => setColFilters(p => ({ ...p, tenant: e.target.value }))} />
                  </td>
                  <td className="px-2 py-1">
                    <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={colFilters.no_do_jo} onChange={e => setColFilters(p => ({ ...p, no_do_jo: e.target.value }))} />
                  </td>
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1"></td>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memuat...
                    </div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">Tidak ada data</td></tr>
                ) : filtered.map(reg => {

                  const loloRecs = (reg as any).lolo_records || [];
                  const actualLastLolo = loloRecs.length > 0 ? loloRecs[loloRecs.length - 1].operation_type : null;

                  return (
                    <tr key={reg.id} className={cn("table-row", !reg.is_active && "opacity-40")}>
                      <td className="px-4 py-3 text-slate-300 font-medium">
                        {(reg as any).package?.code || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold text-white">{reg.container_number}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {(reg as any).freight_forwarders?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {(reg as any).shipper_tenant?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{reg.no_do_jo || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span className="text-white">{(reg as any).size?.code}</span>
                          <span className="text-slate-600">/</span>
                          <span className="text-brand-400">{(reg as any).type?.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={cn("badge text-[10px] py-0.5 px-1.5 w-fit", reg.record_status === "OPEN" ? "badge-green" : "badge-slate")}>
                            {reg.record_status}
                          </span>
                          {actualLastLolo && (
                            <span className={cn("badge text-[10px] py-0.5 px-1.5 w-fit", actualLastLolo === "LIFT_ON" ? "badge-amber" : "badge-blue")}>
                              {actualLastLolo === "LIFT_ON" ? "LN" : "LF"}
                            </span>
                          )}
                        </div>
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
                      <td className="px-4 py-3 text-xs">
                        {(() => {
                          const firstLoloOff = loloRecs.find((l: any) => l.operation_type === "LIFT_OFF");
                          const lastLoloOn = [...loloRecs].reverse().find((l: any) => l.operation_type === "LIFT_ON");
                          const inDate = firstLoloOff ? firstLoloOff.lolo_at : reg.created_at;
                          const outDate = lastLoloOn ? lastLoloOn.lolo_at : null;
                          const operator = reg.created_by?.name || "-";

                          return (
                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                              <div>
                                <div className="text-slate-300"><span className="text-slate-500">In:</span> {formatDateTime(inDate)}</div>
                                <div className="text-slate-500 mt-0.5">Oleh: <span className="text-slate-400">{operator}</span></div>
                              </div>
                              {reg.record_status === "CLOSED" && outDate && (
                                <div className="pt-1.5 border-t border-slate-700/50">
                                  <div className="text-brand-400"><span className="text-slate-500">Out:</span> {formatDateTime(outDate)}</div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">

                          {reg.record_status === "OPEN" && reg.is_active && (
                            <button onClick={() => openLolo(reg)}
                              className={cn("btn btn-sm", actualLastLolo === "LIFT_OFF" ? "btn-warning" : "btn-primary")}
                              title={actualLastLolo === "LIFT_OFF" ? "Lift On" : "Lift Off"}>
                              {actualLastLolo === "LIFT_OFF" ? "LN" : "LF"}
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

                          {isAdmin && reg.record_status === "CLOSED" && (
                            <button onClick={() => openReopen(reg)} className="btn btn-sm btn-warning" title="Buka Kembali (Re-Open)">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
        <LoloTimelineModal open={loloTimeOpen} onClose={() => setLoloTimeOpen(false)} registration={selectedReg}
          isAdmin={isAdmin} onEditLolo={handleEditLolo} />
        <LoloEditModal open={loloEditOpen} onClose={() => setLoloEditOpen(false)} loloId={selectedLoloId}
          onSaved={() => { setLoloEditOpen(false); fetchData(); }} />
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

        <ConfirmDialog open={reopenConfirm} onClose={() => setReopenConfirm(false)} onConfirm={handleReopen}
          title="Buka Kembali Registrasi"
          message={`Anda yakin ingin melakukan Re-Open pada registrasi ${selectedReg?.container_number}? Ini akan membuka kembali storage record terakhir dan merubah status menjadi OPEN.`}
          confirmLabel="Re-Open"
          danger={true} loading={actionLoading} />
      </div>
    </AppLayout>
  );
}