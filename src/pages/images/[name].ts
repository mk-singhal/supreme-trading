import fs from "fs";
import path from "path";

// Replace with your Logtail Source Token
const LOGTAIL_TOKEN = import.meta.env.LOGTAIL_TOKEN;

if (!LOGTAIL_TOKEN) {
  console.warn("Logtail token is missing!");
}
else {
  console.log("Logtail token is set.", LOGTAIL_TOKEN);
}

// Util function for sending logs
async function logToLogtail(level: "info" | "warn" | "error", message: string, meta = {}) {
  try {
    const res = await fetch("https://s1445968.eu-nbg-2.betterstackdata.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOGTAIL_TOKEN}`,
      },
      body: JSON.stringify({
        level,
        message,
        ...meta,
      }),
    });

    if (!res.ok) {
      console.warn("Logtail responded with error status:", res.status, await res.text());
    } else {
      console.log(`Logtail log sent → [${level.toUpperCase()}] ${message}`);
    }
  } catch (err) {
    console.warn("Logtail logging failed:", err);
  }
}

export async function GET({ params, request }) {
  const imageName = params.name;
  const url = new URL(request.url);

  if (url.searchParams.size > 0) {
    await logToLogtail("warn", "Cache busting attempt", {
      image: imageName,
      ip: request.headers.get("x-forwarded-for"),
    });
    return new Response("Forbidden: No cache busting allowed", { status: 403 });
  }

  const referer = request.headers.get("referer");
  const allowedReferers = ["http://localhost:4321"];

  const isAllowed = referer && allowedReferers.some((r) => referer.startsWith(r));

  if (!isAllowed) {
    await logToLogtail("warn", "Unauthorized referer", {
      image: imageName,
      referer,
      ip: request.headers.get("x-forwarded-for"),
    });
    return new Response("Forbidden", { status: 403 });
  }

  const safeName = path.basename(imageName);
  const filePath = path.resolve(`./src/assets/protected-images/${safeName}`);

  if (!fs.existsSync(filePath)) {
    await logToLogtail("warn", "Image not found", {
      image: imageName,
      ip: request.headers.get("x-forwarded-for"),
    });
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

  // ✅ Successful access log
  await logToLogtail("info", "Image served", {
    image: imageName,
    referer,
    ip: request.headers.get("x-forwarded-for"),
  });

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=600, immutable",
      "Last-Modified": lastModified,
    },
  });
}
