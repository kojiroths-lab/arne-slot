import { jsPDF } from 'jspdf';

interface InvoiceData {
  salonName: string;
  date: string;
  weight: number;
  amount: number;
}

export const generateInvoice = ({ salonName, date, weight, amount }: InvoiceData) => {
  const doc = new jsPDF();
  
  // Header Background
  doc.setFillColor(4, 120, 87);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Logo/Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOR', 20, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Circular Economy Waste Management', 20, 38);
  
  // Invoice Label
  doc.setFontSize(12);
  doc.text('INVOICE', 170, 25);
  doc.setFontSize(10);
  doc.text(`Date: ${date}`, 155, 35);
  
  // Body
  doc.setTextColor(31, 41, 55);
  
  // Salon Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(salonName, 20, 80);
  
  // Line Items Table
  const tableTop = 100;
  
  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, tableTop - 7, 170, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 25, tableTop);
  doc.text('Quantity', 100, tableTop);
  doc.text('Rate', 135, tableTop);
  doc.text('Amount', 165, tableTop);
  
  // Table Row
  doc.setFont('helvetica', 'normal');
  const rowY = tableTop + 15;
  doc.text('Hair Waste Collection', 25, rowY);
  doc.text(`${weight} Kg`, 100, rowY);
  doc.text('BDT 20/Kg', 135, rowY);
  doc.text(`BDT ${amount}`, 165, rowY);
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(20, rowY + 10, 190, rowY + 10);
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Total:', 135, rowY + 25);
  doc.setTextColor(4, 120, 87);
  doc.text(`BDT ${amount}`, 165, rowY + 25);
  
  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const footerY = 260;
  doc.text('Thank you for contributing to a greener future!', 105, footerY, { align: 'center' });
  doc.text('AMOR - Transforming Waste into Value', 105, footerY + 8, { align: 'center' });
  
  // Green footer line
  doc.setFillColor(4, 120, 87);
  doc.rect(0, 285, 210, 12, 'F');
  
  // Save
  doc.save(`AMOR_Invoice_${date}_${salonName.replace(/\s+/g, '_')}.pdf`);
};
