import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Dialog } from '@headlessui/react';


interface Dosen {
    id: number;
    nama_lengkap: string;
    gelar_depan?: string;
    gelar_belakang?: string;
    prodi?: string;
}

interface Kelas {
    id: number;
    kode_kelas: string;
    tingkat: number;
    tahun_masuk: string;
    mahasiswas_count: number;
    wali_dosen?: Dosen | null;
}

interface Props {
    kelas: Kelas[];
    dosen: Dosen[];
}


export default function AsesmenKelas({ kelas, dosen }: Props) {
    const { auth } = usePage().props as any;

    const roles = auth?.roles ?? [];

    const isAdmin = roles.includes('Admin Jurusan');
    const isKaprodi = roles.includes('Kaprodi');


    const [isOpen, setIsOpen] = useState(false);
    const [waliKelas, setWaliKelas] = useState<Kelas | null>(null);

    const { data, setData, post, reset, processing, errors } = useForm({
        kode_kelas: '',
        tahun_masuk: new Date().getFullYear().toString(),
    });

    const {
        data: waliData,
        setData: setWaliData,
        patch,
        processing: waliProcessing,
        errors: waliErrors,
    } = useForm({
        wali_dosen_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/asesmen/kelas', { onSuccess: () => { setIsOpen(false); reset(); } });
    };

    const handleDelete = (id: number, kode: string) => {
        if (confirm(`Hapus kelas ${kode}?`)) {
            router.delete(`/asesmen/kelas/${id}`);
        }
    };

    const handleAssignWali = (e: React.FormEvent) => {
        e.preventDefault();

        if (!waliKelas) return;

        patch(`/asesmen/kelas/${waliKelas.id}/wali`, {
            onSuccess: () => {
                setWaliKelas(null);
                setWaliData('wali_dosen_id', '');
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Kelas" />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="font-headline font-bold text-2xl text-gray-900">Manajemen Kelas</h2>
                    <p className="text-gray-500 text-sm mt-1">Kelola daftar kelas per prodi.</p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="bg-polman-primary hover:bg-polman-secondary text-white font-bold py-2.5 px-5 rounded-lg text-sm"
                    >
                        + Tambah Kelas
                    </button>
                )}

            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-polman-neutral">
                        <tr>
                            <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase text-xs">
                                Kode Kelas
                            </th>

                            <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase text-xs">
                                Tahun Masuk
                            </th>

                            <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase text-xs">
                                Tingkat Sekarang
                            </th>

                            <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase text-xs">
                                Wali Kelas
                            </th>

                            <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase text-xs">
                                Jml Mahasiswa
                            </th>

                            <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase text-xs">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {kelas.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada kelas.</td></tr>
                        ) : kelas.map(k => (
                            <tr key={k.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-polman-primary">{k.kode_kelas}</td>
                                <td className="px-6 py-4 text-gray-700">{k.tahun_masuk}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs font-bold">
                                        Tingkat {k.tingkat}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {k.wali_dosen ? (
                                        <div>
                                            <div className="font-semibold text-gray-800">
                                                {k.wali_dosen.gelar_depan
                                                    ? `${k.wali_dosen.gelar_depan} `
                                                    : ''}
                                                {k.wali_dosen.nama_lengkap}
                                                {k.wali_dosen.gelar_belakang
                                                    ? `, ${k.wali_dosen.gelar_belakang}`
                                                    : ''}
                                            </div>

                                            {k.wali_dosen.prodi && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {k.wali_dosen.prodi}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">
                                            Belum ditentukan
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-700">{k.mahasiswas_count} mahasiswa</td>
                                
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3">
                                        {isKaprodi && (
                                            <button
                                                onClick={() => {
                                                    setWaliKelas(k);
                                                    setWaliData(
                                                        'wali_dosen_id',
                                                        k.wali_dosen?.id?.toString() ?? ''
                                                    );
                                                }}
                                                className="text-polman-primary hover:text-polman-secondary font-semibold"
                                            >
                                                {k.wali_dosen ? 'Ganti Wali' : 'Pilih Wali'}
                                            </button>
                                        )}

                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDelete(k.id, k.kode_kelas)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Tambah Kelas */}
            <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <Dialog.Title className="font-bold text-xl text-gray-900 mb-4">Tambah Kelas Baru</Dialog.Title>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Kode Kelas</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm"
                                    placeholder="contoh: 1AEC1"
                                    value={data.kode_kelas}
                                    onChange={e => setData('kode_kelas', e.target.value)}
                                    required
                                />
                                {errors.kode_kelas && <p className="text-red-500 text-xs mt-1">{errors.kode_kelas}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tahun Masuk</label>
                                <input
                                    type="number"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm"
                                    placeholder="contoh: 2022"
                                    value={data.tahun_masuk}
                                    onChange={e => setData('tahun_masuk', e.target.value)}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Tingkat dihitung otomatis dari tahun masuk.</p>
                                {errors.tahun_masuk && <p className="text-red-500 text-xs mt-1">{errors.tahun_masuk}</p>}
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing} className="px-4 py-2 text-sm font-bold text-white bg-polman-primary hover:bg-polman-secondary rounded-lg disabled:opacity-50">
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Modal Pilih Wali Kelas */}
            <Dialog
                open={waliKelas !== null}
                onClose={() => setWaliKelas(null)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

                        <Dialog.Title className="font-bold text-xl text-gray-900 mb-2">
                            Pilih Wali Kelas
                        </Dialog.Title>

                        <p className="text-sm text-gray-500 mb-5">
                            Kelas:{' '}
                            <span className="font-bold text-gray-800">
                                {waliKelas?.kode_kelas}
                            </span>
                        </p>

                        <form onSubmit={handleAssignWali} className="space-y-4">

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Wali Kelas
                                </label>

                                <select
                                    value={waliData.wali_dosen_id}
                                    onChange={e =>
                                        setWaliData(
                                            'wali_dosen_id',
                                            e.target.value
                                        )
                                    }
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm"
                                >
                                    <option value="">
                                        -- Belum ada wali kelas --
                                    </option>

                                    {dosen.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.gelar_depan
                                                ? `${d.gelar_depan} `
                                                : ''}
                                            {d.nama_lengkap}
                                            {d.gelar_belakang
                                                ? `, ${d.gelar_belakang}`
                                                : ''}
                                        </option>
                                    ))}
                                </select>

                                {waliErrors.wali_dosen_id && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {waliErrors.wali_dosen_id}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">

                                <button
                                    type="button"
                                    onClick={() => setWaliKelas(null)}
                                    className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    disabled={waliProcessing}
                                    className="px-4 py-2 text-sm font-bold text-white bg-polman-primary hover:bg-polman-secondary rounded-lg disabled:opacity-50"
                                >
                                    {waliProcessing
                                        ? 'Menyimpan...'
                                        : 'Simpan Wali Kelas'}
                                </button>

                            </div>
                        </form>

                    </Dialog.Panel>
                </div>
            </Dialog>

        </AuthenticatedLayout>
    );
}