import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Dialog } from '@headlessui/react';

interface Kelas {
    id: number;
    kode_kelas: string;
    tingkat: number;
    tahun_masuk: string;
}

interface Mahasiswa {
    id: number;
    nim: string;
    nama: string;
    kelas_id: number;
    kelas: Kelas;
}

interface Props {
    kelas: Kelas[];
    mahasiswas: Mahasiswa[];
    kelasId: number | null;
}

export default function AsesmenMahasiswa({
    kelas,
    mahasiswas,
    kelasId,
}: Props) {
    /**
     * ============================================================
     * AUTH / ROLE
     * ============================================================
     */
    const { auth } = usePage().props as any;

    const roles = auth?.roles ?? [];

    const isAdmin = roles.includes('Admin Jurusan');
    const isKaprodi = roles.includes('Kaprodi');

    /**
     * ============================================================
     * STATE
     * ============================================================
     */
    const [isOpen, setIsOpen] = useState(false);

    /**
     * ============================================================
     * FORM TAMBAH MAHASISWA
     * ============================================================
     */
    const {
        data,
        setData,
        post,
        reset,
        processing,
        errors,
    } = useForm({
        nim: '',
        nama: '',
        kelas_id: kelasId?.toString() ?? '',
    });

    /**
     * ============================================================
     * BUKA MODAL
     * ============================================================
     */
    const handleOpenModal = () => {
        if (!isAdmin) {
            return;
        }

        setIsOpen(true);
    };

    /**
     * ============================================================
     * SUBMIT TAMBAH MAHASISWA
     * ============================================================
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Pengamanan tambahan di frontend.
        // Backend tetap wajib membatasi role.
        if (!isAdmin) {
            return;
        }

        post('/asesmen/mahasiswa', {
            onSuccess: () => {
                setIsOpen(false);
                reset();
            },
        });
    };

    /**
     * ============================================================
     * HAPUS MAHASISWA
     * ============================================================
     */
    const handleDelete = (id: number, nama: string) => {
        // Kaprodi tidak boleh menghapus mahasiswa.
        if (!isAdmin) {
            return;
        }

        if (confirm(`Hapus mahasiswa ${nama}?`)) {
            router.delete(`/asesmen/mahasiswa/${id}`);
        }
    };

    /**
     * ============================================================
     * FILTER KELAS
     * ============================================================
     */
    const handleFilterKelas = (value: string) => {
        router.get(
            '/asesmen/mahasiswa',
            {
                kelas_id: value || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Mahasiswa" />

            <div className="p-6">

                {/* ==================================================
                    HEADER
                ================================================== */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                        <h2 className="font-headline font-bold text-2xl text-gray-900">
                            Manajemen Mahasiswa
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                            Kelola data mahasiswa per kelas.
                        </p>
                    </div>

                    {/* ==================================================
                        TOMBOL TAMBAH MAHASISWA
                        HANYA UNTUK ADMIN JURUSAN
                    ================================================== */}
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={handleOpenModal}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-polman-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-polman-secondary"
                        >
                            <span className="material-symbols-outlined text-lg">
                                person_add
                            </span>

                            + Tambah Mahasiswa
                        </button>
                    )}
                </div>

                {/* ==================================================
                    INFO UNTUK KAPRODI
                ================================================== */}
                {isKaprodi && (
                    <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-blue-600">
                                info
                            </span>

                            <div>
                                <p className="text-sm font-bold text-blue-800">
                                    Mode Tampilan
                                </p>

                                <p className="mt-1 text-sm text-blue-700">
                                    Anda dapat melihat data mahasiswa, tetapi
                                    tidak dapat menambah atau menghapus
                                    mahasiswa.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ==================================================
                    FILTER KELAS
                ================================================== */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Filter Kelas
                    </label>

                    <select
                        className="w-full max-w-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polman-primary/20"
                        value={kelasId ?? ''}
                        onChange={(e) =>
                            handleFilterKelas(e.target.value)
                        }
                    >
                        <option value="">
                            -- Pilih Kelas --
                        </option>

                        {kelas.map((k) => (
                            <option
                                key={k.id}
                                value={k.id}
                            >
                                {k.tingkat}
                                {k.kode_kelas} — Tahun Masuk {k.tahun_masuk}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ==================================================
                    TABEL MAHASISWA
                ================================================== */}
                {kelasId ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                        {/* HEADER TABLE */}
                        <div className="border-b border-gray-100 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">
                                        Data Mahasiswa
                                    </h3>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Menampilkan mahasiswa pada kelas
                                        yang dipilih.
                                    </p>
                                </div>

                                <div className="rounded-lg bg-gray-100 px-3 py-2">
                                    <span className="text-sm font-bold text-gray-600">
                                        {mahasiswas.length} Mahasiswa
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">

                                <thead className="bg-polman-neutral">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase text-xs">
                                            #
                                        </th>

                                        <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase text-xs">
                                            NIM
                                        </th>

                                        <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase text-xs">
                                            Nama
                                        </th>

                                        <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase text-xs">
                                            Kelas
                                        </th>

                                        <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase text-xs">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">

                                    {mahasiswas.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-6 py-12 text-center text-gray-500"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className="material-symbols-outlined text-4xl text-gray-300">
                                                        person_off
                                                    </span>

                                                    <p className="mt-3 font-semibold">
                                                        Belum ada mahasiswa.
                                                    </p>

                                                    {isAdmin && (
                                                        <p className="mt-1 text-xs text-gray-400">
                                                            Silakan tambahkan
                                                            mahasiswa ke kelas
                                                            ini.
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        mahasiswas.map((mhs, i) => (
                                            <tr
                                                key={mhs.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                {/* NOMOR */}
                                                <td className="px-6 py-4 text-gray-500">
                                                    {i + 1}
                                                </td>

                                                {/* NIM */}
                                                <td className="px-6 py-4 font-bold text-polman-primary">
                                                    {mhs.nim}
                                                </td>

                                                {/* NAMA */}
                                                <td className="px-6 py-4 font-bold text-gray-800">
                                                    {mhs.nama}
                                                </td>

                                                {/* KELAS */}
                                                <td className="px-6 py-4 text-gray-600">
                                                    {mhs.kelas
                                                        ? `${mhs.kelas.tingkat}${mhs.kelas.kode_kelas}`
                                                        : '-'}
                                                </td>

                                                {/* AKSI */}
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end items-center gap-4">

                                                        {/* GRAFIK
                                                            Semua role
                                                            yang bisa melihat
                                                            data mahasiswa
                                                            boleh membuka grafik.
                                                        */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.visit(
                                                                    `/asesmen/mhs/${mhs.id}`
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 font-semibold"
                                                        >
                                                            <span className="material-symbols-outlined text-base">
                                                                monitoring
                                                            </span>

                                                            Grafik
                                                        </button>

                                                        {/* HAPUS
                                                            HANYA ADMIN
                                                        */}
                                                        {isAdmin && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        mhs.id,
                                                                        mhs.nama
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 font-semibold"
                                                            >
                                                                <span className="material-symbols-outlined text-base">
                                                                    delete
                                                                </span>

                                                                Hapus
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}

                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* ==================================================
                       BELUM PILIH KELAS
                    ================================================== */
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-16 text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-300">
                            groups
                        </span>

                        <h3 className="mt-4 font-bold text-gray-700">
                            Pilih Kelas
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Silakan pilih kelas terlebih dahulu untuk melihat
                            data mahasiswa.
                        </p>
                    </div>
                )}

                {/* ==================================================
                    MODAL TAMBAH MAHASISWA
                    HANYA DIRENDER UNTUK ADMIN
                ================================================== */}
                {isAdmin && (
                    <Dialog
                        open={isOpen}
                        onClose={() => setIsOpen(false)}
                        className="relative z-50"
                    >
                        {/* BACKDROP */}
                        <div
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                            aria-hidden="true"
                        />

                        {/* MODAL CONTAINER */}
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

                                {/* TITLE */}
                                <Dialog.Title className="font-bold text-xl text-gray-900 mb-1">
                                    Tambah Mahasiswa
                                </Dialog.Title>

                                <p className="text-sm text-gray-500 mb-5">
                                    Masukkan data mahasiswa baru.
                                </p>

                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-4"
                                >

                                    {/* NIM */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            NIM
                                        </label>

                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-polman-primary/20"
                                            placeholder="Contoh: 220443001"
                                            value={data.nim}
                                            onChange={(e) =>
                                                setData(
                                                    'nim',
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />

                                        {errors.nim && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.nim}
                                            </p>
                                        )}
                                    </div>

                                    {/* NAMA */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            Nama Lengkap
                                        </label>

                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-polman-primary/20"
                                            placeholder="Nama mahasiswa"
                                            value={data.nama}
                                            onChange={(e) =>
                                                setData(
                                                    'nama',
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />

                                        {errors.nama && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.nama}
                                            </p>
                                        )}
                                    </div>

                                    {/* KELAS */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            Kelas
                                        </label>

                                        <select
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-polman-primary/20"
                                            value={data.kelas_id}
                                            onChange={(e) =>
                                                setData(
                                                    'kelas_id',
                                                    e.target.value
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                -- Pilih Kelas --
                                            </option>

                                            {kelas.map((k) => (
                                                <option
                                                    key={k.id}
                                                    value={k.id}
                                                >
                                                    {k.tingkat}
                                                    {k.kode_kelas} — Tahun Masuk{' '}
                                                    {k.tahun_masuk}
                                                </option>
                                            ))}
                                        </select>

                                        {errors.kelas_id && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.kelas_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* BUTTON */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsOpen(false)
                                            }
                                            className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                                        >
                                            Batal
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-4 py-2 text-sm font-bold text-white bg-polman-primary hover:bg-polman-secondary rounded-lg disabled:opacity-50"
                                        >
                                            {processing
                                                ? 'Menyimpan...'
                                                : 'Simpan'}
                                        </button>

                                    </div>
                                </form>
                            </Dialog.Panel>
                        </div>
                    </Dialog>
                )}
            </div>
        </AuthenticatedLayout>
    );
}