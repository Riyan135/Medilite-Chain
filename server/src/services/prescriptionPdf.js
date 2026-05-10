const escapePdfText = (value) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r?\n/g, ' ');

const wrapText = (value, maxChars) => {
  const words = String(value || '-').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });

  if (line) {
    lines.push(line);
  }

  return lines.length ? lines.slice(0, 3) : ['-'];
};

const formatHistory = (history = {}) =>
  [
    history.diabetes && 'Diabetes',
    history.bloodPressure && 'BP',
    history.asthma && 'Asthma',
    history.heartDisease && 'Heart disease',
    history.kidneyDisease && 'Kidney disease',
    history.liverDisease && 'Liver disease',
    history.other,
  ]
    .filter(Boolean)
    .join(', ') || 'No history reported';

export const buildPrescriptionPdf = (consultation) => {
  const lines = [];
  const pageWidth = 595;
  const pageHeight = 842;

  const raw = (command) => lines.push(command);
  const text = (x, y, value, size = 10, font = 'F1', color = '0.1 0.12 0.18 rg') => {
    raw(`${color} BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`);
  };
  const rect = (x, y, width, height, stroke = null, fill = null) => {
    if (fill) raw(`${fill} rg ${x} ${y} ${width} ${height} re f`);
    if (stroke) raw(`${stroke} ${x} ${y} ${width} ${height} re S`);
  };
  const line = (x1, y1, x2, y2, color = '0.9 0.92 0.95 RG', width = 1) => {
    raw(`${width} w ${color} ${x1} ${y1} m ${x2} ${y2} l S`);
  };

  // Watermark (rotated 45 deg, very light gray/blue)
  raw('0.97 0.98 0.99 rg'); // VERY light blue/gray
  raw('BT /F2 100 Tf 0.707 0.707 -0.707 0.707 100 200 Tm (MEDILITE) Tj ET');
  raw('BT /F2 100 Tf 0.707 0.707 -0.707 0.707 200 100 Tm (MEDILITE) Tj ET');

  // Top Accent Banner
  rect(0, 832, pageWidth, 10, null, '0.15 0.39 0.92');

  // Header
  // Logo Icon Box
  rect(48, 756, 38, 38, null, '0.15 0.39 0.92');
  raw('1 1 1 RG 2 w 54 776 m 61 776 l 66 787 l 72 766 l 78 776 l 86 776 l S'); // ECG pulse
  
  text(98, 778, 'MediLite Prescription', 22, 'F2', '0.1 0.15 0.25 rg');
  text(98, 762, 'Verified digital clinical record & treatment advice', 9, 'F1', '0.4 0.45 0.55 rg');
  
  // Verification Badge
  rect(422, 766, 125, 24, null, '0.88 0.96 0.90'); // Light green bg
  text(438, 774, 'VERIFIED RECORD', 8, 'F2', '0.1 0.5 0.2 rg');

  // Main Divider
  line(48, 735, 547, 735, '0.85 0.88 0.92 RG', 1);

  const patient = consultation.patient || {};
  const doctor = consultation.doctor || {};
  const intake = consultation.medicalIntake || {};
  const history = intake.pastMedicalHistory || {};

  // Information Header Section (Clean Typography instead of boxes)
  const infoY = 705;
  text(48, infoY, 'PATIENT DETAILS', 7, 'F2', '0.5 0.55 0.65 rg');
  text(48, infoY - 14, patient.name || '-', 11, 'F2', '0.1 0.1 0.1 rg');
  text(48, infoY - 26, patient.email || '-', 9, 'F1', '0.4 0.4 0.4 rg');

  text(220, infoY, 'CONSULTING DOCTOR', 7, 'F2', '0.5 0.55 0.65 rg');
  text(220, infoY - 14, `Dr. ${doctor.name || '-'}`, 11, 'F2', '0.1 0.1 0.1 rg');
  text(220, infoY - 26, doctor.specialization || 'Doctor', 9, 'F1', '0.4 0.4 0.4 rg');

  text(400, infoY, 'CONSULTATION DATE', 7, 'F2', '0.5 0.55 0.65 rg');
  text(400, infoY - 14, consultation.scheduledDate || '-', 10, 'F2', '0.1 0.1 0.1 rg');
  text(400, infoY - 26, consultation.scheduledTime || '-', 9, 'F1', '0.4 0.4 0.4 rg');

  line(48, 655, 547, 655, '0.92 0.94 0.96 RG', 1);

  // Diagnosis & Symptoms
  text(48, 630, 'Diagnosis:', 9, 'F2', '0.3 0.35 0.4 rg');
  text(105, 630, consultation.diagnosis || 'Not recorded', 9, 'F2', '0.1 0.1 0.1 rg');

  text(48, 610, 'Symptoms:', 9, 'F2', '0.3 0.35 0.4 rg');
  text(105, 610, consultation.symptoms || 'Not recorded', 9, 'F1', '0.2 0.25 0.3 rg');

  // Intake Section (Minimalist)
  text(48, 570, 'Medical Intake Summary', 11, 'F2', '0.15 0.39 0.92 rg'); // Blue accent title
  line(48, 560, 547, 560, '0.92 0.94 0.96 RG', 0.5);

  const intakeY = 540;
  text(48, intakeY, 'ALLERGIES', 7, 'F2', '0.5 0.55 0.6 rg');
  text(48, intakeY - 12, wrapText(intake.allergies || 'None', 20)[0], 8, 'F1', '0.2 0.2 0.2 rg');

  text(150, intakeY, 'CURRENT MEDICINES', 7, 'F2', '0.5 0.55 0.6 rg');
  text(150, intakeY - 12, wrapText(intake.currentMedicines || 'None', 20)[0], 8, 'F1', '0.2 0.2 0.2 rg');

  text(280, intakeY, 'MEDICAL HISTORY', 7, 'F2', '0.5 0.55 0.6 rg');
  text(280, intakeY - 12, wrapText(formatHistory(history), 30)[0], 8, 'F1', '0.2 0.2 0.2 rg');

  text(430, intakeY, 'PREGNANCY', 7, 'F2', '0.5 0.55 0.6 rg');
  text(430, intakeY - 12, String(intake.pregnancyStatus || 'N/A').replaceAll('_', ' '), 8, 'F1', '0.2 0.2 0.2 rg');

  // Prescription Table (Modern, airy)
  text(48, 485, 'Prescription', 14, 'F2', '0.1 0.15 0.2 rg');
  
  // Table Header
  rect(48, 455, 499, 22, null, '0.95 0.96 0.98'); // Very light blue/gray header bg
  text(58, 463, '#', 7, 'F2', '0.4 0.45 0.5 rg');
  text(86, 463, 'MEDICINE', 7, 'F2', '0.4 0.45 0.5 rg');
  text(240, 463, 'DOSAGE', 7, 'F2', '0.4 0.45 0.5 rg');
  text(350, 463, 'DURATION', 7, 'F2', '0.4 0.45 0.5 rg');
  text(430, 463, 'INSTRUCTIONS', 7, 'F2', '0.4 0.45 0.5 rg');

  const rows = consultation.prescription?.length ? consultation.prescription : [];
  const rowHeight = 24;
  
  rows.slice(0, 10).forEach((item, index) => {
    const y = 431 - index * rowHeight;
    // Row separator
    line(48, y - 6, 547, y - 6, '0.92 0.94 0.96 RG', 0.5);
    
    text(58, y + 2, String(index + 1), 8, 'F1', '0.4 0.45 0.5 rg');
    text(86, y + 2, item.medicine || '-', 9, 'F2', '0.1 0.15 0.25 rg');
    text(240, y + 2, item.dosage || '-', 8, 'F1', '0.2 0.25 0.3 rg');
    text(350, y + 2, item.duration || '-', 8, 'F1', '0.2 0.25 0.3 rg');
    text(430, y + 2, item.instructions || '-', 8, 'F1', '0.2 0.25 0.3 rg');
  });

  if (!rows.length) {
    line(48, 425, 547, 425, '0.92 0.94 0.96 RG', 0.5);
    text(58, 433, 'No medicines prescribed.', 9, 'F3', '0.5 0.5 0.5 rg');
  }

  // Doctor Notes Section
  text(48, 200, 'Doctor Notes & Advice', 11, 'F2', '0.15 0.39 0.92 rg');
  wrapText(consultation.notes || 'No specific advice recorded.', 65).forEach((item, index) => {
    text(48, 180 - index * 14, item, 9, 'F1', '0.2 0.25 0.3 rg');
  });

  // Signatures
  // Digital Signature
  text(380, 160, doctor.digitalSignatureName || `Dr. ${doctor.name || '-'}`, 18, 'F3', '0.1 0.2 0.4 rg');
  line(370, 150, 540, 150, '0.85 0.88 0.92 RG', 1);
  text(380, 138, doctor.digitalSignatureName || `Dr. ${doctor.name || '-'}`, 9, 'F2');
  text(380, 126, doctor.specialization || 'Doctor', 8, 'F1', '0.4 0.4 0.4 rg');
  text(380, 114, `License: ${doctor.medicalLicenseNumber || 'Not provided'}`, 8, 'F1', '0.4 0.4 0.4 rg');

  // Footer
  line(48, 70, 547, 70, '0.9 0.92 0.95 RG', 1);
  text(48, 55, 'This is a digitally generated prescription from the MediLite platform. It is valid without a physical signature.', 7, 'F1', '0.5 0.55 0.6 rg');
  text(48, 45, 'For verification or queries, please contact your healthcare provider directly.', 7, 'F1', '0.5 0.55 0.6 rg');

  const stream = lines.join('\\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\\nstream\\n${stream}\\nendstream`,
  ];

  let pdf = '%PDF-1.4\\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\\n${object}\\nendobj\\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\\n0 ${objects.length + 1}\\n0000000000 65535 f \\n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \\n`;
  });
  pdf += `trailer\\n<< /Size ${objects.length + 1} /Root 1 0 R >>\\nstartxref\\n${xrefOffset}\\n%%EOF`;

  return Buffer.from(pdf, 'binary');
};
