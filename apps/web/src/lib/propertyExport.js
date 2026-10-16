import ExcelJS from 'exceljs';

export const buildExportModel = ({
  kaek,
  geoData,
  area,
  perimeter,
  coords,
  sdigmap,
  fieldLabels = {},
  selectedCategoryKeys = null,
  mapImageDataUrl = null,
}) => {
  const fmtNum = (n) =>
    typeof n === 'number' ? n.toLocaleString('el-GR', { maximumFractionDigits: 2 }) : '—';

  const coordsText = coords
    ? typeof coords === 'string'
      ? coords
      : `${coords.latitude}, ${coords.longitude}`
    : '—';

  const summary = [
    ['ΚΑΕΚ', kaek || '—'],
    ['Νομός / Περιφέρεια', geoData?.structuredAddress?.regionalUnit || geoData?.county || '—'],
    ['Δήμος / ΟΤΑ', geoData?.structuredAddress?.municipality || geoData?.municipality || '—'],
    ['Εμβαδόν (τ.μ.)', fmtNum(area)],
    ['Περίμετρος (μ.)', fmtNum(perimeter)],
    ['Συντεταγμένες', coordsText],
  ];

  const label = (f) => fieldLabels[f] || f;

  const allCategories = sdigmap?.categories || [];
  const filteredCategories = selectedCategoryKeys
    ? allCategories.filter((cat) => selectedCategoryKeys.includes(cat.key))
    : allCategories;

  const categories = filteredCategories.map((cat) => ({
    label: cat.label,
    layers: (cat.layers || []).map((lyr) => ({
      label: lyr.label,
      records: (lyr.records || []).map((rows) => {
        let fek = null;
        let apof = null;
        let pubDate = null;

        const cleanedRows = rows
          .filter((row) => !String(row?.field || '').includes('FLAG'))
          .map((row) => {
            const f = row.field;
            const v = row.url ? row.url : row.value != null ? String(row.value) : '—';
            if (f === 'FEK') fek = v;
            if (f === 'APOF_EIDOS' || f === 'APOF_THEME') apof = v;
            if (f === 'PUBL_DATE') pubDate = v;
            return {
              field: f,
              label: label(f),
              value: v,
            };
          });

        return {
          fek,
          apof,
          pubDate,
          items: cleanedRows,
        };
      }),
    })),
  }));

  const locationText = [
    geoData?.road,
    geoData?.houseNumber,
    geoData?.city || geoData?.municipality,
    geoData?.postalCode ? `ΤΚ ${geoData.postalCode}` : '',
  ].filter(Boolean).join(', ') || 'Μη διαθέσιμη διεύθυνση';

  return { kaek, summary, categories, mapImageDataUrl, locationText };
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const isUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v);

