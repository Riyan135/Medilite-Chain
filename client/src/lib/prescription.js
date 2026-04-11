export const downloadPrescriptionPdf = (consultation) => {
  if (typeof window === 'undefined') {
    return;
  }

  const printableWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printableWindow) {
    return;
  }

  const prescriptionRows = (consultation.prescription || [])
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.medicine}</td>
          <td>${item.dosage}</td>
          <td>${item.duration}</td>
          <td>${item.instructions || '-'}</td>
        </tr>
      `
    )
    .join('');

  printableWindow.document.write(`
    <html>
      <head>
        <title>Prescription - ${consultation.patient?.name || 'Patient'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
          h1, h2, h3, p { margin: 0 0 12px; }
          .section { margin-top: 28px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
          .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 14px; }
          th { background: #eff6ff; }
        </style>
      </head>
      <body>
        <h1>MediLite Prescription</h1>
        <p>Download or print this page as PDF.</p>
        <div class="meta">
          <div class="meta-card">
            <h3>Patient</h3>
            <p>${consultation.patient?.name || '-'}</p>
            <p>${consultation.patient?.email || '-'}</p>
          </div>
          <div class="meta-card">
            <h3>Doctor</h3>
            <p>Dr. ${consultation.doctor?.name || '-'}</p>
            <p>${consultation.doctor?.email || '-'}</p>
          </div>
          <div class="meta-card">
            <h3>Consultation</h3>
            <p>${consultation.scheduledDate || '-'}</p>
            <p>${consultation.scheduledTime || '-'}</p>
          </div>
          <div class="meta-card">
            <h3>Diagnosis</h3>
            <p>${consultation.diagnosis || 'Not recorded'}</p>
          </div>
        </div>
        <div class="section">
          <h2>Symptoms</h2>
          <p>${consultation.symptoms || 'Not recorded'}</p>
        </div>
        <div class="section">
          <h2>Doctor Notes</h2>
          <p>${consultation.notes || 'No notes added.'}</p>
        </div>
        <div class="section">
          <h2>Prescription</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>${prescriptionRows || '<tr><td colspan="5">No medicines added.</td></tr>'}</tbody>
          </table>
        </div>
      </body>
    </html>
  `);

  printableWindow.document.close();
  printableWindow.focus();
  printableWindow.print();
};
