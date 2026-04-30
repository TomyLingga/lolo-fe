"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { freightForwardersApi, warehousesApi, warehouseRegistrationsApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import toast from "react-hot-toast";
import type { WarehouseRegistration, FreightForwarder, Warehouse, WarehouseChamber } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  registration: WarehouseRegistration | null;
  onSaved: () => void;
}

export default function WarehouseRegistrationFormModal({ open, onClose, registration, onSaved }: Props) {
  const [ffs, setFfs] = useState<FreightForwarder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [availableChambers, setAvailableChambers] = useState<WarehouseChamber[]>([]);
  const [loadingChambers, setLoadingChambers] = useState(false);

  const [form, setForm] = useState({
    freight_forwarder_id: "",
    warehouse_id: "",
    chamber_id: "",
    rent_start: "",
    rent_end: "",
    remark: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      Promise.all([freightForwardersApi.getAll(), warehousesApi.getAll()])
        .then(([f, w]) => { setFfs(f.data.data); setWarehouses(w.data.data); })
        .catch(() => {});
      
      if (registration) {
        setForm({
          freight_forwarder_id: String(registration.freight_forwarder_id),
          warehouse_id: String(registration.chamber?.warehouse_id || ""),
          chamber_id: String(registration.chamber_id),
          rent_start: registration.rent_start?.slice(0, 10) || "",
          rent_end: registration.rent_end?.slice(0, 10) || "",
          remark: ""
        });
      } else {
        setForm({ freight_forwarder_id: "", warehouse_id: "", chamber_id: "", rent_start: "", rent_end: "", remark: "" });
      }
    }
  }, [open, registration]);

  useEffect(() => {
    if (form.warehouse_id && form.rent_start && form.rent_end) {
      setLoadingChambers(true);
      warehouseRegistrationsApi.getAvailableChambers({
        warehouse_id: Number(form.warehouse_id),
        rent_start: form.rent_start,
        rent_end: form.rent_end
      }).then(res => {
        setAvailableChambers(res.data.data);
        // If editing and the current chamber is not in available list (because it's occupied by itself), we might need to add it manually or the API might already handle it.
        // The API I saw doesn't take 'exclude_id' for available chambers list, but let's see.
      }).finally(() => setLoadingChambers(false));
    } else {
      setAvailableChambers([]);
    }
  }, [form.warehouse_id, form.rent_start, form.rent_end]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (registration) {
        await warehouseRegistrationsApi.update(registration.id, {
          rent_start: form.rent_start,
          rent_end: form.rent_end
        });
      } else {
        await warehouseRegistrationsApi.create({
          freight_forwarder_id: Number(form.freight_forwarder_id),
          chamber_id: Number(form.chamber_id),
          rent_start: form.rent_start,
          rent_end: form.rent_end,
          remark: form.remark
        });
      }
      toast.success(registration ? "Sewa diperbarui" : "Sewa dibuat"); onSaved();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={registration ? "Edit Sewa" : "Tambah Sewa"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={cn(registration && "opacity-50 pointer-events-none")}>
            <label className="label">Freight Forwarder <span className="text-red-400">*</span></label>
            <select className="input" required value={form.freight_forwarder_id} onChange={e => setForm(p => ({ ...p, freight_forwarder_id: e.target.value }))}>
              <option value="">-- Pilih --</option>{ffs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className={cn(registration && "opacity-50 pointer-events-none")}>
            <label className="label">Warehouse <span className="text-red-400">*</span></label>
            <select className="input" required value={form.warehouse_id} onChange={e => setForm(p => ({ ...p, warehouse_id: e.target.value }))}>
              <option value="">-- Pilih --</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div><label className="label">Mulai Sewa <span className="text-red-400">*</span></label>
            <input className="input" type="date" required value={form.rent_start} onChange={e => setForm(p => ({ ...p, rent_start: e.target.value }))} /></div>
          <div><label className="label">Selesai Sewa <span className="text-red-400">*</span></label>
            <input className="input" type="date" required value={form.rent_end} onChange={e => setForm(p => ({ ...p, rent_end: e.target.value }))} /></div>
          <div className={cn("sm:col-span-2", registration && "opacity-50 pointer-events-none")}>
            <label className="label">Chamber <span className="text-red-400">*</span> {loadingChambers && <span className="text-xs text-slate-500 ml-2 animate-pulse">Mengecek ketersediaan...</span>}</label>
            <select className="input" required value={form.chamber_id} onChange={e => setForm(p => ({ ...p, chamber_id: e.target.value }))}>
              <option value="">-- Pilih --</option>
              {availableChambers.map(c => (
                <option key={c.id} value={c.id} disabled={!(c as any).is_available && c.id !== registration?.chamber_id}>
                  {c.code} - {c.name || "No name"} {!(c as any).is_available && c.id !== registration?.chamber_id ? "(Penuh)" : ""}
                </option>
              ))}
            </select>
          </div>
          {!registration && (
            <div className="sm:col-span-2"><label className="label">Catatan Awal</label>
              <textarea className="input" rows={2} value={form.remark} onChange={e => setForm(p => ({ ...p, remark: e.target.value }))} placeholder="Optional..." /></div>
          )}
        </div>
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
          <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </form>
    </Modal>
  );
}

function cn(...classes: any[]) { return classes.filter(Boolean).join(" "); }
