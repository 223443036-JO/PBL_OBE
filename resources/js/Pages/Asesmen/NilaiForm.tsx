import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface Cpmk {
    id: number;
    kode_cpmk: string;
    deskripsi: string;
}

interface Bobot {
    [cpmkId: number]: {
        bobot_quiz: number;
        bobot_tugas: number;
        bobot_project: number;
        bobot_uts: number;
        bobot_uas: number;
    };
}

interface Mahasiswa {
    id: number;
    nim: string;
    nama: string;
}

interface Props {
    rps: any;
    cpmks: Cpmk[];
    bobot: Bobot;
    mahasiswas: Mahasiswa[];
    nilaiExisting: any;
    kelas: any;
}

export default function NilaiForm({ rps, cpmks, bobot, mahasiswas, nilaiExisting, kelas }: Props) {
    const [nilai, setNilai] = useState<any>(() => {
        const init: any = {};
        mahasiswas.forEach(mhs => {
            init[mhs.id] = {};
            cpmks.forEach(cpmk => {
                const ex = nilaiExisting[mhs.id]?.find((n: any) => n.cpmk_id === cpmk.id);
                init[mhs.id][cpmk.id] = {
                    quiz:    ex?.quiz    ?? 0,
                    tugas:   ex?.tugas   ?? 0,
                    project: ex?.project ?? 0,
                    uts:     ex?.uts     ?? 0,
                    uas:     ex?.uas     ?? 0,
                };
            });
        });
        return init;
    });

    const [saving, setSaving] = useState(false);

    // FIX: preview sebelumnya selalu bagi 100, padahal backend
    // (AsesmenService::hitungNilaiCpmk) sekarang bagi dengan TOTAL
    // BOBOT AKTUAL per CPMK, bukan 100. Kalau dosen input bobot
    // yang totalnya bukan 100 (mis. 5+5+10=20 ala Excel), preview
    // di layar bakal beda jauh dari nilai final setelah disimpan.
    // Disamakan di sini supaya dosen lihat angka yang konsisten.
    const hitungPreview = (mhsId: number, cpmkId: number) => {
        const n = nilai[mhsId]?.[cpmkId];
        const b = bobot[cpmkId];
        if (!n || !b) return 0;

        const totalBobot =
            Number(b.bobot_quiz) + Number(b.bobot_tugas) + Number(b.bobot_project) +
            Number(b.bobot_uts) + Number(b.bobot_uas);

        if (totalBobot <= 0) return 0;

        const nilaiWeighted =
            n.quiz    * Number(b.bobot_quiz)    +
            n.tugas   * Number(b.bobot_tugas)   +
            n.project * Number(b.bobot_project) +
            n.uts     * Number(b.bobot_uts)     +
            n.uas     * Number(b.bobot_uas);

        return Math.round((nilaiWeighted / totalBobot) * 100) / 100;
    };

    const handleChange = (mhsId: number, cpmkId: number, komponen: string, val: string) => {
        setNilai((prev: any) => ({
            ...prev,
            [mhsId]: {
                ...prev[mhsId],
                [cpmkId]: {
                    ...prev[mhsId]?.[cpmkId],
                    [komponen]: parseFloat(val) || 0,
                }
            }
        }));
    };

    const handleSimpan = () => {
        setSaving(true);
        router.post('/asesmen/nilai', {
            rps_id: rps.id,
            tahun_akademik: rps.tahun_akademik,
            nilai,
        }, {
            onFinish: () => setSaving(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Input Nilai — ${rps.mk_nama}`} />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="font-headline font-bold text-2xl text-gray-900">
                        Input Nilai: {rps.mk_nama}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Kelas: {kelas.kode_kelas} · Semester {rps.semester} · TA: {rps.tahun_akademik}
                    </p>
                </div>
                <button
                    onClick={() => router.visit('/asesmen/nilai')}
                    className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-lg"
                >
                    ← Kembali
                </button>
            </div>

            {/* Info Bobot */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
                <h3 className="font-bold text-gray-800 mb-3">Bobot Komponen Penilaian</h3>
                <div className="flex flex-wrap gap-3">
                    {cpmks.map(cpmk => {
                        const b = bobot[cpmk.id];
                        return b ? (
                            <div key={cpmk.id} className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
                                <div className="font-bold text-sm text-blue-800 mb-1">{cpmk.kode_cpmk}</div>
                                <div className="flex gap-2 text-xs text-blue-600">
                                    <span>Quiz: {b.bobot_quiz}%</span>
                                    <span>Tugas: {b.bobot_tugas}%</span>
                                    <span>Project: {b.bobot_project}%</span>
                                    <span>UTS: {b.bobot_uts}%</span>
                                    <span>UAS: {b.bobot_uas}%</span>
                                </div>
                            </div>
                        ) : null;
                    })}
                </div>
            </div>

            {/* Form Input per Mahasiswa */}
            {mahasiswas.map(mhs => (
                <div key={mhs.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
                    <h3 className="font-bold text-gray-800 mb-3">
                        {mhs.nim} — {mhs.nama}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left font-bold text-gray-600">CPMK</th>
                                    <th className="px-3 py-2 text-center font-bold text-gray-600">Quiz</th>
                                    <th className="px-3 py-2 text-center font-bold text-gray-600">Tugas</th>
                                    <th className="px-3 py-2 text-center font-bold text-gray-600">Project</th>
                                    <th className="px-3 py-2 text-center font-bold text-gray-600">UTS</th>
                                    <th className="px-3 py-2 text-center font-bold text-gray-600">UAS</th>
                                    <th className="px-3 py-2 text-center font-bold text-green-700 bg-green-50">Nilai CPMK</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cpmks.map(cpmk => {
                                    const preview = hitungPreview(mhs.id, cpmk.id);
                                    return (
                                        <tr key={cpmk.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2">
                                                <div className="font-bold text-polman-primary">{cpmk.kode_cpmk}</div>
                                                <div className="text-xs text-gray-500">{cpmk.deskripsi}</div>
                                            </td>
                                            {['quiz','tugas','project','uts','uas'].map(k => (
                                                <td key={k} className="px-3 py-2 text-center">
                                                    <input
                                                        type="number"
                                                        min="0" max="100" step="0.01"
                                                        className="w-16 text-center border border-gray-200 rounded p-1 text-sm focus:border-polman-primary focus:outline-none"
                                                        value={nilai[mhs.id]?.[cpmk.id]?.[k] ?? 0}
                                                        onChange={e => handleChange(mhs.id, cpmk.id, k, e.target.value)}
                                                        onFocus={e => e.target.select()}
                                                    />
                                                </td>
                                            ))}
                                            <td className={`px-3 py-2 text-center font-bold ${preview >= 55 ? 'text-green-600' : 'text-orange-500'}`}>
                                                {preview}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            <div className="flex justify-end gap-3 mt-4">
                <button
                    onClick={() => router.visit('/asesmen/nilai')}
                    className="px-6 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                    Batal
                </button>
                <button
                    onClick={handleSimpan}
                    disabled={saving}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
                >
                    {saving ? 'Menyimpan...' : 'Simpan Nilai'}
                </button>
            </div>
        </AuthenticatedLayout>
    );
}