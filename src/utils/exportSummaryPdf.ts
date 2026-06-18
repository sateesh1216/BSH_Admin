import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';

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

interface Trip {
  date: string;
  driver_name: string;
  customer_name: string;
  from_location: string;
  to_location: string;
  company: string;
  payment_mode: string;
  payment_status: string;
  driver_amount: number;
  commission: number;
  fuel_amount: number;
  tolls: number;
  trip_amount: number;
  profit: number;
}

interface Maintenance {
  date: string;
  vehicle_number: string;
  driver_name: string;
  maintenance_type: string;
  description: string | null;
  payment_mode: string;
  amount: number;
}

interface OutsideVehicleTrip {
  date: string;
  driver_name: string;
  travel_company: string;
  vehicle_type: string;
  from_location: string;
  to_location: string;
  vehicle_number: string;
  trip_given_company: string;
  payment_mode: string;
  payment_status: string;
  trip_amount: number;
}

const rupee = (n: number) =>
  'Rs. ' +
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d: string) => {
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
};

const drawHeader = (doc: jsPDF, subtitle: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BSH Taxi Service', 14, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(subtitle, 14, 18);
  doc.setTextColor(0, 0, 0);
};

const drawFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'BSH Taxi Service, Palanati Colony, Kancharapelam, Vizag',
      pageWidth / 2, pageHeight - 8, { align: 'center' }
    );
    doc.text(`Page ${i} of ${total}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
};

export function exportSummaryPdf(
  data: SummaryExportData,
  periodLabel: string,
  trips: Trip[] = [],
  outsideTrips: OutsideVehicleTrip[] = [],
  maintenance: Maintenance[] = []
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ============ PAGE 1: SUMMARY ============
  drawHeader(doc, 'Summary Report (All amounts in Indian Rupees)');
  doc.setFontSize(10);
  doc.text(`Period: ${periodLabel}`, 14, 32);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 38);

  let y = 46;
  const section = (title: string, color: [number, number, number], rows: [string, string][]) => {
    autoTable(doc, {
      startY: y,
      head: [[{ content: title, colSpan: 2, styles: { fillColor: color, textColor: 255, fontStyle: 'bold', fontSize: 12, halign: 'left' } }]],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [245, 245, 250], cellWidth: 90 },
        1: { halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });
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
  section('GRAND TOTALS', [16, 122, 87], [
    ['Total Money In', rupee(data.totalTripMoney + data.totalOutsideVehicleMoney)],
    ['Total Expenses', rupee(data.totalExpenses)],
    ['Net Profit', rupee(data.totalProfit)],
  ]);

  // ============ PAGE 2+: TRIPS DETAIL ============
  if (trips.length > 0) {
    doc.addPage();
    drawHeader(doc, `Trips Detail - ${periodLabel} (${trips.length} records)`);
    autoTable(doc, {
      startY: 32,
      head: [['Date', 'Driver', 'Customer', 'Route', 'Company', 'Pay', 'Status', 'Amount', 'Profit']],
      body: trips.map(t => [
        fmtDate(t.date),
        t.driver_name,
        t.customer_name,
        `${t.from_location} -> ${t.to_location}`,
        t.company,
        t.payment_mode,
        t.payment_status,
        rupee(t.trip_amount),
        rupee(t.profit),
      ]),
      foot: [[
        { content: 'TOTALS', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } },
        rupee(trips.reduce((s, t) => s + t.trip_amount, 0)),
        rupee(trips.reduce((s, t) => s + t.profit, 0)),
      ]],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9 },
      footStyles: { fillColor: [219, 234, 254], textColor: 0, fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        7: { halign: 'right' },
        8: { halign: 'right' },
      },
      margin: { left: 8, right: 8 },
    });
  }

  // ============ OUTSIDE VEHICLES DETAIL ============
  if (outsideTrips.length > 0) {
    doc.addPage();
    drawHeader(doc, `Outside Vehicle Trips - ${periodLabel} (${outsideTrips.length} records)`);
    autoTable(doc, {
      startY: 32,
      head: [['Date', 'Driver', 'Travel Co.', 'Vehicle', 'Route', 'Veh No.', 'Given By', 'Status', 'Amount']],
      body: outsideTrips.map(t => [
        fmtDate(t.date),
        t.driver_name,
        t.travel_company,
        t.vehicle_type,
        `${t.from_location} -> ${t.to_location}`,
        t.vehicle_number,
        t.trip_given_company,
        t.payment_status,
        rupee(t.trip_amount),
      ]),
      foot: [[
        { content: 'TOTAL', colSpan: 8, styles: { halign: 'right', fontStyle: 'bold' } },
        rupee(outsideTrips.reduce((s, t) => s + t.trip_amount, 0)),
      ]],
      theme: 'striped',
      headStyles: { fillColor: [147, 51, 234], textColor: 255, fontSize: 9 },
      footStyles: { fillColor: [243, 232, 255], textColor: 0, fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 8: { halign: 'right' } },
      margin: { left: 8, right: 8 },
    });
  }

  // ============ MAINTENANCE DETAIL ============
  if (maintenance.length > 0) {
    doc.addPage();
    drawHeader(doc, `Maintenance Records - ${periodLabel} (${maintenance.length} records)`);
    autoTable(doc, {
      startY: 32,
      head: [['Date', 'Vehicle', 'Driver', 'Type', 'Description', 'Payment', 'Amount']],
      body: maintenance.map(m => [
        fmtDate(m.date),
        m.vehicle_number,
        m.driver_name,
        m.maintenance_type,
        m.description || '-',
        m.payment_mode,
        rupee(m.amount),
      ]),
      foot: [[
        { content: 'TOTAL', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
        rupee(maintenance.reduce((s, m) => s + m.amount, 0)),
      ]],
      theme: 'striped',
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontSize: 9 },
      footStyles: { fillColor: [254, 215, 170], textColor: 0, fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 6: { halign: 'right' } },
      margin: { left: 8, right: 8 },
    });
  }

  drawFooter(doc);
  doc.save(`BSH_Summary_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
}
