import React, { useState } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Dialog } from '@headlessui/react';

// --- Tipe Data ---
interface IndikatorKinerja {
    id: number;
    kode: string;
    deskripsi: string;
}

interface Cpl {
    id: number;
    kode: string;
    deskripsi: string;
    indikator_kinerjas?: IndikatorKinerja[];
}

interface Cpmk {
    id: number;
    kode_cpmk: string;
    mata_kuliah_id: number;
    deskripsi: string;
    indikator_kinerjas?: IndikatorKinerja[];
}

interface MataKuliah {
    id: number;
    kode_mk: string;
    nama_mk: string;
    sks: number;
    cpls?: Cpl[];
}

interface Props {
    mataKuliah: MataKuliah;
    existingCpmks: Cpmk[];
}

// FIX: dulu cuma nangani kode berformat angka ("CPL-08", "CPL-09").
// Sekarang dibuat lebih fleksibel pakai localeCompare bawaan JavaScript
// dengan opsi { numeric: true }, yang bisa ngurutin dua-duanya sekaligus:
// - Kode angka: "CPL-2" tetap di depan "CPL-10" (bukan diurutin per-karakter)
// - Kode huruf: "CPL-A" di depan "CPL-B" secara alfabetis
// Jadi kalau suatu saat format kode CPL diganti dari angka ke huruf
// (atau campur), fungsi ini tetap jalan tanpa perlu diubah lagi.
const sortByKode = <T extends { kode: string }>(items: T[]): T[] => {
    return [...items].sort((a, b) =>
        a.kode.localeCompare(b.kode, undefined, { numeric: true, sensitivity: 'base' })
    );
};

