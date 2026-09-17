import express from 'express';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const SDIG_API_BASE = 'https://sdigmap.tee.gov.gr/sdmquery/public/';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const downloadsDir = path.join(__dirname, '../../downloads');

await fs.mkdir(downloadsDir, { recursive: true }).catch(() => {});

router.post('/', async (req, res) => {
  const { propertyId, format, sections } = req.body;

  if (!propertyId || !format || !sections) {
    return res.status(400).json({ error: 'propertyId, format, and sections are required' });
  }

  if (!['pdf', 'excel'].includes(format)) {
    return res.status(400).json({ error: 'format must be either "pdf" or "excel"' });
  }

  if (!Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ error: 'sections must be a non-empty array' });
  }

  console.log(`Exporting property ${propertyId} as ${format}`);

  const response = await fetch(`${SDIG_API_BASE}${propertyId}`);

  if (!response.ok) {
    throw new Error(`ΣΔΙΓ API error: ${response.status} ${response.statusText}`);
  }

  const propertyData = await response.json();

  const filename = `report-${propertyId}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
  const filepath = path.join(downloadsDir, filename);

  if (format === 'pdf') {
    await generatePDF(propertyData, sections, filepath);
  } else if (format === 'excel') {
    await generateExcel(propertyData, sections, filepath);
  }

  res.json({
    downloadUrl: `/downloads/${filename}`,
  });
});

async function generatePDF(propertyData, sections, filepath) {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const maxWidth = doc.internal.pageSize.width - 2 * margin;

  doc.setFontSize(16);
  doc.text('Property Report', margin, yPosition);
  yPosition += 15;

  if (sections.includes('basicInfo')) {
    doc.setFontSize(12);
    doc.text('Basic Information', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    const basicInfo = [
      `ID: ${propertyData.id || propertyData.objectId || 'N/A'}`,
      `Address: ${propertyData.address || propertyData.addressText || 'N/A'}`,
      `KAEK: ${propertyData.kaek || propertyData.kaekCode || 'N/A'}`,
    ];

    basicInfo.forEach((line) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });

    yPosition += 5;
  }

  if (sections.includes('urbanPlanning')) {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.text('Urban Planning Data', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    const urbanData = [
      `Building Type: ${propertyData.buildingType || 'N/A'}`,
      `Area: ${propertyData.area || propertyData.buildingArea || 'N/A'} m²`,
      `Year Built: ${propertyData.yearBuilt || 'N/A'}`,
      `Floors: ${propertyData.floors || 'N/A'}`,
      `Zoning: ${propertyData.zoning || propertyData.zoningCategory || 'N/A'}`,
    ];

    urbanData.forEach((line) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });

    yPosition += 5;
  }

  if (sections.includes('geospatial')) {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.text('Geospatial Data', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    const geoData = [
      `Latitude: ${propertyData.latitude || 'N/A'}`,
      `Longitude: ${propertyData.longitude || 'N/A'}`,
      `Location: ${propertyData.location || 'N/A'}`,
    ];

    geoData.forEach((line) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });

    yPosition += 5;
  }

  if (sections.includes('legal')) {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.text('Legal Information', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    const legalData = [
      `Ownership: ${propertyData.ownership || propertyData.ownerInfo || 'N/A'}`,
      `Cadastral Number: ${propertyData.cadastralNumber || 'N/A'}`,
      `Restrictions: ${propertyData.restrictions || propertyData.legalRestrictions || 'None'}`,
    ];

    legalData.forEach((line) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
  }

  await fs.writeFile(filepath, Buffer.from(doc.output('arraybuffer')));
  console.log(`PDF generated: ${filepath}`);
}

async function generateExcel(propertyData, sections, filepath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Property Report');

  worksheet.columns = [
    { header: 'Field', key: 'field', width: 30 },
    { header: 'Value', key: 'value', width: 50 },
  ];

  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };

  let rowNum = 2;

  if (sections.includes('basicInfo')) {
    worksheet.getRow(rowNum).font = { bold: true, size: 12 };
    worksheet.getCell(`A${rowNum}`).value = 'BASIC INFORMATION';
    rowNum++;

    const basicInfo = [
      ['ID', propertyData.id || propertyData.objectId || 'N/A'],
      ['Address', propertyData.address || propertyData.addressText || 'N/A'],
      ['KAEK', propertyData.kaek || propertyData.kaekCode || 'N/A'],
    ];

    basicInfo.forEach(([field, value]) => {
      worksheet.getCell(`A${rowNum}`).value = field;
      worksheet.getCell(`B${rowNum}`).value = value;
      rowNum++;
    });

    rowNum++;
  }

  if (sections.includes('urbanPlanning')) {
    worksheet.getRow(rowNum).font = { bold: true, size: 12 };
    worksheet.getCell(`A${rowNum}`).value = 'URBAN PLANNING DATA';
    rowNum++;

    const urbanData = [
      ['Building Type', propertyData.buildingType || 'N/A'],
      ['Area (m²)', propertyData.area || propertyData.buildingArea || 'N/A'],
      ['Year Built', propertyData.yearBuilt || 'N/A'],
      ['Floors', propertyData.floors || 'N/A'],
      ['Zoning', propertyData.zoning || propertyData.zoningCategory || 'N/A'],
    ];

    urbanData.forEach(([field, value]) => {
      worksheet.getCell(`A${rowNum}`).value = field;
      worksheet.getCell(`B${rowNum}`).value = value;
      rowNum++;
    });

    rowNum++;
  }

  if (sections.includes('geospatial')) {
    worksheet.getRow(rowNum).font = { bold: true, size: 12 };
    worksheet.getCell(`A${rowNum}`).value = 'GEOSPATIAL DATA';
    rowNum++;

    const geoData = [
      ['Latitude', propertyData.latitude || 'N/A'],
      ['Longitude', propertyData.longitude || 'N/A'],
      ['Location', propertyData.location || 'N/A'],
    ];

    geoData.forEach(([field, value]) => {
      worksheet.getCell(`A${rowNum}`).value = field;
      worksheet.getCell(`B${rowNum}`).value = value;
      rowNum++;
    });

    rowNum++;
  }

  if (sections.includes('legal')) {
    worksheet.getRow(rowNum).font = { bold: true, size: 12 };
    worksheet.getCell(`A${rowNum}`).value = 'LEGAL INFORMATION';
    rowNum++;

    const legalData = [
      ['Ownership', propertyData.ownership || propertyData.ownerInfo || 'N/A'],
      ['Cadastral Number', propertyData.cadastralNumber || 'N/A'],
      ['Restrictions', propertyData.restrictions || propertyData.legalRestrictions || 'None'],
    ];

    legalData.forEach(([field, value]) => {
      worksheet.getCell(`A${rowNum}`).value = field;
      worksheet.getCell(`B${rowNum}`).value = value;
      rowNum++;
    });
  }

  await workbook.xlsx.writeFile(filepath);
  console.log(`Excel file generated: ${filepath}`);
}

export default router;
