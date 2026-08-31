import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface Props {
    ieas: any[];
    cpls: any[];
    matrix: any; // Format: { iea_id: { cpl_id: true } }
}

export default function IeaCplMatrix({ ieas, cpls, matrix }: Props) {
    
    const handleSync = (ieaId: number, cplId: number, isSelected: boolean) => {
        router.post('/matrix/sync-iea-cpl', {
            iea_id: ieaId,
            cpl_id: cplId,
            is_selected: isSelected
        }, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Matrix IEA x CPL" />
            
            <div className="mb-6">
                <h2 className="font-headline font-bold text-2xl text-gray-900">Pemetaan IEA x CPL</h2>
                <p className="text-gray-500 text-sm mt-1">Tentukan keterkaitan antara Indikator Elemen Able dengan Capaian Pembelajaran Lulusan.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-polman-neutral">
                            <th className="p-4 border-b border-r text-left text-xs font-bold text-gray-500 uppercase sticky left-0 bg-polman-neutral z-20 min-w-[220px] max-w-[280px]">
                                IEA \ CPL
                            </th>
                            {cpls.map(cpl => (
                                <th 
                                    key={cpl.id} 
                                    title={cpl.deskripsi || cpl.kode}
                                    className="p-4 border-b text-center text-[10px] font-bold text-polman-primary uppercase min-w-[80px] relative group cursor-pointer"
                                >
                                    {cpl.kode}

                                    {/* Pop-up penjelasan saat CPL di-hover */}
                                    {cpl.deskripsi && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2.5 bg-gray-900 text-white text-xs font-normal normal-case rounded-lg shadow-xl z-50 pointer-events-none text-left">
                                            <div className="font-bold border-b border-gray-700 pb-1 mb-1">{cpl.kode}</div>
                                            {cpl.deskripsi}
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {ieas.map(iea => (
                            <tr key={iea.id} className="hover:bg-gray-50 transition-colors">
                                {/* Kolom IEA kiri dengan indensi rapi */}
                                <td className="p-4 border-b border-r sticky left-0 bg-white font-bold text-sm text-gray-700 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] min-w-[220px] max-w-[280px]">
                                    <div className="flex flex-col">
                                        <span className="text-polman-primary font-bold">{iea.kode}</span>
                                        <span className="text-xs font-normal text-gray-500 whitespace-normal break-words leading-relaxed mt-1">
                                            {iea.deskripsi}
                                        </span>
                                    </div>
                                </td>
                                {cpls.map(cpl => {
                                    const isChecked = matrix[iea.id] && matrix[iea.id][cpl.id];
                                    return (
                                        <td key={cpl.id} className="p-4 border-b text-center">
                                            <input 
                                                type="checkbox"
                                                checked={!!isChecked}
                                                onChange={(e) => handleSync(iea.id, cpl.id, e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-polman-primary focus:ring-polman-primary cursor-pointer transition-all"
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}