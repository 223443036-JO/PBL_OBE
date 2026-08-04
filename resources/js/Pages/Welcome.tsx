import React from 'react';
import { Head, Link } from '@inertiajs/react';

interface Props {
    canLogin: boolean;
    canRegister: boolean;
    laravelVersion: string;
    phpVersion: string;
}

const features = [
    ['hub', 'Curriculum Mapping', 'Visualisasi relasi CPL, CPMK, mata kuliah, dan indikator kurikulum dalam satu alur yang mudah dipantau.', 'Kaprodi'],
    ['description', 'RPS Terintegrasi', 'Pengelolaan rencana pembelajaran semester dengan status kelengkapan yang jelas untuk setiap mata kuliah.', 'Dosen'],
    ['analytics', 'OBE Monitoring', 'Pantau coverage kurikulum, pemetaan outcome, dan kesiapan dokumen akademik secara ringkas.', 'Akademik'],
    ['database', 'Master Data', 'Kelola CPL, PPM, IEA, mata kuliah, indikator kinerja, serta data pendukung kurikulum.', 'Kaprodi'],
    ['school', 'Dosen Pengampu', 'Lihat penugasan dosen pada mata kuliah dan dokumen pembelajaran yang perlu dilengkapi.', 'Dosen'],
    ['verified', 'Audit Ready', 'Tampilan data dan status dirancang untuk membantu kebutuhan monitoring dan evaluasi kurikulum.', 'Mutu'],
];

const steps = [
    ['01', 'database', 'Input Master Data', 'Kaprodi menyiapkan struktur kurikulum, outcome, mata kuliah, dan indikator kinerja.', 'Kaprodi'],
    ['02', 'hub', 'Pemetaan Kurikulum', 'Relasi CPL, CPMK, IEA, PPM, dan mata kuliah dipetakan dalam curriculum map.', 'Akademik'],
    ['03', 'description', 'Penyusunan RPS', 'Dosen melengkapi dokumen pembelajaran sesuai mata kuliah yang diampu.', 'Dosen'],
    ['04', 'monitoring', 'Monitoring Coverage', 'Status kelengkapan dan coverage kurikulum dipantau melalui dashboard.', 'Semua Role'],
];

const roles = [
    ['admin_panel_settings', 'Kaprodi', 'Pengelola Kurikulum', 'Mengelola master data, memantau coverage OBE, meninjau dokumen RPS, dan memastikan kesiapan data akademik.', ['Master Data', 'Coverage', 'RPS', 'Monitoring'], true],
    ['school', 'Dosen', 'Pengampu Mata Kuliah', 'Melengkapi RPS, meninjau CPMK terkait, dan memantau mata kuliah yang menjadi tanggung jawabnya.', ['RPS', 'CPMK', 'Mata Kuliah', 'Dokumen'], false],
    ['hub', 'Tim Kurikulum', 'Reviewer Akademik', 'Membaca relasi kurikulum dan membantu validasi pemetaan outcome pembelajaran.', ['CPL', 'PPM', 'IEA', 'Matrix'], false],
    ['workspace_premium', 'Mutu Akademik', 'Evaluasi Program', 'Menggunakan data dashboard untuk kebutuhan evaluasi, audit, dan pengembangan kurikulum.', ['Evaluasi', 'Audit', 'Rekap', 'Status'], false],
];

