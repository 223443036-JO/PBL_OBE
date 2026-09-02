import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface Dosen {
    id: number;
    nama_lengkap: string;
    gelar_depan?: string;
    gelar_belakang?: string;
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
}

export default function KelasWali({ kelas }: Props) {
    return (
        <AuthenticatedLayout>
            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-primary">
                        Kelas Wali
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Daftar kelas yang Anda ampu sebagai wali kelas.
                    </p>
                </div>

                {kelas.length === 0 ? (
                    <div className="rounded-2xl bg-white p-8 text-center shadow">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                            <span className="material-symbols-outlined text-3xl text-gray-400">
                                school
                            </span>
                        </div>

                        <h2 className="text-lg font-bold text-gray-700">
                            Belum Ada Kelas Wali
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                            Saat ini Anda belum ditugaskan sebagai wali kelas
                            oleh Kaprodi.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {kelas.map((k) => (
                            <div
                                key={k.id}
                                className="rounded-2xl bg-white p-6 shadow-lg"
                            >
                                <div className="mb-5 flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                            Kelas
                                        </p>

                                        <h2 className="mt-1 text-2xl font-black text-primary">
                                            {k.tingkat}
                                            {k.kode_kelas}
                                        </h2>
                                    </div>

                                    <div className="rounded-xl bg-aqua-100 px-3 py-2">
                                        <span className="material-symbols-outlined text-primary">
                                            groups
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">
                                            Tahun Masuk
                                        </span>

                                        <span className="font-bold text-gray-700">
                                            {k.tahun_masuk}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">
                                            Jumlah Mahasiswa
                                        </span>

                                        <span className="font-bold text-gray-700">
                                            {k.mahasiswas_count}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-gray-100 pt-5">
                                    <Link
                                        href={`/asesmen/kelas-wali/${k.id}`}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
                                    >
                                        <span className="material-symbols-outlined text-lg">
                                            visibility
                                        </span>

                                        Lihat Mahasiswa
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}