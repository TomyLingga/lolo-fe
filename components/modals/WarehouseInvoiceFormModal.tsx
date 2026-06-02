"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { freightForwardersApi, warehouseInvoicesApi, taxesApi } from "@/lib/api";
import { getErrorMessage, formatCurrency, cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import type { WarehouseBeritaAcara, Tax } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function WarehouseInvoiceFormModal({ open, onClose, onSaved }: Props) {
  const [ffs, setFfs] = useState<any[]>([]);
  const [ffId, setFfId] = useState("");
  const [invoiceableBas, setInvoiceableBas] = useState<WarehouseBeritaAcara[]>([]);
  const [allTaxes, setAllTaxes] = useState<Tax[]>([]);
  const [loadingBas, setLoadingBas] = useState(false);

  const [selectedBaIds, setSelectedBaIds] = useState<number[]>([]);
  const [selectedTaxIds, setSelectedTaxIds] = useState<number[]>([]);

  const [form, setForm] = useState({
    warehouse_id: "",
    invoice_date: new Date().toISOString().slice(0, 10),
    spk_name: "",
    spk_number: "",
    spk_date: "",
    po_number: "",
    bank_name: "",
    swift_code: "",
    bank_account_name: "",
    bank_account_number: "",
    signatory_name: "",
    signatory_position: ""
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFfId(""); setInvoiceableBas([]); setSelectedBaIds([]); setSelectedTaxIds([]);
      Promise.all([freightForwardersApi.getAll(), taxesApi.getAll()])
        .then(([f, t]) => { setFfs(f.data.data); setAllTaxes(t.data.data); })
        .catch(() => { });
    }
  }, [open]);

  useEffect(() => {
    if (ffId) {
      setLoadingBas(true);
      warehouseInvoicesApi.getInvoiceableBas(Number(ffId))
        .then(res => setInvoiceableBas(res.data.data))
        .finally(() => setLoadingBas(false));
    }
  }, [ffId]);

  const warehouseGroups = Array.from(new Set(invoiceableBas.map(b => b.warehouse_id)));
  const filteredBas = form.warehouse_id
    ? invoiceableBas.filter(b => b.warehouse_id === Number(form.warehouse_id))
    : [];

  const subtotal = filteredBas
    .filter(b => selectedBaIds.includes(b.id))
    .reduce((sum, b) => sum + Number(b.subtotal), 0);

  const firstBa = invoiceableBas.find(b => b.id === selectedBaIds[0]);

  const calculateGrandTotal = () => {
    let total = subtotal;
    selectedTaxIds.forEach(tid => {
      const tax = allTaxes.find(t => t.id === tid);
      if (!tax) return;
      const amount = tax.value_type === "NOMINAL" ? tax.value : subtotal * (tax.value / 100);
      if (tax.type === "ADD") total += amount;
      else total -= amount;
    });
    return total;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedBaIds.length === 0) { toast.error("Pilih minimal satu BA"); return; }
    setSaving(true);
    try {
      await warehouseInvoicesApi.create({
        ...form,
        freight_forwarder_id: Number(ffId),
        warehouse_id: Number(form.warehouse_id),
        ba_ids: selectedBaIds,
        tax_ids: selectedTaxIds,
        bank_name: firstBa?.bank_name || "",
        bank_account_name: firstBa?.bank_account_name || "",
        bank_account_number: firstBa?.bank_account_number || "",
      });
      toast.success("Invoice berhasil dibuat"); onSaved();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Buat Invoice Warehouse" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Freight Forwarder</label>
            <select className="input" value={ffId} onChange={e => { setFfId(e.target.value); setForm(p => ({ ...p, warehouse_id: "" })); setSelectedBaIds([]); }}>
              <option value="">-- Pilih --</option>{ffs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>

          <div><label className="label">Warehouse</label>
            <select className="input" value={form.warehouse_id} onChange={e => { setForm(p => ({ ...p, warehouse_id: e.target.value })); setSelectedBaIds([]); }} disabled={!ffId}>
              <option value="">-- Pilih --</option>
              {warehouseGroups.map(wid => {
                const w = invoiceableBas.find(b => b.warehouse_id === wid)?.warehouse;
                return <option key={wid} value={wid}>{w?.name}</option>;
              })}
            </select></div>
        </div>

        {form.warehouse_id && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-left"><input type="checkbox" onChange={e => {
                        if (e.target.checked) setSelectedBaIds(filteredBas.map(b => b.id));
                        else setSelectedBaIds([]);
                      }} checked={selectedBaIds.length === filteredBas.length} /></th>
                      <th className="px-3 py-2 text-left">No. BA</th>
                      <th className="px-3 py-2 text-left">Tanggal</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBas.map(b => (
                      <tr key={b.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                        <td className="px-3 py-2"><input type="checkbox" checked={selectedBaIds.includes(b.id)} onChange={e => {
                          if (e.target.checked) setSelectedBaIds(p => [...p, b.id]);
                          else setSelectedBaIds(p => p.filter(id => id !== b.id));
                        }} /></td>
                        <td className="px-3 py-2">{b.ba_number}</td>
                        <td className="px-3 py-2">{formatDate(b.ba_date)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(b.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label font-bold text-white border-b border-slate-800 pb-1 mb-2">Informasi SPK & PO</label></div>
                <div className="col-span-2"><label className="label">Nama SPK</label><input className="input" value={form.spk_name} onChange={e => setForm(p => ({ ...p, spk_name: e.target.value }))} /></div>
                <div><label className="label">No. SPK</label><input className="input" value={form.spk_number} onChange={e => setForm(p => ({ ...p, spk_number: e.target.value }))} /></div>
                <div><label className="label">Tgl. SPK</label><input className="input" type="date" value={form.spk_date} onChange={e => setForm(p => ({ ...p, spk_date: e.target.value }))} /></div>
                <div className="col-span-2"><label className="label">No. PO </label><input className="input" value={form.po_number} onChange={e => setForm(p => ({ ...p, po_number: e.target.value }))} /></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800/40 p-4 rounded-lg space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Pajak (Tax)</p>
                {allTaxes.map(t => (
                  <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedTaxIds.includes(t.id)} onChange={e => {
                      if (e.target.checked) setSelectedTaxIds(p => p.includes(t.id) ? p : [...p, t.id]);
                      else setSelectedTaxIds(p => p.filter(id => id !== t.id));
                    }} />
                    <span className="text-sm text-slate-300">{t.name} ({t.value}{t.value_type === "PERCENTAGE" ? "%" : ""})</span>
                  </label>
                ))}
                <div className="pt-3 border-t border-slate-700 space-y-1">
                  <div className="flex justify-between text-xs text-slate-400"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-lg font-bold text-brand-400"><span>Total:</span><span>{formatCurrency(calculateGrandTotal())}</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Penandatangan & Bank</p>
                <div><label className="label text-[10px]">Tanggal Invoice</label><input className="input text-xs" type="date" value={form.invoice_date} onChange={e => setForm(p => ({ ...p, invoice_date: e.target.value }))} /></div>
                <div><label className="label text-[10px]">Nama Penandatangan</label><input className="input text-xs" value={form.signatory_name} onChange={e => setForm(p => ({ ...p, signatory_name: e.target.value }))} /></div>
                <div><label className="label text-[10px]">Jabatan</label><input className="input text-xs" value={form.signatory_position} onChange={e => setForm(p => ({ ...p, signatory_position: e.target.value }))} /></div>
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div><label className="label text-[10px]">Bank</label><input className="input text-xs bg-slate-900/50" readOnly value={firstBa?.bank_name || "-"} /></div>
                  <div><label className="label text-[10px]">SWIFT Code</label><input className="input text-xs" value={form.swift_code} onChange={e => setForm(p => ({ ...p, swift_code: e.target.value }))} placeholder="BMRIIDJA" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="label text-[10px]">Nama Rekening</label><input className="input text-xs bg-slate-900/50" readOnly value={firstBa?.bank_account_name || "-"} /></div>
                    <div><label className="label text-[10px]">No. Rekening</label><input className="input text-xs bg-slate-900/50" readOnly value={firstBa?.bank_account_number || "-"} /></div>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={saving || selectedBaIds.length === 0}>{saving ? "Memproses..." : "Buat Invoice"}</button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
