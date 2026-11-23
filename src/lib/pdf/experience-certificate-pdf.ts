import { jsPDF } from "jspdf/dist/jspdf.umd.min.js";
import { UNADE_LOGO_BASE64 } from "./unade-logo-base64";

export interface ExperienceCertificateData {
  participantName: string;
  participantEmail: string;
  participantId: string;
  pretestScore?: number;
  pretestPercentage?: number;
  posttestScore?: number;
  posttestPercentage?: number;
  completionDate: string;
  verificationHash: string;
}

/**
 * Generates an official, high-prestige Landscape Diploma / Academic Certificate
 * for students who successfully pass both the Pretest and Posttest in the GAMMA
 * Physics & Digital Twins Metaverse experience (UNADE & Universidad de la Amazonia).
 */
export function generateExperienceCertificatePdf(data: ExperienceCertificateData): jsPDF {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  // ─── 1. Decorative Double Border (Institutional Emerald & Gold) ───
  // Outer Border: Emerald Green
  doc.setDrawColor(6, 78, 59); // emerald-950
  doc.setLineWidth(1.2);
  doc.rect(margin, margin, contentWidth, contentHeight);

  // Inner Border: Golden Ochre
  const innerMargin = margin + 3;
  const innerWidth = contentWidth - 6;
  const innerHeight = contentHeight - 6;
  doc.setDrawColor(217, 119, 6); // amber-600 / gold
  doc.setLineWidth(0.4);
  doc.rect(innerMargin, innerMargin, innerWidth, innerHeight);

  // Corner Accents (Triangles/Corner boxes)
  const cornerSize = 7;
  doc.setFillColor(6, 78, 59);
  // Top-left
  doc.rect(innerMargin, innerMargin, cornerSize, 1.2, "F");
  doc.rect(innerMargin, innerMargin, 1.2, cornerSize, "F");
  // Top-right
  doc.rect(innerMargin + innerWidth - cornerSize, innerMargin, cornerSize, 1.2, "F");
  doc.rect(innerMargin + innerWidth - 1.2, innerMargin, 1.2, cornerSize, "F");
  // Bottom-left
  doc.rect(innerMargin, innerMargin + innerHeight - 1.2, cornerSize, 1.2, "F");
  doc.rect(innerMargin, innerMargin + innerHeight - cornerSize, 1.2, cornerSize, "F");
  // Bottom-right
  doc.rect(innerMargin + innerWidth - cornerSize, innerMargin + innerHeight - 1.2, cornerSize, 1.2, "F");
  doc.rect(innerMargin + innerWidth - 1.2, innerMargin + innerHeight - cornerSize, 1.2, cornerSize, "F");

  // ─── 2. Top Header & Logos ─────────────────────────────────────────
  // UNADE Official Logo (Left)
  try {
    doc.addImage(UNADE_LOGO_BASE64, "PNG", innerMargin + 8, innerMargin + 6, 44, 14.8);
  } catch {
    doc.setFillColor(6, 95, 70);
    doc.roundedRect(innerMargin + 8, innerMargin + 6, 16, 16, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("UNADE", innerMargin + 16, innerMargin + 16, { align: "center" });
  }

  // Institutional Header Text (Center)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(6, 78, 59);
  doc.text("UNIVERSIDAD AMERICANA DE EUROPA (UNADE)", pageWidth / 2, innerMargin + 9, { align: "center" });
  doc.text("& UNIVERSIDAD DE LA AMAZONIA (UDLA)", pageWidth / 2, innerMargin + 13.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "PROGRAMA DE INVESTIGACIÓN EDUCATIVA EN METAVERSO Y GEMELOS DIGITALES · PILOTAJE GAMMA",
    pageWidth / 2,
    innerMargin + 17.5,
    { align: "center" }
  );

  // Status Badge (Right)
  const badgeW = 44;
  const badgeX = innerMargin + innerWidth - badgeW - 8;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(badgeX, innerMargin + 6, badgeW, 13, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(6, 95, 70);
  doc.text("CERTIFICACIÓN ACADÉMICA", badgeX + badgeW / 2, innerMargin + 11.5, { align: "center" });
  doc.setFont("courier", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`ID: ${data.verificationHash.slice(0, 14)}`, badgeX + badgeW / 2, innerMargin + 15.5, { align: "center" });

  // Thin Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(innerMargin + 8, innerMargin + 22, innerMargin + innerWidth - 8, innerMargin + 22);

  // ─── 3. Diploma Title & Formula ────────────────────────────────────
  let y = innerMargin + 31;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text("OTORGAN EL PRESENTE", pageWidth / 2, y, { align: "center" });

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("CERTIFICADO DE APROBACIÓN", pageWidth / 2, y, { align: "center" });

  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("HACEN CONSTAR QUE:", pageWidth / 2, y, { align: "center" });

  // ─── 4. Participant Name (Prominent & Elegant) ─────────────────────
  y += 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text(data.participantName.toUpperCase(), pageWidth / 2, y, { align: "center" });

  // Underline accent for participant
  const nameWidth = doc.getTextWidth(data.participantName.toUpperCase());
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - nameWidth / 2 - 4, y + 2, pageWidth / 2 + nameWidth / 2 + 4, y + 2);

  y += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Identificador de Participante: ${data.participantId}  ·  Correo: ${data.participantEmail}`,
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // ─── 5. Certification Description ──────────────────────────────────
  y += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  const certText =
    "Ha completado y aprobado satisfactoriamente todas las actividades de aprendizaje inmersivo y las evaluaciones de conocimiento correspondientes al estudio de investigación: \"PILOTAJE GAMMA: ESTUDIO EDUCATIVO DE FÍSICA MECÁNICA CON GEMELOS DIGITALES Y METAVERSO\", demostrando competencias y rigor experimental en Plano Inclinado y Riel de Newton en el Campus Virtual 3D.";
  const splitText = doc.splitTextToSize(certText, 220);
  doc.text(splitText, pageWidth / 2, y, { align: "center" });

  // ─── 6. Performance Evaluation Badges ──────────────────────────────
  y += splitText.length * 4 + 4;
  const badgeBoxW = 68;
  const badgeBoxH = 12.5;
  const badgesGap = 8;
  const totalBadgesW = badgeBoxW * 3 + badgesGap * 2;
  const startBadgesX = (pageWidth - totalBadgesW) / 2;

  // Badge 1: Pretest Approved
  const b1X = startBadgesX;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(b1X, y, badgeBoxW, badgeBoxH, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(6, 95, 70);
  doc.text("PRETEST DE FÍSICA (GAM-02)", b1X + badgeBoxW / 2, y + 4.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  const pretestPct = data.pretestPercentage !== undefined ? `${data.pretestPercentage}%` : "Aprobado";
  doc.text(`Estado: Aprobado (${pretestPct})`, b1X + badgeBoxW / 2, y + 9, { align: "center" });

  // Badge 2: Posttest Approved
  const b2X = b1X + badgeBoxW + badgesGap;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(b2X, y, badgeBoxW, badgeBoxH, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(6, 95, 70);
  doc.text("POST-TEST DE FÍSICA (GAM-02)", b2X + badgeBoxW / 2, y + 4.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  const posttestPct = data.posttestPercentage !== undefined ? `${data.posttestPercentage}%` : "Aprobado";
  doc.text(`Estado: Aprobado (${posttestPct})`, b2X + badgeBoxW / 2, y + 9, { align: "center" });

  // Badge 3: Metaverse & Digital Twins Lab
  const b3X = b2X + badgeBoxW + badgesGap;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(b3X, y, badgeBoxW, badgeBoxH, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(6, 95, 70);
  doc.text("LABORATORIO INMERSIVO 3D", b3X + badgeBoxW / 2, y + 4.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text("Física Mecánica & Gemelos Digitales", b3X + badgeBoxW / 2, y + 9, { align: "center" });

  // ─── 7. Signatures Area ────────────────────────────────────────────
  y += badgeBoxH + 11;
  const sigW = 85;
  const sigGap = 35;
  const sigTotalW = sigW * 2 + sigGap;
  const sigStartX = (pageWidth - sigTotalW) / 2;

  // Signature 1: Lubeimar Eduardo Gallego Ruiz
  const sig1X = sigStartX;
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(sig1X, y + 10, sig1X + sigW, y + 10);
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Lubeimar Eduardo Gallego Ruiz", sig1X + sigW / 2, y + 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text("Investigador Principal · Pilotaje GAMMA", sig1X + sigW / 2, y + 17.5, { align: "center" });
  doc.text("UNADE · Doctorado en Informática / Docente UDLA", sig1X + sigW / 2, y + 20.8, { align: "center" });

  // Signature 2: José Antonio Marin
  const sig2X = sig1X + sigW + sigGap;
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(sig2X, y + 10, sig2X + sigW, y + 10);
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("José Antonio Marin", sig2X + sigW / 2, y + 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text("Profesor de Física Mecánica", sig2X + sigW / 2, y + 17.5, { align: "center" });
  doc.text("Universidad de la Amazonia", sig2X + sigW / 2, y + 20.8, { align: "center" });

  // ─── 8. Security & Cryptographic Integrity Footer ──────────────────
  const footerY = innerMargin + innerHeight - 7;
  doc.setDrawColor(226, 232, 240);
  doc.line(innerMargin + 8, footerY - 3, innerMargin + innerWidth - 8, footerY - 3);

  doc.setFont("courier", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `FECHA DE EMISIÓN: ${data.completionDate}  |  SHA-256 INTEGRITY HASH: ${data.verificationHash}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.2);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Certificado digital auténtico emitido de conformidad con la Ley 527 de 1999 (Colombia). Validez académica respaldada por UNADE y Universidad de la Amazonia.",
    pageWidth / 2,
    footerY + 3.2,
    { align: "center" }
  );

  return doc;
}
