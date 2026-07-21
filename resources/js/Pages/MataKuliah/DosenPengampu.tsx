import React, { useState } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Dialog } from '@headlessui/react';

interface DosenBiodata {
    id: number;
    nama_lengkap: string;
    gelar_depan: string | null;
    gelar_belakang: string | null;
    nip: string | null;
    nidn: string | null;
    email: string;
    prodi: string;
    jabatan_akademik: string;
}

interface MataKuliah {
    id: number;
    kode_mk: string;
    nama_mk: string;
    sks: number;
}

interface Props {
    mataKuliah: MataKuliah;
    assignedDosen: DosenBiodata[];
    allDosen: DosenBiodata[];
}

const fullName = (d: DosenBiodata) =>
    [d.gelar_depan, d.nama_lengkap, d.gelar_belakang].filter(Boolean).join(' ');

export default function DosenPengampuPage({ mataKuliah, assignedDosen, allDosen }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');

    const { data, setData, post, processing, reset } = useForm({
        dosen_biodata_id: '' as string | number,
    });

    const assignedIds = new Set(assignedDosen.map(d => d.id));
    const availableDosen = allDosen.filter(d => !assignedIds.has(d.id));

    const filteredDosen = availableDosen.filter(d => {
        const q = search.toLowerCase();
        return (
            d.nama_lengkap.toLowerCase().includes(q) ||
            (d.nip ?? '').toLowerCase().includes(q) ||
            (d.nidn ?? '').toLowerCase().includes(q)
        );
    });

    const openModal = () => {
        reset();
        setSearch('');
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.dosen_biodata_id) return;
        post(`/mata-kuliah/${mataKuliah.id}/dosen-pengampu`, {
            onSuccess: () => setIsModalOpen(false),
        });
    };

    const handleDetach = (dosen: DosenBiodata) => {
        if (confirm(`Hapus ${fullName(dosen)} dari dosen pengampu ${mataKuliah.kode_mk}?`)) {
            router.delete(`/mata-kuliah/${mataKuliah.id}/dosen-pengampu/${dosen.id}`);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Dosen Pengampu - ${mataKuliah.kode_mk}`} />

            {/* HEADER */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 font-body relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-polman-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            {/* FIX: ganti Link jadi window.history.back() supaya
                                state halaman & pencarian di /mata-kuliah ke-restore */}
                            <button
                                onClick={() => window.history.back()}
                                className="text-gray-400 hover:text-polman-primary transition-colors flex items-center gap-1 text-sm font-bold"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Kembali
                            </button>
                            <span className="bg-polman-primary/10 text-polman-primary px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-polman-primary/20">
                                Kelola Dosen Pengampu
                            </span>
                        </div>
                        <h2 className="font-headline font-bold text-3xl text-gray-900 mb-1">{mataKuliah.nama_mk}</h2>
                        <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                            <span>Kode: <span className="text-gray-800">{mataKuliah.kode_mk}</span></span>
                            <span>Bobot: <span className="text-gray-800">{mataKuliah.sks} SKS</span></span>
                        </div>
                    </div>

                    <button
                        onClick={openModal}
                        className="bg-polman-primary hover:bg-polman-secondary text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                        + Tambah Dosen Pengampu
                    </button>
                </div>
            </div>

            {/* TABEL DOSEN PENGAMPU */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden font-body">
                <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Daftar Dosen Pengampu ({assignedDosen.length})</h3>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Nama Lengkap</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">NIP / NIDN</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Prodi</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Jabatan</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider w-24">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {assignedDosen.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">Belum ada dosen pengampu yang ditambahkan.</td></tr>
                        ) : (
                            assignedDosen.map((dosen) => (
                                <tr key={dosen.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{fullName(dosen)}</div>
                                        <div className="text-xs text-gray-500 mt-1">{dosen.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        <div className="font-mono">NIP: {dosen.nip || '-'}</div>
                                        <div className="font-mono text-xs text-gray-500">NIDN: {dosen.nidn || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{dosen.prodi}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{dosen.jabatan_akademik}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDetach(dosen)}
                                            className="text-red-500 hover:text-red-700 font-bold px-2 text-sm transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL TAMBAH DOSEN */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl font-body flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                            <Dialog.Title className="font-headline text-xl font-bold text-gray-900">
                                Tambah Dosen Pengampu
                            </Dialog.Title>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                                {/* Search */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Cari Dosen</label>
                                    <input
                                        type="text"
                                        placeholder="Ketik nama, NIP, atau NIDN..."
                                        className="w-full border-gray-300 rounded-lg text-sm"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>

                                {/* List pilihan */}
                                <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                                    {filteredDosen.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic p-4 text-center">
                                            {availableDosen.length === 0 ? 'Semua dosen sudah di-assign.' : 'Tidak ditemukan dosen yang cocok.'}
                                        </p>
                                    ) : (
                                        filteredDosen.map(dosen => (
                                            <label
                                                key={dosen.id}
                                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors ${
                                                    data.dosen_biodata_id === dosen.id ? 'bg-polman-primary/5 border-l-4 border-l-polman-primary' : ''
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="dosen_biodata_id"
                                                    className="w-4 h-4 text-polman-primary border-gray-300 focus:ring-polman-primary"
                                                    checked={data.dosen_biodata_id === dosen.id}
                                                    onChange={() => setData('dosen_biodata_id', dosen.id)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-gray-900 truncate">{fullName(dosen)}</div>
                                                    <div className="text-xs text-gray-500">NIP: {dosen.nip || '-'} | {dosen.prodi}</div>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-white shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.dosen_biodata_id}
                                    className="px-5 py-2.5 text-sm font-bold text-white bg-polman-primary hover:bg-polman-secondary rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                >
                                    {processing ? 'Menyimpan...' : 'Tambahkan'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </AuthenticatedLayout>
    );
}