export default function CpmkPage({ mataKuliah, existingCpmks }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const { data, setData, post, patch, reset, processing, errors, clearErrors } = useForm({
        mata_kuliah_id: mataKuliah.id,
        kode_cpmk: '',
        deskripsi: '',
        indikator_ids: [] as number[],
    });

    const openAddModal = () => {
        const nextNumber = existingCpmks ? existingCpmks.length + 1 : 1;
        setModalMode('add');
        reset();
        setData({
            mata_kuliah_id: mataKuliah.id,
            kode_cpmk: `CPMK-${nextNumber}`,
            deskripsi: '',
            indikator_ids: [],
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (cpmk: Cpmk) => {
        setModalMode('edit');
        setSelectedId(cpmk.id);
        setData({
            mata_kuliah_id: cpmk.mata_kuliah_id,
            kode_cpmk: cpmk.kode_cpmk,
            deskripsi: cpmk.deskripsi,
            indikator_ids: cpmk.indikator_kinerjas ? cpmk.indikator_kinerjas.map(ik => ik.id) : [],
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const toggleIndikator = (ikId: number) => {
        const currentIds = [...data.indikator_ids];
        const index = currentIds.indexOf(ikId);

        if (index === -1) {
            currentIds.push(ikId);
        } else {
            currentIds.splice(index, 1);
        }

        setData('indikator_ids', currentIds);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (modalMode === 'add') {
            post('/cpmk', { onSuccess: () => closeModal() });
        } else {
            patch(`/cpmk/${selectedId}`, { onSuccess: () => closeModal() });
        }
    };

    const handleDelete = (id: number, kode: string) => {
        if (confirm(`Hapus ${kode}? Relasinya ke Indikator Kinerja juga akan terhapus permanen.`)) {
            router.delete(`/cpmk/${id}`);
        }
    };

    // FIX: urutkan CPL berdasarkan nomor kodenya sebelum ditampilkan,
    // supaya CPL-08 selalu muncul di atas CPL-09, apapun urutan aslinya
    // di database (yang biasanya cuma ngikutin kapan di-assign ke MK ini)
    const cplTerurut = mataKuliah.cpls ? sortByKode(mataKuliah.cpls) : [];

    return (
        <AuthenticatedLayout>
            <Head title={`Capaian Pembelajaran - ${mataKuliah.kode_mk}`} />

            {/* --- HEADER MATA KULIAH --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 font-body relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-polman-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <button
                                onClick={() => window.history.back()}
                                className="text-gray-400 hover:text-polman-primary transition-colors flex items-center gap-1 text-sm font-bold"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Kembali
                            </button>
                            <span className="bg-polman-primary/10 text-polman-primary px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-polman-primary/20">
                                Kelola CPMK
                            </span>
                        </div>
                        <h2 className="font-headline font-bold text-3xl text-gray-900 mb-1">{mataKuliah.nama_mk}</h2>
                        <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                            <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> Kode: <span className="text-gray-800">{mataKuliah.kode_mk}</span></span>
                            <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> Bobot: <span className="text-gray-800">{mataKuliah.sks} SKS</span></span>
                        </div>
                    </div>

                    <button
                        onClick={openAddModal}
                        className="bg-polman-primary hover:bg-polman-secondary text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                        + Tulis CPMK Baru
                    </button>
                </div>
            </div>

            {/* --- TABEL DAFTAR CPMK --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden font-body">
                <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Daftar Capaian Pembelajaran Mata Kuliah (CPMK)</h3>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-24">Kode</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Narasi CPMK</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-1/3">Memenuhi Indikator Kinerja</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider w-32">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {!existingCpmks || existingCpmks.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">Belum ada CPMK yang ditambahkan untuk mata kuliah ini.</td></tr>
                        ) : (
                            existingCpmks.map((cpmk) => (
                                <tr key={cpmk.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">{cpmk.kode_cpmk}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800 font-medium leading-relaxed">{cpmk.deskripsi}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex flex-wrap gap-2">
                                            {cpmk.indikator_kinerjas && cpmk.indikator_kinerjas.length > 0 ? (
                                                sortByKode(cpmk.indikator_kinerjas).map(ik => (
                                                    <span key={ik.id} className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold border border-indigo-100" title={ik.deskripsi}>
                                                        {ik.kode}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 italic text-xs">Belum dikaitkan ke IK.</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(cpmk)} className="text-blue-600 hover:text-blue-800 font-bold px-2 transition-colors">Edit</button>
                                            <button onClick={() => handleDelete(cpmk.id, cpmk.kode_cpmk)} className="text-red-500 hover:text-red-700 font-bold px-2 transition-colors">Hapus</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL TAMBAH / EDIT CPMK --- */}
            <Dialog open={isModalOpen} onClose={closeModal} className="relative z-50">
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl font-body">

                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 flex justify-between items-center">
                            <Dialog.Title className="font-headline text-xl font-bold text-gray-900">
                                {modalMode === 'add' ? 'Rajut CPMK Baru' : 'Perbarui Narasi CPMK'}
                            </Dialog.Title>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Kode <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-polman-primary font-bold text-polman-primary"
                                        value={data.kode_cpmk}
                                        onChange={(e) => setData('kode_cpmk', e.target.value.toUpperCase())}
                                        required
                                    />
                                    {errors.kode_cpmk && <p className="text-red-500 text-xs mt-1">{errors.kode_cpmk}</p>}
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Narasi CPMK <span className="text-red-500">*</span></label>
                                    <textarea
                                        className="w-full bg-white border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-polman-primary shadow-sm"
                                        rows={2}
                                        placeholder="Contoh: Mampu merancang sistem basis data relasional..."
                                        value={data.deskripsi}
                                        onChange={(e) => setData('deskripsi', e.target.value)}
                                        required
                                    />
                                    {errors.deskripsi && <p className="text-red-500 text-xs mt-1">{errors.deskripsi}</p>}
                                </div>
                            </div>

                            <div>
                                <div className="mb-3 border-t border-gray-100 pt-4">
                                    <label className="block text-sm font-bold text-gray-900">Kaitkan ke Indikator Kinerja</label>
                                    <p className="text-xs text-gray-500 mt-1">Hanya menampilkan indikator dari CPL yang telah diikatkan ke MK ini oleh Kaprodi.</p>
                                </div>

                                <div className="space-y-4 border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                                    {cplTerurut.length === 0 ? (
                                        <p className="text-sm text-red-500 italic p-4 text-center bg-red-50 rounded-lg">
                                            Mata Kuliah ini belum dibebankan CPL apapun di Matriks Kurikulum.
                                        </p>
                                    ) : (
                                        cplTerurut.map(cpl => (
                                            <div key={cpl.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                                                    <h4 className="font-bold text-xs text-gray-700 flex items-start gap-2">
                                                        <span className="shrink-0 text-polman-primary">{cpl.kode} :</span>
                                                        <span className="truncate">{cpl.deskripsi}</span>
                                                    </h4>
                                                </div>
                                                <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
                                                    {!cpl.indikator_kinerjas || cpl.indikator_kinerjas.length === 0 ? (
                                                        <p className="text-[10px] text-gray-400 italic">CPL ini belum memiliki Indikator Kinerja.</p>
                                                    ) : (
                                                        sortByKode(cpl.indikator_kinerjas).map(ik => (
                                                            <label key={ik.id} className="flex items-start gap-3 cursor-pointer group p-1.5 hover:bg-gray-50 rounded">
                                                                <div className="flex items-center h-4 mt-0.5">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-4 h-4 text-polman-primary border-gray-300 rounded focus:ring-polman-primary transition-colors cursor-pointer"
                                                                        checked={data.indikator_ids.includes(ik.id)}
                                                                        onChange={() => toggleIndikator(ik.id)}
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className={`text-xs font-bold transition-colors ${data.indikator_ids.includes(ik.id) ? 'text-gray-900' : 'text-gray-600 group-hover:text-polman-primary'}`}>
                                                                        {ik.kode}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-500 line-clamp-1">{ik.deskripsi}</span>
                                                                </div>
                                                            </label>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {errors.indikator_ids && <p className="text-red-500 text-xs mt-1 text-center bg-red-50 py-1 rounded">⚠️ Anda harus memilih minimal 1 Indikator Kinerja</p>}
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 sticky bottom-0 bg-white">
                                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing || data.indikator_ids.length === 0 || !data.deskripsi || !data.kode_cpmk} className="px-5 py-2.5 text-sm font-bold text-white bg-polman-primary hover:bg-polman-secondary rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                                    {processing ? 'Menyimpan...' : 'Simpan CPMK'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </AuthenticatedLayout>
    );
}
