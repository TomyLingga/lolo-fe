"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import WarehouseInvoiceFormModal from "../../components/modals/WarehouseInvoiceFormModal";
import { warehouseInvoicesApi } from "@/lib/api";
import { formatDate, getErrorMessage, cn, formatCurrency, firstOfMonth, today } from "@/lib/utils";
import toast from "react-hot-toast";
import type { WarehouseInvoice } from "@/types";

export default function WarehouseInvoicesPage() {
  const [data, setData] = useState<WarehouseInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  
  const [formOpen, setFormOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState<WarehouseInvoice | null>(null);
  const [payConfirm, setPayConfirm] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await warehouseInvoicesApi.getAll({ 
        date_from: dateFrom || undefined, 
        date_to: dateTo || undefined,
        status: status || undefined
      });
      setData(res.data.data || []);
    } catch (err: any) {
      if (err?.response?.status === 404) setData([]);
      else toast.error(getErrorMessage(err));
    } finally { setLoading(false); }
  }, [dateFrom, dateTo, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter(i => [i.invoice_number, i.freight_forwarder?.name, i.warehouse?.name]
    .some(v => v?.toLowerCase().includes(search.toLowerCase())));

  async function handlePay() {
    if (!selectedInv) return; setActionLoading(true);
    try {
      await warehouseInvoicesApi.pay(selectedInv.id);
      toast.success("Invoice ditandai lunas"); setPayConfirm(false); fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(false); }
  }

  async function handleCancel() {
    if (!selectedInv) return; setActionLoading(true);
    try {
      await warehouseInvoicesApi.deactivate(selectedInv.id);
      toast.success("Invoice dibatalkan"); setCancelConfirm(false); fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(false); }
  }

  function handleExport(inv: WarehouseInvoice) {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/warehouse-invoices/${inv.id}/pdf`, "_blank");
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader title="Invoice Warehouse" subtitle="Manajemen penagihan sewa gudang"
          actions={<button className="btn-primary btn-sm sm:btn" onClick={() => setFormOpen(true)}>+ Buat Invoice</button>} />

        <div className="card p-4 mb-4 flex flex-wrap gap-4 items-end">
          <div><label className="label">Status</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Semua</option><option value="DRAFT">DRAFT</option><option value="PAID">PAID</option>
            </select></div>
          <div><label className="label">Dari Tanggal</label><input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
          <div><label className="label">Sampai Tanggal</label><input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          <div className="flex-1 min-w-[200px]"><label className="label">Cari</label><input className="input" placeholder="No. Invoice, FF, Warehouse..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  {["No. Invoice", "Tanggal", "Freight Forwarder", "Warehouse", "Total", "Status", "Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left table-header whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Memuat...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Tidak ada data</td></tr>
                : filtered.map(inv => (
                  <tr key={inv.id} className={cn("table-row", !inv.is_active && "opacity-40")}>
                    <td className="px-4 py-3 font-mono font-semibold text-white">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-slate-300">{formatDate(inv.invoice_date)}</td>
                    <td className="px-4 py-3 text-slate-300">{inv.freight_forwarder?.name}</td>
                    <td className="px-4 py-3 text-slate-300">{inv.warehouse?.name}</td>
                    <td className="px-4 py-3 text-brand-400 font-semibold">{formatCurrency(inv.grand_total)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("badge", inv.status === "PAID" ? "badge-green" : "badge-amber")}>{inv.status}</span>
                      {!inv.is_active && <span className="badge badge-red ml-1">Void</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleExport(inv)} className="btn btn-sm btn-ghost" title="Cetak PDF">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        </button>
                        {inv.status === "DRAFT" && inv.is_active && (
                          <>
                            <button onClick={() => { setSelectedInv(inv); setPayConfirm(true); }} className="btn btn-sm btn-ghost text-emerald-400" title="Tandai Lunas">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button onClick={() => { setSelectedInv(inv); setCancelConfirm(true); }} className="btn btn-sm btn-ghost text-red-400" title="Batalkan Invoice">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <WarehouseInvoiceFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); fetchData(); }} />

        <ConfirmDialog open={payConfirm} onClose={() => setPayConfirm(false)} onConfirm={handlePay}
          title="Tandai Lunas" message="Yakin tandai invoice ini sebagai PAID? Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Ya, Lunas" loading={actionLoading} />
        
        <ConfirmDialog open={cancelConfirm} onClose={() => setCancelConfirm(false)} onConfirm={handleCancel}
          title="Batalkan Invoice" message="Membatalkan invoice akan mengembalikan status BA ke belum diinvoice. Lanjutkan?"
          confirmLabel="Ya, Batalkan" danger loading={actionLoading} />
      </div>
    </AppLayout>
  );
}
