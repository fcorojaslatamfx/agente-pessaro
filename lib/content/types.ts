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
    concepto_creativo: string;
    composicion: string;
    estilo_visual: string;
    tipografia: string;
    paleta: {
      primario: string;
      acento: string;
      complementarios: string;
      proporcion: string;
    };
    texto_grafica: string;
    elementos_graficos: string;
    que_evitar: string;
    prompt_leonardo: string;
    formatos: {
      linkedin_feed: string;
      linkedin_carrusel: string;
      instagram_feed: string;
      instagram_stories_reels: string;
      facebook_feed: string;
      blog_hero: string;
    };
    formato_principal: string;
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
