import React, { PropsWithChildren, ReactNode, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

interface Props {
    header?: ReactNode;
}

interface MenuLinkProps {
    href: string;
    active: boolean;
    icon: string;
    children: ReactNode;
}

function MaterialIcon({ name, className = 'text-xl' }: { name: string; className?: string }) {
    return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function MenuLink({ href, active, icon, children }: MenuLinkProps) {
    return (
        <Link
            href={href}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                active
                    ? 'bg-aqua-200 text-primary font-black shadow-lg'
                    : 'text-white/60 hover:bg-white/5 hover:text-aqua-200'
            }`}
        >
            <MaterialIcon name={icon} />
            <span>{children}</span>
        </Link>
    );
}

function SubMenuLink({ href, active, children, onClick }: { href: string; active: boolean; children: ReactNode; onClick?: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`block py-2.5 text-xs font-bold transition-colors ${
                active ? 'text-aqua-200' : 'text-white/40 hover:text-aqua-200'
            }`}
        >
            {children}
        </Link>
    );
}

export default function AuthenticatedLayout({ children }: PropsWithChildren<Props>) {
    const { user, roles } = usePage().props.auth as any;

    console.log("========== DEBUG ==========");
    console.log("roles :", roles);
    console.log("includes :", roles?.includes("Admin Jurusan"));
    console.log("===========================");

    const { tenant } = usePage().props as any;
    const tenantKode = tenant?.kode ?? 'PORTAL';
    const currentUrl = usePage().url;

    const isMasterAdmin = roles?.includes('Master Admin');
    const isAdmin = roles?.includes('Admin Jurusan');
    const isKaprodi = roles?.includes('Kaprodi');
    const isDosen = roles?.includes('Dosen');


    const isMasterDataActive = currentUrl.startsWith('/cpl') ||
        currentUrl.startsWith('/ppm') ||
        currentUrl.startsWith('/iea') ||
        currentUrl.startsWith('/indikator-kinerja') ||
        currentUrl.startsWith('/mata-kuliah') ||
        currentUrl.startsWith('/cpmk') ||
        currentUrl.startsWith('/rps');

    const isAsesmenActive = currentUrl.startsWith('/asesmen');
    const [isAsesmenFolderOpen, setIsAsesmenFolderOpen] = useState(isAsesmenActive);
    const [isMasterFolderOpen, setIsMasterFolderOpen] = useState(isMasterDataActive);
    const roleLabel =
        isAdmin
            ? 'Admin Jurusan'
            : isKaprodi
                ? 'Kaprodi'
                : 'Dosen';
                
    const initials = (user?.name ?? 'User')
        .split(' ')
        .slice(0, 2)
        .map((part: string) => part.charAt(0))
        .join('')
        .toUpperCase();

    return (
        <div className="flex h-screen overflow-hidden bg-surface font-body text-on-surface print:block print:h-auto print:overflow-visible">
            <aside className="w-72 bg-primary text-white flex flex-col z-20 shadow-2xl flex-shrink-0 h-screen print:hidden">
                <div className="p-6 flex items-center gap-4 border-b border-white/10">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src="/images/polman-logo.png" alt="POLMAN" className="w-12 h-12 object-contain" />
                    </div>
                    <span className="text-3xl font-black tracking-tighter italic uppercase text-white leading-none font-headline">
                        {tenantKode} <span className="text-aqua-200">PORTAL</span>
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto pb-6 text-sm font-semibold">
                    <p className="px-4 text-[10px] uppercase tracking-[0.2em] text-aqua-200/50 font-bold mb-3">Main Menu</p>

                    <MenuLink href={route('dashboard')} active={currentUrl.startsWith('/dashboard')} icon="dashboard">
                        Dashboard
                    </MenuLink>


                    {/* ================= MENU DOSEN ================= */}

                    {isDosen && (
                        <>
                            <div className="h-px bg-white/5 my-3 mx-4" />

                            <p className="px-4 text-[10px] uppercase tracking-[0.2em] text-aqua-200/50 font-bold mb-3">
                                Akademik
                            </p>

                            <MenuLink
                                href={route('rps.index')}
                                active={currentUrl.startsWith('/rps')}
                                icon="description"
                            >
                                Kelola RPS
                            </MenuLink>

                            <MenuLink
                                href={route('matrix.index')}
                                active={currentUrl.startsWith('/matrix')}
                                icon="hub"
                            >
                                Curriculum Map
                            </MenuLink>

                        </>
                    )}

                    {/* ================= MENU KAPRODI ================= */}
                    {isKaprodi && (
                        <>
                            <div className="h-px bg-white/5 my-3 mx-4" />

                            <p className="px-4 text-[10px] uppercase tracking-[0.2em] text-aqua-200/50 font-bold mb-3">
                                Akademik
                            </p>

                            <MenuLink
                                href={route('matrix.index')}
                                active={currentUrl.startsWith('/matrix')}
                                icon="hub"
                            >
                                Curriculum Matrix
                            </MenuLink>

                            <MenuLink
                                href={route('biodata-dosen.index')}
                                active={currentUrl.startsWith('/biodata-dosen')}
                                icon="badge"
                            >
                                Data Dosen
                            </MenuLink>

                            <div>
                                <button
                                    type="button"
                                    onClick={() => setIsMasterFolderOpen(!isMasterFolderOpen)}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${
                                        isMasterDataActive
                                            ? 'text-aqua-200'
                                            : 'text-white/60 hover:bg-white/5 hover:text-aqua-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <MaterialIcon name="database" />
                                        <span>Master Data</span>
                                    </div>

                                    <MaterialIcon
                                        name="chevron_right"
                                        className={`text-sm transition-transform ${
                                            isMasterFolderOpen ? 'rotate-90' : ''
                                        }`}
                                    />
                                </button>

                                <div className={`${isMasterFolderOpen ? 'block' : 'hidden'} ml-10 mt-1 space-y-1 border-l border-white/10 pl-3`}>
                                    <SubMenuLink href={route('ppm.index')} active={currentUrl.startsWith('/ppm')}>
                                        Data PPM
                                    </SubMenuLink>

                                    <SubMenuLink href={route('iea.index')} active={currentUrl.startsWith('/iea')}>
                                        Data IEA
                                    </SubMenuLink>

                                    <SubMenuLink href={route('cpl.index')} active={currentUrl.startsWith('/cpl')}>
                                        Data CPL
                                    </SubMenuLink>

                                    <SubMenuLink
                                        href={route('indikator-kinerja.index')}
                                        active={currentUrl.startsWith('/indikator-kinerja')}
                                    >
                                        Indikator Kinerja
                                    </SubMenuLink>

                                    <SubMenuLink
                                        href={route('mata-kuliah.index')}
                                        active={currentUrl.startsWith('/mata-kuliah') || currentUrl.startsWith('/cpmk')}
                                    >
                                        Mata Kuliah
                                    </SubMenuLink>
                                </div>
                            </div>

                            <MenuLink
                                href={route('rps.index')}
                                active={currentUrl.startsWith('/rps')}
                                icon="description"
                            >
                                RPS
                            </MenuLink>

                            <div className="h-px bg-white/5 my-3 mx-4" />

                            <p className="px-4 text-[10px] uppercase tracking-[0.2em] text-aqua-200/50 font-bold mb-3">
                                Evaluasi
                            </p>

                            <div>
                                <button
                                    type="button"
                                    onClick={() => setIsAsesmenFolderOpen(!isAsesmenFolderOpen)}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${
                                        isAsesmenActive
                                            ? 'text-aqua-200'
                                            : 'text-white/60 hover:bg-white/5 hover:text-aqua-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <MaterialIcon name="assessment" />
                                        <span>Asesmen CPL</span>
                                    </div>

                                    <MaterialIcon
                                        name="chevron_right"
                                        className={`text-sm transition-transform ${
                                            isAsesmenFolderOpen ? 'rotate-90' : ''
                                        }`}
                                    />
                                </button>

                                <div className={`${isAsesmenFolderOpen ? 'block' : 'hidden'} ml-10 mt-1 space-y-1 border-l border-white/10 pl-3`}>
                                    <SubMenuLink
                                        href={route('asesmen.index')}
                                        active={currentUrl === '/asesmen'}
                                    >
                                        Dashboard Asesmen
                                    </SubMenuLink>

                                    <SubMenuLink
                                        href={route('asesmen.kelas')}
                                        active={currentUrl.startsWith('/asesmen/kelas')}
                                    >
                                        Kelola Kelas
                                    </SubMenuLink>

                                    <SubMenuLink
                                        href={route('asesmen.mahasiswa')}
                                        active={currentUrl.startsWith('/asesmen/mahasiswa')}
                                    >
                                        Kelola Mahasiswa
                                    </SubMenuLink>

                                    <SubMenuLink
                                        href={route('asesmen.rerata')}
                                        active={currentUrl.startsWith('/asesmen/rerata')}
                                    >
                                        Rerata CPL
                                    </SubMenuLink>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ================= MENU ADMIN JURUSAN ================= */}

                    {isAdmin && (
                        <>
                            <div className="h-px bg-white/5 my-3 mx-4" />

                            <p className="px-4 text-[10px] uppercase tracking-[0.2em] text-aqua-200/50 font-bold mb-3">
                                Manajemen
                            </p>

                            {/* Biodata Dosen */}
                            <MenuLink
                                href={route('biodata-dosen.index')}
                                active={currentUrl.startsWith('/biodata-dosen')}
                                icon="badge"
                            >
                                Biodata Dosen
                            </MenuLink>

                            {/* Akun Dosen */}
                            <MenuLink
                                href={route('dosen.index')}
                                active={currentUrl.startsWith('/dosen')}
                                icon="manage_accounts"
                            >
                                Akun Dosen
                            </MenuLink>

                            {/* Mahasiswa */}
                            <MenuLink
                                href={route('asesmen.mahasiswa')}
                                active={currentUrl.startsWith('/asesmen/mahasiswa')}
                                icon="groups"
                            >
                                Kelola Mahasiswa
                            </MenuLink>

                            {/* Kelas */}
                            <MenuLink
                                href={route('asesmen.kelas')}
                                active={currentUrl.startsWith('/asesmen/kelas')}
                                icon="school"
                            >
                                Kelola Kelas
                            </MenuLink>
                        </>
                    )}

                </nav>
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition">
                        <div className="w-10 h-10 rounded-xl bg-[#003d3d] border border-white/20 flex items-center justify-center font-black text-white text-sm flex-shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white truncate">{user?.name}</p>
                            <p className="text-[10px] text-aqua-200/50 uppercase tracking-widest font-bold">{roleLabel}</p>
                        </div>
                        <Link
                            method="post"
                            href={route('logout')}
                            as="button"
                            className="p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-white/5 transition-all"
                            title="Logout"
                        >
                            <MaterialIcon name="logout" />
                        </Link>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-screen overflow-hidden print:block print:h-auto print:overflow-visible print:w-full">
                <header className="bg-white border-b border-gray-100 px-8 h-16 flex items-center justify-between flex-shrink-0 shadow-sm print:hidden">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">POLMAN Bandung</p>
                        <p className="text-xs font-black italic text-primary uppercase">{tenantKode} Curriculum Portal</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative mr-2 hidden lg:block">
                            <MaterialIcon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-lg" />
                            <input
                                type="text"
                                placeholder="Cari kurikulum, CPL, RPS..."
                                className="pl-10 pr-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-aqua-200 outline-none text-sm w-60 placeholder:text-gray-300"
                            />
                        </div>

                        <button className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-gray-50 transition text-gray-300 hover:text-primary relative">
                            <MaterialIcon name="notifications" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2dce89] rounded-full" />
                        </button>
                        <Link href={route('profile.edit')} className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-gray-50 transition text-gray-300 hover:text-primary">
                            <MaterialIcon name="settings" />
                        </Link>
                        <div className="w-px h-6 bg-gray-100 mx-1" />
                        <Link href={route('profile.edit')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-primary leading-tight">{user?.name}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{roleLabel}</p>
                            </div>
                            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                                {initials.charAt(0)}
                            </div>
                        </Link>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-10 bg-surface print:overflow-visible print:h-auto print:p-0">
                    {children}
                </main>
            </div>
        </div>
    );
}