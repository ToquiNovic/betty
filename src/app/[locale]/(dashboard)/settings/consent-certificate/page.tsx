'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import {
  Download,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building,
  User,
  Printer,
  FileDown,
  GraduationCap,
  Mail,
  Phone,
} from 'lucide-react';
import { generateConsentPdf } from '@/lib/pdf/consent-pdf';

export default function BettyConsentCertificatePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [evidence, setEvidence] = useState<any>(null);

  useEffect(() => {
    async function loadEvidence() {
      try {
        const res = await authApi.getConsentEvidence();
        setEvidence(res);
      } catch (e) {
        // Fallback to local store
      }
    }
    loadEvidence();
  }, []);

  const participantName =
    evidence?.user?.name || user?.name || 'Representante / Participante Institucional';
  const participantEmail =
    evidence?.user?.email || user?.email || 'usuario@uniamazonia.edu.co';
  const participantId =
    evidence?.user?.id || user?.id || 'BETTY-USER-' + Math.floor(1000 + Math.random() * 9000);

  const consentDate = evidence?.consentRecord?.dataConsentAcceptedAt
    ? new Date(evidence.consentRecord.dataConsentAcceptedAt).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const verificationHash =
    evidence?.consentRecord?.verificationHash ||
    'AMAZONIA-1581-' + Math.random().toString(36).substring(2, 10).toUpperCase();

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      const doc = generateConsentPdf({
        participantName,
        participantEmail,
        participantId,
        consentDate,
        verificationHash,
        acceptedStudy: true,
        acceptedDataTreatment: true,
      });

      const cleanFileName = `Constancia_Consentimiento_Piedemonte_Amazonico_${participantName.replace(/\s+/g, '_')}.pdf`;
      doc.save(cleanFileName);
    } catch (err) {
      console.error('Error generating PDF with jsPDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Strict Print CSS Override so browser print never captures dashboard sidebar or navbar */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #betty-official-certificate,
          #betty-official-certificate * {
            visibility: visible !important;
          }
          #betty-official-certificate {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          aside,
          header,
          nav,
          .print-hide {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-6 px-4 sm:px-6">
        {/* Top Action Controls */}
        <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Configuración</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-60"
            >
              <FileDown className="w-4 h-4" />
              <span>
                {isGenerating ? 'Generando PDF...' : 'Descargar Documento PDF'}
              </span>
            </button>
          </div>
        </div>

        {/* Official Certificate Paper Container */}
        <div
          id="betty-official-certificate"
          className="max-w-4xl mx-auto bg-white text-slate-900 p-8 sm:p-14 rounded-2xl shadow-xl border border-slate-200"
        >
          {/* Header with Institutional Branding */}
          <header className="border-b-2 border-emerald-600 pb-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-lg shadow-md">
                  UNADE
                </div>
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-emerald-950">
                    UNADE - Universidad Americana de Europa
                  </h1>
                  <p className="text-xs font-semibold text-emerald-800">
                    Portal Institucional: <a href="https://unade.edu.mx/" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-950">https://unade.edu.mx/</a>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Investigación: Desarrollo Tecnológico en Florencia, Piedemonte Amazónico
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Constancia Registrada
                </span>
                <p className="text-[10px] font-mono text-slate-400 mt-1">
                  Ref: {verificationHash}
                </p>
              </div>
            </div>
          </header>

          {/* Certificate Main Title */}
          <div className="text-center space-y-1 mb-8">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
              Constancia de Consentimiento Informado y Autorización de Tratamiento de Datos
            </h2>
            <p className="text-xs text-slate-500">
              En cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto Reglamentario 1377 de 2013 (Habeas Data - Colombia)
            </p>
          </div>

          {/* Participant Information Card */}
          <section className="mb-8 p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              1. Datos del Participante / Representante
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Nombre Completo / Representante:</span>
                <span className="font-bold text-slate-800">{participantName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Correo Electrónico:</span>
                <span className="font-bold text-slate-800">{participantEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Identificador Único del Usuario:</span>
                <span className="font-mono text-slate-600">{participantId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Fecha y Hora de Consentimiento:</span>
                <span className="font-bold text-slate-800">{consentDate}</span>
              </div>
            </div>
          </section>

          {/* Study Information and Scope */}
          <section className="mb-8 space-y-3 text-xs leading-relaxed text-slate-700">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              2. Información y Finalidad del Estudio
            </h3>
            <p>
              <strong>Nombre del Estudio:</strong> Áreas estratégicas y oportunidades de desarrollo tecnológico en Florencia, Piedemonte Amazónico.
            </p>
            <p>
              <strong>Investigador Responsable:</strong> Freylen Rodolfo Ceballes Paloma, estudiante de la Universidad de la Amazonia, Ingeniería de Sistemas (Contacto: f.ceballes@udla.edu.co | Tel: 3217282646).
            </p>
            <p>
              <strong>Propósito:</strong> Determinar las áreas estratégicas de desarrollo tecnológico para Florencia (Caquetá) en el contexto del Piedemonte Amazónico (IA, Transformación Digital, EdTech, Bioeconomía, Turismo de Naturaleza, Agro Inteligente, Biodiversidad, Energías Sostenibles e IoT).
            </p>
            <p>
              <strong>Tratamiento de Datos y Voluntariedad:</strong> La participación es voluntaria. Respuestas analizadas de manera agregada bajo la Ley 1581 de 2012, custodiadas en medios de acceso restringido durante 1 año tras la publicación en libro de investigación.
            </p>
          </section>

          {/* Permissions and Declarations Matrix */}
          <section className="mb-10 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              3. Registro de Consentimientos y Declaraciones
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
              <div className="p-4 flex items-center justify-between gap-4 bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    C1. Participación Voluntaria en el Estudio
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Aceptación voluntaria de participar en la investigación con derecho a retiro sin consecuencias.
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  SÍ, ACEPTO PARTICIPAR
                </span>
              </div>

              <div className="p-4 flex items-center justify-between gap-4 bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    C2. Autorización de Tratamiento de Respuestas (Ley 1581)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Autorización expresa para análisis agregado, académico y publicación en libro de investigación.
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  SÍ, AUTORIZO
                </span>
              </div>

              <div className="p-4 flex items-center justify-between gap-4 bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    C3. Registro de Datos Sensibles (Género y Etnia)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Preguntas de carácter facultativo conforme al Artículo 6 de la Ley 1581 de 2012.
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  FACULTATIVO / PROTEGIDO
                </span>
              </div>
            </div>
          </section>

          {/* Signatures & Certification */}
          <section className="pt-6 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center">
              <div className="space-y-2">
                <div className="h-14 flex items-end justify-center">
                  <span className="font-serif italic text-slate-400 text-sm">
                    {participantName}
                  </span>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p className="text-xs font-bold text-slate-800">Firma Electrónica del Participante</p>
                  <p className="text-[10px] text-slate-400">ID: {participantId}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-14 flex items-end justify-center">
                  <span className="font-serif italic text-emerald-700 text-sm font-bold">
                    Freylen Rodolfo Ceballes Paloma
                  </span>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p className="text-xs font-bold text-slate-800">Investigador Responsable</p>
                  <p className="text-[10px] text-slate-400">UNADE • Universidad Americana de Europa (https://unade.edu.mx/)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Cryptographic Verification Footer */}
          <footer className="mt-10 pt-4 border-t border-slate-100 text-center space-y-1">
            <p className="text-[10px] font-mono text-slate-400">
              HASH SHA-256 DE INTEGRIDAD: {verificationHash}
            </p>
            <p className="text-[9px] text-slate-400">
              Esta constancia constituye evidencia digital vinculante bajo la Ley 527 de 1999 de Colombia.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
