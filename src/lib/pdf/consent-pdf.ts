import { jsPDF } from "jspdf/dist/jspdf.umd.min.js";
import { UNADE_LOGO_BASE64 } from "./unade-logo-base64";

export interface ConsentPdfData {
  participantName: string;
  participantEmail: string;
  participantId: string;
  consentDate: string;
  verificationHash: string;
  acceptedStudy: boolean; // C1
  acceptedDataTreatment: boolean; // C2
  allowPhotos?: boolean;
  allowAudio?: boolean;
  allowVideo?: boolean;
}

/**
 * Generates an official, publication-quality institutional PDF certificate
 * for the Piedemonte Amazónico research study under Colombian Law 1581 of 2012
 * for UNADE (Universidad Americana de Europa - https://unade.edu.mx/).
 */
export function generateConsentPdf(data: ConsentPdfData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2; // 174 mm

  // 1. Institutional Top Decorative Bar (Emerald Green)
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(margin, 12, contentWidth, 2.5, "F");

  // Logo Oficial UNADE (Acreditación Institucional)
  const logoWidth = 38;
  const logoHeight = 12.8;
  const headerY = 16.5;

  try {
    doc.addImage(UNADE_LOGO_BASE64, "PNG", margin, headerY, logoWidth, logoHeight);
  } catch {
    doc.setFillColor(6, 95, 70);
    doc.roundedRect(margin, headerY, 14, 14, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("UNADE", margin + 7, headerY + 8.5, { align: "center" });
  }

  // Right Badge: CONSTANCIA REGISTRADA
  const badgeWidth = 44;
  const badgeHeight = 13.5;
  const badgeX = pageWidth - margin - badgeWidth; // 148 mm
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(badgeX, headerY, badgeWidth, badgeHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text("CONSTANCIA REGISTRADA", badgeX + badgeWidth / 2, headerY + 4.8, { align: "center" });

  doc.setFont("courier", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105); // slate-600
  const hashText = `Ref: ${data.verificationHash || "AMAZONIA-1581"}`;
  doc.text(hashText, badgeX + badgeWidth / 2, headerY + 8.8, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text("Ley 1581 de 2012 • Colombia", badgeX + badgeWidth / 2, headerY + 11.8, { align: "center" });

  // Center Institutional Information (Between logo and badge - guaranteed no overlap)
  const centerStartX = margin + logoWidth + 4; // 60 mm
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.8);
  doc.setTextColor(6, 78, 59); // emerald-950
  doc.text("UNADE • Universidad Americana de Europa", centerStartX, headerY + 4.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text("Portal Institucional: https://unade.edu.mx/", centerStartX, headerY + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text("Investigación en Ciencia, Tecnología e Innovación", centerStartX, headerY + 11.5);

  // Divider Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(margin, 33.5, pageWidth - margin, 33.5);

  // 2. Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(
    "CONSTANCIA DE CONSENTIMIENTO INFORMADO Y",
    pageWidth / 2,
    39.5,
    { align: "center" }
  );
  doc.text(
    "AUTORIZACIÓN DE TRATAMIENTO DE DATOS PERSONALES",
    pageWidth / 2,
    44,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "En cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto Reglamentario 1377 de 2013 (Habeas Data - Colombia)",
    pageWidth / 2,
    48.5,
    { align: "center" }
  );

  // 3. Section: Participant Information (Box)
  let y = 53;
  const boxHeight = 22;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  doc.text("1. DATOS DEL PARTICIPANTE / REPRESENTANTE", margin + 4, y + 5);

  const col2X = margin + 82;

  // Field Labels
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text("Nombre / Representante:", margin + 4, y + 10);
  doc.text("Correo Electrónico:", col2X, y + 10);
  doc.text("Identificador de Usuario:", margin + 4, y + 16.5);
  doc.text("Fecha y Hora de Consentimiento:", col2X, y + 16.5);

  // Field Values
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.participantName, margin + 4, y + 13.5);
  doc.text(data.participantEmail, col2X, y + 13.5);

  doc.setFont("courier", "bold");
  doc.setFontSize(6.8);
  doc.text(data.participantId, margin + 4, y + 19.8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(data.consentDate, col2X, y + 19.8);

  // 4. Section: Study Details & Academic Scope
  y = 79;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(6, 95, 70);
  doc.text("2. INFORMACIÓN Y FINALIDAD DE LA INVESTIGACIÓN", margin, y);

  y += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text("Título del Estudio:", margin, y);

  doc.setFont("helvetica", "normal");
  const studyTitle = "Áreas estratégicas y oportunidades de desarrollo tecnológico en Florencia, Piedemonte Amazónico.";
  const titleLines = doc.splitTextToSize(studyTitle, contentWidth - 26);
  doc.text(titleLines, margin + 25, y);
  y += titleLines.length * 3.4;

  y += 1;
  doc.setFont("helvetica", "bold");
  doc.text("Investigador Principal:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Lubeimar Eduardo Gallego Ruiz (UNADE / UDLA • lu.gallego@udla.edu.co)",
    margin + 32,
    y
  );

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Profesor de Física:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    "José Antonio Marin (Universidad de la Amazonia • jo.marin@udla.edu.co)",
    margin + 26,
    y
  );

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);

  const purposeText =
    "Propósito: Determinar, mediante la valoración y el ordenamiento de nueve áreas predefinidas y la propuesta de áreas emergentes por parte de los actores, las áreas estratégicas de desarrollo tecnológico para Florencia (Caquetá) en el contexto del Piedemonte Amazónico: inteligencia artificial, transformación digital, tecnologías educativas, bioeconomía, turismo de naturaleza, producción agropecuaria inteligente, biodiversidad, energías sostenibles e Internet de las Cosas (IoT).";
  const splitPurpose = doc.splitTextToSize(purposeText, contentWidth);
  doc.text(splitPurpose, margin, y);
  y += splitPurpose.length * 3.1 + 2;

  const legalText =
    "Confidencialidad y Tratamiento: Las respuestas se analizarán de manera agregada y se utilizarán exclusivamente con fines académicos e investigativos, incluida su publicación en libro. No se publicarán resultados de grupos con menos de cinco respuestas ni descripciones que identifiquen organizaciones. Las preguntas de datos sensibles (género y etnia) son facultativas. Los datos se almacenarán en medios con acceso restringido durante 1 año después de la publicación.";
  const splitLegal = doc.splitTextToSize(legalText, contentWidth);
  doc.text(splitLegal, margin, y);
  y += splitLegal.length * 3.1 + 3.5;

  // 5. Section: Declarations and Permissions Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(6, 95, 70);
  doc.text("3. DECLARACIONES Y REGISTRO DE AUTORIZACIONES (LEY 1581 DE 2012)", margin, y);

  y += 3.5;
  // Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text("Cláusula / Pregunta de Consentimiento", margin + 3, y + 4.2);
  doc.text("Estado Registrado", margin + contentWidth - 36, y + 4.2);

  y += 6;
  const permissions = [
    {
      title: "C1. Participación Voluntaria en el Estudio",
      desc: "Aceptación expresa de participar de forma voluntaria, con libertad de retirarse sin consecuencias.",
      allowed: data.acceptedStudy,
      statusText: data.acceptedStudy ? "SÍ, ACEPTO PARTICIPAR" : "NO ACEPTADO",
    },
    {
      title: "C2. Autorización de Tratamiento de Respuestas (Ley 1581)",
      desc: "Autorización para el tratamiento de respuestas en las condiciones académicas y de confidencialidad descritas.",
      allowed: data.acceptedDataTreatment,
      statusText: data.acceptedDataTreatment ? "SÍ, AUTORIZO" : "NO AUTORIZADO",
    },
    {
      title: "C3. Registro de Datos Sensibles (Género y Etnia)",
      desc: "Tratamiento facultativo conforme al Artículo 6 de la Ley 1581 de 2012. Información de respuesta opcional.",
      allowed: true,
      statusText: "FACULTATIVO / PROTEGIDO",
    },
    {
      title: "C4. Ecosistema Tecnológico & Telemetría (UA3D / Betty)",
      desc: "Captura de métricas de interacción en metaverso y entornos de gemelos digitales para fines de investigación.",
      allowed: true,
      statusText: "AUTORIZADO",
    },
  ];

  if (data.allowPhotos !== undefined) {
    permissions.push({
      title: "C5. Registros Multimedia Opcionales (Fotos, Audio o Video)",
      desc: "Grabaciones audiovisuales para documentación académica interna (sin difusión comercial).",
      allowed: Boolean(data.allowPhotos || data.allowAudio || data.allowVideo),
      statusText:
        data.allowPhotos || data.allowAudio || data.allowVideo
          ? "AUTORIZADO (PARCIAL)"
          : "NO AUTORIZADO",
    });
  }

  permissions.forEach((item) => {
    const rowHeight = 10;
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, rowHeight, "F");
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(item.title, margin + 3, y + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(item.desc, margin + 3, y + 7.8);

    const badgeW = 34;
    const badgeH = 5.2;
    const bX = margin + contentWidth - badgeW - 2;
    const bY = y + 2.2;

    if (item.allowed) {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(bX, bY, badgeW, badgeH, 1, 1, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.8);
      doc.setTextColor(6, 95, 70);
      doc.text(item.statusText, bX + badgeW / 2, bY + 3.6, { align: "center" });
    } else {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(bX, bY, badgeW, badgeH, 1, 1, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.8);
      doc.setTextColor(153, 27, 27);
      doc.text(item.statusText, bX + badgeW / 2, bY + 3.6, { align: "center" });
    }

    y += rowHeight;
  });

  // 6. Signatures Area
  y += 5;
  const sigGap = 6;
  const sigBoxWidth = (contentWidth - sigGap * 2) / 3;

  // Signatory 1: Participant
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1], 0);
  doc.line(margin + 3, y + 14, margin + sigBoxWidth - 3, y + 14);
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text("Firmado por el Participante", margin + sigBoxWidth / 2, y + 17.5, { align: "center" });
  doc.setFont("courier", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID: ${data.participantId}`, margin + sigBoxWidth / 2, y + 21, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.text(`Fecha: ${data.consentDate.slice(0, 16)}`, margin + sigBoxWidth / 2, y + 24.2, { align: "center" });

  // Signatory 2: Investigador Principal (Lubeimar Eduardo Gallego Ruiz)
  const sig2X = margin + sigBoxWidth + sigGap;
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1], 0);
  doc.line(sig2X + 3, y + 14, sig2X + sigBoxWidth - 3, y + 14);
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text("Lubeimar Eduardo Gallego Ruiz", sig2X + sigBoxWidth / 2, y + 17.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Investigador Principal", sig2X + sigBoxWidth / 2, y + 21, { align: "center" });
  doc.text("UNADE / Univ. de la Amazonia", sig2X + sigBoxWidth / 2, y + 24.2, { align: "center" });

  // Signatory 3: Profesor de Física (José Antonio Marin)
  const sig3X = sig2X + sigBoxWidth + sigGap;
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1], 0);
  doc.line(sig3X + 3, y + 14, sig3X + sigBoxWidth - 3, y + 14);
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text("José Antonio Marin", sig3X + sigBoxWidth / 2, y + 17.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Profesor de Física", sig3X + sigBoxWidth / 2, y + 21, { align: "center" });
  doc.text("Universidad de la Amazonia", sig3X + sigBoxWidth / 2, y + 24.2, { align: "center" });

  // 7. Security Stamp & Cryptographic Integrity Footer
  const footerY = pageHeight - 22; // 275 mm
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, footerY - 4, contentWidth, 14, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(6, 95, 70);
  doc.text("ESTAMPA DE SEGURIDAD CRIPTOGRÁFICA & NO REPUDIO:", margin + 3, footerY);

  doc.setFont("courier", "bold");
  doc.setFontSize(5.6);
  doc.setTextColor(51, 65, 85);
  doc.text(`HASH SHA-256: ${data.verificationHash}`, margin + 3, footerY + 3.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Documento digital generado conforme a la Ley 527 de 1999 (Validez de Mensajes de Datos y Firmas Digitales en Colombia). Custodia institucional: UNADE (https://unade.edu.mx/).",
    margin + 3,
    footerY + 7.2
  );

  return doc;
}
