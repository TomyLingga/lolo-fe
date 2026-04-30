"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { warehouseRegistrationsApi } from "@/lib/api";
import { formatDateTime, getErrorMessage } from "@/lib/utils";
import toast from "react-hot-toast";
import type { WarehouseRegistration } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  registration: WarehouseRegistration | null;
  readOnly?: boolean;
}

export default function WarehouseRemarkModal({ open, onClose, registration, readOnly }: Props) {
  const [remarks, setRemarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRemark, setNewRemark] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchRemarks() {
    if (!registration) return;
    setLoading(true);
    try {
      const res = await warehouseRegistrationsApi.getRemarks(registration.id);
      setRemarks(res.data.data || []);
    } catch { toast.error("Gagal memuat catatan"); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (open) { fetchRemarks(); setNewRemark(""); } }, [open, registration]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!newRemark.trim() || !registration) return;
    setSaving(true);
    try {
      await warehouseRegistrationsApi.addRemark(registration.id, newRemark);
      setNewRemark(""); fetchRemarks();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Catatan Sewa Warehouse" size="md">
      <div className="space-y-4">
        <div className="max-h-[300px] overflow-y-auto space-y-3 p-1">
          {loading ? <p className="text-center text-slate-500 py-4">Memuat...</p>
          : remarks.length === 0 ? <p className="text-center text-slate-500 py-4">Belum ada catatan</p>
          : remarks.map((r, i) => (
            <div key={i} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-semibold text-brand-400">{r.created_by?.name || "User"}</span>
                <span className="text-[10px] text-slate-500">{formatDateTime(r.created_at)}</span>
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{r.remark}</p>
            </div>
          ))}
        </div>

        {!readOnly && (
          <form onSubmit={handleSubmit} className="border-t border-slate-800 pt-4">
            <textarea className="input mb-2" rows={2} placeholder="Tambah catatan baru..." required value={newRemark} onChange={e => setNewRemark(e.target.value)} />
            <div className="flex justify-end">
              <button type="submit" className="btn-primary btn-sm" disabled={saving}>{saving ? "Menambah..." : "Tambah Catatan"}</button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
