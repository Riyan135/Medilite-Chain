import api from '../api/api';

const getFileName = (consultation) => {
  const patientName = consultation.patient?.name || 'Patient';
  return `MediLite-Prescription-${patientName.replace(/[^a-z0-9]+/gi, '-')}.pdf`;
};

export const downloadPrescriptionPdf = async (consultation) => {
  if (typeof window === 'undefined' || !consultation?.id) {
    return;
  }

  const response = await api.get(`/consultations/${consultation.id}/prescription.pdf`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = getFileName(consultation);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