function Icon({ name, className = 'text-xl' }: { name: string; className?: string }) {
    return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export default function Welcome(_: Props) {
    return (
        <div className="min-h-screen bg-white font-body text-aqua-900 antialiased">
            <Head title="Curriculum Portal" />

            <nav className="fixed top-0 w-full z-50 bg-white/85 backdrop-blur-xl border-b border-aqua-200/30">
                <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
                    <a href="#" className="flex items-center gap-3 group">
                        <div className="h-12 w-12 rounded-xl bg-aqua-800 flex items-center justify-center shadow-sm group-hover:bg-aqua-700 transition-colors overflow-hidden">
                            <img src="/images/polman-logo.png" alt="POLMAN" className="h-9 w-9 object-contain" />
                        </div>
                        <div className="leading-tight">
                            <span className="font-black text-aqua-800 text-base tracking-tight font-headline">IABEE Portal</span>
                            <span className="block text-[10px] text-aqua-600 font-semibold tracking-widest uppercase">POLMAN Bandung</span>
                        </div>
                    </a>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#fitur" className="nav-link text-sm font-semibold text-aqua-700/70 hover:text-aqua-800 transition-colors">Fitur</a>
                        <a href="#alur" className="nav-link text-sm font-semibold text-aqua-700/70 hover:text-aqua-800 transition-colors">Alur</a>
                        <a href="#role" className="nav-link text-sm font-semibold text-aqua-700/70 hover:text-aqua-800 transition-colors">Pengguna</a>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-2 bg-aqua-200 text-aqua-800 px-5 py-2.5 rounded-xl font-black text-sm hover:bg-aqua-300 transition-colors shadow-sm shadow-aqua-300/40 active:scale-95 border border-aqua-300/50"
                        >
                            <Icon name="login" className="text-base" />
                            Login
                        </Link>
                    </div>
                </div>
            </nav>

            <section id="hero" className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden min-h-[92vh] flex items-center">
                <div className="blob w-[60%] h-[70%] bg-aqua-200/35 -top-[10%] -right-[5%]" />
                <div className="blob w-[45%] h-[55%] bg-aqua-300/15 top-[30%] -left-[10%]" />
                <div className="blob w-[35%] h-[40%] bg-aqua-200/15 bottom-0 right-[20%]" />
                <div className="absolute inset-0 dot-grid opacity-[0.04] pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center w-full">
                    <div className="space-y-9">
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-aqua-200/20 border border-aqua-200/60">
                            <span className="pulse-dot w-2 h-2 rounded-full bg-aqua-600 shrink-0" />
                            <span className="text-aqua-700 font-bold text-[11px] tracking-[0.25em] uppercase font-mono">
                                Sistem Aktif - POLMAN Bandung
                            </span>
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-6xl lg:text-7xl font-black text-aqua-900 leading-[0.88] tracking-tighter font-headline">
                                Kelola Kurikulum
                            </h1>
                            <h1 className="text-6xl lg:text-7xl font-black leading-[0.88] tracking-tighter gradient-text font-headline">
                                Lebih Cerdas.
                            </h1>
                        </div>

                        <p className="text-aqua-800/60 text-xl max-w-md leading-relaxed font-medium italic border-l-4 border-aqua-300 pl-5">
                            Portal manajemen kurikulum OBE untuk pemetaan CPL, CPMK, RPS, dan monitoring dokumen akademik seluruh Program Studi.
                        </p>

                        <div className="flex items-center gap-7 pt-1 overflow-x-auto pb-2">
                            {[
                                ['2', 'Role'],
                                ['5+', 'Master Data'],
                                ['100%', 'OBE Ready'],
                                ['1', 'Portal'],
                            ].map(([value, label], index) => (
                                <React.Fragment key={label}>
                                    {index > 0 && <div className="w-px h-8 bg-aqua-200/60 flex-shrink-0" />}
                                    <div className="text-center flex-shrink-0">
                                        <p className="text-3xl font-black text-aqua-600">{value}</p>
                                        <p className="text-[10px] text-aqua-700/50 font-bold uppercase tracking-widest mt-0.5">{label}</p>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-3 pt-1">
                            <Link
                                href={route('login')}
                                className="inline-flex items-center gap-2 bg-aqua-200 text-aqua-900 px-7 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-aqua-300/50 hover:bg-aqua-300 hover:scale-[1.02] transition-all active:scale-95 border border-aqua-300/60"
                            >
                                <Icon name="rocket_launch" className="text-base" />
                                Login
                            </Link>
                            <a
                                href="#fitur"
                                className="inline-flex items-center gap-2 text-aqua-700 border border-aqua-200/70 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-aqua-100/50 transition-colors"
                            >
                                <Icon name="info" className="text-base" />
                                Pelajari Fitur
                            </a>
                        </div>
                    </div>

                    <div className="relative hidden lg:block">
                        <div className="absolute inset-4 bg-aqua-200/25 rounded-full blur-3xl" />
                        <div className="relative animate-float">
                            <div className="bg-white/30 backdrop-blur-2xl rounded-[3rem] border border-white/50 p-2 shadow-2xl shadow-aqua-300/30">
                                <div className="bg-aqua-800 rounded-[2.6rem] p-9 overflow-hidden relative">
                                    <div className="absolute inset-0 dot-grid opacity-[0.07]" />
                                    <div className="relative z-10 space-y-7">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-11 w-11 rounded-xl bg-aqua-200/15 border border-aqua-200/25 flex items-center justify-center overflow-hidden">
                                                    <img src="/images/polman-logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-white text-sm">Curriculum Management</p>
                                                    <p className="text-aqua-200/50 text-xs">OBE System v2.0</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-aqua-300/60 tracking-widest bg-aqua-200/10 px-2 py-1 rounded-lg border border-aqua-200/15 uppercase">LIVE</span>
                                        </div>

                                        <div>
                                            <p className="text-aqua-200/50 text-xs font-bold uppercase tracking-widest mb-3">Coverage Kurikulum</p>
                                            <div className="space-y-3">
                                                {[
                                                    ['CPL Mapping', '86%', 'bg-aqua-200'],
                                                    ['RPS Completion', '72%', 'bg-aqua-300/70'],
                                                ].map(([label, value, color]) => (
                                                    <div key={label}>
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className="text-white/70 text-xs font-semibold">{label}</span>
                                                            <span className="text-aqua-200 text-xs font-black">{value}</span>
                                                        </div>
                                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                            <div className={`h-full ${color} rounded-full`} style={{ width: value }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-5 gap-2">
                                            {['CPL', 'CPMK', 'RPS', 'IEA', 'PPM'].map((item, index) => (
                                                <div key={item} className={`rounded-xl ${index === 0 ? 'bg-aqua-200/20 text-aqua-200 border border-aqua-200/30' : 'bg-white/10 text-white/40 border border-white/10'} p-2.5 text-center`}>
                                                    <p className="font-black text-xs">{item}</p>
                                                    <p className="text-[9px] opacity-70 font-bold">OK</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-2.5 pt-1">
                                            {['Curriculum Map', 'RPS Monitoring', 'OBE Coverage', 'Academic Dashboard'].map((item) => (
                                                <div className="flex items-center gap-3" key={item}>
                                                    <div className="w-4 h-4 rounded-full bg-aqua-200/20 flex items-center justify-center shrink-0 border border-aqua-200/30">
                                                        <Icon name="check" className="text-aqua-200 text-[10px]" />
                                                    </div>
                                                    <span className="text-white/60 text-xs font-medium">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-4 -left-8 bg-white rounded-2xl border border-aqua-200/40 p-3.5 shadow-xl shadow-aqua-900/10">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-aqua-200/30 flex items-center justify-center">
                                    <Icon name="check_circle" className="text-aqua-600 text-base" />
                                </div>
                                <div>
                                    <p className="text-aqua-900 font-black text-xs">RPS Diverifikasi</p>
                                    <p className="text-aqua-600/50 text-[10px]">Dokumen terbaru</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="fitur" className="py-24 bg-gradient-to-b from-white via-aqua-50/40 to-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block text-[11px] font-bold tracking-[0.35em] uppercase text-aqua-600 bg-aqua-200/20 border border-aqua-200/50 px-4 py-1.5 rounded-full">Fitur Sistem</span>
                        <h2 className="text-4xl font-black text-aqua-900 mt-4 tracking-tight font-headline">Semua yang dibutuhkan kurikulum</h2>
                        <p className="text-aqua-700/50 mt-2 text-lg">dalam satu platform terintegrasi.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map(([icon, title, desc, tag]) => (
                            <div key={title} className="feature-card group bg-white rounded-3xl p-7 border border-aqua-200/40 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_8px_40px_-8px_rgba(0,128,128,0.18)]">
                                <div className="flex items-start justify-between mb-5">
                                    <div className="w-11 h-11 rounded-2xl bg-aqua-200/25 border border-aqua-200/50 flex items-center justify-center group-hover:bg-aqua-200/50 transition-colors">
                                        <Icon name={icon} className="text-aqua-600 text-xl" />
                                    </div>
                                    <span className="text-[10px] font-bold text-aqua-600 bg-aqua-200/20 border border-aqua-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">{tag}</span>
                                </div>
                                <h3 className="font-black text-aqua-900 text-base mb-2 leading-snug">{title}</h3>
                                <p className="text-aqua-700/55 text-sm leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="alur" className="py-24 bg-aqua-800 relative overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-[0.07] pointer-events-none" />
                <div className="blob w-[40%] h-[80%] bg-aqua-300/10 top-0 -right-[10%]" />
                <div className="relative max-w-7xl mx-auto px-6 z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block text-[11px] font-bold tracking-[0.35em] uppercase text-aqua-200/60 bg-aqua-200/10 border border-aqua-200/15 px-4 py-1.5 rounded-full">Alur Kerja</span>
                        <h2 className="text-4xl font-black text-white mt-4 tracking-tight font-headline">Bagaimana Cara Kerjanya?</h2>
                        <p className="text-aqua-200/50 mt-2 text-lg">4 langkah dari data hingga monitoring.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
                        <div className="hidden lg:block absolute top-[52px] left-[calc(12.5%+40px)] right-[calc(12.5%+40px)] h-px bg-gradient-to-r from-aqua-300/20 via-aqua-200/50 to-aqua-300/20 pointer-events-none" />
                        {steps.map(([num, icon, title, desc, actor]) => (
                            <div className="group" key={title}>
                                <div className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-aqua-200/30 rounded-3xl p-6 transition-all duration-300 h-full">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="relative w-14 h-14 rounded-2xl bg-aqua-200/10 border border-aqua-200/20 flex items-center justify-center shrink-0 group-hover:bg-aqua-200/20 transition-colors">
                                            <Icon name={icon} className="text-aqua-200 text-[22px]" />
                                            <span className="absolute -top-1.5 -right-1.5 text-[10px] font-black text-aqua-300 bg-aqua-800 border border-aqua-600 rounded-lg px-1.5 py-0.5">{num}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-aqua-300/60 uppercase tracking-widest leading-tight">{actor}</span>
                                    </div>
                                    <h3 className="font-black text-white text-base mb-2">{title}</h3>
                                    <p className="text-aqua-200/50 text-sm leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="role" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block text-[11px] font-bold tracking-[0.35em] uppercase text-aqua-600 bg-aqua-200/20 border border-aqua-200/50 px-4 py-1.5 rounded-full">Pengguna Sistem</span>
                        <h2 className="text-4xl font-black text-aqua-900 mt-4 tracking-tight font-headline">Role Terintegrasi</h2>
                        <p className="text-aqua-700/50 mt-2 text-lg">Setiap aktor punya peran dan akses yang jelas.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {roles.map(([icon, role, sub, desc, perms, dark]) => (
                            <div key={role as string} className={`rounded-3xl ${dark ? 'bg-aqua-800 border-aqua-600/40' : 'bg-aqua-50/60 border-aqua-200/40'} border p-6 flex flex-col gap-5 hover:-translate-y-1.5 transition-transform duration-300 hover:shadow-[0_8px_40px_-8px_rgba(0,128,128,0.18)]`}>
                                <div className={`w-12 h-12 rounded-2xl ${dark ? 'bg-aqua-200/15 border border-aqua-200/25' : 'bg-white border border-aqua-200/60'} flex items-center justify-center`}>
                                    <Icon name={icon as string} className={`${dark ? 'text-aqua-200' : 'text-aqua-600'} text-[22px]`} />
                                </div>
                                <div>
                                    <p className={`text-[10px] font-bold ${dark ? 'text-aqua-300/60' : 'text-aqua-500'} uppercase tracking-widest mb-1`}>{sub as string}</p>
                                    <h3 className={`font-black ${dark ? 'text-white' : 'text-aqua-900'} text-lg`}>{role as string}</h3>
                                </div>
                                <p className={`${dark ? 'text-aqua-200/55' : 'text-aqua-700/60'} text-sm leading-relaxed flex-1`}>{desc as string}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {(perms as string[]).map((perm) => (
                                        <span key={perm} className={`${dark ? 'bg-aqua-200/10 text-aqua-200 border-aqua-200/20' : 'bg-white text-aqua-600 border-aqua-200/60'} text-[10px] font-bold border px-2.5 py-1 rounded-full uppercase tracking-wider`}>
                                            {perm}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 bg-aqua-200/15 border-y border-aqua-200/40">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <Icon name="format_quote" className="text-aqua-300 mb-4 block text-[32px]" />
                    <blockquote className="text-2xl font-black text-aqua-900 tracking-tight leading-snug mb-4 font-headline">
                        "Menyatukan peta kurikulum, outcome, dan dokumen pembelajaran dalam satu portal akademik."
                    </blockquote>
                    <p className="text-aqua-600/60 text-sm font-bold uppercase tracking-widest">Politeknik Manufaktur Bandung</p>
                </div>
            </section>

            <section className="py-24 bg-white">
                <div className="max-w-2xl mx-auto px-6">
                    <div className="bg-aqua-800 rounded-[2.5rem] p-12 text-center relative overflow-hidden">
                        <div className="absolute inset-0 dot-grid opacity-[0.07] pointer-events-none" />
                        <div className="blob w-[60%] h-[80%] bg-aqua-300/10 -top-[20%] -right-[20%]" />
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-3xl bg-aqua-200/15 border border-aqua-200/25 flex items-center justify-center mx-auto mb-6">
                                <Icon name="rocket_launch" className="text-aqua-200 text-[28px]" />
                            </div>
                            <h2 className="text-4xl font-black text-white tracking-tight mb-3 font-headline">Siap memulai?</h2>
                            <p className="text-aqua-200/55 mb-8 text-base max-w-sm mx-auto leading-relaxed">Masuk ke sistem dan mulai kelola dokumen kurikulum sekarang juga.</p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center justify-center gap-2 bg-aqua-200 text-aqua-900 px-8 py-4 rounded-2xl font-black text-sm hover:bg-aqua-300 transition-colors active:scale-95 shadow-xl shadow-aqua-900/30"
                                >
                                    <Icon name="login" className="text-base" />
                                    Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-aqua-200/30 bg-white">
                <div className="max-w-7xl mx-auto px-6 py-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-aqua-800 flex items-center justify-center overflow-hidden">
                                <img src="/images/polman-logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                            </div>
                            <div>
                                <p className="font-black text-aqua-900 text-sm">POLMAN Bandung</p>
                                <p className="text-aqua-600/50 text-[10px] font-semibold">Curriculum Management System</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <a href="#fitur" className="text-xs text-aqua-600/60 hover:text-aqua-700 font-semibold transition-colors">Fitur</a>
                            <a href="#alur" className="text-xs text-aqua-600/60 hover:text-aqua-700 font-semibold transition-colors">Alur</a>
                            <a href="#role" className="text-xs text-aqua-600/60 hover:text-aqua-700 font-semibold transition-colors">Pengguna</a>
                        </div>
                        <p className="text-[11px] text-aqua-500/40 font-semibold uppercase tracking-widest">© 2026 - POLMAN Bandung</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}