import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface DosenBiodata {
    id: number;
    nama_lengkap: string;
    gelar_depan: string | null;
    gelar_belakang: string | null;
    nip: string;
    nidn: string;
    email: string;
    no_hp: string | null;
    prodi: string;
    jabatan_akademik: string;
    // FIX: field baru, terpisah dari jabatan_akademik
    jabatan_struktural: string | null;
    bidang_keahlian: string | null;
    alamat: string | null;
    user?: {
        id: number;
        email: string;
        dosen_biodata_id: number;
    } | null;
}

const initialForm = {
    nama_lengkap: '',
    gelar_depan: '',
    gelar_belakang: '',
    nip: '',
    nidn: '',
    email: '',
    no_hp: '',
    prodi: 'Teknologi Rekayasa Informatika Industri',
    jabatan_akademik: '',
    // FIX: default kosong, karena kebanyakan dosen tidak menjabat
    // posisi struktural apapun
    jabatan_struktural: '',
    bidang_keahlian: '',
    alamat: '',
};

// FIX: daftar pilihan jabatan struktural yang umum di lingkungan
// jurusan/prodi. Dibuat dropdown supaya penulisannya konsisten
// (menghindari typo seperti "kaprodi" huruf kecil, "Ka Prodi", dst
// yang bikin pencarian di RpsController tidak ketemu).
const JABATAN_STRUKTURAL_OPTIONS = ['', 'Kaprodi', 'Kajur', 'Sekretaris Jurusan'];

