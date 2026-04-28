"use client";
import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { invoicesApi, freightForwardersApi, taxesApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatDate, formatCurrency, getErrorMessage, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Invoice, FreightForwarder, Registration, Tax } from "@/types";

type FilterTab = "ALL" | "DRAFT" | "PAID";

export default function InvoicesPage() {
  // Helper untuk mendapatkan format YYYY-MM-DD waktu lokal
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

  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<FilterTab>("DRAFT");

  // Menerapkan default tanggal
  const [dateFrom, setDateFrom] = useState(getLocalDate(startOfMonth));
  const [dateTo, setDateTo] = useState(getLocalDate(today));
  const [search, setSearch] = useState("");

  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [ffs, setFfs] = useState<FreightForwarder[]>([]);
  const [selectedFf, setSelectedFf] = useState("");
  const [invoiceableRegs, setInvoiceableRegs] = useState<Registration[]>([]);
  const [fetchingRegs, setFetchingRegs] = useState(false);
  const [selectedRegIds, setSelectedRegIds] = useState<number[]>([]);
  const [availableTaxes, setAvailableTaxes] = useState<Tax[]>([]);
  const [selectedTaxIds, setSelectedTaxIds] = useState<number[]>([]);
  const [createForm, setCreateForm] = useState({
    invoice_date: "", bank_name: "", swift_code: "", bank_account_name: "", bank_account_number: "", signatory_name: "", signatory_position: "",
  });
  const [creating, setCreating] = useState(false);

  const [payConfirm, setPayConfirm] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Invoice | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingFfs, setLoadingFfs] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (tab !== "ALL") params.status = tab;
      if (tab !== "DRAFT" && dateFrom) params.date_from = dateFrom;
      if (tab !== "DRAFT" && dateTo) params.date_to = dateTo;
      const res = await invoicesApi.getAll(params as { date_from?: string; date_to?: string; status?: string });
      // API already filters by status — no client-side re-filter needed
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

  useEffect(() => {
    if (!createOpen) return;
    setLoadingFfs(true);
    Promise.all([
      freightForwardersApi.getAll(),
      taxesApi.getAll()
    ])
      .then(([ffsRes, taxesRes]) => {
        setFfs(ffsRes.data.data.filter((f: any) => f.is_active));
        setAvailableTaxes(taxesRes.data.data.filter((t: any) => t.is_active));
      })
      .catch(() => { })
      .finally(() => setLoadingFfs(false));
    setCreateForm(p => ({ ...p, invoice_date: getLocalDate(new Date()) }));
  }, [createOpen]);

  useEffect(() => {
    if (!selectedFf) {
      setInvoiceableRegs([]);
      setSelectedRegIds([]);
      setSelectedTaxIds([]);
      return;
    }

    setFetchingRegs(true);
    invoicesApi.getInvoiceableRegistrations(Number(selectedFf))
      .then(r => {
        // Handle both axios data wrapper and direct response format
        const responseData = (r.data as any).data || r.data;
        const regs = responseData.registrations || [];
        setInvoiceableRegs(regs);
      })
      .catch(() => toast.error("Gagal menarik data registrasi FF ini"))
      .finally(() => setFetchingRegs(false));
  }, [selectedFf]);

  const filtered = search
    ? data.filter(i => [i.invoice_number, i.freight_forwarder?.name, (i as any).freight_forwarders?.name].some(v => v?.toLowerCase().includes(search.toLowerCase())))
    : data;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRegIds.length) { toast.error("Pilih minimal 1 registrasi"); return; }
    setCreating(true);
    try {
      await invoicesApi.create({ ...createForm, freight_forwarder_id: Number(selectedFf), registration_ids: selectedRegIds, tax_ids: selectedTaxIds });
      toast.success("Invoice berhasil dibuat");
      setCreateOpen(false);
      setSelectedFf(""); setSelectedRegIds([]); setSelectedTaxIds([]);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setCreating(false); }
  }

  async function handlePay() {
    if (!selectedInv) return;
    setActionLoading(true);
    try {
      await invoicesApi.pay(selectedInv.id);
      toast.success("Invoice ditandai LUNAS");
      setPayConfirm(false);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(false); }
  }

  async function handleDeactivate() {
    if (!selectedInv) return;
    setActionLoading(true);
    try {
      await invoicesApi.deactivate(selectedInv.id);
      toast.success("Invoice dinonaktifkan");
      setDeactivateConfirm(false);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(false); }
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader title="Invoice" subtitle="Manajemen invoice"
          actions={
            <button className="btn-primary btn-sm sm:btn" onClick={() => setCreateOpen(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Buat Invoice</span>
              <span className="sm:hidden">Buat</span>
            </button>
          }
        />

        <div className="card p-4 mb-4 space-y-3">
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg w-fit">
            {(["ALL", "DRAFT", "PAID"] as FilterTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  tab === t ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white")}>
                {t === "ALL" ? "Semua" : t}
              </button>
            ))}
          </div>
          {tab !== "DRAFT" && (
            <div className="flex flex-wrap gap-3 items-end">
              <div><label className="label">Dari</label><input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
              <div><label className="label">Sampai</label><input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
              {(dateFrom || dateTo) && <button className="btn-ghost btn-sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>Reset</button>}
            </div>
          )}
          <input className="input max-w-sm" placeholder="Cari no. invoice, FF..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  {["No. Invoice", "Freight Forwarder", "Tanggal", "Status", "Total", "Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left table-header whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <div className="flex justify-center items-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Memuat...
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Tidak ada data</td></tr>
                ) : filtered.map(inv => {
                  const ffName = inv.freight_forwarder?.name || (inv as any).freight_forwarders?.name || "-";
                  const total = (inv as any).grand_total || inv.total_amount;

                  return (
                    // MENGUBAH SYARAT OPACITY: Hanya tembus pandang jika API secara eksplisit mereturn is_active: false
                    <tr key={inv.id} className={cn("table-row", inv.is_active === false && "opacity-40")}>
                      <td className="px-4 py-3 font-mono font-semibold text-white">{inv.invoice_number || `#${inv.id}`}</td>
                      <td className="px-4 py-3 text-slate-300">{ffName}</td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(inv.invoice_date)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("badge", inv.status === "PAID" ? "badge-green" : "badge-amber")}>{inv.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{total ? formatCurrency(Number(total)) : "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <a href={`${apiUrl}/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer"
                            className="btn btn-sm btn-ghost" title="Cetak PDF">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </a>

                          {inv.status === "DRAFT" && inv.is_active !== false && (
                            <button onClick={() => { setSelectedInv(inv); setPayConfirm(true); }} className="btn btn-sm btn-success" title="Tandai Lunas">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}

                          {isAdmin && (
                            <button onClick={() => { setSelectedInv(inv); setDeactivateConfirm(true); }}
                              className="btn btn-sm btn-ghost text-red-400 hover:text-red-300" title="Nonaktifkan">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">{filtered.length} dari {data.length} data</p>
          </div>
        </div>

        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Buat Invoice Baru" size="xl">
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Freight Forwarder <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select className="input" required value={selectedFf}
                    disabled={loadingFfs}
                    onChange={e => { setSelectedFf(e.target.value); setSelectedRegIds([]); }}>
                    <option value="">{loadingFfs ? "Memuat data FF…" : "-- Pilih FF --"}</option>
                    {ffs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  {loadingFfs && (
                    <svg className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400 pointer-events-none"
                      fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </div>
              </div>
              <div>
                <label className="label">Tanggal Invoice <span className="text-red-400">*</span></label>
                <input className="input" type="date" required value={createForm.invoice_date} onChange={e => setCreateForm(p => ({ ...p, invoice_date: e.target.value }))} />
              </div>
            </div>

            {selectedFf && (
              <div>
                <label className="label">Pilih Registrasi <span className="text-red-400">*</span></label>

                {fetchingRegs ? (
                  <div className="flex justify-center items-center py-6 text-slate-500 text-sm gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Menarik data kontainer...
                  </div>
                ) : invoiceableRegs.length === 0 ? (
                  <p className="text-sm text-slate-500 py-3">Tidak ada registrasi yang dapat diinvoice</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-700 rounded-lg p-3">
                    {invoiceableRegs.map(r => (
                      <label key={r.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-2 rounded transition-colors">
                        <input type="checkbox" className="rounded border-slate-600 focus:ring-brand-500"
                          checked={selectedRegIds.includes(r.id)}
                          onChange={e => setSelectedRegIds(prev => e.target.checked ? [...prev, r.id] : prev.filter(id => id !== r.id))} />
                        <span className="font-mono text-sm text-white">{r.container_number}</span>
                        <span className="text-xs text-slate-500">{r.no_do_jo || "-"}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedFf && availableTaxes.length > 0 && (
              <div>
                <label className="label mb-2">Pilih Tax / Discount</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-700 rounded-lg p-3">
                  {availableTaxes.map(tax => (
                    <label key={tax.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-2 rounded transition-colors">
                      <input type="checkbox" className="rounded border-slate-600 focus:ring-brand-500 text-brand-500"
                        checked={selectedTaxIds.includes(tax.id)}
                        onChange={e => setSelectedTaxIds(prev => e.target.checked ? [...prev, tax.id] : prev.filter(id => id !== tax.id))} />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-white">{tax.name}</span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {tax.value_type === "PERCENTAGE" ? `${tax.value}%` : formatCurrency(Number(tax.value))}
                          <span className={cn("ml-2 px-1.5 py-0.5 rounded text-[10px]",
                            tax.type === "ADD" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400")}>
                            {tax.type === "ADD" ? "Tambah" : "Kurang"}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-800 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Info Bank & Penanda Tangan</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ["bank_name", "Nama Bank"], ["swift_code", "SWIFT Code"],
                  ["bank_account_name", "Nama Rekening"], ["bank_account_number", "No. Rekening"],
                  ["signatory_name", "Nama Penanda Tangan"], ["signatory_position", "Jabatan"],
                ].map(([k, l]) => (
                  <div key={k}>
                    <label className="label">{l}</label>
                    <input className="input" value={createForm[k as keyof typeof createForm]}
                      onChange={e => setCreateForm(p => ({ ...p, [k]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)}>Batal</button>
              <button type="submit" className="btn-primary" disabled={creating}>{creating ? "Membuat..." : "Buat Invoice"}</button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog open={payConfirm} onClose={() => setPayConfirm(false)} onConfirm={handlePay}
          title="Tandai Invoice Lunas" message={`Tandai invoice ${selectedInv?.invoice_number || `#${selectedInv?.id}`} sebagai LUNAS?`}
          confirmLabel="Tandai Lunas" loading={actionLoading} />
        <ConfirmDialog open={deactivateConfirm} onClose={() => setDeactivateConfirm(false)} onConfirm={handleDeactivate}
          title="Nonaktifkan Invoice" message={`Nonaktifkan invoice ${selectedInv?.invoice_number || `#${selectedInv?.id}`}?`}
          confirmLabel="Nonaktifkan" danger loading={actionLoading} />
      </div>
    </AppLayout>
  );
}