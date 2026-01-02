// ===================== CONFIG =====================
const SHEET_ID = '1JZ4OV-qpB_QhyXJMeNR9YRAL5GDuKYdAm62ch7ShteM';
const SETTINGS_SHEET = '.Settings';

const VALID_SUMBER = ['ATM', 'CASH'];
const VALID_JENIS = ['debit', 'kredit'];

// ===================== DO GET =====================
function doGet(e) {
  try {
    const action = e.parameter.action;
    const ss = SpreadsheetApp.openById(SHEET_ID);

    // Mengambil pengaturan dari sheet .Settings
    if (action === 'getOptions') {
      return getOptions(ss);
    }

    // Mengambil daftar semua nama sheet
    if (action === 'getSheets') {
      const sheetNames = getAllSheetNames(ss);
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', data: sheetNames }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Mengambil data dari sheet tertentu
    if (action === 'getData') {
      const sheetName = e.parameter.sheet;
      if (!sheetName) {
        return errorResponse('Parameter "sheet" (nama sheet) diperlukan.');
      }

      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        return errorResponse(`Sheet dengan nama "${sheetName}" tidak ditemukan.`);
      }

      // Header ada di baris 2, kolom A sampai K (11 kolom)
      const headersRange = sheet.getRange('A2:K2').getValues();
      const headers = headersRange[0].map(h => normalizeHeader(h));

      const lastRow = sheet.getLastRow();

      // Jika tidak ada data (hanya header dan saldo awal)
      if (lastRow < 4) {
        // Ambil saldo awal dari baris 3 (kolom I, J, K)
        const saldoAwal = sheet.getRange('I3:K3').getValues()[0];
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          data: [],
          saldo: {
            atm: saldoAwal[0] || 0,
            cashPihak1: saldoAwal[1] || 0,
            cashPihak2: saldoAwal[2] || 0
          }
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // Ambil data dari baris 4 sampai akhir, kolom A-K (11 kolom)
      const dataRange = sheet.getRange(4, 1, lastRow - 3, headers.length);
      const rows = dataRange.getValues();

      const result = rows.map(row => {
        let obj = {};
        headers.forEach((header, i) => {
          if (i < headers.length) {
            obj[header] = row[i] !== undefined ? row[i] : '';
          }
        });
        return obj;
      });

      // Ambil saldo terbaru dari baris terakhir (kolom I, J, K)
      const saldoTerbaru = sheet.getRange(lastRow, 9, 1, 3).getValues()[0];

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: result,
        saldo: {
          atm: saldoTerbaru[0] || 0,
          cashPihak1: saldoTerbaru[1] || 0,
          cashPihak2: saldoTerbaru[2] || 0
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return errorResponse('Aksi tidak valid untuk doGet.');

  } catch (err) {
    return errorResponse(err.message);
  }
}

// ===================== DO POST =====================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const ss = SpreadsheetApp.openById(SHEET_ID);

    // Handle SAVE OPTIONS action
    if (data.action === 'saveOptions') {
      return saveOptions(ss, data);
    }

    // Handle DELETE action
    if (data.action === 'delete') {
      return handleDelete(data);
    }

    // Handle EDIT action
    if (data.action === 'edit') {
      return handleEdit(ss, data);
    }

    // Handle ADD transaction (default)
    return handleAddTransaction(ss, data);

  } catch (err) {
    return errorResponse(`Terjadi error: ${err.message}`);
  }
}

// ===================== GET OPTIONS =====================
function getOptions(ss) {
  try {
    const settingsSheet = ss.getSheetByName(SETTINGS_SHEET);

    if (!settingsSheet) {
      return errorResponse(`Sheet "${SETTINGS_SHEET}" tidak ditemukan. Silakan buat sheet dengan nama tersebut.`);
    }

    // Ambil nilai dari Sheet .Settings
    const photo = settingsSheet.getRange('B1').getValue() || '';
    const title = settingsSheet.getRange('B2').getValue() || '';
    const subtitle = settingsSheet.getRange('B3').getValue() || '';
    const pin = settingsSheet.getRange('B4').getValue() || '';
    
    // Ambil Nama Pihak dari B5 dan C5
    const pihak1 = settingsSheet.getRange('B5').getValue() || '';
    const pihak2 = settingsSheet.getRange('C5').getValue() || '';

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: {
        title: title,
        subtitle: subtitle,
        pin: String(pin),
        photo: photo,
        pihak: [pihak1, pihak2]
      }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return errorResponse(`Error mengambil pengaturan: ${err.message}`);
  }
}

// ===================== SAVE OPTIONS =====================
function saveOptions(ss, data) {
  try {
    const { title, subtitle, pin, photo, pihak1, pihak2 } = data;

    let settingsSheet = ss.getSheetByName(SETTINGS_SHEET);

    // Jika sheet .Settings tidak ada, buat baru
    if (!settingsSheet) {
      settingsSheet = ss.insertSheet(SETTINGS_SHEET);
      // Set header labels di kolom A
      settingsSheet.getRange('A1').setValue('URL Foto Profil');
      settingsSheet.getRange('A2').setValue('Judul');
      settingsSheet.getRange('A3').setValue('Subjudul');
      settingsSheet.getRange('A4').setValue('PIN (6 digit)');
      settingsSheet.getRange('A5').setValue('Nama Pihak 1 & 2');
    } else {
       // Pastikan label A5 ada jika sheet sudah ada tapi lama
       settingsSheet.getRange('A5').setValue('Nama Pihak 1 & 2');
    }

    // Simpan nilai
    if (photo !== undefined) settingsSheet.getRange('B1').setValue(photo);
    if (title !== undefined) settingsSheet.getRange('B2').setValue(title);
    if (subtitle !== undefined) settingsSheet.getRange('B3').setValue(subtitle);
    if (pin !== undefined) settingsSheet.getRange('B4').setValue(pin);
    
    // Simpan Nama Pihak (Pihak 1 di B5, Pihak 2 di C5)
    if (pihak1 !== undefined) settingsSheet.getRange('B5').setValue(pihak1);
    if (pihak2 !== undefined) settingsSheet.getRange('C5').setValue(pihak2);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Pengaturan berhasil disimpan'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return errorResponse(`Error menyimpan pengaturan: ${err.message}`);
  }
}

// ===================== HANDLE DELETE =====================
function handleDelete(data) {
  const { sheetName, rowNumber } = data;

  if (!sheetName) return errorResponse('Nama sheet diperlukan.');
  if (!rowNumber) return errorResponse('Nomor baris diperlukan.');

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) return errorResponse(`Sheet "${sheetName}" tidak ditemukan.`);

  const lastRow = sheet.getLastRow();
  const noColumn = sheet.getRange(4, 1, lastRow - 3, 1).getValues();

  let targetRow = -1;
  for (let i = 0; i < noColumn.length; i++) {
    if (noColumn[i][0] == rowNumber) {
      targetRow = i + 4;
      break;
    }
  }

  if (targetRow === -1) return errorResponse('Data tidak ditemukan.');

  sheet.deleteRow(targetRow);
  return successResponse('Data berhasil dihapus');
}

