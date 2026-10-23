// AIO AI OIL – tương tác dùng chung: gửi form, công cụ chọn dầu, sự kiện GA4.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const phone = document.body.dataset.phone || "";
  const zalo = document.body.dataset.zalo || "";
  const track = (name, params = {}) => {
    if (typeof window.gtag === "function") window.gtag("event", name, params);
  };

  // Sự kiện click gọi, Zalo, tải tài liệu
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (a.dataset.ev) track(a.dataset.ev, { link_url: href });
    else if (href.startsWith("tel:")) track("click_call");
    else if (href.includes("zalo.me")) track("click_zalo");
    if (href.endsWith(".pdf")) track(href.includes("/sds-") ? "download_sds" : "download_tds", { file: href });
  });

  // Điền sẵn sản phẩm từ ?sp=AW68
  const sp = new URLSearchParams(location.search).get("sp");
  $$("form.lead select[name=product]").forEach((sel) => {
    const opt = [...sel.options].find((o) => sp && o.value.replace(/\s/g, "").toUpperCase().endsWith(sp.toUpperCase()));
    if (opt) sel.value = opt.value;
  });

  // Gửi form
  $$("form.lead").forEach((form) => {
    const started = Date.now();
    const msg = $(".msg", form);
    const fallback = `Vui lòng gọi hoặc nhắn Zalo ${phone} để được báo giá ngay.`;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      data.page = location.pathname;
      data.elapsed = Date.now() - started;
      if (!data.name?.trim() || !/^[0-9 +().-]{8,20}$/.test((data.phone || "").trim())) {
        msg.className = "msg err";
        msg.textContent = "Vui lòng nhập họ tên và số điện thoại hợp lệ.";
        return;
      }
      const btn = $("button[type=submit]", form);
      btn.disabled = true;
      msg.className = "msg";
      msg.textContent = "Đang gửi…";
      try {
        const res = await fetch("/api/lead", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(data),
        });
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.ok) {
          msg.className = "msg ok";
          msg.textContent = "Đã nhận yêu cầu. Kỹ thuật AIO sẽ liên hệ lại trong giờ làm việc.";
          form.reset();
          track("generate_lead", { product: data.product || "", form: form.dataset.form || "lead" });
        } else {
          msg.className = "msg err";
          msg.textContent = `Chưa gửi được yêu cầu. ${fallback}`;
        }
      } catch {
        msg.className = "msg err";
        msg.textContent = `Mất kết nối. ${fallback}`;
      } finally {
        btn.disabled = false;
      }
    });
  });

  // Công cụ chọn dầu: vùng độ nhớt tối ưu 16–36 mm²/s
  // AW 46 ≈ 45–67 °C, AW 68 ≈ 54–79 °C (tính từ TDS theo ASTM D341)
  const chooser = $("#chooser");
  if (chooser) {
    const state = { oem: "0", mach: "xuong", temp: "mid" };
    const big = $("#recBig");
    const why = $("#recWhy");
    const link = $("#recLink");
    const visc = {
      46: { low: "≈ 25–46 mm²/s", mid: "≈ 17–25 mm²/s", high: "≈ 11–17 mm²/s" },
      68: { low: "≈ 35–65 mm²/s", mid: "≈ 25–35 mm²/s", high: "≈ 15–25 mm²/s" },
    };
    const render = () => {
      let g, reason;
      if (state.oem !== "0") {
        g = state.oem;
        reason = `Hãng máy khuyến cáo ISO VG ${g}. Luôn ưu tiên khuyến cáo này.`;
      } else if (state.temp === "low") {
        g = "46";
        reason = `Dầu chạy dưới 55 °C: AW 46 có độ nhớt ${visc[46].low}, sát vùng tối ưu 16–36 mm²/s hơn; AW 68 sẽ đặc (${visc[68].low}), bơm hút nặng.`;
      } else if (state.temp === "high") {
        g = "68";
        reason = `Dầu chạy trên 65 °C: AW 46 loãng còn ${visc[46].high}, gần ngưỡng tối thiểu; AW 68 vẫn giữ ${visc[68].high}.`;
      } else {
        g = state.mach === "xuong" ? "46" : "68";
        reason =
          g === "46"
            ? `Dầu 55–65 °C, máy trong xưởng: AW 46 (${visc[46].mid}) nằm trong vùng tối ưu.`
            : `Dầu 55–65 °C, tải nặng hoặc ngoài trời: chọn AW 68 (${visc[68].mid}) để dư biên khi dầu nóng lên giữa trưa.`;
      }
      big.textContent = `AIO AW ${g}`;
      why.textContent = reason;
      link.href = `/san-pham/dau-thuy-luc-aio-aw-${g}/`;
      link.textContent = `Xem AIO AW ${g}`;
      $("#recQuote").href = `/bao-gia/?sp=AW${g}`;
      return g;
    };
    $$(".opts", chooser).forEach((group) => {
      group.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        $$("button", group).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        state[group.dataset.q] = b.dataset.v;
        track("chooser_result", { grade: render() });
      });
    });
    render();
  }
})();
