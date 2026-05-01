"use client";
import { useState, useEffect, useCallback } from "react";
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
  const [chambers, setChambers] = useState<WarehouseChamber[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    freight_forwarder_id: "",
    warehouse_id: "",
    chamber_id: "",
    rent_start: "",
    rent_end: "",
    remark: ""
  });

  useEffect(() => {
    if (open) {
      loadMaster();
      if (registration) {
        setFormData({
          freight_forwarder_id: registration.freight_forwarder_id.toString(),
          warehouse_id: registration.chamber?.warehouse_id.toString() || "",
          chamber_id: registration.chamber_id.toString(),
          rent_start: registration.rent_start.split("T")[0],
          rent_end: registration.rent_end.split("T")[0],
          remark: registration.remark || ""
        });
      } else {
        setFormData({
          freight_forwarder_id: "",
          warehouse_id: "",
          chamber_id: "",
          rent_start: "",
          rent_end: "",
          remark: ""
        });
      }
    }
  }, [open, registration]);

  const loadAvailableChambers = useCallback(async () => {
    try {
      const res = await warehouseRegistrationsApi.getAvailableChambers({
        warehouse_id: parseInt(formData.warehouse_id),
        rent_start: formData.rent_start,
        rent_end: formData.rent_end
      });
      setChambers(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [formData.warehouse_id, formData.rent_start, formData.rent_end]);

  useEffect(() => {
    if (formData.warehouse_id) {
      loadAvailableChambers();
    } else {
      setChambers([]);
    }
  }, [formData.warehouse_id, formData.rent_start, formData.rent_end, loadAvailableChambers]);

  async function loadMaster() {
    setLoading(true);
    try {
      const [ffRes, whRes] = await Promise.all([
        freightForwardersApi.getAll(),
        warehousesApi.getAll()
      ]);
      setFfs(ffRes.data.data || []);
      setWarehouses(whRes.data.data || []);
    } catch (err) {
      toast.error("Gagal memuat data master");
    } finally {
      setLoading(false);
    }
  }



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        freight_forwarder_id: parseInt(formData.freight_forwarder_id),
        chamber_id: parseInt(formData.chamber_id),
      };
      if (registration) {
        await warehouseRegistrationsApi.update(registration.id, payload);
        toast.success("Registrasi diperbarui");
      } else {
        await warehouseRegistrationsApi.create(payload);
        toast.success("Registrasi berhasil");
      }
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={registration ? "Edit Registrasi Warehouse" : "Tambah Registrasi Warehouse"} size="lg">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Freight Forwarder <span className="text-red-400">*</span></label>
            <select className="input" required value={formData.freight_forwarder_id} onChange={e => setFormData({ ...formData, freight_forwarder_id: e.target.value })}>
              <option value="">Pilih FF</option>
              {ffs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Warehouse <span className="text-red-400">*</span></label>
            <select className="input" required value={formData.warehouse_id} onChange={e => setFormData({ ...formData, warehouse_id: e.target.value, chamber_id: "" })}>
              <option value="">Pilih Warehouse</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Mulai Sewa <span className="text-red-400">*</span></label>
            <input type="date" className="input" required value={formData.rent_start} onChange={e => setFormData({ ...formData, rent_start: e.target.value })} />
          </div>
          <div>
            <label className="label">Selesai Sewa <span className="text-red-400">*</span></label>
            <input type="date" className="input" required value={formData.rent_end} onChange={e => setFormData({ ...formData, rent_end: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Chamber <span className="text-red-400">*</span></label>
            <select 
              className="input" 
              required 
              value={formData.chamber_id} 
              onChange={e => setFormData({ ...formData, chamber_id: e.target.value })} 
              disabled={!formData.warehouse_id || (chambers.length === 0 && !loading)}
            >
              <option value="">{loading ? "Memuat chamber..." : chambers.length === 0 ? "Tidak ada chamber tersedia" : "Pilih Chamber"}</option>
              {chambers.map(c => (
                <option key={c.id} value={c.id} disabled={!c.is_available}>
                  {c.code} {c.name ? `- ${c.name}` : ""} {!c.is_available ? "(Terpakai/Booking)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Remark</label>
            <textarea className="input" rows={2} value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} placeholder="Catatan tambahan..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </form>
    </Modal>
  );
}
