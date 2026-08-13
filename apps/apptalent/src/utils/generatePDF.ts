import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generateCompCardPDF = async (elementId: string, talentName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return alert('Elemen Comp Card tidak ditemukan!');

  try {
    // Sembunyikan elemen lain sementara agar render lebih cepat dan fokus (opsional)
    element.style.display = 'block';

    const canvas = await html2canvas(element, {
      scale: 2, // Kualitas HD
      useCORS: true, // Izinkan memuat gambar dari Cloudflare R2
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // Ukuran A4 standar (210 x 297 mm)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`CompCard_${talentName.replace(/\s+/g, '_')}_Orland.pdf`);

    // Kembalikan elemen ke keadaan semula jika tadinya disembunyikan
    element.style.display = 'none';
    
    return true;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    alert('Gagal membuat PDF. Pastikan foto sudah ter-load sempurna.');
    return false;
  }
};
