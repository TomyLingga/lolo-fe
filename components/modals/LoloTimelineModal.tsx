"use client";
import Modal from "@/components/ui/Modal";
import Timeline from "@/components/ui/Timeline";
import { formatDateTime } from "@/lib/utils";
import type { Registration } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  registration: Registration | null;
}

export default function LoloTimelineModal({ open, onClose, registration }: Props) {
  // Langsung ambil dari data registrasi, tidak perlu fetch API lagi
  const records = registration?.lolo_records || [];

  const items = records.map(r => ({
    id: r.id,
    title: r.operation_type === "LIFT_ON" ? "LIFT ON — Kontainer Keluar" : "LIFT OFF — Kontainer Masuk",
    datetime: formatDateTime(r.lolo_at),
    badge: r.operation_type,
    badgeColor: (r.operation_type === "LIFT_ON" ? "amber" : "blue") as "amber" | "blue",
    details: [
      { label: "Kendaraan", value: `${r.vehicle_type || "-"} / ${r.vehicle_number || "-"}` },
      { label: "Status", value: r.cargo_status?.description || "-" },
      ...(r.yard ? [{ label: "Yard", value: r.yard.name }] : []),
      ...(r.block ? [{ label: "Block", value: r.block.block_code }] : []),
      ...(r.pos_length ? [{ label: "Posisi", value: `L${r.pos_length} W${r.pos_width} H${r.pos_height}` }] : []),
      { 
        label: "Tarif", 
        value: r.tariff_price ? (
          <span className="text-emerald-400 font-medium">Rp {Number(r.tariff_price).toLocaleString('id-ID')}</span>
        ) : "-" 
      },
      { 
        label: "Operator", 
        value: r.created_by ? (
          <div className="flex flex-col gap-0.5 mt-0.5">
            <span className="text-slate-200 font-medium leading-none">{r.created_by.name}</span>
            {(r.created_by.jabatan || r.created_by.bagian) && (
              <span className="text-[10px] text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded w-fit mt-1">
                {r.created_by.jabatan}{r.created_by.jabatan && r.created_by.bagian ? ' • ' : ''}{r.created_by.bagian}
              </span>
            )}
          </div>
        ) : "-" 
      },
    ],
  }));

  return (
    <Modal open={open} onClose={onClose} title="Riwayat LOLO" size="md">
      {records.length === 0 ? (
        <p className="text-center text-slate-500 py-8">Belum ada riwayat LOLO</p>
      ) : (
        <Timeline items={items} />
      )}
    </Modal>
  );
}