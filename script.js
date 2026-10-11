// ==========================================================================
// LOGIKA SISTEM DATA MAHASISWA - STABIL, ROBUST & TAHAN SEGALA BROWSER
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  inisialisasiAplikasi();
});

// Jalankan juga langsung jika DOM sudah siap
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  inisialisasiAplikasi();
}

let aplikasiTerinisialisasi = false;

function inisialisasiAplikasi() {
  if (aplikasiTerinisialisasi) return;
  aplikasiTerinisialisasi = true;

  // 1. Referensi Elemen Formulir & Pesan Error Kolom
  const form = document.getElementById('formMahasiswa');
  const namaInput = document.getElementById('nama');
  const nimInput = document.getElementById('nim');
  const prodiInput = document.getElementById('prodi');
  const nilaiInput = document.getElementById('nilai');
  const btnSubmit = document.getElementById('btnSubmit');
  const pesan = document.getElementById('pesan');

  const errNama = document.getElementById('err-nama');
  const errNim = document.getElementById('err-nim');
  const errProdi = document.getElementById('err-prodi');
  const errNilai = document.getElementById('err-nilai');

  // 2. Referensi Elemen Tabel & Rekapitulasi
  const daftarTbody = document.getElementById('daftarMahasiswa');
  const tabelMahasiswa = document.getElementById('tabelMahasiswa');
  const emptyState = document.getElementById('emptyState');
  const btnReset = document.getElementById('btnReset');
  const tableScrollHint = document.getElementById('tableScrollHint');

  // 3. Referensi Elemen Kartu Statistik
  const statTotal = document.getElementById('statTotal');
  const statLulus = document.getElementById('statLulus');
  const statBelumLulus = document.getElementById('statBelumLulus');
  const statRataRata = document.getElementById('statRataRata');

  // 4. Referensi Elemen Modal Konfirmasi Hapus & Reset
  const modalKonfirmasi = document.getElementById('modalKonfirmasi');
  const modalIcon = document.querySelector('.modal-icon');
  const modalJudul = document.getElementById('modalJudul');
  const modalPesan = document.getElementById('modalPesan');
  const modalBtnBatal = document.getElementById('modalBtnBatal');
  const modalBtnKonfirmasi = document.getElementById('modalBtnKonfirmasi');

  let aksiModalCallback = null;
  let timerPesan = null;

  // ========================================================================
  // PENANGANAN PENYIMPANAN DATA AMAN (SAFE STORAGE)
  // ========================================================================
  function muatDataAwal() {
    try {
      const dataTersimpan = localStorage.getItem('dataMahasiswaFormal') || localStorage.getItem('dataMahasiswaPastel');
      if (dataTersimpan) {
        const parsed = JSON.parse(dataTersimpan);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Penyimpanan lokal tidak tersedia (mode berkas/sandbox):', err);
    }

    // Data awal contoh agar tabel dan tombol langsung teruji fungsional
    return [
      {
        nama: 'Aulia Zahra Salsabila',
        nim: '2310512001',
        prodi: 'Teknik Informatika',
        nilai: 88,
        predikat: 'A',
        status: 'Lulus'
      },
      {
        nama: 'Budi Santoso Wibowo',
        nim: '2310512045',
        prodi: 'Sistem Informasi',
        nilai: 55,
        predikat: 'D',
        status: 'Belum Lulus'
      }
    ];
  }

  let mahasiswa = muatDataAwal();

  function simpanData() {
    try {
      localStorage.setItem('dataMahasiswaFormal', JSON.stringify(mahasiswa));
    } catch (err) {
      console.warn('Gagal menyimpan data ke penyimpanan lokal:', err);
    }
  }

  // ========================================================================
  // SISTEM ERROR PER KOLOM (SIMPEL & TEPAT SASARAN)
  // ========================================================================
  function tampilkanErrorKolom(inputElem, errorElem, pesanTeks) {
    if (inputElem) inputElem.classList.add('input-error');
    if (errorElem) {
      errorElem.textContent = pesanTeks;
      errorElem.style.display = 'block';
    }
  }

  function bersihkanErrorKolom(inputElem, errorElem) {
    if (inputElem) inputElem.classList.remove('input-error');
    if (errorElem) {
      errorElem.textContent = '';
      errorElem.style.display = 'none';
    }
  }

  function bersihkanSemuaError() {
    bersihkanErrorKolom(namaInput, errNama);
    bersihkanErrorKolom(nimInput, errNim);
    bersihkanErrorKolom(prodiInput, errProdi);
    bersihkanErrorKolom(nilaiInput, errNilai);
  }

  // Event listener interaktif: error hilang begitu pengguna mengetik / memilih
  if (namaInput) {
    namaInput.addEventListener('input', () => bersihkanErrorKolom(namaInput, errNama));
  }
  if (nimInput) {
    nimInput.addEventListener('input', () => bersihkanErrorKolom(nimInput, errNim));
  }
  if (prodiInput) {
    prodiInput.addEventListener('change', () => bersihkanErrorKolom(prodiInput, errProdi));
  }
  if (nilaiInput) {
    nilaiInput.addEventListener('input', () => bersihkanErrorKolom(nilaiInput, errNilai));
  }

  // Pesan Banner Notifikasi Form (Hanya untuk Feedback Sukses atau Info Singkat)
  function tampilkanNotifikasi(teks, tipe = 'success') {
    if (!pesan) return;
    
    let iconSvg = '';
    if (tipe === 'success') {
      iconSvg = `
        <svg class="alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      `;
    } else {
      iconSvg = `
        <svg class="alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      `;
    }

    pesan.innerHTML = `${iconSvg}<span>${teks}</span>`;
    pesan.className = `alert-box active ${tipe}`;

    if (timerPesan) clearTimeout(timerPesan);
    timerPesan = setTimeout(() => {
      pesan.className = 'alert-box';
      pesan.innerHTML = '';
    }, 4500);
  }

  // ========================================================================
  // MODAL KONFIRMASI (HANYA UNTUK HAPUS & RESET DAFTAR)
  // ========================================================================
  function bukaModalKonfirmasi(judul, deskripsiHtml, onConfirm) {
    if (!modalKonfirmasi) {
      if (window.confirm(`${judul}\n\n${deskripsiHtml.replace(/<[^>]*>?/gm, '')}`)) {
        onConfirm();
      }
      return;
    }

    aksiModalCallback = onConfirm;

    if (modalIcon) {
      modalIcon.className = 'modal-icon danger';
      modalIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      `;
    }

    modalJudul.textContent = judul;
    modalPesan.innerHTML = deskripsiHtml;

    if (modalBtnBatal) modalBtnBatal.style.display = 'inline-flex';
    if (modalBtnKonfirmasi) {
      modalBtnKonfirmasi.className = 'btn btn-danger';
      modalBtnKonfirmasi.textContent = 'Lanjutkan';
    }

    modalKonfirmasi.style.display = 'flex';
  }

  function tutupModal() {
    if (modalKonfirmasi) {
      modalKonfirmasi.style.display = 'none';
    }
    aksiModalCallback = null;
  }

  if (modalBtnBatal) {
    modalBtnBatal.addEventListener('click', tutupModal);
  }

  if (modalBtnKonfirmasi) {
    modalBtnKonfirmasi.addEventListener('click', () => {
      const callback = aksiModalCallback;
      tutupModal();
      if (typeof callback === 'function') {
        callback();
      }
    });
  }

  if (modalKonfirmasi) {
    modalKonfirmasi.addEventListener('click', (e) => {
      if (e.target === modalKonfirmasi) {
        tutupModal();
      }
    });
  }

  // ========================================================================
  // 1. PRAKTIKUM PERCABANGAN: HITUNG PREDIKAT & STATUS
  // ========================================================================
  function hitungPredikat(nilai) {
    // - A: nilai >= 85
    // - B: 75 <= nilai < 85 (75–84)
    // - C: 60 <= nilai < 75 (60–74)
    // - D: nilai < 60
    if (nilai >= 85) {
      return 'A';
    } else if (nilai >= 75) {
      return 'B';
    } else if (nilai >= 60) {
      return 'C';
    } else {
      return 'D';
    }
  }

  function hitungStatus(nilai) {
    if (nilai >= 60) {
      return 'Lulus';
    } else {
      return 'Belum Lulus';
    }
  }

  // ========================================================================
  // 2. PRAKTIKUM PERULANGAN & RENDER DATA MAHASISWA (TABEL GULIR HORIZONTAL)
  // ========================================================================
  function tampilkanMahasiswa() {
    if (!daftarTbody) return;
    daftarTbody.innerHTML = '';

    let jumlahLulus = 0;
    let jumlahBelumLulus = 0;
    let totalNilai = 0;

    // Tampilkan/sembunyikan tabel, scroll hint, dan empty state
    if (mahasiswa.length === 0) {
      if (tabelMahasiswa) tabelMahasiswa.style.display = 'none';
      if (tableScrollHint) tableScrollHint.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
    } else {
      if (tabelMahasiswa) tabelMahasiswa.style.display = '';
      if (tableScrollHint) tableScrollHint.style.display = '';
      if (emptyState) emptyState.style.display = 'none';
    }

    // Perulangan membaca seluruh data array
    for (let i = 0; i < mahasiswa.length; i++) {
      const m = mahasiswa[i];
      const nilaiAngka = Number(m.nilai);
      totalNilai += nilaiAngka;

      // Percabangan status
      if (m.status === 'Lulus') {
        jumlahLulus++;
      } else {
        jumlahBelumLulus++;
      }

      const baris = document.createElement('tr');

      // 1. Kolom No
      const tdNo = document.createElement('td');
      tdNo.className = 'col-no-cell';
      tdNo.textContent = i + 1;
      baris.appendChild(tdNo);

      // 2. Kolom Nama
      const tdNama = document.createElement('td');
      tdNama.className = 'col-nama';
      tdNama.style.fontWeight = '600';
      tdNama.textContent = m.nama || '-';
      baris.appendChild(tdNama);

      // 3. Kolom NIM
      const tdNim = document.createElement('td');
      tdNim.style.fontFamily = 'monospace';
      tdNim.textContent = m.nim || '-';
      baris.appendChild(tdNim);

      // 4. Kolom Program Studi
      const tdProdi = document.createElement('td');
      const badgeProdi = document.createElement('span');
      badgeProdi.className = 'prodi-badge';
      badgeProdi.textContent = m.prodi || 'Umum';
      tdProdi.appendChild(badgeProdi);
      baris.appendChild(tdProdi);

      // 5. Kolom Nilai
      const tdNilai = document.createElement('td');
      tdNilai.style.fontWeight = '700';
      tdNilai.textContent = m.nilai;
      baris.appendChild(tdNilai);

      // 6. Kolom Predikat
      const tdPredikat = document.createElement('td');
      const badgePredikat = document.createElement('span');
      const pred = m.predikat || hitungPredikat(nilaiAngka);
      badgePredikat.className = `badge-predikat predikat-${pred}`;
      badgePredikat.textContent = pred;
      tdPredikat.appendChild(badgePredikat);
      baris.appendChild(tdPredikat);

      // 7. Kolom Status Kelulusan
      const tdStatus = document.createElement('td');
      const statusText = m.status || hitungStatus(nilaiAngka);
      const badgeStatus = document.createElement('span');
      badgeStatus.className = `badge-status ${statusText === 'Lulus' ? 'lulus' : 'belum'}`;
      
      const dot = document.createElement('span');
      dot.className = 'status-dot';
      badgeStatus.appendChild(dot);
      badgeStatus.appendChild(document.createTextNode(` ${statusText}`));
      tdStatus.appendChild(badgeStatus);
      baris.appendChild(tdStatus);

      // 8. Kolom Aksi Hapus (Tombol Hapus Baris)
      const tdAksi = document.createElement('td');
      tdAksi.className = 'col-aksi-cell';

      const btnHapus = document.createElement('button');
      btnHapus.type = 'button';
      btnHapus.className = 'btn-action-delete';
      btnHapus.title = `Hapus data ${m.nama}`;
      btnHapus.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
        <span>Hapus</span>
      `;

      // Event listener tombol hapus per baris
      const indexItem = i;
      btnHapus.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        hapusMahasiswa(indexItem);
      };

      tdAksi.appendChild(btnHapus);
      baris.appendChild(tdAksi);

      daftarTbody.appendChild(baris);
    }

    // Update Angka Statistik Metrik
    const total = mahasiswa.length;
    if (statTotal) statTotal.textContent = total;
    if (statLulus) statLulus.textContent = jumlahLulus;
    if (statBelumLulus) statBelumLulus.textContent = jumlahBelumLulus;
    if (statRataRata) statRataRata.textContent = total > 0 ? (totalNilai / total).toFixed(1) : '0.0';
  }

  // ========================================================================
  // 3. FITUR HAPUS DATA & RESET DAFTAR
  // ========================================================================
  function hapusMahasiswa(indeks) {
    if (indeks < 0 || indeks >= mahasiswa.length) return;
    const target = mahasiswa[indeks];

    bukaModalKonfirmasi(
      'Hapus Data Mahasiswa',
      `Apakah Anda yakin ingin menghapus data atas nama <strong>"${target.nama}"</strong> (${target.nim})? Data yang dihapus tidak dapat dipulihkan.`,
      () => {
        mahasiswa.splice(indeks, 1);
        simpanData();
        tampilkanMahasiswa();
        tampilkanNotifikasi(`Data mahasiswa "${target.nama}" berhasil dihapus.`, 'success');
      }
    );
  }

  // Tombol Reset / Kosongkan Daftar
  if (btnReset) {
    btnReset.onclick = function(e) {
      e.preventDefault();
      if (mahasiswa.length === 0) {
        tampilkanNotifikasi('Daftar mahasiswa saat ini sudah kosong.', 'error');
        return;
      }

      bukaModalKonfirmasi(
        'Kosongkan Seluruh Daftar',
        `Tindakan ini akan menghapus seluruh data (<strong>${mahasiswa.length} mahasiswa</strong>) dari tabel. Apakah Anda yakin ingin melanjutkan?`,
        () => {
          mahasiswa = [];
          simpanData();
          tampilkanMahasiswa();
          tampilkanNotifikasi('Seluruh daftar data mahasiswa berhasil dikosongkan.', 'success');
        }
      );
    };
  }

  // ========================================================================
  // 4. PENANGANAN VALIDASI SESUAI KOLOM YANG KOSONG (SIMPEL & TEPAT)
  // ========================================================================
  function prosesTambahMahasiswa() {
    bersihkanSemuaError();

    const nama = namaInput ? namaInput.value.trim() : '';
    const nim = nimInput ? nimInput.value.trim() : '';
    const prodi = prodiInput ? prodiInput.value : '';
    const nilaiRaw = nilaiInput ? nilaiInput.value.trim() : '';

    let adaError = false;
    let firstFocus = null;

    // Cek kolom Nama
    if (!nama) {
      tampilkanErrorKolom(namaInput, errNama, 'Nama mahasiswa wajib diisi.');
      adaError = true;
      if (!firstFocus) firstFocus = namaInput;
    }

    // Cek kolom NIM
    if (!nim) {
      tampilkanErrorKolom(nimInput, errNim, 'NIM wajib diisi.');
      adaError = true;
      if (!firstFocus) firstFocus = nimInput;
    }

    // Cek kolom Program Studi
    if (!prodi) {
      tampilkanErrorKolom(prodiInput, errProdi, 'Pilih salah satu Program Studi.');
      adaError = true;
      if (!firstFocus) firstFocus = prodiInput;
    }

    // Cek kolom Nilai
    if (!nilaiRaw) {
      tampilkanErrorKolom(nilaiInput, errNilai, 'Nilai akhir wajib diisi.');
      adaError = true;
      if (!firstFocus) firstFocus = nilaiInput;
    } else {
      const nilaiAngka = Number(nilaiRaw);
      if (isNaN(nilaiAngka) || nilaiAngka < 0 || nilaiAngka > 100) {
        tampilkanErrorKolom(nilaiInput, errNilai, 'Nilai harus berupa angka antara 0 hingga 100.');
        adaError = true;
        if (!firstFocus) firstFocus = nilaiInput;
      }
    }

    // Jika ada error pada kolom, fokuskan ke kolom pertama yang bermasalah
    if (adaError) {
      if (firstFocus) firstFocus.focus();
      return;
    }

    const nilai = Number(nilaiRaw);
    const predikat = hitungPredikat(nilai);
    const status = hitungStatus(nilai);

    // Tambahkan data ke dalam daftar
    mahasiswa.push({
      nama,
      nim,
      prodi,
      nilai,
      predikat,
      status
    });

    // Simpan ke storage & render tampilan
    simpanData();
    tampilkanMahasiswa();

    // Notifikasi sukses yang ramah & ringkas
    tampilkanNotifikasi(`Data "${nama}" (Predikat: ${predikat}, Status: ${status}) berhasil ditambahkan!`, 'success');

    // Reset formulir & fokus kembali ke input nama
    if (form) form.reset();
    if (prodiInput) prodiInput.selectedIndex = 0;
    if (namaInput) namaInput.focus();
  }

  // Ikat event ke Formulir Submit
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      prosesTambahMahasiswa();
    });
  }

  // Ikat event langsung ke Tombol Submit
  if (btnSubmit) {
    btnSubmit.addEventListener('click', function(e) {
      e.preventDefault();
      prosesTambahMahasiswa();
    });
  }

  // Inisialisasi tampilan tabel pertama kali
  tampilkanMahasiswa();
}