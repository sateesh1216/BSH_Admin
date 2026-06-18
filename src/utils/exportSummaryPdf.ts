import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import bshLogo from '@/assets/bsh-logo.png';

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

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch(bshLogo);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const BRAND = [15, 23, 42] as [number, number, number];          // slate-900
const ACCENT = [234, 179, 8] as [number, number, number];        // amber-500
const TRIPS_COLOR = [37, 99, 235] as [number, number, number];
const OUTSIDE_COLOR = [147, 51, 234] as [number, number, number];
const MAINT_COLOR = [234, 88, 12] as [number, number, number];
const PROFIT_COLOR = [16, 122, 87] as [number, number, number];

const drawHeader = (doc: jsPDF, subtitle: string, logo: string | null) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  // Main band
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, 30, 'F');
  // Accent stripe
  doc.setFillColor(...ACCENT);
  doc.rect(0, 30, pageWidth, 1.5, 'F');

  // Logo
  if (logo) {
    try { doc.addImage(logo, 'PNG', 12, 5, 20, 20); } catch { /* ignore */ }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('BSH Taxi Service', 36, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Palanati Colony, Kancharapelam, Vizag', 36, 19);
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(subtitle, 36, 25);

  doc.setTextColor(0, 0, 0);
};

const drawFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('BSH Taxi Service - Confidential Financial Report', 14, pageHeight - 6);
    doc.text(`Page ${i} of ${total}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
  }
};

// Draw 4 KPI boxes
const drawKpiCards = (
  doc: jsPDF,
  y: number,
  cards: { label: string; value: string; color: [number, number, number] }[]
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 4;
  const cardW = (pageWidth - margin * 2 - gap * (cards.length - 1)) / cards.length;
  const cardH = 22;

  cards.forEach((c, i) => {
    const x = margin + i * (cardW + gap);
    // background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F');
    // left accent bar
    doc.setFillColor(...c.color);
    doc.roundedRect(x, y, 2, cardH, 1, 1, 'F');
    // label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(c.label.toUpperCase(), x + 6, y + 7);
    // value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...c.color);
    doc.text(c.value, x + 6, y + 16);
  });
  doc.setTextColor(0, 0, 0);
  return y + cardH + 6;
};

const sectionTitle = (doc: jsPDF, y: number, text: string, color: [number, number, number]) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...color);
  doc.roundedRect(14, y, pageWidth - 28, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(text, 18, y + 5.5);
  doc.setTextColor(0, 0, 0);
  return y + 11;
};

export async function exportSummaryPdf(
  data: SummaryExportData,
  periodLabel: string,
  trips: Trip[] = [],
  outsideTrips: OutsideVehicleTrip[] = [],
  maintenance: Maintenance[] = []
) {
  const doc = new jsPDF();
  const logo = await loadLogo();

  // ============ PAGE 1 — SUMMARY ============
  drawHeader(doc, `Summary Report - ${periodLabel}`, logo);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 40);
  doc.text('All amounts in Indian Rupees (INR)', doc.internal.pageSize.getWidth() - 14, 40, { align: 'right' });

  let y = 48;

  // KPI Row 1 - main
  y = drawKpiCards(doc, y, [
    { label: 'Total Trips', value: String(data.totalTrips), color: TRIPS_COLOR },
    { label: 'Trip Money', value: rupee(data.totalTripMoney), color: TRIPS_COLOR },
    { label: 'Total Expenses', value: rupee(data.totalExpenses), color: MAINT_COLOR },
    { label: 'Net Profit', value: rupee(data.totalProfit), color: PROFIT_COLOR },
  ]);

  // KPI Row 2 - outside
  y = drawKpiCards(doc, y, [
    { label: 'Outside Trips', value: String(data.totalOutsideVehicleTrips), color: OUTSIDE_COLOR },
    { label: 'Outside Amount', value: rupee(data.totalOutsideVehicleMoney), color: OUTSIDE_COLOR },
    { label: 'Outside Pending', value: rupee(data.pendingOutsideVehicleMoney), color: [220, 38, 38] },
    { label: 'Maintenance', value: rupee(data.maintenanceExpenses), color: MAINT_COLOR },
  ]);

  // Breakdown table
  y = sectionTitle(doc, y + 2, 'FINANCIAL BREAKDOWN', BRAND);
  autoTable(doc, {
    startY: y,
    head: [['Category', 'Count', 'Amount']],
    body: [
      ['Trips Revenue', String(data.totalTrips), rupee(data.totalTripMoney)],
      ['Outside Vehicle Revenue', String(data.totalOutsideVehicleTrips), rupee(data.totalOutsideVehicleMoney)],
      ['Maintenance Expense', String(data.totalMaintenance), rupee(data.maintenanceExpenses)],
      ['Total Expenses (incl. trip costs)', '-', rupee(data.totalExpenses)],
      ['Outside Pending Payments', '-', rupee(data.pendingOutsideVehicleMoney)],
    ],
    foot: [['NET PROFIT', '', rupee(data.totalProfit)]],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: 30, fontStyle: 'bold', fontSize: 10 },
    footStyles: { fillColor: PROFIT_COLOR, textColor: 255, fontStyle: 'bold', fontSize: 11 },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  });

  // ============ TRIPS DETAIL ============
  if (trips.length > 0) {
    doc.addPage();
    drawHeader(doc, `Trips Detail (${trips.length} records)`, logo);
    sectionTitle(doc, 38, 'TRIPS RECORDS', TRIPS_COLOR);
    autoTable(doc, {
      startY: 50,
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
      headStyles: { fillColor: TRIPS_COLOR, textColor: 255, fontSize: 9 },
      footStyles: { fillColor: [219, 234, 254], textColor: 0, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: { 7: { halign: 'right' }, 8: { halign: 'right' } },
      margin: { left: 8, right: 8 },
    });
  }

  // ============ OUTSIDE VEHICLES DETAIL ============
  if (outsideTrips.length > 0) {
    doc.addPage();
    drawHeader(doc, `Outside Vehicle Trips (${outsideTrips.length} records)`, logo);
    sectionTitle(doc, 38, 'OUTSIDE VEHICLE RECORDS', OUTSIDE_COLOR);
    autoTable(doc, {
      startY: 50,
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
      headStyles: { fillColor: OUTSIDE_COLOR, textColor: 255, fontSize: 9 },
      footStyles: { fillColor: [243, 232, 255], textColor: 0, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [250, 245, 255] },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: { 8: { halign: 'right' } },
      margin: { left: 8, right: 8 },
    });
  }

  // ============ MAINTENANCE DETAIL ============
  if (maintenance.length > 0) {
    doc.addPage();
    drawHeader(doc, `Maintenance Records (${maintenance.length} records)`, logo);
    sectionTitle(doc, 38, 'MAINTENANCE RECORDS', MAINT_COLOR);
    autoTable(doc, {
      startY: 50,
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
      headStyles: { fillColor: MAINT_COLOR, textColor: 255, fontSize: 9 },
      footStyles: { fillColor: [254, 215, 170], textColor: 0, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [255, 247, 237] },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: { 6: { halign: 'right' } },
      margin: { left: 8, right: 8 },
    });
  }

  drawFooter(doc);
  doc.save(`BSH_Summary_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
}
