import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, useRemember } from '@inertiajs/react';
import { useState } from 'react';

const PER_PAGE = 10;

interface Shortcut { label: string; href: string; description?: string; }
interface KaprodiItem {
    id: number; kode_mk: string; nama_mk: string; sks: number; semester: string; jenis: string;
    cpls_count: number; cpmks_count: number; dosen_pengampus_count: number; rps_count: number;
    dosen_pengampus: { id: number; nama: string }[];
}
interface DosenItem {
    id: number; kode_mk: string; nama_mk: string; sks: number; semester: string; jenis: string;
    cpls_count: number; cpmks_count: number; rps_status: string; rps_id: number | null;
}
interface DashboardProps {
    dashboardRole: 'kaprodi' | 'dosen' | 'default';
    stats: Record<string, number>;
    coverage?: Record<string, number>;
    items: any[];
    shortcuts: Shortcut[];
    warning?: string;
}

function MaterialIcon({ name, className = 'text-xl' }: { name: string; className?: string }) {
    return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function StatCard({ label, value, suffix, color = 'primary' }: {
    label: string; value: number | string; suffix?: string;
    color?: 'primary' | 'secondary' | 'teal' | 'amber';
}) {
    const bgMap = { primary: 'bg-primary', secondary: 'bg-[#2dce89]', teal: 'bg-secondary', amber: 'bg-amber-500' };
    const iconMap = { primary: 'school', secondary: 'rocket_launch', teal: 'analytics', amber: 'warning' };
    return (
        <div className={`relative overflow-hidden rounded-[2rem] h-44 p-7 flex flex-col justify-between shadow-xl ${bgMap[color]}`}>
            <p className={`${color === 'primary' ? 'text-aqua-200' : 'text-white/70'} text-[10px] font-black uppercase tracking-widest relative z-10`}>{label}</p>
            <div className="flex items-baseline gap-2">
                <h2 className="text-6xl font-black italic tracking-tighter text-white relative z-10">{value}</h2>
                {suffix && <span className="text-white/60 text-sm font-bold">{suffix}</span>}
            </div>
            <MaterialIcon name={iconMap[color]} className="absolute -right-3 -bottom-3 text-white/10 text-[120px]" />
        </div>
    );
}

function CoverageCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="relative overflow-hidden rounded-[2rem] h-44 p-7 flex flex-col justify-between bg-white border-2 border-primary-container">
            <span className="text-secondary text-[10px] font-black uppercase tracking-widest">{label}</span>
            <div>
                <div className="flex items-baseline gap-1">
                    <span className="font-headline text-5xl font-black italic text-primary">{value}</span>
                    <span className="text-sm text-outline font-bold">%</span>
                </div>
                <div className="h-2.5 w-full bg-surface-container-highest rounded-full mt-4 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{
                        width: `${value}%`,
                        background: value >= 80 ? 'linear-gradient(90deg, #7fffd4, #008080)'
                            : value >= 50 ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                            : 'linear-gradient(90deg, #ef4444, #f97316)',
                    }} />
                </div>
            </div>
        </div>
    );
}

function ShortcutGrid({ shortcuts }: { shortcuts: Shortcut[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {shortcuts.map((s) => (
                <Link key={s.href} href={s.href} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20 hover:border-primary-container hover:-translate-y-0.5 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-primary mb-4">
                        <MaterialIcon name="chevron_right" className="text-lg" />
                    </div>
                    <p className="text-sm font-black text-on-surface group-hover:text-primary transition-colors">{s.label}</p>
                    {s.description && <p className="text-[11px] text-slate-400 mt-1 leading-snug">{s.description}</p>}
                </Link>
            ))}
        </div>
    );
}

function RpsStatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        'Lengkap': 'bg-primary-container text-primary border-primary-container',
        'Perlu Dilengkapi': 'bg-amber-50 text-amber-700 border-amber-200',
        'Belum Ada': 'bg-surface-container-low text-outline border-outline-variant/30',
    };
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${map[status] ?? map['Belum Ada']}`}>
            {status}
        </span>
    );
}

// ─── Pagination Component ─────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between px-7 py-4 border-t border-outline-variant/10">
            <p className="text-xs text-outline font-bold">
                Halaman {page} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-black border border-outline-variant/30 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary hover:text-white hover:border-primary transition-all"
                >
                    ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                            p === page
                                ? 'bg-primary text-white shadow-sm'
                                : 'border border-outline-variant/30 text-outline hover:border-primary hover:text-primary'
                        }`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => onChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-black border border-outline-variant/30 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary hover:text-white hover:border-primary transition-all"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}

// ─── Kaprodi Dashboard ────────────────────────────────────────────────────────

