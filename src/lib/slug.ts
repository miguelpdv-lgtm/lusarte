/** "Vela Peonía 85 ml" → "vela-peonia-85-ml" */
export function slugify(text: string, max = 80) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, max)
    .replace(/-$/, "");
}
