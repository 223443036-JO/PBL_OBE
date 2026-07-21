import React, { useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Chart, registerables } from 'chart.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
Chart.register(...registerables);

interface Props {
    mahasiswa: any;
    grafikCpl: { label: string; deskripsi: string; data: number[] }[];
    radarCpl: { label: string; nilai: number }[];
    radarIea: { label: string; nilai: number }[];
    grafikIea: { label: string; deskripsi: string; data: number[] }[];
    ips: number[];
    grafikPpm: { kode: string; deskripsi: string; nilai: number }[];
    mhsKelas: any[];
    cpls: any[];
    ieas: any[];
}

export default function AsesmenShow({ mahasiswa, grafikCpl, radarCpl, grafikIea, radarIea, ips, grafikPpm, mhsKelas }: Props) {
    const radarCplRef = useRef<HTMLCanvasElement>(null);
    const barCplRef   = useRef<HTMLCanvasElement>(null);
    const radarIeaRef = useRef<HTMLCanvasElement>(null);
    const ipsRef      = useRef<HTMLCanvasElement>(null);

    const COLORS = ['#0d9488','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#10b981','#6366f1','#ef4444','#14b8a6'];

    useEffect(() => {
        const charts: Chart[] = [];

        if (radarCplRef.current) {
            charts.push(new Chart(radarCplRef.current, {
                type: 'radar',
                data: {
                    labels: radarCpl.map(d => d.label),
                    datasets: [{
                        label: 'Capaian CPL',
                        data: radarCpl.map(d => d.nilai),
                        borderColor: '#0d9488',
                        backgroundColor: 'rgba(13,148,136,0.15)',
                        borderWidth: 2,
                        pointBackgroundColor: '#0d9488',
                    },{
                        label: 'Batas (55)',
                        data: radarCpl.map(() => 55),
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

        if (ipsRef.current) {
            charts.push(new Chart(ipsRef.current, {
                type: 'line',
                data: {
                    labels: ['1','2','3','4','5','6','7','8'],
                    datasets: [{
                        label: 'Rerata CPL',
                        data: ips,
                        borderColor: '#0d9488',
                        backgroundColor: 'rgba(13,148,136,0.1)',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#0d9488',
                        pointRadius: 5,
                        tension: 0.3,
                        fill: true,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        y: { min: 0, max: 100, ticks: { stepSize: 20 } },
                        x: { grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            }));
        }

        if (barCplRef.current) {
            charts.push(new Chart(barCplRef.current, {
                type: 'bar',
                data: {
                    labels: ['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6','Sem 7','Sem 8'],
                    datasets: grafikCpl.map((cpl, i) => ({
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

        if (radarIeaRef.current) {
            charts.push(new Chart(radarIeaRef.current, {
                type: 'radar',
                data: {
                    labels: radarIea.map(d => d.label),
                    datasets: [{
                        label: 'CPI IABEE',
                        data: radarIea.map(d => d.nilai),
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139,92,246,0.12)',
                        borderWidth: 2,
                        pointBackgroundColor: '#8b5cf6',
                    },{
                        label: 'Batas (55)',
                        data: radarIea.map(() => 55),
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

        return () => charts.forEach(c => c.destroy());
    }, []);

    const tercapai = radarCpl.filter(d => d.nilai >= 55).length;
    const avgCpl   = radarCpl.length > 0
        ? Math.round(radarCpl.reduce((a,b) => a + b.nilai, 0) / radarCpl.length * 10) / 10
        : 0;

    const handleDownload = () => {
        const namaFile = `Asesmen_${mahasiswa.nama.replace(/\s+/g, '_')}_${mahasiswa.nim}`;
        const originalTitle = document.title;
        
        document.title = namaFile;
        
        // Delay kecil agar title sempat berubah sebelum print
        setTimeout(() => {
            window.print();
            
            setTimeout(() => {
                document.title = originalTitle;
                
                if ('Notification' in window) {
                    if (Notification.permission === 'granted') {
                        new Notification('PDF Berhasil Diunduh ✅', {
                            body: `${namaFile}.pdf telah disimpan`,
                            icon: '/images/polman-logo.png',
                        });
                    } else if (Notification.permission !== 'denied') {
                        Notification.requestPermission().then(permission => {
                            if (permission === 'granted') {
                                new Notification('PDF Berhasil Diunduh ✅', {
                                    body: `${namaFile}.pdf telah disimpan`,
                                    icon: '/images/polman-logo.png',
                                });
                            }
                        });
                    }
                }
            }, 1000);
        }, 100); // <-- ini yang baru, delay 100ms sebelum print
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Asesmen — ${mahasiswa.nama}`} />

            {/* Info Mahasiswa */}
            <div className="bg-gradient-to-r from-polman-primary to-teal-700 rounded-xl p-5 text-white flex items-center gap-5 mb-6 print:hidden">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                    {mahasiswa.nama.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    <div className="text-xl font-bold">{mahasiswa.nama}</div>
                    <div className="text-sm opacity-80">{mahasiswa.nim} · {mahasiswa.kode_kelas}</div>
                </div>
                <div className="flex gap-8 mr-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold">{tercapai}/{radarCpl.length}</div>
                        <div className="text-xs opacity-80">CPL Tercapai</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{avgCpl}</div>
                        <div className="text-xs opacity-80">Rerata CPL</div>
                    </div>
                </div>

                <button
                    onClick={() => router.visit(`/asesmen?kelas_id=${mahasiswa.kelas_id}`)}
                    className="bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/30 transition"
                >
                    ← Kembali
                </button>

                <button
                    onClick={handleDownload}
                    className="bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/30 transition"
                >
                    ⬇ Download PDF
                </button>

                <select
                    onChange={e => router.visit(`/asesmen/mhs/${e.target.value}`)}
                    value={mahasiswa.id}
                    className="bg-white/10 border border-white/30 text-white rounded-lg px-3 py-2 text-sm"
                >
                    {mhsKelas.map(m => (
                        <option key={m.id} value={m.id} className="text-gray-800 bg-white">{m.nama}</option>
                    ))}
                </select>
            </div>

            <div id="grafik-content">
                {/* Identitas ringkas untuk PDF */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-bold text-gray-800">{mahasiswa.nama} — {mahasiswa.nim} · {mahasiswa.kode_kelas}</p>
                    <p className="text-sm text-gray-500">CPL Tercapai: {tercapai}/{radarCpl.length} · Rerata CPL: {avgCpl}</p>
                </div>

                {/* PPM */}
                {grafikPpm.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
                        <h3 className="font-bold text-gray-800 mb-4">Capaian Profil Profesional Mandiri (PPM)</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {grafikPpm.map(ppm => (
                                <div key={ppm.kode} className="border border-gray-100 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-polman-primary mb-1">{ppm.nilai}</div>
                                    <div className="text-xs font-bold text-gray-700 mb-1">{ppm.kode}</div>
                                    <div className="text-xs text-gray-500 line-clamp-2">{ppm.deskripsi}</div>
                                    <div className={`mt-2 text-xs font-bold ${ppm.nilai >= 55 ? 'text-green-600' : 'text-orange-500'}`}>
                                        {ppm.nilai >= 55 ? 'Tercapai' : 'Belum Tercapai'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Row 1: Radar CPL + IPS */}
                <div className="grid grid-cols-2 gap-5 mb-5">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 mb-3">Radar Capaian CPL</h3>
                        <div className="h-64 print:h-40"><canvas ref={radarCplRef}/></div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 mb-3">Rata-rata Capaian CPL per Semester</h3>
                        <div className="h-64 print:h-40"><canvas ref={ipsRef}/></div>
                    </div>
                </div>

                {/* Bar Chart per CPL Individual */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
                    <h3 className="font-bold text-gray-800 mb-4">Perkembangan per CPL</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-4">
                        {grafikCpl.map((cpl, i) => (
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

                {/* Row 3: Radar IEA */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5 print:break-before-page">
                    <h3 className="font-bold text-gray-800 mb-3">Radar CPI IABEE (a–k)</h3>
                    <div className="h-80 print:h-44"><canvas ref={radarIeaRef}/></div>
                </div>

                {/* Bar Chart per IEA Individual */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
                    <h3 className="font-bold text-gray-800 mb-4">Perkembangan per CPI IABEE</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-4">
                        {grafikIea.map((iea, i) => (
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

                {/* Tabel CPL */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
                    <h3 className="font-bold text-gray-800 mb-3">Tabel Detail Capaian CPL</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-gray-600">CPL</th>
                                    <th className="px-4 py-3 text-left font-bold text-gray-600">Deskripsi</th>
                                    {[1,2,3,4,5,6,7,8].map(s => (
                                        <th key={s} className="px-3 py-3 text-center font-bold text-gray-600">Sem {s}</th>
                                    ))}
                                    <th className="px-4 py-3 text-center font-bold text-gray-600">Nilai Akhir</th>
                                    <th className="px-4 py-3 text-center font-bold text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {grafikCpl.map(cpl => {
                                    // FIX: sebelumnya Math.max(...cpl.data) -- cuma ambil nilai
                                    // tertinggi dari satu semester. Diganti jadi jumlah semua
                                    // semester, konsisten dengan radarCpl & Rerata CPL di header
                                    // yang sama-sama pakai akumulasi (sum) lintas semester.
                                    // Math.round(...*100)/100 buat hindari sisa floating-point
                                    // seperti 13.669999999999998.
                                    const nilaiAkhir = Math.round(cpl.data.reduce((a, b) => a + b, 0) * 100) / 100;
                                    return (
                                        <tr key={cpl.label} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-bold text-polman-primary">{cpl.label}</td>
                                            <td className="px-4 py-3 text-gray-600 text-xs">{cpl.deskripsi}</td>
                                            {cpl.data.map((v, i) => (
                                                <td key={i} className={`px-3 py-3 text-center ${v >= 55 ? 'text-green-600 font-bold' : v > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                                                    {v > 0 ? v : '—'}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-center font-bold">{nilaiAkhir > 0 ? nilaiAkhir : '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                {nilaiAkhir >= 55
                                                    ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Tercapai</span>
                                                    : nilaiAkhir > 0
                                                    ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Belum</span>
                                                    : <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">—</span>
                                                }
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            

            
        </AuthenticatedLayout>
    );
}