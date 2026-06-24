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

interface MonthlyBreakdownEntry {
  monthLabel: string;
  totalTrips: number;
  totalTripMoney: number;
  maintenanceExpenses: number;
  totalOutsideVehicleTrips: number;
  totalOutsideVehicleMoney: number;
}

const rupee = (n: number) =>
  'Rs. ' +
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d: string) => {
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
};


// Theme: deep navy primary (#001D39)
const BRAND = [0, 29, 57] as [number, number, number];           // navy primary
const BRAND_DARK = [0, 15, 30] as [number, number, number];      // darker navy
const ACCENT = [234, 179, 8] as [number, number, number];        // amber-500 accent stripe
// Elegant platinum-cool palette for section headers
const TRIPS_COLOR = [30, 58, 95] as [number, number, number];     // cool deep navy-blue
const OUTSIDE_COLOR = [37, 99, 122] as [number, number, number];  // cool teal-cyan
const MAINT_COLOR = [76, 59, 122] as [number, number, number];    // cool indigo-violet
const PROFIT_COLOR = [16, 122, 87] as [number, number, number];

// Header palette — deep navy band; white text for high contrast
const HEADER_BG = BRAND;
const HEADER_BORDER = [226, 232, 240] as [number, number, number]; // slate-200

const drawHeader = (doc: jsPDF, subtitle: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  // Green header band
  doc.setFillColor(...HEADER_BG);
  doc.rect(0, 0, pageWidth, 32, 'F');
  // Amber accent ribbon
  doc.setFillColor(...ACCENT);
  doc.rect(0, 32, pageWidth, 1.4, 'F');
  // Deep green stripe
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 33.4, pageWidth, 0.8, 'F');

  // Title block — white for contrast on navy, aligned with content margin
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('BSH Taxi Service', 14, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Palanati Colony, Kancharapelam, Vizag', 14, 19);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(subtitle, 14, 26);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
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

// Continuation header — same layout, but different subtitle on extra pages
const drawContinuationHeader = (doc: jsPDF, subtitle: string) => {
  drawHeader(doc, subtitle);
};

export function exportSummaryPdf(
  data: SummaryExportData,
  periodLabel: string,
  trips: Trip[] = [],
  outsideTrips: OutsideVehicleTrip[] = [],
  maintenance: Maintenance[] = [],
  monthlyBreakdown: MonthlyBreakdownEntry[] = []
) {
  const doc = new jsPDF();

  // ============ PAGE 1 — SUMMARY ONLY ============
  drawHeader(doc, `Summary Report - ${periodLabel}`);

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

  // Helper to get Y after last table
  const getY = () => (doc as any).lastAutoTable?.finalY ?? y;

  // Helper: start a detail section on a fresh page if needed
  const startDetailPage = (subtitle: string): number => {
    doc.addPage();
    drawContinuationHeader(doc, subtitle);
    return 40;
  };

  // ============ PAGE 2+ — DETAIL TABLES ============

  // MONTHLY BREAKDOWN (own page)
  if (monthlyBreakdown.length > 0) {
    const startY = startDetailPage(`Monthly Breakdown (${monthlyBreakdown.length} months)`);
    const afterTitle = sectionTitle(doc, startY, `MONTHLY BREAKDOWN (${monthlyBreakdown.length})`, BRAND);
    autoTable(doc, {
      startY: afterTitle,
      head: [['Month', 'Trips', 'Trip Money', 'Outside', 'Outside Amt', 'Maintenance', 'Net Profit']],
      body: monthlyBreakdown.map(m => [
        m.monthLabel,
        String(m.totalTrips),
        rupee(m.totalTripMoney),
        String(m.totalOutsideVehicleTrips),
        rupee(m.totalOutsideVehicleMoney),
        rupee(m.maintenanceExpenses),
        rupee(m.totalTripMoney - m.maintenanceExpenses),
      ]),
      foot: [[
        'TOTAL',
        String(monthlyBreakdown.reduce((s, m) => s + m.totalTrips, 0)),
        rupee(monthlyBreakdown.reduce((s, m) => s + m.totalTripMoney, 0)),
        String(monthlyBreakdown.reduce((s, m) => s + m.totalOutsideVehicleTrips, 0)),
        rupee(monthlyBreakdown.reduce((s, m) => s + m.totalOutsideVehicleMoney, 0)),
        rupee(monthlyBreakdown.reduce((s, m) => s + m.maintenanceExpenses, 0)),
        rupee(monthlyBreakdown.reduce((s, m) => s + (m.totalTripMoney - m.maintenanceExpenses), 0)),
      ]],
      theme: 'striped',
      headStyles: { fillColor: BRAND, textColor: 255, fontSize: 9, fontStyle: 'bold' },
      footStyles: { fillColor: PROFIT_COLOR, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold', textColor: PROFIT_COLOR as any },
      },
      margin: { left: 14, right: 14 },
      showFoot: 'lastPage',
      didDrawPage: (d: any) => {
        if (d.pageNumber > 1) drawContinuationHeader(doc, `Monthly Breakdown (continued)`);
      },
    });
  }


  // TRIPS DETAIL
  if (trips.length > 0) {
    const startY = startDetailPage(`Trips Detail (${trips.length} records)`);
    const afterTitle = sectionTitle(doc, startY, `TRIPS RECORDS (${trips.length})`, TRIPS_COLOR);
    autoTable(doc, {
      startY: afterTitle,
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
      headStyles: { fillColor: TRIPS_COLOR, textColor: 255, fontSize: 9, halign: 'left', cellPadding: 3 },
      footStyles: { fillColor: [224, 230, 236], textColor: 0, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [244, 246, 248] },
      styles: { fontSize: 8, cellPadding: 3, minCellHeight: 8, valign: 'middle', overflow: 'linebreak' },
      columnStyles: { 7: { halign: 'right' }, 8: { halign: 'right' } },
      margin: { left: 10, right: 10, top: 40 },
      showFoot: 'lastPage',
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      didDrawPage: (d: any) => {
        if (d.pageNumber > 1) drawContinuationHeader(doc, `Trips Detail (continued)`);
      },
    });
  }

  // OUTSIDE VEHICLES DETAIL
  if (outsideTrips.length > 0) {
    const currentY = getY();
    const pageH = doc.internal.pageSize.getHeight();
    const needsNewPage = currentY + 40 > pageH - 18;
    const startY = needsNewPage
      ? startDetailPage(`Outside Vehicle Trips (${outsideTrips.length} records)`)
      : currentY + 10;
    const afterTitle = sectionTitle(doc, startY, `OUTSIDE VEHICLE RECORDS (${outsideTrips.length})`, OUTSIDE_COLOR);
    autoTable(doc, {
      startY: afterTitle,
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
      headStyles: { fillColor: OUTSIDE_COLOR, textColor: 255, fontSize: 9, halign: 'left', cellPadding: 3 },
      footStyles: { fillColor: [232, 235, 238], textColor: 0, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [246, 248, 250] },
      styles: { fontSize: 8, cellPadding: 3, minCellHeight: 8, valign: 'middle', overflow: 'linebreak' },
      columnStyles: { 8: { halign: 'right' } },
      margin: { left: 10, right: 10, top: 40 },
      showFoot: 'lastPage',
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      didDrawPage: (d: any) => {
        if (d.pageNumber > 1) drawContinuationHeader(doc, `Outside Vehicle Trips (continued)`);
      },
    });
  }

  // MAINTENANCE DETAIL
  if (maintenance.length > 0) {
    const currentY = getY();
    const pageH = doc.internal.pageSize.getHeight();
    const needsNewPage = currentY + 40 > pageH - 18;
    const startY = needsNewPage
      ? startDetailPage(`Maintenance Records (${maintenance.length} records)`)
      : currentY + 10;
    const afterTitle = sectionTitle(doc, startY, `MAINTENANCE RECORDS (${maintenance.length})`, MAINT_COLOR);
    autoTable(doc, {
      startY: afterTitle,
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
      headStyles: { fillColor: MAINT_COLOR, textColor: 255, fontSize: 9, halign: 'left', cellPadding: 3 },
      footStyles: { fillColor: [236, 238, 240], textColor: 0, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      styles: { fontSize: 8, cellPadding: 3, minCellHeight: 8, valign: 'middle', overflow: 'linebreak' },
      columnStyles: { 6: { halign: 'right' } },
      margin: { left: 10, right: 10, top: 40 },
      showFoot: 'lastPage',
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      didDrawPage: (d: any) => {
        if (d.pageNumber > 1) drawContinuationHeader(doc, `Maintenance Records (continued)`);
      },
    });
  }

  drawFooter(doc);

  // Build a clean, descriptive filename. Examples:
  //   BSH_Taxi_Summary_June_2025_2025-06-22_1430.pdf
  //   BSH_Taxi_Summary_All_Time_2025-06-22_1430.pdf
  const safeLabel = periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
  const fileName = `BSH_Taxi_Summary_${safeLabel}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;

  // Direct download — no preview popup
  doc.save(fileName);
}
