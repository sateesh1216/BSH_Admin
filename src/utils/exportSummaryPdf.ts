import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface SummaryExportData {
  totalTrips: number;
  totalTripMoney: number;
  totalExpenses: number;
  totalProfit: number;
  totalMaintenance: number;
  maintenanceExpenses: number;
  totalOutsideVehicleTrips: number;
  totalOutsideVehicleMoney: number;
  pendingOutsideVehicleMoney: number;
}

const rupee = (n: number) =>
  'Rs. ' +
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

export function exportSummaryPdf(data: SummaryExportData, periodLabel: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('BSH Taxi Service', 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Summary Report (All amounts in Indian Rupees)', 14, 20);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Period: ${periodLabel}`, 14, 36);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 42);

  let y = 50;

  const section = (title: string, color: [number, number, number], rows: [string, string][]) => {
    autoTable(doc, {
      startY: y,
      head: [[{ content: title, colSpan: 2, styles: { fillColor: color, textColor: 255, fontStyle: 'bold', fontSize: 12, halign: 'left' } }]],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [245, 245, 250], cellWidth: 90 },
        1: { halign: 'right', cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    });
    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 8;
  };

  section('TRIPS', [37, 99, 235], [
    ['Total Trips', String(data.totalTrips)],
    ['Total Trip Money', rupee(data.totalTripMoney)],
    ['Total Expenses', rupee(data.totalExpenses)],
    ['Total Profit', rupee(data.totalProfit)],
  ]);

  section('OUTSIDE VEHICLES', [147, 51, 234], [
    ['Outside Vehicle Trips', String(data.totalOutsideVehicleTrips)],
    ['Outside Vehicle Amount', rupee(data.totalOutsideVehicleMoney)],
    ['Outside Pending Amount', rupee(data.pendingOutsideVehicleMoney)],
  ]);

  section('MAINTENANCE', [234, 88, 12], [
    ['Total Maintenance Records', String(data.totalMaintenance)],
    ['Maintenance Expenses', rupee(data.maintenanceExpenses)],
  ]);

  // Grand totals
  const grandIn = data.totalTripMoney + data.totalOutsideVehicleMoney;
  section('GRAND TOTALS', [16, 122, 87], [
    ['Total Money In', rupee(grandIn)],
    ['Total Expenses', rupee(data.totalExpenses)],
    ['Net Profit', rupee(data.totalProfit)],
  ]);

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'BSH Taxi Service, Palanati Colony, Kancharapelam, Vizag',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  doc.save(`BSH_Summary_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
}