// --- EXPORT TO PDF (Πλήρης Τεχνική Έκθεση Όλων των Στοιχείων) ---
export const generatePdfHtml = (model) => {
  const currentDate = new Date().toLocaleDateString('el-GR');
  const reportNo = `REP-${String(model.kaek || '000000').slice(-6)}`;

  const overviewRows = model.summary
    .map(
      ([f, v]) => `
      <div class="cell">
        <span class="lbl">${esc(f)}</span>
        <span class="val">${isUrl(v) ? `<a href="${esc(v)}">${esc(v)}</a>` : esc(v)}</span>
      </div>`
    )
    .join('');

  const mapHtml = model.mapImageDataUrl
    ? `<div class="map-box">
        <img src="${model.mapImageDataUrl}" alt="Χάρτης Ακινήτου" />
       </div>`
    : '';

  let sectionCounter = 2;
  const categoriesHtml = (model.categories || [])
    .map((cat) => {
      const currentSectionNum = sectionCounter++;
      const layersHtml = (cat.layers || [])
        .map((lyr) => {
          const recCount = (lyr.records || []).length;
          const recs = (lyr.records || [])
            .map((rec, ri) => {
              const fekTitle = rec.fek
                ? `ΦΕΚ ${rec.fek}${rec.pubDate ? ` (${rec.pubDate})` : ''}`
                : rec.apof
                ? `${rec.apof}`
                : `ΠΡΑΞΗ / ΕΓΓΡΑΦΗ #${ri + 1}`;

              const gridItems = (rec.items || [])
                .map(
                  (row) => `
                  <div class="cell">
                    <span class="lbl">${esc(row.label)}</span>
                    <span class="val">${
                      isUrl(row.value)
                        ? `<a href="${esc(row.value)}">${esc(row.value)}</a>`
                        : esc(row.value)
                    }</span>
                  </div>`
                )
                .join('');

              return `
              <div class="fek-card">
                <div class="fek-card-header">
                  <span class="fek-tag">ΣΧΕΤΙΚΟ ΕΓΓΡΑΦΟ ${ri + 1}/${recCount}</span>
                  <span class="fek-title">${esc(fekTitle)}</span>
                </div>
                <div class="grid">${gridItems}</div>
              </div>`;
            })
            .join('');

          const lyrTitle = cat.layers.length > 1 ? `<div class="layer-title">${esc(lyr.label)}</div>` : '';
          return `${lyrTitle}${recs}`;
        })
        .join('');

      return `
      <section class="doc-sec">
        <div class="sec-hdr">
          <span class="sec-idx">${currentSectionNum}.</span> ${esc(cat.label).toUpperCase()}
        </div>
        ${layersHtml}
      </section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="utf-8" />
  <title>Αναφορά ${esc(model.kaek || '')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 14mm 14mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      font-size: 10px;
      line-height: 1.35;
      padding: 12mm 14mm;
      width: 100%;
    }
    .top-grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      row-gap: 8px;
      column-gap: 20px;
      padding-bottom: 12px;
      border-bottom: 1.5px solid #111827;
      margin-bottom: 14px;
    }
    .top-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-bottom: 3px;
      border-bottom: 0.5px solid #e5e7eb;
    }
    .top-lbl {
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #6b7280;
      text-transform: uppercase;
    }
    .top-val {
      font-size: 10.5px;
      font-weight: 600;
      color: #111827;
    }
    .doc-sec {
      margin-bottom: 14px;
      page-break-inside: auto;
    }
    .sec-hdr {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #111827;
      text-transform: uppercase;
      padding-bottom: 4px;
      border-bottom: 1px solid #111827;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 5px;
      break-after: avoid;
    }
    .sec-idx { color: #6b7280; }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 14px;
    }
    .cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-bottom: 3px;
      border-bottom: 0.5px solid #e5e7eb;
      min-width: 0;
    }
    .lbl {
      font-size: 7px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #6b7280;
      text-transform: uppercase;
    }
    .val {
      font-size: 9px;
      font-weight: 500;
      color: #1f2937;
      word-break: break-word;
    }
    .fek-card {
      background: #fafafa;
      border: 0.8px solid #d1d5db;
      border-radius: 4px;
      padding: 8px 10px;
      margin-bottom: 8px;
      break-inside: avoid;
    }
    .fek-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 0.6px solid #e5e7eb;
      padding-bottom: 4px;
      margin-bottom: 7px;
    }
    .fek-tag {
      font-size: 6.5px;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: #4b5563;
      background: #f3f4f6;
      border: 0.5px solid #e5e7eb;
      padding: 1.5px 5px;
      border-radius: 3px;
    }
    .fek-title {
      font-size: 8.5px;
      font-weight: 700;
      color: #111827;
    }
    .layer-title {
      font-size: 8px;
      font-weight: 700;
      color: #4b5563;
      text-transform: uppercase;
      margin: 6px 0 4px;
      break-after: avoid;
    }
    .map-box {
      margin-top: 8px;
      border: 0.6px solid #d1d5db;
      border-radius: 4px;
      overflow: hidden;
      break-inside: avoid;
    }
    .map-box img {
      width: 100%;
      max-height: 230px;
      object-fit: cover;
      display: block;
    }
    .footer-sign {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 20px;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #111827;
      break-inside: avoid;
    }
    a { color: #1d4ed8; text-decoration: none; }
    @media print {
      body { 
        padding: 0 !important; 
        margin: 0 !important;
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
      }
    }
  </style>
</head>
<body>
  <div class="top-grid">
    <div class="top-item">
      <span class="top-lbl">PROJECT IDENTIFIER (ΚΑΕΚ)</span>
      <span class="top-val">${esc(model.kaek || '—')}</span>
    </div>
    <div class="top-item">
      <span class="top-lbl">REPORT DATE</span>
      <span class="top-val">${currentDate}</span>
    </div>
    <div class="top-item">
      <span class="top-lbl">PROJECT LOCATION</span>
      <span class="top-val">${esc(model.locationText)}</span>
    </div>
    <div class="top-item">
      <span class="top-lbl">REPORT NO.</span>
      <span class="top-val">${reportNo}</span>
    </div>
  </div>

  <section class="doc-sec">
    <div class="sec-hdr">
      <span class="sec-idx">1.</span> SITE OVERVIEW & BASIC METRICS
    </div>
    <div class="grid">${overviewRows}</div>
    ${mapHtml}
  </section>

  ${categoriesHtml}

  <div class="footer-sign">
    <div class="top-item" style="border-bottom: none;">
      <span class="top-lbl">REPORT PREPARED BY</span>
      <span class="top-val">ReportAKI Automated Planning Engine</span>
    </div>
    <div class="top-item" style="border-bottom: none;">
      <span class="top-lbl">DATA SOURCE & STATUS</span>
      <span class="top-val">Official Cadastre & SDIGMAP / ΓΠΣ Records</span>
    </div>
  </div>
</body>
</html>`;
};

// --- EXPORT TO PDF (Μόνο Πόρισμα - Μεγάλο Logo & KAEK κάτω από τη γραμμή) ---
export const generateSummaryHtml = ({ kaek, summary }) => {
  const currentDateFormatted = new Intl.DateTimeFormat('el-GR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const safeKaek = esc(kaek || '—');

  return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="utf-8" />
  <title>Πόρισμα ${safeKaek} - ReportAKI</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 14mm 8mm 14mm;
    }

    * { 
      box-sizing: border-box; 
      margin: 0; 
      padding: 0; 
    }

    html {
      background: #f1f5f9;
      height: 100%;
    }

    body {
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      padding: 8mm 12mm 5mm 12mm;
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow-y: auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* 1. Header: ΜΟΝΟ η ημερομηνία πάνω από τη γραμμή */
    .top-date-row {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding-bottom: 2mm;
      font-size: 10px;
      font-weight: 600;
      color: #475569;
    }

    .main-header-divider {
      width: 100%;
      height: 1.5px;
      background: #0f172a;
      margin-bottom: 5mm;
    }

    /* 2. Σώμα Εγγράφου με Float Sidebar */
    .doc-main-content {
      flex: 1;
      position: relative;
    }

    /* Αριστερό Μπλοκ: Μεγάλο Logo + Μεγάλο ΚΑΕΚ */
    .left-identity-box {
      float: left;
      width: 62mm;
      margin-right: 8mm;
      margin-bottom: 4mm;
    }

    .brand-block {
      width: 100%;
      max-width: 58mm;
      margin-bottom: 5mm;
    }

    .logo-img {
      width: 100%;
      height: auto;
      max-height: 70px; /* Μεγαλωμένο Logo */
      object-fit: contain;
      object-position: left top;
      display: block;
    }

    .meta-kaek-title {
      font-size: 15px; /* Μεγαλωμένο KAEK */
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      letter-spacing: -0.01em;
    }

    .meta-desc {
      font-size: 9.5px;
      font-weight: 500;
      color: #475569;
      line-height: 1.45;
      margin-top: 2px;
    }

    .meta-divider {
      width: 100%;
      height: 1.5px;
      background: #0f172a;
      margin-top: 6px;
    }

    /* Δεξιά: Τίτλος & Κείμενο που ξεκινά δίπλα και ρέει από κάτω */
    .doc-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      margin-bottom: 2.5mm;
    }

    .summary-text {
      font-size: 8.9px;
      line-height: 1.5;
      color: #1e293b;
      text-align: justify;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .sign-block {
      margin-top: 3.5mm;
      display: flex;
      justify-content: flex-end;
      clear: both;
    }

    .sign-title {
      font-size: 10px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.03em;
    }

    /* 3. Υποσέλιδο & Disclaimer */
    .footer-wrapper {
      margin-top: 3.5mm;
      padding-top: 2.5mm;
      border-top: 1px solid #0f172a;
      clear: both;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 1.5mm;
    }

    .contact-lbl {
      font-size: 7px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .contact-val {
      font-size: 7.5px;
      color: #475569;
    }

    .disclaimer-box {
      background: #f8fafc;
      border: 0.5px solid #cbd5e1;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 6.8px;
      line-height: 1.35;
      color: #64748b;
      text-align: justify;
    }

    @media print {
      html, body {
        background: #ffffff !important;
        height: 100% !important;
        overflow: hidden !important;
      }
      body {
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>

  <!-- Μόνο η ημερομηνία πάνω από τη γραμμή -->
  <div class="top-date-row">
    ${currentDateFormatted}
  </div>
  <div class="main-header-divider"></div>

  <!-- Σώμα: Logo + KAEK αριστερά, Τεχνικό Πόρισμα δεξιά και κάτω -->
  <div class="doc-main-content">
    <div class="left-identity-box">
      <div class="brand-block">
        <img src="/logo.png" alt="ReportAKI" class="logo-img" />
      </div>
      <div class="meta-kaek-title">
        ΚΑΕΚ ${safeKaek}
      </div>
      <div class="meta-desc">
        Παρουσίαση πολεοδομικών, γεωχωρικών και νομικών δεδομένων.
      </div>
      <div class="meta-divider"></div>
    </div>

    <h1 class="doc-title">Τεχνικό Πόρισμα Ακινήτου</h1>
    <div class="summary-text">${esc(summary)}</div>

    <div class="sign-block">
      <span class="sign-title">ReportAKI</span>
    </div>
  </div>

  <!-- Υποσέλιδο & Disclaimer -->
  <div class="footer-wrapper">
    <div class="contact-item">
      <span class="contact-lbl">ΠΗΓΗ ΔΕΔΟΜΕΝΩΝ:</span>
      <span class="contact-val">Εθνικό Κτηματολόγιο / SDIGMAP ΤΕΕ</span>
    </div>

    <div class="disclaimer-box">
      Το παρόν πόρισμα παράγεται από ψηφιακό βοηθητικό εργαλείο και βασίζεται αποκλειστικά στα διαθέσιμα στοιχεία των επίσημων γεωπυλών. Παρέχεται μόνο για σκοπούς αρχικής ενημέρωσης και δεν υποκαθιστά τον επιτόπιο τεχνικό έλεγχο μηχανικού ή τις επίσημες βεβαιώσεις της αρμόδιας Υπηρεσίας Δόμησης.
    </div>
  </div>

</body>
</html>`;
};

// Excel Export (Διατηρείται για συμβατότητα)
export const exportToExcel = async (model) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Αναφορά Ακινήτου');
  ws.columns = [
    { header: 'Πεδίο', key: 'field', width: 40 },
    { header: 'Τιμή', key: 'value', width: 70 },
  ];

  let r = 2;
  const sectionTitle = (text) => {
    const row = ws.getRow(r);
    ws.mergeCells(`A${r}:B${r}`);
    row.getCell(1).value = text;
    row.font = { bold: true, size: 12 };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    r++;
  };
  const kv = (field, value) => {
    const row = ws.getRow(r);
    row.getCell(1).value = field;
    row.getCell(2).value = value;
    r++;
  };

  sectionTitle('Βασικά Στοιχεία');
  (model.summary || []).forEach(([f, v]) => kv(f, v));
  r++;

  (model.categories || []).forEach((cat) => {
    sectionTitle(cat.label);
    (cat.layers || []).forEach((lyr) => {
      (lyr.records || []).forEach((rec) => {
        (rec.items || []).forEach((row) => kv(row.label, row.value));
      });
    });
    r++;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ReportAKI-${model.kaek || 'akinito'}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};