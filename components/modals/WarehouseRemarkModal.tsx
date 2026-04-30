"use client";
import { useState, useEffect, useCallback } from "react";
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

  const fetchRemarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await warehouseRegistrationsApi.getRemarks(registration!.id);
      setRemarks(res.data.data || []);
    } catch (err) {
      toast.error("Gagal memuat catatan");
    } finally {
      setLoading(false);
    }
  }, [registration]);

  useEffect(() => {
    if (open && registration) {
      fetchRemarks();
    }
  }, [open, registration, fetchRemarks]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newRemark.trim()) return;
    setSaving(true);
    try {
      await warehouseRegistrationsApi.addRemark(registration!.id, newRemark);
      setNewRemark("");
      fetchRemarks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Riwayat Catatan Warehouse" size="md">
      <div className="p-4 space-y-4">
        {!readOnly && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <textarea className="input" rows={2} placeholder="Tambah catatan baru..." value={newRemark} onChange={e => setNewRemark(e.target.value)} />
            <div className="flex justify-end">
              <button type="submit" className="btn btn-sm btn-primary" disabled={saving || !newRemark.trim()}>
                {saving ? "Menyimpan..." : "Kirim Catatan"}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
          {loading ? <p className="text-center text-slate-500 py-4">Memuat...</p> : 
           remarks.length === 0 ? <p className="text-center text-slate-600 py-4">Belum ada catatan</p> :
           remarks.map(r => (
            <div key={r.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>{r.user?.name}</span>
                <span>{formatDateTime(r.created_at)}</span>
              </div>
              <p className="text-sm text-slate-200">{r.remark}</p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
