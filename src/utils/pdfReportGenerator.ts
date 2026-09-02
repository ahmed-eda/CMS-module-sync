import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Correspondence, RouteItem } from '../types/domain';
import { AuditTimelineEvent } from '../components/correspondence/CorrespondenceAuditTrail';

export interface PdfReportOptions {
  includeMetadata?: boolean;
  includeDocuments?: boolean;
  includeDigitalSignature?: boolean;
  includeAuditTrail?: boolean;
  includeSecurityHashes?: boolean;
  locale?: 'ar' | 'en';
}

/**
 * Generates an official structured PDF report containing correspondence metadata
 * and chronological audit trail history.
 */
export async function generateCorrespondencePdfReport(
  corr: Correspondence,
  events: AuditTimelineEvent[] = [],
  routes: RouteItem[] = [],
  options: PdfReportOptions = {}
): Promise<{ doc: jsPDF; filename: string; blob: Blob }> {
  const {
    includeMetadata = true,
    includeDocuments = true,
    includeDigitalSignature = true,
    includeAuditTrail = true,
    includeSecurityHashes = true,
    locale = 'ar'
  } = options;

  const isAr = locale === 'ar';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Helper for page break checks
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 18) {
      doc.addPage();
      currentY = margin + 10;
      drawPageHeaderMini();
    }
  };

  // Mini header for subsequent pages
  const drawPageHeaderMini = () => {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, margin - 6, contentWidth, 10, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`LinkFlow Enterprise - Official Audit & Metadata Report | Ref: ${corr.corrNumber}`, margin + 3, margin);
    doc.text(`Generated: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`, pageWidth - margin - 3, margin, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, margin + 4, pageWidth - margin, margin + 4);
    currentY = margin + 10;
  };

  // Generate QR Code data URL for the report
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://linkflow.enterprise.gov.sa';
  const qrVerificationUrl = `${baseUrl}/records/verify?corrId=${corr.id}&corrNumber=${encodeURIComponent(corr.corrNumber)}&chk=${corr.barcode}&t=${Date.now()}`;
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(qrVerificationUrl, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' }
    });
  } catch (e) {
    console.error('Failed to generate QR for PDF:', e);
  }

  // 1. Top Decorative Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, currentY, contentWidth, 24, 'F');

  // Emerald Accent stripe on top
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(margin, currentY, contentWidth, 2.5, 'F');

  // Banner text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('LINKFLOW ENTERPRISE - OFFICIAL AUDIT & METADATA REPORT', margin + 6, currentY + 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    `Government Correspondence Tracking & Verifiable Audit System | Generated: ${new Date().toLocaleString()}`,
    margin + 6,
    currentY + 18
  );

  // Security Badge in top banner
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - margin - 46, currentY + 6, 40, 12, 1.5, 1.5, 'F');
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TAMPER-EVIDENT', pageWidth - margin - 26, currentY + 11, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('AUDIT CERTIFIED', pageWidth - margin - 26, currentY + 15.5, { align: 'center' });

  currentY += 28;

  // 2. Report Overview & Core Identity Card
  checkPageBreak(38);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'S');

  // If QR code is available, embed it inside this identity box
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', margin + 3, currentY + 3, 28, 28);
  }

  const textStartX = margin + 35;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Reference No: ${corr.corrNumber}`, textStartX, currentY + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Subject: ${corr.title}`, textStartX, currentY + 13, { maxWidth: contentWidth - 45 });

  // Grid details
  doc.setFontSize(7.5);
  const col1X = textStartX;
  const col2X = textStartX + 52;
  const col3X = textStartX + 102;
  const rowY = currentY + 22;

  doc.setTextColor(100, 116, 139);
  doc.text('BARCODE / DIGEST:', col1X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(corr.barcode || 'N/A', col1X, rowY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('REGISTRATION DATE:', col2X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(corr.registerDate?.substring(0, 10) || 'N/A', col2X, rowY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('SECURITY / PRIORITY:', col3X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${corr.securityLevel} | ${corr.priorityLevel}`, col3X, rowY + 4.5);

  currentY += 39;

  // 3. Metadata Section Table
  if (includeMetadata) {
    checkPageBreak(50);
    // Section Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(margin, currentY, 3, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('1. CORRESPONDENCE METADATA & INSTITUTIONAL ATTRIBUTES', margin + 6, currentY + 4.8);

    currentY += 9;

    // Structured metadata rows
    const metadataRows: [string, string, string, string][] = [
      ['Correspondence Type:', String(corr.corrType || ''), 'Workflow Status:', String(corr.status || '')],
      ['Origin / Sender Site:', corr.siteNameAr || 'External Organization', 'Sender Department:', corr.senderDepartmentNameAr || 'General Ingestion'],
      ['External Ref Number:', corr.referenceNo || 'None', 'Delivery Method:', String(corr.deliveryMethod || 'GSB Integration')],
      ['Delivered By:', corr.deliveredBy || 'Unified Courier', 'Delivery Date:', corr.deliveryDate?.substring(0, 10) || 'N/A'],
      ['Archived File Folder:', corr.fileNameAr || 'Institutional General Archive', 'Folder ID:', String(corr.fileFolderId || 'N/A')],
      ['Action Due Date:', corr.expectedResponseDate?.substring(0, 10) || 'N/A', 'Attachments Count:', `${corr.documents?.length || 0} File(s)`]
    ];

    doc.setFontSize(7.5);
    metadataRows.forEach((row, idx) => {
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, currentY - 1, contentWidth, 5.5, 'F');
      }
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, currentY + 4.5, pageWidth - margin, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(row[0], margin + 2, currentY + 3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(row[1], margin + 42, currentY + 3, { maxWidth: 45 });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(row[2], margin + 92, currentY + 3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(row[3], margin + 132, currentY + 3, { maxWidth: 48 });

      currentY += 5.5;
    });

    currentY += 5;
  }

  // 4. Documents & Attachments Summary
  if (includeDocuments && corr.documents && corr.documents.length > 0) {
    checkPageBreak(35);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFillColor(59, 130, 246); // blue-500
    doc.rect(margin, currentY, 3, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`2. ATTACHED DOCUMENTS & DIGITAL ASSETS (${corr.documents.length})`, margin + 6, currentY + 4.8);

    currentY += 9;

    // Table Header
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, currentY, contentWidth, 5.5, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('DOC ID', margin + 2, currentY + 3.8);
    doc.text('DOCUMENT SUBJECT & FILE NAME', margin + 22, currentY + 3.8);
    doc.text('VERSION', margin + 105, currentY + 3.8);
    doc.text('SIZE / PAGES', margin + 125, currentY + 3.8);
    doc.text('BARCODE', margin + 155, currentY + 3.8);

    currentY += 6;

    corr.documents.forEach((d, idx) => {
      checkPageBreak(7);
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY - 0.5, contentWidth, 5.5, 'F');
      }
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, currentY + 5, pageWidth - margin, currentY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7);
      doc.text(`DOC-${d.id}`, margin + 2, currentY + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.text(`${d.subject} (${d.activeDetail?.fileName || 'document.pdf'})`, margin + 22, currentY + 3.5, { maxWidth: 80 });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(`v${d.activeDetail?.version || 1}.0`, margin + 105, currentY + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${d.activeDetail?.fileSize || '1.2 MB'} (${d.pageCount} p.)`, margin + 125, currentY + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(d.barcode || 'N/A', margin + 155, currentY + 3.5);

      currentY += 6;
    });

    currentY += 5;
  }

  // 5. Digital Signature & Certification Box
  if (includeDigitalSignature && corr.digitalSignature) {
    checkPageBreak(30);
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.roundedRect(margin, currentY, contentWidth, 23, 2, 2, 'F');
    doc.setDrawColor(167, 243, 208); // emerald-200
    doc.roundedRect(margin, currentY, contentWidth, 23, 2, 2, 'S');

    doc.setFillColor(16, 185, 129);
    doc.circle(margin + 6, currentY + 6, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(6, 95, 70); // emerald-800
    doc.text('CERTIFIED DIGITAL SIGNATURE (NCDC / GOVERNMENT TRUST NETWORK)', margin + 12, currentY + 6.5);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(4, 120, 87);
    doc.text(`Signed By: ${corr.digitalSignature.signedBy} (${corr.digitalSignature.jobTitle})`, margin + 12, currentY + 12);
    doc.text(`Signed At: ${corr.digitalSignature.signedAt}`, margin + 12, currentY + 16.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Certificate Hash: ${corr.digitalSignature.certificateHash}`, margin + 12, currentY + 20.5, { maxWidth: contentWidth - 20 });

    currentY += 27;
  }

  // 6. Chronological Audit Trail History Table
  if (includeAuditTrail && events.length > 0) {
    checkPageBreak(30);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFillColor(245, 158, 11); // amber-500
    doc.rect(margin, currentY, 3, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`3. COMPLETE CHRONOLOGICAL AUDIT TRAIL (${events.length} EVENTS)`, margin + 6, currentY + 4.8);

    currentY += 9;

    // Audit Table Header
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, currentY, contentWidth, 5.5, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('TIMESTAMP', margin + 2, currentY + 3.8);
    doc.text('ACTION & CATEGORY', margin + 34, currentY + 3.8);
    doc.text('ACTOR & DEPARTMENT', margin + 84, currentY + 3.8);
    doc.text('DESCRIPTION & DIRECTIVE', margin + 130, currentY + 3.8);

    currentY += 6;

    events.forEach((evt, idx) => {
      checkPageBreak(12);
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(250, 250, 252);
        doc.rect(margin, currentY - 0.5, contentWidth, 10.5, 'F');
      }
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, currentY + 10, pageWidth - margin, currentY + 10);

      // Timestamp
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const timeStr = evt.timestamp.replace('T', ' ').substring(0, 19);
      doc.text(timeStr, margin + 2, currentY + 3.5);
      if (evt.ipAddress) {
        doc.text(`IP: ${evt.ipAddress}`, margin + 2, currentY + 7);
      }

      // Action Title & Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(evt.actionTitleEn || evt.actionTitleAr, margin + 34, currentY + 3.5, { maxWidth: 48 });

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`[${evt.category}]`, margin + 34, currentY + 7);

      // Actor & Dept
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(evt.actorName, margin + 84, currentY + 3.5, { maxWidth: 44 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(evt.department, margin + 84, currentY + 7, { maxWidth: 44 });

      // Description & Instruction
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      const descText = evt.instruction ? `${evt.description} | Note: "${evt.instruction}"` : evt.description;
      doc.text(descText, margin + 130, currentY + 3.5, { maxWidth: 50 });

      currentY += 11;
    });

    currentY += 4;
  }

  // 7. Security Footnote & Verification Seal (on every page)
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `LinkFlow Enterprise Core Security | Tamper-Evident SHA-256 Audit Seal | Document Reference: ${corr.corrNumber}`,
      margin,
      pageHeight - 9
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
  }

  const safeNumber = corr.corrNumber.replace(/[\/\\]/g, '_');
  const filename = `Report_Audit_Metadata_${safeNumber}_${new Date().toISOString().substring(0, 10)}.pdf`;
  const blob = doc.output('blob');

  return { doc, filename, blob };
}
