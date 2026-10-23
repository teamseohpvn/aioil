// Build tĩnh cho aioil.vn: ghép layout chung vào từng trang trong src/pages,
// chép public/ sang dist/, sinh sitemap.xml. Không cần thư viện ngoài.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const SRC = join(root, "src/pages");
const DIST = join(root, "dist");
const site = JSON.parse(readFileSync(join(root, "src/site.json"), "utf8"));

const NAV = [
  ["san-pham", "/san-pham/", "Sản phẩm"],
  ["chat-luong", "/chat-luong/", "Chất lượng"],
  ["kien-thuc", "/kien-thuc/", "Kiến thức"],
  ["dai-ly", "/dai-ly/", "Đại lý"],
  ["lien-he", "/lien-he/", "Liên hệ"],
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : [];
  });
}

function parse(file) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`Thiếu khối <!--meta--> trong ${file}`);
  const meta = JSON.parse(m[1]);
  let rest = raw.slice(m[0].length);
  let head = "";
  const h = rest.match(/<!--head-->([\s\S]*?)<!--\/head-->\s*/);
  if (h) {
    head = h[1].trim();
    rest = rest.replace(h[0], "");
  }
  return { meta, head, body: rest.trim() };
}

function leadForm(kind = "bao-gia") {
  const dealer = kind === "dai-ly";
  const productOptions = dealer
    ? `<option>Đăng ký làm đại lý</option>`
    : `<option value="AIO AW 46"${kind === "aw46" ? " selected" : ""}>AIO AW 46</option>
        <option value="AIO AW 68"${kind === "aw46" ? "" : " selected"}>AIO AW 68</option>
        <option value="Chưa chắc, cần tư vấn">Chưa chắc, cần tư vấn</option>`;
  return `<form class="lead" data-form="${kind}" novalidate>
      <label>Họ tên *<input name="name" autocomplete="name" required maxlength="80"></label>
      <label>Số điện thoại / Zalo *<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required maxlength="20"></label>
      <label class="full">${dealer ? "Cửa hàng / công ty, khu vực" : "Công ty / xưởng"}<input name="company" autocomplete="organization" maxlength="120"></label>
      <label>${dealer ? "Nhu cầu" : "Sản phẩm"}<select name="product">
        ${productOptions}
      </select></label>
      <label>Quy cách<select name="pack">
        <option>Xô 18 L</option>
        <option>Phuy 200 L</option>
        <option>Cả hai</option>
      </select></label>
      <label class="full">${dealer ? "Ghi chú (sản lượng dự kiến, kênh bán)" : "Ghi chú (số lượng, loại máy, địa chỉ giao)"}<textarea name="note" maxlength="1000"></textarea></label>
      <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
      <div class="full actions"><button class="btn" type="submit">${dealer ? "Gửi đăng ký" : "Gửi yêu cầu báo giá"}</button><a class="btn ghost" href="${site.zalo}" target="_blank" rel="noopener">Nhắn Zalo</a></div>
      <p class="msg full" role="status" aria-live="polite"></p>
    </form>`;
}

function fill(s) {
  return s
    .replace(/\{\{leadForm(?::([a-z0-9-]+))?\}\}/g, (_, k) => leadForm(k))
    .replaceAll("https://aioil.vn", site.domain)
    .replaceAll("{{phone}}", site.phone)
    .replaceAll("{{phoneIntl}}", site.phoneIntl)
    .replaceAll("{{zalo}}", site.zalo)
    .replaceAll("{{company}}", site.company)
    .replaceAll("{{taxId}}", site.taxId)
    .replaceAll("{{address}}", site.address)
    .replaceAll("{{factory}}", site.factory);
}

function ga4() {
  if (!site.ga4) return "";
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${site.ga4}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${site.ga4}');</script>`;
}