// ===================== HANDLE EDIT =====================
function handleEdit(ss, data) {
  const { sheetName, rowNumber, tanggal, keterangan, nominal, pihak, sumber, jenis, includeTime } = data;

  if (!sheetName) return errorResponse('Nama sheet diperlukan.');
  if (!rowNumber) return errorResponse('Nomor baris diperlukan.');

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return errorResponse(`Sheet "${sheetName}" tidak ditemukan.`);

  // Validasi Dinamis Pihak
  const validPihakList = getDynamicPihak(ss);
  
  // Normalisasi input
  const validatedSumber = (sumber || '').toUpperCase();
  const validatedPihak = capitalize(pihak || '');
  const validatedJenis = (jenis || '').toLowerCase();
  const validatedNominal = parseInt(nominal, 10);

  if (!VALID_SUMBER.includes(validatedSumber)) {
    return errorResponse(`Sumber tidak valid. Gunakan: ${VALID_SUMBER.join(', ')}`);
  }
  
  // Cek apakah pihak yang dikirim ada di list dinamis
  if (!validPihakList.includes(validatedPihak)) {
    return errorResponse(`Pihak tidak valid. Pilihan: ${validPihakList.join(', ')}`);
  }

  if (!VALID_JENIS.includes(validatedJenis)) {
    return errorResponse(`Jenis tidak valid. Gunakan: ${VALID_JENIS.join(', ')}`);
  }
  if (isNaN(validatedNominal) || validatedNominal <= 0) {
    return errorResponse(`Nominal tidak valid`);
  }

  // Cari baris
  const lastRow = sheet.getLastRow();
  const noColumn = sheet.getRange(4, 1, lastRow - 3, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < noColumn.length; i++) {
    if (noColumn[i][0] == rowNumber) {
      targetRow = i + 4;
      break;
    }
  }

  if (targetRow === -1) return errorResponse('Data tidak ditemukan.');

  const debit = validatedJenis === 'debit' ? validatedNominal : '';
  const kredit = validatedJenis === 'kredit' ? validatedNominal : '';

  let jam = '';
  if (includeTime === true) {
    jam = Utilities.formatDate(new Date(), "Asia/Jakarta", "HH:mm:ss");
  }

  sheet.getRange(targetRow, 2).setValue(tanggal || '');
  sheet.getRange(targetRow, 3).setValue(jam ? "'" + jam : '');
  sheet.getRange(targetRow, 4).setValue(validatedSumber);
  sheet.getRange(targetRow, 5).setValue(keterangan || '-');
  sheet.getRange(targetRow, 6).setValue(validatedPihak);
  sheet.getRange(targetRow, 7).setValue(debit);
  sheet.getRange(targetRow, 8).setValue(kredit);

  return successResponse('Data berhasil diupdate');
}

