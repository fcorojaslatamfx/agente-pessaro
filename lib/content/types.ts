// Mirrors the JSON structure mandated by the system prompt (section 7).
export type ContentAgentOutput = {
  meta: {
    plataforma_principal: string;
    formato: string;
    pilar: string;
    publicador: string;
    tono: string;
    score: number;
    fuentes_sugeridas: string[];
  };
  blog: {
    h1: string;
    meta_description: string;
    articulo: string;
    keywords: string[];
  };
  linkedin: {
    copy: string;
    hashtags: string[];
  };
  instagram: {
    copy: string;
    carrusel: string[];
    reel_script: { gancho: string; desarrollo: string; cta: string };
    hashtags: string[];
  };
  facebook: {
    copy: string;
    hashtags: string[];
  };
  design_brief: {
    idea_visual: string;
    paleta: string;
    texto_grafica: string;
    medidas: { linkedin: string; instagram: string; facebook: string };
  };
  version_marca_personal: {
    instrucciones: string;
    copy_personalizable: string;
  };
  disclaimer: string;
  compliance: {
    promete_rentabilidad: boolean;
    recomienda_compra_venta_directa: boolean;
    incluye_disclaimer_si_corresponde: boolean;
    observaciones: string;
  };
};

export type ContentStatus =
  | "draft"
  | "pending_review"
  | "team_review"
  | "super_admin_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "ready_to_publish"
  | "published"
  | "archived";

export type GenerationInput = {
  topic: string;
  objective?: string;
  audience?: string;
  tone?: string;
  contentType?: string;
  platformPrimary?: string;
  platformsSecondary?: string[];
  visibilityScope: "own" | "team" | "company";
  needsImage: boolean;
  imageSource?: string;
  complianceRequired: boolean;
};
