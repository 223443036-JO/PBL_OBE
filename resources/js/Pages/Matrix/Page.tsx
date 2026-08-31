import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// --- Interfaces ---
interface Iea { id: number; kode: string; deskripsi: string; }
interface Cpl { id: number; kode: string; deskripsi: string; ieas?: Iea[]; }
interface Ppm { id: number; kode: string; deskripsi: string; ieas?: Iea[]; }
interface MataKuliah { id: number; kode_mk: string; nama_mk: string; cpls?: Cpl[]; }

interface Props {
    cpls: Cpl[];
    ieas: Iea[];
    ppms: Ppm[];
    mataKuliahs: MataKuliah[]; // Data baru dari Backend
    cplToPpmMatrix: Record<number, Record<number, boolean>>;
}

export default function MatrixPage({ cpls, ieas, ppms, mataKuliahs, cplToPpmMatrix }: Props) {
    const { roles } = usePage().props.auth as any;
    const isKaprodi = roles?.includes('Kaprodi');

    // Tab pertama sekarang adalah PPM x IEA
    const [activeTab, setActiveTab] = useState<'mk-cpl' | 'iea-cpl' | 'iea-ppm' | 'cpl-ppm'>('iea-ppm');

    // --- Handlers Auto-Sync ---
    const handleSyncMkCpl = (mkId: number, cplId: number, isSelected: boolean) => {
        if (!isKaprodi) return;

        router.post('/matrix/sync-mk-cpl', { // Endpoint baru
            mata_kuliah_id: mkId,
            cpl_id: cplId,
            is_selected: isSelected
        }, { preserveScroll: true });
    };

    const handleSyncCplIea = (cplId: number, ieaId: number, isSelected: boolean) => {
        if (!isKaprodi) return;

        router.post('/matrix/sync-cpl-iea', { cpl_id: cplId, iea_id: ieaId, is_selected: isSelected }, { preserveScroll: true });
    };

    const handleSyncPpmIea = (ppmId: number, ieaId: number, isSelected: boolean) => {
        if (!isKaprodi) return;

        router.post('/matrix/sync-ppm-iea', { ppm_id: ppmId, iea_id: ieaId, is_selected: isSelected }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Curriculum Map" />

            <div className="mb-6">
                <h2 className="font-headline font-bold text-2xl text-gray-900">Curriculum Mapping Matrix</h2>
                <p className="text-gray-500 text-sm mt-1">Sistem Pemetaan Terintegrasi: Mata Kuliah, CPL, IEA, dan Profil Lulusan (PPM).</p>
            </div>

            {/* --- Sistem Tabs --- */}
            <div className="flex space-x-1 border-b border-gray-200 mb-6 overflow-x-auto pb-1">
                <button
                    onClick={() => setActiveTab('iea-ppm')}
                    className={`py-3 px-6 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === 'iea-ppm' ? 'border-polman-primary text-polman-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    1. Matriks PPM x IEA
                </button>
                <button
                    onClick={() => setActiveTab('iea-cpl')}
                    className={`py-3 px-6 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === 'iea-cpl' ? 'border-polman-primary text-polman-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    2. Matriks IEA x CPL
                </button>
                <button
                    onClick={() => setActiveTab('cpl-ppm')}
                    className={`py-3 px-6 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === 'cpl-ppm' ? 'border-polman-secondary text-polman-secondary' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    3. Matriks CPL x PPM
                </button>
                <button
                    onClick={() => setActiveTab('mk-cpl')}
                    className={`py-3 px-6 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === 'mk-cpl' ? 'border-polman-primary text-polman-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    4. Matriks MK x CPL
                </button>
            </div>

            {/* --- TAB 1 (BARU): MK x CPL --- */}
            {activeTab === 'mk-cpl' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 text-sm text-gray-700 font-body">
                        {isKaprodi ? (
                            <><strong>Tugas Kaprodi:</strong> Berikan tanda centang untuk membebankan CPL pada Mata Kuliah.</>
                        ) : (
                            <><strong>Mode baca:</strong> Anda hanya dapat melihat pemetaan kurikulum.</>
                        )}
                    </div>
                    <table className="min-w-full border-collapse font-body">
                        <thead>
                            <tr className="bg-polman-neutral">
                                <th className="p-4 border-b border-r text-left text-xs font-bold text-gray-700 uppercase sticky left-0 bg-polman-neutral z-10 w-72 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Mata Kuliah \ CPL</th>
                                {cpls.map(cpl => (
                                    <th
                                        key={cpl.id}
                                        title={cpl.deskripsi || cpl.kode}
                                        className="p-4 border-b text-center text-[10px] font-bold text-polman-primary uppercase min-w-[80px] relative group cursor-pointer"
                                    >
                                        {cpl.kode}

                                        {/* Pop-up penjelasan saat CPL di-hover */}
                                        {cpl.deskripsi && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-48 p-2.5 bg-gray-900 text-white text-xs font-normal normal-case rounded-lg shadow-xl z-50 pointer-events-none text-left">
                                                <div className="font-bold border-b border-gray-700 pb-1 mb-1">{cpl.kode}</div>
                                                {cpl.deskripsi}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {!mataKuliahs || mataKuliahs.length === 0 ? (
                                <tr><td colSpan={cpls.length + 1} className="p-8 text-center text-gray-500">Silakan isi Master Data Mata Kuliah terlebih dahulu.</td></tr>
                            ) : mataKuliahs.map(mk => (
                                <tr key={mk.id} className="hover:bg-gray-50">
                                    <td className="p-4 border-b border-r sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <div className="font-bold text-sm text-gray-900">{mk.kode_mk}</div>
                                        <div className="text-[11px] text-gray-500 whitespace-normal break-words leading-relaxed w-64">{mk.nama_mk}</div>
                                    </td>
                                    {cpls.map(cpl => {
                                        // Pengecekan relasi Many-to-Many
                                        const isChecked = mk.cpls?.some(item => item.id === cpl.id) || false;
                                        return (
                                            <td key={cpl.id} className="p-4 border-b text-center">
                                                <input 
                                                     type="checkbox" 
                                                     checked={isChecked}
                                                     disabled={!isKaprodi}
                                                     onChange={(e) => handleSyncMkCpl(mk.id, cpl.id, e.target.checked)}
                                                     className="w-5 h-5 rounded border-gray-300 text-polman-primary focus:ring-polman-primary cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                                 />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- TAB 2: IEA x CPL --- */}
            {activeTab === 'iea-cpl' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="min-w-full border-collapse font-body">
                        <thead>
                            <tr className="bg-polman-neutral">
                                <th className="p-4 border-b border-r text-left text-xs font-bold text-gray-700 uppercase sticky left-0 bg-polman-neutral z-10 w-64">CPL \ IEA</th>
                                {ieas.map(iea => (
                                    <th
                                        key={iea.id}
                                        title={iea.deskripsi || iea.kode}
                                        className="p-4 border-b text-center text-[10px] font-bold text-polman-primary uppercase min-w-[80px] relative group cursor-pointer"
                                    >
                                        {iea.kode}

                                        {iea.deskripsi && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-48 p-2.5 bg-gray-900 text-white text-xs font-normal normal-case rounded-lg shadow-xl z-50 pointer-events-none text-left">
                                                <div className="font-bold border-b border-gray-700 pb-1 mb-1">{iea.kode}</div>
                                                {iea.deskripsi}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {!cpls || cpls.length === 0 ? (
                                <tr><td colSpan={ieas.length + 1} className="p-8 text-center text-gray-500">Data belum tersedia.</td></tr>
                            ) : cpls.map(cpl => (
                                <tr key={cpl.id} className="hover:bg-gray-50">
                                    <td className="p-4 border-b border-r sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <div className="font-bold text-sm text-polman-primary">{cpl.kode}</div>
                                        <div className="text-[10px] text-gray-500 whitespace-normal break-words leading-relaxed w-56">{cpl.deskripsi}</div>
                                    </td>
                                    {ieas.map(iea => {
                                        const isChecked = cpl.ieas?.some(item => item.id === iea.id) || false;
                                        return (
                                            <td key={iea.id} className="p-4 border-b text-center">
                                                <input type="checkbox" checked={isChecked} disabled={!isKaprodi} onChange={(e) => handleSyncCplIea(cpl.id, iea.id, e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-polman-primary focus:ring-polman-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60" />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- TAB 3: IEA x PPM --- */}
            {activeTab === 'iea-ppm' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="min-w-full border-collapse font-body">
                        <thead>
                            <tr className="bg-polman-neutral">
                                <th className="p-4 border-b border-r text-left text-xs font-bold text-gray-700 uppercase sticky left-0 bg-polman-neutral z-10 w-64">PPM \ IEA</th>
                                {ieas.map(iea => (
                                    <th
                                        key={iea.id}
                                        title={iea.deskripsi || iea.kode}
                                        className="p-4 border-b text-center text-[10px] font-bold text-polman-primary uppercase min-w-[80px] relative group cursor-pointer"
                                    >
                                        {iea.kode}

                                        {iea.deskripsi && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-48 p-2.5 bg-gray-900 text-white text-xs font-normal normal-case rounded-lg shadow-xl z-50 pointer-events-none text-left">
                                                <div className="font-bold border-b border-gray-700 pb-1 mb-1">{iea.kode}</div>
                                                {iea.deskripsi}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {!ppms || ppms.length === 0 ? (
                                <tr><td colSpan={ieas.length + 1} className="p-8 text-center text-gray-500">Data belum tersedia.</td></tr>
                            ) : ppms.map(ppm => (
                                <tr key={ppm.id} className="hover:bg-gray-50">
                                    <td className="p-4 border-b border-r sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <div className="font-bold text-sm text-polman-primary">{ppm.kode}</div>
                                        <div className="text-[10px] text-gray-500 whitespace-normal break-words leading-relaxed w-56">{ppm.deskripsi}</div>
                                    </td>
                                    {ieas.map(iea => {
                                        const isChecked = ppm.ieas?.some(item => item.id === iea.id) || false;
                                        return (
                                            <td key={iea.id} className="p-4 border-b text-center">
                                                <input type="checkbox" checked={isChecked} disabled={!isKaprodi} onChange={(e) => handleSyncPpmIea(ppm.id, iea.id, e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-polman-primary focus:ring-polman-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60" />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- TAB 4: RESULT CPL x PPM --- */}
            {activeTab === 'cpl-ppm' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    <div className="p-4 bg-blue-50 border-b border-blue-100 text-sm text-blue-800 flex items-center gap-2 font-body">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Tabel otomatis. Relasi terbentuk jika CPL dan PPM beririsan pada IEA yang sama.
                    </div>
                    <table className="min-w-full border-collapse font-body">
                        <thead>
                            <tr className="bg-polman-secondary text-white">
                                <th className="p-4 border-b border-r border-polman-primary text-left text-xs font-bold uppercase sticky left-0 bg-polman-secondary z-10 w-64">CPL \ PPM</th>
                                {ppms.map(ppm => (
                                    <th
                                        key={ppm.id}
                                        title={ppm.deskripsi || ppm.kode}
                                        className="p-4 border-b border-polman-primary text-center text-[10px] font-bold uppercase min-w-[80px] relative group cursor-pointer"
                                    >
                                        {ppm.kode}

                                        {ppm.deskripsi && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-48 p-2.5 bg-gray-900 text-white text-xs font-normal normal-case rounded-lg shadow-xl z-50 pointer-events-none text-left">
                                                <div className="font-bold border-b border-gray-700 pb-1 mb-1">{ppm.kode}</div>
                                                {ppm.deskripsi}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {!cpls || cpls.length === 0 ? (
                                <tr><td colSpan={ppms.length + 1} className="p-8 text-center text-gray-500">Data belum tersedia.</td></tr>
                            ) : cpls.map(cpl => (
                                <tr key={cpl.id} className="hover:bg-gray-50">
                                    <td className="p-4 border-b border-r sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <div className="font-bold text-sm text-polman-secondary">{cpl.kode}</div>
                                    </td>
                                    {ppms.map(ppm => {
                                        const isLinked = cplToPpmMatrix[cpl.id] && cplToPpmMatrix[cpl.id][ppm.id];
                                        return (
                                            <td key={ppm.id} className="p-4 border-b text-center bg-gray-50/30">
                                                {isLinked ? <div className="w-6 h-6 mx-auto bg-polman-secondary rounded flex items-center justify-center text-white font-bold text-xs shadow-sm">✓</div> : <div className="text-gray-300">-</div>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