function KaprodiDashboard({ stats, coverage, items, shortcuts }: {
    stats: Record<string, number>; coverage: Record<string, number>;
    items: KaprodiItem[]; shortcuts: Shortcut[];
}) {
    const { user } = usePage().props.auth as any;
    const [search, setSearch] = useRemember('', 'dashboard.kaprodi.search');
    const [page, setPage] = useRemember(1, 'dashboard.kaprodi.page');

    const filtered = items.filter((mk) =>
        mk.kode_mk.toLowerCase().includes(search.toLowerCase()) ||
        mk.nama_mk.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto">
            <div>
                <h1 className="text-3xl font-black text-primary tracking-tighter italic uppercase font-headline">
                    Dashboard <span className="text-[#2dce89]">Kaprodi</span>
                </h1>
                <p className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-widest">Selamat datang, {user?.name}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatCard label="Total Mata Kuliah" value={stats.total_mk} color="primary" />
                <StatCard label="Total CPL" value={stats.total_cpl} color="secondary" />
                <StatCard label="Total CPMK" value={stats.total_cpmk} color="teal" />
                <StatCard label="Total RPS" value={stats.total_rps} color="primary" />
                <StatCard label="Total Dosen" value={stats.total_dosen} color="secondary" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CoverageCard label="OBE Coverage (MK-CPL)" value={coverage.obe ?? 0} />
                <CoverageCard label="RPS Coverage" value={coverage.rps ?? 0} />
                <CoverageCard label="Dosen Assignment" value={coverage.dosen_assignment ?? 0} />
            </div>

            <div>
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Akses Cepat</h2>
                <ShortcutGrid shortcuts={shortcuts} />
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-outline-variant/20 overflow-hidden">
                <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant/10">
                    <div>
                        <h2 className="font-headline font-black text-on-surface">Ringkasan Mata Kuliah</h2>
                        <p className="text-xs text-outline mt-0.5">{filtered.length} mata kuliah ditemukan</p>
                    </div>
                    <div className="relative">
                        <MaterialIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base" />
                        <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Cari mata kuliah..."
                            className="pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-medium text-on-surface bg-surface-container-low focus:outline-none focus:border-primary w-56"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-outline-variant/10">
                                <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline">Kode</th>
                                <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline">Nama Mata Kuliah</th>
                                <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline text-center">SKS</th>
                                <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline text-center">Smt</th>
                                <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline text-center">CPL</th>
                                <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline text-center">CPMK</th>
                                <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline text-center">Dosen</th>
                                <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline text-center">RPS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                            {paginated.length > 0 ? paginated.map((mk) => (
                                <tr key={mk.id} className="hover:bg-surface-container-lowest transition-colors">
                                    <td className="px-7 py-5 text-sm font-mono font-bold text-primary">{mk.kode_mk}</td>
                                    <td className="px-7 py-5">
                                        <p className="text-sm font-bold text-on-surface">{mk.nama_mk}</p>
                                        {mk.dosen_pengampus.length > 0 && (
                                            <p className="text-[11px] text-gray-400 mt-0.5">{mk.dosen_pengampus.map((d) => d.nama).join(', ')}</p>
                                        )}
                                    </td>
                                    <td className="px-7 py-5 text-sm font-bold text-on-surface-variant text-center">{mk.sks}</td>
                                    <td className="px-7 py-5 text-sm font-medium text-outline text-center">{mk.semester}</td>
                                    <td className="px-7 py-5 text-center">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${mk.cpls_count > 0 ? 'bg-primary-container text-primary' : 'bg-surface-container-low text-outline'}`}>{mk.cpls_count}</span>
                                    </td>
                                    <td className="px-7 py-5 text-center">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${mk.cpmks_count > 0 ? 'bg-teal-50 text-primary' : 'bg-surface-container-low text-outline'}`}>{mk.cpmks_count}</span>
                                    </td>
                                    <td className="px-7 py-5 text-center">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${mk.dosen_pengampus_count > 0 ? 'bg-blue-50 text-blue-700' : 'bg-surface-container-low text-outline'}`}>{mk.dosen_pengampus_count}</span>
                                    </td>
                                    <td className="px-7 py-5 text-center">
                                        <RpsStatusBadge status={mk.rps_count > 0 ? 'Lengkap' : 'Belum Ada'} />
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center text-gray-400 font-bold italic text-sm">
                                        {search ? 'Tidak ada mata kuliah yang cocok.' : 'Belum ada data mata kuliah.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
        </div>
    );
}

// ─── Dosen Dashboard ──────────────────────────────────────────────────────────

function DosenDashboard({ stats, items, shortcuts, warning }: {
    stats: Record<string, number>; items: DosenItem[]; shortcuts: Shortcut[]; warning?: string;
}) {
    const { user } = usePage().props.auth as any;
    const [search, setSearch] = useRemember('', 'dashboard.dosen.search');
    const [page, setPage] = useRemember(1, 'dashboard.dosen.page');

    const filtered = items.filter((mk) =>
        mk.kode_mk.toLowerCase().includes(search.toLowerCase()) ||
        mk.nama_mk.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto">
            <div>
                <h1 className="text-3xl font-black text-primary tracking-tighter italic uppercase font-headline">
                    Dashboard <span className="text-[#2dce89]">Dosen</span>
                </h1>
                <p className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-widest">Selamat datang, {user?.name}</p>
            </div>

            {warning && (
                <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <MaterialIcon name="warning" className="text-amber-500 flex-shrink-0 mt-0.5 text-xl" />
                    <div>
                        <p className="text-sm font-bold text-amber-800">Perhatian</p>
                        <p className="text-sm text-amber-700 mt-0.5">
                            Akun Anda belum memiliki biodata. Silakan lengkapi profil Anda melalui menu{' '}
                            <a href={route('biodata-saya.show')} className="font-black underline hover:text-amber-900">Profil Saya</a>{' '}
                            agar dapat ditugaskan pada Mata Kuliah.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="Mata Kuliah Diampu" value={stats.mk_diampu} color="primary" />
                <StatCard label="RPS Saya" value={stats.rps_saya} color="teal" />
                <StatCard label="CPMK Terkait" value={stats.cpmk_terkait} color="secondary" />
                <StatCard label="RPS Perlu Dilengkapi" value={stats.rps_perlu_lengkap} color={stats.rps_perlu_lengkap > 0 ? 'amber' : 'primary'} />
            </div>

            <div>
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Akses Cepat</h2>
                <ShortcutGrid shortcuts={shortcuts} />
            </div>

            {!warning && (
                <div className="bg-white rounded-[2rem] shadow-sm border border-outline-variant/20 overflow-hidden">
                    <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant/10">
                        <div>
                            <h2 className="font-headline font-black text-on-surface">Mata Kuliah Yang Diampu</h2>
                            <p className="text-xs text-outline mt-0.5">{filtered.length} mata kuliah ditemukan</p>
                        </div>
                        <div className="relative">
                            <MaterialIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base" />
                            <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Cari mata kuliah..."
                                className="pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-medium text-on-surface bg-surface-container-low focus:outline-none focus:border-primary w-56"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-outline-variant/10">
                                    <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline">Kode</th>
                                    <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline">Nama Mata Kuliah</th>
                                    <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline text-center">SKS</th>
                                    <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline text-center">Smt</th>
                                    <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline text-center">CPL</th>
                                    <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline text-center">CPMK</th>
                                    <th className="px-7 py-5 text-[10px] font-black uppercase tracking-widest text-outline text-center">Status RPS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {paginated.length > 0 ? paginated.map((mk) => (
                                    <tr key={mk.id} className="hover:bg-surface-container-lowest transition-colors">
                                        <td className="px-7 py-5 text-sm font-mono font-bold text-primary">{mk.kode_mk}</td>
                                        <td className="px-7 py-5 text-sm font-bold text-on-surface">{mk.nama_mk}</td>
                                        <td className="px-7 py-5 text-sm font-bold text-on-surface-variant text-center">{mk.sks}</td>
                                        <td className="px-7 py-5 text-sm font-medium text-outline text-center">{mk.semester}</td>
                                        <td className="px-7 py-5 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${mk.cpls_count > 0 ? 'bg-primary-container text-primary' : 'bg-surface-container-low text-outline'}`}>{mk.cpls_count}</span>
                                        </td>
                                        <td className="px-7 py-5 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${mk.cpmks_count > 0 ? 'bg-teal-50 text-primary' : 'bg-surface-container-low text-outline'}`}>{mk.cpmks_count}</span>
                                        </td>
                                        <td className="px-7 py-5 text-center">
                                            <RpsStatusBadge status={mk.rps_status} />
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-gray-400 font-bold italic text-sm">
                                            {search ? 'Tidak ada mata kuliah yang cocok.' : 'Belum ada mata kuliah yang diampu.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                </div>
            )}
        </div>
    );
}

// ─── Default Dashboard ────────────────────────────────────────────────────────

function DefaultDashboard() {
    const { user } = usePage().props.auth as any;
    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            <div>
                <h1 className="text-3xl font-black text-primary tracking-tighter italic uppercase font-headline">Dashboard</h1>
                <p className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-widest">Selamat datang, {user?.name}</p>
            </div>
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-outline-variant/20 text-center">
                <p className="text-gray-500 text-sm">Dashboard untuk role Anda sedang dalam pengembangan.</p>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard({ 
    dashboardRole = 'default', 
    stats = {}, 
    coverage = {}, 
    items = [], 
    shortcuts = [], 
    warning,
 }: DashboardProps) {
     console.log("INI DASHBOARD TSX BARU");
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            {dashboardRole === 'kaprodi' && <KaprodiDashboard stats={stats} coverage={coverage ?? {}} items={items as KaprodiItem[]} shortcuts={shortcuts} />}
            {dashboardRole === 'dosen' && <DosenDashboard stats={stats} items={items as DosenItem[]} shortcuts={shortcuts} warning={warning} />}
            {dashboardRole === 'default' && <DefaultDashboard />}
        </AuthenticatedLayout>
    );
}
