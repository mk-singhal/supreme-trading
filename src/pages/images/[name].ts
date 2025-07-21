import fs from "fs";
import path from "path";

export async function GET({ params, request }) {
  const imageName = params.name;
  const url = new URL(request.url);

  // Block cache busting via query params (e.g., ?t=12345)
  console.log(`Search Params Size: ${url.searchParams.size}`);
  if (url.searchParams.size > 0) {
    return new Response("Forbidden: No cache busting allowed", { status: 403 });
  }

  console.log(`Fetching image: ${imageName}`);

  if (!imageName) {
    return new Response("Missing filename", { status: 400 });
  }

  // Referrer Check (update when you deploy)
  const referer = request.headers.get("referer");
  console.log("Referer:", referer);

  const allowedReferers = [
    "http://localhost:4321", // Dev
    // "https://yourdomain.com", // Production (replace with your real domain)
    // "https://www.yourdomain.com"
  ];

  const isAllowed = referer && allowedReferers.some((r) => referer.startsWith(r));

  if (!isAllowed) {
    console.warn("Blocked: Unauthorized referer");
    return new Response("Forbidden", { status: 403 });
  }

  // Sanitize file path
  const safeName = path.basename(imageName);
  const filePath = path.resolve(`./src/assets/protected-images/${safeName}`);

  if (!fs.existsSync(filePath)) {
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
  const lastModified = stats.mtime.toUTCString(); // Required for conditional GET

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=600, immutable", // Cache for 10 minutes
      // "ETag": etag,
      "Last-Modified": lastModified
    },
  });
}

export function getStaticPaths() {
  return [
    { params: { name: "store.jpg" } },
    { params: { name: "founder.jpg" } },
    { params: { name: "1.jpg" } },
    { params: { name: "2.jpg" } },
    { params: { name: "3.jpg" } },
    { params: { name: "4.jpg" } },
    { params: { name: "5.jpg" } },
    { params: { name: "6.jpg" } },
    { params: { name: "7.jpg" } },
    { params: { name: "8.jpg" } },
    { params: { name: "9.jpg" } },
    // Add more pre-generated image names if needed
  ];
}
