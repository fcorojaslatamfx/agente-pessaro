export function personalizeCopy(template: string, displayName: string | null): string {
  return template.replaceAll("{nombre_asesor}", displayName ?? "el asesor");
}
