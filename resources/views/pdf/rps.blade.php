<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Dokumen RPS</title>
    <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 11px; }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 0; 
        }
        /* Class sakti untuk menempelkan tabel */
        .table-nempel {
            margin-top: -1px; 
        }
        /* Mencegah baris terpotong di tengah-tengah teks saat pindah halaman */
        tr { page-break-inside: avoid; page-break-after: auto; }
        th, td { border: 1px solid #000; padding: 5px; vertical-align: top; }
        
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        
        .bg-kop { background-color: #e0f2f7; }
        .bg-gray { background-color: #d9d9d9; }
        .tte-img { max-height: 50px; max-width: 90px; }
    </style>
</head>
<body>
    @php
        $prodiMap = [
            'RPS_TRIN' => 'Teknologi Rekayasa Informatika Industri',
            'RPS_TRO' => 'Teknologi Rekayasa Otomasi',
            'RPS_TRMO' => 'Teknologi Rekayasa Mekatronika',
            'RPS_TRSA' => 'Teknologi Rekayasa Sistem Aerial Nirawak',
        ];

        // FIX: bug yang sama seperti di RpsController@printPdf.
        // $rps->kode_dokumen formatnya "RPS_TRO_16AE302" (sudah termasuk
        // kode MK), sedangkan key di $prodiMap cuma "RPS_TRO" — kalau
        // di-lookup langsung pakai $rps->kode_dokumen TIDAK PERNAH cocok.
        // Header "Program Studi ..." di halaman 1 PDF selama ini
        // kemungkinan selalu nampilin kode mentah, bukan nama lengkap prodi.
        $segmenKodeDokumen = explode('_', $rps->kode_dokumen);
        $kunciProdiMap = 'RPS_' . ($segmenKodeDokumen[1] ?? '');
    @endphp

    <table>
        <tr class="bg-kop">
            <td width="20%" class="text-center" style="vertical-align: middle;">
                <img src="{{ public_path('images/polman-logo.png') }}" alt="Logo Polman" style="width: 80px;">
            </td>
            <td width="60%" class="text-center font-bold" style="vertical-align: middle;">
                Politeknik Manufaktur Bandung<br>
                Jurusan Teknik Otomasi Manufaktur dan Mekatronika<br>
                Program Studi {{ $prodiMap[$kunciProdiMap] ?? $rps->kode_dokumen }}
            </td>
            <td width="20%" class="text-center font-bold" style="vertical-align: middle;">
                {{ $rps->kode_dokumen }}_{{ $rps->mataKuliah->kode_mk }}
            </td>
        </tr>
        <tr class="bg-kop">
            <td colspan="3" class="text-center font-bold" style="font-size: 13px;">RENCANA PEMBELAJARAN SEMESTER (RPS)</td>
        </tr>
    </table>

    <table class="table-nempel">
        <tr><td colspan="4" class="font-bold bg-gray text-center uppercase">Identitas Mata Kuliah</td></tr>
        <tr>
            <td width="15%" class="font-bold">Mata Kuliah</td>
            <td width="35%">{{ $rps->mataKuliah->nama_mk }}</td>
            <td width="15%" class="font-bold">Kode MK</td>
            <td width="35%">{{ $rps->mataKuliah->kode_mk }}</td>
        </tr>
        <tr>
            <td class="font-bold">Dosen Pengampu</td>
            <td>{{ $rps->dosenBiodata ? trim(implode(' ', array_filter([$rps->dosenBiodata->gelar_depan, $rps->dosenBiodata->nama_lengkap, $rps->dosenBiodata->gelar_belakang]))) : '-' }}</td>
            <td class="font-bold">Tahun Akademik</td>
            <td>{{ $rps->tahun_akademik }}</td>
        </tr>
        <tr>
            <td class="font-bold">Tgl Penyusunan</td>
            <td>{{ \Carbon\Carbon::parse($rps->tanggal_penyusunan)->translatedFormat('d F Y') }}</td>
            <td class="font-bold">MK Prasyarat</td>
            <td>
                @if($rps->mataKuliah->prasyarats->isNotEmpty())
                    {{ $rps->mataKuliah->prasyarats->map(fn($mk) => "{$mk->nama_mk} ({$mk->kode_mk})")->implode(', ') }}
                @else
                    -
                @endif
            </td>
        </tr>
    </table>

<table class="table-nempel">
        <tr><td colspan="3" class="font-bold bg-gray text-center uppercase">Otorisasi / Pengesahan</td></tr>
        <tr class="text-center font-bold">
            <td width="33.3%">Dosen Pengampu</td>
            <td width="33.3%">Kepala Program Studi</td>
            <td width="33.3%">Ketua Jurusan</td>
        </tr>
        <tr class="text-center">
            <td style="height: 80px; vertical-align: bottom; padding-bottom: 5px;">
                @if($rps->tte_dosen) 
                    <img src="{{ storage_path('app/public/' . $rps->tte_dosen) }}" class="tte-img"><br>
                @else
                    <div style="height: 50px;"></div>
                @endif
                <u>{{ $namaDosen }}</u>
            </td>
            <td style="height: 80px; vertical-align: bottom; padding-bottom: 5px;">
                @if($rps->tte_kaprodi) 
                    <img src="{{ storage_path('app/public/' . $rps->tte_kaprodi) }}" class="tte-img"><br>
                @else
                    <div style="height: 50px;"></div>
                @endif
                <u>{{ $namaKaprodi }}</u>
            </td>
            <td style="height: 80px; vertical-align: bottom; padding-bottom: 5px;">
                @if($rps->tte_kajur) 
                    <img src="{{ storage_path('app/public/' . $rps->tte_kajur) }}" class="tte-img"><br>
                @else
                    <div style="height: 50px;"></div>
                @endif
                <u>{{ $namaKajur }}</u>
            </td>
        </tr>
    </table>

    @php
        $cpmks = $rps->mataKuliah->cpmks ?? collect();
        $indikators = collect();
        foreach($cpmks as $cpmk) {
            foreach($cpmk->indikatorKinerjas as $ik) {
                $indikators->push($ik);
            }
        }
        $uniqueIndikators = $indikators->unique('id');
    @endphp

    <table class="table-nempel">
        <tr>
            <td width="15%" class="font-bold bg-gray">Deskripsi Singkat</td>
            <td colspan="3" width="85%">
                {{ $rps->mataKuliah->deskripsi ?? 'Tidak ada deskripsi.' }}
            </td>
        </tr>
        <tr>
            <td colspan="4" class="font-bold uppercase bg-gray text-center">Capaian Pembelajaran (CPL)</td>
        </tr>
        <tr class="font-bold bg-gray text-center">
            <td colspan="2" width="50%">CPL-PRODI yang dibebankan pada MK</td>
            <td colspan="2" width="50%">Indikator Kinerja</td>
        </tr>
        
        @forelse($uniqueIndikators as $ind)
        <tr>
            <td width="15%" class="text-center font-bold">{{ $ind->cpl->kode_cpl ?? $ind->cpl->kode ?? '-' }}</td>
            <td width="35%">{{ $ind->cpl->deskripsi ?? '-' }}</td>
            <td width="15%" class="text-center font-bold">{{ $ind->kode ?? '-' }}</td>
            <td width="35%">{{ $ind->deskripsi ?? '-' }}</td>
        </tr>
        @empty
        <tr><td colspan="4" class="text-center text-gray-500">Data CPL/Indikator belum dipetakan.</td></tr>
        @endforelse

        <tr>
            <td colspan="4" class="font-bold uppercase bg-gray text-center">Capaian Pembelajaran Mata Kuliah (CPMK)</td>
        </tr>
        @forelse($cpmks as $cpmk)
        <tr>
            <td class="text-center font-bold">{{ $cpmk->indikatorKinerjas->pluck('kode')->join(', ') ?: '-' }}</td>
            <td width="15%" class="font-bold text-center">{{ $cpmk->kode_cpmk }}</td>
            <td colspan="2" width="70%">{{ $cpmk->deskripsi }}</td>
        </tr>
        @empty
        <tr><td colspan="4" class="text-center text-gray-500">Data CPMK belum ada.</td></tr>
        @endforelse
    </table>

    <table class="table-nempel">
        <tr>
            <td width="15%" class="font-bold bg-gray uppercase">Bahan Kajian</td>
            <td width="85%">{!! nl2br(e($rps->bahan_kajian_utama)) !!}</td>
        </tr>
    </table>
                        
    @if($rps->penilaians->count() > 0)
    @php
        $labels = $rps->penilaians->map(fn($p) => $p->cpmk->kode_cpmk ?? 'N/A')->toArray();
        $kl = $rps->komponen_labels; // custom labels
        $datasets = [
            ['label' => $kl['quiz'] ?? 'Quiz', 'data' => $rps->penilaians->pluck('quiz')->map(fn($v) => (float)$v)->toArray(), 'borderColor' => '#3b82f6', 'backgroundColor' => 'rgba(59,130,246,0.1)'],
            ['label' => $kl['tugas'] ?? 'Tugas', 'data' => $rps->penilaians->pluck('tugas')->map(fn($v) => (float)$v)->toArray(), 'borderColor' => '#10b981', 'backgroundColor' => 'rgba(16,185,129,0.1)'],
            ['label' => $kl['project'] ?? 'Project', 'data' => $rps->penilaians->pluck('project')->map(fn($v) => (float)$v)->toArray(), 'borderColor' => '#f59e0b', 'backgroundColor' => 'rgba(245,158,11,0.1)'],
            ['label' => $kl['uts'] ?? 'UTS', 'data' => $rps->penilaians->pluck('uts')->map(fn($v) => (float)$v)->toArray(), 'borderColor' => '#8b5cf6', 'backgroundColor' => 'rgba(139,92,246,0.1)'],
            ['label' => $kl['uas'] ?? 'UAS', 'data' => $rps->penilaians->pluck('uas')->map(fn($v) => (float)$v)->toArray(), 'borderColor' => '#ef4444', 'backgroundColor' => 'rgba(239,68,68,0.1)'],
        ];

        $allValues = collect($datasets)->flatMap(fn($ds) => $ds['data'])->filter(fn($v) => $v > 0);
        $maxValue = $allValues->max() ?? 50;
        $suggestedMax = $maxValue <= 10 ? 10 : ($maxValue <= 20 ? 20 : ($maxValue <= 50 ? 50 : ceil($maxValue / 10) * 10));
        $stepSize = $suggestedMax <= 10 ? 2 : ($suggestedMax <= 20 ? 5 : 10);

        $chartConfig = [
            'type' => 'radar',
            'data' => ['labels' => $labels, 'datasets' => $datasets],
            'options' => [
                'scale' => ['ticks' => ['min' => 0, 'max' => $suggestedMax, 'stepSize' => $stepSize]],
                'legend' => ['position' => 'bottom', 'labels' => ['fontSize' => 9]]
            ]
        ];
        $chartUrl = "https://quickchart.io/chart?w=350&h=250&c=" . urlencode(json_encode($chartConfig));
    @endphp

    <table class="table-nempel">
        <tr><td colspan="8" class="font-bold uppercase bg-gray text-center">Sistem Evaluasi (Bobot %)</td></tr>
        <tr class="text-center font-bold bg-gray">
            <td rowspan="2" width="10%" style="vertical-align: middle;">CPMK</td>
            <td colspan="5">Bobot per Bentuk Penilaian (%)</td>
            <td rowspan="2" width="10%" style="vertical-align: middle;">Total</td>
            <td rowspan="{{ $rps->penilaians->count() + 3 }}" width="35%" style="vertical-align: middle; background-color: #fff; text-align: center;">
                <strong>Visualisasi Distribusi Penilaian</strong><br><br>
                <img src="{{ $chartUrl }}" style="width: 250px;">
            </td>
        </tr>
        <tr class="text-center font-bold bg-gray">
            <td width="9%">{{ $kl['quiz'] ?? 'Quiz' }}</td>
            <td width="9%">{{ $kl['tugas'] ?? 'Tugas' }}</td>
            <td width="9%">{{ $kl['project'] ?? 'Project' }}</td>
            <td width="9%">{{ $kl['uts'] ?? 'UTS' }}</td>
            <td width="9%">{{ $kl['uas'] ?? 'UAS' }}</td>
        </tr>
        
        @php
            $sumQuiz = 0; $sumTugas = 0; $sumProject = 0; $sumUts = 0; $sumUas = 0; $grandTotal = 0;
        @endphp

        @foreach($rps->penilaians as $nilai)
            @php
                $rowTotal = $nilai->quiz + $nilai->tugas + $nilai->project + $nilai->uts + $nilai->uas;
                $sumQuiz += $nilai->quiz; $sumTugas += $nilai->tugas; $sumProject += $nilai->project;
                $sumUts += $nilai->uts; $sumUas += $nilai->uas; $grandTotal += $rowTotal;
            @endphp
            <tr class="text-center">
                <td class="font-bold">{{ $nilai->cpmk->kode_cpmk ?? 'N/A' }}</td>
                <td>{{ $nilai->quiz > 0 ? floatval($nilai->quiz) : '-' }}</td>
                <td>{{ $nilai->tugas > 0 ? floatval($nilai->tugas) : '-' }}</td>
                <td>{{ $nilai->project > 0 ? floatval($nilai->project) : '-' }}</td>
                <td>{{ $nilai->uts > 0 ? floatval($nilai->uts) : '-' }}</td>
                <td>{{ $nilai->uas > 0 ? floatval($nilai->uas) : '-' }}</td>
                <td class="font-bold">{{ floatval($rowTotal) }}</td>
            </tr>
        @endforeach
        <tr class="text-center font-bold bg-gray">
            <td>Total</td>
            <td>{{ floatval($sumQuiz) }}</td>
            <td>{{ floatval($sumTugas) }}</td>
            <td>{{ floatval($sumProject) }}</td>
            <td>{{ floatval($sumUts) }}</td>
            <td>{{ floatval($sumUas) }}</td>
            <td>{{ floatval($grandTotal) }}</td>
        </tr>
    </table>
    @endif

    <table class="table-nempel">
        <tr>
            <td width="15%" class="font-bold bg-gray uppercase" rowspan="3" style="vertical-align: top;">Pustaka</td>
            <td width="85%" style="background-color: #eaeaea; padding: 6px;">
                <strong>Penilaian Huruf Mutu</strong><br>
                Hasil kumulatif evaluasi selanjutnya akan ditampilkan dalam bentuk huruf mutu (skoring) dengan kriteria bobot sebagai berikut:
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 4px; background-color: #eaeaea;">
                    <tr>
                        <td style="border: 1px solid #a0a0a0; padding: 3px; width: 33%;">A : Nilai &gt;= 85</td>
                        <td style="border: 1px solid #a0a0a0; padding: 3px; width: 33%;">BC : 63 &lt;= Nilai &lt; 70</td>
                        <td style="border: 1px solid #a0a0a0; padding: 3px; width: 34%;">E : Nilai &lt; 40</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #a0a0a0; padding: 3px;">AB : 78 &lt;= Nilai &lt; 85</td>
                        <td style="border: 1px solid #a0a0a0; padding: 3px;">C : 55 &lt;= Nilai &lt; 63</td>
                        <td style="border: 1px solid #a0a0a0; padding: 3px;"></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #a0a0a0; padding: 3px;">B : 70 &lt;= Nilai &lt; 78</td>
                        <td style="border: 1px solid #a0a0a0; padding: 3px;">D : 40 &lt;= Nilai &lt; 55</td>
                        <td style="border: 1px solid #a0a0a0; padding: 3px; text-align: center;">Nilai TL (komponen nilai tidak lengkap)</td>
                    </tr>
                </table>
                
                X: Ambang batas persentase minimal kelulusan CPMK=55%<br>
                Y: Ambang batas minimal persentse jumlah mahasiswa yang lulus CPMK matakuliah=50%<br>
                <em>Key Performance Indicator (KPI): X=50% dan Y=55%</em>
            </td>
        </tr>
        <tr>
            <td style="padding: 6px;">
                <strong>Pustaka Utama:</strong><br>
                {!! nl2br(e($rps->pustaka_utama)) !!}
            </td>
        </tr>
        <tr>
            <td style="padding: 6px;">
                <strong>Pustaka Pendukung:</strong><br>
                {!! nl2br(e($rps->pustaka_pendukung)) !!}
            </td>
        </tr>
    </table>

    <table class="table-nempel">
        <tr><td colspan="9" class="font-bold uppercase bg-gray text-center">Rencana Pembelajaran Mingguan</td></tr>
        <tr class="text-center font-bold bg-gray">
            <td width="4%" rowspan="2" style="vertical-align: middle;">Pt Ke-</td>
            <td width="15%" rowspan="2" style="vertical-align: middle;">Kemampuan Akhir Tiap Tahapan Belajar</td>
            <td colspan="3" width="24%">Penilaian</td>
            <td width="15%" rowspan="2" style="vertical-align: middle;">Bahan Kajian (Materi Pembelajaran)</td>
            <td width="18%" rowspan="2" style="vertical-align: middle;">Modalitas, Bentuk, Strategi, dan Metode Pembelajaran</td>
            <td width="9%" rowspan="2" style="vertical-align: middle;">Estimasi Waktu</td>
            <td width="15%" rowspan="2" style="vertical-align: middle;">Pengalaman Belajar Mahasiswa</td>
        </tr>
        <tr class="text-center font-bold bg-gray">
            <td width="10%">Indikator</td>
            <td width="8%">Komponen</td>
            <td width="6%">Bobot %</td>
        </tr>
        @foreach($rps->details as $dt)
        <tr>
            <td class="text-center font-bold">{{ $dt->pertemuan_ke }}</td>
            <td>{!! nl2br(e($dt->kemampuan_akhir)) !!}</td>
            <td>{!! nl2br(e($dt->indikator)) !!}</td>
            <td>{!! nl2br(e($dt->penilaian_komponen)) !!}</td>
            <td class="text-center font-bold">{{ floatval($dt->penilaian_bobot) }}</td>
            <td>{!! nl2br(e($dt->bahan_kajian)) !!}</td>
            <td>{!! nl2br(e($dt->metode_pembelajaran)) !!}</td>
            <td>{!! nl2br(e($dt->estimasi_waktu)) !!}</td>
            <td>{!! nl2br(e($dt->pengalaman_belajar)) !!}</td>
        </tr>
        @endforeach
    </table>

</body>
</html>