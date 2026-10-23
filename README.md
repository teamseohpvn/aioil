# aioil.vn – Website dầu thủy lực AIO AW 46, AW 68

Web nhiều trang, tĩnh, chạy trên **Cloudflare Workers** (static assets + 1 Worker nhỏ nhận form). Không cần framework; build bằng Node có sẵn.

> Bản landing page cũ (HYDRO-X, Gemini intro) được giữ nguyên ở nhánh [`legacy-landing`](../../tree/legacy-landing).

## Cấu trúc

```
src/site.json          # Thông tin doanh nghiệp, hotline, Zalo, email, GA4, tên miền
src/pages/**.html      # Nội dung từng trang (khối <!--meta-->, <!--head--> + <main>)
public/                # File tĩnh: CSS, JS, ảnh, PDF TDS/SDS, favicon, llms.txt
worker/index.js        # Worker: redirect tên miền chính, POST /api/lead
build.mjs              # Ghép layout chung, sinh dist/ + sitemap.xml + robots.txt
wrangler.jsonc         # Cấu hình deploy (tên worker: aioilweb)
```

## Lệnh

```bash
npm install
npm run build     # sinh dist/, in danh sách chỗ còn class="todo"
npm run dev       # chạy thử tại http://localhost:8787
npm run deploy    # build + deploy lên Cloudflare (cần `npx wrangler login`)
```

`wrangler deploy` tự chạy build trước (khai báo `build.command` trong `wrangler.jsonc`), nên deploy bằng Cloudflare Workers Builds (kết nối GitHub) chỉ cần lệnh deploy mặc định `npx wrangler deploy`.

## Deploy lần đầu

1. **Kết nối repo:** Cloudflare Dashboard → Workers & Pages → `aioilweb` → Settings → Builds → Connect GitHub `teamseohpvn/aioil`, nhánh `main`. Hoặc chạy `npm run deploy` từ máy.
   Tên worker trong `wrangler.jsonc` là `aioilweb`, trùng với worker đang chạy tại `aioilweb.nhadat339shangdao.workers.dev`, nên deploy sẽ thay bản hiện tại. Đổi `name` nếu muốn deploy song song để xem trước.
2. **Nhận form báo giá** (bắt buộc, không có thì form báo lỗi và hướng khách gọi hotline). Đặt ít nhất một trong hai:
   - Telegram: tạo bot bằng @BotFather, lấy chat id, rồi
     ```bash
     npx wrangler secret put TELEGRAM_BOT_TOKEN
     npx wrangler secret put TELEGRAM_CHAT_ID
     ```
   - Webhook (ví dụ Google Apps Script ghi Google Sheet): `npx wrangler secret put LEAD_WEBHOOK_URL`. Worker gửi JSON `{name, phone, company, product, pack, note, page, time}`.
3. **Tên miền:** Workers → `aioilweb` → Settings → Domains & Routes → Add Custom Domain `aioil.vn` (và `www.aioil.vn`). Sau khi tên miền chạy, đặt `"CANONICAL_HOST": "aioil.vn"` trong `wrangler.jsonc` và deploy lại để mọi truy cập từ `*.workers.dev` và `www` được chuyển 301 về `https://aioil.vn`.
4. **Đo lường:** điền mã GA4 (`G-XXXX`) vào `ga4` trong `src/site.json`. Web tự gửi sự kiện `generate_lead`, `click_call`, `click_zalo`, `download_tds`, `download_sds`, `chooser_result`.
5. **Google Search Console + Bing Webmaster Tools:** thêm `aioil.vn`, gửi `https://aioil.vn/sitemap.xml`.

## Trước khi quảng bá

`npm run build` liệt kê các chỗ đánh dấu `class="todo"` cần doanh nghiệp bổ sung: người thẩm định kỹ thuật, đơn vị thử nghiệm, thời gian/phí giao hàng, tài khoản ngân hàng, chính sách đại lý, email, giờ làm việc. Email điền ở `src/site.json` sẽ tự hiện ở chân trang.

Lưu ý về ảnh: `public/img/` dùng ảnh bao bì dựng sẵn. Nhãn trên ảnh vẫn in chữ "DIN 51524 PART 2 HLP" (web đã gỡ tuyên bố này vì TDS chưa có phép thử DIN) và nắp phuy 200 L ghi "18 L". Nên thay bằng ảnh chụp thật khi có.

## Thêm trang mới

Tạo `src/pages/<duong-dan>/index.html`:

```html
<!--meta
{ "title": "…", "description": "…", "path": "/duong-dan/", "nav": "kien-thuc", "updated": "2026-11-01" }
-->
<!--head-->
<script type="application/ld+json">{ … }</script>
<!--/head-->
<main> … </main>
```

Có thể dùng `{{phone}}`, `{{zalo}}`, `{{company}}`, `{{leadForm}}` (form báo giá), `{{leadForm:aw46}}`, `{{leadForm:dai-ly}}`. Trang tự vào sitemap.
