import fs from "fs";
import path from "path";

export async function GET({ params, request }) {
  const imageName = params.name;
  const url = new URL(request.url);

  if (url.searchParams.size > 0) {
    return new Response("Forbidden: No cache busting allowed", { status: 403 });
  }

  const referer = request.headers.get("referer");
  const allowedReferers = ["http://localhost:4321"];

  const isAllowed = referer && allowedReferers.some((r) => referer.startsWith(r));

  if (!isAllowed) {
    return new Response("Forbidden", { status: 403 });
  }

  const safeName = path.basename(imageName);
  const searchFolders = [
    path.resolve(`./src/assets/protected-images/`),
    path.resolve(`./src/assets/protected-images/product`),
  ];

  let filePath = "";
  for (const folder of searchFolders) {
    const fullPath = path.join(folder, safeName);
    if (fs.existsSync(fullPath)) {
      filePath = fullPath;
      break;
    }
  }

  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(safeName).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };

  const contentType = contentTypes[ext] || "application/octet-stream";
  const buffer = fs.readFileSync(filePath);
  const stats = fs.statSync(filePath);
  const lastModified = stats.mtime.toUTCString();

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=600, immutable",
      "Last-Modified": lastModified,
    },
  });
}