function layout({ meta, head, body }) {
  const url = site.domain + meta.path;
  const og = site.domain + (meta.ogImage || "/img/og-aioil-1200x630.jpg");
  const isDefaultOg = !meta.ogImage;
  const nav = NAV.map(
    ([k, href, label]) => `<a href="${href}"${meta.nav === k ? ' aria-current="page"' : ""}>${label}</a>`
  ).join("\n      ");
  const email = site.email ? ` · <a href="mailto:${site.email}">${site.email}</a>` : "";
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${meta.robots || "index,follow,max-image-preview:large"}">
<meta name="theme-color" content="#0b0f14">
<meta property="og:type" content="${meta.ogType || "article"}">
<meta property="og:locale" content="vi_VN">
<meta property="og:site_name" content="${site.brand}">
<meta property="og:title" content="${esc(meta.ogTitle || meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">${isDefaultOg ? '\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">' : ""}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&family=Exo+2:wght@700;800&family=JetBrains+Mono:wght@500&display=swap">
<link rel="stylesheet" href="/assets/aio.css">
${ga4()}
${head}
</head>
<body data-phone="${site.phone}" data-zalo="${site.zalo}">
<a class="skip" href="#noi-dung">Bỏ qua menu</a>
<header class="top">
  <div class="top-in">
    <a class="logo" href="/" aria-label="AIO AI OIL – Trang chủ"><b>AIO</b><span>AI OIL</span></a>
    <nav class="menu" aria-label="Menu chính">
      ${nav}
    </nav>
    <a class="btn" href="/bao-gia/">Nhận báo giá</a>
  </div>
</header>
<div id="noi-dung"></div>
${body}
<footer class="site">
  <div class="in">
    <div class="foot-grid">
      <div>
        <b>${site.company}</b>
        <span>${site.address}</span>
        <span>MST ${site.taxId}</span>
        <span>Hotline/Zalo: <a href="tel:${site.phoneIntl}">${site.phone}</a>${email}</span>
        <span>Nhà máy: ${site.factory}</span>
      </div>
      <nav aria-label="Sản phẩm và tài liệu">
        <a href="/san-pham/dau-thuy-luc-aio-aw-46/">Dầu thủy lực AIO AW 46</a>
        <a href="/san-pham/dau-thuy-luc-aio-aw-68/">Dầu thủy lực AIO AW 68</a>
        <a href="/chat-luong/">Công bố chất lượng</a>
        <a href="/chat-luong/phieu-an-toan-hoa-chat-sds/">Phiếu an toàn hóa chất</a>
        <a href="/kien-thuc/">Kiến thức dầu thủy lực</a>
      </nav>
      <nav aria-label="Chính sách">
        <a href="/gioi-thieu/">Giới thiệu</a>
        <a href="/chinh-sach/giao-hang/">Giao hàng</a>
        <a href="/chinh-sach/doi-tra/">Đổi trả</a>
        <a href="/chinh-sach/thanh-toan/">Thanh toán</a>
        <a href="/chinh-sach/bao-mat/">Bảo mật</a>
        <a href="/chinh-sach/dieu-khoan/">Điều khoản</a>
      </nav>
    </div>
    <small>© 2026 ${site.company}. Thương hiệu AIO AI OIL · Nghiên cứu phát triển: AI LUBRICANT LAB.</small>
  </div>
</footer>
<div class="fab" aria-label="Liên hệ nhanh">
  <a class="fab-call" href="tel:${site.phoneIntl}" data-ev="click_call">Gọi ${site.phone}</a>
  <a class="fab-zalo" href="${site.zalo}" target="_blank" rel="noopener" data-ev="click_zalo">Zalo</a>
</div>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

rmSync(DIST, { recursive: true, force: true });
cpSync(join(root, "public"), DIST, { recursive: true });

const pages = [];
const todos = [];
for (const file of walk(SRC)) {
  const page = parse(file);
  page.head = fill(page.head);
  page.body = fill(page.body);
  const rel = relative(SRC, file).split(sep).join("/");
  const out = join(DIST, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, layout(page));
  for (const m of page.body.matchAll(/class="todo"/g)) todos.push(rel);
  for (const block of page.head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    JSON.parse(block[1]); // dừng build nếu JSON-LD hỏng
  }
  if (!page.meta.noindex && rel !== "404.html") pages.push(page.meta);
}

pages.sort((a, b) => a.path.localeCompare(b.path));
const urls = pages
  .map((p) => `  <url><loc>${site.domain}${p.path}</loc><lastmod>${p.updated || site.updated}</lastmod></url>`)
  .join("\n");
const pdfs = readdirSync(join(root, "public/tai-lieu"))
  .map((f) => `  <url><loc>${site.domain}/tai-lieu/${f}</loc><lastmod>${site.updated}</lastmod></url>`)
  .join("\n");
writeFileSync(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n${pdfs}\n</urlset>\n`
);
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site.domain}/sitemap.xml\n`);
writeFileSync(join(DIST, "llms.txt"), fill(readFileSync(join(root, "public/llms.txt"), "utf8")));

console.log(`Đã build ${pages.length} trang vào dist/`);
if (todos.length) {
  const count = todos.reduce((a, p) => ((a[p] = (a[p] || 0) + 1), a), {});
  console.warn("Còn chỗ cần bổ sung (class=\"todo\"):");
  for (const [p, n] of Object.entries(count)) console.warn(`  ${p}: ${n}`);
}
