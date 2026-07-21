import React, { useState } from 'react';
import { Head, useForm, router, useRemember, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Dialog } from '@headlessui/react';
import axios from 'axios';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip 
} from 'recharts';

interface IndikatorKinerja { id: number; kode: string; }
interface CPMK { id: number; kode_cpmk: string; deskripsi: string; indikator_kinerjas?: IndikatorKinerja[]; }
interface CPL { id: number; kode: string; deskripsi: string; indikator_kinerjas: IndikatorKinerja[]; }
interface MataKuliah { id: number; kode_mk: string; nama_mk: string; }
interface DosenBiodata {
    id: number;
    nama_lengkap: string;
    gelar_depan: string | null;
    gelar_belakang: string | null;
    nip: string;
}
interface Rps {
    id: number;
    mata_kuliah_id: number;
    dosen_biodata_id: number | null;
    tahun_akademik: string;
    kode_dokumen?: string;
    mata_kuliah: MataKuliah;
    dosen_biodata?: DosenBiodata | null;
    tanggal_penyusunan: string;
    pustaka_utama: string;
    pustaka_pendukung: string;
    bahan_kajian_utama: string;
    penilaians: any[];
    details: any[];
    status: 'menunggu_verifikasi' | 'disetujui';
}

const dosenFullName = (d: DosenBiodata) =>
    [d.gelar_depan, d.nama_lengkap, d.gelar_belakang].filter(Boolean).join(' ');

const pembelajaranLabels = {
    modalitas: 'Modalitas',
    bentuk: 'Bentuk',
    strategi: 'Strategi',
    metode: 'Metode',
    media: 'Media',
    sumber_belajar: 'Sumber belajar',
};

const parsePembelajaran = (text: string = '') => {
    const result = {
        modalitas: '',
        bentuk: '',
        strategi: '',
        metode: '',
        media: '',
        sumber_belajar: '',
    };

    const labelToKey = Object.fromEntries(
        Object.entries(pembelajaranLabels).map(([key, label]) => [label.toLowerCase(), key])
    ) as Record<string, keyof typeof result>;

    const hasKnownFormat = Object.values(pembelajaranLabels).some(label => text.includes(`${label}:`));

    if (!hasKnownFormat) {
        result.modalitas = text;
        return result;
    }

    let currentKey: keyof typeof result | null = null;

    text.split(/\r?\n/).forEach(line => {
        const labelMatch = line.trim().match(/^(Modalitas|Bentuk|Strategi|Metode|Media|Sumber belajar):\s*(.*)$/i);

        if (labelMatch) {
            currentKey = labelToKey[labelMatch[1].toLowerCase()];
            const inlineValue = labelMatch[2]?.trim();
            if (currentKey && inlineValue) {
                result[currentKey] = inlineValue;
            }
            return;
        }

        if (currentKey) {
            result[currentKey] = result[currentKey]
                ? `${result[currentKey]}\n${line}`
                : line;
        }
    });

    Object.keys(result).forEach(key => {
        result[key as keyof typeof result] = result[key as keyof typeof result].trim();
    });

    return result;
};

const buildPembelajaran = (values: ReturnType<typeof parsePembelajaran>) => {
    return [
        `${pembelajaranLabels.modalitas}:\n${values.modalitas}`,
        `${pembelajaranLabels.bentuk}:\n${values.bentuk}`,
        `${pembelajaranLabels.strategi}:\n${values.strategi}`,
        `${pembelajaranLabels.metode}:\n${values.metode}`,
        `${pembelajaranLabels.media}:\n${values.media}`,
        `${pembelajaranLabels.sumber_belajar}:\n${values.sumber_belajar}`,
    ].join('\n');
};

