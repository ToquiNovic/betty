import { jsPDF } from "jspdf/dist/jspdf.umd.min.js";

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
  const contentWidth = pageWidth - margin * 2;

  // 1. Institutional Top Decorative Bar (Emerald Green)
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(margin, 12, contentWidth, 2.5, "F");

  // Logo / Emblem Badge (Square with rounded corners)
  doc.setFillColor(6, 95, 70); // emerald-800
  doc.roundedRect(margin, 18, 16, 16, 2.5, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("UNADE", margin + 8, 28, { align: "center" });

  // University & Research Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(6, 78, 59); // emerald-950
  doc.text("UNADE - UNIVERSIDAD AMERICANA DE EUROPA", margin + 20, 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text("Portal Institucional: https://unade.edu.mx/", margin + 20, 27.5);
  doc.text(
    "Investigación: Desarrollo Tecnológico en Florencia, Piedemonte Amazónico",
    margin + 20,
    31.5
  );

  // Status Badge on Top Right
  const badgeWidth = 46;
  const badgeX = pageWidth - margin - badgeWidth;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(badgeX, 18, badgeWidth, 12, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  doc.text("CONSTANCIA REGISTRADA", badgeX + badgeWidth / 2, 23, { align: "center" });
  doc.setFont("courier", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Ref: ${data.verificationHash.slice(0, 14)}`, badgeX + badgeWidth / 2, 27.5, {
    align: "center",
  });

  // Divider Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(margin, 38, pageWidth - margin, 38);

  // 2. Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(
    "CONSTANCIA DE CONSENTIMIENTO INFORMADO Y",
    pageWidth / 2,
    45,
    { align: "center" }
  );
  doc.text(
    "AUTORIZACIÓN DE TRATAMIENTO DE DATOS PERSONALES",
    pageWidth / 2,
    50,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "En cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto Reglamentario 1377 de 2013 (Habeas Data - Colombia)",
    pageWidth / 2,
    55,
    { align: "center" }
  );

  // 3. Section: Participant Information (Box)
  let y = 62;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70);
  doc.text("1. DATOS DEL PARTICIPANTE / REPRESENTANTE", margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Nombre / Representante:", margin + 4, y + 11.5);
  doc.text("Correo Electrónico:", margin + 70, y + 11.5);

  doc.text("Identificador de Usuario:", margin + 4, y + 18);
  doc.text("Fecha y Hora de Consentimiento:", margin + 70, y + 18);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(data.participantName, margin + 4, y + 15);
  doc.text(data.participantEmail, margin + 70, y + 15);
  doc.text(data.participantId, margin + 4, y + 21.5);
  doc.text(data.consentDate, margin + 70, y + 21.5);

  // 4. Section: Study Details & Academic Scope
  y = 90;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70);
  doc.text("2. INFORMACIÓN Y FINALIDAD DE LA INVESTIGACIÓN", margin, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Título del Estudio:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Áreas estratégicas y oportunidades de desarrollo tecnológico en Florencia, Piedemonte Amazónico.",
    margin + 26,
    y
  );

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Responsable:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Freylen Rodolfo Ceballes Paloma (Investigador • https://unade.edu.mx/).",
    margin + 20,
    y
  );

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Contacto / Derechos:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    "f.ceballes@udla.edu.co | Tel/Móvil: 3217282646 (Para conocer, rectificar o suprimir datos).",
    margin + 30,
    y
  );

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);

  const purposeText =
    "Propósito: Determinar, mediante la valoración y el ordenamiento de nueve áreas predefinidas y la propuesta de áreas emergentes por parte de los actores, las áreas estratégicas de desarrollo tecnológico para Florencia (Caquetá) en el contexto del Piedemonte Amazónico: inteligencia artificial, transformación digital, tecnologías educativas, bioeconomía, turismo de naturaleza, producción agropecuaria inteligente, biodiversidad, energías sostenibles e Internet de las Cosas (IoT).";
  const splitPurpose = doc.splitTextToSize(purposeText, contentWidth);
  doc.text(splitPurpose, margin, y);
  y += splitPurpose.length * 3.4 + 2;

  const legalText =
    "Confidencialidad y Tratamiento: Las respuestas se analizarán de manera agregada y se utilizarán exclusivamente con fines académicos e investigativos, incluida su publicación en libro. No se publicarán resultados de grupos con menos de cinco respuestas ni descripciones que identifiquen organizaciones. Las preguntas de datos sensibles (género y etnia) son facultativas. Los datos se almacenarán en medios con acceso restringido durante 1 año después de la publicación.";
  const splitLegal = doc.splitTextToSize(legalText, contentWidth);
  doc.text(splitLegal, margin, y);
  y += splitLegal.length * 3.4 + 4;

  // 5. Section: Declarations and Permissions Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70);
  doc.text("3. DECLARACIONES Y REGISTRO DE AUTORIZACIONES (LEY 1581 DE 2012)", margin, y);

  y += 4;
  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("Cláusula / Pregunta de Consentimiento", margin + 3, y + 4.8);
  doc.text("Estado Registrado", margin + contentWidth - 36, y + 4.8);

  y += 7;
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
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, 11, "F");
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 11, margin + contentWidth, y + 11);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(item.title, margin + 3, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(item.desc, margin + 3, y + 8.5);

    const badgeW = 34;
    const badgeH = 5.5;
    const bX = margin + contentWidth - badgeW - 2;
    const bY = y + 2.5;

    if (item.allowed) {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(bX, bY, badgeW, badgeH, 1, 1, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(6, 95, 70);
      doc.text(item.statusText, bX + badgeW / 2, bY + 3.8, { align: "center" });
    } else {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(bX, bY, badgeW, badgeH, 1, 1, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(153, 27, 27);
      doc.text(item.statusText, bX + badgeW / 2, bY + 3.8, { align: "center" });
    }

    y += 11.5;
  });

  // 6. Signatures
  y += 4;
  const sigBoxWidth = (contentWidth - 10) / 2;

  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + 5, y + 18, margin + sigBoxWidth - 5, y + 18);
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Firmado Digitalmente por el Participante", margin + sigBoxWidth / 2, y + 22, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Nombre: ${data.participantName} • ID: ${data.participantId}`,
    margin + sigBoxWidth / 2,
    y + 25.5,
    { align: "center" }
  );
  doc.text(`Registro Electrónico: ${data.consentDate}`, margin + sigBoxWidth / 2, y + 29, {
    align: "center",
  });

  const sig2X = margin + sigBoxWidth + 10;
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(sig2X + 5, y + 18, sig2X + sigBoxWidth - 5, y + 18);
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    "Freylen Rodolfo Ceballes Paloma",
    sig2X + sigBoxWidth / 2,
    y + 22,
    { align: "center" }
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Investigador Responsable • Proyecto de Investigación",
    sig2X + sigBoxWidth / 2,
    y + 25.5,
    { align: "center" }
  );
  doc.text(
    "UNADE • Universidad Americana de Europa (https://unade.edu.mx/)",
    sig2X + sigBoxWidth / 2,
    y + 29,
    { align: "center" }
  );

  // 7. Security Stamp
  const footerY = pageHeight - 20;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, footerY - 5, contentWidth, 15, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(6, 95, 70);
  doc.text("ESTAMPA DE SEGURIDAD CRIPTOGRÁFICA & NO REPUDIO:", margin + 3, footerY - 1);

  doc.setFont("courier", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`SHA-256 HASH: ${data.verificationHash}`, margin + 3, footerY + 2.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Documento digital generado conforme a la Ley 527 de 1999 (Validez de Mensajes de Datos y Firmas Digitales en Colombia). Custodia institucional: UNADE (https://unade.edu.mx/).",
    margin + 3,
    footerY + 6.5
  );

  return doc;
}
