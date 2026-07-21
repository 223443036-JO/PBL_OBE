import React, { useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface Props {
    kelas: any;
    kelasList: any[];
    cpls: any[];
    ieas: any[];
    ppms: any[];
    grafikRerataCpl: { label: string; deskripsi: string; data: number[] }[];
    radarRerataCpl: { label: string; nilai: number }[];
    radarRerataIea: { label: string; nilai: number }[];
    grafikRerataIea: { label: string; deskripsi: string; data: number[] }[];
    rerataPpm: { kode: string; deskripsi: string; nilai: number }[];
}

export default function AsesmenRerata({ kelas, kelasList, grafikRerataCpl, radarRerataCpl, grafikRerataIea, radarRerataIea, rerataPpm }: Props) {
    const radarCplRef = useRef<HTMLCanvasElement>(null);
    const barCplRef   = useRef<HTMLCanvasElement>(null);
    const radarIeaRef = useRef<HTMLCanvasElement>(null);

    const COLORS = ['#0d9488','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#10b981','#6366f1','#ef4444','#14b8a6'];

    useEffect(() => {
        const charts: Chart[] = [];

        if (radarCplRef.current) {
            charts.push(new Chart(radarCplRef.current, {
                type: 'radar',
                data: {
                    labels: radarRerataCpl.map(d => d.label),
                    datasets: [{
                        label: 'Rerata CPL Kelas',
                        data: radarRerataCpl.map(d => d.nilai),
                        borderColor: '#0d9488',
                        backgroundColor: 'rgba(13,148,136,0.15)',
                        borderWidth: 2,
                        pointBackgroundColor: '#0d9488',
                    },{
                        label: 'Batas (55)',
                        data: radarRerataCpl.map(() => 55),
                        borderColor: '#ef4444',
                        borderDash: [5,5],
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        pointRadius: 0,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } },
                    plugins: { legend: { position: 'bottom' } }
                }
            }));
        }

        if (radarIeaRef.current) {
            charts.push(new Chart(radarIeaRef.current, {
                type: 'radar',
                data: {
                    labels: radarRerataIea.map(d => d.label),
                    datasets: [{
                        label: 'Rerata CPI IABEE',
                        data: radarRerataIea.map(d => d.nilai),
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139,92,246,0.12)',
                        borderWidth: 2,
                        pointBackgroundColor: '#8b5cf6',
                    },{
                        label: 'Batas (55)',
                        data: radarRerataIea.map(() => 55),
                        borderColor: '#ef4444',
                        borderDash: [5,5],
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        pointRadius: 0,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { r: { min: 0, max: 100, ticks: { stepSize: 20, font: { size: 9 } }, pointLabels: { font: { size: 10 } } } },
                    plugins: { legend: { position: 'bottom' } }
                }
            }));
        }

        if (barCplRef.current) {
            charts.push(new Chart(barCplRef.current, {
                type: 'bar',
                data: {
                    labels: ['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6','Sem 7','Sem 8'],
                    datasets: grafikRerataCpl.map((cpl, i) => ({
                        label: cpl.label,
                        data: cpl.data,
                        backgroundColor: COLORS[i % COLORS.length] + 'CC',
                        borderRadius: 3,
                    }))
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        y: { min: 0, max: 100, ticks: { stepSize: 20 } },
                        x: { grid: { display: false } }
                    },
                    plugins: { legend: { position: 'bottom' } }
                }
            }));
        }

        return () => charts.forEach(c => c.destroy());
    }, []);

    return (
        <AuthenticatedLayout>
            <Head title="Rerata CPL Kelas" />
            {/* Dropdown pilih kelas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Kelas</label>
                <select
                    className="w-full max-w-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm"
                    value={kelas?.id ?? ''}
                    onChange={e => router.get('/asesmen/rerata', { kelas_id: e.target.value })}
                >
                    <option value="">-- Pilih Kelas --</option>
                    {kelasList?.map((k: any) => (
                        <option key={k.id} value={k.id}>
                            {k.kode_kelas} (Tingkat {k.tingkat})
                        </option>
                    ))}
                </select>
            </div>

            {kelas && (
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="font-headline font-bold text-2xl text-gray-900">
                            Rerata Kelas: {kelas.kode_kelas}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Tingkat {kelas.tingkat} · Angkatan {kelas.tahun_masuk}</p>
                    </div>
                    <button
                        onClick={() => router.visit(`/asesmen?kelas_id=${kelas.id}`)}
                        className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-lg"
                    >
                        ← Kembali
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="text-sm bg-polman-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                    >
                        ⬇ Download PDF
                    </button>

                </div>
            )}

            {/* Rerata PPM */}
            {kelas && rerataPpm.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
                    <h3 className="font-bold text-gray-800 mb-4">Capaian Profil Profesional Mandiri (PPM) Rerata Kelas</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {rerataPpm.map((ppm, i) => (
                            <div key={i} className="border border-gray-100 rounded-lg p-4 text-center">
                                <p className={`text-3xl font-black mb-1 ${ppm.nilai >= 55 ? 'text-green-600' : 'text-orange-500'}`}>
                                    {ppm.nilai > 0 ? ppm.nilai : '—'}
                                </p>
                                <p className="font-bold text-polman-primary text-sm">{ppm.kode}</p>
                                <p className="text-xs text-gray-500 mt-1">{ppm.deskripsi}</p>
                                <p className={`text-xs font-bold mt-2 ${ppm.nilai >= 55 ? 'text-green-600' : 'text-orange-500'}`}>
                                    {ppm.nilai >= 55 ? 'Tercapai' : 'Belum Tercapai'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Radar Charts */}
            <div className="grid grid-cols-2 gap-5 mb-5">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 mb-3">Radar Rerata CPL Kelas</h3>
                    <div className="h-64"><canvas ref={radarCplRef}/></div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 mb-3">Radar Rerata CPI IABEE</h3>
                    <div className="h-64"><canvas ref={radarIeaRef}/></div>
                </div>
            </div>


            {/* Bar Chart per CPL Individual */}
            {kelas && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
                    <h3 className="font-bold text-gray-800 mb-4">Perkembangan per CPL</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {grafikRerataCpl.map((cpl, i) => (
                            <div key={i} className="border border-gray-100 rounded-lg p-3">
                                <p className="font-bold text-xs text-polman-primary mb-1">{cpl.label}</p>
                                <p className="text-xs text-gray-500 mb-2 truncate">{cpl.deskripsi}</p>
                                <canvas ref={el => { if (el) {
                                    const existing = Chart.getChart(el);
                                    if (existing) existing.destroy();
                                    new Chart(el, {
                                        type: 'bar',
                                        data: {
                                            labels: ['1','2','3','4','5','6','7','8'],
                                            datasets: [{
                                                data: cpl.data,
                                                backgroundColor: 'rgba(13,148,136,0.6)',
                                                borderColor: '#0d9488',
                                                borderWidth: 1,
                                            },{
                                                type: 'line' as any,
                                                data: Array(8).fill(55),
                                                borderColor: '#ef4444',
                                                borderDash: [4,4],
                                                borderWidth: 1,
                                                pointRadius: 0,
                                            }]
                                        },
                                        options: {
                                            plugins: { legend: { display: false } },
                                            scales: { y: { min: 0, max: 100 } }
                                        }
                                    });
                                }}} height={120} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bar Chart per IEA Individual */}
            {kelas && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
                    <h3 className="font-bold text-gray-800 mb-4">Perkembangan per CPI IABEE</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {grafikRerataIea.map((iea, i) => (
                            <div key={i} className="border border-gray-100 rounded-lg p-3">
                                <p className="font-bold text-xs text-polman-primary mb-1">{iea.label}</p>
                                <p className="text-xs text-gray-500 mb-2 truncate">{iea.deskripsi}</p>
                                <canvas ref={el => { if (el) {
                                    const existing = Chart.getChart(el);
                                    if (existing) existing.destroy();
                                    new Chart(el, {
                                        type: 'bar',
                                        data: {
                                            labels: ['1','2','3','4','5','6','7','8'],
                                            datasets: [{
                                                data: iea.data,
                                                backgroundColor: 'rgba(99,102,241,0.6)',
                                                borderColor: '#6366f1',
                                                borderWidth: 1,
                                            },{
                                                type: 'line' as any,
                                                data: Array(8).fill(55),
                                                borderColor: '#ef4444',
                                                borderDash: [4,4],
                                                borderWidth: 1,
                                                pointRadius: 0,
                                            }]
                                        },
                                        options: {
                                            plugins: { legend: { display: false } },
                                            scales: { y: { min: 0, max: 100 } }
                                        }
                                    });
                                }}} height={120} />
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Tabel Rerata */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-3">Tabel Rerata CPL Kelas</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold text-gray-600">CPL</th>
                                {[1,2,3,4,5,6,7,8].map(s => (
                                    <th key={s} className="px-3 py-3 text-center font-bold text-gray-600">Sem {s}</th>
                                ))}
                                <th className="px-4 py-3 text-center font-bold text-gray-600">Rerata Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {grafikRerataCpl.map(cpl => {
                                // FIX: sebelumnya rata-rata dari semester yang ada datanya
                                // (nonZero.reduce(...)/nonZero.length) -- diganti jadi SUM
                                // semua semester, konsisten dengan formula Excel acuan
                                // (T6 = SUM(AD6:AK6)) dan fix yang sama di Show.tsx.
                                const akhir = Math.round(cpl.data.reduce((a, b) => a + b, 0) * 100) / 100;
                                return (
                                    <tr key={cpl.label} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-polman-primary">{cpl.label}</div>
                                            <div className="text-xs text-gray-500">{cpl.deskripsi}</div>
                                        </td>
                                        {cpl.data.map((v, i) => (
                                            <td key={i} className={`px-3 py-3 text-center ${v >= 55 ? 'text-green-600 font-bold' : v > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                                                {v > 0 ? v : '—'}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-center font-bold">{akhir > 0 ? akhir : '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            

        </AuthenticatedLayout>
    );
}