export default function RpsIndex({ rps, mataKuliahs, allDosen }: { rps: Rps[], mataKuliahs: MataKuliah[], allDosen: DosenBiodata[] }) {
    const { roles } = usePage().props.auth as any;
    const isDosen = roles?.includes('Dosen') && !roles?.includes('Kaprodi');
    const isKaprodi = roles?.includes('Kaprodi');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [cpmks, setCpmks] = useState<CPMK[]>([]);
    const [cpls, setCpls] = useState<CPL[]>([]);
    const [dosenPengampuMk, setDosenPengampuMk] = useState<DosenBiodata[]>([]);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [verifyId, setVerifyId] = useState<number | null>(null);
    const [batalVerifyId, setBatalVerifyId] = useState<number | null>(null);

    // -- Kelola CPMK inline di form RPS --
    const emptyCpmkForm = { id: null as number | null, kode_cpmk: '', deskripsi: '', indikator_ids: [] as number[] };
    const [cpmkForm, setCpmkForm] = useState(emptyCpmkForm);
    const [savingCpmk, setSavingCpmk] = useState(false);
    const [cpmkFormError, setCpmkFormError] = useState('');
    const [deleteCpmkId, setDeleteCpmkId] = useState<number | null>(null);
    const [search, setSearch] = useRemember('', 'rps.search');
    // FIX: pakai useRemember biar nomor halaman gak balik ke 1 pas
    // navigasi pergi-pulang (misal abis cetak PDF di tab baru terus balik)
    const [page, setPage] = useRemember(1, 'rps.page');
    const PER_PAGE = 10;

    const filtered = rps.filter((item) =>
        item.mata_kuliah?.kode_mk.toLowerCase().includes(search.toLowerCase()) ||
        item.mata_kuliah?.nama_mk.toLowerCase().includes(search.toLowerCase()) ||
        (item.dosen_biodata ? dosenFullName(item.dosen_biodata).toLowerCase().includes(search.toLowerCase()) : false) ||
        item.tahun_akademik.includes(search)
    );
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const { data, setData, post, reset, processing, errors, clearErrors } = useForm({
        mata_kuliah_id: '',
        dosen_biodata_id: '' as string | number,
        tahun_akademik: '',
        kode_dokumen: '',
        tanggal_penyusunan: new Date().toISOString().split('T')[0],
        pustaka_utama: '',
        pustaka_pendukung: '',
        bahan_kajian_utama: '', 
        tte_dosen: null as File | null,     
        tte_kaprodi: null as File | null,   
        tte_kajur: null as File | null,
        komponen_labels: {
            quiz: 'Quiz',
            tugas: 'Tugas',
            project: 'Project',
            uts: 'UTS',
            uas: 'UAS',
        } as Record<string, string>,
        penilaians: [] as any[],
        details: [{ pertemuan_ke: '', kemampuan_akhir: '', indikator: '', bahan_kajian: '', metode_pembelajaran: '', estimasi_waktu: '', pengalaman_belajar: '', penilaian_komponen: '', penilaian_bobot: 0 }],
        _method: 'POST'
    });

    const [mkQuery, setMkQuery] = useState('');
    const [mkDropdownOpen, setMkDropdownOpen] = useState(false);
    const mkDropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (mkDropdownRef.current && !mkDropdownRef.current.contains(e.target as Node)) {
                setMkDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchMkData = async (mkId: string | number) => {
        const res = await axios.get(`/mata-kuliah/${mkId}/rps-data`);
        return res.data.data;
    };

    const handleMkChange = async (mk_id: string) => {
        setData('mata_kuliah_id', mk_id);
        setDosenPengampuMk([]);
        setCpls([]);
        setCpmkForm(emptyCpmkForm);
        setCpmkFormError('');
        if (!mk_id) return;
        try {
            const mkData = await fetchMkData(mk_id);
            const fetchedCpmks = mkData.cpmks;
            const fetchedDosen = mkData.dosen_pengampu || [];
            setCpmks(fetchedCpmks);
            setCpls(mkData.cpls || []);
            setDosenPengampuMk(fetchedDosen);
            setData('penilaians', fetchedCpmks.map((c: CPMK) => ({
                cpmk_id: c.id, quiz: 0, tugas: 0, project: 0, uts: 0, uas: 0
            })));
        } catch (error) {
            console.error("Gagal menarik data RPS MK", error);
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        reset();
        clearErrors();
        setCpmks([]);
        setCpls([]);
        setDosenPengampuMk([]);
        setCpmkForm(emptyCpmkForm);
        setCpmkFormError('');
        setData({
            mata_kuliah_id: '',
            dosen_biodata_id: '',
            tahun_akademik: '',
            kode_dokumen: '',
            tanggal_penyusunan: new Date().toISOString().split('T')[0],
            pustaka_utama: '',
            pustaka_pendukung: '',
            bahan_kajian_utama: '',
            tte_dosen: null,
            tte_kaprodi: null,
            tte_kajur: null,
            komponen_labels: { quiz: 'Quiz', tugas: 'Tugas', project: 'Project', uts: 'UTS', uas: 'UAS' },
            penilaians: [],
            details: [{ pertemuan_ke: '', kemampuan_akhir: '', indikator: '', bahan_kajian: '', metode_pembelajaran: '', estimasi_waktu: '', pengalaman_belajar: '', penilaian_komponen: '', penilaian_bobot: 0 }],
            _method: 'POST'
        });
        setIsModalOpen(true);
    };

    const openEditModal = async (item: Rps) => {
        setModalMode('edit');
        setSelectedId(item.id);
        clearErrors();
        
        let loadedPenilaians = item.penilaians || [];

        setCpmkForm(emptyCpmkForm);
        setCpmkFormError('');

        // Tarik struktur CPMK, CPL, dan dosen pengampu untuk render
        try {
            const mkData = await fetchMkData(item.mata_kuliah_id);
            const fetchedCpmks = mkData.cpmks;
            const fetchedDosen = mkData.dosen_pengampu || [];
            setCpmks(fetchedCpmks);
            setCpls(mkData.cpls || []);
            setDosenPengampuMk(fetchedDosen);

            // JARING PENGAMAN: Jika matriks kosong
            if (loadedPenilaians.length === 0) {
                loadedPenilaians = fetchedCpmks.map((c: CPMK) => ({
                    cpmk_id: c.id, quiz: 0, tugas: 0, project: 0, uts: 0, uas: 0
                }));
            }
        } catch (error) {
            console.error("Gagal menarik data RPS MK", error);
        }

        // Timpa state form dengan data yang ada di database
        setData({
            mata_kuliah_id: item.mata_kuliah_id.toString(),
            dosen_biodata_id: item.dosen_biodata_id || '',
            tahun_akademik: item.tahun_akademik,
            kode_dokumen: item.kode_dokumen || '',
            tanggal_penyusunan: item.tanggal_penyusunan,
            pustaka_utama: item.pustaka_utama,
            pustaka_pendukung: item.pustaka_pendukung || '',
            bahan_kajian_utama: item.bahan_kajian_utama || '',
            tte_dosen: null,   
            tte_kaprodi: null,
            tte_kajur: null,
            komponen_labels: (() => {
                const kl = (item as any).komponen_labels;
                if (typeof kl === 'string') {
                    try { return JSON.parse(kl); } catch { /* fall through to default */ }
                }
                return kl || { quiz: 'Quiz', tugas: 'Tugas', project: 'Project', uts: 'UTS', uas: 'UAS' };
            })(),
            penilaians: loadedPenilaians,
            details: (item.details && item.details.length > 0) 
                     ? item.details 
                     : [{ pertemuan_ke: '', kemampuan_akhir: '', indikator: '', bahan_kajian: '', metode_pembelajaran: '', estimasi_waktu: '', pengalaman_belajar: '', penilaian_komponen: '', penilaian_bobot: 0 }],
            _method: 'PUT'
        });

        setIsModalOpen(true);
    };

    const addMingguan = () => setData('details', [...data.details, { pertemuan_ke: '', kemampuan_akhir: '', indikator: '', bahan_kajian: '', metode_pembelajaran: '', estimasi_waktu: '', pengalaman_belajar: '', penilaian_komponen: '', penilaian_bobot: 0 }]);
    const removeMingguan = (index: number) => setData('details', data.details.filter((_, i) => i !== index));

    // -- Kelola CPMK inline --
    const toggleCpmkIndikator = (ikId: number) => {
        setCpmkForm(f => ({
            ...f,
            indikator_ids: f.indikator_ids.includes(ikId)
                ? f.indikator_ids.filter(id => id !== ikId)
                : [...f.indikator_ids, ikId],
        }));
    };

    const editCpmkRow = (c: CPMK) => {
        setCpmkForm({
            id: c.id,
            kode_cpmk: c.kode_cpmk,
            deskripsi: c.deskripsi,
            indikator_ids: (c.indikator_kinerjas || []).map(ik => ik.id),
        });
        setCpmkFormError('');
    };

    const cancelEditCpmk = () => { setCpmkForm(emptyCpmkForm); setCpmkFormError(''); };

    // Setelah CPMK ditambah/diedit/dihapus: tarik ulang daftar CPMK & CPL,
    // lalu sinkronkan data.penilaians -- baris CPMK yang masih ada TETAP
    // dipertahankan bobotnya, baris baru ditambah dengan bobot 0, baris
    // CPMK yang sudah dihapus ikut hilang.
    const refreshCpmksAfterChange = async () => {
        if (!data.mata_kuliah_id) return;
        const mkData = await fetchMkData(data.mata_kuliah_id);
        const fetchedCpmks: CPMK[] = mkData.cpmks;
        setCpmks(fetchedCpmks);
        setCpls(mkData.cpls || []);

        const existingByCpmkId = Object.fromEntries((data.penilaians || []).map((p: any) => [p.cpmk_id, p]));
        const merged = fetchedCpmks.map(c => existingByCpmkId[c.id] || {
            cpmk_id: c.id, quiz: 0, tugas: 0, project: 0, uts: 0, uas: 0,
        });
        setData('penilaians', merged);
    };

    const submitCpmk = async () => {
        if (!data.mata_kuliah_id) return;
        if (!cpmkForm.kode_cpmk.trim() || !cpmkForm.deskripsi.trim() || cpmkForm.indikator_ids.length === 0) {
            setCpmkFormError('Kode CPMK, deskripsi, dan minimal 1 Indikator Kinerja wajib diisi.');
            return;
        }
        setSavingCpmk(true);
        setCpmkFormError('');
        try {
            const payload = {
                mata_kuliah_id: data.mata_kuliah_id,
                kode_cpmk: cpmkForm.kode_cpmk,
                deskripsi: cpmkForm.deskripsi,
                indikator_ids: cpmkForm.indikator_ids,
            };
            if (cpmkForm.id) {
                await axios.put(`/cpmk/${cpmkForm.id}`, payload);
            } else {
                await axios.post('/cpmk', payload);
            }
            await refreshCpmksAfterChange();
            setCpmkForm(emptyCpmkForm);
        } catch (error: any) {
            console.error('Gagal menyimpan CPMK', error);
            setCpmkFormError(error?.response?.data?.message || 'Gagal menyimpan CPMK. Coba lagi.');
        } finally {
            setSavingCpmk(false);
        }
    };

    const confirmDeleteCpmk = async () => {
        if (!deleteCpmkId) return;
        try {
            await axios.delete(`/cpmk/${deleteCpmkId}`);
            await refreshCpmksAfterChange();
        } catch (error) {
            console.error('Gagal menghapus CPMK', error);
        } finally {
            setDeleteCpmkId(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Memaksa Inertia mengirim object/array kompleks dengan sempurna
        if (modalMode === 'add') {
            post(route('rps.store'), { 
                forceFormData: true, 
                onSuccess: () => setIsModalOpen(false) 
            });
        } else {
            post(route('rps.update', selectedId!), { 
                forceFormData: true, 
                onSuccess: () => setIsModalOpen(false) 
            });
        }
    };

    const confirmDelete = () => {
        if (deleteId) {
            router.delete(`/rps/${deleteId}`, { 
                preserveScroll: true,
                onSuccess: () => setDeleteId(null) 
            });
        }
    };

    // Fungsi bantu untuk handle input angka yang pakai koma (,)
    const parseDecimal = (val: string) => parseFloat(val.replace(',', '.')) || 0;

    const updatePembelajaranField = (idx: number, field: keyof ReturnType<typeof parsePembelajaran>, value: string) => {
        const d = [...data.details];
        const parsed = parsePembelajaran(d[idx].metode_pembelajaran || '');
        parsed[field] = value;
        d[idx].metode_pembelajaran = buildPembelajaran(parsed);
        setData('details', d);
    };

    // Format data untuk Recharts
    const chartData = data.penilaians.map((p, idx) => ({
        name: cpmks[idx]?.kode_cpmk || `CPMK-${idx + 1}`,
        Quiz: Number(p.quiz) || 0,
        Tugas: Number(p.tugas) || 0,
        Project: Number(p.project) || 0,
        UTS: Number(p.uts) || 0,
        UAS: Number(p.uas) || 0,
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Daftar RPS" />
            
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="font-headline font-bold text-2xl text-gray-900">Rencana Pembelajaran Semester</h2>
                    <p className="text-gray-500 text-sm font-body mt-1">Kelola dokumen RPS Mata Kuliah.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Cari RPS, dosen..."
                            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-polman-primary w-52"
                        />
                    </div>
                    <button onClick={openAddModal} className="bg-polman-primary hover:bg-polman-secondary text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors">
                        + Tambah RPS
                    </button>
                </div>
            </div>

            {/* TABEL LIST RPS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden font-body">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Mata Kuliah</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Tahun Akademik</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Dosen Penyusun</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginated.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-400">
                                {search ? 'Tidak ada RPS yang cocok.' : 'Belum ada dokumen RPS.'}
                            </td></tr>
                        ) : (
                            paginated.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-polman-primary">{item.mata_kuliah?.kode_mk}</div>
                                        <div className="font-medium text-gray-800">{item.mata_kuliah?.nama_mk}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-gray-600">
                                        {item.tahun_akademik}
                                        <div className="text-xs text-gray-400 mt-1">{item.kode_dokumen}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{item.dosen_biodata ? dosenFullName(item.dosen_biodata) : '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        {item.status === 'disetujui' ? (
                                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Disetujui
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                                                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> Menunggu Verifikasi
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <a href={route('rps.pdf', item.id)} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-900 font-bold px-2 text-sm transition-colors">Print</a>
                                            {isKaprodi && item.status !== 'disetujui' && (
                                                <button onClick={() => setVerifyId(item.id)} className="text-green-600 hover:text-green-800 font-bold px-2 text-sm transition-colors">Verifikasi</button>
                                            )}
                                            {isKaprodi && item.status === 'disetujui' && (
                                                <button onClick={() => setBatalVerifyId(item.id)} className="text-orange-500 hover:text-orange-700 font-bold px-2 text-sm transition-colors">Batal Verifikasi</button>
                                            )}
                                            <button onClick={() => openEditModal(item)} className="text-blue-600 hover:text-blue-800 font-bold px-2 text-sm transition-colors">Edit</button>
                                            <button onClick={() => setDeleteId(item.id)} className="text-red-500 hover:text-red-700 font-bold px-2 text-sm transition-colors">Hapus</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-bold">Halaman {page} dari {totalPages} ({filtered.length} RPS)</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(page - 1)} disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg text-xs font-black border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-polman-primary hover:text-white hover:border-polman-primary transition-all">
                                ← Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${p === page ? 'bg-polman-primary text-white' : 'border border-gray-200 text-gray-500 hover:border-polman-primary hover:text-polman-primary'}`}>
                                    {p}
                                </button>
                            ))}
                            <button onClick={() => setPage(page + 1)} disabled={page === totalPages}
                                className="px-3 py-1.5 rounded-lg text-xs font-black border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-polman-primary hover:text-white hover:border-polman-primary transition-all">
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL KONFIRMASI HAPUS (ESTETIK) */}
            <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)} className="relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl font-body text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <Dialog.Title className="text-lg font-bold text-gray-900 mb-2">Hapus Dokumen RPS?</Dialog.Title>
                        <p className="text-sm text-gray-500 mb-6">Tindakan ini tidak dapat diurungkan. Seluruh matriks penilaian dan rencana mingguan terkait akan ikut terhapus selamanya.</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Batal</button>
                            <button onClick={confirmDelete} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm">Ya, Hapus!</button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* MODAL KONFIRMASI HAPUS CPMK */}
            <Dialog open={deleteCpmkId !== null} onClose={() => setDeleteCpmkId(null)} className="relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl font-body text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <Dialog.Title className="text-lg font-bold text-gray-900 mb-2">Hapus CPMK ini?</Dialog.Title>
                        <p className="text-sm text-gray-500 mb-6">Bobot penilaian yang sudah diisi untuk CPMK ini di bagian Sistem Evaluasi akan ikut hilang.</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setDeleteCpmkId(null)} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Batal</button>
                            <button onClick={confirmDeleteCpmk} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm">Ya, Hapus!</button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* MODAL KONFIRMASI VERIFIKASI RPS */}
            <Dialog open={verifyId !== null} onClose={() => setVerifyId(null)} className="relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl font-body text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <Dialog.Title className="text-lg font-bold text-gray-900 mb-2">Verifikasi RPS ini?</Dialog.Title>
                        <p className="text-sm text-gray-500 mb-6">
                            {(() => {
                                const item = rps.find(r => r.id === verifyId);
                                return item
                                    ? <>Pastikan Anda sudah memeriksa kembali isi RPS <span className="font-bold">{item.mata_kuliah?.nama_mk}</span> ({item.mata_kuliah?.kode_mk}) sebelum disetujui. Status akan berubah menjadi "Disetujui".</>
                                    : 'Pastikan Anda sudah memeriksa kembali isi RPS ini sebelum disetujui.';
                            })()}
                        </p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setVerifyId(null)} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Periksa Lagi</button>
                            <button
                                onClick={() => {
                                    if (verifyId) router.patch(route('rps.verifikasi', verifyId), {}, { preserveScroll: true });
                                    setVerifyId(null);
                                }}
                                className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                            >
                                Ya, Setujui
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* MODAL KONFIRMASI BATAL VERIFIKASI RPS */}
            <Dialog open={batalVerifyId !== null} onClose={() => setBatalVerifyId(null)} className="relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl font-body text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                            <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <Dialog.Title className="text-lg font-bold text-gray-900 mb-2">Batalkan verifikasi RPS ini?</Dialog.Title>
                        <p className="text-sm text-gray-500 mb-6">
                            {(() => {
                                const item = rps.find(r => r.id === batalVerifyId);
                                return item
                                    ? <>Status RPS <span className="font-bold">{item.mata_kuliah?.nama_mk}</span> ({item.mata_kuliah?.kode_mk}) akan kembali menjadi "Menunggu Verifikasi".</>
                                    : 'Status RPS ini akan kembali menjadi "Menunggu Verifikasi".';
                            })()}
                        </p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setBatalVerifyId(null)} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Batal</button>
                            <button
                                onClick={() => {
                                    if (batalVerifyId) router.patch(route('rps.batal-verifikasi', batalVerifyId), {}, { preserveScroll: true });
                                    setBatalVerifyId(null);
                                }}
                                className="px-4 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shadow-sm"
                            >
                                Ya, Batalkan
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* MODAL FORM RPS UTAMA */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white p-6 rounded-2xl w-full max-w-5xl shadow-2xl font-body overflow-y-auto max-h-[90vh]">
                        <Dialog.Title className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">
                            {modalMode === 'add' ? 'Tambah Dokumen RPS' : 'Edit Dokumen RPS'}
                        </Dialog.Title>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* IDENTITAS */}
                            <div className="grid grid-cols-3 gap-4">
                                <div ref={mkDropdownRef} className="relative">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Mata Kuliah</label>
                                    {isDosen && modalMode === 'add' && (
                                        <p className="text-[11px] text-gray-400 mb-1">
                                            {mataKuliahs.length > 0
                                                ? `Menampilkan ${mataKuliahs.length} matkul yang Anda ampu: ${mataKuliahs.map(m => m.kode_mk).join(', ')}`
                                                : 'Anda belum di-assign sebagai dosen pengampu matkul manapun. Hubungi Kaprodi.'}
                                        </p>
                                    )}
                                    <div
                                        className={`w-full border border-gray-300 rounded text-sm px-3 py-2 flex items-center justify-between ${modalMode === 'edit' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white cursor-pointer'}`}
                                        onClick={() => { if (modalMode !== 'edit') setMkDropdownOpen(o => !o); }}
                                    >
                                        <span className={data.mata_kuliah_id ? 'text-gray-900' : 'text-gray-400'}>
                                            {(() => {
                                                const mk = mataKuliahs.find(m => m.id === Number(data.mata_kuliah_id));
                                                return mk ? `${mk.kode_mk} - ${mk.nama_mk}` : '-- Pilih Mata Kuliah --';
                                            })()}
                                        </span>
                                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${mkDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>

                                    {mkDropdownOpen && modalMode !== 'edit' && (
                                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                                            <input
                                                type="text"
                                                autoFocus
                                                className="w-full border-b border-gray-200 rounded-t-md text-sm px-3 py-2 focus:outline-none"
                                                placeholder="Ketik kode atau nama mata kuliah..."
                                                value={mkQuery}
                                                onChange={e => setMkQuery(e.target.value)}
                                            />
                                            <div className="max-h-60 overflow-auto py-1">
                                                {mataKuliahs
                                                    .filter(mk =>
                                                        mkQuery === '' ||
                                                        mk.kode_mk.toLowerCase().includes(mkQuery.toLowerCase()) ||
                                                        mk.nama_mk.toLowerCase().includes(mkQuery.toLowerCase())
                                                    )
                                                    .map(mk => (
                                                        <div
                                                            key={mk.id}
                                                            onClick={() => { handleMkChange(mk.id.toString()); setMkDropdownOpen(false); setMkQuery(''); }}
                                                            className={`cursor-pointer select-none px-3 py-2 text-sm hover:bg-polman-primary hover:text-white ${Number(data.mata_kuliah_id) === mk.id ? 'bg-teal-50 font-bold' : 'text-gray-900'}`}
                                                        >
                                                            {mk.kode_mk} - {mk.nama_mk}
                                                        </div>
                                                    ))
                                                }
                                                {mataKuliahs.filter(mk =>
                                                    mkQuery === '' ||
                                                    mk.kode_mk.toLowerCase().includes(mkQuery.toLowerCase()) ||
                                                    mk.nama_mk.toLowerCase().includes(mkQuery.toLowerCase())
                                                ).length === 0 && (
                                                    <div className="px-3 py-2 text-sm text-gray-400 italic">Mata kuliah tidak ditemukan.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {errors.mata_kuliah_id && <span className="text-red-500 text-xs">{errors.mata_kuliah_id}</span>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Tahun Akademik</label>
                                    <select className="w-full border-gray-300 rounded text-sm" value={data.tahun_akademik} onChange={e => setData('tahun_akademik', e.target.value)} required>
                                        <option value="">-- Pilih Tahun Akademik --</option>
                                        {Array.from({ length: new Date().getFullYear() + 4 - 2020 }, (_, i) => {
                                            const start = 2020 + i;
                                            return `${start}/${start + 1}`;
                                        }).map(tahun => (
                                            <option key={tahun} value={tahun}>{tahun}</option>
                                        ))}
                                    </select>
                                    {errors.tahun_akademik && <span className="text-red-500 text-xs">{errors.tahun_akademik}</span>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Kode Dokumen RPS</label>
                                    <select className="w-full border-gray-300 rounded text-sm" value={data.kode_dokumen} onChange={e => setData('kode_dokumen', e.target.value)} required>
                                        <option value="">-- Pilih Kode --</option>
                                        <option value="RPS_TRIN">RPS_TRIN</option>
                                        <option value="RPS_TRO">RPS_TRO</option>
                                        <option value="RPS_TRMO">RPS_TRMO</option>
                                        <option value="RPS_TRSA">RPS_TRSA</option>
                                    </select>
                                </div>
                                
                                {/* DOSEN PENGAMPU */}
                                <div className="col-span-3">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Dosen Pengampu</label>
                                    {dosenPengampuMk.length > 0 ? (
                                        <select className="w-full border-gray-300 rounded text-sm" value={data.dosen_biodata_id} onChange={e => setData('dosen_biodata_id', e.target.value ? Number(e.target.value) : '')} required>
                                            <option value="">-- Pilih Dosen Pengampu --</option>
                                            {dosenPengampuMk.map(d => (
                                                <option key={d.id} value={d.id}>{dosenFullName(d)} (NIP: {d.nip})</option>
                                            ))}
                                        </select>
                                    ) : data.mata_kuliah_id ? (
                                        <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg p-2">Belum ada dosen pengampu yang di-assign ke MK ini. Hubungi Kaprodi untuk menambahkan via halaman Kelola Dosen Pengampu.</p>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">Pilih Mata Kuliah terlebih dahulu.</p>
                                    )}
                                    {errors.dosen_biodata_id && <span className="text-red-500 text-xs">{errors.dosen_biodata_id}</span>}
                                </div>

                                {/* UPLOAD TTE (3 Kolom) */}
                                <div className="col-span-3 mt-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 border-b pb-1">Upload QR Code / Tanda Tangan Elektronik</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Dosen Pengampu</label>
                                            <input type="file" accept=".png,.jpg,.jpeg,.pdf" className="w-full border-gray-300 rounded text-xs p-1.5 border" onChange={e => setData('tte_dosen', e.target.files ? e.target.files[0] : null)} />
                                            {errors.tte_dosen && <span className="text-red-500 text-xs">{errors.tte_dosen}</span>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Kepala Program Studi</label>
                                            <input type="file" accept=".png,.jpg,.jpeg,.pdf" className="w-full border-gray-300 rounded text-xs p-1.5 border" onChange={e => setData('tte_kaprodi', e.target.files ? e.target.files[0] : null)} />
                                            {errors.tte_kaprodi && <span className="text-red-500 text-xs">{errors.tte_kaprodi}</span>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Ketua Jurusan</label>
                                            <input type="file" accept=".png,.jpg,.jpeg,.pdf" className="w-full border-gray-300 rounded text-xs p-1.5 border" onChange={e => setData('tte_kajur', e.target.files ? e.target.files[0] : null)} />
                                            {errors.tte_kajur && <span className="text-red-500 text-xs">{errors.tte_kajur}</span>}
                                        </div>
                                    </div>
                                    {modalMode === 'edit' && <p className="text-xs text-blue-500 mt-2 italic">* Kosongkan kolom TTE di atas jika tidak ingin mengubah file yang sudah diupload sebelumnya.</p>}
                                </div>
                            </div>

                            {/* KELOLA CPMK (langsung di form RPS, dosen pengampu boleh kelola sendiri) */}
                            {data.mata_kuliah_id && (() => {
                                // Lookup cepat: dari 1 IK, cari tau dia "anak" CPL yang mana
                                const ikToCpl: Record<number, CPL> = {};
                                cpls.forEach(cpl => cpl.indikator_kinerjas.forEach(ik => { ikToCpl[ik.id] = cpl; }));

                                return (
                                <div className="border border-teal-100 bg-teal-50/40 rounded-lg p-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-1 border-b pb-1">
                                        Kelola CPMK
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Tiap CPMK dipetakan ke satu atau lebih <span className="font-bold">Indikator Kinerja (IK)</span>,
                                        dan tiap IK adalah bagian dari satu <span className="font-bold">Capaian Pembelajaran Lulusan (CPL)</span> prodi.
                                    </p>

                                    {cpls.length === 0 ? (
                                        <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
                                            Belum ada CPL/Indikator Kinerja yang di-setup untuk prodi ini. Hubungi Kaprodi.
                                        </p>
                                    ) : (
                                        <>
                                            {/* Daftar CPMK yang sudah ada */}
                                            {cpmks.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {cpmks.map(c => (
                                                        <div key={c.id} className="flex items-start justify-between bg-white border border-gray-200 rounded-lg p-3">
                                                            <div className="flex-1">
                                                                <span className="font-bold text-polman-primary text-sm">{c.kode_cpmk}</span>
                                                                <p className="text-xs text-gray-600 mt-1 mb-2">{c.deskripsi}</p>
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    {(c.indikator_kinerjas || []).map(ik => {
                                                                        const parentCpl = ikToCpl[ik.id];
                                                                        return (
                                                                            <span key={ik.id} className="inline-flex items-center rounded-full overflow-hidden border border-teal-200 text-[11px] font-bold">
                                                                                <span className="bg-teal-50 text-teal-500 px-2 py-0.5">{parentCpl?.kode || '?'}</span>
                                                                                <span className="bg-teal-600 text-white px-2 py-0.5">{ik.kode}</span>
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                                                <button type="button" onClick={() => editCpmkRow(c)} className="text-blue-600 hover:text-blue-800 font-bold text-xs">Edit</button>
                                                                <button type="button" onClick={() => setDeleteCpmkId(c.id)} className="text-red-500 hover:text-red-700 font-bold text-xs">Hapus</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Form tambah / edit CPMK */}
                                            <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4">
                                                <p className="text-sm font-bold text-gray-700 mb-3">{cpmkForm.id ? 'Edit CPMK' : 'Tambah CPMK Baru'}</p>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-gray-500 mb-1">Kode CPMK</label>
                                                        <input type="text" placeholder="cth: CPMK-1" className="w-full border-gray-300 rounded text-sm"
                                                            value={cpmkForm.kode_cpmk}
                                                            onChange={e => setCpmkForm(f => ({ ...f, kode_cpmk: e.target.value }))} />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-[11px] font-bold text-gray-500 mb-1">Deskripsi</label>
                                                        <input type="text" placeholder="Mahasiswa mampu ..." className="w-full border-gray-300 rounded text-sm"
                                                            value={cpmkForm.deskripsi}
                                                            onChange={e => setCpmkForm(f => ({ ...f, deskripsi: e.target.value }))} />
                                                    </div>
                                                </div>

                                                {/* Step 2: pilih CPL & IK dengan konteks yang jelas */}
                                                <div className="mt-4">
                                                    <label className="block text-[11px] font-bold text-gray-500 mb-2">
                                                        CPMK ini menuju Indikator Kinerja mana? <span className="font-normal text-gray-400">(pilih 1 atau lebih)</span>
                                                    </label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                                                        {cpls.map(cpl => {
                                                            const jumlahDipilih = cpl.indikator_kinerjas.filter(ik => cpmkForm.indikator_ids.includes(ik.id)).length;
                                                            return (
                                                                <div key={cpl.id} className={`border rounded-lg p-2.5 ${jumlahDipilih > 0 ? 'border-teal-300 bg-teal-50/50' : 'border-gray-200 bg-gray-50'}`}>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-bold text-gray-800">{cpl.kode}</span>
                                                                        {jumlahDipilih > 0 && (
                                                                            <span className="text-[10px] bg-teal-600 text-white font-bold px-1.5 rounded-full">{jumlahDipilih} dipilih</span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-500 mt-0.5 mb-2 leading-snug">{cpl.deskripsi}</p>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {cpl.indikator_kinerjas.map(ik => (
                                                                            <label key={ik.id} className={`text-[11px] font-bold px-2 py-0.5 rounded-full border cursor-pointer select-none transition-colors ${cpmkForm.indikator_ids.includes(ik.id) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'}`}>
                                                                                <input type="checkbox" className="hidden" checked={cpmkForm.indikator_ids.includes(ik.id)} onChange={() => toggleCpmkIndikator(ik.id)} />
                                                                                {ik.kode}
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {cpmkFormError && <p className="text-red-500 text-xs mt-2">{cpmkFormError}</p>}

                                                <div className="flex items-center gap-2 mt-3">
                                                    <button type="button" disabled={savingCpmk} onClick={submitCpmk} className="bg-polman-primary hover:bg-polman-secondary text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50">
                                                        {savingCpmk ? 'Menyimpan...' : cpmkForm.id ? 'Simpan Perubahan' : 'Tambah CPMK'}
                                                    </button>
                                                    {cpmkForm.id && (
                                                        <button type="button" onClick={cancelEditCpmk} className="text-gray-500 hover:text-gray-700 font-bold text-xs px-2">Batal Edit</button>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                );
                            })()}

                            {/* PUSTAKA & BAHAN KAJIAN UTAMA */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Pustaka Utama</label>
                                    <textarea rows={3} className="w-full border-gray-300 rounded text-sm" value={data.pustaka_utama} onChange={e => setData('pustaka_utama', e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Pustaka Pendukung</label>
                                    <textarea rows={3} className="w-full border-gray-300 rounded text-sm" value={data.pustaka_pendukung} onChange={e => setData('pustaka_pendukung', e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Bahan Kajian / Materi Pembelajaran (1 Semester)</label>
                                    <textarea rows={4} placeholder="1. Dasar kalkulus&#10;2. Limit&#10;3. Turunan" className="w-full border-gray-300 rounded text-sm" value={data.bahan_kajian_utama} onChange={e => setData('bahan_kajian_utama', e.target.value)} required />
                                </div>
                            </div>

                            {/* KUSTOMISASI NAMA KOMPONEN PENILAIAN */}
                            {data.mata_kuliah_id && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 border-b pb-1">
                                        Nama Komponen Penilaian
                                        <span className="text-xs font-normal text-gray-400 ml-2">Sesuaikan nama komponen sesuai MK ini</span>
                                    </label>
                                    <div className="grid grid-cols-5 gap-3 bg-blue-50 border border-blue-100 rounded-lg p-4">
                                        {(['quiz', 'tugas', 'project', 'uts', 'uas'] as const).map((key) => (
                                            <div key={key}>
                                                <label className="block text-[11px] font-bold text-blue-600 mb-1 uppercase">{key}</label>
                                                <input
                                                    type="text"
                                                    className="w-full border-gray-300 rounded text-sm"
                                                    value={data.komponen_labels[key] || ''}
                                                    onChange={e => setData('komponen_labels', { ...data.komponen_labels, [key]: e.target.value })}
                                                    placeholder={key.toUpperCase()}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 italic">
                                        Contoh: untuk MK Praktik, ganti "Quiz" → "Sikap", "Tugas" → "Laporan", "Project" → "Ujian", "UTS" → "-" (isi 0)
                                    </p>
                                </div>
                            )}

                            {/* MATRIKS PENILAIAN */}
                            {cpmks.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 border-b pb-1">Sistem Evaluasi (Bobot % per CPMK)</label>
                                    <table className="w-full text-sm border">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="border p-2">CPMK</th>
                                                {(['quiz', 'tugas', 'project', 'uts', 'uas'] as const).map(key => (
                                                    <th key={key} className="border p-2">{data.komponen_labels[key] || key.toUpperCase()}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.penilaians.map((penilaian, idx) => (
                                                <tr key={idx}>
                                                    <td className="border p-2 font-bold text-center">{cpmks[idx]?.kode_cpmk}</td>
                                                    {['quiz', 'tugas', 'project', 'uts', 'uas'].map(field => (
                                                        <td key={field} className="border p-1">
                                                            {/* SUDAH SUPPORT KOMA DAN DESIMAL */}
                                                            <input 
                                                                type="text" 
                                                                className="w-full border-gray-300 rounded text-xs text-center" 
                                                                value={penilaian[field]} 
                                                                onChange={e => {
                                                                    const newPenilaian = [...data.penilaians];
                                                                    newPenilaian[idx][field] = e.target.value; 
                                                                    setData('penilaians', newPenilaian);
                                                                }}
                                                                onBlur={e => {
                                                                    const newPenilaian = [...data.penilaians];
                                                                    newPenilaian[idx][field] = parseDecimal(e.target.value);
                                                                    setData('penilaians', newPenilaian);
                                                                }}
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    {/* GRAFIK PENILAIAN */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 border-b pb-1">Visualisasi Matriks Penilaian (Spider Chart)</label>
                                        <div className="w-full h-80 bg-white border border-gray-200 rounded-lg p-4 flex justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                                    <PolarGrid />
                                                    <PolarAngleAxis dataKey="name" tick={{fontSize: 12}} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fontSize: 12}} />
                                                    
                                                    <Radar name="Quiz" dataKey="Quiz" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                                                    <Radar name="Tugas" dataKey="Tugas" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                                                    <Radar name="Project" dataKey="Project" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
                                                    <Radar name="UTS" dataKey="UTS" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                                                    <Radar name="UAS" dataKey="UAS" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                                                    
                                                    <Legend wrapperStyle={{fontSize: '12px'}} />
                                                    <Tooltip />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* RENCANA PEMBELAJARAN MINGGUAN */}
                            <div className="mt-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2 border-b pb-1">Rencana Pembelajaran Mingguan</label>
                                {data.details.map((detail, idx) => (
                                    <div key={idx} className="border border-gray-200 p-3 rounded mb-3 bg-gray-50 relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-gray-500">Pertemuan #{idx + 1}</span>
                                            <button type="button" onClick={() => removeMingguan(idx)} className="text-red-500 text-xs font-bold hover:underline">Hapus Baris</button>
                                        </div>
                                        <div className="grid grid-cols-6 gap-3">
                                            <div className="col-span-1">
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Pt Ke-</label>
                                                <input type="text" placeholder="cth: 1" className="w-full border-gray-300 rounded text-sm" value={detail.pertemuan_ke} onChange={e => { const d = [...data.details]; d[idx].pertemuan_ke = e.target.value; setData('details', d); }} required />
                                            </div>

                                            <div className="col-span-5">
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Kemampuan Akhir Tiap Tahapan Belajar</label>
                                                <textarea placeholder="Kemampuan akhir yang diharapkan" rows={2} className="w-full border-gray-300 rounded text-sm" value={detail.kemampuan_akhir} onChange={e => { const d = [...data.details]; d[idx].kemampuan_akhir = e.target.value; setData('details', d); }} required />
                                            </div>

                                            <div className="col-span-6 border border-gray-200 rounded p-3 bg-white">
                                                <label className="block text-xs font-bold text-gray-600 mb-2">Penilaian</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Indikator</label>
                                                        <textarea placeholder="Indikator penilaian" rows={2} className="w-full border-gray-300 rounded text-sm" value={detail.indikator} onChange={e => { const d = [...data.details]; d[idx].indikator = e.target.value; setData('details', d); }} required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Komponen</label>
                                                        <textarea placeholder="Komponen penilaian" rows={2} className="w-full border-gray-300 rounded text-sm" value={detail.penilaian_komponen} onChange={e => { const d = [...data.details]; d[idx].penilaian_komponen = e.target.value; setData('details', d); }} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Bobot (%)</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="cth: 10" 
                                                            className="w-full border-gray-300 rounded text-sm" 
                                                            value={detail.penilaian_bobot} 
                                                            onChange={e => { 
                                                                const d = [...data.details]; 
                                                                d[idx].penilaian_bobot = e.target.value as any; 
                                                                setData('details', d); 
                                                            }}
                                                            onBlur={e => {
                                                                const d = [...data.details];
                                                                d[idx].penilaian_bobot = parseDecimal(e.target.value);
                                                                setData('details', d);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-3">
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Bahan Kajian (Materi Pembelajaran)</label>
                                                <textarea placeholder="Materi pembelajaran spesifik" rows={2} className="w-full border-gray-300 rounded text-sm" value={detail.bahan_kajian} onChange={e => { const d = [...data.details]; d[idx].bahan_kajian = e.target.value; setData('details', d); }} required />
                                            </div>

                                            <div className="col-span-3">
                                                <label className="block text-xs font-bold text-gray-600 mb-2">Modalitas, Bentuk, Strategi, dan Metode Pembelajaran</label>
                                                <div className="grid grid-cols-1 gap-2 border border-gray-200 rounded p-3 bg-white">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-gray-500 mb-1">Modalitas</label>
                                                        <input type="text" placeholder="Pembelajaran bauran (Blended Learning)" className="w-full border-gray-300 rounded text-sm" value={parsePembelajaran(detail.metode_pembelajaran).modalitas} onChange={e => updatePembelajaranField(idx, 'modalitas', e.target.value)} required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-gray-500 mb-1">Bentuk</label>
                                                        <input type="text" placeholder="Kuliah teori" className="w-full border-gray-300 rounded text-sm" value={parsePembelajaran(detail.metode_pembelajaran).bentuk} onChange={e => updatePembelajaranField(idx, 'bentuk', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-gray-500 mb-1">Strategi</label>
                                                        <textarea rows={2} placeholder="Pembelajaran ekspositori dan inkuiri" className="w-full border-gray-300 rounded text-sm" value={parsePembelajaran(detail.metode_pembelajaran).strategi} onChange={e => updatePembelajaranField(idx, 'strategi', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-gray-500 mb-1">Metode</label>
                                                        <input type="text" placeholder="Ceramah, diskusi, case method" className="w-full border-gray-300 rounded text-sm" value={parsePembelajaran(detail.metode_pembelajaran).metode} onChange={e => updatePembelajaranField(idx, 'metode', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-gray-500 mb-1">Media</label>
                                                        <input type="text" placeholder="e-book, video" className="w-full border-gray-300 rounded text-sm" value={parsePembelajaran(detail.metode_pembelajaran).media} onChange={e => updatePembelajaranField(idx, 'media', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-gray-500 mb-1">Sumber belajar</label>
                                                        <textarea rows={2} placeholder="Sumber belajar" className="w-full border-gray-300 rounded text-sm" value={parsePembelajaran(detail.metode_pembelajaran).sumber_belajar} onChange={e => updatePembelajaranField(idx, 'sumber_belajar', e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Estimasi Waktu</label>
                                                <input type="text" placeholder="cth: 2x100 menit" className="w-full border-gray-300 rounded text-sm" value={detail.estimasi_waktu} onChange={e => { const d = [...data.details]; d[idx].estimasi_waktu = e.target.value; setData('details', d); }} required />
                                            </div>

                                            <div className="col-span-4">
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Pengalaman Belajar Mahasiswa</label>
                                                <textarea placeholder="Pengalaman belajar yang diharapkan" rows={2} className="w-full border-gray-300 rounded text-sm" value={detail.pengalaman_belajar} onChange={e => { const d = [...data.details]; d[idx].pengalaman_belajar = e.target.value; setData('details', d); }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addMingguan} className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded font-bold">+ Tambah Pertemuan</button>
                            </div>

                            {/* RINGKASAN ERROR VALIDASI (termasuk field di dalam array details/penilaians) */}
                            {Object.keys(errors).length > 0 && (
                                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                                    <p className="text-sm font-bold text-red-700 mb-1">
                                        Gagal menyimpan, ada {Object.keys(errors).length} field yang belum valid:
                                    </p>
                                    <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5">
                                        {Object.entries(errors).map(([key, message]) => (
                                            <li key={key}>
                                                <span className="font-mono">{key}</span>: {message as string}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* AKSI TOMBOL */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                                <button type="submit" disabled={processing} className="bg-polman-primary hover:bg-polman-secondary text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm">
                                    {processing ? 'Menyimpan...' : 'Simpan RPS'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </AuthenticatedLayout>
    );
}