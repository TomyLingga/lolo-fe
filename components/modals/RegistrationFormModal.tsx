"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { registrationsApi, yardsApi, blocksApi, freightForwardersApi, containerSizesApi, containerTypesApi, cargoStatusesApi, packagesApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Registration, Yard, Block, FreightForwarder, ContainerSize, ContainerType, CargoStatus, Package } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  registration?: Registration | null;
  isAdmin: boolean;
}

const FormWrapper = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="label">{label}{req && <span className="text-red-400"> *</span>}</label>
    {children}
  </div>
);

export default function RegistrationFormModal({ open, onClose, onSaved, registration, isAdmin }: Props) {
  const editing = !!registration;
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [yards, setYards] = useState<Yard[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [ffs, setFfs] = useState<FreightForwarder[]>([]);
  const [sizes, setSizes] = useState<ContainerSize[]>([]);
  const [types, setTypes] = useState<ContainerType[]>([]);
  const [statuses, setStatuses] = useState<CargoStatus[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);

  const [form, setForm] = useState({
    freight_forwarder_id: "", package_id: "", container_number: "", container_size_id: "",
    container_type_id: "", cargo_status_id: "", no_do_jo: "", shipper_tenant: "",
    vehicle_type: "", vehicle_number: "", remark: "",
    lolo_at: "", yard_id: "", block_id: "", pos_length: "", pos_width: "", pos_height: "", moved_at: "",
  });

  // Load master data (excluding blocks — loaded on yard select)
  useEffect(() => {
    if (!open) return;
    setInitLoading(true);
    Promise.all([
      yardsApi.getAll(),
      freightForwardersApi.getAll(),
      containerSizesApi.getAll(),
      containerTypesApi.getAll(),
      cargoStatusesApi.getAll(),
      packagesApi.getAll(),
    ]).then(([y, f, s, t, c, p]) => {
        setYards(y.data.data.filter((x: any) => x.is_active));
        setFfs(f.data.data.filter((x: any) => x.is_active));
        setSizes(s.data.data.filter((x: any) => x.is_active));
        setTypes(t.data.data.filter((x: any) => x.is_active));
        setStatuses(c.data.data.filter((x: any) => x.is_active));
        setPackages(p.data.data.filter((x: any) => x.is_active));

        // Set form after options are loaded
        if (editing && registration) {
          setForm({
            freight_forwarder_id: String(registration.freight_forwarder_id),
            package_id: String((registration as any).package_id || ""),
            container_number: registration.container_number,
            container_size_id: String(registration.container_size_id),
            container_type_id: String(registration.container_type_id),
            cargo_status_id: String(registration.cargo_status_id),
            no_do_jo: registration.no_do_jo || "",
            shipper_tenant: registration.shipper_tenant || "",
            vehicle_type: "", vehicle_number: "", remark: "",
            lolo_at: "", yard_id: "", block_id: "", pos_length: "", pos_width: "", pos_height: "", moved_at: "",
          });
        } else {
          setForm({
            freight_forwarder_id: "", package_id: "", container_number: "", container_size_id: "", container_type_id: "",
            cargo_status_id: "", no_do_jo: "", shipper_tenant: "", vehicle_type: "", vehicle_number: "",
            remark: "", lolo_at: "", yard_id: "", block_id: "", pos_length: "", pos_width: "", pos_height: "", moved_at: "",
          });
          setBlocks([]);
        }
      })
      .finally(() => setInitLoading(false));
  }, [open, editing, registration]);

  // Load blocks when yard changes
  async function handleYardChange(yardId: string) {
    setForm(p => ({ ...p, yard_id: yardId, block_id: "" }));
    setBlocks([]);
    if (!yardId) return;
    setBlocksLoading(true);
    try {
      const res = await blocksApi.getAll();
      const filtered = res.data.data.filter((b: any) => b.is_active && String(b.yard_id) === yardId);
      setBlocks(filtered);
    } catch {
      toast.error("Gagal memuat blok");
    } finally {
      setBlocksLoading(false);
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await registrationsApi.update(registration!.id, {
          no_do_jo: form.no_do_jo, shipper_tenant: form.shipper_tenant,
        });
      } else {
        await registrationsApi.create({
          freight_forwarder_id: Number(form.freight_forwarder_id),
          package_id: Number(form.package_id),
          container_number: form.container_number,
          container_size_id: Number(form.container_size_id),
          container_type_id: Number(form.container_type_id),
          cargo_status_id: Number(form.cargo_status_id),
          no_do_jo: form.no_do_jo, shipper_tenant: form.shipper_tenant,
          vehicle_type: form.vehicle_type, vehicle_number: form.vehicle_number,
          remark: form.remark,
          lolo_at: form.lolo_at,
          yard_id: Number(form.yard_id), block_id: Number(form.block_id),
          pos_length: Number(form.pos_length), pos_width: Number(form.pos_width), pos_height: Number(form.pos_height),
          moved_at: form.moved_at,
        });
      }
      toast.success(editing ? "Registrasi diperbarui" : "Registrasi berhasil dibuat");
      onSaved();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Registrasi" : "Tambah Registrasi"} size="xl">
      {initLoading ? (
        <div className="py-12 text-center text-slate-400">
          <svg className="animate-spin w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p>Memuat data form...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Container info */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Informasi Kontainer</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormWrapper label="Freight Forwarder" req>
                <select className="input" required value={form.freight_forwarder_id} onChange={set("freight_forwarder_id")} disabled={editing}>
                  <option value="">-- Pilih FF --</option>
                  {ffs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </FormWrapper>
              <FormWrapper label="Paket" req>
                <select className="input" required value={form.package_id} onChange={set("package_id")} disabled={editing}>
                  <option value="">-- Pilih Paket --</option>
                  {packages.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                </select>
              </FormWrapper>
              <FormWrapper label="No. Container" req>
                <input className="input" required value={form.container_number} onChange={set("container_number")}
                  placeholder="ABCU1234567" maxLength={20} disabled={editing} />
              </FormWrapper>
              <FormWrapper label="Ukuran Container" req>
                <select className="input" required value={form.container_size_id} onChange={set("container_size_id")} disabled={editing}>
                  <option value="">-- Pilih --</option>
                  {sizes.map(s => <option key={s.id} value={s.id}>{s.code} - {s.description}</option>)}
                </select>
              </FormWrapper>
              <FormWrapper label="Tipe Container" req>
                <select className="input" required value={form.container_type_id} onChange={set("container_type_id")} disabled={editing}>
                  <option value="">-- Pilih --</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.code} - {t.description}</option>)}
                </select>
              </FormWrapper>
              <FormWrapper label="Status Kargo" req>
                <select className="input" required value={form.cargo_status_id} onChange={set("cargo_status_id")} disabled={editing}>
                  <option value="">-- Pilih --</option>
                  {statuses.map(s => <option key={s.id} value={s.id}>{s.code} - {s.description}</option>)}
                </select>
              </FormWrapper>
              <FormWrapper label="No. DO/JO">
                <input className="input" value={form.no_do_jo} onChange={set("no_do_jo")} placeholder="DO/2026/01/001" />
              </FormWrapper>
              <FormWrapper label="Shipper/Tenant">
                <input className="input" value={form.shipper_tenant} onChange={set("shipper_tenant")} placeholder="PT. ..." />
              </FormWrapper>
            </div>
          </div>

          {!editing && (
            <>
              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Info Kendaraan &amp; LOLO Awal</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormWrapper label="Jenis Kendaraan" req>
                    <input className="input" required value={form.vehicle_type} onChange={set("vehicle_type")} placeholder="Truk / Kereta Api" />
                  </FormWrapper>
                  <FormWrapper label="No. Kendaraan" req>
                    <input className="input" required value={form.vehicle_number} onChange={set("vehicle_number")} placeholder="BK 1234 AB" />
                  </FormWrapper>
                  <FormWrapper label="Waktu LOLO" req>
                    <input className="input" type="datetime-local" required value={form.lolo_at} onChange={set("lolo_at")} />
                  </FormWrapper>
                  <FormWrapper label="Catatan Awal">
                    <input className="input" value={form.remark} onChange={set("remark")} />
                  </FormWrapper>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Posisi Awal Kontainer</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Yard — select first */}
                  <FormWrapper label="Yard" req>
                    <select className="input" required value={form.yard_id}
                      onChange={e => handleYardChange(e.target.value)}>
                      <option value="">-- Pilih Yard --</option>
                      {yards.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                  </FormWrapper>

                  {/* Block — disabled until yard selected */}
                  <FormWrapper label="Block" req>
                    <div className="relative">
                      <select className="input" required value={form.block_id} onChange={set("block_id")}
                        disabled={!form.yard_id || blocksLoading}>
                        <option value="">
                          {!form.yard_id ? "— Pilih yard dulu —" : blocksLoading ? "Memuat blok…" : "-- Pilih Block --"}
                        </option>
                        {blocks.map(b => <option key={b.id} value={b.id}>{b.block_code}</option>)}
                      </select>
                      {blocksLoading && (
                        <svg className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400 pointer-events-none"
                          fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                    </div>
                  </FormWrapper>

                  <FormWrapper label="Posisi Length" req><input className="input" type="number" required min={1} value={form.pos_length} onChange={set("pos_length")} /></FormWrapper>
                  <FormWrapper label="Posisi Width" req><input className="input" type="number" required min={1} value={form.pos_width} onChange={set("pos_width")} /></FormWrapper>
                  <FormWrapper label="Posisi Height" req><input className="input" type="number" required min={1} value={form.pos_height} onChange={set("pos_height")} /></FormWrapper>
                  <FormWrapper label="Waktu Penempatan" req>
                    <input className="input" type="datetime-local" required value={form.moved_at} onChange={set("moved_at")} />
                  </FormWrapper>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Registrasi"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}