import { readImage } from "@/lib/storage";

// Sirve las fotos subidas desde el panel. Los nombres son únicos, así que se cachean para siempre.
export async function GET(_req: Request, { params }: RouteContext<"/media/[file]">) {
  const { file } = await params;
  const data = await readImage(file);
  if (!data) return new Response("No encontrada", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
