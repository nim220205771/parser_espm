/** @type {boolean} Menentukan apakah log ditampilkan ke console. */
let viewLog = false;

/** @type {Array<Object>} Menyimpan data hasil proses parsing atau pengolahan utama. */
let globalData = [];

/** @type {Array<string>} Menyimpan gambar dalam format base64 untuk keperluan unduh. */
let processedImages = [];

/** @type {Object} Konfigurasi sistem yang diterima dari AHK. */
let config = {};

/** @type {DataTables.Api} Tabel utama untuk menampilkan hasil. */
let table;

/** @type {DataTables.Api} Tabel khusus untuk hasil PDF. */
let pdfTable;

/** @type {Array<Object>} Menyimpan semua data dari hasil parsing PDF atau JSON. */
let allData;
let sheetUrl = 'https://opensheet.elk.sh/SpreadsheetID/datadb'; // Ganti SpreadsheetID dengan Spreadsheet ID Anda sendiri misal '1aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890'
let app_version = '1.0.8';
let app_packet = 'parser_espm';

let lastParseErrors = []; // Array object error detail
let lastParseSuccessCount = 0;
let lastParseFailedCount = 0;

// prettier-ignore
const indikatorMap = [
  { substansi: 'Kondisi Jalan Tol', indikator: 'Perkerasan Jalur Utama', sub: 'Kekesatan', keywords: [ 'Kekesatan', 'Kekesatan (Perkerasan Jalur Utama)', 'Kekesatan [ Perkerasan Jalur Utama ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Perkerasan Jalur Utama', sub: 'Ketidakrataan', keywords: [ 'Ketidakrataan', 'Ketidakrataan (Perkerasan Jalur Utama)', 'Ketidakrataan [ Perkerasan Jalur Utama ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Perkerasan Jalur Utama', sub: 'Tidak Ada Lubang', keywords: [ 'Lubang', 'Lubang (Perkerasan Jalur Utama)', 'Lubang [ Perkerasan Jalur Utama ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Perkerasan Jalur Utama', sub: 'Rutting', keywords: [ 'Rutting', 'Rutting (Perkerasan Jalur Utama)', 'Rutting [ Perkerasan Jalur Utama ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Perkerasan Jalur Utama', sub: 'Retak', keywords: [ 'Retak', 'Retak (Perkerasan Jalur Utama)', 'Retak [ Perkerasan Jalur Utama ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Drainase', sub: 'Tidak Ada Endapan', keywords: [ 'Tidak Ada Endapan', 'Tidak Ada Endapan (Drainase)', 'Tidak Ada Endapan [ Drainase ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Drainase', sub: 'Penampang Saluran', keywords: [ 'Penampang Saluran', 'Penampang Saluran (Drainase)', 'Penampang Saluran [ Drainase ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Median', sub: 'Kerb', keywords: [ 'Kerb', 'Kerb (Median)', 'Kerb [ Median ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Median', sub: 'MCB (Median Concrete Barier)', keywords: [ 'MCB (Median Concrete Barier)', 'MCB (Median Concrete Barier) (Median)', 'MCB (Median Concrete Barier) [ Median ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Median', sub: 'Guard Rail', keywords: [ 'Guardrail', 'Guardrail (Median)', 'Guardrail [ Median ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Median', sub: 'Wire Rope', keywords: [ 'Wire Rope', 'Wire Rope (Median)', 'Wire Rope [ Median ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Bahu Jalan', sub: 'Tidak Ada Lubang', keywords: [ 'Lubang', 'Lubang (Bahu Jalan)', 'Lubang [ Bahu Jalan ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Bahu Jalan', sub: 'Rutting', keywords: [ 'Rutting', 'Rutting (Bahu Jalan)', 'Rutting [ Bahu Jalan ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Bahu Jalan', sub: 'Retak', keywords: [ 'Retak', 'Retak (Bahu Jalan)', 'Retak [ Bahu Jalan ]' ] },
  { substansi: 'Kondisi Jalan Tol', indikator: 'Rounding', sub: '', keywords: [ 'Rounding' ] },
  { substansi: 'Kecepatan', indikator: 'Kecepatan Tempuh Rata-rata Kondisi Normal', sub: '', keywords: [ 'Kecepatan Tempuh Rata-rata Kondisi Normal' ] },
  { substansi: 'Aksesibilitas', indikator: 'Kecepatan Transaksi Rata-rata', sub: '', keywords: [ 'Kecepatan Transaksi Rata-rata' ] },
  { substansi: 'Aksesibilitas', indikator: 'Jumlah Antrian Kendaraan (per-Gardu)', sub: '', keywords: [ 'Jumlah Antrian Kendaraan (per-Gardu)' ] },
  { substansi: 'Mobilitas', indikator: 'Kecepatan Penanganan Hambatan Lalu Lintas', sub: '', keywords: [ 'Kecepatan Penanganan Hambatan Lalu Lintas' ] },
  { substansi: 'Mobilitas', indikator: 'Kecepatan Penanganan Patroli Jalan Raya', sub: '', keywords: [ 'Kecepatan Penanganan Patroli Jalan Raya' ] },
  { substansi: 'Mobilitas', indikator: 'Kecepatan Penanganan Kendaraan Derek', sub: '', keywords: [ 'Kecepatan Penanganan Kendaraan Derek' ] },
  { substansi: 'Keselamatan', indikator: 'Petunjuk Jalan', sub: 'Perambuan', keywords: [ 'Perambuan', 'Perambuan (Petunjuk Jalan)', 'Perambuan [ Petunjuk Jalan ]' ] },
  { substansi: 'Keselamatan', indikator: 'Petunjuk Jalan', sub: 'Marka Jalan', keywords: [ 'Marka Jalan', 'Marka Jalan (Petunjuk Jalan)', 'Marka Jalan [ Petunjuk Jalan ]' ] },
  { substansi: 'Keselamatan', indikator: 'Petunjuk Jalan', sub: 'Guide Post/Reflektor Kiri dan Kanan', keywords: [ 'Guide Post', 'Guide Post (Petunjuk Jalan)', 'Guide Post [ Petunjuk Jalan ]' ] },
  { substansi: 'Keselamatan', indikator: 'Petunjuk Jalan', sub: 'Patok Kilometer', keywords: [ 'Patok Kilometer', 'Patok Kilometer (Petunjuk Jalan)', 'Patok Kilometer [ Petunjuk Jalan ]' ] },
  { substansi: 'Keselamatan', indikator: 'Petunjuk Jalan', sub: 'Patok Hektometer', keywords: [ 'Patok Hektometer', 'Patok Hektometer (Petunjuk Jalan)', 'Patok Hektometer [ Petunjuk Jalan ]' ] },
  { substansi: 'Keselamatan', indikator: 'Fasilitas Lainnya', sub: 'Penerangan Jalan Umum (PJU)', keywords: [ 'Penerangan Jalan Umum (PJU)', 'Penerangan Jalan Umum (PJU) (Fasilitas Lainnya)', 'Penerangan Jalan Umum (PJU) [ Fasilitas Lainnya ]' ] },
  { substansi: 'Keselamatan', indikator: 'Fasilitas Lainnya', sub: 'Anti Silau', keywords: [ 'Anti Silau', 'Anti Silau (Fasilitas Lainnya)', 'Anti Silau [ Fasilitas Lainnya ]' ] },
  { substansi: 'Keselamatan', indikator: 'Fasilitas Lainnya', sub: 'Pagar Rumija', keywords: [ 'Pagar Rumija', 'Pagar Rumija (Fasilitas Lainnya)', 'Pagar Rumija [ Fasilitas Lainnya ]' ] },
  { substansi: 'Keselamatan', indikator: 'Fasilitas Lainnya', sub: 'Pagar Pengaman', keywords: [ 'Pagar Pengaman', 'Pagar Pengaman (Fasilitas Lainnya)', 'Pagar Pengaman [ Fasilitas Lainnya ]' ] },
  { substansi: 'Keselamatan', indikator: 'Penanganan Kecelakaan', sub: '', keywords: [ 'Penanganan Kecelakaan' ] },
  { substansi: 'Keselamatan', indikator: 'Pengamanan dan Penegakan Hukum', sub: '', keywords: [ 'Pengamanan dan Penegakan Hukum' ] },
  { substansi: 'Unit Pertolongan / Penyelamatan dan Bantuan Pelayanan', indikator: 'Ambulans', sub: '', keywords: [ 'Ambulans' ] },
  { substansi: 'Unit Pertolongan / Penyelamatan dan Bantuan Pelayanan', indikator: 'Kendaraan Derek', sub: '', keywords: [ 'Kendaraan Derek' ] },
  { substansi: 'Unit Pertolongan / Penyelamatan dan Bantuan Pelayanan', indikator: 'Polisi Patroli Jalan Raya (PJR)', sub: '', keywords: [ 'Polisi Patroli Jalan Raya (PJR)' ] },
  { substansi: 'Unit Pertolongan / Penyelamatan dan Bantuan Pelayanan', indikator: 'Patroli Jalan Tol (Operator)', sub: '', keywords: [ 'Patroli Jalan Tol (Operator)' ] },
  { substansi: 'Unit Pertolongan / Penyelamatan dan Bantuan Pelayanan', indikator: 'Kendaraan Rescue', sub: '', keywords: [ 'Kendaraan Rescue' ] },
  { substansi: 'Unit Pertolongan / Penyelamatan dan Bantuan Pelayanan', indikator: 'Sistem Informasi', sub: '', keywords: [ 'Sistem Informasi' ] },
  { substansi: 'Lingkungan', indikator: 'Kebersihan ', sub: '', keywords: [ 'Kebersihan ', 'Kebersihan (Kantor Operasi dan Gardu Tol)', 'Kebersihan [ Kantor Operasi dan Gardu Tol ]' ] },
  { substansi: 'Lingkungan', indikator: 'Tanaman ', sub: '', keywords: [ 'Dalam Rumija Tol', 'Tanaman (Dalam Rumija Tol)', 'Tanaman [ Dalam Rumija Tol ]' ] },
  { substansi: 'Lingkungan', indikator: 'Rumput ', sub: '', keywords: [ 'Rumija & Luar Rumaja', 'Rumput (Rumija & Luar Rumaja)', 'Rumput [ Di Rumija Di Luar Rumaja ]' ] },
  { substansi: 'Tempat Istirahat (TI), dan Tempat Istirahat dan Pelayanan (TIP)', indikator: 'Kondisi Jalan', sub: '', keywords: [ 'Kondisi Jalan', 'TI/TIP (Kondisi Jalan)', 'TI/TIP [ Kondisi Jalan ]' ] },
  { substansi: 'Tempat Istirahat (TI), dan Tempat Istirahat dan Pelayanan (TIP)', indikator: 'On/Off Ramp', sub: '', keywords: [ 'On / Off Ramp', 'TI/TIP (On/Off Ramp)', 'TI/TIP [ On/Off Ramp ]' ] },
  { substansi: 'Tempat Istirahat (TI), dan Tempat Istirahat dan Pelayanan (TIP)', indikator: 'Toilet', sub: '', keywords: [ 'Toilet', 'TI/TIP (Toilet)', 'TI/TIP [ Toilet ]' ] },
  { substansi: 'Tempat Istirahat (TI), dan Tempat Istirahat dan Pelayanan (TIP)', indikator: 'Parkir Kendaraan', sub: '', keywords: [ 'Parkir Kendaraan', 'TI/TIP (Parkir Kendaraan)', 'TI/TIP [ Parkir Kendaraan ]' ] },
  { substansi: 'Tempat Istirahat (TI), dan Tempat Istirahat dan Pelayanan (TIP)', indikator: 'Penerangan', sub: '', keywords: [ 'Penerangan', 'TI/TIP (Penerangan)', 'TI/TIP [ Penerangan ]' ] },
  { substansi: 'Tempat Istirahat (TI), dan Tempat Istirahat dan Pelayanan (TIP)', indikator: 'Stasiun Pengisian Bahan Bakar', sub: '', keywords: [ 'Stasiun Pengisian Bahan Bakar', 'TI/TIP (Stasiun Pengisian Bahan Bakar)', 'TI/TIP [ Stasiun Pengisian Bahan Bakar ]' ] },
  { substansi: 'Tempat Istirahat (TI), dan Tempat Istirahat dan Pelayanan (TIP)', indikator: 'Bengkel Umum ', sub: '', keywords: [ 'Bengkel Umum', 'TI/TIP (Bengkel Umum)', 'TI/TIP [ Bengkel Umum ]' ] },
  { substansi: 'Tempat Istirahat (TI), dan Tempat Istirahat dan Pelayanan (TIP)', indikator: 'Tempat Makan dan Minum', sub: '', keywords: [ 'Tempat Makan dan Minuman', 'TI/TIP (Tempat Makan dan Minuman)', 'TI/TIP [ Tempat Makan dan Minuman ]' ] }
]

async function copyTableToClipboard(tableId) {
  const table = document.getElementById(tableId);

  if (!table || table.tagName !== 'TABLE') {
    alert('Tabel tidak ditemukan / id salah');
    return;
  }

  let text = '';

  Array.from(table.rows).forEach(row => {
    const cols = Array.from(row.cells).map(cell => cell.innerText.replace(/\n/g, ' ').trim());

    text += cols.join('\t') + '\n';
  });

  try {
    await navigator.clipboard.writeText(text);
    alert('Tabel berhasil di-copy! Paste di Excel 👍');
  } catch (err) {
    console.error(err);

    // fallback untuk browser lama
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    alert('Copy menggunakan metode lama.');
  }
}

async function copyTableHTML(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const blob = new Blob([table.outerHTML], { type: 'text/html' });
  const data = [new ClipboardItem({ 'text/html': blob })];

  try {
    await navigator.clipboard.write(data);
    alert('Tabel dengan format berhasil di-copy!');
  } catch (e) {
    alert('Clipboard tidak mendukung HTML.');
  }
}

function parseDBDate(text) {
  if (!text) return null;

  // contoh: 30 Oct 2025 09:13:36
  const d = new Date(text);
  if (isNaN(d)) return null;

  return d;
}
function getDateRange(startDate, endDate) {
  const start = new Date(startDate + ' 00:00:00');
  const end = new Date(endDate + ' 23:59:59');

  return { start, end };
}
function durasiKeMenit(text) {
  if (!text) return 0;

  let hari = 0,
    jam = 0,
    menit = 0;

  const h = text.match(/(\d+)\s*hari/i);
  const j = text.match(/(\d+)\s*jam/i);
  const m = text.match(/(\d+)\s*menit/i);

  if (h) hari = parseInt(h[1]);
  if (j) jam = parseInt(j[1]);
  if (m) menit = parseInt(m[1]);

  return hari * 1440 + jam * 60 + menit;
}
function menitKeDurasi(total) {
  if (!total) return '-';

  const hari = Math.floor(total / 1440);
  total %= 1440;

  const jam = Math.floor(total / 60);
  const menit = Math.round(total % 60);

  let s = [];
  if (hari) s.push(hari + ' hari');
  if (jam) s.push(jam + ' jam');
  if (menit) s.push(menit + ' menit');

  return s.join(' ');
}

async function hitungIndikator(startDate, endDate = startDate) {
  $('#hasil').empty();
  const data = await getAllFromIndexedDB();
  const { start, end } = getDateRange(startDate, endDate);

  const result = indikatorMap.map(x => ({
    ...x,
    count: 0,
    totalDurasi: 0
  }));

  for (const row of data) {
    // ===== Filter tanggal =====
    const d = parseDBDate(row.end);
    if (!d) continue;
    if (d < start || d > end) continue;

    // ===== Hitung indikator =====
    const text = (row.indikator || '').toLowerCase();

    for (const r of result) {
      if (r.keywords.some(k => text.includes(k.toLowerCase()))) {
        r.count++;
        r.totalDurasi += durasiKeMenit(row.dur);
        break;
      }
    }
  }

  // hitung rata-rata
  result.forEach(r => {
    r.avgDurasi = r.count ? menitKeDurasi(r.totalDurasi / r.count) : '-';
  });
  return result;
}

async function tampilkanTabel() {
  console.warn($('#startDate').val(), $('#endDate').val());
  const rows = await hitungIndikator($('#startDate').val(), $('#endDate').val());

  let html = `
    <table class="table table-bordered table-sm table-striped align-middle" id="hasilTable">
      <thead class="table-primary text-center">
        <tr>
          <th>Substansi</th>
          <th>Indikator</th>
          <th>Sub Indikator</th>
          <th style="width:90px">Count</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody>
    `;
  sumcount = 0;
  rows.forEach(r => {
    html += `
      <tr>
        <td>${r.substansi}</td>
        <td>${r.indikator}</td>
        <td>${r.sub}</td>
        <td>${r.count}</td>
        <td>Rata-rata waktu pemenuhan: ${r.avgDurasi}</td>
      </tr>
    `;
    sumcount += r.count;
  });

  html += `
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td>${sumcount}</td>
      </tr>
    `;
  html += '</table>';

  document.getElementById('hasil').innerHTML = html;
}

/**
 * Listener pesan dari AutoHotkey melalui WebView2.
 * Mengatur konfigurasi awal atau memperbarui tampilan kartu berdasarkan pesan.
 *
 * @function ahkWebMessage
 * @param {MessageEvent} Msg Pesan yang dikirim dari sisi AHK.
 * @property {string} Msg.data.type Jenis pesan, misal: 'config'.
 * @property {string} Msg.data.action Aksi yang diminta, misal: 'updateCard'.
 * @property {Object} Msg.data.data Data konfigurasi atau konten kartu.
 * @property {string} Msg.data.fileName Nama file gambar.
 * @property {string} Msg.data.base64 Gambar dalam format base64.
 */
function ahkWebMessage(Msg) {
  console.warn('send AHK -> JS');
  console.log('ahkWebMessage(Msg)', Msg);
  console.log(Msg.data);

  if (Msg.data.type == 'config') {
    viewLog && console.warn('Load Config', Msg.data.data);
    config = Msg.data.data;
    reloadConfig();
  } else if (Msg.data.action === 'updateCard') {
    const { index, total, no, fileName, base64 } = Msg.data;
    renderCardsWithDelay('done', index, total, no, fileName, base64);
  } else if (Msg.data.cmd === 'espm_html') {
    console.log('HTML received');
    console.log('Class xxx count:', Msg.data.count);
    // console.log(Msg.data.html);

    const html = Msg.data.html;
    if (!html) return Swal.fire('😟 Oops', 'Silakan paste HTML terlebih dahulu.', 'warning');

    Swal.fire({ title: '🕵️ Memproses...', didOpen: () => Swal.showLoading() });

    setTimeout(async () => {
      const data = await extractAllSatemuanData(html);
      await saveToIndexedDB(data); // Simpan/update DB]

      globalData = await getAllFromIndexedDB(); // Ambil dari IndexedDB

      // 🔁 Refresh DataTable
      table.clear().rows.add(globalData).draw();

      updateFilters(globalData);
      Swal.fire('Selesai', `Berhasil simpan dan tampilkan ${data.length} data.`, 'success');
      // $('#table-tab').click();
    }, 200);
  }
}

window.chrome.webview.addEventListener('message', ahkWebMessage);

let filenameOrder = [];
/**
 * Event handler yang dijalankan saat DOM siap.
 * Menginisialisasi permintaan konfigurasi dan tooltip bootstrap.
 */
document.addEventListener('DOMContentLoaded', function () {
  if (window.chrome?.webview) {
    ahk.SubmitJson(JSON.stringify({ action: 'request_config' }));
  }

  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
});

/** @type {boolean} Menyimpan status visibilitas label bantuan. */
let bantuanVisible = false;

/**
 * Event handler untuk tombol 'Lihat Bantuan'.
 * Menyembunyikan modal konfigurasi dan toggle visibilitas elemen bantuan.
 */
document.getElementById('lihatBantuanBtn').addEventListener('click', () => {
  $('#configModal').modal('hide');
  bantuanVisible = !bantuanVisible;
  document.querySelectorAll('.bantuan-label').forEach(el => el.classList.toggle('hide', !bantuanVisible));
});

/**
 * Memuat konfigurasi dari objek `config` ke elemen form HTML.
 * Nilai default digunakan jika properti tidak tersedia.
 *
 * @function reloadConfig
 */
function reloadConfig() {
  viewLog && console.warn('reloadConfig', config);

  $('#pathDownload').val(config.pathDownload || '.\\img_download');
  $('#pathExport').val(config.pathExport || '.\\img_export');
  $('#filenameFormat')
    .val(config.filenameFormat || '')
    .change();
  filenameOrder = config.filenameFormat;
  $('#pathMode')
    .val(config.pathMode || '')
    .change();
  $('#Debug')
    .val(config.Debug || 0)
    .change();
  $('#font')
    .val(config.font || '')
    .change();
  $('#fontSize').val(config.fontSize || '');
  $('#heightRectangle').val(config.heightRectangle || '');
  $('#maxDim').val(config.maxDim || '');
  $('#paddingText').val(config.paddingText || '');
  $('#sleep').val(config.sleep || '');

  // Ubah warna latar belakang ke format #RRGGBB
  $('#color').val(('#' + (config.color || 'FFFFFF').replace('#', '')).toUpperCase());

  // Konversi heksadesimal ke desimal (transparansi 0–255)
  $('#transcolor').val(parseInt(config.transcolor || 'FF', 16));

  // Warna teks dan transparansi teks
  $('#colorText').val(('#' + (config.colorText || '000000').replace('#', '')).toUpperCase());
  $('#transcolorText').val(parseInt(config.transcolorText || 'FF', 16));
}

/** @constant {bootstrap.Modal} howToModal - Modal bantuan (how-to). */
const howToModal = new bootstrap.Modal('#howToModal');

/** @constant {bootstrap.Modal} detailModal - Modal detail untuk menampilkan informasi tambahan. */
const detailModal = new bootstrap.Modal('#detailModal');

/** @constant {string} dbName - Nama database IndexedDB yang digunakan. */
const dbName = 'SatemuanDB';

/** @constant {string} storeName - Nama object store utama dalam IndexedDB. */
const storeName = 'temuanStore';

/**
 * Membuka koneksi ke IndexedDB dan membuat object store jika belum ada.
 *
 * @function openDB
 * @returns {Promise<IDBDatabase>} Promise yang menghasilkan instance database.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 2);
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('configStore')) {
        db.createObjectStore('configStore', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Menyimpan array data ke dalam IndexedDB menggunakan `id` sebagai keyPath.
 *
 * @function saveToIndexedDB
 * @param {Array<Object>} dataArray - Array data yang akan disimpan ke IndexedDB.
 * @returns {Promise<void>} Promise yang selesai ketika transaksi berhasil.
 */
async function saveToIndexedDB(dataArray) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const item of dataArray) {
    store.put(item); // update or insert by keyPath 'id'
  }
  return (
    tx.complete ||
    new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    })
  );
}

/**
 * Mengambil seluruh data dari object store di IndexedDB.
 *
 * @function getAllFromIndexedDB
 * @returns {Promise<Array<Object>>} Promise yang menghasilkan array dari semua entri di object store.
 */
async function getAllFromIndexedDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function exportIndexedDBToExcel() {
  try {
    const data = await getAllFromIndexedDB();

    if (!data.length) {
      alert('Database kosong');
      return;
    }

    // Convert JSON → Worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Buat workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Database');

    // Simpan file
    XLSX.writeFile(workbook, 'database_export.xlsx');
  } catch (err) {
    console.error('Gagal export:', err);
    alert('Export gagal');
  }
}

/**
 * Mengubah format tanggal dari `dd MMM yyyy` (misal: "21 Jul 2025") ke format `yyyy-mm-dd`.
 *
 * @function formatTanggalToYMD
 * @param {string} input - Tanggal dalam format `dd MMM yyyy`.
 * @returns {string|null} Tanggal dalam format `yyyy-mm-dd`, atau `null` jika tidak cocok.
 */
function formatTanggalToYMD(input) {
  const bulanMap = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

  const regex = /^(\d{2})\s+([A-Za-z]{3})\s+(\d{4})/;
  const match = input.match(regex);
  if (!match) return null;

  const [, day, monthStr, year] = match;
  const month = bulanMap[monthStr];

  return `${year}-${month}-${day}`;
}

/**
 * @event ClickEditButton
 * @description Event handler untuk tombol edit dalam tabel hasil.
 * Menampilkan SweetAlert2 dengan form dinamis untuk mengedit data berdasarkan ID.
 *
 * - Membuat form berdasarkan field kecuali `id`.
 * - Setelah disimpan, memperbarui data pada `globalData` dan IndexedDB.
 * - Mengupdate tampilan DataTable dengan data yang telah diperbarui.
 *
 * @listens click
 * @fires Swal.fire
 */
$('#resultTable tbody').on('click', '.editBtn', async function () {
  const id = $(this).data('id');
  const rowData = globalData.find(d => d.id === id);
  if (!rowData) return;

  // 1. Buat form input HTML dari setiap field (kecuali ID)
  const buildFormHtml = data => {
    return Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(
        ([key, value]) => `
        <div class="mb-2 row">
          <label for="swal-input-${key}" class="col-4 col-form-label"><code>${key}</code></label>
          <div class="col-8">
            <input type="text" class="form-control form-control-sm" id="swal-input-${key}" value="${value ?? ''}">
          </div>
        </div>
      `
      )
      .join('');
  };

  const formHtml = `<div style="text-align:left">${buildFormHtml(rowData)}</div>`;

  // 2. Tampilkan swal untuk edit data
  const result = await Swal.fire({
    title: `📝 Edit Data ID ${id}`,
    html: formHtml,
    focusConfirm: false,
    confirmButtonText: 'Simpan',
    showCancelButton: true,
    preConfirm: () => {
      const edited = { id };
      for (const key in rowData) {
        if (key === 'id') continue;
        const input = document.getElementById(`swal-input-${key}`);
        if (input) edited[key] = input.value.trim();
      }
      return edited;
    }
  });

  // 3. Jika user menekan "Simpan"
  if (result.isConfirmed && result.value) {
    const editedData = result.value;
    const index = globalData.findIndex(d => d.id === id);
    if (index >= 0) {
      globalData[index] = { ...globalData[index], ...editedData };

      // Optional: update ke IndexedDB
      if (window.indexedDB) {
        const dbRequest = indexedDB.open(dbName, 1);
        dbRequest.onsuccess = function (e) {
          const db = e.target.result;
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          store.put(globalData[index]); // Simpan perubahan
        };
      }

      // Update DataTable
      $('#resultTable').DataTable().clear().rows.add(globalData).draw();

      // Notifikasi
      Swal.fire('Berhasil', `Data ID ${id} berhasil diperbarui.`, 'success');
    }
  }
});

/**
 * @event ClickDeleteButton
 * @description Event handler untuk tombol hapus dalam tabel hasil.
 * Menampilkan konfirmasi SweetAlert2 sebelum menghapus data:
 *
 * - Menghapus dari IndexedDB.
 * - Menghapus dari array `globalData`.
 * - Memperbarui ulang isi DataTable.
 *
 * @listens click
 * @fires Swal.fire
 */
$('#resultTable tbody').on('click', '.deleteBtn', async function () {
  const id = $(this).data('id');

  const konfirmasi = await Swal.fire({
    title: 'Yakin hapus data ini?',
    text: `ID: ${id}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal'
  });

  if (konfirmasi.isConfirmed) {
    viewLog && console.warn('Hapus id:', id);

    // Hapus dari IndexedDB & globalData
    await deleteFromIndexedDB(id);
    globalData = globalData.filter(d => d.id != id);

    // Update isi tabel menggunakan object, bukan array
    table
      .clear()
      .rows.add(
        globalData.map(item => ({
          id: item.id,
          timestamp: item.timestamp || '-',
          des: item.des || '-',
          desper: item.desper || '-',
          indikator: item.indikator || '-',
          jalur: item.jalur || '-',
          lajur: item.lajur || '-',
          latitude: item.latitude || '-',
          longitude: item.longitude || '-'
        }))
      )
      .draw();

    Swal.fire('Dihapus!', `Data ID ${id} telah dihapus.`, 'success');
  }
});

/**
 * Menghapus data dari IndexedDB berdasarkan ID.
 *
 * @async
 * @function deleteFromIndexedDB
 * @param {number|string} id - ID data yang ingin dihapus.
 * @returns {Promise<void>} Promise yang resolve jika penghapusan berhasil.
 */
async function deleteFromIndexedDB(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SatemuanDB', 1);
    request.onsuccess = function (event) {
      const db = event.target.result;
      const tx = db.transaction('temuanStore', 'readwrite');
      const store = tx.objectStore('temuanStore');
      const deleteRequest = store.delete(id);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = e => reject(e);
    };
    request.onerror = e => reject(e);
  });
}

/**
 * Mengekstrak semua data dari HTML string yang mewakili tampilan carousel laporan Satemuan.
 *
 * @async
 * @function extractAllSatemuanData
 * @param {string} htmlString - HTML dalam bentuk string untuk di-parse dan diekstrak.
 * @returns {Promise<Object[]>} Array objek data Satemuan yang berhasil diparsing.
 *
 * @example
 * const html = await fetch('/some-page.html').then(res => res.text());
 * const data = await extractAllSatemuanData(html);
 */
async function extractAllSatemuanData(htmlString) {
  const container = $('<div>').html(htmlString); // render string HTML ke dalam DOM
  const results = [];

  const items = container
    .find('.carousel-item a[onclick^="imgpopupFinished"]')
    .toArray()
    .filter(el => {
      const $el = $(el);
      const match = $el.attr('onclick').match(/imgpopupFinished\('(\d+)'\)/);
      if (!match) return false;

      const id = match[1];

      // Hanya lanjutkan jika alt-nya adalah "Repair 100%"
      const alt = $el.find('img').attr('alt');
      if (alt !== 'Repair 100%') return false;

      // Validasi minimal elemen penting
      const requiredSelectors = [`#des${id}`, `#desper${id}`, `#end${id}`, `#latitude${id}`, `#longitude${id}`, `#dur${id}`, `#carousel${id}`, `span.badge:contains("ID ${id}")`];

      return requiredSelectors.every(sel => container.find(sel).length > 0);
    });

  const total = items.length;

  Swal.fire({
    title: '♻️ Memuat data...',
    html: `Memproses <b>0/${total}</b> (0%)`,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  for (let i = 0; i < total; i++) {
    const el = items[i];
    const match = $(el)
      .attr('onclick')
      .match(/imgpopupFinished\('(\d+)'\)/);
    if (!match) continue;

    const id = parseInt(match[1]);
    if (results.some(r => r.id === id)) continue;

    const data = {
      id,
      temuan: null,
      repair0: null,
      repair50: null,
      repair100: null,
      des: container.find(`#des${id}`).val(),
      desper: container.find(`#desper${id}`).val(),
      end: container.find(`#end${id}`).val(),
      latitude: container.find(`#latitude${id}`).val(),
      longitude: container.find(`#longitude${id}`).val(),
      dur: container.find(`#dur${id}`).val(),
      repair_latitude_0: container.find(`#repair_latitude_0${id}`).val(),
      repair_longitude_0: container.find(`#repair_longitude_0${id}`).val(),
      repair_latitude_50: container.find(`#repair_latitude_50${id}`).val(),
      repair_longitude_50: container.find(`#repair_longitude_50${id}`).val(),
      repair_latitude_100: container.find(`#repair_latitude_100${id}`).val(),
      repair_longitude_100: container.find(`#repair_longitude_100${id}`).val(),
      timestamp: null,
      ruas: null,
      indikator: null,
      jalur: null,
      lajur: null,
      lokasi: null,
      selesai: null
    };

    container.find(`#carousel${id} .carousel-item`).each(function () {
      const label = $(this).find('span').text().trim();
      const href = $(this).find("a[target='_blank']").attr('href');
      if (label === 'Temuan') data.temuan = href;
      else if (label === 'Repair 0%') data.repair0 = href;
      else if (label === 'Repair 50%') data.repair50 = href;
      else if (label === 'Repair 100%') data.repair100 = href;
    });

    const $card = container.find(`span.badge:contains('ID ${id}')`).closest('.card-body');
    if ($card.length) {
      data.timestamp = $card.find('span.m-0').first().text().trim();
      data.tanggal = formatTanggalToYMD(data.timestamp);
      data.ruas = $card.find('h4').first().text().trim();
      data.indikator = $card.find('h6.badge').first().text().trim();
      const badges = $card.find('.mt-2 span.badge');
      data.jalur = badges.eq(0).text().trim();
      data.lajur = badges.eq(1).text().trim();
      data.lokasi = badges.eq(2).text().trim();
      data.selesai = $card.find("b:contains('Selesai')").parent().text().replace('Selesai', '').trim();
    }

    results.push(data);

    // ✅ Update progress setiap kali
    const percent = Math.floor(((i + 1) / total) * 100);
    Swal.getHtmlContainer().innerHTML = `Memproses <b>${i + 1}/${total}</b> (${percent}%)`;

    // ✅ Setiap 5 langkah, beri jeda untuk UI refresh
    // if (i % 5 === 0) {
    //   await new Promise(resolve => setTimeout(resolve, 0));
    // }

    await new Promise(resolve => setTimeout(resolve, 0));
  }

  Swal.close(); // Tutup swal setelah selesai
  return results;
}

/**
 * Mengembalikan rentang tanggal dalam format "dd/MM/yyyy s.d. dd/MM/yyyy".
 *
 * @function formatTanggalRange
 * @param {Object[]} globalData - Array objek data yang memiliki properti `tanggal`.
 * @returns {string} Rentang tanggal dalam format lokal Indonesia atau string kosong jika data tidak valid.
 */
function formatTanggalRange(globalData) {
  if (!globalData || globalData.length === 0) return '';

  // Ambil semua tanggal dan konversi ke Date object
  const tanggalList = globalData.map(item => new Date(item.tanggal));

  // Sort untuk cari min dan max
  tanggalList.sort((a, b) => a - b);

  const tanggalAwal = tanggalList[0];
  const tanggalAkhir = tanggalList[tanggalList.length - 1];

  // Fungsi bantu untuk ubah format ke dd/MM/yyyy
  function toDDMMYYYY(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  return `${toDDMMYYYY(tanggalAwal)} s.d. ${toDDMMYYYY(tanggalAkhir)}`;
}

/**
 * Inisialisasi tabel DataTable dari data yang disimpan di IndexedDB.
 *
 * @async
 * @function initDta
 * @description
 * - Mengambil semua data dari IndexedDB.
 * - Menyimpan ke `globalData`.
 * - Menyiapkan DataTable utama (`#resultTable`) dan tabel PDF (`#pdfTable`).
 * - Menampilkan info tanggal di elemen `#infoDatabase`.
 */
async function initDta() {
  const dataIndexdb = await getAllFromIndexedDB(); // Ambil dari IndexedDB
  globalData = dataIndexdb;
  $('#infoDatabase').html(`Tanggal ${formatTanggalRange(globalData)} [${globalData.length} data]`);

  if ($.fn.DataTable.isDataTable('#resultTable')) {
    $('#resultTable').DataTable().clear().destroy();
  }

  if ($.fn.DataTable.isDataTable('#pdfTable')) {
    $('#pdfTable').DataTable().clear().destroy();
  }

  table = $('#resultTable').DataTable({
    responsive: true,
    data: dataIndexdb,
    columns: [
      {
        title: '<input type="checkbox" id="selectAll">',
        data: null,
        orderable: false,
        render: function (data) {
          return `<input type="checkbox" class="row-check" data-id="${data.id}">`;
        }
      },
      { title: 'ID', data: 'id' },
      { title: 'Timestamp', data: 'timestamp' },
      { title: 'Des', data: 'des' },
      { title: 'Desper', data: 'desper' },
      { title: 'Indikator', data: 'indikator' },
      { title: 'Jalur', data: 'jalur' },
      { title: 'Lajur', data: 'lajur' },
      {
        title: 'Geolocations',
        data: null,
        render: function (data) {
          return `<a href="https://www.google.com/maps?q=${data.latitude},${data.longitude}" target="_blank">${data.latitude},${data.longitude}</a>`;
        }
      },
      {
        title: 'Aksi',
        data: null,
        render: function (data) {
          return `
              <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-sm btn-info detailBtn" data-id="${data.id}" data-bs-toggle="tooltip" data-bs-title="View Data"><i class="fas fa-eye"></i></button>
                <button class="btn btn-warning editBtn" data-id="${data.id}" data-bs-toggle="tooltip" data-bs-title="Edit Data"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger deleteBtn" data-id="${data.id}" data-bs-toggle="tooltip" data-bs-title="Delete Data"><i class="fas fa-trash"></i></button>
              </div>`;
        }
      }
    ]
  });

  pdfTable = $('#pdfTable').DataTable({
    responsive: true,
    data: [], // awal kosong, nanti diisi oleh renderPdfTable(data)
    columns: [
      {
        title: '<i class="fa-solid fa-images"></i>',
        data: 'repair100',
        render: data => (data && data.trim() !== '' ? `<i class="fa-solid fa-square-check text-success fs-3"></i>` : `<i class="fa-solid fa-square-xmark text-danger fs-3"></i>`)
      },
      { title: 'No', data: 'no' },
      { title: 'Tanggal', data: 'tanggal' },
      { title: 'Indikator', data: 'indikator' },
      { title: 'Deskripsi', data: 'deskripsi' },
      { title: 'STA', data: 'sta' },
      { title: 'Jalur', data: 'jalur' },
      { title: 'Lajur', data: 'lajur' },
      { title: 'Metode', data: 'metode' }
    ]
  });
  updateFilters(globalData);
}
/**
 * Inisialisasi aplikasi setelah DOM siap.
 * Meliputi: delete DB, backup, restore, dan proses HTML.
 */
$(async function () {
  await initDta();
  await generateDatabaseSummary(globalData);

  /**
   * Menghapus seluruh database IndexedDB setelah konfirmasi user.
   * Menampilkan loading dan notifikasi hasil.
   */
  $('#btnDeleteDB').on('click', async function () {
    const confirm = await Swal.fire({
      title: '⁉️ Yakin hapus semua data?',
      text: 'Ini akan menghapus seluruh database IndexedDB.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '⚠️ Ya, hapus!'
    });

    if (confirm.isConfirmed) {
      Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => Swal.fire('✅ Berhasil', 'Database berhasil dihapus!', 'success');
      req.onerror = () => Swal.fire('❌ Gagal', 'Gagal menghapus database!', 'error');
      await initDta();
    }
  });

  /**
   * Membackup seluruh isi IndexedDB ke file JSON.
   * Data dikumpulkan dan disimpan sebagai berkas untuk diunduh.
   */
  $('#btnBackupDB').on('click', async function () {
    Swal.fire({ title: '📦 Membackup...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const dbRequest = indexedDB.open(dbName);
    dbRequest.onsuccess = function (e) {
      const db = e.target.result;
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const allData = [];

      store.openCursor().onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
          allData.push(cursor.value);
          cursor.continue();
        } else {
          const json = JSON.stringify(allData, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = $('<a>')
            .attr('href', url)
            .attr('download', `${dbName}_backup_${new Date().toISOString().slice(0, 10)}.json`)
            .get(0);
          a.click();
          Swal.fire('✅ Berhasil', 'Backup berhasil disimpan.', 'success');
        }
      };
    };

    dbRequest.onerror = () => Swal.fire('❌ Error', 'Gagal membuka database untuk backup', 'error');
  });

  /**
   * Me-restore database dari file JSON eksternal.
   * File divalidasi, lalu seluruh isi database ditimpa dengan data baru.
   */
  $('#fileRestoreDB').on('change', function () {
    const file = this.files[0];
    if (!file) return;

    Swal.fire({ title: '📦 Memproses file restore...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const reader = new FileReader();
    reader.onload = function (event) {
      let jsonData;

      try {
        jsonData = JSON.parse(event.target.result);
      } catch (e) {
        Swal.fire('❌ Gagal', 'File bukan JSON valid.', 'error');
        $('#fileRestoreDB').val('');
        return;
      }

      // Validasi format array
      if (!Array.isArray(jsonData)) {
        Swal.fire('❌ Format Salah', 'File harus berupa array JSON.', 'error');
        $('#fileRestoreDB').val('');
        return;
      }

      // Validasi properti wajib
      const requiredKeys = ['id', 'timestamp', 'des', 'desper'];
      const isValid = jsonData.every(item => requiredKeys.every(k => Object.prototype.hasOwnProperty.call(item, k)));

      if (!isValid) {
        Swal.fire('❌ Struktur Data Tidak Sesuai', `Setiap item harus memiliki properti: ${requiredKeys.join(', ')}`, 'error');
        $('#fileRestoreDB').val('');
        return;
      }

      // Proses simpan ke IndexedDB
      const dbRequest = indexedDB.open(dbName);
      dbRequest.onsuccess = function (e) {
        const db = e.target.result;
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        store.clear().onsuccess = () => {
          jsonData.forEach(item => store.put(item));
        };

        tx.oncomplete = () => {
          Swal.fire('✅ Berhasil', `${jsonData.length} data berhasil direstore.`, 'success');
          $('#fileRestoreDB').val('');
          initDta();
        };

        tx.onerror = () => {
          Swal.fire('❌ Gagal', 'Terjadi kesalahan saat menyimpan ke IndexedDB.', 'error');
          $('#fileRestoreDB').val('');
        };
      };

      dbRequest.onerror = () => {
        Swal.fire('❌ Error', 'Tidak dapat membuka database.', 'error');
        $('#fileRestoreDB').val('');
      };
    };

    reader.readAsText(file);
  });
});

/**
 * Inisialisasi form select2 dan interaksi UI lainnya.
 * Meng-handle input HTML, drag & drop, dan filter.
 */

$(function () {
  const validKeys = [
    'id',
    'temuan',
    'repair0',
    'repair50',
    'repair100',
    'des',
    'desper',
    'end',
    'latitude',
    'longitude',
    'dur',
    'repair_latitude_0',
    'repair_longitude_0',
    'repair_latitude_50',
    'repair_longitude_50',
    'repair_latitude_100',
    'repair_longitude_100',
    'timestamp',
    'ruas',
    'indikator',
    'jalur',
    'lajur',
    'lokasi',
    'selesai'
  ];

  const validTags = ['no', 'sta', 'jalur', 'lajur', 'indikator', 'metode', 'deskripsi', 'durasi'];

  $('#sourceInput').addClass('placeholder');
  $('#dropZone').addClass('placeholder');

  /**
   * Inisialisasi Select2 untuk format nama file (opsional).
   */
  $('#filenameFormat').select2({
    theme: 'bootstrap-5',
    tags: true,
    tokenSeparators: [',', ' '],
    data: validTags,
    placeholder: 'Pilih atau ketik field untuk nama file',
    width: '100%'
  });

  $('#filenameFormat').on('select2:select', function (e) {
    const val = e.params.data.id;
    if (!filenameOrder.includes(val)) {
      filenameOrder.push(val);
    }
  });
  $('#filenameFormat').on('select2:unselect', function (e) {
    const val = e.params.data.id;
    filenameOrder = filenameOrder.filter(v => v !== val);
  });

  /**
   * Memproses HTML dari textarea (atau drop zone) untuk diambil datanya.
   * Data disimpan ke IndexedDB, diambil kembali, lalu ditampilkan ke DataTable.
   */
  $('#processBtn').click(() => {
    const html = $('#sourceInput').val().trim();
    if (!html) return Swal.fire('😟 Oops', 'Silakan paste HTML terlebih dahulu.', 'warning');

    Swal.fire({ title: '🕵️ Memproses...', didOpen: () => Swal.showLoading() });

    setTimeout(async () => {
      const data = await extractAllSatemuanData(html);
      await saveToIndexedDB(data); // Simpan/update DB]

      globalData = await getAllFromIndexedDB(); // Ambil dari IndexedDB

      // 🔁 Refresh DataTable
      table.clear().rows.add(globalData).draw();

      updateFilters(globalData);
      Swal.fire('Selesai', `Berhasil simpan dan tampilkan ${data.length} data.`, 'success');
      // $('#table-tab').click();
    }, 200);
  });

  /**
   * Filter tahun dan bulan untuk pencarian berdasarkan tanggal.
   */
  $('#filterYear, #filterMonth').on('change', function () {
    const year = $('#filterYear').val();
    const month = $('#filterMonth').val();
    const keyword = month && year ? `${month} ${year}` : '';
    table.column(2).search(keyword).draw();
    year == '' ? $('#filterMonth').hide() : $('#filterMonth').show();
  });

  document.getElementById('dropZone').addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (window.chrome && window.chrome.webview) {
      console.warn('send JS -> AHK');
      ahk.message(JSON.stringify({ cmd: 'open_espm' }));
    }
  });

  /**
   * Centang semua baris pada tabel jika checkbox global dicentang.
   */
  $('#selectAll').on('change', function () {
    const isChecked = $(this).is(':checked');
    table.rows().nodes().to$().find('.row-check').prop('checked', isChecked);
  });

  /**
   * Memproses gambar dari data yang dipilih di DataTable.
   * Memperbarui progress bar dan memanggil `handleRemoteImage` (jika aktif).
   */
  $('#prosesGambarBtn').on('click', function () {
    const selectedIds = [];
    table
      .rows({ search: 'applied' })
      .nodes()
      .to$()
      .each(function () {
        const checkbox = $(this).find('.row-check');
        if (checkbox.is(':checked')) {
          selectedIds.push(String(checkbox.data('id')));
        }
      });

    if (selectedIds.length === 0) {
      return Swal.fire('😟 Oops', 'Pilih minimal satu data terlebih dahulu.', 'warning');
    }

    const selectedData = globalData.filter(item => selectedIds.includes(item.id));
    const allImages = [];

    selectedData.forEach(item => {
      ['temuan', 'repair0', 'repair50', 'repair100'].forEach(k => {
        if (item[k]) {
          allImages.push({ id: item.id, url: item[k] });
        }
      });
    });

    let processed = 0;
    let perItemTotal = 4;

    const updateProgress = () => {
      const currentImage = allImages[processed] || {};
      const currentId = currentImage.id || 'Selesai';
      const imagesForCurrentId = allImages.filter(img => img.id === currentId);
      const imagesDoneForCurrentId = allImages.slice(0, processed).filter(img => img.id === currentId).length;

      const perItemPercent = Math.round((imagesDoneForCurrentId / imagesForCurrentId.length) * 100);
      const uniqueIdsProcessed = new Set(allImages.slice(0, processed).map(img => img.id));
      const percentTotal = Math.round((uniqueIdsProcessed.size / selectedIds.length) * 100);

      $('#progressInfo').html(`Memproses [${uniqueIdsProcessed.size}/${selectedIds.length}] ID <b>${currentId}</b>`);
      $('#progressBarTotal')
        .css('width', percentTotal + '%')
        .text(percentTotal + '%');
      $('#progressBarPerItem')
        .css('width', perItemPercent + '%')
        .text(perItemPercent + '%');
    };

    Swal.fire({
      title: 'Memproses Gambar...',
      html: 'Silakan tunggu hingga selesai...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    let i = 0;
    const processNext = () => {
      if (processed >= allImages.length) {
        saveManifestFromGlobalData();
        Swal.close();
        $('#progressInfo').html(`Selesai memproses ${allImages.length} gambar dari ${selectedIds.length} data.`);
        $('#progressBarTotal').css('width', '100%').text('100%');
        $('#progressBarPerItem').css('width', '100%').text('100%');
        return;
      }
      const current = allImages[i];
      const { id, url, label } = current;

      // 🔥 Panggil handleRemoteImage di sini
      // handleRemoteImage(url, `img_${label}_${id}`, globalData.find(d => d.id === id));

      processed++;
      updateProgress();
      i++;
      setTimeout(processNext, 100); // Delay antar gambar (simulasi proses)

      // Simulasi delay proses
      // setTimeout(() => {
      //     processed++;
      //     updateProgress();
      //     processNext();
      // }, 300); // ← simulasi delay per gambar
    };

    updateProgress();
    processNext();
  });

  $('#sourceInput').removeClass('placeholder');
  $('#dropZone').removeClass('placeholder');
  checkLatestVersion();

  $('#startDate').val(localStorage.getItem('parse_espm.startDate'));
  $('#endDate').val(localStorage.getItem('parse_espm.endDate'));
  $('#startDate').on('change', function () {
    localStorage.setItem('parse_espm.startDate', $('#startDate').val());
  });
  $('#endDate').on('change', function () {
    localStorage.setItem('parse_espm.endDate', $('#endDate').val());
  });
});

/**
 * Memuat seluruh data dari IndexedDB dan memperbarui tabel serta filter.
 * Menampilkan informasi jumlah data dan rentang tanggal.
 * @async
 * @function
 * @returns {Promise<void>}
 */
async function reloadTableFromIndexedDB() {
  const data = await getAllFromIndexedDB();
  table.clear().rows.add(data).draw();
  updateFilters(data);
  $('#infoDatabase').html(`Tanggal ${formatTanggalRange(data)} [${data.length} data]`);
}

/**
 * Memperbarui isi DataTable '#resultTable' dengan data yang diberikan.
 * Hanya jika DataTable telah diinisialisasi.
 * @function
 * @param {Array<Object>} data - Array data hasil parsing atau dari database.
 */
function updateResultTable(data) {
  if (!$.fn.DataTable.isDataTable('#resultTable')) return;

  table.clear();

  table.rows.add(
    data.map(item => ({
      id: item.id,
      timestamp: item.timestamp || '-',
      des: item.des || '-',
      desper: item.desper || '-',
      indikator: item.indikator || '-',
      jalur: item.jalur || '-',
      lajur: item.lajur || '-',
      latitude: item.latitude || '-',
      longitude: item.longitude || '-'
      // kolom render seperti checkbox dan tombol akan tetap bekerja dari 'render' di definisi columns
    }))
  );

  table.draw();
  updateFilters(data);
}

/**
 * Mengambil tahun dan bulan unik dari field `end` di dataset,
 * lalu mengisi dropdown filter tahun dan bulan.
 * @function
 * @param {Array<Object>} data - Data yang telah dimuat atau difilter.
 */
function updateFilters(data) {
  const years = [...new Set(data.map(d => d.end?.split(' ')[2]))].filter(Boolean);
  const months = [...new Set(data.map(d => d.end?.split(' ')[1]))].filter(Boolean);
  $('#filterYear').html('<option value="">Tahun</option>' + years.map(y => `<option>${y}</option>`).join(''));
  $('#filterMonth').html('<option value="">Bulan</option>' + months.map(m => `<option>${m}</option>`).join(''));
  viewLog && console.warn('updateFilters', { years: years, months: months });
}

/**
 * Mengirim semua URL gambar dari `globalData` ke aplikasi AHK
 * melalui WebView2 untuk disimpan sebagai file manifest.
 * @function
 */
function saveManifestFromGlobalData() {
  if (!Array.isArray(globalData) || globalData.length === 0) {
    return Swal.fire('Tidak Ada Data', 'Data belum tersedia atau kosong.', 'warning');
  }

  const urls = globalData.flatMap(item => ['temuan', 'repair0', 'repair50', 'repair100'].map(k => item[k]).filter(Boolean));

  const uniqueUrls = [...new Set(urls)];

  // Kirim data ke AHK lewat WebView2 (harus enable WebMessageReceived)
  window.chrome.webview.postMessage({
    action: 'save_manifest',
    data: uniqueUrls
  });

  Swal.fire('Proccess is Done!', `Semua hasil export berada pada folder ${config.pathExport}`, 'success');
}

/**
 * @typedef {Object} SatemuanItem
 * @property {string} id - ID unik untuk tiap entri.
 * @property {string} [timestamp] - Timestamp entri (opsional).
 * @property {string} [des] - Deskripsi temuan.
 * @property {string} [desper] - Deskripsi perbaikan.
 * @property {string} [indikator] - Nama indikator yang relevan.
 * @property {string} [jalur] - Nama jalur (misal: A, B).
 * @property {string} [lajur] - Nama lajur (misal: 1, 2, 3).
 * @property {string} [latitude] - Lokasi GPS (lintang).
 * @property {string} [longitude] - Lokasi GPS (bujur).
 * @property {string} [end] - Tanggal akhir penanganan (untuk filter).
 * @property {string} [temuan] - URL gambar awal temuan.
 * @property {string} [repair0] - URL gambar perbaikan tahap 0%.
 * @property {string} [repair50] - URL gambar perbaikan tahap 50%.
 * @property {string} [repair100] - URL gambar perbaikan tahap 100%.
 */
$(document).on('click', '.detailBtn', function () {
  const id = $(this).data('id');
  const item = globalData.find(d => d.id === id);
  if (!item) return;

  console.warn(id, item);

  const detailHtml = `
        <div class="mb-2"><strong>ID <code>[id]</code>:</strong> ${item.id}</div>
        <div class="mb-2"><strong>Timestamp <code>[timestamp]</code>:</strong> ${item.timestamp}</div>
        <div class="mb-2"><strong>Deskripsi Temuan <code>[des]</code>:</strong> ${item.des}</div>
        <div class="mb-2"><strong>Deskripsi Perbaikan <code>[desper]</code>:</strong> ${item.desper}</div>
        <div class="mb-2"><strong>Indikator <code>[indikator]</code>:</strong> ${item.indikator}</div>
        <div class="mb-2"><strong>Jalur <code>[jalur]</code>:</strong> ${item.jalur}</div>
        <div class="mb-2"><strong>Lajur <code>[lajur]</code>:</strong> ${item.lajur}</div>
        <div class="mb-2"><strong>Lokasi (STA) <code>[lokasi]</code>:</strong> ${item.lokasi}</div>
        <div class="mb-2"><strong>Geolokasi <code>[repair_latitude_100, repair_longitude_100]</code>:</strong> 
          <a href="https://www.google.com/maps?q=${item.latitude},${item.longitude}" target="_blank">
          ${item.latitude}, ${item.longitude}
          </a>
        </div>
        <div class="mb-2"><strong>Selesai <code>[end]</code>:</strong> ${item.selesai}</div>

        <div class="mb-3"><strong>Gambar:</strong>
          <div class="row mt-2">
          ${item.temuan ? `<div class="col-6"><img class="img-fluid rounded mb-2" src="${item.temuan}" alt="Temuan"><div class="text-center small">Temuan <code>[temuan]</code></div></div>` : ''}
          ${item.repair0 ? `<div class="col-6"><img class="img-fluid rounded mb-2" src="${item.repair0}" alt="Repair 0%"><div class="text-center small">Repair 0% <code>[repair0]</code></div></div>` : ''}
          ${item.repair50 ? `<div class="col-6"><img class="img-fluid rounded mb-2" src="${item.repair50}" alt="Repair 50%"><div class="text-center small">Repair 50% <code>[repair50]</code></div></div>` : ''}
          ${item.repair100 ? `<div class="col-6"><img class="img-fluid rounded mb-2" src="${item.repair100}" alt="Repair 100%"><div class="text-center small">Repair 100% <code>[repair100]</code></div></div>` : ''}
          </div>
        </div>
      `;

  $('#detailModal .modal-body').html(detailHtml);
  const modal = new bootstrap.Modal(document.getElementById('detailModal'));
  modal.show();
});

// prettier-ignore
const validIndikatorSet = new Set([
    'Ambulance', 'Bahu Jalan [ Retak ]', 'Bahu Jalan [ Rutting ]', 'Bahu Jalan [ Tidak Ada Lubang ]', 'Bengkel Umum', 'Catatan', 'Drainase [ Penampang Saluran ]', 'Drainase [ Tidak Ada Endapan ]', 'Fasilitas Lainnya [ Anti Silau ]', 'Fasilitas Lainnya [ Pagar Pengaman ]', 'Fasilitas Lainnya [ Pagar Rumija ]', 'Fasilitas Lainnya [ Penerangan jalan Umum (PJU) ]', 'Informasi', 'Jumlah Antrian Kendaraan', 'Kebersihan [ Dalam Rumija Tol ]', 'Kebersihan [ Kantor Operasi dan Gardu Tol ]', 'Kecepatan Penanganan Hambatan Lalin [ Mulai Informasi diterima sampai ke tempat kejadian ]', 'Kecepatan Penanganan Hambatan Lalin [ Penanganan Kendaraan Mogok Jalan Tol Dalam Kota ]', 'Kecepatan Penanganan Hambatan Lalin [ Wilayah Pengamatan Observasi Patroli]', 'Kecepatan Penanganan Kendaraan Derek', 'Kecepatan Penanganan Patroli Jalan Raya', 'Kecepatan Tempuh Rata-Rata Kondisi Normal', 'Kecepatan Transaksi Rata-Rata', 'Kendaraan Derek', 'Kendaraan Rescue', 'Kondisi Jalan', 'Median [ Guardrail ]', 'Median [ Kerb ]', 'Median [ MCB (Median Concrete Barier) ]', 'Median [ Wire Rope ]', 'On / Off Ramp', 'Parkir Kendaraan', 'Patroli Jalan Tol (Operator)', 'Penanganan Kecelakaan [ Kendaraan Kecelakaan ]', 'Penanganan Kecelakaan [ Korban Kecelakaan ]', 'Penerangan', 'Pengamanan dan Penegakan Hukum', 'Perkerasan Jalan Utama [ Kekesatan ]', 'Perkerasan Jalan Utama [ Ketidakrataan (IRI) ]', 'Perkerasan Jalan Utama [ Lubang ]', 'Perkerasan Jalan Utama [ Retak ]', 'Perkerasan Jalan Utama [ Rutting ]', 'Petunjuk Jalan [ Guide Post ]', 'Petunjuk Jalan [ Marka Jalan ]', 'Petunjuk Jalan [ Patok Hektometer ]', 'Petunjuk Jalan [ Patok Kilometer ]', 'Petunjuk jalan [ Perambuan ]', 'Polisi Patroli Jalan Raya (PJR)', 'Rounding', 'Rumput [ Di Rumija Di Luar Rumaja ]', 'Sistem Informasi [ Nomor Telepon Info Tol ]', 'Sistem Informasi [Informasi dan Komunikasi Kondisi Lalu Lintas ]', 'Stasiun Pengisian Bahan Bakar', 'Tanaman [ Dalam Rumija Tol ]', 'Tempat Makan dan Minuman', 'Toilet'
]);
const validJalurSet = new Set(['Jalur A', 'Jalur B', 'Non Jalur']);
const validLajurSet = new Set(['Non Lajur', 'Bahu Luar', 'Lajur 1', 'Lajur 2', 'Lajur 3', 'Lajur 4', 'Lajur 5', 'Bahu Dalam', 'Ramp', 'Akses', 'Lajur Motor']);
/**
 * Event handler untuk input file PDF.
 *
 * Fungsi ini menangani event saat pengguna memilih file PDF melalui elemen `#pdfInput`.
 * File akan diproses menggunakan PDF.js untuk mengambil konten teks dari setiap halaman,
 * lalu diparsing menjadi entri-entri berdasarkan struktur yang dikenali (nomor, tanggal, STA, indikator, deskripsi, jalur, lajur, tanggal penanganan, metode, durasi).
 * Jika parsing gagal, akan disimpan sebagai entri error dengan detail tambahan.
 * Hasil akhir akan dikirim ke `mergeRepair100()` lalu ditampilkan ke dalam elemen `#output`
 * dan ditampilkan menggunakan `renderPdfTable()`. Proses ini akan menampilkan loading Swal selama berjalan.
 *
 * @event change
 * @memberof jQuery#pdfInput
 * @async
 * @fires Swal.fire
 *
 * @returns {Promise<void>}
 *
 * @throws Menampilkan alert SweetAlert jika proses PDF gagal.
 */
$('#pdfInput').on('change', async function () {
  const file = this.files[0];
  if (!file || !file.name.endsWith('.pdf')) {
    alert('Mohon pilih file PDF yang valid.');
    return;
  }

  Swal.fire({
    title: 'Memproses PDF...',
    text: 'Tunggu sebentar, sistem sedang membaca dan memproses data',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let allData = [];
    let errorCollector = []; // Untuk error parsing
    lastParseErrors = []; // Reset global error untuk matching

    // State antar halaman
    let prevBlock = null;
    let prevNo = null;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      if (!content.items || content.items.length === 0) continue;

      let lines = [];
      let line = '';
      content.items.forEach(item => {
        if (item.str && item.str.trim()) {
          line += item.str + ' ';
          if (item.hasEOL) {
            lines.push(line.trim());
            line = '';
          }
        }
      });
      if (line.trim()) lines.push(line.trim());

      let pageText = lines
        .join(' ')
        .replace(/(\d{4}-\d{2}-)\s+(\d{2})/g, '$1$2')
        .replace(/\s+/g, ' ');

      // Split berdasarkan nomor entri baru
      const entryRegex = /(?=\b\d{1,3}\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/g;
      const splitIndexes = [...pageText.matchAll(entryRegex)].map(m => m.index);

      let resplitIndexes = [];
      for (let i = 0; i < splitIndexes.length; i++) {
        const start = splitIndexes[i];
        const end = splitIndexes[i + 1] || pageText.length;
        let block = pageText.substring(start, end).trim();

        let normalized = block
          .replace(/(\d{4}-\d{2}-)\s+(\d{2})/g, '$1$2')
          .replace(/(\d{2}):\s*(\d{2}):\s*(\d{2})/g, '$1:$2:$3')
          .replace(/\s+/g, ' ');

        const mHead = normalized.match(/^(\d{1,3})\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
        if (!mHead) {
          if (prevBlock) {
            resplitIndexes[resplitIndexes.length - 1] += ' ' + block;
            prevBlock = resplitIndexes[resplitIndexes.length - 1];
          } else {
            resplitIndexes.push(block);
            prevBlock = block;
          }
          continue;
        }

        let currentNo = parseInt(mHead[1]);

        // Gabung blok lanjutan jika nomor sama
        if (prevNo !== null && currentNo === prevNo) {
          resplitIndexes[resplitIndexes.length - 1] += ' ' + block;
          prevBlock = resplitIndexes[resplitIndexes.length - 1];
          continue;
        }

        // Gabung jika blok sebelumnya berakhir dengan "Lajur" dan blok baru mulai dengan angka
        if (prevBlock && /\bLajur$/.test(prevBlock.trim()) && /^\d+\b/.test(block)) {
          resplitIndexes[resplitIndexes.length - 1] += ' ' + block;
          prevBlock = resplitIndexes[resplitIndexes.length - 1];
          continue;
        }

        resplitIndexes.push(block);
        prevBlock = block;
        prevNo = currentNo;
      }

      // ====================== PARSING TIAP BLOK ======================
      for (let block of resplitIndexes) {
        block = block.trim();
        try {
          const mHead = block.match(/^(\d{1,3})\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
          if (!mHead) throwParseError('HEADER', 'Header tidak valid');

          const currentNoStr = mHead[1].padStart(2, '0');
          let sisa1 = block.replace(mHead[0], '').trim();

          // STA
          const mSta = sisa1.match(/\b(\d{1,9}\.\d{3})\b/);
          if (!mSta) throwParseError('STA', 'STA tidak ditemukan');
          const sta = mSta[1];
          const [beforeSta, afterStaRaw] = sisa1.split(sta, 2);

          // Indikator & Deskripsi
          let kandidat = normalizeDashSpacing(beforeSta.trim());
          let indikator = '';
          let deskripsi = '';
          let found = false;

          for (let indValid of validIndikatorSet) {
            if (kandidat.startsWith(indValid)) {
              indikator = indValid;
              deskripsi = kandidat.replace(indValid, '').trim();
              found = true;
              break;
            }
          }
          if (!found) throwParseError('INDIKATOR', `Indikator tidak dikenali: "${kandidat}"`);

          // Jalur & Lajur
          let afterStaNorm = afterStaRaw
            .replace(/\s+/g, ' ')
            .replace(/Lajur\s*(\d+)/gi, 'Lajur $1')
            .replace(/Non\s*Lajur/gi, 'Non Lajur')
            .replace(/Non\s*Jalur/gi, 'Non Jalur')
            .trim();

          const mJalur = afterStaNorm.match(/\b(Jalur A|Jalur B|Non Jalur)\b\s+(Non Lajur|Bahu Luar|Lajur \d+|Bahu Dalam|Ramp|Akses|Lajur Motor)\b/i);
          if (!mJalur) throwParseError('JALUR', 'Jalur / Lajur tidak ditemukan');

          const jalur = mJalur[1];
          const lajur = mJalur[2].replace(/\s+/g, ' ').trim();
          const setelahJalur = afterStaNorm.replace(mJalur[0], '').trim();

          // ================== EKSTRAK TANGGAL, METODE, DURASI (PERBAIKAN UTAMA) ==================
          let tanggal = '';
          let metode = '';
          let durasi = '0 hari, 00 jam, 00 menit, 00 detik';

          // Pola utama: Tanggal + Metode + Durasi
          let mTindakan = setelahJalur.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+?)?\s*(\d+\s+hari,\s+\d+\s+jam,\s+\d+\s+menit(?:,\s+\d+\s+detik)?)/);

          if (mTindakan) {
            tanggal = mTindakan[1];
            metode = (mTindakan[2] || '').trim();
            durasi = mTindakan[3];
          } else {
            // Fallback: Ambil tanggal pertama yang muncul
            const fallback = setelahJalur.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
            if (fallback) {
              tanggal = fallback[1];
              // Ambil durasi di akhir block
              const mDur = block.match(/(\d+\s+hari,\s+\d+\s+jam,\s+\d+\s+menit(?:,\s+\d+\s+detik)?)/);
              if (mDur) durasi = mDur[1];
            } else {
              throwParseError('TANGGAL', 'Tanggal penanganan tidak ditemukan');
            }
          }

          // Simpan data yang sudah diparse
          allData.push({
            no: currentNoStr,
            tanggal,
            indikator,
            deskripsi: deskripsi || '',
            sta,
            jalur,
            lajur,
            metode: metode || '',
            durasi,
            repair100: '',
            content: block
          });
        } catch (err) {
          console.error('Error parsing block:', err.message, '\nBlock:', block);

          const mHead = block.match(/^(\d{1,3})/);
          const no = mHead ? mHead[1].padStart(2, '0') : '?';

          const mErr = err.message.match(/^\[(.*?)\]\s*(.*)$/);
          const errorCode = mErr ? mErr[1] : 'UNKNOWN';
          const errorMsg = mErr ? mErr[2] : err.message;

          errorCollector.push({ no, code: errorCode, message: errorMsg, content: block });

          allData.push({
            no,
            tanggal: '',
            indikator: `[${errorCode}] ${errorMsg}`,
            deskripsi: '',
            sta: '',
            jalur: '',
            lajur: '',
            metode: '',
            durasi: '',
            repair100: '',
            error: 'Gagal parse block',
            message: err.message,
            content: block
          });
        }
      }
    }

    // ====================== MATCHING DENGAN INDEXEDDB ======================
    console.log(`Total blok terdeteksi: ${allData.length}`);
    allData = await matchAndMergeWithDB(allData);

    // Render tabel
    renderPdfTable(allData);

    // Tampilkan summary error
    if (lastParseFailedCount > 0 || errorCollector.length > 0) {
      showFailureModal();
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Semua ${allData.length} data berhasil diparse dan dipairing dengan database.`,
        timer: 2500
      });
    }
  } catch (err) {
    console.error('Error keseluruhan:', err);
    Swal.fire({
      icon: 'error',
      title: 'Gagal Memproses PDF',
      text: err.message || 'Terjadi kesalahan saat membaca PDF.'
    });
  }
});

function normalizeDashSpacing(text) {
  return text
    .replace(/(\w)-\s+(\w)/g, '$1-$2') // Rata- Rata → Rata-Rata
    .replace(/\s+-\s+/g, ' - ') // tetap jaga dash pemisah kalimat
    .trim();
}
function throwParseError(code, message) {
  throw new Error(`[${code}] ${message}`);
}

/**
 * Menggabungkan data PDF hasil ekstraksi (`allData`) dengan data referensi (`globalData`)
 * berdasarkan kecocokan tanggal, indikator, STA, jalur, lajur, deskripsi, dan metode.
 *
 * Fungsi ini melakukan normalisasi teks dan pencocokan tanggal untuk menemukan pasangan yang cocok.
 * Jika ditemukan, field `repair100` dan `latlng` pada item akan diisi dari `globalData`.
 * Jika tidak ditemukan, akan diberi nilai default kosong dan "Tidak Ada Geolocations".
 *
 * @async
 * @function mergeRepair100
 * @param {Array<Object>} allData - Data hasil parsing dari PDF yang akan diperkaya.
 * @param {Array<Object>} globalData - Data acuan yang berisi informasi `repair100`, lokasi (`latlng`), dan metadata lainnya.
 * @returns {Promise<Array<Object>>} Data `allData` yang telah diperbarui dengan properti `repair100` dan `latlng`.
 *
 * @example
 * const result = await mergeRepair100(parsedPdfData, referenceData);
 * console.log(result[0].repair100); // Link repair jika cocok
 */
async function mergeRepair100(allData, globalData) {
  function formatDate(dateStr) {
    // "15 Jul 2025 14:37:32" → "2025-07-15 14:37:32"
    // Helper functions
    function generateMatchKey(dbItem) {
      const tanggal = formatDateForKey(dbItem.selesai || dbItem.end || '');
      const indikator = normalizeText(dbItem.indikator || '');
      const sta = (dbItem.lokasi || '').replace('STA ', '').trim();
      const jalur = (dbItem.jalur || '').toLowerCase();
      const lajur = (dbItem.lajur || '').toLowerCase();

      return `${tanggal}|${indikator}|${sta}|${jalur}|${lajur}`;
    }

    function formatDateForKey(dateStr) {
      // Ubah "30 Oct 2025 09:13:36" → "2025-10-30"
      const match = dateStr.match(/^(\d{1,2})\s+(\w{3})\s+(\d{4})/);
      if (!match) return '';
      const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
      return `${match[3]}-${months[match[2]]}-${match[1].padStart(2, '0')}`;
    }

    function findBestMatch(pdfItem, dbData, normalizedDB) {
      const pdfTanggal = pdfItem.tanggal; // sudah dalam format YYYY-MM-DD HH:mm:ss
      const pdfIndikator = normalizeText(pdfItem.indikator);
      const pdfDeskripsi = normalizeText(pdfItem.deskripsi || '');
      const pdfSta = pdfItem.sta || '';
      const pdfJalur = normalizeText(pdfItem.jalur);
      const pdfLajur = normalizeText(pdfItem.lajur);
      const pdfMetode = normalizeText(pdfItem.metode || '');

      // Coba exact key dulu (paling cepat)
      const exactKey = `${pdfTanggal.split(' ')[0]}|${pdfIndikator}|${pdfSta}|${pdfJalur}|${pdfLajur}`;
      if (normalizedDB.has(exactKey)) {
        const candidates = normalizedDB.get(exactKey);
        return { match: candidates[0], score: 100, reason: 'Exact match' };
      }

      // Fuzzy matching dengan skor
      let bestMatch = null;
      let bestScore = 0;
      let bestReason = '';

      for (const db of dbData) {
        let score = 0;
        let reasons = [];

        // Tanggal (paling penting)
        const dbTanggal = formatDateForKey(db.selesai || db.end || '');
        if (pdfTanggal.startsWith(dbTanggal)) {
          score += 40;
          reasons.push('Tanggal cocok');
        }

        // Indikator
        const dbInd = normalizeText(db.indikator || '');
        if (dbInd === pdfIndikator || dbInd.includes(pdfIndikator) || pdfIndikator.includes(dbInd)) {
          score += 30;
          reasons.push('Indikator cocok');
        } else if (isIndikatorMatch(db.indikator, pdfItem.indikator)) {
          score += 25;
          reasons.push('Indikator fuzzy match');
        }

        // STA
        if (db.lokasi && db.lokasi.replace('STA ', '').trim() === pdfSta) {
          score += 15;
          reasons.push('STA cocok');
        }

        // Jalur + Lajur
        if (normalizeText(db.jalur) === pdfJalur && normalizeText(db.lajur) === pdfLajur) {
          score += 10;
          reasons.push('Jalur & Lajur cocok');
        }

        // Deskripsi / Metode
        if (pdfDeskripsi && normalizeText(db.des) === pdfDeskripsi) {
          score += 5;
        }
        if (pdfMetode && normalizeText(db.desper) === pdfMetode) {
          score += 5;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = db;
          bestReason = reasons.join(' + ');
        }
      }

      if (bestScore >= 65) {
        // threshold bisa disesuaikan
        return {
          match: bestMatch,
          score: bestScore,
          reason: `Best match (${bestScore}%) - ${bestReason}`
        };
      }

      return {
        match: null,
        score: 0,
        reason: `Tidak ada match yang cukup baik (best score: ${bestScore}%)`,
        suggestedFix: 'Cek perbedaan indikator, STA, jalur, atau tanggal'
      };
    }

    // prettier-ignore
    const months = {
      Jan: '01',Feb: '02',Mar: '03',Apr: '04',May: '05',Jun: '06',
      Jul: '07',Aug: '08',Sep: '09',Oct: '10',Nov: '11',Dec: '12'
    };

    const match = dateStr.match(/^(\d{1,2}) (\w{3}) (\d{4}) (\d{2}:\d{2}:\d{2})$/);
    if (!match) return '';

    const [_, day, mon, year, time] = match;
    return `${year}-${months[mon]}-${day.padStart(2, '0')} ${time}`;
  }

  function isIndikatorMatch(ind1, ind2) {
    const tokens1 = normalizeText(ind1)
      .split(/\s+/)
      .filter(w => w.length > 2);
    const tokens2 = normalizeText(ind2)
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Semua kata penting dari salah satu ada di yang lain
    return tokens1.every(t => tokens2.includes(t)) || tokens2.every(t => tokens1.includes(t));
  }

  function normalizeText(str) {
    return (str || '')
      .toLowerCase()
      .replace(/[\[\]\(\)&]/g, '') // hapus kurung dan &
      .replace(/\s+/g, ' ') // spasi ganda jadi satu
      .trim();
  }

  allData.forEach(item => {
    const tanggal1 = item.tanggal;
    const match = globalData.find(g => {
      const tanggalGlobal = formatDate(g.selesai || g.end || '');

      return (
        tanggal1 === tanggalGlobal &&
        // normalizeText(g.indikator).includes(normalizeText(item.indikator)) &&
        isIndikatorMatch(g.indikator, item.indikator) &&
        (item.deskripsi ? g.des.toLowerCase() === item.deskripsi.toLowerCase() : true) &&
        (g.lokasi || '').replace('STA ', '') === item.sta &&
        g.jalur.toLowerCase() === item.jalur.toLowerCase() &&
        g.lajur.toLowerCase() === item.lajur.toLowerCase() &&
        g.desper.toLowerCase() === item.metode.toLowerCase()
      );
    });

    if (match) {
      item.repair100 = match.repair100 || '';
      item.latlng = match.repair_latitude_100 + ', ' + match.repair_longitude_100 || 'Tidak Ada Geolocations';
    } else {
      item.repair100 = '';
      item.latlng = 'Tidak Ada Geolocations';
      // throwParseError('MergeRepair', 'Tidak Ada Geolocations')
    }
  });

  return allData;
}

async function matchAndMergeWithDB(allData) {
  const dbData = await getAllFromIndexedDB();
  lastParseErrors = []; // reset setiap parsing

  const normalizedDB = new Map(); // Untuk lookup cepat

  // Preprocess DB data untuk lookup lebih cepat
  dbData.forEach(item => {
    const key = generateMatchKey(item);
    if (!normalizedDB.has(key)) {
      normalizedDB.set(key, []);
    }
    normalizedDB.get(key).push(item);
  });

  allData.forEach((item, index) => {
    if (item.error) {
      // Sudah error saat parsing block
      lastParseErrors.push({
        no: item.no || index + 1,
        type: 'PARSE_ERROR',
        message: item.message || 'Gagal parsing block PDF',
        pdfContent: item.content || '',
        pdfIndikator: item.indikator || '',
        suggestedFix: 'Periksa format PDF halaman tersebut'
      });
      return;
    }

    const matchResult = findBestMatch(item, dbData, normalizedDB);

    if (matchResult.match) {
      const match = matchResult.match;
      item.repair100 = match.repair100 || '';
      item.latlng = `${match.repair_latitude_100 || ''}, ${match.repair_longitude_100 || ''}`.trim() || 'Tidak Ada Geolocations';
      item.id_db = match.id; // simpan ID asli dari DB (sangat berguna)
      item.matchScore = matchResult.score;
    } else {
      item.repair100 = '';
      item.latlng = 'Tidak Ada Geolocations';
      item.matchScore = 0;

      lastParseErrors.push({
        no: item.no,
        type: 'MATCH_FAILED',
        message: matchResult.reason,
        pdfContent: '', // bisa diisi nanti jika mau
        pdfIndikator: item.indikator,
        pdfDeskripsi: item.deskripsi,
        pdfSta: item.sta,
        pdfJalur: item.jalur,
        pdfLajur: item.lajur,
        pdfTanggal: item.tanggal,
        pdfMetode: item.metode,
        suggestedFix: matchResult.suggestedFix || 'Cek apakah data sudah ada di database scraping'
      });
    }
  });

  lastParseSuccessCount = allData.length - lastParseErrors.length;
  lastParseFailedCount = lastParseErrors.length;

  return allData;
}

// Helper functions
function generateMatchKey(dbItem) {
  const tanggal = formatDateForKey(dbItem.selesai || dbItem.end || '');
  const indikator = normalizeText(dbItem.indikator || '');
  const sta = (dbItem.lokasi || '').replace('STA ', '').trim();
  const jalur = (dbItem.jalur || '').toLowerCase();
  const lajur = (dbItem.lajur || '').toLowerCase();

  return `${tanggal}|${indikator}|${sta}|${jalur}|${lajur}`;
}

function formatDateForKey(dateStr) {
  // Ubah "30 Oct 2025 09:13:36" → "2025-10-30"
  const match = dateStr.match(/^(\d{1,2})\s+(\w{3})\s+(\d{4})/);
  if (!match) return '';
  const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
  return `${match[3]}-${months[match[2]]}-${match[1].padStart(2, '0')}`;
}

function findBestMatch(pdfItem, dbData, normalizedDB) {
  const pdfTanggal = pdfItem.tanggal; // sudah dalam format YYYY-MM-DD HH:mm:ss
  const pdfIndikator = normalizeText(pdfItem.indikator);
  const pdfDeskripsi = normalizeText(pdfItem.deskripsi || '');
  const pdfSta = pdfItem.sta || '';
  const pdfJalur = normalizeText(pdfItem.jalur);
  const pdfLajur = normalizeText(pdfItem.lajur);
  const pdfMetode = normalizeText(pdfItem.metode || '');

  // Coba exact key dulu (paling cepat)
  const exactKey = `${pdfTanggal.split(' ')[0]}|${pdfIndikator}|${pdfSta}|${pdfJalur}|${pdfLajur}`;
  if (normalizedDB.has(exactKey)) {
    const candidates = normalizedDB.get(exactKey);
    return { match: candidates[0], score: 100, reason: 'Exact match' };
  }

  // Fuzzy matching dengan skor
  let bestMatch = null;
  let bestScore = 0;
  let bestReason = '';

  for (const db of dbData) {
    let score = 0;
    let reasons = [];

    // Tanggal (paling penting)
    const dbTanggal = formatDateForKey(db.selesai || db.end || '');
    if (pdfTanggal.startsWith(dbTanggal)) {
      score += 40;
      reasons.push('Tanggal cocok');
    }

    // Indikator
    const dbInd = normalizeText(db.indikator || '');
    if (dbInd === pdfIndikator || dbInd.includes(pdfIndikator) || pdfIndikator.includes(dbInd)) {
      score += 30;
      reasons.push('Indikator cocok');
    } else if (isIndikatorMatch(db.indikator, pdfItem.indikator)) {
      score += 25;
      reasons.push('Indikator fuzzy match');
    }

    // STA
    if (db.lokasi && db.lokasi.replace('STA ', '').trim() === pdfSta) {
      score += 15;
      reasons.push('STA cocok');
    }

    // Jalur + Lajur
    if (normalizeText(db.jalur) === pdfJalur && normalizeText(db.lajur) === pdfLajur) {
      score += 10;
      reasons.push('Jalur & Lajur cocok');
    }

    // Deskripsi / Metode
    if (pdfDeskripsi && normalizeText(db.des) === pdfDeskripsi) {
      score += 5;
    }
    if (pdfMetode && normalizeText(db.desper) === pdfMetode) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = db;
      bestReason = reasons.join(' + ');
    }
  }

  if (bestScore >= 65) {
    // threshold bisa disesuaikan
    return {
      match: bestMatch,
      score: bestScore,
      reason: `Best match (${bestScore}%) - ${bestReason}`
    };
  }

  return {
    match: null,
    score: 0,
    reason: `Tidak ada match yang cukup baik (best score: ${bestScore}%)`,
    suggestedFix: 'Cek perbedaan indikator, STA, jalur, atau tanggal'
  };
}

function normalizeText(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[\[\]\(\)&]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isIndikatorMatch(ind1, ind2) {
  const t1 = normalizeText(ind1)
    .split(' ')
    .filter(w => w.length > 2);
  const t2 = normalizeText(ind2)
    .split(' ')
    .filter(w => w.length > 2);
  return t1.every(t => t2.includes(t)) || t2.every(t => t1.includes(t));
}

/**
 * Event handler untuk tombol "Download All" (`#downloadAllBtn`).
 *
 * Fungsi ini mengambil semua baris data dari DataTable `#pdfTable`, memfilter entri yang memiliki URL `repair100` valid,
 * dan kemudian memformat nama file, lokasi, dan metadata lainnya untuk dikirim ke aplikasi AHK (via WebView2 atau objek global `ahk`)
 * untuk proses pengunduhan otomatis.
 *
 * Jika tidak ada data valid, akan menampilkan alert menggunakan SweetAlert2.
 * Jika ada data, akan mengirim konfigurasi saat ini dan data file ke AHK melalui `postMessage` atau `ahk.SubmitJson()`.
 *
 * @event click
 * @returns {void}
 *
 * @example
 * // Ketika tombol diklik, sistem akan mulai proses unduhan batch PDF
 * $('#downloadAllBtn').click();
 */
function buildFileName(row, formatArr) {
  const validTags = ['id', 'no', 'indikator', 'sta', 'jalur', 'lajur', 'metode', 'deskripsi', 'durasi', 'lokasi'];

  const parts = [];

  formatArr.forEach(tag => {
    if (!validTags.includes(tag)) return;

    switch (tag) {
      case 'id':
      case 'no':
        if (row.no) parts.push(row.no);
        break;

      case 'jalur':
      case 'lajur':
        // 🔥 PRIORITAS: jika jalur & lajur ada → gabungkan
        if (row.jalur && row.lajur) {
          // cegah dobel
          if (!parts.some(p => p === formatJalur(row.jalur, row.lajur))) {
            parts.push(formatJalur(row.jalur, row.lajur));
          }
        } else if (row.jalur) {
          parts.push(row.jalur);
        } else if (row.lajur) {
          parts.push(row.lajur);
        }
        break;

      case 'sta':
        if (row.sta) parts.push(`Lokasi ${formatSTA(row.sta)}`);
        break;

      case 'lokasi':
        if (row.sta) parts.push(`Lokasi ${formatSTA(row.sta)}`);
        break;

      default:
        if (row[tag]) parts.push(row[tag]);
    }
  });

  return parts
    .join(' ')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

$('#downloadAllBtn').on('click', function () {
  const table = $('#pdfTable').DataTable();

  const validData = table
    .rows()
    .data()
    .toArray()
    .filter(row => {
      const val = (row.repair100 ?? '').toString().trim();
      return val && val !== 'null';
    })
    .map(row => {
      // const fileName = `${row.no} Lokasi ${formatSTA(row.sta)} ${formatJalur(row.jalur, row.lajur)} ${row.indikator} ${row.deskripsi}`
      // .replace(/[\\/:*?"<>|]/g, '-') // Hapus karakter ilegal dalam fileName
      // .trim();

      // const formatArr = $('#filenameFormat').val() || [];
      const formatArr = filenameOrder || ['no', 'sta', 'jalur', 'lajur', 'indikator'];
      const fileName = buildFileName(row, formatArr);

      return {
        fileName,
        tanggal: row.tanggal,
        no: row.no,
        latlng: row.latlng,
        url: row.repair100
      };
    });

  console.log('Kirim ke AHK:', validData);

  if (!validData.length) {
    return Swal.fire('😟 Oops', 'Silakan pilih pdf filenya terlebih dahulu.', 'warning');
  }

  config = {
    pathMode: $('#pathMode').val(),
    pathDownload: $('#pathDownload').val(),
    pathExport: $('#pathExport').val(),
    // filenameFormat: $('#filenameFormat').val()
    filenameFormat: filenameOrder
  };

  // Kirim ke AHK menggunakan postMessage
  if (window.chrome?.webview) {
    $('#image-tab').click();
    $('#resultImages').empty();
    ahk.SubmitJson(JSON.stringify({ action: 'download', data: validData }));
  } else {
    Swal.fire('Tidak dapat mengirim ke ahk.localhost', 'Fitur ini hanya tersedia di aplikasi desktop', 'warning');
  }
});

/**
 * Memformat teks STA agar tampil dalam format standar, misalnya: "12+345".
 *
 * Menghapus prefix/polutan karakter dan memastikan format jarak ratusan dengan tanda '+'.
 * Jika input bukan angka yang valid, akan dikembalikan apa adanya.
 *
 * @function formatSTA
 * @param {string} sta - Teks STA mentah dari data PDF atau user input.
 * @returns {string} Teks STA yang telah diformat.
 *
 * @example
 * formatSTA("STA 12345") // "12+345"
 */
function formatSTA(staRaw) {
  if (!staRaw) return staRaw;

  // Bersihkan spasi, ubah koma ke titik
  let clean = staRaw.toString().trim().replace(/\s+/g, '').replace(',', '.');

  // Ambil bagian integer sebelum titik
  let [whole] = clean.split('.');

  // Jika panjang >= 4, maka ambil 3 digit terakhir sebagai offset
  if (whole.length >= 4) {
    const offset = whole.slice(-3);
    const km = whole.slice(0, -3);
    return `${parseInt(km)}+${offset}`;
  }

  // Jika panjang kurang dari 4 (misalnya 685 atau 100), tetap format dengan +000
  return `${parseInt(whole)}+000`;
}

/**
 * Menggabungkan informasi jalur dan lajur menjadi satu string ringkas.
 *
 * Cocok digunakan untuk penamaan file atau tampilan ringkas lokasi pada infrastruktur jalan.
 * Misalnya "Arah Jakarta" + "Lajur 2" → "Jakarta L2"
 *
 * @function formatJalur
 * @param {string} jalur - Jalur atau arah seperti "Arah Jakarta".
 * @param {string} lajur - Lajur seperti "Lajur 1" atau "L2".
 * @returns {string} Kombinasi ringkas seperti "Jakarta L2".
 *
 * @example
 * formatJalur("Arah Jakarta", "Lajur 2") // "Jakarta L2"
 */
function formatJalur(jalur, lajur) {
  // Ambil huruf terakhir dari jalur sebagai kode, lalu gabungkan
  const kode = (jalur.match(/[A-Z]$/) || [''])[0];
  return `${kode} ${lajur}`;
}

/**
 * Merender data PDF yang telah diekstrak ke dalam tabel menggunakan DataTables.
 *
 * Setiap baris menyajikan indikator, lokasi, deskripsi, dan tombol aksi seperti checkbox dan gambar.
 * Tabel ini ditampilkan dalam elemen `#pdfTable`.
 *
 * @async
 * @function renderPdfTable
 * @param {Array<Object>} data - Array objek entri dari hasil parsing PDF.
 * @returns {Promise<void>} Tidak mengembalikan apa pun. Mengubah DOM secara langsung.
 *
 * @example
 * await renderPdfTable(allData);
 */
function renderPdfTable(allData) {
  allData = allData.map(d => ({
    ...d,
    repair100: d.repair100 ?? '' // paksa null kalau undefined
  }));

  viewLog && console.warn('renderPdfTable', allData);
  Swal.fire({ title: '🕵️ Memasukan ke pdfTable...', didOpen: () => Swal.showLoading() });

  val = (allData[0].repair100 ?? '').toString().trim();
  if (!$.fn.DataTable.isDataTable('#pdfTable')) {
    $('#pdfTable').DataTable({
      responsive: true,
      data: allData,
      columns: [
        {
          title: '<i class="fa-solid fa-images"></i>',
          data: 'repair100',
          render: function (data) {
            try {
              const val = (data ?? '').toString().trim();
              return !val || val === 'null' || val === '' ? `<i class="fa-solid fa-square-xmark text-danger fs-3"></i>` : `<i class="fa-solid fa-square-check text-success fs-3"></i>`;
            } catch (e) {
              console.error('Error parsing repair100:', data, e);
              return `<i class="fa-solid fa-xmark text-info fs-3"></i>`;
            }
          }
        },
        {
          title: 'No',
          data: 'no',
          render: (data, type, row) => {
            return row.error ? `<i class="fa-solid fa-square-xmark text-danger fs-3"></i> ${data}` : data || '-';
          }
        },
        {
          title: 'Tanggal',
          data: 'tanggal',
          render: (data, type, row) => (row.error ? '-' : data || '-')
        },
        {
          title: 'Indikator',
          data: 'indikator',
          render: (data, type, row) => (row.error ? '-' : data || '-')
        },
        {
          title: 'Deskripsi',
          data: 'deskripsi',
          render: (data, type, row) => (row.error ? '-' : data || '-')
        },
        {
          title: 'STA',
          data: 'sta',
          render: (data, type, row) => (row.error ? '-' : data || '-')
        },
        {
          title: 'Jalur',
          data: 'jalur',
          render: (data, type, row) => (row.error ? '-' : data || '-')
        },
        {
          title: 'Lajur',
          data: 'lajur',
          render: (data, type, row) => (row.error ? '-' : data || '-')
        },
        {
          title: 'Metode',
          data: 'metode',
          render: (data, type, row) => (row.error ? '-' : data || '-')
        }
      ]
    });
  } else {
    const table = $('#pdfTable').DataTable();
    table.clear().rows.add(allData).draw();
  }

  Swal.close();
}

/**
 * Menyimpan konfigurasi `config` ke sistem eksternal (AHK) dalam format JSON.
 *
 * Fungsi ini mengirim objek konfigurasi saat ini ke aplikasi AutoHotkey menggunakan
 * metode `SubmitJson`, dengan `action` bernilai `'config'`. Setelah dikirim,
 * modal pengaturan (`#configModal`) akan ditutup secara otomatis.
 *
 * @function saveConfig
 * @returns {void}
 *
 * @example
 * // Simpan konfigurasi saat tombol simpan ditekan
 * saveConfig();
 */
function saveConfigJSON() {
  console.warn({ action: 'config', data: config });

  if (window.chrome?.webview) {
    ahk.SubmitJson(JSON.stringify({ action: 'config', data: config }));
    $('#configModal').modal('hide');
  }
}

/**
 * Merender kartu informasi indikator dengan efek delay/animasi.
 *
 * Kartu berisi ringkasan entri PDF seperti indikator, status geolokasi, dan deskripsi.
 * Digunakan untuk memberi efek loading bertahap atau efek interaktif di halaman.
 *
 * @async
 * @function renderCardsWithDelay
 * @param {Array<Object>} data - Array data entri hasil parsing PDF.
 * @param {number} [interval=40] - Waktu delay antar render (dalam milidetik).
 * @returns {Promise<void>} Tidak mengembalikan apa pun. Mengubah DOM secara bertahap.
 *
 * @example
 * await renderCardsWithDelay(allData, 50);
 */

async function renderCardsWithDelay(status, index, total, no, fileName, pathFile = null) {
  console.warn('renderCardsWithDelay', [status, index, total, no, fileName, pathFile]);

  // Update progress bar
  const percent = Math.round((index / total) * 100);
  $('#progressBarTotal .progress-bar')
    .css('width', percent + '%')
    .text(`${percent}%`)
    .attr('aria-valuenow', percent);

  if (status == 'proccess') {
    $('#progressInfo').html(`${index} of ${total} file name ${fileName}`);
    const $card = $(`
          <div class="col-sm-6 col-md-4 col-lg-3 col-xl-2 mb-3">
            <div class="card border-secondary placeholder" id="card-${String(no).padStart(2, '0')}">
              <div class="card-body">
                <h5 class="card-title">Memproses item ${String(no).padStart(2, '0')}</h5>
                <p class="card-text text-muted">Sedang diproses...</p>
                <div class="spinner-border text-secondary" role="status" style="width: 1rem; height: 1rem;">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        `);
    $('#resultImages').prepend($card);
  } else if (status == 'failed') {
    // Hapus placeholder, ganti dengan isi final
    $(`#card-${String(no).padStart(2, '0')}`).removeClass('placeholder').html(`
          <div class="card-body p-0">
            <svg aria-label="Placeholder: Responsive image" class="bd-placeholder-img bd-placeholder-img-lg img-fluid" height="250" preserveAspectRatio="xMidYMid slice" role="img" width="100%" xmlns="http://www.w3.org/2000/svg"><title>Placeholder</title><rect width="100%" height="100%" fill="#868e96"></rect><text x="50%" y="50%" fill="#dee2e6" dy=".3em">Gagal data ${no}</text></svg>
          </div>
        `);
  } else if (status == 'done') {
    // console.warn(no, pathFile)
    // Hapus placeholder, ganti dengan isi final
    $(`#card-${String(no).padStart(2, '0')}`).removeClass('placeholder').html(`
          <div class="card-body p-0">
            <img src="${pathFile}" class="img-fluid rounded w-100" alt="${fileName}" data-bs-toggle="tooltip" data-bs-title="${fileName}" >
          </div>
        `);
  } else if (status == 'finish') {
    $('#progressInfo').html(`Proccess Selesai`);
    $('#progressBarTotal .progress-bar')
      .css('width', 100 + '%')
      .text(`100%`)
      .attr('aria-valuenow', 100);
    Swal.fire('Proccess is Done!', `Semua hasil export berada pada folder ${config.pathExport}`, 'success');
    return;
  }
}

function checkLatestVersion() {
  $.getJSON(sheetUrl, function (data) {
    const current = data.find(row => row.app_packet === app_packet && row.app_online == 'TRUE');
    if (!current) return console.warn('Versi tidak ditemukan dalam spreadsheet.');

    const latestVersion = current.app_version;
    const onlineLink = current.app_link;
    const onlineStatus = current.app_online;

    if (onlineStatus !== 'TRUE') {
      console.log('Update dinonaktifkan.');
      return;
    }
    // console.log('app_version:', app_version)
    // console.log('latestVersion:', latestVersion)

    if (latestVersion !== app_version) {
      Swal.fire({
        icon: 'info',
        title: 'Versi Baru Tersedia',
        html: `Versi terbaru: <b>${latestVersion}</b><br>Versi Anda: <b>${app_version}</b>`,
        confirmButtonText: 'Unduh',
        showCancelButton: true
      }).then(result => {
        if (result.isConfirmed) {
          window.open(onlineLink, '_blank');
        }
      });
    } else {
      console.log('Aplikasi sudah versi terbaru.');
    }
  }).fail(function () {
    console.error('Gagal mengambil data versi dari spreadsheet.');
  });
}

async function generateDatabaseSummary(globalData) {
  if (!globalData || globalData.length === 0) {
    document.getElementById('dbSummary').innerHTML = `<div class="alert alert-warning">Database masih kosong.</div>`;
    return;
  }

  const THRESHOLD_PERCENT = 85; // ambang batas hijau

  let groups = {};

  globalData.forEach(row => {
    let tanggal = row.tanggal;
    if (!tanggal) return;

    let [year, month, day] = tanggal.split('-');
    let key = `${year}-${month}`;

    if (!groups[key]) {
      groups[key] = {
        days: [],
        totalData: 0
      };
    }

    groups[key].days.push(parseInt(day));
    groups[key].totalData++;
  });

  let html = `
    <table id="summaryTable" class="table table-bordered table-striped table-hover table-sm w-100">
      <thead class="table-dark">
        <tr>
          <th>Tahun-Bulan</th>
          <th>Tanggal Awal</th>
          <th>Tanggal Akhir</th>
          <th>Hari Terisi</th>
          <th>Total Hari</th>
          <th>Total Data</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  Object.keys(groups)
    .sort()
    .forEach(key => {
      const group = groups[key];

      let daysSorted = group.days.sort((a, b) => a - b);
      let uniqueDays = new Set(daysSorted);
      let filledDays = uniqueDays.size;

      let firstDay = daysSorted[0];
      let lastDay = daysSorted[daysSorted.length - 1];

      let [y, m] = key.split('-');
      let totalDaysInMonth = new Date(y, m, 0).getDate();

      let percent = ((filledDays / totalDaysInMonth) * 100).toFixed(2);

      let statusBadge = percent >= THRESHOLD_PERCENT ? `<span class="badge bg-success">Baik (${percent}%)</span>` : `<span class="badge bg-danger">Kurang (${percent}%)</span>`;

      html += `
        <tr>
          <td>${key}</td>
          <td>${y}-${m}-${String(firstDay).padStart(2, '0')}</td>
          <td>${y}-${m}-${String(lastDay).padStart(2, '0')}</td>
          <td>${filledDays}</td>
          <td>${totalDaysInMonth}</td>
          <td>${group.totalData}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    });

  html += `</tbody></table>`;

  document.getElementById('dbSummary').innerHTML = html;

  $('#summaryTable').DataTable({
    pageLength: 12,
    order: [[0, 'desc']],
    responsive: true
  });
}

function exportGlobalDataToCSV(data) {
  if (!data || data.length === 0) {
    alert('globalData kosong, tidak bisa diekspor.');
    return;
  }

  // Ambil semua key kolom dari objek pertama
  const headers = Object.keys(data[0]);

  // Generate CSV header
  let csv = headers.join(',') + '\n';

  // Isi data baris
  data.forEach(item => {
    let row = headers
      .map(h => {
        let val = item[h] ?? '';

        // Escape tanda koma & kutip
        if (typeof val === 'string') {
          val = val.replace(/"/g, '""');
          if (val.includes(',') || val.includes('\n')) {
            val = `"${val}"`;
          }
        }

        return val;
      })
      .join(',');
    csv += row + '\n';
  });

  // Buat blob
  let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  // Buat link download
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = 'database_export.csv';
  a.click();

  // Clean
  URL.revokeObjectURL(url);
}

function addItemPrompt(field) {
  Swal.fire({
    title: 'Tambah Item',
    input: 'text',
    showCancelButton: true
  }).then(async res => {
    if (res.value) {
      await addConfigItem(field, res.value);
      renderConfigEditor();
    }
  });
}

function editItemPrompt(field, index, oldValue) {
  Swal.fire({
    title: 'Edit Item',
    input: 'text',
    inputValue: oldValue,
    showCancelButton: true
  }).then(async res => {
    if (res.value) {
      await editConfigItem(field, index, res.value);
      renderConfigEditor();
    }
  });
}

async function renderConfigEditor() {
  const config = await loadConfig();

  let html = '';

  for (const field of ['validKeys', 'validIndikator', 'validJalur', 'validLajur', 'validTags']) {
    html += `<h5>${field}</h5><ul class="list-group mb-3">`;

    config[field].forEach((item, idx) => {
      html += `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <span>${item}</span>
          <div>
            <button class="btn btn-sm btn-outline-primary"
                    onclick="editItemPrompt('${field}', ${idx}, '${item}')">Edit</button>
            <button class="btn btn-sm btn-outline-danger"
                    onclick="deleteConfigItem('${field}', ${idx}); renderConfigEditor();">Delete</button>
          </div>
        </li>
      `;
    });

    html += `
      <li class="list-group-item">
        <button class="btn btn-sm btn-success" onclick="addItemPrompt('${field}')">+ Add New</button>
      </li>
    </ul>`;
  }

  document.getElementById('configEditorContent').innerHTML = html;
}

async function addConfigItem(field, value) {
  const config = await loadConfig();
  if (!Array.isArray(config[field])) {
    config[field] = [];
  }
  config[field].push(value);
  await saveConfig(config);
}

async function editConfigItem(field, index, newValue) {
  const config = await loadConfig();
  config[field][index] = newValue;
  await saveConfig(config);
}

async function deleteConfigItem(field, index) {
  const config = await loadConfig();
  config[field].splice(index, 1);
  await saveConfig(config);
}

async function resetConfig() {
  await saveConfig(defaultConfig);
  Swal.fire('Reset Berhasil', 'Konfigurasi kembali ke default', 'success');
}
async function saveConfig(config) {
  const db = await openDB();
  const tx = db.transaction('configStore', 'readwrite');
  const store = tx.objectStore('configStore');

  // 🔑 simpan dengan key tetap
  store.put({
    id: 'config',
    ...config
  });

  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });

  saveConfigJSON?.();
}

async function loadConfig() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('configStore', 'readonly');
    const store = tx.objectStore('configStore');
    const req = store.get('config');

    req.onsuccess = () => {
      if (req.result) {
        console.log('CONFIG LOADED FROM INDEXEDDB');
        const { id, ...config } = req.result; // buang id
        resolve(config);
      } else {
        console.log('NO CONFIG FOUND → USING DEFAULT');
        resolve(defaultConfig);
      }
    };

    req.onerror = () => reject(req.error);
  });
}

function showFailureModal() {
  if (lastParseFailedCount === 0) {
    Swal.fire({
      icon: 'success',
      title: 'Semua Data Berhasil Dipairing!',
      text: `${lastParseSuccessCount} data berhasil dicocokkan dengan database.`
    });
    return;
  }

  let html = `
    <div style="text-align:left; max-height: 60vh; overflow-y:auto;">
      <h5><b>${lastParseFailedCount} data gagal matching</b> dari total ${lastParseSuccessCount + lastParseFailedCount} data</h5>
      <table class="table table-sm table-bordered">
        <thead class="table-danger">
          <tr>
            <th>No</th>
            <th>Indikator PDF</th>
            <th>STA</th>
            <th>Jalur / Lajur</th>
            <th>Alasan Gagal</th>
            <th>Saran</th>
          </tr>
        </thead>
        <tbody>
  `;

  lastParseErrors.forEach(err => {
    html += `
      <tr>
        <td><b>${err.no}</b></td>
        <td>${err.pdfIndikator || '-'}</td>
        <td>${err.pdfSta || '-'}</td>
        <td>${err.pdfJalur || '-'} / ${err.pdfLajur || '-'}</td>
        <td><small>${err.message}</small></td>
        <td><small>${err.suggestedFix || '-'}</small></td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;

  Swal.fire({
    title: `⚠️ ${lastParseFailedCount} Data Gagal Pairing`,
    html: html,
    width: '95%',
    confirmButtonText: 'Tutup',
    scrollbarPadding: false
  });
}

// DEFAULT CONFIG
// prettier-ignore
const defaultConfig = {
  id: 'config',
  validKeys: [
    'id','temuan','repair0','repair50','repair100','des','desper','end','latitude','longitude',
    'dur','repair_latitude_0','repair_longitude_0','repair_latitude_50','repair_longitude_50',
    'repair_latitude_100','repair_longitude_100','timestamp','ruas','indikator','jalur','lajur',
    'lokasi','selesai'
    // 'no','indikator','sta','jalur','lajur','metode','deskripsi','durasi'
  ],
  validTags : ['no','indikator','sta','jalur','lajur','metode','deskripsi','durasi'],
  validIndikator: Array.from(validIndikatorSet),
  validJalur: Array.from(validJalurSet),
  validLajur: Array.from(validLajurSet)
};
