// Cloudflare Worker cho aioil.vn
// - Chuyển hướng 301 về tên miền chính (khi đặt biến CANONICAL_HOST)
// - Nhận form báo giá tại POST /api/lead, gửi về Telegram và/hoặc webhook
// - Còn lại trả file tĩnh trong dist/

const MAX = { name: 80, phone: 20, company: 120, product: 60, pack: 40, note: 1000, page: 200 };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const canonical = env.CANONICAL_HOST;
    if (canonical && url.hostname !== canonical && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      url.hostname = canonical;
      url.protocol = "https:";
      url.port = "";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/api/lead") {
      if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);
      return handleLead(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleLead(request, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "invalid" }, 400);
  }

  // Bẫy bot: trường ẩn "website" phải rỗng, form phải mở ít nhất 3 giây
  if (data.website || (Number(data.elapsed) > 0 && Number(data.elapsed) < 3000)) {
    return json({ ok: true });
  }

  const lead = {};
  for (const [k, n] of Object.entries(MAX)) lead[k] = String(data[k] ?? "").trim().slice(0, n);
  if (!lead.name || !/^[0-9 +().-]{8,20}$/.test(lead.phone)) {
    return json({ ok: false, error: "validation" }, 422);
  }

  const time = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const text = [
    "🛢 Yêu cầu mới từ aioil.vn",
    `Họ tên: ${lead.name}`,
    `SĐT: ${lead.phone}`,
    lead.company && `Công ty: ${lead.company}`,
    lead.product && `Sản phẩm: ${lead.product}`,
    lead.pack && `Quy cách: ${lead.pack}`,
    lead.note && `Ghi chú: ${lead.note}`,
    lead.page && `Trang: ${lead.page}`,
    `Lúc: ${time}`,
  ]
    .filter(Boolean)
    .join("\n");

  const jobs = [];
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
      })
    );
  }
  if (env.LEAD_WEBHOOK_URL) {
    jobs.push(
      fetch(env.LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...lead, time }),
      })
    );
  }
  if (!jobs.length) return json({ ok: false, error: "not_configured" }, 503);

  const results = await Promise.allSettled(jobs);
  const delivered = results.some((r) => r.status === "fulfilled" && r.value.ok);
  return delivered ? json({ ok: true }) : json({ ok: false, error: "delivery" }, 502);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