export default function DosenBiodataPage({ biodatas }: { biodatas: DosenBiodata[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const { data, setData, post, patch, reset, processing, errors, clearErrors } = useForm(initialForm);
    const biodataError = (errors as Record<string, string | undefined>).biodata;
    const { roles } = usePage().props.auth as any;
    const isKaprodi = roles?.includes('Kaprodi');

    const fullName = (biodata: Pick<DosenBiodata, 'gelar_depan' | 'nama_lengkap' | 'gelar_belakang'>) => {
        return [biodata.gelar_depan, biodata.nama_lengkap, biodata.gelar_belakang].filter(Boolean).join(' ');
    };

    const openAddModal = () => {
        setModalMode('add');
        setSelectedId(null);
        clearErrors();
        reset();
        setData(initialForm);
        setIsModalOpen(true);
    };

    const openEditModal = (biodata: DosenBiodata) => {
        setModalMode('edit');
        setSelectedId(biodata.id);
        clearErrors();
        setData({
            nama_lengkap: biodata.nama_lengkap,
            gelar_depan: biodata.gelar_depan || '',
            gelar_belakang: biodata.gelar_belakang || '',
            nip: biodata.nip,
            nidn: biodata.nidn,
            email: biodata.email,
            no_hp: biodata.no_hp || '',
            prodi: biodata.prodi,
            jabatan_akademik: biodata.jabatan_akademik,
            jabatan_struktural: biodata.jabatan_struktural || '',
            bidang_keahlian: biodata.bidang_keahlian || '',
            alamat: biodata.alamat || '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = (biodata: DosenBiodata) => {
        const namaLengkap = fullName(biodata);
        const pesanKonfirmasi = biodata.user
            ? `Hapus biodata dan akun login milik ${namaLengkap}? Dosen tidak akan bisa login lagi.`
            : `Hapus biodata ${namaLengkap}?`;

        if (confirm(pesanKonfirmasi)) {
            router.delete(route('biodata-dosen.destroy', biodata.id));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (modalMode === 'add') {
            post(route('biodata-dosen.store'), { onSuccess: () => setIsModalOpen(false) });
            return;
        }
        if (selectedId) {
            patch(route('biodata-dosen.update', selectedId), { onSuccess: () => setIsModalOpen(false) });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Biodata Dosen" />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="font-headline font-bold text-2xl text-gray-900">Biodata Dosen</h2>
                    <p className="text-gray-500 text-sm font-body mt-1">
                        {isKaprodi
                            ? 'Daftar biodata dosen yang telah mendaftar dan melengkapi profil mereka.'
                            : 'Data biodata dosen prodi.'}
                    </p>
                </div>
                {isKaprodi && (
                    <button onClick={openAddModal} className="bg-polman-primary hover:bg-polman-secondary text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors">
                        + Tambah Biodata
                    </button>
                )}
            </div>

            {biodataError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {biodataError}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden font-body">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Nama</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">NIP/NIDN</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Prodi</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Jabatan</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Status Akun</th>
                                {isKaprodi && <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {biodatas.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-400">
                                        Belum ada biodata dosen.
                                    </td>
                                </tr>
                            ) : biodatas.map((biodata) => (
                                <tr key={biodata.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{fullName(biodata)}</div>
                                        <div className="text-xs text-gray-500 mt-1">{biodata.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        <div className="font-mono">NIP: {biodata.nip}</div>
                                        <div className="font-mono text-xs text-gray-500">NIDN: {biodata.nidn}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{biodata.prodi}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {/* FIX: tampilkan dua jabatan sekaligus kalau ada.
                                            Contoh: "Lektor · Kaprodi" bukan cuma salah satu doang. */}
                                        <div className="font-semibold flex items-center gap-1.5 flex-wrap">
                                            <span>{biodata.jabatan_akademik}</span>
                                            {biodata.jabatan_struktural && (
                                                <span className="bg-polman-primary/10 text-polman-primary px-2 py-0.5 rounded-full text-xs font-bold">
                                                    {biodata.jabatan_struktural}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">{biodata.bidang_keahlian || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${biodata.user ? 'bg-green-50 text-green-600 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                            {biodata.user ? 'Sudah Ada Akun' : 'Belum Ada Akun'}
                                        </span>
                                    </td>
                                    {isKaprodi && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => openEditModal(biodata)}
                                                    className="text-blue-600 hover:text-blue-800 font-bold px-2 text-sm transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(biodata)}
                                                    className="text-red-500 hover:text-red-700 font-bold px-2 text-sm transition-colors"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white p-6 rounded-2xl w-full max-w-3xl shadow-2xl font-body overflow-y-auto max-h-[90vh]">
                        <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                            {modalMode === 'add' ? 'Tambah Biodata Dosen' : 'Edit Biodata Dosen'}
                        </Dialog.Title>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Gelar Depan" value={data.gelar_depan} onChange={(value) => setData('gelar_depan', value)} />
                                <Field label="Nama Lengkap" required value={data.nama_lengkap} error={errors.nama_lengkap} onChange={(value) => setData('nama_lengkap', value)} />
                                <Field label="Gelar Belakang" value={data.gelar_belakang} onChange={(value) => setData('gelar_belakang', value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="NIP" required value={data.nip} error={errors.nip} onChange={(value) => setData('nip', value)} />
                                <Field label="NIDN" required value={data.nidn} error={errors.nidn} onChange={(value) => setData('nidn', value)} />
                                <Field label="Email" type="email" required value={data.email} error={errors.email} onChange={(value) => setData('email', value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="No HP" value={data.no_hp} onChange={(value) => setData('no_hp', value)} />
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Prodi <span className="text-red-500">*</span>
                                    </label>
                                    <select className="w-full border-gray-300 rounded-lg text-sm" value={data.prodi} onChange={e => setData('prodi', e.target.value)} required>
                                        <option value="Teknologi Rekayasa Informatika Industri">Teknologi Rekayasa Informatika Industri</option>
                                        <option value="Teknologi Rekayasa Otomasi">Teknologi Rekayasa Otomasi</option>
                                        <option value="Teknologi Rekayasa Mekatronika">Teknologi Rekayasa Mekatronika</option>
                                        <option value="Teknologi Rekayasa Sistem Aerial Nirawak">Teknologi Rekayasa Sistem Aerial Nirawak</option>
                                    </select>
                                    {errors.prodi && <p className="text-red-500 text-xs mt-1">{errors.prodi}</p>}
                                </div>
                                <Field label="Jabatan Akademik" required value={data.jabatan_akademik} error={errors.jabatan_akademik} onChange={(value) => setData('jabatan_akademik', value)} />
                            </div>

                            {/* FIX: field baru untuk jabatan struktural, terpisah dari
                                jabatan akademik. Pakai dropdown biar penulisannya
                                konsisten dan gampang dicari sistem (Kaprodi/Kajur). */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Jabatan Struktural
                                        <span className="text-xs font-normal text-gray-400 ml-1">(opsional)</span>
                                    </label>
                                    <select
                                        className="w-full border-gray-300 rounded-lg text-sm"
                                        value={data.jabatan_struktural}
                                        onChange={e => setData('jabatan_struktural', e.target.value)}
                                    >
                                        {JABATAN_STRUKTURAL_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>{opt === '' ? '- Tidak Ada -' : opt}</option>
                                        ))}
                                    </select>
                                    {errors.jabatan_struktural && <p className="text-red-500 text-xs mt-1">{errors.jabatan_struktural}</p>}
                                    <p className="text-xs text-gray-400 mt-1">
                                        Isi kalau dosen ini sekaligus menjabat posisi struktural, misalnya Kaprodi atau Kajur.
                                    </p>
                                </div>
                            </div>

                            <TextArea label="Bidang Keahlian" value={data.bidang_keahlian} onChange={(value) => setData('bidang_keahlian', value)} />
                            <TextArea label="Alamat" value={data.alamat} onChange={(value) => setData('alamat', value)} />
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">
                                    Batal
                                </button>
                                <button type="submit" className="bg-polman-primary hover:bg-polman-secondary text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm" disabled={processing}>
                                    {processing ? 'Menyimpan...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </AuthenticatedLayout>
    );
}

function Field({ label, value, onChange, type = 'text', required = false, error }: {
    label: string; value: string; onChange: (value: string) => void;
    type?: string; required?: boolean; error?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input type={type} className="w-full border-gray-300 rounded-lg text-sm" value={value} onChange={e => onChange(e.target.value)} required={required} />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
            <textarea rows={2} className="w-full border-gray-300 rounded-lg text-sm" value={value} onChange={e => onChange(e.target.value)} />
        </div>
    );
}
