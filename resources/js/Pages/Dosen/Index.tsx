import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

// Definisi interface TypeScript untuk mapping struktur data
interface Dosen {
    id: number;
    name: string;
    email: string;
    nip: string;
    created_at: string;
    dosen_biodata?: {
        nama_lengkap: string;
        gelar_depan: string | null;
        gelar_belakang: string | null;
        nip: string;
        nidn: string;
        prodi: string;
        jabatan_akademik: string;
    } | null;
}

export default function IndexDosen({ dosens }: { dosens: Dosen[] }) {
    const [editingDosen, setEditingDosen] = useState<Dosen | null>(null);

    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        email: '',
        password: '',
    });

    const openEditModal = (dosen: Dosen) => {
        setEditingDosen(dosen);
        setData({ email: dosen.email, password: '' });
        clearErrors();
    };

    const closeEditModal = () => {
        setEditingDosen(null);
        reset();
        clearErrors();
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDosen) return;
        put(route('dosen.update', editingDosen.id), {
            onSuccess: () => closeEditModal(),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Akun Dosen</h2>}
        >
            <Head title="Daftar Dosen" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border border-gray-200">

                        {/* Header Tabel & Tombol Tambah */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Daftar Akun Dosen Terdaftar</h3>
                            <Link
                                href={route('dosen.create')}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors"
                            >
                                + Register Dosen Baru
                            </Link>
                        </div>

                        {/* Tabel Data */}
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIP</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Lengkap</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jabatan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Register</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {dosens && dosens.length > 0 ? (
                                        dosens.map((dosen) => (
                                            <tr key={dosen.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{dosen.nip || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dosen.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dosen.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {dosen.dosen_biodata?.jabatan_akademik || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(dosen.created_at).toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => openEditModal(dosen)}
                                                        className="text-teal-600 hover:text-teal-800 font-semibold"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                                Belum ada data dosen yang didaftarkan ke dalam sistem.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>

            {/* MODAL EDIT AKUN DOSEN */}
            {editingDosen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Edit Akun Dosen</h3>
                        <p className="text-sm text-gray-500 mb-4">{editingDosen.name}</p>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full border-gray-300 rounded text-sm"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    required
                                />
                                {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Password Baru <span className="font-normal text-gray-400">(kosongkan kalau tidak ingin diganti)</span>
                                </label>
                                <input
                                    type="password"
                                    className="w-full border-gray-300 rounded text-sm"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                />
                                {errors.password && <span className="text-red-500 text-xs">{errors.password}</span>}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeEditModal} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg text-sm font-bold">
                                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