// ===================== HANDLE ADD TRANSACTION =====================
function handleAddTransaction(ss, data) {
  let { tanggal, sumber, keterangan, pihak, jenis, nominal, sheetName, includeTime } = data;

  if (!sheetName) return errorResponse('Nama sheet diperlukan.');

  // Validasi Dinamis Pihak
  const validPihakList = getDynamicPihak(ss);

  tanggal = tanggal ? tanggal : Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy");
  
  let jam = '';
  if (includeTime === true) {
    jam = Utilities.formatDate(new Date(), "Asia/Jakarta", "HH:mm:ss");
  }

  sumber = (sumber || '').toUpperCase();
  pihak = capitalize(pihak || '');
  jenis = (jenis || '').toLowerCase();
  nominal = parseInt(nominal, 10);

  if (!VALID_SUMBER.includes(sumber)) {
    return errorResponse(`Sumber tidak valid. Gunakan: ${VALID_SUMBER.join(', ')}`);
  }
  
  if (!validPihakList.includes(pihak)) {
    return errorResponse(`Pihak tidak valid. Pilihan: ${validPihakList.join(', ')}`);
  }

  if (!VALID_JENIS.includes(jenis)) {
    return errorResponse(`Jenis tidak valid. Gunakan: ${VALID_JENIS.join(', ')}`);
  }
  if (isNaN(nominal) || nominal <= 0) {
    return errorResponse(`Nominal tidak valid`);
  }

  const debit = jenis === 'debit' ? nominal : '';
  const kredit = jenis === 'kredit' ? nominal : '';

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return errorResponse(`Sheet "${sheetName}" tidak ditemukan.`);

  sheet.appendRow([
    null,
    tanggal,
    jam ? "'" + jam : '',
    sumber,
    keterangan || '-',
    pihak,
    debit,
    kredit
  ]);

  return successResponse('Data berhasil disimpan');
}

// ===================== HELPER: DYNAMIC PIHAK =====================
function getDynamicPihak(ss) {
  const settingsSheet = ss.getSheetByName(SETTINGS_SHEET);
  
  // Default jika sheet setting belum dibuat sama sekali
  if (!settingsSheet) return ['Pihak 1', 'Pihak 2'];

  // Ambil B5 dan C5
  const p1 = settingsSheet.getRange('B5').getValue();
  const p2 = settingsSheet.getRange('C5').getValue();

  const list = [];
  if (p1) list.push(capitalize(String(p1)));
  if (p2) list.push(capitalize(String(p2)));

  // Default jika sheet setting belum dibuat sama sekali
  return list.length > 0 ? list : ['Pihak 1', 'Pihak 2'];
}

// ===================== HELPER: UTILS =====================
function normalizeHeader(str) {
  return String(str).trim().toLowerCase();
}

function getAllSheetNames(spreadsheet) {
  const sheets = spreadsheet.getSheets();
  return sheets.map(sheet => sheet.getName());
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function errorResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'error', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function successResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}