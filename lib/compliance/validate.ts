import "server-only";
import type { ContentAgentOutput } from "@/lib/content/types";

const BANNED_PHRASES = [
  /rentabilidad\s+(asegurada|garantizada)/i,
  /ganancia\s+(asegurada|garantizada)/i,
  /retorno\s+garantizado/i,
  /sin\s+riesgo/i,
  /compra\s+ahora/i,
  /oferta\s+por\s+tiempo\s+limitado/i,
];

const INVESTMENT_KEYWORDS =
  /inversi[oó]n|mercado financiero|instrumento financiero|riesgo|cartera|patrimonio|portafolio/i;

const DISCLAIMER_TEXT =
  "Contenido informativo y educativo. No constituye recomendación de inversión. Toda inversión conlleva riesgos. Consulta con un asesor financiero antes de tomar decisiones.";

export type ComplianceResult = {
  passed: boolean;
  prometeRentabilidad: boolean;
  recomiendaCompraVentaDirecta: boolean;
  incluyeDisclaimerSiCorresponde: boolean;
  observaciones: string;
};

/**
 * Backend compliance validation (section 12) — never trust the model's own
 * self-reported `compliance` block alone. Scans every user-facing text
 * field for banned phrases and checks the disclaimer is present whenever
 * the content touches investment/risk topics.
 */
export function validateCompliance(output: ContentAgentOutput): ComplianceResult {
  const textFields = [
    output.blog?.articulo,
    output.linkedin?.copy,
    output.instagram?.copy,
    output.facebook?.copy,
    output.version_marca_personal?.copy_personalizable,
  ]
    .filter((v): v is string => typeof v === "string")
    .join("\n");

  const prometeRentabilidad = BANNED_PHRASES.some((re) => re.test(textFields));
  const recomiendaCompraVentaDirecta =
    /\b(compra|vende|mantén)\s+(acciones|dólares|bonos|criptomonedas|este activo)\b/i.test(
      textFields,
    );

  const touchesInvestmentTopics = INVESTMENT_KEYWORDS.test(textFields);
  const hasDisclaimer =
    typeof output.disclaimer === "string" && output.disclaimer.trim().length > 0;
  const incluyeDisclaimerSiCorresponde = !touchesInvestmentTopics || hasDisclaimer;

  const observaciones: string[] = [];
  if (prometeRentabilidad) observaciones.push("Frase prohibida de rentabilidad detectada.");
  if (recomiendaCompraVentaDirecta) observaciones.push("Posible recomendación directa de compra/venta.");
  if (!incluyeDisclaimerSiCorresponde)
    observaciones.push("Tema de inversión sin disclaimer financiero.");

  return {
    passed: !prometeRentabilidad && !recomiendaCompraVentaDirecta && incluyeDisclaimerSiCorresponde,
    prometeRentabilidad,
    recomiendaCompraVentaDirecta,
    incluyeDisclaimerSiCorresponde,
    observaciones: observaciones.join(" ") || "Sin observaciones.",
  };
}

export function fallbackDisclaimer() {
  return DISCLAIMER_TEXT;
}
