import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

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
}

interface Props {
    kelas: Kelas;
    mahasiswas: Mahasiswa[];
}

export default function KelasWaliShow({
    kelas,
    mahasiswas,
}: Props) {
    return (
        <AuthenticatedLayout>
            <div className="p-6">

                {/* Header */}
                <div className="mb-6">
                    <Link
                        href={route('asesmen.kelas.wali.dosen')}
                        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary"
                    >
                        <span className="material-symbols-outlined text-lg">
                            arrow_back
                        </span>

                        Kembali ke Kelas Wali
                    </Link>

                    <div className="mt-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Kelas Wali
                        </p>

                        <h1 className="mt-1 text-3xl font-black text-primary">
                            {kelas.tingkat}
                            {kelas.kode_kelas}
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Tahun Masuk {kelas.tahun_masuk}
                        </p>
                    </div>
                </div>

                {/* Statistik */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-5 shadow">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-aqua-100">
                                <span className="material-symbols-outlined text-primary">
                                    groups
                                </span>
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase text-gray-400">
                                    Total Mahasiswa
                                </p>

                                <p className="text-2xl font-black text-primary">
                                    {mahasiswas.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabel Mahasiswa */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
                    <div className="border-b border-gray-100 px-6 py-5">
                        <h2 className="text-lg font-black text-primary">
                            Data Mahasiswa
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Daftar mahasiswa yang terdaftar pada kelas ini.
                        </p>
                    </div>

                    {mahasiswas.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <span className="material-symbols-outlined text-4xl text-gray-300">
                                person_off
                            </span>

                            <p className="mt-3 text-sm font-semibold text-gray-500">
                                Belum ada mahasiswa pada kelas ini.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-gray-500">
                                            No
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-gray-500">
                                            NIM
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-gray-500">
                                            Nama Mahasiswa
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {mahasiswas.map((mahasiswa, index) => (
                                        <tr
                                            key={mahasiswa.id}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-500">
                                                {index + 1}
                                            </td>

                                            <td className="px-6 py-4 text-sm font-bold text-gray-700">
                                                {mahasiswa.nim}
                                            </td>

                                            <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                {mahasiswa.nama}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}