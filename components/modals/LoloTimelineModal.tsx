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