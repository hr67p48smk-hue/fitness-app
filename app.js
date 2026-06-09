(() => {
  const { useState, useEffect, useRef, useCallback, useMemo } = React;

  // ===========================================================================
  // Глобальные стили: доступность (фокус с клавиатуры), уважение к
  // prefers-reduced-motion, плавная обратная связь при нажатии, размер тап-зон.
  // Внедряется один раз при загрузке — не ломает существующие inline-стили.
  // ===========================================================================
  (function injectGlobalStyles() {
    if (document.getElementById("ux-global-styles")) return;
    const css = `
      * { -webkit-tap-highlight-color: transparent; }
      html, body { overflow-x: hidden; max-width: 100%; }
      button { transition: transform .08s ease, filter .12s ease, background .15s ease; touch-action: manipulation; }
      button:active { transform: scale(0.96); }
      :focus { outline: none; }
      :focus-visible { outline: 2px solid #C97A3D; outline-offset: 2px; border-radius: 6px; }
      @keyframes uxPillPop { 0% { transform: scale(1); } 45% { transform: scale(1.28); } 100% { transform: scale(1); } }
      @keyframes uxFadeSlide { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      .ux-pop { animation: uxPillPop .32s cubic-bezier(.34,1.56,.64,1); }
      .ux-enter { animation: uxFadeSlide .32s ease both; }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
        button:active { transform: none; }
      }
    `;
    const tag = document.createElement("style");
    tag.id = "ux-global-styles";
    tag.textContent = css;
    document.head.appendChild(tag);
  })();
  // Палитра «лиса в траве» — приглушённые тёплые тона, чтобы перекликалось с иллюстрациями.
  // Имена ключей (olive/sand/bark) оставлены как было — они используются по всему коду.
  // Поменялись только значения, чтобы не переписывать тысячи ссылок.
  const C = {
    bg: "#F7F2E8",         // основной фон — тёплый кремовый
    bgWarm: "#F0E8D6",     // фон шапок и hover-состояний
    card: "#FFFFFF",
    border: "#E0D6C4",     // лёгкие границы
    borderM: "#C4B89E",    // акцентные границы
    // Основной акцент — лисий оранжевый
    olive: "#C97A3D",      // главный
    oliveM: "#D88E54",     // светлее
    oliveSoft: "#FCEEDF",  // подложка под акценты
    oliveDeep: "#993D00",  // глубокий для текста
    // Травянисто-оливковый — второй акцент
    sand: "#7A8B5C",       // главный зелёный
    sandSoft: "#E2E8D0",   // подложка
    sandDeep: "#3E4A1F",   // глубокий
    // Тёплый коричневый — третий акцент, для нейтральных вещей
    sage: "#8A7B5C",
    sageSoft: "#EDE4D0",
    bark: "#7A6A52",
    barkSoft: "#EDDED0",
    // Текст
    text: "#2E2418",       // основной
    textM: "#7A6A52",      // приглушённый
    textL: "#8A795C",      // подсказки (затемнён для контраста WCAG)
    white: "#FFFFFF",
    // Семантика
    ok: "#5A6B42",         // зелёный — для «можно»
    warn: "#A04830",       // тёплый красно-коричневый, не яркий красный
    warnSoft: "#FCEEDF",   // подложка предупреждения (та же что oliveSoft — тёплая)
    info: "#5A6B82",       // тёплый синий — для информации
    infoSoft: "#E0E4EC",
    // Месячные/цикл — розовый
    pink: "#A8525E",
    pinkSoft: "#F4DCE0",
    // Тени убраны — только бордеры
    shadow: "none",
    shadowM: "none"
  };
  const YT_LINKS = {
    glute_bridge: "https://www.youtube.com/watch?v=OUgsJ8-Vi0E",
    cable_kickback: "https://www.youtube.com/watch?v=8rFBN0bSm1U",
    leg_press: "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
    plank: "https://www.youtube.com/watch?v=pSHjTRCQxIw",
    dead_bug: "https://www.youtube.com/watch?v=4XLEnwUr1d8",
    seated_row: "https://www.youtube.com/watch?v=GZbfZ033f74",
    lat_pulldown: "https://www.youtube.com/watch?v=CAwf7n6Luuc",
    hyperext: "https://www.youtube.com/watch?v=ph3pddpKzzw",
    reverse_fly: "https://www.youtube.com/watch?v=ttvASm4fGFo",
    bird_dog: "https://www.youtube.com/watch?v=wiFNA3sqjCA",
    squat: "https://www.youtube.com/watch?v=IGRDDBOVmDQ",
    lunge: "https://www.youtube.com/watch?v=D7KaRcUTQeE",
    rdl: "https://www.youtube.com/watch?v=jEy_czb3RKA",
    adductor: "https://www.youtube.com/watch?v=3GFH6Yf_PkE",
    calf_raise: "https://www.youtube.com/watch?v=gwLzBJYoWlQ",
    vacuum: "https://www.youtube.com/watch?v=d-G4TuWwmvg",
    cat_cow: "https://www.youtube.com/watch?v=kqnua4rHVVA",
    fire_hydrant: "https://www.youtube.com/watch?v=Bmjxp-1nsiY",
    side_plank: "https://www.youtube.com/watch?v=K1ExSvBPdS8"
  };
  function YTLink({ svgKey, name }) {
    const url = YT_LINKS[svgKey];
    if (!url) return null;
    return /* @__PURE__ */ React.createElement("a", { href: url, target: "_blank", rel: "noopener noreferrer", style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 13px",
      borderRadius: 8,
      background: "#FF0000",
      color: "#fff",
      fontSize: 12,
      fontWeight: 700,
      textDecoration: "none",
      marginBottom: 10
    } }, "\u25B6 \u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043D\u0430 YouTube \u2014 ", name);
  }
  const EX_QA = {
    weight: "\u041D\u0430\u0447\u043D\u0438 \u0441 \u0432\u0435\u0441\u0430, \u043F\u0440\u0438 \u043A\u043E\u0442\u043E\u0440\u043E\u043C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 2\u20133 \u043F\u043E\u0432\u0442\u043E\u0440\u0430 \u0441\u043B\u043E\u0436\u043D\u044B\u0435, \u043D\u043E \u0442\u0435\u0445\u043D\u0438\u043A\u0430 \u043D\u0435 \u043B\u043E\u043C\u0430\u0435\u0442\u0441\u044F. \u041B\u0443\u0447\u0448\u0435 \u043C\u0435\u043D\u044C\u0448\u0435 \u2014 \u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E.",
    feel: "\u0414\u043E\u043B\u0436\u043D\u0430 \u0447\u0443\u0432\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C \u0446\u0435\u043B\u0435\u0432\u0443\u044E \u043C\u044B\u0448\u0446\u0443 \u2014 \u0436\u0436\u0435\u043D\u0438\u0435 \u0438\u043B\u0438 \u043D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u0438\u0435. \u0415\u0441\u043B\u0438 \u0447\u0443\u0432\u0441\u0442\u0432\u0443\u0435\u0448\u044C \u0434\u0440\u0443\u0433\u043E\u0435 \u043C\u0435\u0441\u0442\u043E \u2014 \u0447\u0442\u043E-\u0442\u043E \u043D\u0435 \u0442\u0430\u043A \u0441 \u0442\u0435\u0445\u043D\u0438\u043A\u043E\u0439.",
    back: "\u0411\u043E\u043B\u044C \u0432 \u0441\u043F\u0438\u043D\u0435 = \u0441\u0442\u043E\u043F. \u0423\u043C\u0435\u043D\u044C\u0448\u0438 \u0432\u0435\u0441, \u043F\u0440\u043E\u0432\u0435\u0440\u044C \u0442\u0435\u0445\u043D\u0438\u043A\u0443. \u041F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435 \u043E\u0441\u043E\u0431\u0435\u043D\u043D\u043E \u0432\u0430\u0436\u043D\u043E \u043D\u0435 \u0447\u0435\u0440\u0435\u0437 \u0431\u043E\u043B\u044C.",
    breath: "\u0412\u044B\u0434\u043E\u0445 \u043D\u0430 \u0443\u0441\u0438\u043B\u0438\u0438 (\u043D\u0430 \u043F\u043E\u0434\u044A\u0451\u043C\u0435/\u0441\u0436\u0430\u0442\u0438\u0438), \u0432\u0434\u043E\u0445 \u043D\u0430 \u0432\u043E\u0437\u0432\u0440\u0430\u0442\u0435. \u041D\u0438\u043A\u043E\u0433\u0434\u0430 \u043D\u0435 \u0437\u0430\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0439 \u0434\u044B\u0445\u0430\u043D\u0438\u0435.",
    rest: "\u041C\u0435\u0436\u0434\u0443 \u043F\u043E\u0434\u0445\u043E\u0434\u0430\u043C\u0438 60\u201390 \u0441\u0435\u043A. \u0415\u0441\u043B\u0438 \u043D\u0435 \u0443\u0441\u043F\u0435\u043B\u0430 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C\u0441\u044F \u2014 \u043F\u043E\u0434\u043E\u0436\u0434\u0438 \u0435\u0449\u0451 30 \u0441\u0435\u043A.",
    sets: "4 \u043F\u043E\u0434\u0445\u043E\u0434\u0430 \u043F\u043E 12\u201315 \u043F\u043E\u0432\u0442\u043E\u0440\u0435\u043D\u0438\u0439 \u0434\u043B\u044F \u044F\u0433\u043E\u0434\u0438\u0446 \u0438 \u043D\u043E\u0433. 3 \u043F\u043E\u0434\u0445\u043E\u0434\u0430 \u043F\u043E 12 \u2014 \u0434\u043B\u044F \u0441\u043F\u0438\u043D\u044B \u0438 \u043A\u043E\u0440\u0430.",
    progress: "\u0423\u0432\u0435\u043B\u0438\u0447\u0438\u0432\u0430\u0439 \u0432\u0435\u0441 \u043A\u043E\u0433\u0434\u0430 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 2 \u043F\u043E\u0432\u0442\u043E\u0440\u0430 \u0441\u0442\u0430\u043B\u0438 \u043B\u0451\u0433\u043A\u0438\u043C\u0438. \u041E\u0431\u044B\u0447\u043D\u043E \u044D\u0442\u043E \u0440\u0430\u0437 \u0432 2 \u043D\u0435\u0434\u0435\u043B\u0438.",
    soreness: "\u041B\u0451\u0433\u043A\u0430\u044F \u0431\u043E\u043B\u044C \u0432 \u043C\u044B\u0448\u0446\u0430\u0445 \u043D\u0430 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0434\u0435\u043D\u044C \u2014 \u043D\u043E\u0440\u043C\u0430\u043B\u044C\u043D\u043E. \u041E\u0441\u0442\u0440\u0430\u044F \u0431\u043E\u043B\u044C \u0432 \u0441\u0443\u0441\u0442\u0430\u0432\u0430\u0445 \u2014 \u043D\u0435\u0442.",
    pelvic: "\u041F\u043E\u0441\u043B\u0435 \u043A\u0430\u0436\u0434\u043E\u0439 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438: 3 \u043C\u0438\u043D \u0434\u0438\u0430\u0444\u0440\u0430\u0433\u043C\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0434\u044B\u0445\u0430\u043D\u0438\u044F \u043B\u0451\u0436\u0430. \u0422\u0430\u0437\u043E\u0432\u043E\u0435 \u0434\u043D\u043E \u0440\u0430\u0441\u0441\u043B\u0430\u0431\u043B\u044F\u0435\u0442\u0441\u044F \u043D\u0430 \u0432\u0434\u043E\u0445\u0435.",
    scoliosis: "\u0418\u0437\u0431\u0435\u0433\u0430\u0439 \u043E\u0441\u0435\u0432\u044B\u0445 \u043D\u0430\u0433\u0440\u0443\u0437\u043E\u043A \u0441\u043E \u0448\u0442\u0430\u043D\u0433\u043E\u0439 \u043D\u0430 \u043F\u043B\u0435\u0447\u0430\u0445. \u041F\u0440\u0435\u0434\u043F\u043E\u0447\u0438\u0442\u0430\u0439 \u0442\u0440\u0435\u043D\u0430\u0436\u0451\u0440 \u0421\u043C\u0438\u0442\u0430, \u0433\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u044B\u0435 \u0442\u044F\u0433\u0438, \u043F\u043B\u0430\u043D\u043A\u0438."
  };
  function AIAssistant({ exName, muscle, steps, feel }) {
    const [open, setOpen] = useState(false);
    const [answer, setAnswer] = useState(null);
    const QUICK = [
      { q: "\u041A\u0430\u043A\u043E\u0439 \u0432\u0435\u0441 \u0432\u044B\u0431\u0440\u0430\u0442\u044C?", key: "weight" },
      { q: "\u0413\u0434\u0435 \u0434\u043E\u043B\u0436\u043D\u0430 \u0447\u0443\u0432\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C?", key: "feel" },
      { q: "\u0411\u043E\u043B\u044C \u0432 \u0441\u043F\u0438\u043D\u0435 \u2014 \u0447\u0442\u043E \u0434\u0435\u043B\u0430\u0442\u044C?", key: "back" },
      { q: "\u041A\u0430\u043A \u0434\u044B\u0448\u0430\u0442\u044C?", key: "breath" },
      { q: "\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u043E\u0442\u0434\u044B\u0445\u0430\u0442\u044C \u043C\u0435\u0436\u0434\u0443 \u043F\u043E\u0434\u0445\u043E\u0434\u0430\u043C\u0438?", key: "rest" },
      { q: "\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0434\u0445\u043E\u0434\u043E\u0432 \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0435\u043D\u0438\u0439?", key: "sets" },
      { q: "\u041A\u043E\u0433\u0434\u0430 \u0443\u0432\u0435\u043B\u0438\u0447\u0438\u0432\u0430\u0442\u044C \u0432\u0435\u0441?", key: "progress" },
      { q: "\u0411\u043E\u043B\u044F\u0442 \u043C\u044B\u0448\u0446\u044B \u2014 \u043D\u043E\u0440\u043C\u0430?", key: "soreness" }
    ];
    return /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setOpen(!open);
      setAnswer(null);
    }, style: {
      width: "100%",
      padding: "9px 12px",
      borderRadius: 9,
      background: open ? C.oliveSoft : C.bgWarm,
      border: `1.5px solid ${open ? C.olive : C.border}`,
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontFamily: "inherit"
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 24, height: 24, borderRadius: 7, background: C.olive, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 } }, "💬"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.oliveDeep } }, "\u0412\u043E\u043F\u0440\u043E\u0441\u044B \u043F\u043E \u0443\u043F\u0440\u0430\u0436\u043D\u0435\u043D\u0438\u044E")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.textL } }, open ? "\u25B2" : "\u25BC")), open && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, background: C.card, borderRadius: 10, border: `1.5px solid ${C.olive}33`, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 12px", borderBottom: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 5 } }, QUICK.map((item, i) => /* @__PURE__ */ React.createElement("button", { key: i, onClick: () => setAnswer(item), style: {
      padding: "5px 9px",
      borderRadius: 7,
      border: `1px solid ${answer?.key === item.key ? C.olive : C.border}`,
      background: answer?.key === item.key ? C.oliveSoft : C.bg,
      cursor: "pointer",
      fontSize: 11,
      color: answer?.key === item.key ? C.oliveDeep : C.textM,
      fontFamily: "inherit"
    } }, item.q)))), answer && /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: C.olive, marginBottom: 5 } }, answer.q), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.text, lineHeight: 1.65 } }, EX_QA[answer.key]), answer.key === "feel" && feel && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, padding: "8px 10px", background: C.bgWarm, borderRadius: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.olive } }, "\u2713 ", exName, ": ", feel.good), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.warn, marginTop: 3 } }, "\u2717 \u041D\u0435 \u0434\u043E\u043B\u0436\u043D\u0430: ", feel.bad)))));
  }
  const DAYS = [
    {
      id: "A",
      name: "\u042F\u0433\u043E\u0434\u0438\u0446\u044B + \u041A\u043E\u0440",
      emoji: "🍑",
      clr: C.olive,
      clrS: C.oliveSoft,
      clrD: C.oliveDeep,
      totalMin: 75,
      intensity: "\u0421\u0440\u0435\u0434\u043D\u044F\u044F",
      warmup: [
        {
          name: "\u0425\u043E\u0434\u044C\u0431\u0430 \u043D\u0430 \u0431\u0435\u0433\u043E\u0432\u043E\u0439 \u0434\u043E\u0440\u043E\u0436\u043A\u0435",
          dur: "5 \u043C\u0438\u043D",
          svgKey: null,
          body: ["\u0422\u0435\u043C\u043F 5\u20136 \u043A\u043C/\u0447, \u043D\u0430\u043A\u043B\u043E\u043D 2\u20133%", "\u0421\u043F\u0438\u043D\u0430 \u043F\u0440\u044F\u043C\u0430\u044F, \u043F\u043B\u0435\u0447\u0438 \u0440\u0430\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u044B", "\u041D\u0435 \u0434\u0435\u0440\u0436\u0438\u0441\u044C \u0437\u0430 \u043F\u043E\u0440\u0443\u0447\u043D\u0438 \u2014 \u043F\u0443\u0441\u0442\u044C \u044F\u0433\u043E\u0434\u0438\u0446\u044B \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442", "\u0426\u0435\u043B\u044C: \u0440\u0430\u0437\u043E\u0433\u0440\u0435\u0442\u044C \u0441\u0443\u0441\u0442\u0430\u0432\u044B \u0438 \u0441\u0435\u0440\u0434\u0446\u0435"]
        },
        {
          name: "\u042F\u0433\u043E\u0434\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u0441\u0442\u0438\u043A \u0431\u0435\u0437 \u0432\u0435\u0441\u0430",
          dur: "2 \xD7 15 \u043F\u043E\u0432\u0442.",
          svgKey: "glute_bridge",
          body: ["\u041B\u0451\u0436\u0430 \u043D\u0430 \u0441\u043F\u0438\u043D\u0435, \u043D\u043E\u0433\u0438 \u0441\u043E\u0433\u043D\u0443\u0442\u044B, \u0441\u0442\u043E\u043F\u044B \u043D\u0430 \u0448\u0438\u0440\u0438\u043D\u0435 \u0431\u0451\u0434\u0435\u0440", "\u041F\u043E\u0434\u043D\u0438\u043C\u0430\u0439 \u0442\u0430\u0437 \u0432\u0432\u0435\u0440\u0445 \u2014 \u0441\u0436\u0438\u043C\u0430\u0439 \u044F\u0433\u043E\u0434\u0438\u0446\u044B \u043D\u0430\u0432\u0435\u0440\u0445\u0443 1 \u0441\u0435\u043A", "\u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u043E\u043F\u0443\u0441\u0442\u0438, \u043D\u0435 \u043A\u0430\u0441\u0430\u044F\u0441\u044C \u043F\u043E\u043B\u0430", "\u0427\u0443\u0432\u0441\u0442\u0432\u0443\u0439: \u043D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u0432 \u044F\u0433\u043E\u0434\u0438\u0446\u0430\u0445, \u043D\u0435 \u0432 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0435"]
        },
        {
          name: "\u041F\u043E\u0436\u0430\u0440\u043D\u044B\u0439 \u0433\u0438\u0434\u0440\u0430\u043D\u0442",
          dur: "2 \xD7 12/\u0441\u0442\u043E\u0440\u043E\u043D\u0443",
          svgKey: "fire_hydrant",
          body: ["\u041D\u0430 \u0447\u0435\u0442\u0432\u0435\u0440\u0435\u043D\u044C\u043A\u0430\u0445, \u0437\u0430\u043F\u044F\u0441\u0442\u044C\u044F \u043F\u043E\u0434 \u043F\u043B\u0435\u0447\u0430\u043C\u0438", "\u041F\u043E\u0434\u043D\u0438\u043C\u0438 \u0441\u043E\u0433\u043D\u0443\u0442\u0443\u044E \u043D\u043E\u0433\u0443 \u0432 \u0441\u0442\u043E\u0440\u043E\u043D\u0443 \u2014 \u0431\u0435\u0434\u0440\u043E \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u044C\u043D\u043E \u043F\u043E\u043B\u0443", "\u0422\u0430\u0437 \u041D\u0415 \u0437\u0430\u0432\u0430\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0432 \u0441\u0442\u043E\u0440\u043E\u043D\u0443", "\u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u043E\u043F\u0443\u0441\u0442\u0438 \u2014 \u044D\u0442\u043E \u0442\u043E\u0436\u0435 \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0430"]
        }
      ],
      exercises: [
        {
          id: "a1",
          name: "\u042F\u0433\u043E\u0434\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u0441\u0442\u0438\u043A \u0432 \u0442\u0440\u0435\u043D\u0430\u0436\u0451\u0440\u0435 \u0421\u043C\u0438\u0442\u0430",
          sets: 4,
          repsT: "12\u201315",
          rest: 75,
          wt: "20\u201350 \u043A\u0433",
          muscle: "\u0411\u043E\u043B\u044C\u0448\u0430\u044F \u044F\u0433\u043E\u0434\u0438\u0447\u043D\u0430\u044F",
          svgKey: "glute_bridge",
          scol: "\u2713",
          scolNote: "\u041F\u043E\u0437\u0432\u043E\u043D\u043E\u0447\u043D\u0438\u043A \u043D\u0435\u0439\u0442\u0440\u0430\u043B\u0435\u043D \u2014 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E",
          feel: { good: "\u0416\u0436\u0435\u043D\u0438\u0435 \u0432 \u044F\u0433\u043E\u0434\u0438\u0446\u0430\u0445 \u043D\u0430\u0432\u0435\u0440\u0445\u0443", bad: "\u0411\u043E\u043B\u044C \u0432 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0435" },
          steps: ["\u0421\u043A\u0430\u043C\u044C\u044F \u043F\u043E\u043F\u0435\u0440\u0451\u043A \u0442\u0440\u0435\u043D\u0430\u0436\u0451\u0440\u0430 \u2014 \u043B\u043E\u043F\u0430\u0442\u043A\u0438 (\u043D\u0435 \u0448\u0435\u044F!) \u043D\u0430 \u043A\u0440\u0430\u044E", "\u0421\u0442\u043E\u043F\u044B \u0447\u0443\u0442\u044C \u0448\u0438\u0440\u0435 \u0431\u0451\u0434\u0435\u0440, \u043D\u043E\u0441\u043A\u0438 \u0441\u043B\u0435\u0433\u043A\u0430 \u043D\u0430\u0440\u0443\u0436\u0443", "\u0428\u0442\u0430\u043D\u0433\u0430 \u043D\u0430 \u0431\u0451\u0434\u0440\u0430\u0445 \u2014 \u043F\u043E\u0434\u043B\u043E\u0436\u0438 \u043F\u043E\u043B\u043E\u0442\u0435\u043D\u0446\u0435 \u0438\u043B\u0438 \u043C\u044F\u0433\u043A\u0438\u0439 \u0432\u0430\u043B\u0438\u043A", "\u041E\u043F\u0443\u0441\u0442\u0438 \u0442\u0430\u0437 \u0432\u043D\u0438\u0437 \u2014 \u044D\u0442\u043E \u0441\u0442\u0430\u0440\u0442\u043E\u0432\u0430\u044F \u043F\u043E\u0437\u0438\u0446\u0438\u044F", "\u041C\u043E\u0449\u043D\u043E \u0442\u043E\u043B\u043A\u043D\u0438 \u0442\u0430\u0437 \u0432\u0432\u0435\u0440\u0445: \u043F\u0440\u044F\u043C\u0430\u044F \u043B\u0438\u043D\u0438\u044F \u043F\u043B\u0435\u0447\u043E\u2013\u0431\u0435\u0434\u0440\u043E\u2013\u043A\u043E\u043B\u0435\u043D\u043E", "\u0421\u043E\u0436\u043C\u0438 \u044F\u0433\u043E\u0434\u0438\u0446\u044B \u043D\u0430\u0432\u0435\u0440\u0445\u0443 2 \u0441\u0435\u043A\u0443\u043D\u0434\u044B", "\u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u043E\u043F\u0443\u0441\u0442\u0438 \u0437\u0430 3 \u0441\u0435\u043A\u0443\u043D\u0434\u044B"],
          err: ["\u041F\u043E\u044F\u0441\u043D\u0438\u0446\u0430 \u0432\u044B\u0433\u0438\u0431\u0430\u0435\u0442\u0441\u044F \u043D\u0430\u0432\u0435\u0440\u0445\u0443 \u2192 \u0443\u043C\u0435\u043D\u044C\u0448\u0438 \u0430\u043C\u043F\u043B\u0438\u0442\u0443\u0434\u0443", "\u041A\u043E\u043B\u0435\u043D\u0438 \u0437\u0430\u0432\u0430\u043B\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0432\u043D\u0443\u0442\u0440\u044C \u2192 \u0441\u043B\u0435\u0434\u0438 \u0437\u0430 \u043D\u043E\u0441\u043A\u0430\u043C\u0438"],
          prog: "20\u043A\u0433\u219230\u043A\u0433\u219240\u043A\u0433\u219250\u043A\u0433 (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438 \u043D\u0430 \u043A\u0430\u0436\u0434\u044B\u0439 \u0432\u0435\u0441)"
        },
        {
          id: "a2",
          name: "\u041E\u0442\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u043D\u043E\u0433 \u0432 \u043A\u0440\u043E\u0441\u0441\u043E\u0432\u0435\u0440\u0435",
          sets: 3,
          repsT: "15/\u0441\u0442\u043E\u0440\u043E\u043D\u0443",
          rest: 60,
          wt: "5\u201320 \u043A\u0433",
          muscle: "\u0421\u0440\u0435\u0434\u043D\u044F\u044F \u044F\u0433\u043E\u0434\u0438\u0447\u043D\u0430\u044F",
          svgKey: "generic",
          scol: "\u2713",
          scolNote: "\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E",
          feel: { good: "\u0416\u0436\u0435\u043D\u0438\u0435 \u0441\u0431\u043E\u043A\u0443 \u044F\u0433\u043E\u0434\u0438\u0446\u044B", bad: "\u041D\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0432 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0435" },
          steps: ["\u041C\u0430\u043D\u0436\u0435\u0442\u0430 \u043D\u0430 \u043B\u043E\u0434\u044B\u0436\u043A\u0435, \u043D\u0438\u0436\u043D\u0438\u0439 \u0431\u043B\u043E\u043A \u043A\u0440\u043E\u0441\u0441\u043E\u0432\u0435\u0440\u0430", "\u0412\u0441\u0442\u0430\u043D\u044C \u0431\u043E\u043A\u043E\u043C \u043A \u0442\u0440\u0435\u043D\u0430\u0436\u0451\u0440\u0443, \u0432\u043E\u0437\u044C\u043C\u0438\u0441\u044C \u0437\u0430 \u0441\u0442\u043E\u0439\u043A\u0443", "\u041B\u0451\u0433\u043A\u0438\u0439 \u043D\u0430\u043A\u043B\u043E\u043D \u0432\u043F\u0435\u0440\u0451\u0434 10\u201315\xB0", "\u041E\u0442\u0432\u0435\u0434\u0438 \u043D\u043E\u0433\u0443 \u0432 \u0441\u0442\u043E\u0440\u043E\u043D\u0443 \u0438 \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u043D\u0430\u0437\u0430\u0434 \u2014 \u0430\u043C\u043F\u043B\u0438\u0442\u0443\u0434\u0430 30\u201345\xB0", "\u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u0432\u0435\u0440\u043D\u0438\u0441\u044C, \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u0438\u0440\u0443\u044F \u0441\u043E\u043F\u0440\u043E\u0442\u0438\u0432\u043B\u0435\u043D\u0438\u0435"],
          err: ["\u041A\u043E\u0440\u043F\u0443\u0441 \u0437\u0430\u0432\u0430\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u2192 \u043A\u0440\u0435\u043F\u0447\u0435 \u0434\u0435\u0440\u0436\u0438\u0441\u044C \u0437\u0430 \u0441\u0442\u043E\u0439\u043A\u0443", "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u0430\u044F \u0430\u043C\u043F\u043B\u0438\u0442\u0443\u0434\u0430 \u2192 \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u0442\u0441\u044F \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0430"],
          prog: "5\u043A\u0433\u21928\u043A\u0433\u219212\u043A\u0433\u219215\u043A\u0433 (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)"
        },
        {
          id: "a3",
          name: "\u0416\u0438\u043C \u043D\u043E\u0433\u0430\u043C\u0438 (\u0432\u044B\u0441\u043E\u043A\u0430\u044F \u043F\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430)",
          sets: 4,
          repsT: "12",
          rest: 90,
          wt: "30\u201370 \u043A\u0433",
          muscle: "\u042F\u0433\u043E\u0434\u0438\u0446\u044B + \u0417\u0430\u0434\u043D\u044F\u044F \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u0431\u0435\u0434\u0440\u0430",
          svgKey: "leg_press",
          scol: "\u2713",
          scolNote: "\u0421\u043F\u0438\u043D\u0430 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0430\u043D\u0430 \u2014 \u043E\u0447\u0435\u043D\u044C \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E",
          feel: { good: "\u0420\u0430\u0431\u043E\u0442\u0430 \u044F\u0433\u043E\u0434\u0438\u0446 \u0438 \u0437\u0430\u0434\u043D\u0435\u0439 \u0447\u0430\u0441\u0442\u0438 \u0431\u0435\u0434\u0440\u0430", bad: "\u0411\u043E\u043B\u044C \u0432 \u043A\u043E\u043B\u0435\u043D\u044F\u0445 \u0438\u043B\u0438 \u043E\u0442\u0440\u044B\u0432 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u044B" },
          steps: ["\u041D\u043E\u0433\u0438 \u0432\u044B\u0441\u043E\u043A\u043E \u0438 \u0448\u0438\u0440\u043E\u043A\u043E \u043D\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435, \u043D\u043E\u0441\u043A\u0438 30\u201345\xB0", "\u041F\u043E\u044F\u0441\u043D\u0438\u0446\u0430 \u043F\u0440\u0438\u0436\u0430\u0442\u0430 \u043A \u0441\u043F\u0438\u043D\u043A\u0435 \u2014 \u043D\u0435 \u043E\u0442\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F!", "\u041E\u043F\u0443\u0441\u043A\u0430\u0439 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443 3 \u0441\u0435\u043A\u0443\u043D\u0434\u044B \u0434\u043E \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u0438 \u0431\u0451\u0434\u0435\u0440", "\u0412\u044B\u0436\u0438\u043C\u0430\u0439 \u0447\u0435\u0440\u0435\u0437 \u043F\u044F\u0442\u043A\u0438 \u2014 \u043D\u0435 \u0447\u0435\u0440\u0435\u0437 \u043D\u043E\u0441\u043A\u0438", "\u041A\u043E\u043B\u0435\u043D\u0438 \u0432 \u043E\u0434\u043D\u043E\u0439 \u043F\u043B\u043E\u0441\u043A\u043E\u0441\u0442\u0438 \u0441 \u043D\u043E\u0441\u043A\u0430\u043C\u0438 \u043D\u0430 \u0432\u0441\u0451\u043C \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0438"],
          err: ["\u041F\u043E\u044F\u0441\u043D\u0438\u0446\u0430 \u043E\u0442\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u2192 \u0443\u043C\u0435\u043D\u044C\u0448\u0438 \u0430\u043C\u043F\u043B\u0438\u0442\u0443\u0434\u0443", "\u041A\u043E\u043B\u0435\u043D\u0438 \u0437\u0430\u0432\u0430\u043B\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0432\u043D\u0443\u0442\u0440\u044C \u2192 \u043A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043E\u043F\u0430\u0441\u043D\u043E!"],
          prog: "30\u043A\u0433\u219240\u043A\u0433\u219255\u043A\u0433\u219270\u043A\u0433 (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)"
        },
        {
          id: "a4",
          name: "\u0420\u0430\u0437\u0433\u0438\u0431\u0430\u043D\u0438\u0435 \u0431\u0435\u0434\u0440\u0430 \u0432 \u0442\u0440\u0435\u043D\u0430\u0436\u0451\u0440\u0435",
          sets: 3,
          repsT: "15/\u0441\u0442\u043E\u0440\u043E\u043D\u0443",
          rest: 60,
          wt: "15\u201330 \u043A\u0433",
          muscle: "\u0411\u043E\u043B\u044C\u0448\u0430\u044F \u044F\u0433\u043E\u0434\u0438\u0447\u043D\u0430\u044F (\u043D\u0438\u0436\u043D\u044F\u044F \u0447\u0430\u0441\u0442\u044C)",
          svgKey: "generic",
          scol: "\u2713",
          scolNote: "\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E",
          feel: { good: "\u0416\u0436\u0435\u043D\u0438\u0435 \u0443 \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u044F \u044F\u0433\u043E\u0434\u0438\u0446\u044B", bad: "\u041D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u0432 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0435" },
          steps: ["\u041C\u0430\u043D\u0436\u0435\u0442\u0430 \u043D\u0430 \u043B\u043E\u0434\u044B\u0436\u043A\u0435, \u0432\u0441\u0442\u0430\u043D\u044C \u0432 \u0442\u0440\u0435\u043D\u0430\u0436\u0451\u0440", "\u041A\u043E\u0440\u043F\u0443\u0441 \u0441\u043B\u0435\u0433\u043A\u0430 \u043D\u0430\u043A\u043B\u043E\u043D\u0438 \u0432\u043F\u0435\u0440\u0451\u0434, \u0434\u0435\u0440\u0436\u0438\u0441\u044C \u0437\u0430 \u0440\u0443\u0447\u043A\u0438", "\u041D\u043E\u0433\u0430 \u0443\u0445\u043E\u0434\u0438\u0442 \u043D\u0430\u0437\u0430\u0434 \u0442\u043E\u043B\u044C\u043A\u043E \u0437\u0430 \u0441\u0447\u0451\u0442 \u044F\u0433\u043E\u0434\u0438\u0446\u044B \u2014 20\u201330\xB0", "\u0421\u043E\u0436\u043C\u0438 \u044F\u0433\u043E\u0434\u0438\u0446\u0443 \u043D\u0430\u0432\u0435\u0440\u0445\u0443 1 \u0441\u0435\u043A", "\u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u043E\u043F\u0443\u0441\u0442\u0438 \u0437\u0430 3 \u0441\u0435\u043A\u0443\u043D\u0434\u044B"],
          err: ["\u041D\u043E\u0433\u0430 \u0443\u0445\u043E\u0434\u0438\u0442 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0432\u044B\u0441\u043E\u043A\u043E \u2192 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0430 \u043A\u043E\u043C\u043F\u0435\u043D\u0441\u0438\u0440\u0443\u0435\u0442", "\u041A\u043E\u0440\u043F\u0443\u0441 \u0440\u0430\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F"],
          prog: "15\u043A\u0433\u219222\u043A\u0433\u219228\u043A\u0433 (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)"
        },
        {
          id: "a5",
          name: "\u041F\u043B\u0430\u043D\u043A\u0430 \u043D\u0430 \u043F\u0440\u0435\u0434\u043F\u043B\u0435\u0447\u044C\u044F\u0445",
          sets: 3,
          repsT: "40 \u0441\u0435\u043A",
          rest: 60,
          wt: "\u2014",
          muscle: "\u041A\u043E\u0440 \u2014 \u043F\u0440\u044F\u043C\u0430\u044F + \u043F\u043E\u043F\u0435\u0440\u0435\u0447\u043D\u0430\u044F \u043C\u044B\u0448\u0446\u0430 \u0436\u0438\u0432\u043E\u0442\u0430",
          svgKey: "plank",
          scol: "\u26A0",
          scolNote: "\u0421\u043B\u0435\u0434\u0438 \u0437\u0430 \u043D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u044B\u043C \u043F\u043E\u0437\u0432\u043E\u043D\u043E\u0447\u043D\u0438\u043A\u043E\u043C",
          feel: { good: "\u041D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u0436\u0438\u0432\u043E\u0442\u0430 \u0438 \u0440\u0443\u043A", bad: "\u0411\u043E\u043B\u044C \u0432 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0435" },
          steps: ["\u041B\u043E\u043A\u0442\u0438 \u0441\u0442\u0440\u043E\u0433\u043E \u043F\u043E\u0434 \u043F\u043B\u0435\u0447\u0430\u043C\u0438, \u043F\u0440\u0435\u0434\u043F\u043B\u0435\u0447\u044C\u044F \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u044C\u043D\u044B", "\u0422\u0435\u043B\u043E \u2014 \u043F\u0440\u044F\u043C\u0430\u044F \u043B\u0438\u043D\u0438\u044F \u043E\u0442 \u0433\u043E\u043B\u043E\u0432\u044B \u0434\u043E \u043F\u044F\u0442\u043E\u043A", "\u0416\u0438\u0432\u043E\u0442 \u0432\u0442\u044F\u043D\u0443\u0442, \u044F\u0433\u043E\u0434\u0438\u0446\u044B \u0447\u0443\u0442\u044C \u043D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u044B", "\u0413\u043E\u043B\u043E\u0432\u0430 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0435\u0442 \u043B\u0438\u043D\u0438\u044E \u043F\u043E\u0437\u0432\u043E\u043D\u043E\u0447\u043D\u0438\u043A\u0430", "\u0414\u044B\u0448\u0438 \u0440\u0430\u0432\u043D\u043E\u043C\u0435\u0440\u043D\u043E \u2014 \u043D\u0435 \u0437\u0430\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0439 \u0434\u044B\u0445\u0430\u043D\u0438\u0435"],
          err: ["\u0422\u0430\u0437 \u0432\u044B\u043F\u0438\u0440\u0430\u0435\u0442 \u0432\u0432\u0435\u0440\u0445 \u2192 \u043D\u0435 \u0443\u043F\u0440\u043E\u0449\u0430\u0439 \u0442\u0430\u043A", "\u0422\u0430\u0437 \u043F\u0440\u043E\u0432\u0438\u0441\u0430\u0435\u0442 \u0432\u043D\u0438\u0437 \u2192 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0430 \u0441\u0442\u0440\u0430\u0434\u0430\u0435\u0442"],
          prog: "30\u0441\u0435\u043A\u219240\u0441\u0435\u043A\u219250\u0441\u0435\u043A\u219260\u0441\u0435\u043A (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)"
        },
        {
          id: "a6",
          name: "Dead Bug",
          sets: 3,
          repsT: "8/\u0441\u0442\u043E\u0440\u043E\u043D\u0443",
          rest: 60,
          wt: "\u2014",
          muscle: "\u0413\u043B\u0443\u0431\u043E\u043A\u0438\u0439 \u043A\u043E\u0440 \xB7 \u041F\u043E\u043F\u0435\u0440\u0435\u0447\u043D\u0430\u044F \u043C\u044B\u0448\u0446\u0430",
          svgKey: "dead_bug",
          scol: "\u2713",
          scolNote: "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u043E\u0432\u0430\u043D\u043E \u043F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435",
          feel: { good: "\u041B\u0451\u0433\u043A\u043E\u0435 \u043D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u0436\u0438\u0432\u043E\u0442\u0430", bad: "\u041E\u0442\u0440\u044B\u0432 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u044B \u043E\u0442 \u043F\u043E\u043B\u0430" },
          steps: ["\u041B\u0451\u0436\u0430 \u043D\u0430 \u0441\u043F\u0438\u043D\u0435. \u0420\u0443\u043A\u0438 \u0432\u0435\u0440\u0442\u0438\u043A\u0430\u043B\u044C\u043D\u043E \u043D\u0430\u0434 \u043F\u043B\u0435\u0447\u0430\u043C\u0438. \u041D\u043E\u0433\u0438 \u043F\u043E\u0434 90\xB0", "\u0413\u041B\u0410\u0412\u041D\u041E\u0415: \u043F\u0440\u0438\u0436\u043C\u0438 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0443 \u043A \u043F\u043E\u043B\u0443 \u0438 \u043D\u0435 \u043E\u0442\u0440\u044B\u0432\u0430\u0439", "\u041E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043E\u043F\u0443\u0441\u043A\u0430\u0439 \u043F\u0440\u0430\u0432\u0443\u044E \u0440\u0443\u043A\u0443 \u043D\u0430\u0434 \u0433\u043E\u043B\u043E\u0432\u043E\u0439 \u0438 \u043B\u0435\u0432\u0443\u044E \u043D\u043E\u0433\u0443 \u0432\u043D\u0438\u0437", "\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438 \u043D\u043E\u0433\u0443 \u0432 5\u201310 \u0441\u043C \u043E\u0442 \u043F\u043E\u043B\u0430 \u2014 \u043D\u0435 \u043A\u0430\u0441\u0430\u0439\u0441\u044F", "\u0412\u0435\u0440\u043D\u0438\u0441\u044C. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u0434\u0440\u0443\u0433\u043E\u0439 \u0441\u0442\u043E\u0440\u043E\u043D\u043E\u0439. \u0422\u043E\u043B\u044C\u043A\u043E \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E"],
          err: ["\u041F\u043E\u044F\u0441\u043D\u0438\u0446\u0430 \u043E\u0442\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u2192 \u0443\u043C\u0435\u043D\u044C\u0448\u0438 \u0430\u043C\u043F\u043B\u0438\u0442\u0443\u0434\u0443 \u043D\u043E\u0433\u0438", "\u0422\u043E\u0440\u043E\u043F\u0438\u0448\u044C\u0441\u044F \u2192 \u044D\u0442\u043E \u0443\u043F\u0440\u0430\u0436\u043D\u0435\u043D\u0438\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E"],
          prog: "8\u043F\u043E\u0432\u0442\u219210\u043F\u043E\u0432\u0442\u219212\u043F\u043E\u0432\u0442\u2192+1\u043A\u0433 \u0433\u0430\u043D\u0442\u0435\u043B\u044C (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)",
          beginner: "\u0415\u0441\u043B\u0438 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0430 \u043E\u0442\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u2014 \u043F\u0440\u043E\u0441\u0442\u043E \u043F\u043E\u0434\u043D\u0438\u043C\u0430\u0439 \u0442\u043E\u043B\u044C\u043A\u043E \u0440\u0443\u043A\u0443, \u043D\u043E\u0433\u0438 \u0434\u0435\u0440\u0436\u0438 \u0441\u0442\u0430\u0442\u0438\u0447\u043D\u043E. \u042D\u0442\u043E \u043F\u043E\u043B\u043D\u043E\u0446\u0435\u043D\u043D\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442 \u0434\u043B\u044F \u0441\u0442\u0430\u0440\u0442\u0430."
        }
      ],
      cooldown: [
        {
          name: "\u041F\u043E\u0437\u0430 \u0433\u043E\u043B\u0443\u0431\u044F \u2014 \u0440\u0430\u0441\u0442\u044F\u0436\u043A\u0430 \u044F\u0433\u043E\u0434\u0438\u0447\u043D\u043E\u0439",
          dur: "60 \u0441\u0435\u043A/\u0441\u0442\u043E\u0440\u043E\u043D\u0443",
          svgKey: "generic",
          body: ["\u041E\u0434\u043D\u0430 \u043D\u043E\u0433\u0430 \u0441\u043E\u0433\u043D\u0443\u0442\u0430 \u043F\u0435\u0440\u0435\u0434 \u0441\u043E\u0431\u043E\u0439, \u0434\u0440\u0443\u0433\u0430\u044F \u0432\u044B\u0442\u044F\u043D\u0443\u0442\u0430 \u043D\u0430\u0437\u0430\u0434", "\u041E\u043F\u0443\u0441\u0442\u0438\u0441\u044C \u043D\u0430 \u043F\u0440\u0435\u0434\u043F\u043B\u0435\u0447\u044C\u044F \u2014 \u043D\u0435 \u0437\u0430\u0432\u0430\u043B\u0438\u0432\u0430\u0439 \u043A\u043E\u0440\u043F\u0443\u0441 \u0432 \u0441\u0442\u043E\u0440\u043E\u043D\u0443", "\u0414\u044B\u0448\u0438 \u0433\u043B\u0443\u0431\u043E\u043A\u043E \u2014 \u043D\u0430 \u0432\u044B\u0434\u043E\u0445\u0435 \u043F\u043E\u0437\u0432\u043E\u043B\u044F\u0439 \u043C\u044B\u0448\u0446\u0430\u043C \u0440\u0430\u0441\u0441\u043B\u0430\u0431\u0438\u0442\u044C\u0441\u044F", "\u0414\u043E\u043B\u0436\u043D\u043E \u0447\u0443\u0432\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u0433\u043B\u0443\u0431\u043E\u043A\u043E\u0435 \u0440\u0430\u0441\u0442\u044F\u0436\u0435\u043D\u0438\u0435 \u0432 \u044F\u0433\u043E\u0434\u0438\u0446\u0435"]
        },
        {
          name: "\u0420\u0430\u0441\u0442\u044F\u0436\u043A\u0430 \u0441\u0433\u0438\u0431\u0430\u0442\u0435\u043B\u0435\u0439 \u0431\u0435\u0434\u0440\u0430",
          dur: "45 \u0441\u0435\u043A/\u0441\u0442\u043E\u0440\u043E\u043D\u0443",
          svgKey: "generic",
          body: ["\u041E\u0434\u043D\u043E \u043A\u043E\u043B\u0435\u043D\u043E \u043D\u0430 \u043F\u043E\u043B\u0443, \u0434\u0440\u0443\u0433\u0430\u044F \u043D\u043E\u0433\u0430 \u0432\u043F\u0435\u0440\u0435\u0434\u0438 \u0441\u043E\u0433\u043D\u0443\u0442\u0430", "\u0422\u0430\u0437 \u043E\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F \u0432\u043D\u0438\u0437 \u2014 \u043D\u0435 \u043D\u0430\u043A\u043B\u043E\u043D\u044F\u0439 \u043A\u043E\u0440\u043F\u0443\u0441 \u0432\u043F\u0435\u0440\u0451\u0434", "\u041F\u043E\u0447\u0443\u0432\u0441\u0442\u0432\u0443\u0439 \u0440\u0430\u0441\u0442\u044F\u0436\u0435\u043D\u0438\u0435 \u0441\u043F\u0435\u0440\u0435\u0434\u0438 \u0431\u0435\u0434\u0440\u0430 \u043E\u043F\u043E\u0440\u043D\u043E\u0439 \u043D\u043E\u0433\u0438", "\u041C\u043E\u0436\u043D\u043E \u043F\u043E\u0434\u043D\u044F\u0442\u044C \u0440\u0443\u043A\u0438 \u0432\u0432\u0435\u0440\u0445 \u0434\u043B\u044F \u0443\u0441\u0438\u043B\u0435\u043D\u0438\u044F"]
        },
        {
          name: "\u0414\u0438\u0430\u0444\u0440\u0430\u0433\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u0434\u044B\u0445\u0430\u043D\u0438\u0435 \u2014 \u0440\u0430\u0441\u0441\u043B\u0430\u0431\u043B\u0435\u043D\u0438\u0435 \u0442\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u0434\u043D\u0430",
          dur: "3 \u043C\u0438\u043D",
          svgKey: null,
          body: ["\u041B\u0451\u0436\u0430 \u043D\u0430 \u0441\u043F\u0438\u043D\u0435, \u043D\u043E\u0433\u0438 \u0441\u043E\u0433\u043D\u0443\u0442\u044B", "\u041E\u0434\u043D\u0430 \u0440\u0443\u043A\u0430 \u043D\u0430 \u0436\u0438\u0432\u043E\u0442\u0435 \u2014 \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u0438\u0440\u0443\u0435\u0442 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435", "\u0412\u0434\u043E\u0445 \u043D\u043E\u0441\u043E\u043C: \u0436\u0438\u0432\u043E\u0442 \u043F\u043E\u0434\u043D\u0438\u043C\u0430\u0435\u0442\u0441\u044F, \u0442\u0430\u0437\u043E\u0432\u043E\u0435 \u0434\u043D\u043E \u0440\u0430\u0441\u0441\u043B\u0430\u0431\u043B\u044F\u0435\u0442\u0441\u044F \u0438 \u043E\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F", "\u0412\u044B\u0434\u043E\u0445 \u0440\u0442\u043E\u043C: \u0436\u0438\u0432\u043E\u0442 \u043E\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F. \u0411\u0435\u0437 \u043D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u0438\u044F \u0432\u043D\u0438\u0437\u0443"]
        }
      ]
    },
    {
      id: "B",
      name: "\u0421\u043F\u0438\u043D\u0430 + \u041A\u043E\u0440",
      emoji: "🦅",
      clr: C.bark,
      clrS: C.barkSoft,
      clrD: "#5A4A32",
      totalMin: 77,
      intensity: "\u0421\u0440\u0435\u0434\u043D\u044F\u044F",
      warmup: [
        {
          name: "\u042D\u043B\u043B\u0438\u043F\u0441\u043E\u0438\u0434",
          dur: "5 \u043C\u0438\u043D",
          svgKey: null,
          body: ["\u041B\u0451\u0433\u043A\u0438\u0439 \u0442\u0435\u043C\u043F \u0431\u0435\u0437 \u043D\u0430\u043A\u043B\u043E\u043D\u0430 \u0432\u043F\u0435\u0440\u0451\u0434", "\u0421\u043F\u0438\u043D\u0430 \u043F\u0440\u044F\u043C\u0430\u044F, \u0434\u0435\u0440\u0436\u0438\u0441\u044C \u0437\u0430 \u0440\u0443\u0447\u043A\u0438", "\u042D\u043B\u043B\u0438\u043F\u0441 \u043B\u0443\u0447\u0448\u0435 \u0431\u0435\u0433\u043E\u0432\u043E\u0439 \u043F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435 \u2014 \u043D\u0435\u0442 \u0443\u0434\u0430\u0440\u043D\u043E\u0439 \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0438", "\u0426\u0435\u043B\u044C: \u0440\u0430\u0437\u043E\u0433\u0440\u0435\u0442\u044C \u0441\u043F\u0438\u043D\u0443 \u0438 \u043F\u043B\u0435\u0447\u0438"]
        },
        {
          name: "\u041A\u043E\u0448\u043A\u0430-\u043A\u043E\u0440\u043E\u0432\u0430",
          dur: "2 \xD7 10 \u043F\u043E\u0432\u0442.",
          svgKey: "cat_cow",
          body: ["\u041D\u0430 \u0447\u0435\u0442\u0432\u0435\u0440\u0435\u043D\u044C\u043A\u0430\u0445, \u0437\u0430\u043F\u044F\u0441\u0442\u044C\u044F \u043F\u043E\u0434 \u043F\u043B\u0435\u0447\u0430\u043C\u0438", "\u0412\u0434\u043E\u0445: \u0436\u0438\u0432\u043E\u0442 \u043E\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F, \u0441\u043F\u0438\u043D\u0430 \u043F\u0440\u043E\u0433\u0438\u0431\u0430\u0435\u0442\u0441\u044F \u0432\u043D\u0438\u0437 (\u043A\u043E\u0440\u043E\u0432\u0430)", "\u0412\u044B\u0434\u043E\u0445: \u0441\u043F\u0438\u043D\u0430 \u0432\u044B\u0433\u0438\u0431\u0430\u0435\u0442\u0441\u044F \u0434\u0443\u0433\u043E\u0439 \u0432\u0432\u0435\u0440\u0445, \u043F\u043E\u0434\u0431\u043E\u0440\u043E\u0434\u043E\u043A \u043A \u0433\u0440\u0443\u0434\u0438 (\u043A\u043E\u0448\u043A\u0430)", "\u0421\u043B\u0435\u0434\u0443\u0439 \u0437\u0430 \u0434\u044B\u0445\u0430\u043D\u0438\u0435\u043C \u2014 \u043D\u0435 \u0442\u043E\u0440\u043E\u043F\u0438\u0441\u044C"]
        },
        {
          name: "\u0420\u0430\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u0440\u0443\u043A \u0441 \u043B\u0435\u043D\u0442\u043E\u0439",
          dur: "2 \xD7 12",
          svgKey: "reverse_fly",
          body: ["\u0421\u0442\u043E\u0438\u0448\u044C, \u043B\u0435\u043D\u0442\u0430 \u0432 \u043E\u0431\u0435\u0438\u0445 \u0440\u0443\u043A\u0430\u0445 \u043F\u0435\u0440\u0435\u0434 \u0441\u043E\u0431\u043E\u0439", "\u0420\u0430\u0437\u0432\u043E\u0434\u0438 \u043F\u0440\u044F\u043C\u044B\u0435 \u0440\u0443\u043A\u0438 \u0432 \u0441\u0442\u043E\u0440\u043E\u043D\u044B \u0434\u043E \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u0438 \u0441 \u043F\u043E\u043B\u043E\u043C", "\u0421\u0432\u043E\u0434\u0438\u0448\u044C \u043B\u043E\u043F\u0430\u0442\u043A\u0438 \u2014 \u044D\u0442\u043E \u0433\u043B\u0430\u0432\u043D\u043E\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435", "\u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0448\u044C"]
        }
      ],
      exercises: [
        {
          id: "b1",
          name: "\u0422\u044F\u0433\u0430 \u0433\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0431\u043B\u043E\u043A\u0430 \u0441\u0438\u0434\u044F",
          sets: 4,
          repsT: "12",
          rest: 75,
          wt: "20\u201350 \u043A\u0433",
          muscle: "\u0421\u0440\u0435\u0434\u043D\u044F\u044F \u0441\u043F\u0438\u043D\u0430 \xB7 \u0420\u043E\u043C\u0431\u043E\u0432\u0438\u0434\u043D\u044B\u0435",
          svgKey: "seated_row",
          scol: "\u2713",
          scolNote: "\u041B\u0443\u0447\u0448\u0435\u0435 \u0443\u043F\u0440\u0430\u0436\u043D\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u043E\u0441\u0430\u043D\u043A\u0438 \u043F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435",
          feel: { good: "\u0421\u0436\u0430\u0442\u0438\u0435 \u0432 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435 \u0441\u043F\u0438\u043D\u044B \u043C\u0435\u0436\u0434\u0443 \u043B\u043E\u043F\u0430\u0442\u043A\u0430\u043C\u0438", bad: "\u0422\u044F\u0433\u0430 \u0437\u0430 \u0441\u0447\u0451\u0442 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u044B \u0438\u043B\u0438 \u0442\u043E\u043B\u044C\u043A\u043E \u0440\u0443\u043A\u0430\u043C\u0438" },
          steps: ["\u0421\u044F\u0434\u044C, \u0441\u0442\u043E\u043F\u044B \u0432 \u0443\u043F\u043E\u0440\u044B, \u043A\u043E\u043B\u0435\u043D\u0438 \u0441\u043B\u0435\u0433\u043A\u0430 \u0441\u043E\u0433\u043D\u0443\u0442\u044B", "\u041D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u044B\u0439 \u0445\u0432\u0430\u0442 \u2014 \u043B\u0430\u0434\u043E\u043D\u0438 \u0441\u043C\u043E\u0442\u0440\u044F\u0442 \u0434\u0440\u0443\u0433 \u043A \u0434\u0440\u0443\u0433\u0443", "\u0428\u0410\u0413 1: \u043F\u043E\u0442\u044F\u043D\u0438 \u043B\u043E\u043F\u0430\u0442\u043A\u0438 \u043D\u0430\u0437\u0430\u0434 \u0438 \u0432\u043D\u0438\u0437 (\u043A\u0430\u043A \u0431\u0443\u0434\u0442\u043E \u043F\u0440\u044F\u0447\u0435\u0448\u044C \u0438\u0445 \u0432 \u0437\u0430\u0434\u043D\u0438\u0439 \u043A\u0430\u0440\u043C\u0430\u043D)", "\u0428\u0410\u0413 2: \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0442\u043E\u043C \u0442\u044F\u043D\u0438 \u0440\u0443\u043A\u0430\u043C\u0438 \u2014 \u043B\u043E\u043A\u0442\u0438 \u0438\u0434\u0443\u0442 \u043D\u0430\u0437\u0430\u0434 \u0432\u0434\u043E\u043B\u044C \u0442\u0435\u043B\u0430", "\u0420\u0443\u0447\u043A\u0430 \u043A \u0436\u0438\u0432\u043E\u0442\u0443. \u0421\u043E\u0436\u043C\u0438 \u043B\u043E\u043F\u0430\u0442\u043A\u0438 \u0432 \u043A\u043E\u043D\u0435\u0447\u043D\u043E\u0439 \u0442\u043E\u0447\u043A\u0435 1\u20132 \u0441\u0435\u043A", "\u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u0432\u0435\u0440\u043D\u0438 \u0437\u0430 3 \u0441\u0435\u043A\u0443\u043D\u0434\u044B \u2014 \u043D\u0435 \u0440\u043E\u043D\u044F\u0439 \u0432\u0435\u0441"],
          err: ["\u041A\u043E\u0440\u043F\u0443\u0441 \u0441\u0438\u043B\u044C\u043D\u043E \u043E\u0442\u043A\u043B\u043E\u043D\u044F\u0435\u0442\u0441\u044F \u043D\u0430\u0437\u0430\u0434 \u2192 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0430", "\u0422\u044F\u043D\u0435\u0448\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0440\u0443\u043A\u0430\u043C\u0438, \u043D\u0435 \u0432\u043A\u043B\u044E\u0447\u0430\u044F \u043B\u043E\u043F\u0430\u0442\u043A\u0438"],
          prog: "20\u043A\u0433\u219230\u043A\u0433\u219240\u043A\u0433\u219250\u043A\u0433 (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)"
        },
        {
          id: "b2",
          name: "\u0422\u044F\u0433\u0430 \u0432\u0435\u0440\u0445\u043D\u0435\u0433\u043E \u0431\u043B\u043E\u043A\u0430 \u0448\u0438\u0440\u043E\u043A\u0438\u043C \u0445\u0432\u0430\u0442\u043E\u043C",
          sets: 4,
          repsT: "12",
          rest: 75,
          wt: "25\u201355 \u043A\u0433",
          muscle: "\u0428\u0438\u0440\u043E\u0447\u0430\u0439\u0448\u0438\u0435 \xB7 \u0421\u0440\u0435\u0434\u043D\u044F\u044F \u0441\u043F\u0438\u043D\u0430",
          svgKey: "lat_pulldown",
          scol: "\u2713",
          scolNote: "\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E \u043F\u0440\u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E\u0439 \u0442\u0435\u0445\u043D\u0438\u043A\u0435",
          feel: { good: "\u0420\u0430\u0441\u0442\u044F\u0436\u0435\u043D\u0438\u0435 \u043F\u043E \u0431\u043E\u043A\u0430\u043C \u0441\u043F\u0438\u043D\u044B (\u043F\u043E\u0434 \u043F\u043E\u0434\u043C\u044B\u0448\u043A\u0430\u043C\u0438)", bad: "\u0411\u043E\u043B\u044C \u0432 \u0448\u0435\u0435 \u0438\u043B\u0438 \u043F\u043B\u0435\u0447\u0430\u0445" },
          steps: ["\u0425\u0432\u0430\u0442 \u0447\u0443\u0442\u044C \u0448\u0438\u0440\u0435 \u043F\u043B\u0435\u0447, \u043B\u0430\u0434\u043E\u043D\u0438 \u043E\u0442 \u0441\u0435\u0431\u044F", "\u041D\u0430\u043A\u043B\u043E\u043D\u0438\u0441\u044C \u043D\u0430\u0437\u0430\u0434 70\u201380\xB0 \u2014 \u043D\u0435 \u043B\u0435\u0436\u0438!", "\u0422\u044F\u043D\u0438 \u0433\u0440\u0438\u0444 \u043A \u0432\u0435\u0440\u0445\u043D\u0435\u0439 \u0447\u0430\u0441\u0442\u0438 \u0433\u0440\u0443\u0434\u0438 \u2014 \u041D\u0415 \u0437\u0430 \u0448\u0435\u044E!", "\u0428\u0410\u0413 1: \u043E\u043F\u0443\u0441\u0442\u0438 \u043B\u043E\u043F\u0430\u0442\u043A\u0438 \u0432\u043D\u0438\u0437", "\u0428\u0410\u0413 2: \u0442\u044F\u043D\u0438 \u043B\u043E\u043A\u0442\u0438 \u0432\u043D\u0438\u0437 \u0438 \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u043D\u0430\u0437\u0430\u0434", "\u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u0432\u0435\u0440\u043D\u0438 \u0432\u0432\u0435\u0440\u0445 \u2014 \u043F\u043E\u043B\u043D\u043E\u0435 \u0440\u0430\u0441\u0442\u044F\u0436\u0435\u043D\u0438\u0435 \u0448\u0438\u0440\u043E\u0447\u0430\u0439\u0448\u0438\u0445"],
          err: ["\u0422\u044F\u0433\u0430 \u0437\u0430 \u0448\u0435\u044E \u2192 \u043E\u0447\u0435\u043D\u044C \u043E\u043F\u0430\u0441\u043D\u043E \u0434\u043B\u044F \u0448\u0435\u0439\u043D\u043E\u0433\u043E \u043E\u0442\u0434\u0435\u043B\u0430!", "\u0420\u0430\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u043A\u043E\u0440\u043F\u0443\u0441\u0430 \u2192 \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0443\u0445\u043E\u0434\u0438\u0442 \u0441 \u043C\u044B\u0448\u0446"],
          prog: "25\u043A\u0433\u219235\u043A\u0433\u219245\u043A\u0433\u219255\u043A\u0433 (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)"
        },
        {
          id: "b3",
          name: "\u0413\u0438\u043F\u0435\u0440\u044D\u043A\u0441\u0442\u0435\u043D\u0437\u0438\u044F \u0431\u0435\u0437 \u0432\u0435\u0441\u0430",
          sets: 3,
          repsT: "15",
          rest: 60,
          wt: "\u0431\u0435\u0437 \u0432\u0435\u0441\u0430",
          muscle: "\u0420\u0430\u0437\u0433\u0438\u0431\u0430\u0442\u0435\u043B\u0438 \u0441\u043F\u0438\u043D\u044B \xB7 \u042F\u0433\u043E\u0434\u0438\u0446\u044B",
          svgKey: "hyperext",
          scol: "\u26A0",
          scolNote: "\u0422\u043E\u043B\u044C\u043A\u043E \u0434\u043E \u043D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u043E\u0439 \u043B\u0438\u043D\u0438\u0438 \u2014 \u0431\u0435\u0437 \u043F\u0435\u0440\u0435\u0440\u0430\u0437\u0433\u0438\u0431\u0430\u043D\u0438\u044F!",
          feel: { good: "\u0420\u0430\u0431\u043E\u0442\u0430 \u044F\u0433\u043E\u0434\u0438\u0446 \u0438 \u043C\u044F\u0433\u043A\u043E\u0435 \u043D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u0441\u043F\u0438\u043D\u044B", bad: "\u0411\u043E\u043B\u044C \u0438\u043B\u0438 \u0434\u0438\u0441\u043A\u043E\u043C\u0444\u043E\u0440\u0442 \u0432 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0435" },
          steps: ["\u0411\u0451\u0434\u0440\u0430 \u043D\u0430 \u043F\u043E\u0434\u0443\u0448\u043A\u0435 \u0442\u0440\u0435\u043D\u0430\u0436\u0451\u0440\u0430, \u043D\u043E\u0441\u043A\u0438 \u0432 \u0443\u043F\u043E\u0440\u0430\u0445", "\u0420\u0443\u043A\u0438 \u0441\u043A\u0440\u0435\u0449\u0435\u043D\u044B \u043D\u0430 \u0433\u0440\u0443\u0434\u0438 \u2014 \u043D\u0435 \u0437\u0430 \u0433\u043E\u043B\u043E\u0432\u0443!", "\u041D\u0430\u0447\u043D\u0438 \u0441 \u043E\u043F\u0443\u0449\u0435\u043D\u043D\u043E\u0433\u043E \u043A\u043E\u0440\u043F\u0443\u0441\u0430 \u2014 \u0441\u043F\u0438\u043D\u0430 \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u043E\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0430", "\u041F\u043E\u0434\u043D\u0438\u043C\u0430\u0439, \u0440\u0430\u0437\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u044F \u043F\u043E\u0437\u0432\u043E\u043D\u043E\u0447\u043D\u0438\u043A \u0441\u043D\u0438\u0437\u0443 \u0432\u0432\u0435\u0440\u0445, \u043F\u043E\u0437\u0432\u043E\u043D\u043E\u043A \u0437\u0430 \u043F\u043E\u0437\u0432\u043E\u043D\u043A\u043E\u043C", "\u2B50 \u0421\u0422\u041E\u041F \u043A\u043E\u0433\u0434\u0430 \u0442\u0435\u043B\u043E \u2014 \u043F\u0440\u044F\u043C\u0430\u044F \u043B\u0438\u043D\u0438\u044F. \u042D\u0442\u043E \u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C \u043F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435!", "\u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u043E\u043F\u0443\u0441\u0442\u0438 \u0437\u0430 3 \u0441\u0435\u043A\u0443\u043D\u0434\u044B"],
          err: ["\u0417\u0430\u043F\u0440\u043E\u043A\u0438\u0434\u044B\u0432\u0430\u043D\u0438\u0435 \u0432\u044B\u0448\u0435 \u043F\u0440\u044F\u043C\u043E\u0439 \u043B\u0438\u043D\u0438\u0438 \u2192 \u043F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435 \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D\u043E", "\u0420\u044B\u0432\u043A\u043E\u0432\u043E\u0435 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u2192 \u043D\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442 \u0434\u0438\u0441\u043A\u0438"],
          prog: "\u0431\u0435\u0437 \u0432\u0435\u0441\u0430\u2192\u0431\u0435\u0437 \u0432\u0435\u0441\u0430\u2192+2.5\u043A\u0433\u2192+5\u043A\u0433 (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)"
        },
        {
          id: "b4",
          name: "\u041E\u0431\u0440\u0430\u0442\u043D\u043E\u0435 \u0440\u0430\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u0433\u0430\u043D\u0442\u0435\u043B\u0435\u0439 \u043B\u0451\u0436\u0430",
          sets: 3,
          repsT: "15",
          rest: 60,
          wt: "4\u201310 \u043A\u0433",
          muscle: "\u0417\u0430\u0434\u043D\u0438\u0435 \u0434\u0435\u043B\u044C\u0442\u044B \xB7 \u0420\u043E\u043C\u0431\u043E\u0432\u0438\u0434\u043D\u044B\u0435",
          svgKey: "reverse_fly",
          scol: "\u2713",
          scolNote: "\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E, \u043E\u0447\u0435\u043D\u044C \u043F\u043E\u043B\u0435\u0437\u043D\u043E \u0434\u043B\u044F \u043E\u0441\u0430\u043D\u043A\u0438",
          feel: { good: "\u0421\u0436\u0430\u0442\u0438\u0435 \u043C\u0435\u0436\u0434\u0443 \u043B\u043E\u043F\u0430\u0442\u043A\u0430\u043C\u0438", bad: "\u041D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u0432 \u0448\u0435\u0435 \u0438\u043B\u0438 \u0442\u0440\u0430\u043F\u0435\u0446\u0438\u0438" },
          steps: ["\u041B\u044F\u0433\u044C \u0433\u0440\u0443\u0434\u044C\u044E \u043D\u0430 \u043D\u0430\u043A\u043B\u043E\u043D\u043D\u0443\u044E \u0441\u043A\u0430\u043C\u044C\u044E (\u0443\u0433\u043E\u043B 30\xB0), \u043B\u0438\u0446\u043E\u043C \u0432\u043D\u0438\u0437", "\u0413\u0430\u043D\u0442\u0435\u043B\u0438 \u0441\u0432\u0438\u0441\u0430\u044E\u0442 \u0432\u043D\u0438\u0437 \u2014 \u0441\u0442\u0430\u0440\u0442\u043E\u0432\u043E\u0435 \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435", "\u0420\u0430\u0437\u0432\u0435\u0434\u0438 \u0440\u0443\u043A\u0438 \u043A\u0430\u043A \u043A\u0440\u044B\u043B\u044C\u044F \u2014 \u043B\u043E\u043A\u0442\u0438 \u0441\u043B\u0435\u0433\u043A\u0430 \u0441\u043E\u0433\u043D\u0443\u0442\u044B", "\u041F\u043E\u0434\u043D\u0438\u043C\u0430\u0439 \u0434\u043E \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u0438 \u0441 \u043F\u043E\u043B\u043E\u043C \u2014 \u043D\u0435 \u0432\u044B\u0448\u0435", "\u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u043E\u043F\u0443\u0441\u0442\u0438 \u0437\u0430 3 \u0441\u0435\u043A\u0443\u043D\u0434\u044B"],
          err: ["\u041F\u043E\u0434\u043D\u0438\u043C\u0430\u0435\u0448\u044C \u0432\u044B\u0448\u0435 \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u0438 \u2192 \u043B\u0438\u0448\u043D\u044F\u044F \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043D\u0430 \u043F\u043B\u0435\u0447\u0438", "\u0428\u0435\u044F \u043D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u0430 \u2192 \u0440\u0430\u0441\u0441\u043B\u0430\u0431\u044C, \u0432\u0437\u0433\u043B\u044F\u0434 \u0432\u043D\u0438\u0437"],
          prog: "4\u043A\u0433\u21926\u043A\u0433\u21928\u043A\u0433\u219210\u043A\u0433 (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)"
        },
        {
          id: "b5",
          name: "\u0411\u043E\u043A\u043E\u0432\u0430\u044F \u043F\u043B\u0430\u043D\u043A\u0430 \u0441 \u043A\u043E\u043B\u0435\u043D\u0430",
          sets: 3,
          repsT: "25 \u0441\u0435\u043A/\u0441\u0442\u043E\u0440\u043E\u043D\u0443",
          rest: 60,
          wt: "\u2014",
          muscle: "\u0411\u043E\u043A\u043E\u0432\u043E\u0439 \u043A\u043E\u0440 \xB7 \u041A\u0432\u0430\u0434\u0440\u0430\u0442\u043D\u0430\u044F \u043F\u043E\u044F\u0441\u043D\u0438\u0447\u043D\u0430\u044F",
          svgKey: "side_plank",
          scol: "\u2713",
          scolNote: "\u041E\u0441\u043E\u0431\u0435\u043D\u043D\u043E \u0432\u0430\u0436\u043D\u043E \u043F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435 \u2014 \u0432\u044B\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u0435\u0442 \u0434\u0438\u0441\u0431\u0430\u043B\u0430\u043D\u0441",
          feel: { good: "\u0411\u043E\u043A\u043E\u0432\u044B\u0435 \u043C\u044B\u0448\u0446\u044B \u0436\u0438\u0432\u043E\u0442\u0430", bad: "\u0411\u043E\u043B\u044C \u0432 \u043F\u043B\u0435\u0447\u0435 \u043E\u043F\u043E\u0440\u044B" },
          steps: ["\u041B\u0435\u0447\u044C \u043D\u0430 \u0431\u043E\u043A, \u0443\u043F\u043E\u0440 \u043D\u0430 \u043D\u0438\u0436\u043D\u0435\u0435 \u043F\u0440\u0435\u0434\u043F\u043B\u0435\u0447\u044C\u0435 \u0438 \u043A\u043E\u043B\u0435\u043D\u043E", "\u041F\u043E\u0434\u043D\u0438\u043C\u0438 \u0442\u0430\u0437 \u2014 \u0442\u0435\u043B\u043E \u043F\u0440\u044F\u043C\u0430\u044F \u043B\u0438\u043D\u0438\u044F \u043E\u0442 \u043A\u043E\u043B\u0435\u043D\u0430 \u0434\u043E \u043F\u043B\u0435\u0447\u0430", "\u041D\u0435 \u043F\u043E\u0437\u0432\u043E\u043B\u044F\u0439 \u0442\u0430\u0437\u0443 \u043F\u0440\u043E\u0432\u0430\u043B\u0438\u0432\u0430\u0442\u044C\u0441\u044F \u0432\u043D\u0438\u0437", "\u041F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435: \u0434\u0435\u0440\u0436\u0438 \u0441\u043B\u0430\u0431\u0443\u044E \u0441\u0442\u043E\u0440\u043E\u043D\u0443 \u043D\u0430 5\u201310 \u0441\u0435\u043A \u0434\u043E\u043B\u044C\u0448\u0435"],
          err: ["\u0422\u0430\u0437 \u043F\u0440\u043E\u0432\u0438\u0441\u0430\u0435\u0442 \u0432\u043D\u0438\u0437", "\u041F\u043B\u0435\u0447\u043E \u043E\u043F\u043E\u0440\u044B \u043F\u0440\u043E\u0432\u0430\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0432 \u0443\u0445\u043E \u2014 \u0434\u0435\u0440\u0436\u0438 \u043F\u043B\u0435\u0447\u043E \u0441\u0442\u0430\u0431\u0438\u043B\u044C\u043D\u044B\u043C"],
          prog: "20\u0441\u0435\u043A\u219225\u0441\u0435\u043A\u219230\u0441\u0435\u043A\u2192\u043F\u043E\u043B\u043D\u0430\u044F \u043F\u043B\u0430\u043D\u043A\u0430 \u0431\u0435\u0437 \u043A\u043E\u043B\u0435\u043D\u0430",
          beginner: "\u041D\u0430\u0447\u0438\u043D\u0430\u0439 \u0441 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u0430 \u0441 \u043A\u043E\u043B\u0435\u043D\u0430 \u2014 \u044D\u0442\u043E \u0438 \u0435\u0441\u0442\u044C \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E\u0435 \u043D\u0430\u0447\u0430\u043B\u043E \u0434\u043B\u044F \u043D\u043E\u0432\u0438\u0447\u043A\u0430. \u041F\u0435\u0440\u0435\u0445\u043E\u0434\u0438 \u043A \u043F\u043E\u043B\u043D\u043E\u0439 \u0442\u043E\u043B\u044C\u043A\u043E \u043A\u043E\u0433\u0434\u0430 30 \u0441\u0435\u043A \u0441 \u043A\u043E\u043B\u0435\u043D\u0430 \u0434\u0430\u044E\u0442\u0441\u044F \u043B\u0435\u0433\u043A\u043E."
        },
        {
          id: "b6",
          name: "Bird Dog",
          sets: 3,
          repsT: "10/\u0441\u0442\u043E\u0440\u043E\u043D\u0443",
          rest: 60,
          wt: "\u2014",
          muscle: "\u041C\u0443\u043B\u044C\u0442\u0438\u0444\u0438\u0434\u0443\u0441\u044B \xB7 \u0421\u0442\u0430\u0431\u0438\u043B\u0438\u0437\u0430\u0442\u043E\u0440\u044B \u043F\u043E\u0437\u0432\u043E\u043D\u043E\u0447\u043D\u0438\u043A\u0430",
          svgKey: "bird_dog",
          scol: "\u2713",
          scolNote: "\u041B\u0443\u0447\u0448\u0435\u0435 \u0443\u043F\u0440\u0430\u0436\u043D\u0435\u043D\u0438\u0435 \u043F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435",
          feel: { good: "\u041D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u043F\u043E \u0432\u0441\u0435\u043C\u0443 \u043A\u043E\u0440\u043F\u0443\u0441\u0443", bad: "\u0421\u043A\u0440\u0443\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u0438\u043B\u0438 \u043F\u043E\u0434\u044A\u0451\u043C \u0442\u0430\u0437\u0430" },
          steps: ["\u041D\u0430 \u0447\u0435\u0442\u0432\u0435\u0440\u0435\u043D\u044C\u043A\u0430\u0445. \u0417\u0430\u043F\u044F\u0441\u0442\u044C\u044F \u043F\u043E\u0434 \u043F\u043B\u0435\u0447\u0430\u043C\u0438, \u043A\u043E\u043B\u0435\u043D\u0438 \u043F\u043E\u0434 \u0431\u0451\u0434\u0440\u0430\u043C\u0438", "\u041D\u0430\u043F\u0440\u044F\u0433\u0438 \u0436\u0438\u0432\u043E\u0442 \u2014 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0430 \u043D\u0435 \u043F\u0440\u043E\u0432\u0438\u0441\u0430\u0435\u0442", "\u041E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u0432\u044B\u0442\u044F\u043D\u0438 \u043F\u0440\u0430\u0432\u0443\u044E \u0440\u0443\u043A\u0443 \u0432\u043F\u0435\u0440\u0451\u0434 \u0438 \u043B\u0435\u0432\u0443\u044E \u043D\u043E\u0433\u0443 \u043D\u0430\u0437\u0430\u0434", "\u0417\u0430\u0434\u0435\u0440\u0436\u0438\u0441\u044C 2\u20133 \u0441\u0435\u043A. \u041D\u043E\u0433\u0430 \u0438 \u0440\u0443\u043A\u0430 \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u044C\u043D\u044B \u043F\u043E\u043B\u0443", "\u0412\u0435\u0440\u043D\u0438\u0441\u044C \u043D\u0435 \u043A\u0430\u0441\u0430\u044F\u0441\u044C \u043F\u043E\u043B\u0430. \u0427\u0435\u0440\u0435\u0434\u0443\u0439 \u0441\u0442\u043E\u0440\u043E\u043D\u044B"],
          err: ["\u041F\u043E\u0434\u043D\u0438\u043C\u0430\u0435\u0448\u044C \u043D\u043E\u0433\u0443 \u0432\u044B\u0448\u0435 \u0431\u0451\u0434\u0435\u0440 \u2192 \u0442\u0430\u0437 \u0441\u043A\u0440\u0443\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F", "\u041F\u0440\u043E\u0432\u0430\u043B\u0438\u0432\u0430\u0435\u0448\u044C\u0441\u044F \u0432 \u0441\u0442\u043E\u0440\u043E\u043D\u0443 \u2014 \u0434\u0435\u0440\u0436\u0438 \u043A\u043E\u0440\u043F\u0443\u0441 \u043A\u0430\u043A \u0441\u0442\u043E\u043B"],
          prog: "10\u043F\u043E\u0432\u0442\u219212\u043F\u043E\u0432\u0442\u219212\u043F\u043E\u0432\u0442+\u043B\u0435\u043D\u0442\u0430 \u043D\u0430 \u043B\u043E\u0434\u044B\u0436\u043A\u0435"
        }
      ],
      cooldown: [
        {
          name: "\u0414\u0435\u0442\u0441\u043A\u0430\u044F \u043F\u043E\u0437\u0430",
          dur: "90 \u0441\u0435\u043A",
          svgKey: "generic",
          body: ["\u041A\u043E\u043B\u0435\u043D\u0438 \u0448\u0438\u0440\u043E\u043A\u043E, \u0441\u044F\u0434\u044C \u043D\u0430 \u043F\u044F\u0442\u043A\u0438, \u0440\u0443\u043A\u0438 \u0432\u044B\u0442\u044F\u043D\u0443\u0442\u044B \u0432\u043F\u0435\u0440\u0451\u0434", "\u041B\u043E\u0431 \u043E\u043F\u0443\u0441\u0442\u0438 \u043D\u0430 \u043F\u043E\u043B \u0438\u043B\u0438 \u043F\u043E\u0434\u0443\u0448\u043A\u0443", "\u0414\u044B\u0448\u0438 \u0433\u043B\u0443\u0431\u043E\u043A\u043E \u2014 \u043D\u0430 \u0432\u044B\u0434\u043E\u0445\u0435 \u043E\u0442\u043F\u0443\u0441\u043A\u0430\u0439 \u0441\u043F\u0438\u043D\u0443 \u0432\u043D\u0438\u0437", "\u0427\u0443\u0432\u0441\u0442\u0432\u0443\u0435\u0448\u044C \u0440\u0430\u0441\u0442\u044F\u0436\u0435\u043D\u0438\u0435 \u0432 \u0448\u0438\u0440\u043E\u0447\u0430\u0439\u0448\u0438\u0445 \u0438 \u0432\u0434\u043E\u043B\u044C \u043F\u043E\u0437\u0432\u043E\u043D\u043E\u0447\u043D\u0438\u043A\u0430"]
        },
        {
          name: "\u0420\u0430\u0441\u0442\u044F\u0436\u043A\u0430 \u0433\u0440\u0443\u0434\u043D\u044B\u0445 \u0443 \u0441\u0442\u0435\u043D\u044B",
          dur: "45 \u0441\u0435\u043A/\u0441\u0442\u043E\u0440\u043E\u043D\u0443",
          svgKey: null,
          body: ["\u0420\u0443\u043A\u0430 \u043D\u0430 \u0441\u0442\u0435\u043D\u0435 \u043F\u043E\u0434 \u0443\u0433\u043B\u043E\u043C 90\xB0 \u2014 \u043B\u0430\u0434\u043E\u043D\u044C \u043A \u0441\u0442\u0435\u043D\u0435", "\u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u0440\u0430\u0437\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u0439 \u043A\u043E\u0440\u043F\u0443\u0441 \u043E\u0442 \u0441\u0442\u0435\u043D\u044B", "\u0421\u0442\u043E\u043F \u043A\u043E\u0433\u0434\u0430 \u043F\u043E\u0447\u0443\u0432\u0441\u0442\u0432\u0443\u0435\u0448\u044C \u0440\u0430\u0441\u0442\u044F\u0436\u0435\u043D\u0438\u0435 \u0432 \u0433\u0440\u0443\u0434\u0438 \u0438 \u043F\u043B\u0435\u0447\u0435", "\u041D\u0435 \u0444\u043E\u0440\u0441\u0438\u0440\u0443\u0439 \u2014 \u043C\u044F\u0433\u043A\u043E \u0438 \u0433\u043B\u0443\u0431\u043E\u043A\u043E \u0434\u044B\u0448\u0438"]
        },
        {
          name: "\u0420\u0430\u0441\u043A\u0440\u044B\u0442\u0438\u0435 \u0433\u0440\u0443\u0434\u043D\u043E\u0433\u043E \u043E\u0442\u0434\u0435\u043B\u0430 \u043D\u0430 \u0432\u0430\u043B\u0438\u043A\u0435",
          dur: "2\u20133 \u043C\u0438\u043D",
          svgKey: null,
          body: ["\u041F\u0435\u043D\u043D\u044B\u0439 \u0432\u0430\u043B\u0438\u043A \u043F\u043E\u043F\u0435\u0440\u0451\u043A \u0441\u043F\u0438\u043D\u044B \u043F\u043E\u0434 \u043B\u043E\u043F\u0430\u0442\u043A\u0430\u043C\u0438", "\u0420\u0443\u043A\u0438 \u0437\u0430 \u0433\u043E\u043B\u043E\u0432\u043E\u0439 \u0438\u043B\u0438 \u0441\u043A\u0440\u0435\u0449\u0435\u043D\u044B \u043D\u0430 \u0433\u0440\u0443\u0434\u0438", "\u041C\u044F\u0433\u043A\u043E \u043F\u0440\u043E\u0433\u0438\u0431\u0430\u0439\u0441\u044F \u043D\u0430\u0437\u0430\u0434, \u0434\u044B\u0448\u0438 \u0433\u043B\u0443\u0431\u043E\u043A\u043E", "\u041C\u043E\u0436\u043D\u043E \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u043F\u0435\u0440\u0435\u043A\u0430\u0442\u044B\u0432\u0430\u0442\u044C \u043F\u043E \u0433\u0440\u0443\u0434\u043D\u043E\u043C\u0443 \u043E\u0442\u0434\u0435\u043B\u0443", "\u042D\u0442\u043E \u043E\u0434\u0438\u043D \u0438\u0437 \u043B\u0443\u0447\u0448\u0438\u0445 \u0441\u043F\u043E\u0441\u043E\u0431\u043E\u0432 \u043A\u043E\u0440\u0440\u0435\u043A\u0446\u0438\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0430"]
        },
        {
          name: "\u0414\u0438\u0430\u0444\u0440\u0430\u0433\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u0434\u044B\u0445\u0430\u043D\u0438\u0435",
          dur: "2 \u043C\u0438\u043D",
          svgKey: null,
          body: ["\u041B\u0451\u0436\u0430. \u0412\u0434\u043E\u0445 \u2014 \u0436\u0438\u0432\u043E\u0442 \u0438 \u0442\u0430\u0437\u043E\u0432\u043E\u0435 \u0434\u043D\u043E \u0440\u0430\u0441\u0441\u043B\u0430\u0431\u043B\u044F\u044E\u0442\u0441\u044F", "\u0412\u044B\u0434\u043E\u0445 \u2014 \u043B\u0451\u0433\u043A\u043E\u0435 \u0432\u0442\u044F\u0433\u0438\u0432\u0430\u043D\u0438\u0435 \u0436\u0438\u0432\u043E\u0442\u0430", "\u041D\u0435 \u0441\u0436\u0438\u043C\u0430\u0439 \u0442\u0430\u0437\u043E\u0432\u043E\u0435 \u0434\u043D\u043E \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u0440\u0430\u0441\u0441\u043B\u0430\u0431\u043B\u0435\u043D\u0438\u0435", "\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u043F\u0440\u0438 \u0441\u043F\u0430\u0437\u043C\u0435 \u0442\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u0434\u043D\u0430"]
        }
      ]
    },
    {
      id: "C",
      name: "\u042F\u0433\u043E\u0434\u0438\u0446\u044B + \u041D\u043E\u0433\u0438",
      emoji: "🔥",
      clr: C.sand,
      clrS: C.sandSoft,
      clrD: C.sandDeep,
      totalMin: 80,
      intensity: "\u0412\u044B\u0441\u043E\u043A\u0430\u044F",
      warmup: [
        {
          name: "\u0425\u043E\u0434\u044C\u0431\u0430 \u0441 \u043D\u0430\u043A\u043B\u043E\u043D\u043E\u043C \u043D\u0430 \u0434\u043E\u0440\u043E\u0436\u043A\u0435",
          dur: "5 \u043C\u0438\u043D",
          svgKey: null,
          body: ["\u041D\u0430\u043A\u043B\u043E\u043D 3\u20135%, \u0442\u0435\u043C\u043F 5.5\u20136 \u043A\u043C/\u0447", "\u041D\u0435 \u0434\u0435\u0440\u0436\u0438\u0441\u044C \u0437\u0430 \u043F\u043E\u0440\u0443\u0447\u043D\u0438 \u2014 \u043F\u0443\u0441\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442 \u044F\u0433\u043E\u0434\u0438\u0446\u044B", "\u042F\u0433\u043E\u0434\u0438\u0446\u044B \u0430\u043A\u0442\u0438\u0432\u0438\u0440\u0443\u044E\u0442\u0441\u044F \u0432 \u0433\u043E\u0440\u0443 \u0437\u043D\u0430\u0447\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u043B\u0443\u0447\u0448\u0435, \u0447\u0435\u043C \u043D\u0430 \u043F\u043B\u043E\u0441\u043A\u043E\u0441\u0442\u0438", "\u041F\u043E\u0447\u0443\u0432\u0441\u0442\u0432\u0443\u0439 \u0440\u0430\u0431\u043E\u0442\u0443 \u0437\u0430\u0434\u043D\u0435\u0439 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438 \u0431\u0435\u0434\u0440\u0430"]
        },
        {
          name: "\u0412\u044B\u043F\u0430\u0434\u044B \u043D\u0430 \u043C\u0435\u0441\u0442\u0435 \u0431\u0435\u0437 \u0432\u0435\u0441\u0430",
          dur: "2 \xD7 10/\u043D\u043E\u0433\u0430",
          svgKey: "lunge",
          body: ["\u0428\u0430\u0433 \u0432\u043F\u0435\u0440\u0451\u0434 \u2014 \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0448\u0430\u0433", "\u041E\u043F\u0443\u0441\u0442\u0438 \u0437\u0430\u0434\u043D\u0435\u0435 \u043A\u043E\u043B\u0435\u043D\u043E \u043A \u043F\u043E\u043B\u0443 (\u043D\u0435 \u043A\u0430\u0441\u0430\u044F\u0441\u044C)", "\u041F\u0435\u0440\u0435\u0434\u043D\u0435\u0435 \u043A\u043E\u043B\u0435\u043D\u043E \u043D\u0430\u0434 \u043B\u043E\u0434\u044B\u0436\u043A\u043E\u0439 \u2014 \u043D\u0435 \u0437\u0430 \u043D\u043E\u0441\u043E\u043A!", "\u041E\u0442\u0442\u043E\u043B\u043A\u043D\u0438\u0441\u044C \u043F\u044F\u0442\u043A\u043E\u0439 \u043F\u0435\u0440\u0435\u0434\u043D\u0435\u0439 \u043D\u043E\u0433\u0438 \u0438 \u0432\u0435\u0440\u043D\u0438\u0441\u044C"]
        },
        {
          name: "\u041F\u0440\u0438\u0441\u0435\u0434\u0430\u043D\u0438\u044F \u043F\u043B\u0438\u0435 \u0431\u0435\u0437 \u0432\u0435\u0441\u0430",
          dur: "2 \xD7 12",
          svgKey: null,
          body: ["\u0421\u0442\u043E\u043F\u044B \u0448\u0438\u0440\u043E\u043A\u043E, \u043D\u043E\u0441\u043A\u0438 45\xB0", "\u041F\u0440\u0438\u0441\u0435\u0434 \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u044B\u0439 \u2014 3 \u0441\u0435\u043A \u0432\u043D\u0438\u0437", "\u0421\u043F\u0438\u043D\u0430 \u043F\u0440\u044F\u043C\u0430\u044F, \u043A\u043E\u043B\u0435\u043D\u0438 \u043D\u0430\u0434 \u043D\u043E\u0441\u043A\u0430\u043C\u0438", "\u041F\u043E\u0447\u0443\u0432\u0441\u0442\u0432\u0443\u0439 \u0440\u0430\u0431\u043E\u0442\u0443 \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0435\u0439 \u0447\u0430\u0441\u0442\u0438 \u0431\u0435\u0434\u0440\u0430"]
        }
      ],
      exercises: [
        {
          id: "c1",
          name: "\u041F\u0440\u0438\u0441\u0435\u0434\u0430\u043D\u0438\u044F \u0421\u043C\u0438\u0442 (\u0441\u0443\u043C\u043E)",
          sets: 4,
          repsT: "12",
          rest: 90,
          wt: "20\u201360 \u043A\u0433",
          muscle: "\u042F\u0433\u043E\u0434\u0438\u0446\u044B \xB7 \u041F\u0440\u0438\u0432\u043E\u0434\u044F\u0449\u0438\u0435 \xB7 \u041A\u0432\u0430\u0434\u0440\u0438\u0446\u0435\u043F\u0441",
          svgKey: "squat",
          scol: "\u2713",
          scolNote: "\u0422\u0440\u0435\u043D\u0430\u0436\u0451\u0440 \u0421\u043C\u0438\u0442\u0430 \u0441\u043D\u0438\u043C\u0430\u0435\u0442 \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0443 \u0441 \u043F\u043E\u0437\u0432\u043E\u043D\u043E\u0447\u043D\u0438\u043A\u0430",
          feel: { good: "\u0420\u0430\u0431\u043E\u0442\u0430 \u044F\u0433\u043E\u0434\u0438\u0446 \u0438 \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0435\u0439 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438 \u0431\u0435\u0434\u0440\u0430", bad: "\u0411\u043E\u043B\u044C \u0432 \u043A\u043E\u043B\u0435\u043D\u044F\u0445" },
          steps: ["\u0421\u0442\u043E\u043F\u044B \u0448\u0438\u0440\u043E\u043A\u043E \u2014 \u043D\u0430 15\u201320 \u0441\u043C \u0448\u0438\u0440\u0435 \u043F\u043B\u0435\u0447, \u043D\u043E\u0441\u043A\u0438 45\xB0", "\u0428\u0442\u0430\u043D\u0433\u0430 \u043D\u0430 \u0442\u0440\u0430\u043F\u0435\u0446\u0438\u044F\u0445 (\u043D\u0435 \u043D\u0430 \u0448\u0435\u0435!) \u2014 \u043F\u043E\u0434\u043B\u043E\u0436\u0438 \u043C\u044F\u0433\u043A\u0438\u0439 \u0432\u0430\u043B\u0438\u043A", "\u041F\u0440\u0438\u0441\u0435\u0434 \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u044B\u0439 \u2014 3 \u0441\u0435\u043A \u0432\u043D\u0438\u0437 \u0434\u043E \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u0438 \u0431\u0451\u0434\u0435\u0440", "\u041A\u043E\u043B\u0435\u043D\u0438 \u0441\u0442\u0440\u043E\u0433\u043E \u043D\u0430\u0434 \u043D\u043E\u0441\u043A\u0430\u043C\u0438 \u2014 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u043B\u044F\u0439, \u0447\u0442\u043E \u0440\u0430\u0437\u0434\u0432\u0438\u0433\u0430\u0435\u0448\u044C \u043F\u043E\u043B \u043D\u043E\u0433\u0430\u043C\u0438", "\u0412\u0441\u0442\u0430\u0432\u0430\u0439, \u043E\u0442\u0442\u0430\u043B\u043A\u0438\u0432\u0430\u044F\u0441\u044C \u043F\u044F\u0442\u043A\u0430\u043C\u0438. \u0412\u044B\u043F\u0440\u044F\u043C\u043B\u044F\u0439 \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u043D\u0430\u0432\u0435\u0440\u0445\u0443"],
          err: ["\u041A\u043E\u043B\u0435\u043D\u0438 \u0437\u0430\u0432\u0430\u043B\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0432\u043D\u0443\u0442\u0440\u044C \u2192 \u043A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043E\u043F\u0430\u0441\u043D\u043E!", "\u041F\u044F\u0442\u043A\u0438 \u043E\u0442\u0440\u044B\u0432\u0430\u044E\u0442\u0441\u044F \u2192 \u043F\u043E\u0434\u043B\u043E\u0436\u0438 \u0431\u043B\u0438\u043D\u044B \u043F\u043E\u0434 \u043F\u044F\u0442\u043A\u0438"],
          prog: "20\u043A\u0433\u219235\u043A\u0433\u219250\u043A\u0433\u219260\u043A\u0433 (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)"
        },
        {
          id: "c2",
          name: "\u0412\u044B\u043F\u0430\u0434\u044B \u0441 \u0433\u0430\u043D\u0442\u0435\u043B\u044F\u043C\u0438 (\u0445\u043E\u0434\u044F\u0447\u0438\u0435)",
          sets: 3,
          repsT: "10/\u043D\u043E\u0433\u0430",
          rest: 75,
          wt: "6\u201315 \u043A\u0433/\u0440\u0443\u043A\u0430",
          muscle: "\u042F\u0433\u043E\u0434\u0438\u0446\u044B \xB7 \u041A\u0432\u0430\u0434\u0440\u0438\u0446\u0435\u043F\u0441",
          svgKey: "lunge",
          scol: "\u26A0",
          scolNote: "\u0421\u043B\u0435\u0434\u0438 \u0437\u0430 \u043F\u0440\u044F\u043C\u043E\u0439 \u0441\u043F\u0438\u043D\u043E\u0439",
          feel: { good: "\u0420\u0430\u0431\u043E\u0442\u0430 \u044F\u0433\u043E\u0434\u0438\u0446 \u0438 \u043F\u0435\u0440\u0435\u0434\u043D\u0435\u0439 \u0447\u0430\u0441\u0442\u0438 \u0431\u0435\u0434\u0440\u0430", bad: "\u0411\u043E\u043B\u044C \u0432 \u043F\u0435\u0440\u0435\u0434\u043D\u0435\u043C \u043A\u043E\u043B\u0435\u043D\u0435" },
          steps: ["\u0421\u0442\u043E\u0438\u0448\u044C \u043F\u0440\u044F\u043C\u043E, \u0433\u0430\u043D\u0442\u0435\u043B\u0438 \u043F\u043E \u0431\u043E\u043A\u0430\u043C", "\u0411\u043E\u043B\u044C\u0448\u043E\u0439 \u0448\u0430\u0433 \u0432\u043F\u0435\u0440\u0451\u0434", "\u0417\u0430\u0434\u043D\u0435\u0435 \u043A\u043E\u043B\u0435\u043D\u043E \u043E\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F \u043A \u043F\u043E\u043B\u0443 \u2014 \u043D\u0435 \u043A\u0430\u0441\u0430\u0435\u0442\u0441\u044F!", "\u041F\u0435\u0440\u0435\u0434\u043D\u0435\u0435 \u043A\u043E\u043B\u0435\u043D\u043E \u043D\u0430\u0434 \u043B\u043E\u0434\u044B\u0436\u043A\u043E\u0439 \u2014 \u043D\u0435 \u0437\u0430 \u043D\u043E\u0441\u043E\u043A", "\u041A\u043E\u0440\u043F\u0443\u0441 \u0432\u0435\u0440\u0442\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0439. \u0412\u0441\u0442\u0430\u043D\u044C, \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0448\u0430\u0433"],
          err: ["\u041C\u0430\u043B\u0435\u043D\u044C\u043A\u0438\u0439 \u0448\u0430\u0433 \u2192 \u043A\u043E\u043B\u0435\u043D\u043E \u0443\u0445\u043E\u0434\u0438\u0442 \u0437\u0430 \u043D\u043E\u0441\u043E\u043A", "\u041D\u0430\u043A\u043B\u043E\u043D \u043A\u043E\u0440\u043F\u0443\u0441\u0430 \u0432\u043F\u0435\u0440\u0451\u0434 \u2192 \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043D\u0430 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0443"],
          prog: "6\u043A\u0433\u21928\u043A\u0433\u219212\u043A\u0433\u219215\u043A\u0433 (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)",
          beginner: "\u041F\u0435\u0440\u0432\u044B\u0435 2 \u043D\u0435\u0434 \u2014 \u0434\u0435\u043B\u0430\u0439 \u0432\u044B\u043F\u0430\u0434\u044B \u043D\u0430 \u043C\u0435\u0441\u0442\u0435 (\u043D\u0435 \u0445\u043E\u0434\u044F\u0447\u0438\u0435) \u0434\u0435\u0440\u0436\u0430\u0441\u044C \u0437\u0430 \u0441\u0442\u0435\u043D\u0443 \u0438\u043B\u0438 \u0441\u0442\u043E\u0439\u043A\u0443. \u041D\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0442\u0430 \u0436\u0435, \u0431\u0430\u043B\u0430\u043D\u0441 \u043F\u0440\u043E\u0449\u0435."
        },
        {
          id: "c3",
          name: "\u0420\u0443\u043C\u044B\u043D\u0441\u043A\u0430\u044F \u0442\u044F\u0433\u0430 \u0441 \u0433\u0430\u043D\u0442\u0435\u043B\u044F\u043C\u0438",
          sets: 4,
          repsT: "12",
          rest: 75,
          wt: "10\u201322 \u043A\u0433/\u0440\u0443\u043A\u0430",
          muscle: "\u0417\u0430\u0434\u043D\u044F\u044F \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u0431\u0435\u0434\u0440\u0430 \xB7 \u042F\u0433\u043E\u0434\u0438\u0446\u044B",
          svgKey: "rdl",
          scol: "\u26A0",
          scolNote: "\u041D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u043E\u0437\u0432\u043E\u043D\u043E\u0447\u043D\u0438\u043A \u2014 \u0431\u0435\u0437 \u043E\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u044F!",
          feel: { good: "\u0420\u0430\u0441\u0442\u044F\u0436\u0435\u043D\u0438\u0435 \u043F\u043E\u0434 \u043A\u043E\u043B\u0435\u043D\u043E\u043C, \u0436\u0436\u0435\u043D\u0438\u0435 \u0432 \u044F\u0433\u043E\u0434\u0438\u0446\u0430\u0445 \u043D\u0430\u0432\u0435\u0440\u0445\u0443", bad: "\u0411\u043E\u043B\u044C \u0432 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0435" },
          steps: ["\u0421\u0442\u043E\u0438\u0448\u044C \u043F\u0440\u044F\u043C\u043E, \u0433\u0430\u043D\u0442\u0435\u043B\u0438 \u043F\u0435\u0440\u0435\u0434 \u0431\u0451\u0434\u0440\u0430\u043C\u0438", "\u041B\u0451\u0433\u043A\u0438\u0439 \u0438\u0437\u0433\u0438\u0431 \u0432 \u043A\u043E\u043B\u0435\u043D\u044F\u0445 \u2014 \u0437\u0430\u0444\u0438\u043A\u0441\u0438\u0440\u0443\u0439, \u043D\u0435 \u043C\u0435\u043D\u044F\u0439", "\u0422\u0430\u0437 \u043E\u0442\u0432\u043E\u0434\u0438 \u043D\u0430\u0437\u0430\u0434 \u2014 \u0433\u0430\u043D\u0442\u0435\u043B\u0438 \u0441\u043A\u043E\u043B\u044C\u0437\u044F\u0442 \u0432\u0434\u043E\u043B\u044C \u043D\u043E\u0433 \u0432\u043D\u0438\u0437", "\u0421\u043F\u0438\u043D\u0430 \u043F\u0440\u044F\u043C\u0430\u044F, \u043D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u0430\u044F \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0430 \u043D\u0430 \u0432\u0441\u0451\u043C \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0438!", "\u041E\u043F\u0443\u0441\u043A\u0430\u0439 \u0434\u043E \u043D\u0430\u0442\u044F\u0436\u0435\u043D\u0438\u044F \u043F\u043E\u0434 \u043A\u043E\u043B\u0435\u043D\u043E\u043C (\u043F\u0440\u0438\u043C\u0435\u0440\u043D\u043E \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0430 \u0433\u043E\u043B\u0435\u043D\u0438)", "\u041F\u043E\u0434\u043D\u0438\u043C\u0430\u0439\u0441\u044F: \u0442\u043E\u043B\u043A\u0430\u0439 \u0431\u0451\u0434\u0440\u0430 \u0432\u043F\u0435\u0440\u0451\u0434, \u0441\u043E\u0436\u043C\u0438 \u044F\u0433\u043E\u0434\u0438\u0446\u044B \u043D\u0430\u0432\u0435\u0440\u0445\u0443"],
          err: ["\u041E\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u044B \u2192 \u043F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435 \u043E\u043F\u0430\u0441\u043D\u043E!", "\u0413\u0430\u043D\u0442\u0435\u043B\u0438 \u043E\u0442\u0445\u043E\u0434\u044F\u0442 \u043E\u0442 \u043D\u043E\u0433 \u2192 \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0443\u0445\u043E\u0434\u0438\u0442 \u0432 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0443"],
          prog: "10\u043A\u0433\u219214\u043A\u0433\u219218\u043A\u0433\u219222\u043A\u0433 (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)",
          beginner: "\u041F\u0435\u0440\u0432\u044B\u0435 2 \u043D\u0435\u0434 \u2014 \u0434\u0435\u043B\u0430\u0439 \u0441 \u043B\u0451\u0433\u043A\u0438\u043C\u0438 \u0433\u0430\u043D\u0442\u0435\u043B\u044F\u043C\u0438 4\u20136\u043A\u0433 \u043F\u0435\u0440\u0435\u0434 \u0437\u0435\u0440\u043A\u0430\u043B\u043E\u043C, \u0441\u043B\u0435\u0434\u0438 \u0437\u0430 \u043F\u0440\u044F\u043C\u043E\u0439 \u0441\u043F\u0438\u043D\u043E\u0439. \u041C\u043E\u0436\u043D\u043E \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u043D\u0430 \u0441\u0433\u0438\u0431\u0430\u043D\u0438\u0435 \u043D\u043E\u0433 \u0432 \u0442\u0440\u0435\u043D\u0430\u0436\u0451\u0440\u0435 \u043B\u0451\u0436\u0430 (\u0442\u043E \u0436\u0435 \u0431\u0435\u0434\u0440\u043E, \u043D\u043E \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u0435\u0435)."
        },
        {
          id: "c4",
          name: "\u0421\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u043D\u043E\u0433 \u0432 \u0442\u0440\u0435\u043D\u0430\u0436\u0451\u0440\u0435",
          sets: 3,
          repsT: "15",
          rest: 60,
          wt: "30\u201360 \u043A\u0433",
          muscle: "\u041F\u0440\u0438\u0432\u043E\u0434\u044F\u0449\u0438\u0435 \xB7 \u0422\u0430\u0437\u043E\u0432\u043E\u0435 \u0434\u043D\u043E (\u043A\u043E\u0441\u0432\u0435\u043D\u043D\u043E)",
          svgKey: "adductor",
          scol: "\u2713",
          scolNote: "\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E \u2014 \u0441\u0438\u0434\u044F\u0447\u0435\u0435 \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435",
          feel: { good: "\u0421\u0436\u0430\u0442\u0438\u0435 \u043F\u043E \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0435\u0439 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438 \u0431\u0435\u0434\u0440\u0430", bad: "\u0411\u043E\u043B\u044C \u0432 \u0442\u0430\u0437\u043E\u0431\u0435\u0434\u0440\u0435\u043D\u043D\u043E\u043C \u0441\u0443\u0441\u0442\u0430\u0432\u0435" },
          steps: ["\u0421\u043F\u0438\u043D\u0430 \u043F\u0440\u0438\u0436\u0430\u0442\u0430 \u043A \u0441\u043F\u0438\u043D\u043A\u0435 \u0442\u0440\u0435\u043D\u0430\u0436\u0451\u0440\u0430 \u043D\u0430 \u0432\u0441\u0451\u043C \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0438", "\u041D\u0430\u0441\u0442\u0440\u043E\u0439 \u0448\u0438\u0440\u0438\u043D\u0443: \u0447\u0443\u0432\u0441\u0442\u0432\u0443\u0435\u0448\u044C \u0440\u0430\u0441\u0442\u044F\u0436\u0435\u043D\u0438\u0435, \u0431\u0435\u0437 \u043E\u0441\u0442\u0440\u043E\u0433\u043E \u0434\u0438\u0441\u043A\u043E\u043C\u0444\u043E\u0440\u0442\u0430", "\u0421\u0432\u043E\u0434\u0438\u0448\u044C \u043D\u043E\u0433\u0438 \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u2014 2 \u0441\u0435\u043A\u0443\u043D\u0434\u044B", "\u0412 \u0441\u0432\u0435\u0434\u0451\u043D\u043D\u043E\u043C \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0438 \u0437\u0430\u0434\u0435\u0440\u0436\u0438\u0441\u044C 1 \u0441\u0435\u043A\u0443\u043D\u0434\u0443", "\u2B50 \u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u0440\u0430\u0437\u0432\u043E\u0434\u0438\u0448\u044C \u2014 4 \u0441\u0435\u043A\u0443\u043D\u0434\u044B! \u0412\u0430\u0436\u043D\u0435\u0435, \u0447\u0435\u043C \u0441\u0432\u0435\u0434\u0435\u043D\u0438\u0435"],
          err: ["\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u044B\u0441\u0442\u0440\u043E\u0435 \u0440\u0430\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u2192 \u043D\u0435\u0442 \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u043D\u0430 \u043C\u044B\u0448\u0446\u044B", "\u0421\u043F\u0438\u043D\u0430 \u043E\u0442\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u0438 \u0441\u0432\u0435\u0434\u0435\u043D\u0438\u0438"],
          prog: "30\u043A\u0433\u219240\u043A\u0433\u219250\u043A\u0433\u219260\u043A\u0433 (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)"
        },
        {
          id: "c5",
          name: "\u041F\u043E\u0434\u044A\u0451\u043C \u043D\u0430 \u043D\u043E\u0441\u043A\u0438",
          sets: 3,
          repsT: "20",
          rest: 45,
          wt: "\u0432\u0435\u0441 \u0442\u0435\u043B\u0430 \u2192 30\u201340 \u043A\u0433",
          muscle: "\u0418\u043A\u0440\u043E\u043D\u043E\u0436\u043D\u0430\u044F \xB7 \u041A\u0430\u043C\u0431\u0430\u043B\u043E\u0432\u0438\u0434\u043D\u0430\u044F",
          svgKey: "calf_raise",
          scol: "\u2713",
          scolNote: "\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E",
          feel: { good: "\u0416\u0436\u0435\u043D\u0438\u0435 \u0432 \u0438\u043A\u0440\u0435", bad: "\u0411\u043E\u043B\u044C \u0432 \u0430\u0445\u0438\u043B\u043B\u0435\u0441\u0435" },
          steps: ["\u0421\u0442\u043E\u043F\u044B \u043D\u0430 \u043A\u0440\u0430\u044E \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B \u2014 \u043F\u044F\u0442\u043A\u0438 \u0441\u0432\u0438\u0441\u0430\u044E\u0442 \u0432\u043D\u0438\u0437", "\u041E\u043F\u0443\u0441\u0442\u0438\u0441\u044C \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E \u0432\u043D\u0438\u0437 \u2014 \u0433\u043B\u0443\u0431\u043E\u043A\u043E\u0435 \u0440\u0430\u0441\u0442\u044F\u0436\u0435\u043D\u0438\u0435 \u0438\u043A\u0440\u044B", "\u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u043F\u043E\u0434\u043D\u0438\u043C\u0438\u0441\u044C \u043D\u0430 \u043D\u043E\u0441\u043A\u0438 \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E \u0432\u044B\u0441\u043E\u043A\u043E", "\u0417\u0430\u0434\u0435\u0440\u0436\u0438\u0441\u044C 1 \u0441\u0435\u043A\u0443\u043D\u0434\u0443 \u043D\u0430\u0432\u0435\u0440\u0445\u0443", "\u041E\u043F\u0443\u0441\u043A\u0430\u0439 \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u0437\u0430 3 \u0441\u0435\u043A\u0443\u043D\u0434\u044B"],
          err: ["\u041D\u0435\u0442 \u043F\u043E\u043B\u043D\u043E\u0439 \u0430\u043C\u043F\u043B\u0438\u0442\u0443\u0434\u044B \u2192 \u0442\u0435\u0440\u044F\u0435\u0448\u044C \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u0443 \u044D\u0444\u0444\u0435\u043A\u0442\u0430", "\u041F\u0440\u044B\u0436\u043A\u043E\u0432\u043E\u0435 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u0431\u0435\u0437 \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u044F"],
          prog: "\u0432\u0435\u0441 \u0442\u0435\u043B\u0430\u219220\u043A\u0433\u219230\u043A\u0433\u219240\u043A\u0433 (\u043F\u043E 2 \u043D\u0435\u0434\u0435\u043B\u0438)"
        },
        {
          id: "c6",
          name: "\u0412\u0430\u043A\u0443\u0443\u043C \u0436\u0438\u0432\u043E\u0442\u0430",
          sets: 3,
          repsT: "5 \xD7 10 \u0441\u0435\u043A",
          rest: 60,
          wt: "\u2014",
          muscle: "\u041F\u043E\u043F\u0435\u0440\u0435\u0447\u043D\u0430\u044F \u043C\u044B\u0448\u0446\u0430 \xB7 \u0422\u0430\u0437\u043E\u0432\u043E\u0435 \u0434\u043D\u043E",
          svgKey: "vacuum",
          scol: "\u2713",
          scolNote: "\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E",
          feel: { good: "\u0413\u043B\u0443\u0431\u043E\u043A\u043E\u0435 \u0432\u0442\u044F\u0433\u0438\u0432\u0430\u043D\u0438\u0435 \u0438\u0437\u043D\u0443\u0442\u0440\u0438, \u0436\u0438\u0432\u043E\u0442 \u0443\u0445\u043E\u0434\u0438\u0442 \u0432\u0432\u0435\u0440\u0445", bad: "\u041D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u0432 \u044F\u0433\u043E\u0434\u0438\u0446\u0430\u0445 \u0438\u043B\u0438 \u043D\u043E\u0433\u0430\u0445" },
          steps: ["\u0412\u0441\u0442\u0430\u043D\u044C \u0438\u043B\u0438 \u0441\u0442\u0430\u043D\u044C \u043D\u0430 \u0447\u0435\u0442\u0432\u0435\u0440\u0435\u043D\u044C\u043A\u0438", "\u0421\u0434\u0435\u043B\u0430\u0439 \u043F\u043E\u043B\u043D\u044B\u0439 \u0432\u044B\u0434\u043E\u0445 \u2014 \u0432\u0435\u0441\u044C \u0432\u043E\u0437\u0434\u0443\u0445 \u0438\u0437 \u043B\u0451\u0433\u043A\u0438\u0445", "\u041D\u0435 \u0434\u044B\u0448\u0430, \u0432\u0442\u044F\u043D\u0438 \u0436\u0438\u0432\u043E\u0442 \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E \u0432\u043D\u0443\u0442\u0440\u044C \u0438 \u0432\u0432\u0435\u0440\u0445 \u043F\u043E\u0434 \u0440\u0451\u0431\u0440\u0430", "\u0423\u0434\u0435\u0440\u0436\u0438 8\u201310 \u0441\u0435\u043A\u0443\u043D\u0434. \u0420\u0430\u0441\u0441\u043B\u0430\u0431\u044C\u0441\u044F. \u0421\u0434\u0435\u043B\u0430\u0439 \u0432\u0434\u043E\u0445", "\u041D\u0430 \u0432\u0434\u043E\u0445\u0435: \u0442\u0430\u0437\u043E\u0432\u043E\u0435 \u0434\u043D\u043E \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0440\u0430\u0441\u0441\u043B\u0430\u0431\u043B\u044F\u0435\u0442\u0441\u044F \u0438 \u043E\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F"],
          err: ["\u0421\u0436\u0438\u043C\u0430\u0435\u0448\u044C \u044F\u0433\u043E\u0434\u0438\u0446\u044B \u2192 \u043D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0430\u043A\u0442\u0438\u0432\u0430\u0446\u0438\u044F", "\u0417\u0430\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0448\u044C \u0434\u044B\u0445\u0430\u043D\u0438\u0435 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u043E\u043B\u0433\u043E \u2192 \u0441\u0434\u0435\u043B\u0430\u0439 \u043C\u0435\u043D\u044C\u0448\u0435"],
          prog: "5\u0441\u0435\u043A\xD75\u219210\u0441\u0435\u043A\xD75\u219215\u0441\u0435\u043A\xD75"
        }
      ],
      cooldown: [
        {
          name: "\u0420\u0430\u0441\u0442\u044F\u0436\u043A\u0430 \u0437\u0430\u0434\u043D\u0435\u0439 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438 \u0431\u0435\u0434\u0440\u0430 \u043B\u0451\u0436\u0430",
          dur: "60 \u0441\u0435\u043A/\u043D\u043E\u0433\u0430",
          svgKey: "generic",
          body: ["\u041B\u0451\u0436\u0430 \u043D\u0430 \u0441\u043F\u0438\u043D\u0435. \u041F\u043E\u0434\u043D\u0438\u043C\u0438 \u043E\u0434\u043D\u0443 \u043D\u043E\u0433\u0443, \u043E\u0431\u043D\u0438\u043C\u0438 \u0437\u0430 \u0431\u0435\u0434\u0440\u043E", "\u0422\u044F\u043D\u0438 \u043D\u043E\u0433\u0443 \u043A \u0433\u0440\u0443\u0434\u0438 \u2014 \u0434\u0440\u0443\u0433\u0430\u044F \u0432\u044B\u0442\u044F\u043D\u0443\u0442\u0430 \u043D\u0430 \u043F\u043E\u043B\u0443", "\u041D\u043E\u0433\u0430 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u0441\u043E\u0433\u043D\u0443\u0442\u0430 \u2014 \u0431\u0435\u0437 \u0431\u043E\u043B\u0438, \u0442\u043E\u043B\u044C\u043A\u043E \u0440\u0430\u0441\u0442\u044F\u0436\u0435\u043D\u0438\u0435", "\u041F\u043E\u0447\u0443\u0432\u0441\u0442\u0432\u0443\u0439 \u0440\u0430\u0441\u0442\u044F\u0436\u0435\u043D\u0438\u0435 \u0441\u0437\u0430\u0434\u0438 \u0431\u0435\u0434\u0440\u0430"]
        },
        {
          name: "\u0420\u0430\u0441\u0442\u044F\u0436\u043A\u0430 \u043A\u0432\u0430\u0434\u0440\u0438\u0446\u0435\u043F\u0441\u0430 \u0441\u0442\u043E\u044F",
          dur: "45 \u0441\u0435\u043A/\u043D\u043E\u0433\u0430",
          svgKey: null,
          body: ["\u0414\u0435\u0440\u0436\u0438\u0441\u044C \u0437\u0430 \u0441\u0442\u0435\u043D\u0443 \u0440\u0443\u043A\u043E\u0439", "\u0421\u043E\u0433\u043D\u0438 \u043D\u043E\u0433\u0443 \u043D\u0430\u0437\u0430\u0434, \u0432\u043E\u0437\u044C\u043C\u0438\u0441\u044C \u0440\u0443\u043A\u043E\u0439 \u0437\u0430 \u0441\u0442\u043E\u043F\u0443", "\u0422\u044F\u043D\u0438 \u043F\u044F\u0442\u043A\u0443 \u043A \u044F\u0433\u043E\u0434\u0438\u0446\u0435 \u2014 \u043A\u043E\u043B\u0435\u043D\u043E \u0441\u043C\u043E\u0442\u0440\u0438\u0442 \u0432\u043D\u0438\u0437", "\u0422\u0430\u0437 \u043D\u0435 \u043F\u0435\u0440\u0435\u043A\u0430\u0448\u0438\u0432\u0430\u0439, \u0441\u0442\u043E\u0439 \u043F\u0440\u044F\u043C\u043E"]
        },
        {
          name: "Happy Baby \u2014 \u0440\u0430\u0441\u0441\u043B\u0430\u0431\u043B\u0435\u043D\u0438\u0435 \u0442\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u0434\u043D\u0430",
          dur: "2 \u043C\u0438\u043D",
          svgKey: null,
          body: ["\u041B\u0451\u0436\u0430 \u043D\u0430 \u0441\u043F\u0438\u043D\u0435. \u0421\u043E\u0433\u043D\u0438 \u043D\u043E\u0433\u0438, \u0432\u043E\u0437\u044C\u043C\u0438\u0441\u044C \u0437\u0430 \u0432\u043D\u0435\u0448\u043D\u0438\u0435 \u0441\u0442\u043E\u0440\u043E\u043D\u044B \u0441\u0442\u043E\u043F", "\u041A\u043E\u043B\u0435\u043D\u0438 \u0442\u044F\u043D\u0438 \u043A \u043F\u043E\u0434\u043C\u044B\u0448\u043A\u0430\u043C, \u0448\u0438\u0440\u043E\u043A\u043E \u0440\u0430\u0437\u0432\u0435\u0434\u0438", "\u0420\u0430\u0441\u0441\u043B\u0430\u0431\u044C \u0442\u0430\u0437\u043E\u0432\u043E\u0435 \u0434\u043D\u043E \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u2014 \u0432\u0430\u0436\u043D\u043E \u043F\u043E\u0441\u043B\u0435 \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u043D\u0430 \u043D\u043E\u0433\u0438", "\u0414\u044B\u0448\u0438 \u0433\u043B\u0443\u0431\u043E\u043A\u043E, \u043F\u043E\u043A\u0430\u0447\u0438\u0432\u0430\u0439\u0441\u044F \u0438\u0437 \u0441\u0442\u043E\u0440\u043E\u043D\u044B \u0432 \u0441\u0442\u043E\u0440\u043E\u043D\u0443"]
        }
      ]
    }
  ];
  function useLS(key, def) {
    const [v, sv] = useState(() => {
      try {
        const s = localStorage.getItem(key);
        if (s === null) return def;
        const parsed = JSON.parse(s);
        // Защита: если ожидали объект/массив, а пришло null или иной тип — берём дефолт
        if (parsed === null || parsed === undefined) return def;
        if (def && typeof def === "object" && (typeof parsed !== "object")) return def;
        if (Array.isArray(def) && !Array.isArray(parsed)) return def;
        return parsed;
      } catch {
        return def;
      }
    });
    const set = useCallback((val) => {
      sv(val);
      try {
        localStorage.setItem(key, JSON.stringify(typeof val === "function" ? val(v) : val));
      } catch {
      }
    }, [key]);
    return [v, set];
  }

  // ===========================================================================
  // КЛЮЧЕВЫЕ ДАТЫ ПЛАНА — все даты централизованы тут.
  // Маша начинает план 25 мая 2026 (пн). Все активности — с понедельника.
  // ===========================================================================
  // Хелпер: создаёт дату как 00:00 МЕСТНОГО времени (не UTC).
  // new Date("2026-05-25") парсится как UTC и в Варшаве (UTC+2) показывается как 02:00 25 мая,
  // из-за чего расчёт "сколько дней до старта" может ошибиться на 1.
  const mkd = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  };

  // Локальный ключ дня YYYY-MM-DD (в часовом поясе пользователя).
  // НЕ использовать toISOString() — он в UTC и поздно вечером в Варшаве даёт
  // «завтрашнюю» дату, из-за чего записи попадали не на тот день.
  const dayKey = (d) => {
    const dt = d || new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
  };

  const KEY_DATES = {
    planStart:     mkd("2026-05-25"), // начало Недели 1 (пн)
    planEnd:       mkd("2026-07-26"), // конец Недели 9 (вс)
    // Подключения препаратов — СОГЛАСОВАНО: наш план, старт 30 мая (сб)
    forlaxStart:   mkd("2026-05-30"), // Форлакс — старт нашего плана (сб)
    zincStart:     mkd("2026-05-30"), // Цинк (Zinkorot 25 мг) — старт (сб)
    ironStart:     mkd("2026-06-03"), // Железо + витамин C — со среды, через день
    ironDailyFrom: mkd("2026-06-17"), // Железо ежедневно — через 2 недели от старта
    perfectilStart:mkd("2026-06-07"), // Перфектил — обеденный блок
    omegaStart:    mkd("2026-06-07"), // Омега-3 — обеденный блок
    vitDStart:     mkd("2026-06-07"), // Витамин D — обед, 3×/нед
    niacinStart:   mkd("2026-06-07"), // Ниацинамид — вечер, с 7 июня
    aeStart:       mkd("2026-06-09"), // A+E Medana — вечер, с 9 июня
    cysteniumStart:mkd("2026-06-08"), // Цистениум — на ночь
    crystalvagStart:mkd("2026-06-08"), // Кристалваг — на ночь, со старта 8 июня
    pelvicStart:   mkd("2026-06-15"), // Курс тазового дна — с 15 июня
    gymStart:      mkd("2026-06-10"), // Зал (ср + пт) — ср недели 3
    runStart:      mkd("2026-06-15"), // Бег / ходьба — пн недели 4
    pelvicEnd:     mkd("2026-08-16"), // Курс тазового дна — ~2 мес от 15 июня
    dogLeaveDate:  mkd("2026-05-27"), // Собака уезжает к родителям (ср)
    dayCStart:     mkd("2026-07-06"), // День C — пн недели 7
    block7Start:   mkd("2026-07-06"), // Неделя 7 — анализы
    analysisRemindFrom: mkd("2026-06-29"), // (старое) напоминание — больше не используется напрямую
    // Визит к трихологу: 2 месяца от старта полного приёма
    fullRegimenStart:  mkd("2026-06-12"), // когда подключены все ключевые таблетки (A+E последний, 12 июня)
    trichoVisit:       mkd("2026-08-12"), // приём у трихолога (12 июня + 2 мес)
    trichoBookFrom:    mkd("2026-07-29"), // за 2 недели — пора записаться
    trichoLabsFrom:    mkd("2026-08-05"), // за неделю — пора сдать анализы
  };

  // ===========================================================================
  // ЦИКЛ И ЯРИНА
  //
  // У Маши два связанных, но РАЗНЫХ счётчика:
  //
  // 1. ЦИКЛ — от первого дня месячных до следующих месячных (28 дней).
  //    Якорь "cycleAnchor" = первый день последних месячных.
  //    Используется для прогноза самочувствия и низкой интенсивности.
  //
  // 2. ПАЧКА ЯРИНЫ — 21 таблетка + 7 дней перерыва (28 дней).
  //    Якорь "packAnchor" = первая таблетка ТЕКУЩЕЙ пачки.
  //    Используется для определения "пьём сегодня Ярину или перерыв".
  //
  // ВАЖНО: месячные начинаются ~через 4 дня после последней (21-й) таблетки.
  // То есть если первая таблетка пачки = 15 мая, последняя = 4 июня,
  // месячные начинаются ~8 июня. Это совпадает с новым циклом.
  //
  // У Маши на момент старта плана (25 мая):
  //   - Идёт пачка Ярины, первая таблетка была 15 мая
  //   - Сегодня день 10 пачки (11-я таблетка вечером)
  //   - Последняя таблетка пачки: 4 июня (21-я)
  //   - Перерыв: 5—11 июня
  //   - Следующие месячные: ~8 июня (понедельник)
  //   - Следующая пачка: 12 июня
  // ===========================================================================
  const CYCLE_LEN = 28;
  const ACTIVE_PILLS = 21;
  const PERIOD_LENGTH = 5; // длительность месячных в днях
  // На Ярине «месячные» — это кровотечение отмены в 7-дневный перерыв.
  // Обычно начинается на 2–3-й день перерыва (т.е. через ~2 дня после последней таблетки).
  const WITHDRAWAL_BLEED_OFFSET = 2; // дней от последней таблетки до начала кровотечения

  // На Ярине независимого «цикла» нет — всё определяется пачкой.
  // Единственный якорь, который реально нужен, — первая таблетка текущей пачки.
  // У Маши первая таблетка была 15 мая 2026 (пт).
  function defaultPackAnchor() {
    return "2026-05-15";
  }
  // Якорь цикла больше не нужен отдельно — всё выводится из пачки (defaultPackAnchor).

  // Возвращает день цикла (1..28). День 1 = первый день месячных.
  function getCycleDay(date, anchorStr) {
    const anchor = mkd(anchorStr);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.floor((d - anchor) / 86400000);
    if (diff < 0) {
      return ((diff % CYCLE_LEN) + CYCLE_LEN) % CYCLE_LEN + 1;
    }
    return (diff % CYCLE_LEN) + 1; // 1..28
  }

  // Возвращает день пачки Ярины (1..28).
  // 1..21 = таблетка пьётся, 22..28 = перерыв.
  function getPackDay(date, packAnchorStr) {
    const anchor = mkd(packAnchorStr);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.floor((d - anchor) / 86400000);
    return ((diff % CYCLE_LEN) + CYCLE_LEN) % CYCLE_LEN + 1;
  }

  // Сегодня нужно пить Ярину? (true если день 1..21 пачки)
  function isYarinaActiveToday(date, packAnchorStr) {
    const pd = getPackDay(date, packAnchorStr);
    return pd >= 1 && pd <= ACTIVE_PILLS;
  }

  // Дата начала N-й пачки (1-based) — первая таблетка.
  function getCycleStart(n, anchorStr) {
    const anchor = mkd(anchorStr);
    const result = new Date(anchor);
    result.setDate(result.getDate() + (n - 1) * CYCLE_LEN);
    return result;
  }

  // Дата последней (21-й) таблетки N-й пачки.
  function getLastPillOfPack(n, packAnchorStr) {
    const start = getCycleStart(n, packAnchorStr);
    start.setDate(start.getDate() + ACTIVE_PILLS - 1);
    return start;
  }

  // Прогноз начала кровотечения отмены для N-й пачки = последняя таблетка + 2 дня.
  // Это и есть «месячные» на Ярине. Выводится из пачки → один источник правды.
  function getPredictedPeriodStart(n, packAnchorStr) {
    const last = getLastPillOfPack(n, packAnchorStr);
    last.setDate(last.getDate() + WITHDRAWAL_BLEED_OFFSET);
    return last;
  }

  // Возвращает день месячных (1..N) если сегодня попадает на кровотечение отмены, иначе 0.
  // packAnchorStr — якорь пачки; overrides[n] позволяет вручную поправить фактическую дату.
  function getPeriodDay(date, packAnchorStr, overrides) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const anchor = mkd(packAnchorStr);
    const diff = Math.floor((d - anchor) / 86400000);
    const packNum = Math.floor(diff / CYCLE_LEN) + 1;
    for (let n = Math.max(1, packNum - 1); n <= packNum + 1; n++) {
      const ov = overrides && overrides[n];
      const periodStart = ov ? mkd(ov) : getPredictedPeriodStart(n, packAnchorStr);
      const dayInPeriod = Math.floor((d - periodStart) / 86400000) + 1;
      if (dayInPeriod >= 1 && dayInPeriod <= PERIOD_LENGTH) return dayInPeriod;
    }
    return 0;
  }

  // День 1-3 месячных = лёгкая тренировка (заменяем силовую/кардио на прогулку).
  function isLowIntensityDay(date, anchorStr, overrides) {
    const pd = getPeriodDay(date, anchorStr, overrides);
    return pd >= 1 && pd <= 3;
  }

  // Сегодня день приёма железа? Первые 2 недели — через день (отсчёт от старта).
  // Железо — всегда через день, отсчёт от старта (ср/пт/вс): чётное число дней от ironStart.
  function isIronDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d < KEY_DATES.ironStart) return false;
    const diffDays = Math.round((d - KEY_DATES.ironStart) / 86400000);
    return diffDays % 2 === 0;
  }

  // ===========================================================================
  // ЕДИНЫЙ ИСТОЧНИК ДАННЫХ О ПРЕПАРАТАХ (single source of truth)
  // Раньше препараты были описаны в 4 местах (DEFAULT_PILLS, таймлайн дня,
  // недельные блоки, матрица). Теперь модель и фильтр — здесь, на уровне модуля,
  // и все экраны (список таблеток, «Режим дня», «Сегодня») читают одно и то же.
  // ===========================================================================
  const PILLS_LS_KEY = "pillsListV6";

  // Цвета по времени дня
  const PC = {
    MORNING: "#C68A3E", MORNING_BG: "#FAF0DC",
    PRELUNCH: "#B5703A", PRELUNCH_BG: "#F6E6D6",
    LUNCH: "#6E7C3F", LUNCH_BG: "#EEF1DF",
    EVENING: "#8A6A3A", EVENING_BG: "#F1E7D6",
    NIGHT: "#6B6298", NIGHT_BG: "#ECEAF4",
  };

  // СОГЛАСОВАНО (наш план): старт 30 мая. Железо + витамин C — через день с 3 июня (ср/пт/вс).
  const DEFAULT_PILLS = [
    { id: "iron", name: "Gentle Iron 25 мг + Витамин C", time: "08:15", color: PC.MORNING, bg: PC.MORNING_BG,
      note: "Натощак, за 30–45 мин до завтрака. Через день (СР/ПТ/ВС) с 3 июня. С 17 июня доза вырастет до 50 мг (тоже через день). Запивать водой или соком — НЕ кофе/чаем/молочным (2 ч до и после нельзя). Витамин C усиливает усвоение. Чёрный стул — норма. Gentle Iron (бисглицинат) обычно мягче для ЖКТ.",
      startDate: "2026-06-03", endDate: "2026-06-16", ironRule: true },
    { id: "iron50", name: "Gentle Iron 50 мг + Витамин C", time: "08:15", color: PC.MORNING, bg: PC.MORNING_BG,
      note: "Натощак, за 30–45 мин до завтрака. С 17 июня — 50 мг через день (СР/ПТ/ВС), длительно, для поднятия ферритина. Запивать водой или соком — НЕ кофе/чаем/молочным (2 ч до и после нельзя). Витамин C усиливает усвоение. Чёрный стул — норма.",
      startDate: "2026-06-17", ironRule: true },
    { id: "duxet", name: "Дуксет 60 мг", time: "09:00", color: PC.MORNING, bg: PC.MORNING_BG,
      note: "Антидепрессант (дулоксетин). Утром натощак, в одно и то же время. Принимаешь больше полугода — режим не менять, не пропускать. При резкой отмене — синдром отмены. Частый побочный эффект — запор (поэтому в плане есть Форлакс)." },
    { id: "perfectil", name: "Перфектил", time: "14:00", color: PC.LUNCH, bg: PC.LUNCH_BG,
      note: "Только после полноценного обеда! Натощак — тошнота. Содержит железо, цинк, B-группу, витамины A/E. Доказательная база мультивитаминов «для волос» слабая — это поддержка, а не лечение; главное в твоём плане работает не за счёт него. ⚠️ Содержит витамин А — не дублируй с A+E (см. заметку A+E). С 8 июня.",
      startDate: "2026-06-08" },
    { id: "omega", name: "Омега-3 (2 капсулы)", time: "14:00", color: PC.LUNCH, bg: PC.LUNCH_BG,
      note: "С обедом (с жирами), 2 капсулы. Противовоспалительный эффект, для холестерина. С 8 июня.",
      startDate: "2026-06-08" },
    { id: "vitd", name: "Витамин D 4000 МЕ", time: "14:00", color: PC.LUNCH, bg: PC.LUNCH_BG,
      note: "Только ПН / СР / СБ (3 раза в неделю). С жирной едой — лучше усваивается. С 8 июня.",
      startDate: "2026-06-08", weekdays: [0, 2, 5] },
    { id: "forlax", name: "Форлакс 1 пакет", time: "16:00", color: PC.LUNCH, bg: PC.LUNCH_BG,
      note: "Осмотическое слабительное (макрогол). Развести 1 пакет в ПОЛНОМ стакане воды (~250 мл) и выпить. С едой или без. ОТДЕЛЬНО от других таблеток — ±2 ч (ускоряет транзит, мешает всасыванию). Работает мягко через 24–48 ч. План: один до ~24 июня → затем вместе с Фитомуцилом → с 15 июля убираем, остаётся Фитомуцил. Старт 30 мая.",
      startDate: "2026-05-30", endDate: "2026-07-15" },
    { id: "phytomucil", name: "Фитомуцил Норм Плюс 1 пакетик", time: "18:00", color: PC.LUNCH, bg: PC.LUNCH_BG,
      note: "Растворимая клетчатка (псиллиум + слива). Размешать в стакане воды или кефира (~250 мл), выпить сразу (пока не загустел), и ОБЯЗАТЕЛЬНО запить ещё стаканом воды (~250 мл). Итого ~500 мл — без достаточной воды наоборот крепит и даёт тяжесть. Вводим с 24 июня — сначала вместе с Форлаксом, потом вместо него, длительно. При необходимости до 2 пакетиков/день по инструкции.",
      startDate: "2026-06-24" },
    { id: "zinc", name: "Zinkorot 25 мг", time: "20:00", color: PC.EVENING, bg: PC.EVENING_BG,
      note: "С ужином или сразу после (иначе тошнит). Между цинком и железом большой разрыв (~12 ч — идеально). Трихолог одобрила приём вместе с Перфектилом. Старт 30 мая.",
      startDate: "2026-05-30" },
    { id: "niac", name: "Ниацинамид 500 мг", time: "20:00", color: PC.EVENING, bg: PC.EVENING_BG,
      note: "С ужином — лучше переносится. Это НЕ никотиновая кислота: нет flushing-эффекта и на холестерин не влияет. Для волос доказательная база слабая — скорее поддержка, чем лечение, без завышенных ожиданий. С 7 июня.",
      startDate: "2026-06-07" },
    { id: "ae", name: "A+E Medana (2 капсулы)", time: "20:00", color: PC.EVENING, bg: PC.EVENING_BG,
      note: "Витамин A+E (Vitaminum A+E Medana 2500 МЕ + 200 мг), 2 капсулы с ужином — жирорастворимые, нужна еда с жирами. Отдельно от витамина C и селена. ⚠️ Важно: Перфектил тоже содержит витамин А — вместе возможен перегруз по ретинолу (верхняя граница для женщин ~10 000 МЕ/сут, высокие дозы опасны при беременности). Проверь содержание витамина А на упаковках обоих и обсуди суммарную дозу с врачом/фармацевтом, особенно если беременность возможна. Витамин E слегка разжижает кровь — учитывать с Омегой/Яриной/Дуксетом, сказать врачу перед операциями. С 12 июня.",
      startDate: "2026-06-12" },
    { id: "yarina", name: "Ярина", time: "21:00", color: PC.NIGHT, bg: PC.NIGHT_BG,
      note: "Строго в 21:00. 21 таблетка + 7 дней перерыв. Приложение само скроет в дни перерыва. 🦊 Важно знать: Ярина — это не только контрацепция. Дроспиренон снижает действие мужских гормонов (андрогенов), а именно они при СПКЯ влияют на выпадение волос. То есть Ярина уже работает на твои волосы — особенно вместе с восстановлением железа.",
      yarinaPack: true },
    { id: "cystenium", name: "Цистениум", time: "22:00", color: PC.NIGHT, bg: PC.NIGHT_BG,
      note: "Профилактика циститов (клюква + D-манноза + витамин C). На ночь — действующие вещества дольше работают в мочевом пузыре. Запивать водой, пить достаточно жидкости днём. Это для профилактики, не для лечения активного цистита — при симптомах (жжение, частые позывы, боль) к врачу. С 10 июня.",
      startDate: "2026-06-10" },
    { id: "crystalvag2", name: "Кристалваг 2 капсулы", time: "22:00", color: PC.NIGHT, bg: PC.NIGHT_BG,
      note: "На ночь. Интенсивный старт: первые 10 дней по 2 капсулы (10–19 июня), затем переход на 1 капсулу. Не противоречит инструкции (1–2 капсулы/сут).",
      startDate: "2026-06-10", endDate: "2026-06-19" },
    { id: "crystalvag1", name: "Кристалваг 1 капсула", time: "22:00", color: PC.NIGHT, bg: PC.NIGHT_BG,
      note: "На ночь, поддерживающая доза. С 20 июня по 1 капсуле до конца курса (~9 июля).",
      startDate: "2026-06-20", endDate: "2026-07-09" },
    { id: "lactriol", name: "Лактриол (через день)", time: "22:00", color: PC.NIGHT, bg: PC.NIGHT_BG,
      note: "На ночь, через день. Старт 13 июня (после месячных). Длительно.",
      everyOtherFrom: "2026-06-13" },
    { id: "mel", name: "Мелатонин 2 мг (опц.)", time: "22:00", color: PC.NIGHT, bg: PC.NIGHT_BG,
      note: "Опционально, по необходимости. За час до сна. После приёма не лезть в экраны.", optional: true },
    { id: "relief", name: "Релиф / Анестезол (при обострении)", time: "22:00", color: PC.NIGHT, bg: PC.NIGHT_BG,
      note: "ТОЛЬКО при обострении геморроя/трещины — не для ежедневного приёма. Релиф ИЛИ Анестезол (не вместе): 1 свеча утром + 1 свеча вечером. Отметить, когда используешь.",
      optional: true },
  ];
  const BUILTIN_PILL_IDS = DEFAULT_PILLS.map(p => p.id);

  // 7-дневный протокол восстановления моторики кишечника (поведенческая часть к Форлаксу).
  const GUT_PROTOCOL = [
    { day: 1, title: "Утро: старт", items: ["Стакан тёплой воды натощак, за 20 мин до еды", "Завтрак: овсянка + 1 ст. л. чернослива + льняное масло", "Норма воды: 30 мл/кг веса + стакан на каждую кружку кофе", "Ужин: тёплый суп + тушёные овощи, не холодные блюда"] },
    { day: 2, title: "Жиры и движение", items: ["Добавить жир в каждый приём: авокадо, оливковое масло, 2 яйца в день", "Утреннее движение 7000 шагов — перистальтика активируется от движения", "Активные паузы каждые 1.5–2 часа при сидячей работе", "Убрать в этот день: белый хлеб, бананы, отварной рис"] },
    { day: 3, title: "Клетчатка", items: ["Добавить 1 порцию варёных овощей (20-30 мин термообработки)", "Чернослив 2 ст. л. в день (сорбитол притягивает воду в кишечник)", "Гречка вместо белого риса или макарон", "Не переходить резко: 20-25 г клетчатки в день — достаточно"] },
    { day: 4, title: "Горечи и овощи", items: ["Руккола, редис, брокколи, цветная капуста — стимуляция желчи", "Интервал между приёмами не больше 5 часов", "Есть без телефона и телевизора — внимание на еде улучшает переваривание", "Не подавляй позывы — всегда реагируй на них"] },
    { day: 5, title: "Движение и поза", items: ["Утренняя зарядка 5 мин: подъём колен, наклоны вперёд, твисты", "Ходьба важнее сидячей позиции — каждый шаг помогает", "Поза у туалета: ноги на ступеньке (угол 90°) — физиологичнее", "Массаж живота по часовой стрелке 3–5 мин перед едой"] },
    { day: 6, title: "Нервная система", items: ["2–3 мин диафрагмального дыхания перед каждым приёмом пищи", "Едим без гаджетов и телевизора — стресс замедляет кишечник", "Снижаем стресс где возможно: движение, музыка, сон", "Пробиотики (кефир, натуральный йогурт) каждый день"] },
    { day: 7, title: "Режим и закрепление", items: ["Фиксированное время завтрака — кишечник активнее утром", "Утро: не спешить, дать себе время в туалете", "Оцени результат: частота, консистенция, ощущения", "Если нет улучшения за 2 недели — к гастроэнтерологу"] },
  ];

  // Загрузка/сохранение списка препаратов (единый стор).
  function loadPills() {
    try {
      const s = localStorage.getItem(PILLS_LS_KEY);
      if (s) return JSON.parse(s);
    } catch {}
    return DEFAULT_PILLS;
  }
  function savePills(list) {
    try { localStorage.setItem(PILLS_LS_KEY, JSON.stringify(list)); } catch {}
  }

  // Активен ли препарат в конкретный день — ЕДИНАЯ логика фильтра.
  function isPillActiveOn(pill, date, packAnchor) {
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
    if (pill.startDate && d < mkd(pill.startDate)) return false;
    if (pill.endDate && d > mkd(pill.endDate)) return false; // курс закончился
    if (pill.weekdays && !pill.weekdays.includes(dow)) return false;
    if (pill.ironRule && !isIronDay(d)) return false;
    if (pill.yarinaPack && packAnchor && !isYarinaActiveToday(d, packAnchor)) return false;
    // Приём через день от даты старта (например, Лактриол)
    if (pill.everyOtherFrom) {
      const diff = Math.round((d - mkd(pill.everyOtherFrom)) / 86400000);
      if (diff < 0 || diff % 2 !== 0) return false;
    }
    return true;
  }

  // Список активных препаратов на дату, отсортированный по времени.
  function activePillsOn(date, packAnchor, pills) {
    const list = pills || loadPills();
    return list
      .filter(p => isPillActiveOn(p, date, packAnchor))
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }

  // ===========================================================================
  // КОМПОНЕНТ: лиса-картинка (использует PNG из папки assets)
  // ===========================================================================
  function FoxImage({ kind, size = 64, opacity = 1, style = {} }) {
    const src = {
      main: "./fox-main.png",
      path: "./fox-path.jpg",
      grass: "./decor-grass.png",
      mushrooms: "./decor-mushrooms.png",
      tracks: "./decor-tracks.png",
    }[kind];
    if (!src) return null;
    return React.createElement("img", {
      src, alt: "",
      style: { width: size, height: "auto", opacity, display: "block", ...style }
    });
  }

  // Иконка навигации с лисой. maxHeight ограничивает все иконки одной высотой,
  // т.к. PNG разные по высоте (лиса спит, бежит, сидит) — без этого текст под ними сместится.
  function FoxNavIcon({ kind, size = 28, active }) {
    const src = `./nav-${kind}.png`;
    return React.createElement("img", {
      src, alt: "",
      style: {
        maxWidth: size, maxHeight: size, width: "auto", height: "auto", display: "block",
        opacity: active ? 1 : 0.42,
        filter: active ? "none" : "grayscale(40%)",
        transition: "opacity .15s"
      }
    });
  }

  // ===========================================================================
  // IronWindow — карточка "запретное окно" для железа.
  // Показывает можно ли сейчас кофе/зелёный чай/молочное.
  // Окно запрета: 09:30 — 13:30 в дни приёма железа.
  // ===========================================================================
  function IronWindow() {
    const now = new Date();
    const todayDate = new Date(now); todayDate.setHours(0, 0, 0, 0);

    // Если железо ещё не введено — карточка не показывается
    if (todayDate < KEY_DATES.ironStart) return null;

    const ironToday = isIronDay(todayDate);
    if (!ironToday) {
      // День без железа — пьём что хотим
      return React.createElement("div", {
        style: { background: C.sandSoft, border: `0.5px solid ${C.sand}33`, borderRadius: 10, padding: "10px 13px", marginBottom: 10 }
      },
        React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } },
          React.createElement("div", { style: { fontSize: 18 } }, "☕"),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.sandDeep } }, "Сегодня без железа"),
            React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2, lineHeight: 1.5 } }, "Зелёный чай и молочное — без ограничений весь день")
          )
        )
      );
    }

    // День с железом — считаем где сейчас в окне
    const hour = now.getHours();
    const minute = now.getMinutes();
    const curMins = hour * 60 + minute;
    const banStart = 7 * 60 + 45;  // 07:45 — до приёма железа
    const ironTime = 8 * 60 + 15;  // 08:15 — приём железа натощак
    const banEnd = 9 * 60 + 30;    // 09:30 — завтрак (≈1.25 ч после железа)

    const fmt = (mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    let state, color, bg, border, title, hint;
    if (curMins < banStart) {
      // До начала окна
      const left = banStart - curMins;
      state = "before";
      color = C.ok; bg = C.sandSoft; border = `${C.sand}33`;
      title = `☕ Чай / молочное можно`;
      const leftH = Math.floor(left / 60), leftM = left % 60;
      hint = `Запретное окно начнётся в ${fmt(banStart)} (через ${leftH > 0 ? leftH + 'ч ' : ''}${leftM} мин). Успей последнюю чашку!`;
    } else if (curMins < banEnd) {
      // В запретном окне
      const left = banEnd - curMins;
      state = "ban";
      color = C.warn; bg = C.warnSoft; border = `${C.warn}55`;
      const isIronTime = Math.abs(curMins - ironTime) < 30;
      title = isIronTime ? `💊 Сейчас — железо!` : `🚫 Запретное окно (до ${fmt(banEnd)})`;
      const leftH = Math.floor(left / 60), leftM = left % 60;
      hint = `Нельзя кофе / зелёный чай / молочное. До конца окна: ${leftH > 0 ? leftH + 'ч ' : ''}${leftM} мин. Только вода.`;
    } else {
      // После окна
      state = "after";
      color = C.ok; bg = C.sandSoft; border = `${C.sand}33`;
      title = `☕ Окно закрыто — снова можно`;
      hint = `Запретное окно прошло. Зелёный чай и молочное — без ограничений до завтра.`;
    }

    return React.createElement("div", {
      style: { background: bg, border: `0.5px solid ${border}`, borderRadius: 10, padding: "10px 13px", marginBottom: 10 }
    },
      React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color, marginBottom: 3 } }, title),
      React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.5 } }, hint)
    );
  }

  // ===========================================================================
  // ProteinTracker — трекер белка с быстрыми кнопками.
  // Цель: 90 г/день. Кнопки: +30 (полная еда), +25 (протеин), +20, +15.
  // ===========================================================================
  function ProteinTracker() {
    const todayKey = dayKey();
    const [proteinLog, setProteinLog] = useLS("proteinLogV1", {});
    const [goal] = useLS("proteinGoal", 90);
    const [showCustom, setShowCustom] = useState(false);
    const [custom, setCustom] = useState("");

    const todayG = proteinLog[todayKey] || 0;
    const pct = Math.min(100, Math.round(todayG / goal * 100));
    const left = Math.max(0, goal - todayG);

    const add = (g) => {
      const newVal = Math.max(0, todayG + g);
      setProteinLog({ ...proteinLog, [todayKey]: newVal });
    };
    const addCustom = () => {
      const n = parseInt(custom, 10);
      if (!isNaN(n) && n !== 0) add(n); // принимаем и отрицательные
      setCustom(""); setShowCustom(false);
    };
    const reset = () => {
      const upd = { ...proteinLog };
      delete upd[todayKey];
      setProteinLog(upd);
    };

    const color = pct >= 100 ? C.ok : pct >= 60 ? C.olive : C.warn;

    return React.createElement("div", {
      style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10 }
    },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, "🥩 Белок сегодня"),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } }, todayG, " г / ", goal, " г · осталось ", left, " г")
        ),
        React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color } }, pct, "%")
      ),
      // Прогресс-бар
      React.createElement("div", { style: { height: 6, background: C.bgWarm, borderRadius: 3, overflow: "hidden", marginBottom: 10 } },
        React.createElement("div", { style: { height: "100%", width: pct + "%", background: color, transition: "width .3s" } })
      ),
      // Быстрые кнопки
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5, marginBottom: 6 } },
        [
          { v: 15, l: "+15 г", sub: "йогурт" },
          { v: 20, l: "+20 г", sub: "яйца" },
          { v: 25, l: "+25 г", sub: "коктейль" },
          { v: 30, l: "+30 г", sub: "мясо/рыба" },
        ].map(b => React.createElement("button", {
          key: b.v, onClick: () => add(b.v),
          style: { padding: "7px 4px", borderRadius: 7, background: C.oliveSoft, border: `0.5px solid ${C.olive}33`,
            color: C.oliveDeep, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.2 }
        },
          React.createElement("div", null, b.l),
          React.createElement("div", { style: { fontSize: 9, color: C.textM, marginTop: 1 } }, b.sub)
        ))
      ),
      React.createElement("div", { style: { display: "flex", gap: 5 } },
        showCustom
          ? React.createElement(React.Fragment, null,
              React.createElement("input", { type: "number", value: custom, onChange: e => setCustom(e.target.value),
                placeholder: "+10 или -5", min: "-200", max: "200",
                style: { flex: 1, padding: "7px 10px", borderRadius: 7, border: `0.5px solid ${C.border}`,
                  fontSize: 13, fontFamily: "inherit", outline: "none", background: C.bg, color: C.text, boxSizing: "border-box" }
              }),
              React.createElement("button", { onClick: addCustom,
                style: { padding: "7px 12px", borderRadius: 7, background: C.olive, border: "none", color: "#fff",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }
              }, "Добавить"),
              React.createElement("button", { onClick: () => { setShowCustom(false); setCustom(""); },
                style: { padding: "7px 10px", borderRadius: 7, background: C.bgWarm, border: "none", color: C.textM,
                  fontSize: 12, cursor: "pointer", fontFamily: "inherit" }
              }, "✕")
            )
          : React.createElement(React.Fragment, null,
              React.createElement("button", { onClick: () => setShowCustom(true),
                style: { flex: 1, padding: "7px", borderRadius: 7, background: "none", border: `0.5px dashed ${C.border}`,
                  color: C.textM, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }
              }, "+ другое количество"),
              todayG > 0 && React.createElement("button", { onClick: reset,
                style: { padding: "7px 11px", borderRadius: 7, background: "none", border: `0.5px solid ${C.border}`,
                  color: C.textL, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }
              }, "↺")
            )
      )
    );
  }

  // ===========================================================================
  // StepsTracker — ручной ввод шагов за день (опциональный)
  // ===========================================================================
  function StepsTracker() {
    const todayKey = dayKey();
    const [stepsLog, setStepsLog] = useLS("stepsLogV1", {});
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState("");

    const todaySteps = stepsLog[todayKey] || 0;

    const save = () => {
      const n = parseInt(val, 10);
      if (!isNaN(n) && n >= 0) {
        setStepsLog({ ...stepsLog, [todayKey]: n });
      }
      setEditing(false); setVal("");
    };

    if (!editing && todaySteps === 0) {
      return React.createElement("div", {
        style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10 }
      },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, "👣 Шаги сегодня"),
            React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } }, "Цель ~5000 · пока не записано")
          ),
          React.createElement("button", { onClick: () => setEditing(true),
            style: { padding: "7px 14px", borderRadius: 8, background: C.olive, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, "Записать")
        ),
        React.createElement("div", { style: { height: 6, background: C.bgWarm, borderRadius: 3, overflow: "hidden" } },
          React.createElement("div", { style: { height: "100%", width: "0%", background: C.olive } }))
      );
    }

    if (editing) {
      return React.createElement("div", {
        style: { background: C.card, border: `0.5px solid ${C.olive}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10 }
      },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 } }, "👣 Шаги сегодня"),
        React.createElement("div", { style: { display: "flex", gap: 6 } },
          React.createElement("input", { type: "number", value: val, onChange: e => setVal(e.target.value),
            placeholder: todaySteps > 0 ? String(todaySteps) : "5000", min: "0", max: "100000", autoFocus: true,
            style: { flex: 1, padding: "9px 11px", borderRadius: 7, border: `0.5px solid ${C.border}`,
              fontSize: 14, fontFamily: "inherit", outline: "none", background: C.bg, color: C.text, boxSizing: "border-box" }
          }),
          React.createElement("button", { onClick: save,
            style: { padding: "9px 14px", borderRadius: 7, background: C.olive, border: "none", color: "#fff",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }
          }, "OK"),
          React.createElement("button", { onClick: () => { setEditing(false); setVal(""); },
            style: { padding: "9px 11px", borderRadius: 7, background: C.bgWarm, border: "none", color: C.textM,
              fontSize: 12, cursor: "pointer", fontFamily: "inherit" }
          }, "✕")
        )
      );
    }

    // todaySteps > 0
    const stepPct = Math.min(100, Math.round(todaySteps / 5000 * 100));
    const stepColor = stepPct >= 100 ? C.ok : stepPct >= 50 ? C.olive : C.sand;
    return React.createElement("div", {
      onClick: () => { setEditing(true); setVal(String(todaySteps)); },
      style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px",
        cursor: "pointer", marginBottom: 10 }
    },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, "👣 Шаги сегодня"),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } }, todaySteps.toLocaleString("ru-RU"), " из ~5000 · нажми, чтобы изменить")
        ),
        React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: stepColor } }, todaySteps.toLocaleString("ru-RU"))
      ),
      React.createElement("div", { style: { height: 6, background: C.bgWarm, borderRadius: 3, overflow: "hidden" } },
        React.createElement("div", { style: { height: "100%", width: stepPct + "%", background: stepColor, transition: "width .3s" } }))
    );
  }

  // ===========================================================================
  // DayScheduleCard — компактный таймлайн режима дня
  // Показывает: что сейчас, следующие 3 действия. По клику открывает полный режим.
  // ===========================================================================
  function DayScheduleCard({ cycleAnchor, periodOverrides, workoutDays, packAnchor, onOpen }) {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const curMins = now.getHours() * 60 + now.getMinutes();
    const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const isTrainingDay = today >= KEY_DATES.gymStart && workoutDays.includes(dow);

    // Лайфстайл-каркас (еда/сон/зал) + препараты из ЕДИНОГО источника.
    const items = [];
    items.push({ time: "08:00", label: "Подъём, стакан воды", icon: "☀️", kind: "wake" });
    items.push({ time: "09:00", label: "Завтрак", icon: "🍳", kind: "meal" });
    items.push({ time: "14:00", label: "Обед (с жирами)", icon: "🥗", kind: "meal" });

    if (isTrainingDay) {
      items.push({ time: "17:30", label: "Лёгкий перекус (банан/йогурт)", icon: "🍌", kind: "meal" });
      items.push({ time: "18:00", label: "Разминка 10 мин", icon: "🏋", kind: "gym" });
      items.push({ time: "18:10", label: "Силовая 40 мин", icon: "🏋", kind: "gym" });
      if (today >= KEY_DATES.pelvicStart && today <= KEY_DATES.pelvicEnd) {
        items.push({ time: "18:50", label: "Курс таз. дна 30 мин (в зале)", icon: "🌸", kind: "pelvic" });
      }
      items.push({ time: "19:15", label: "Поздний ужин", icon: "🍽", kind: "meal" });
    } else {
      if (today >= KEY_DATES.pelvicStart && today <= KEY_DATES.pelvicEnd && dow !== 6) {
        items.push({ time: "18:00", label: "Курс таз. дна 30 мин", icon: "🌸", kind: "pelvic" });
      }
      items.push({ time: "19:00", label: "Ужин", icon: "🍽", kind: "meal" });
    }
    if (!isTrainingDay) {
      items.push({ time: "20:30", label: "Мягкое движение по желанию", icon: "🌿", kind: "move" });
    }
    items.push({ time: "22:00", label: "Готовлюсь ко сну", icon: "🌙", kind: "sleep" });
    items.push({ time: "23:00", label: "Сплю", icon: "😴", kind: "sleep" });

    // Препараты — из единого источника (тот же список, что и в трекере таблеток)
    activePillsOn(today, packAnchor).forEach(p => {
      items.push({ time: p.time || "12:00", label: p.name, icon: "💊", kind: p.id === "iron" ? "pill_iron" : "pill" });
    });

    // Помечаем "прошло" и "сейчас"
    const enriched = items.map(it => {
      const [h, m] = it.time.split(":").map(Number);
      const mins = h * 60 + m;
      return { ...it, mins };
    }).sort((a, b) => a.mins - b.mins);

    // Найдём "следующее" — ближайшее в будущем
    const upcoming = enriched.filter(it => it.mins >= curMins);
    const past = enriched.filter(it => it.mins < curMins);
    const next3 = upcoming.slice(0, 3);
    const lastPast = past.slice(-1);

    return React.createElement("div", {
      style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px",
        marginBottom: 10, cursor: "pointer" },
      onClick: onOpen
    },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, "📋 Режим дня"),
        React.createElement("div", { style: { fontSize: 11, color: C.textL } }, "полный →")
      ),
      lastPast.length > 0 && React.createElement("div", {
        style: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0", opacity: 0.45 }
      },
        React.createElement("div", { style: { fontSize: 11, color: C.textL, width: 42, fontVariantNumeric: "tabular-nums" } }, lastPast[0].time),
        React.createElement("div", { style: { fontSize: 14 } }, lastPast[0].icon),
        React.createElement("div", { style: { fontSize: 12, color: C.textM, flex: 1, textDecoration: "line-through" } }, lastPast[0].label)
      ),
      // Если есть upcoming — показываем 3 ближайших.
      // Если ничего не осталось — плашка "всё на сегодня".
      next3.length > 0
        ? next3.map((it, i) => React.createElement("div", { key: i,
            style: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0",
              fontWeight: i === 0 ? 600 : 400 }
          },
            React.createElement("div", { style: { fontSize: 11, color: i === 0 ? C.olive : C.textM, width: 42, fontVariantNumeric: "tabular-nums", fontWeight: i === 0 ? 600 : 400 } }, it.time),
            React.createElement("div", { style: { fontSize: 14 } }, it.icon),
            React.createElement("div", { style: { fontSize: 12, color: i === 0 ? C.text : C.textM, flex: 1, fontWeight: i === 0 ? 600 : 400 } }, it.label),
            i === 0 && React.createElement("div", { style: { fontSize: 10, color: C.olive, fontWeight: 600 } }, "СЛЕД.")
          ))
        : React.createElement("div", {
            style: { padding: "10px 0", textAlign: "center" }
          },
            React.createElement("div", { style: { fontSize: 13, color: C.ok, fontWeight: 600 } }, "✓ Всё на сегодня"),
            React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 3 } }, "Хорошего сна! Завтра подъём в 08:00")
          )
    );
  }

  // ===========================================================================
  // FullScheduleModal — полный режим дня (модалка)
  // ===========================================================================
  function FullScheduleModal({ onClose, workoutDays, cycleAnchor, packAnchor, periodOverrides }) {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const curMins = now.getHours() * 60 + now.getMinutes();
    const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const isTrainingDay = today >= KEY_DATES.gymStart && workoutDays.includes(dow);

    const items = [];
    items.push({ time: "08:00", label: "Подъём", note: "Свет, стакан тёплой воды натощак" });
    items.push({ time: "09:00", label: "Завтрак 🍳", note: "Белок 20-25 г" });
    items.push({ time: "14:00", label: "Обед 🍽", note: "Полноценная еда с жирами, белок 30-35 г" });

    if (isTrainingDay) {
      items.push({ time: "17:30", label: "Лёгкий перекус 🍌", note: "Банан / йогурт / орехи — перед залом" });
      items.push({ time: "18:00", label: "Разминка 10 мин 🏋", note: "Лёгкое кардио, мобилизация суставов" });
      items.push({ time: "18:10", label: "Силовая 40 мин 🏋", note: "Минимальные веса, выдох на усилии" });
      if (today >= KEY_DATES.pelvicStart && today <= KEY_DATES.pelvicEnd) {
        items.push({ time: "18:50", label: "Курс таз. дна 30 мин 🌸", note: "Сразу после силовой, в зале" });
      }
      items.push({ time: "19:15", label: "Поздний ужин 🍽", note: "Белок 25-30 г + овощи" });
    } else {
      if (today >= KEY_DATES.pelvicStart && today <= KEY_DATES.pelvicEnd && dow !== 6) {
        items.push({ time: "18:00", label: "Курс таз. дна 30 мин 🌸", note: "6 раз в неделю, отдых в воскресенье" });
      }
      items.push({ time: "19:00", label: "Ужин 🍽", note: "Белок 25-30 г + овощи" });
    }
    if (!isTrainingDay) {
      items.push({ time: "20:30", label: "Мягкое движение 🌿", note: "По желанию, спокойный темп" });
    }
    items.push({ time: "22:00", label: "Готовлюсь ко сну 🌙", note: "Душ, свет приглушённый. Мелатонин — по необходимости" });
    items.push({ time: "23:00", label: "Сплю 😴", note: "До 8:00 = 9 часов сна" });

    // Препараты — из единого источника (краткая заметка = первая фраза note)
    activePillsOn(today, packAnchor).forEach(p => {
      const shortNote = (p.note || "").split(/[.!]/)[0];
      items.push({ time: p.time || "12:00", label: p.name + " 💊", note: shortNote });
    });

    const enriched = items.map(it => {
      const [h, m] = it.time.split(":").map(Number);
      return { ...it, mins: h * 60 + m };
    }).sort((a, b) => a.mins - b.mins);

    return React.createElement("div", {
      onClick: onClose,
      style: { position: "fixed", inset: 0, background: "rgba(46,36,24,0.55)", zIndex: 300,
        display: "flex", alignItems: "flex-end", justifyContent: "center" }
    },
      React.createElement("div", {
        onClick: e => e.stopPropagation(),
        style: { background: C.bg, borderRadius: "16px 16px 0 0", padding: "16px 14px 20px",
          width: "100%", maxWidth: 430, maxHeight: "85vh", overflowY: "auto" }
      },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } },
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 16, fontWeight: 600, color: C.text } }, "Режим дня"),
            React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } }, isTrainingDay ? "Тренировочный день" : "Обычный день")
          ),
          React.createElement("button", { onClick: onClose,
            style: { background: "none", border: "none", fontSize: 22, color: C.textL, cursor: "pointer", padding: 4, fontFamily: "inherit" }
          }, "✕")
        ),
        enriched.map((it, i) => {
          const past = it.mins < curMins;
          return React.createElement("div", { key: i,
            style: { display: "flex", gap: 10, padding: "10px 0",
              borderBottom: i < enriched.length - 1 ? `0.5px solid ${C.border}` : "none",
              opacity: past ? 0.45 : 1 }
          },
            React.createElement("div", { style: { fontSize: 12, color: past ? C.textL : C.olive, fontWeight: 600,
              width: 50, fontVariantNumeric: "tabular-nums", flexShrink: 0, paddingTop: 1 } }, it.time),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: past ? C.textM : C.text,
                textDecoration: past ? "line-through" : "none" } }, it.label),
              it.note && React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 2, lineHeight: 1.4 } }, it.note)
            )
          );
        })
      )
    );
  }

  // ===========================================================================
  // getTodayActivity — определяет какое движение приложение показывает сегодня.
  // Учитывает: старт зала (10 июня — ср), бег с 15 июня, 1-3 день месячных
  // (заменяем на прогулку), отъезд собаки (с 27 мая → прогулка одной), bad-day режим.
  //
  // Возвращает: { kind, label, hint, icon }
  // kind:  "before_plan" | "walk_dog" | "walk_alone" | "walk_long" | "walk_period"
  //        "gym_a" | "gym_b" | "gym_c" | "run" | "rest"
  // ===========================================================================
  function getTodayActivity({ date, cycleAnchor, periodOverrides, workoutDays, badDay }) {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    const dow = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0=Пн..6=Вс

    // ДО старта плана (до 25 мая) — особое состояние
    if (today < KEY_DATES.planStart) {
      const daysLeft = Math.ceil((KEY_DATES.planStart - today) / 86400000);
      return {
        kind: "before_plan",
        label: daysLeft === 1 ? "Завтра — старт плана!" : `До старта плана ${daysLeft} дн.`,
        hint: "Приём по плану начинается 30 мая. Сейчас — привычный режим (Ярина и Дуксет как обычно).",
        icon: "🌱"
      };
    }

    // Bad-day режим — лёгкий день, мягкое движение
    if (badDay) {
      return {
        kind: "easy",
        label: "Лёгкий день",
        hint: "Сегодня плохо себя чувствуешь — никаких силовых. Мягкое движение по желанию, не больше.",
        icon: "💛"
      };
    }

    // 1-3 день месячных → без интенсивности
    const periodDay = getPeriodDay(today, cycleAnchor, periodOverrides);
    if (periodDay >= 1 && periodDay <= 3) {
      return {
        kind: "easy_period",
        label: "Лёгкий день",
        hint: `День ${periodDay} месячных — без интенсивности, мягкое движение по желанию. Курс таз. дна делаешь, он даже помогает при ПМС.`,
        icon: "🌸"
      };
    }

    // С 10 июня — силовые в дни workoutDays (по умолчанию ср + пт)
    const gymOpen = today >= KEY_DATES.gymStart;
    const isWorkoutDay = gymOpen && workoutDays.includes(dow);

    if (isWorkoutDay) {
      let trainingCount = 0;
      const d0 = new Date(KEY_DATES.gymStart);
      const d1 = new Date(today);
      d1.setHours(0, 0, 0, 0);
      for (let d = new Date(d0); d < d1; d.setDate(d.getDate() + 1)) {
        const dw = d.getDay() === 0 ? 6 : d.getDay() - 1;
        if (workoutDays.includes(dw)) {
          const pd = getPeriodDay(d, cycleAnchor, periodOverrides);
          if (pd < 1 || pd > 3) trainingCount++;
        }
      }
      const dayCAvailable = today >= KEY_DATES.dayCStart;
      const types = dayCAvailable && workoutDays.length >= 3 ? 3 : 2;
      const dayType = trainingCount % types;

      if (dayType === 0) return {
        kind: "gym_a",
        label: "Зал — День A",
        hint: trainingCount === 0
          ? "ПЕРВАЯ ТРЕНИРОВКА — начни с минимальных весов (пустой гриф Смита, гантели 4 кг). Сегодня цель — освоить движения, а не нагрузить мышцы. Подобрать вес — на следующей."
          : "10 мин разминка + 40 мин силовая (ягодицы+кор) + 30 мин таз. дна. Техника > вес.",
        icon: "🍑"
      };
      if (dayType === 1) return {
        kind: "gym_b",
        label: "Зал — День B",
        hint: trainingCount <= 1
          ? "Спина и кор. Если это вторая тренировка — продолжай с минимальными весами. Без жима лёжа."
          : "10 мин разминка + 40 мин силовая (спина+кор) + 30 мин таз. дна. Без жима лёжа.",
        icon: "🦅"
      };
      if (dayType === 2) return {
        kind: "gym_c",
        label: "Зал — День C",
        hint: "10 мин разминка + 40 мин силовая (ягодицы+ноги) + 30 мин таз. дна. ⚠ Если выпады ходячие сложны — начни со СТАТИЧНЫХ выпадов в Смите.",
        icon: "🔥"
      };
    }

    // Бег / ходьба с 15 июня — в субботу (если суббота не тренировочный день)
    const runOpen = today >= KEY_DATES.runStart;
    if (runOpen && dow === 5 && !workoutDays.includes(5)) {
      return {
        kind: "run",
        label: "Ходьба / бег",
        hint: "Начни с быстрой ходьбы или incline walking. Темп разговорный — должна мочь говорить.",
        icon: "🏃"
      };
    }

    // Воскресенье — отдых
    if (dow === 6) {
      return {
        kind: "rest",
        label: "День отдыха",
        hint: "Восстановление. Мягкое движение — по желанию. Курс таз. дна — выходной.",
        icon: "🌙"
      };
    }

    // Будний/субботний не-тренировочный день — лёгкое движение
    return {
      kind: "easy",
      label: "Лёгкий день",
      hint: gymOpen ? "Между тренировками — спокойное движение по желанию." :
            today < KEY_DATES.pelvicStart ? "Зал и курс таз. дна — впереди. Сейчас режим и сон." :
            today < KEY_DATES.gymStart ? "Зал стартует 10 июня. Сейчас — курс таз. дна." :
            "Между тренировками — спокойное движение по желанию.",
      icon: "🌿"
    };
  }

  // ===========================================================================
  // MoodDiary — дневник состояния (раз в день).
  // Сохраняет: настроение (1-5), энергию (1-5), ЖКТ (категория), сон-часы и качество.
  // Данные используются для графиков в TrendsTab.
  // ===========================================================================
  function MoodDiary({ onClose, inline }) {
    const todayKey = dayKey();
    const [log, setLog] = useLS("moodDiaryV1", {});
    const existing = log[todayKey] || { mood: 0, energy: 0, gut: "", sleepH: 0, sleepQ: 0, note: "" };
    let sleepFromTracker = { h: 0, q: 0 };
    try {
      const sl = (JSON.parse(localStorage.getItem("sleepLog") || "{}") || {});
      sleepFromTracker = sl[new Date().toLocaleDateString("ru-RU")] || { h: 0, q: 0 };
    } catch {}
    const [mood, setMood] = useState(existing.mood);
    const [energy, setEnergy] = useState(existing.energy);
    const [gut, setGut] = useState(existing.gut);
    const sleepH = sleepFromTracker.h || 0;
    const sleepQ = sleepFromTracker.q || 0;
    const [note, setNote] = useState(existing.note);

    const moodEmojis = ["😞", "😐", "🙂", "😊", "😄"];
    const energyLabels = ["нет сил", "мало", "ок", "хорошо", "много"];
    const gutOptions = [
      { v: "soft", l: "мягкий", color: C.ok },
      { v: "norm", l: "норма", color: C.ok },
      { v: "hard", l: "твёрдый", color: C.olive },
      { v: "skip", l: "не было", color: C.textL },
    ];

    // Автосохранение для inline-режима (без кнопки)
    const persist = (patch) => {
      const cur = { mood, energy, gut, sleepH, sleepQ, note, ...patch, savedAt: new Date().toISOString() };
      setLog({ ...log, [todayKey]: cur });
    };
    const pickMood = (v) => { setMood(v); if (inline) persist({ mood: v }); };
    const pickEnergy = (v) => { setEnergy(v); if (inline) persist({ energy: v }); };
    const pickGut = (v) => { setGut(v); if (inline) persist({ gut: v }); };
    const blurNote = () => { if (inline) persist({ note }); };

    const save = () => {
      setLog({ ...log, [todayKey]: { mood, energy, gut, sleepH, sleepQ, note, savedAt: new Date().toISOString() } });
      onClose && onClose();
    };

    const Section = ({ title, children }) => React.createElement("div", { style: { marginBottom: 16 } },
      React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.textM, marginBottom: 8, letterSpacing: 0.3 } }, title),
      children
    );

    const body = React.createElement(React.Fragment, null,
      Section({ title: "Настроение", children: React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "space-between" } },
        moodEmojis.map((emoji, i) => React.createElement("button", {
          key: i, onClick: () => pickMood(i + 1),
          style: { flex: 1, padding: "10px 0", borderRadius: 10, border: `0.5px solid ${mood === i + 1 ? C.olive : C.border}`,
            background: mood === i + 1 ? C.oliveSoft : C.card, fontSize: 22, cursor: "pointer", fontFamily: "inherit" }
        }, emoji))
      )}),

      Section({ title: "Энергия", children: React.createElement("div", { style: { display: "flex", gap: 4, justifyContent: "space-between" } },
        [1, 2, 3, 4, 5].map(n => React.createElement("button", {
          key: n, onClick: () => pickEnergy(n),
          style: { flex: 1, padding: "8px 0", borderRadius: 8, border: `0.5px solid ${energy === n ? C.olive : C.border}`,
            background: energy === n ? C.oliveSoft : C.card, cursor: "pointer", fontFamily: "inherit",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }
        },
          React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: energy === n ? C.oliveDeep : C.text } }, n),
          React.createElement("div", { style: { fontSize: 10, color: C.textM } }, energyLabels[n - 1])
        ))
      )}),

      Section({ title: "ЖКТ сегодня", children: React.createElement(React.Fragment, null,
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 } },
          gutOptions.map(o => React.createElement("button", {
            key: o.v, onClick: () => pickGut(o.v),
            style: { padding: "9px", borderRadius: 8, border: `0.5px solid ${gut === o.v ? o.color : C.border}`,
              background: gut === o.v ? o.color + "22" : C.card, fontSize: 12, fontWeight: 500, color: gut === o.v ? o.color : C.text,
              cursor: "pointer", fontFamily: "inherit" }
          }, o.l))
        ),
        React.createElement("div", { style: { fontSize: 11, color: C.textL, lineHeight: 1.55, marginTop: 8 } },
          "Тёмный, почти чёрный стул на фоне железа — это норма. Если заметила алую кровь или чёрный дёгтеобразный стул — это вопрос к врачу (можно записать в «Вопросы врачу»).")
      )}),

      Section({ title: "Заметка (по желанию)", children: React.createElement("textarea", {
        value: note, onChange: e => setNote(e.target.value), onBlur: blurNote,
        placeholder: "Что-то заметила за день?",
        style: { width: "100%", padding: "10px", borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
          color: C.text, resize: "vertical", minHeight: 60, boxSizing: "border-box", outline: "none", background: C.bg }
      })})
    );

    // Inline-режим: всегда открыт, без кнопки и крестика, заголовок-карточка как у других
    if (inline) {
      return React.createElement("div", { style: { background: C.card, borderRadius: 12, padding: "12px 14px", border: `0.5px solid ${C.border}`, marginBottom: 10 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 } }, "🌿 Как ты сегодня?"),
        body
      );
    }

    return React.createElement("div", { style: { background: C.card, borderRadius: 14, padding: "16px", border: `0.5px solid ${C.border}` } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 15, fontWeight: 600, color: C.text } }, "Как ты сегодня?"),
        onClose && React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", fontSize: 18, color: C.textL, cursor: "pointer", padding: 4, fontFamily: "inherit" } }, "✕")
      ),
      body,
      React.createElement("button", { onClick: save,
        disabled: mood === 0,
        style: { width: "100%", padding: "12px", borderRadius: 10, background: mood > 0 ? C.olive : C.border, border: "none",
          color: mood > 0 ? "#fff" : C.textL, fontSize: 14, fontWeight: 600, cursor: mood > 0 ? "pointer" : "default", fontFamily: "inherit" }
      }, "Сохранить")
    );
  }
  function useCountdown(secs) {
    const [left, setLeft] = useState(secs);
    const [on, setOn] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      if (on && left > 0) ref.current = setTimeout(() => setLeft((l) => l - 1), 1e3);
      else if (left === 0) setOn(false);
      return () => clearTimeout(ref.current);
    }, [on, left]);
    return { left, on, toggle: () => {
      if (left === 0) {
        setLeft(secs);
        setOn(false);
      } else setOn((o) => !o);
    }, reset: () => {
      setLeft(secs);
      setOn(false);
    } };
  }
  function Ring({ pct, size = 44, stroke = 4, color = C.olive }) {
    const r = (size - stroke) / 2, circ = 2 * Math.PI * r, off = circ - pct / 100 * circ;
    return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, style: { transform: "rotate(-90deg)" } }, /* @__PURE__ */ React.createElement("circle", { cx: size / 2, cy: size / 2, r, fill: "none", stroke: C.border, strokeWidth: stroke }), /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: size / 2,
        cy: size / 2,
        r,
        fill: "none",
        stroke: color,
        strokeWidth: stroke,
        strokeDasharray: circ,
        strokeDashoffset: off,
        strokeLinecap: "round",
        style: { transition: "stroke-dashoffset .5s ease" }
      }
    ));
  }
  function SetTracker({ exId, dayId, clr }) {
    const [sets, setSets] = useLS(`s_${dayId}_${exId}`, []);
    const [hist, setHist] = useLS(`h_${dayId}_${exId}`, []);
    const [reps, setReps] = useState("");
    const [kg, setKg] = useState("");
    const [showH, setShowH] = useState(false);
    const { left, on, toggle, reset } = useCountdown(75);
    const addSet = () => {
      const r = parseInt(reps);
      if (!r) return;
      setSets([...sets, { r, kg: parseFloat(kg) || 0 }]);
      setReps("");
      reset();
      setTimeout(toggle, 80);
    };
    const saveSession = () => {
      if (!sets.length) return;
      setHist((h) => [...h.slice(-29), { date: (/* @__PURE__ */ new Date()).toLocaleDateString("ru-RU"), sets }]);
      setSets([]);
    };
    const m = Math.floor(left / 60), s = (left % 60).toString().padStart(2, "0");
    const pct = (75 - left) / 75 * 100;
    const chartData = hist.slice(-5).map((h) => ({ date: h.date, maxKg: Math.max(...h.sets.map((s2) => s2.kg || 0)) }));
    return /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10 } }, sets.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 7 } }, sets.map((s2, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { background: clr + "18", border: `1px solid ${clr}44`, borderRadius: 7, padding: "3px 8px", display: "flex", gap: 4, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: C.textL } }, "#", i + 1), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: C.text } }, s2.r, "\xD7"), s2.kg > 0 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: C.textM } }, s2.kg, "\u043A\u0433"), /* @__PURE__ */ React.createElement("button", { onClick: () => setSets(sets.filter((_, j) => j !== i)), style: { background: "none", border: "none", cursor: "pointer", color: C.textL, fontSize: 10, padding: 0 } }, "\u2715")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5 } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        placeholder: "\u041F\u043E\u0432\u0442.",
        value: reps,
        onChange: (e) => setReps(e.target.value),
        style: { flex: 1, padding: "8px 9px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 14, fontFamily: "inherit", color: C.text, outline: "none", boxSizing: "border-box", minWidth: 0 }
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        placeholder: "\u041A\u0433",
        value: kg,
        onChange: (e) => setKg(e.target.value),
        style: { flex: 1, padding: "8px 9px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 14, fontFamily: "inherit", color: C.text, outline: "none", boxSizing: "border-box", minWidth: 0 }
      }
    ), /* @__PURE__ */ React.createElement("button", { onClick: addSet, style: { padding: "8px 12px", borderRadius: 8, background: clr, border: "none", color: C.white, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 } }, "+ \u041F\u043E\u0434\u0445\u043E\u0434")), sets.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, padding: "8px 10px", background: C.bgWarm, borderRadius: 8, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative", flexShrink: 0 } }, /* @__PURE__ */ React.createElement(Ring, { pct, size: 38, stroke: 3, color: on ? clr : C.textL }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: C.text } }, left === 0 ? "\u2713" : `${m}:${s}`)), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, fontSize: 11, color: left < 15 && on ? C.warn : C.textM } }, left === 0 ? "\u0412\u0440\u0435\u043C\u044F \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0433\u043E \u043F\u043E\u0434\u0445\u043E\u0434\u0430!" : on ? "\u041E\u0442\u0434\u044B\u0445..." : "\u0422\u0430\u0439\u043C\u0435\u0440 \u043E\u0442\u0434\u044B\u0445\u0430"), /* @__PURE__ */ React.createElement("button", { onClick: toggle, style: { padding: "5px 9px", borderRadius: 6, background: "none", border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 11, color: C.textM, fontFamily: "inherit" } }, left === 0 ? "\u21BA" : on ? "\u23F8" : "\u25B6")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, marginTop: 5 } }, sets.length > 0 && /* @__PURE__ */ React.createElement("button", { onClick: saveSession, style: { flex: 1, padding: "6px", borderRadius: 7, background: C.oliveSoft, border: `1px solid ${C.olive}44`, color: C.oliveDeep, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" } }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u2713"), hist.length > 0 && /* @__PURE__ */ React.createElement("button", { onClick: () => setShowH(!showH), style: { flex: 1, padding: "6px", borderRadius: 7, background: C.sageSoft, border: `1px solid ${C.sage}44`, color: C.sage, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" } }, "📈 \u0418\u0441\u0442\u043E\u0440\u0438\u044F (", hist.length, ")")), showH && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: 10 } }, chartData.length > 1 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.textL, marginBottom: 4 } }, "\u041C\u0430\u043A\u0441. \u0432\u0435\u0441 \u2014 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0441\u0435\u0441\u0441\u0438\u0438"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 4, height: 40 } }, chartData.map((d, i) => {
      const maxV = Math.max(...chartData.map((x) => x.maxKg), 1);
      const h = d.maxKg > 0 ? Math.max(6, d.maxKg / maxV * 36) : 4;
      return /* @__PURE__ */ React.createElement("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 8, color: C.olive, fontWeight: 700 } }, d.maxKg > 0 ? d.maxKg : ""), /* @__PURE__ */ React.createElement("div", { style: { width: "100%", height: h, background: i === chartData.length - 1 ? C.olive : C.oliveSoft, borderRadius: 3 } }));
    }))), /* @__PURE__ */ React.createElement("div", { style: { maxHeight: 120, overflowY: "auto" } }, hist.slice().reverse().map((h, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { marginBottom: 6, paddingBottom: 6, borderBottom: i < hist.length - 1 ? `1px solid ${C.border}` : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: C.textL, marginBottom: 2 } }, h.date), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 } }, h.sets.map((s2, j) => /* @__PURE__ */ React.createElement("span", { key: j, style: { fontSize: 10, color: C.text, background: C.bgWarm, borderRadius: 4, padding: "1px 5px" } }, s2.r, "\xD7 ", s2.kg > 0 ? `${s2.kg}\u043A\u0433` : ""))))))));
  }
  function ExCard({ ex, dayId, clr }) {
    const [done, setDone] = useLS(`d_${dayId}_${ex.id}`, false);
    const [open, setOpen] = useState(false);
    const safe = ex.scol === "\u2713";
    return /* @__PURE__ */ React.createElement("div", { style: { background: done ? C.oliveSoft : C.card, border: `1.5px solid ${done ? C.olive + "66" : C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 7, boxShadow: C.shadow } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 36, height: 36, borderRadius: 9, background: done ? C.olive + "44" : clr + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 } }, done ? "\u2713" : ex.emoji || "\u25CB"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 6, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: done ? C.textM : C.text, textDecoration: done ? "line-through" : "none", lineHeight: 1.3 } }, ex.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 1 } }, ex.muscle)), /* @__PURE__ */ React.createElement("button", { onClick: () => setDone(!done), style: { width: 26, height: 26, borderRadius: 7, border: `2px solid ${done ? C.olive : C.borderM}`, background: done ? C.olive : "transparent", color: done ? C.white : C.textL, cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, done ? "\u2713" : "")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" } }, [{ l: "\u041F\u043E\u0434\u0445\u043E\u0434\u043E\u0432", v: String(ex.sets) }, { l: "\u041F\u043E\u0432\u0442.", v: ex.repsT }, { l: "\u0412\u0435\u0441", v: ex.wt }].map((it) => /* @__PURE__ */ React.createElement("div", { key: it.l, style: { background: C.bgWarm, borderRadius: 6, padding: "3px 8px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: C.textL } }, it.l), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: clr } }, it.v)))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 7, display: "flex", gap: 5, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "3px 8px", background: safe ? C.oliveSoft : C.warnSoft, borderRadius: 6, fontSize: 10, color: safe ? C.oliveDeep : C.warn } }, "🦴 ", ex.scolNote), /* @__PURE__ */ React.createElement("div", { style: { padding: "3px 8px", background: C.oliveSoft, borderRadius: 6, fontSize: 10, color: C.oliveDeep } }, "\u2713 ", ex.feel.good), /* @__PURE__ */ React.createElement("div", { style: { padding: "3px 8px", background: C.warnSoft, borderRadius: 6, fontSize: 10, color: C.warn } }, "\u2717 ", ex.feel.bad)), ex.beginner && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, padding: "5px 9px", background: C.sandSoft, borderRadius: 7, display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.sandDeep } }, "🌱 ", /* @__PURE__ */ React.createElement("b", null, "\u041D\u043E\u0432\u0438\u0447\u043A\u0443:"), " ", ex.beginner)), /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen(!open), style: { marginTop: 7, background: "none", border: `1px solid ${C.border}`, borderRadius: 7, cursor: "pointer", color: C.textM, fontSize: 11, padding: "5px 10px", fontFamily: "inherit" } }, open ? "\u25B2 \u0421\u043A\u0440\u044B\u0442\u044C" : "\u25B6 \u0422\u0435\u0445\u043D\u0438\u043A\u0430 + \u0432\u0438\u0434\u0435\u043E"), open && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, padding: "12px", background: C.bgWarm, borderRadius: 10, border: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement(YTLink, { svgKey: ex.svgKey, name: ex.name }), ex.steps.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 6, marginBottom: 5 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 18, height: 18, borderRadius: 5, background: clr + "22", color: clr, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, i + 1), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.5 } }, s))), ex.err?.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: C.warn, marginBottom: 4 } }, "\u041E\u0448\u0438\u0431\u043A\u0438"), ex.err.map((e, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { fontSize: 11, color: C.textM, lineHeight: 1.4, marginBottom: 3 } }, "\xB7 ", e))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, padding: "5px 8px", background: C.card, borderRadius: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.bark } }, "📈 ", ex.prog))), /* @__PURE__ */ React.createElement(AIAssistant, { exName: ex.name, muscle: ex.muscle, steps: ex.steps, feel: ex.feel }), /* @__PURE__ */ React.createElement(SetTracker, { exId: ex.id, dayId, clr }))));
  }
  function WCCard({ ex, clr }) {
    const [open, setOpen] = useState(false);
    return /* @__PURE__ */ React.createElement("div", { style: { background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 6, boxShadow: C.shadow } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 9, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 30, height: 30, borderRadius: 7, background: clr + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 } }, "\u25CB"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, ex.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: clr, fontWeight: 700, marginTop: 1 } }, ex.dur), /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen(!open), style: { marginTop: 4, background: "none", border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", color: C.textM, fontSize: 10, padding: "3px 8px", fontFamily: "inherit" } }, open ? "\u25B2 \u0421\u043A\u0440\u044B\u0442\u044C" : "\u25BC \u041A\u0430\u043A \u0434\u0435\u043B\u0430\u0442\u044C"), open && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 7 } }, /* @__PURE__ */ React.createElement(YTLink, { svgKey: ex.svgKey, name: ex.name }), /* @__PURE__ */ React.createElement("div", { style: { background: C.bgWarm, borderRadius: 8, padding: "8px 10px" } }, ex.body.map((line, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { fontSize: 12, color: C.text, lineHeight: 1.5, marginBottom: i < ex.body.length - 1 ? 3 : 0, paddingLeft: 9, position: "relative" } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 0, color: clr } }, "\xB7"), line)))))));
  }
  function PreWorkoutCheck({ onDone }) {
    const checks = [
      { id: "ate", label: "\u041F\u043E\u0435\u043B\u0430 1\u20131.5 \u0447\u0430\u0441\u0430 \u043D\u0430\u0437\u0430\u0434 (\u043D\u0435 \u0433\u043E\u043B\u043E\u0434\u043D\u0430\u044F, \u043D\u0435 \u043F\u0435\u0440\u0435\u043F\u043E\u043B\u043D\u0435\u043D\u043D\u0430\u044F)" },
      { id: "water", label: "\u0412\u044B\u043F\u0438\u043B\u0430 300\u2013400 \u043C\u043B \u0432\u043E\u0434\u044B \u0434\u043E \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438" },
      { id: "clothes", label: "\u0423\u0434\u043E\u0431\u043D\u0430\u044F \u043E\u0434\u0435\u0436\u0434\u0430 \u0438 \u043A\u0440\u043E\u0441\u0441\u043E\u0432\u043A\u0438" },
      { id: "phone", label: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D \u0437\u0430\u0440\u044F\u0436\u0435\u043D, \u043D\u0430\u0443\u0448\u043D\u0438\u043A\u0438 \u0433\u043E\u0442\u043E\u0432\u044B" },
      { id: "warm", label: "\u0417\u043D\u0430\u044E, \u0447\u0442\u043E \u043D\u0430\u0447\u043D\u0443 \u0441 \u0440\u0430\u0437\u043C\u0438\u043D\u043A\u0438" }
    ];
    const [checked, setChecked] = useState({});
    const toggle = (id) => setChecked((p) => ({ ...p, [id]: !p[id] }));
    const allDone = checks.every((c) => checked[c.id]);
    return /* @__PURE__ */ React.createElement("div", { style: { background: C.card, borderRadius: 14, padding: "16px", marginBottom: 14, boxShadow: C.shadowM, border: `1.5px solid ${C.olive}44` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 } }, "\u2705 \u0413\u043E\u0442\u043E\u0432\u0430 \u043A \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0435?"), checks.map((c) => /* @__PURE__ */ React.createElement("div", { key: c.id, onClick: () => toggle(c.id), style: { display: "flex", gap: 9, alignItems: "center", marginBottom: 8, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked[c.id] ? C.olive : C.border}`, background: checked[c.id] ? C.olive : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" } }, checked[c.id] && /* @__PURE__ */ React.createElement("span", { style: { color: C.white, fontSize: 12, fontWeight: 700 } }, "\u2713")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: checked[c.id] ? C.textM : C.text, textDecoration: checked[c.id] ? "line-through" : "none", lineHeight: 1.4 } }, c.label))), /* @__PURE__ */ React.createElement("button", { onClick: onDone, disabled: !allDone, style: { width: "100%", marginTop: 8, padding: "11px", borderRadius: 10, background: allDone ? C.olive : C.border, border: "none", color: allDone ? C.white : C.textL, fontSize: 13, fontWeight: 700, cursor: allDone ? "pointer" : "default", fontFamily: "inherit", transition: "all .2s" } }, allDone ? "\u041D\u0430\u0447\u0430\u0442\u044C \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0443 💪" : `\u041E\u0442\u043C\u0435\u0442\u044C \u0432\u0441\u0435 \u043F\u0443\u043D\u043A\u0442\u044B (${Object.values(checked).filter(Boolean).length}/${checks.length})`));
  }
  function WorkoutHistory() {
    const [log, setLog] = useLS("wrkHistory", {});
    const [open, setOpen] = useState(null);
    const [addMode, setAddMode] = useState(null); // workoutKey
    const [sets, setSets] = useState([{ ex: "", kg: "", reps: "" }]);

    const today = new Date().toLocaleDateString("ru-RU");
    const entries = Object.entries(log).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);

    const saveEntry = (dateKey) => {
      const filled = sets.filter(s => s.ex.trim());
      if (!filled.length) return;
      const entry = { ...log, [dateKey]: [...(log[dateKey] || []), ...filled] };
      setLog(entry); setAddMode(null); setSets([{ ex: "", kg: "", reps: "" }]);
    };
    const removeSet = (dateKey, idx) => {
      const updated = (log[dateKey] || []).filter((_, i) => i !== idx);
      setLog({ ...log, [dateKey]: updated });
    };

    const analyze = () => {
      const allEx = {};
      Object.entries(log).forEach(([date, sets]) => {
        (sets || []).forEach(s => {
          if (!s.ex) return;
          if (!allEx[s.ex]) allEx[s.ex] = [];
          allEx[s.ex].push({ date, kg: parseFloat(s.kg) || 0, reps: parseInt(s.reps) || 0 });
        });
      });
      return allEx;
    };

    const analysis = analyze();
    const [showAnalysis, setShowAnalysis] = useState(false);

    return React.createElement("div", null,
      React.createElement("div", { style: { background: C.card, borderRadius: 12, padding: "14px 16px", marginBottom: 12, border: `0.5px solid ${C.border}` } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, "\ud83c\udfcb \u0418\u0441\u0442\u043e\u0440\u0438\u044f \u0442\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043e\u043a"),
          React.createElement("div", { style: { display: "flex", gap: 6 } },
            React.createElement("button", { onClick: () => setShowAnalysis(!showAnalysis), style: { padding: "4px 10px", borderRadius: 7, border: "1px solid #4A6741", background: showAnalysis ? "#D8E8D4" : "transparent", fontSize: 11, color: "#4A6741", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" } }, "\ud83d\udcc8 \u0410\u043d\u0430\u043b\u0438\u0437"),
            React.createElement("button", { onClick: () => { setAddMode(today); setSets([{ ex: "", kg: "", reps: "" }]); }, style: { padding: "4px 10px", borderRadius: 7, border: "none", background: "#CC5500", fontSize: 11, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" } }, "+ \u0417\u0430\u043f\u0438\u0441\u044c")
          )
        ),

        addMode && React.createElement("div", { style: { background: "#F7F4F0", borderRadius: 10, padding: "12px", marginBottom: 12 } },
          React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#2C2C2C", marginBottom: 8 } }, "\u0422\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0430 ", addMode),
          sets.map((s, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 5, marginBottom: 6, alignItems: "center" } },
            React.createElement("input", { value: s.ex, onChange: e => { const n=[...sets]; n[i]={...n[i],ex:e.target.value}; setSets(n); }, placeholder: "\u0423\u043f\u0440\u0430\u0436\u043d\u0435\u043d\u0438\u0435", style: { flex: 2, padding: "6px 8px", borderRadius: 7, border: "1px solid #DDD8CF", fontSize: 11, fontFamily: "inherit", outline: "none" } }),
            React.createElement("input", { value: s.kg, onChange: e => { const n=[...sets]; n[i]={...n[i],kg:e.target.value}; setSets(n); }, placeholder: "\u043a\u0433", type: "number", style: { flex: 1, padding: "6px 8px", borderRadius: 7, border: "1px solid #DDD8CF", fontSize: 11, fontFamily: "inherit", outline: "none" } }),
            React.createElement("input", { value: s.reps, onChange: e => { const n=[...sets]; n[i]={...n[i],reps:e.target.value}; setSets(n); }, placeholder: "\u043f\u043e\u0432\u0442", type: "number", style: { flex: 1, padding: "6px 8px", borderRadius: 7, border: "1px solid #DDD8CF", fontSize: 11, fontFamily: "inherit", outline: "none" } }),
            sets.length > 1 && React.createElement("button", { onClick: () => setSets(sets.filter((_,j)=>j!==i)), style: { background: "none", border: "none", color: "#DC2626", fontSize: 14, cursor: "pointer", padding: "0 2px" } }, "\u00d7")
          )),
          React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 4 } },
            React.createElement("button", { onClick: () => setSets([...sets, { ex: "", kg: "", reps: "" }]), style: { flex: 1, padding: "7px", borderRadius: 8, border: "1px dashed #DDD8CF", background: "transparent", fontSize: 11, color: "#9E9890", cursor: "pointer", fontFamily: "inherit" } }, "+ \u0435\u0449\u0451 \u0443\u043f\u0440\u0430\u0436\u043d\u0435\u043d\u0438\u0435"),
            React.createElement("button", { onClick: () => saveEntry(addMode), style: { flex: 1, padding: "7px", borderRadius: 8, border: "none", background: "#CC5500", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" } }, "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c"),
            React.createElement("button", { onClick: () => setAddMode(null), style: { padding: "7px 10px", borderRadius: 8, border: "none", background: "#DDD8CF", color: "#6B6560", fontSize: 11, cursor: "pointer", fontFamily: "inherit" } }, "\u2715")
          )
        ),

        showAnalysis && Object.keys(analysis).length > 0 && React.createElement("div", { style: { background: "#D8E8D4", borderRadius: 10, padding: "12px", marginBottom: 12 } },
          React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#2E4428", marginBottom: 8 } }, "\ud83d\udcc8 \u041f\u0440\u043e\u0433\u0440\u0435\u0441\u0441 \u043f\u043e \u0443\u043f\u0440\u0430\u0436\u043d\u0435\u043d\u0438\u044f\u043c"),
          Object.entries(analysis).slice(0, 5).map(([ex, history], i) => {
            const maxKg = Math.max(...history.map(h => h.kg).filter(Boolean));
            const last = history[history.length - 1];
            const first = history[0];
            const progress = last.kg > first.kg ? "+" + (last.kg - first.kg).toFixed(1) + "\u043a\u0433" : last.kg === first.kg ? "=" : "-" + (first.kg - last.kg).toFixed(1) + "\u043a\u0433";
            return React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < Object.keys(analysis).length - 1 ? "1px solid #4A674120" : "none" } },
              React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "#2C2C2C" } }, ex),
              React.createElement("div", { style: { display: "flex", gap: 8 } },
                maxKg > 0 && React.createElement("div", { style: { fontSize: 10, color: "#6B6560" } }, "\u043c\u0430\u043a\u0441: ", maxKg, "\u043a\u0433"),
                history.length > 1 && React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: last.kg >= first.kg ? "#4A6741" : "#DC2626" } }, progress)
              )
            );
          })
        ),

        entries.length === 0
          ? React.createElement("div", { style: { textAlign: "center", padding: "20px", color: "#9E9890", fontSize: 12 } }, "\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u0437\u0430\u043f\u0438\u0441\u0435\u0439. \u041d\u0430\u0436\u043c\u0438 \u00ab+ \u0417\u0430\u043f\u0438\u0441\u044c\u00bb \u043f\u043e\u0441\u043b\u0435 \u0442\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0438!")
          : entries.map(([date, dateSets]) => React.createElement("div", { key: date, style: { marginBottom: 6 } },
              React.createElement("button", {
                onClick: () => setOpen(open === date ? null : date),
                style: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", background: "none", border: "none", borderBottom: "1px solid #F0ECE8", cursor: "pointer", fontFamily: "inherit" }
              },
                React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#2C2C2C" } }, date, date === today ? " \u2014 \u0441\u0435\u0433\u043e\u0434\u043d\u044f" : ""),
                React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
                  React.createElement("div", { style: { fontSize: 11, color: "#9E9890" } }, (dateSets || []).length, " \u0443\u043f\u0440."),
                  React.createElement("div", { style: { fontSize: 10, color: "#9E9890" } }, open === date ? "\u25b2" : "\u25bc")
                )
              ),
              open === date && React.createElement("div", { style: { paddingTop: 6, paddingBottom: 4 } },
                (dateSets || []).map((s, si) => React.createElement("div", { key: si, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" } },
                  React.createElement("div", { style: { fontSize: 12, color: "#2C2C2C" } }, s.ex),
                  React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center" } },
                    React.createElement("div", { style: { fontSize: 11, color: "#6B6560" } }, s.kg ? s.kg + "\u043a\u0433" : "", s.kg && s.reps ? " \u00d7 " : "", s.reps ? s.reps + "\u043f\u043e\u0432\u0442" : ""),
                    React.createElement("button", { onClick: () => removeSet(date, si), style: { background: "none", border: "none", color: "#DDD8CF", fontSize: 13, cursor: "pointer", padding: "0 2px" } }, "\u2715")
                  )
                )),
                React.createElement("button", { onClick: () => { setAddMode(date); setSets([{ ex: "", kg: "", reps: "" }]); }, style: { marginTop: 4, padding: "4px 8px", borderRadius: 6, border: "1px dashed #DDD8CF", background: "transparent", fontSize: 10, color: "#9E9890", cursor: "pointer", fontFamily: "inherit" } }, "+ \u0434\u043e\u0431\u0430\u0432\u0438\u0442\u044c")
              )
            ))
      )
    );
  }


  // Небольшое кольцо прогресса — для счётчика «выпито сегодня».
  function MiniRing({ done, total, size = 30, color = "#C97A3D" }) {
    const r = (size - 5) / 2;
    const circ = 2 * Math.PI * r;
    const frac = total > 0 ? done / total : 0;
    const complete = total > 0 && done >= total;
    return React.createElement("div", { style: { position: "relative", width: size, height: size, flexShrink: 0 } },
      React.createElement("svg", { width: size, height: size, style: { transform: "rotate(-90deg)" } },
        React.createElement("circle", { cx: size / 2, cy: size / 2, r, fill: "none", stroke: "#E0D6C4", strokeWidth: 3 }),
        React.createElement("circle", { cx: size / 2, cy: size / 2, r, fill: "none",
          stroke: complete ? "#5A6B42" : color, strokeWidth: 3, strokeLinecap: "round",
          strokeDasharray: circ, strokeDashoffset: circ * (1 - frac),
          style: { transition: "stroke-dashoffset .5s cubic-bezier(.4,0,.2,1), stroke .3s" } })
      ),
      React.createElement("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: complete ? 13 : 9, fontWeight: 700, color: complete ? "#5A6B42" : C.textM, fontVariantNumeric: "tabular-nums" } },
        complete ? "✓" : `${done}/${total}`)
    );
  }

  // История приёма: последние 14 дней. Читает ключи pillsTaken_<дата> и считает
  // долю принятого от активных в тот день. Показывает полоски + текущий стрик.
  function AdherenceHistory({ packAnchor }) {
    const pills = loadPills();
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const key = "pillsTaken_" + d.toLocaleDateString("ru-RU");
      let taken = {};
      try { const s = localStorage.getItem(key); if (s) taken = JSON.parse(s); } catch {}
      const active = activePillsOn(d, packAnchor, pills);
      const total = active.length;
      const done = active.filter(p => taken[p.id]).length;
      const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
      days.push({ d, total, done, frac: total ? done / total : null,
        label: ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"][dow], dayNum: d.getDate() });
    }
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      const day = days[i];
      if (day.total === 0) continue;
      if (day.frac >= 1) streak++; else break;
    }
    const colorFor = (f) => f === null ? C.border : f >= 1 ? C.ok : f >= 0.5 ? C.olive : f > 0 ? C.oliveM : C.border;

    return React.createElement("div", { style: { background: C.card, borderRadius: 12, padding: "13px 14px", marginBottom: 12, border: `0.5px solid ${C.border}` } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, "📊 История приёма (14 дней)"),
        streak >= 2 && React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: C.ok } }, "🌿 ", streak, streak < 5 ? " дня в ритме" : " дней в ритме")
      ),
      React.createElement("div", { style: { display: "flex", gap: 3, alignItems: "flex-end" } },
        days.map((day, i) => React.createElement("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 } },
          React.createElement("div", {
            title: day.total ? `${day.done}/${day.total}` : "нет таблеток",
            style: { width: "100%", height: 40, borderRadius: 4, background: C.bg, position: "relative", overflow: "hidden", border: `0.5px solid ${C.border}` }
          },
            day.frac !== null && React.createElement("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, height: `${Math.max(6, day.frac * 100)}%`, background: colorFor(day.frac), transition: "height .4s" } })
          ),
          React.createElement("div", { style: { fontSize: 8, color: C.textL } }, day.dayNum)
        ))
      ),
      React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 8, lineHeight: 1.5 } },
        "Высота столбика — доля принятого за день. Пропуск — не провал, просто продолжай со следующего раза.")
    );
  }

  // Правила приёма «непростых» препаратов — общий источник для карточек таблеток.
  // gapBefore/gapAfter — часы запрета (кофе/чай/молочное или другие таблетки) вокруг приёма.
  const INTAKE_RULES = {
    iron: { can: ["Запивать водой или соком с витамином C", "Натощак", "После окна — еда с витамином C: киви, цитрус, перец, ягоды"], cant: ["Кофе, чёрный/зелёный чай", "Молочное, кальций", "Антациды", "Отруби/много клетчатки в тот же приём"], gapBefore: 2, gapAfter: 2 },
    iron50: { can: ["Запивать водой или соком с витамином C", "Натощак", "После окна — еда с витамином C: киви, цитрус, перец, ягоды"], cant: ["Кофе, чёрный/зелёный чай", "Молочное, кальций", "Антациды", "Отруби/много клетчатки в тот же приём"], gapBefore: 2, gapAfter: 2 },
    forlax: { can: ["Развести в полном стакане воды (~250 мл)", "С едой или без — на еду не завязан", "Пить больше воды днём"], cant: ["Другие таблетки ±2 ч (ускоряет кишечник, мешает всасыванию)"], gapBefore: 2, gapAfter: 2, gapReason: "другие таблетки" },
    perfectil: { can: ["Только после полноценного обеда"], cant: ["Натощак — тошнит"] },
    omega: { can: ["С обедом (с жирами), 2 капсулы"], cant: [] },
    vitd: { can: ["С жирной едой"], cant: [] },
    duxet: { can: ["Утром, в одно и то же время"], cant: ["Не пропускать, не бросать резко"] },
    zinc: { can: ["С ужином или сразу после"], cant: ["Натощак — тошнит", "Близко к железу"] },
    niac: { can: ["С ужином"], cant: [] },
    ae: { can: ["С едой с жирами"], cant: ["Отдельно от витамина C и селена", "Не дублировать витамин А с Перфектилом"] },
    yarina: { can: ["Строго в одно время"], cant: ["Не пропускать", "Осторожно с зверобоем"] },
    cystenium: { can: ["На ночь, запивать водой"], cant: [] },
    phytomucil: { can: ["Размешать в ~250 мл воды/кефира, выпить сразу", "ОБЯЗАТЕЛЬНО запить ещё ~250 мл воды (итого ~500 мл)"], cant: ["Мало воды — наоборот крепит и даёт тяжесть"] },
    crystalvag2: { can: ["На ночь, 2 капсулы (первые 10 дней)"], cant: [] },
    crystalvag1: { can: ["На ночь, 1 капсула (поддержка)"], cant: [] },
    lactriol: { can: ["На ночь, через день"], cant: [] },
    relief: { can: ["Только при обострении: 1 свеча утром + 1 вечером", "Релиф ИЛИ Анестезол — не вместе"], cant: [] },
    mel: { can: ["За час до сна"], cant: ["После приёма — без экранов"] },
  };
  const INTAKE_CONFLICTS = [
    ["iron", "zinc", "железо и цинк конкурируют — развести подальше"],
    ["iron", "vitd", "железо лучше отдельно от жирорастворимых"],
    ["iron50", "zinc", "железо и цинк конкурируют — развести подальше"],
    ["iron50", "vitd", "железо лучше отдельно от жирорастворимых"],
    ["forlax", "iron50", "Форлакс ±2 ч от железа (мешает всасыванию)"],
    ["ae", "perfectil", "оба содержат витамин А — следи за суммарной дозой"],
    ["forlax", "iron", "Форлакс ±2 ч от железа (мешает всасыванию)"],
    ["forlax", "duxet", "Форлакс ±2 ч от Дуксета (мешает всасыванию)"],
    ["forlax", "yarina", "Форлакс ±2 ч от Ярины (мешает всасыванию)"],
    ["forlax", "perfectil", "Форлакс ±2 ч от Перфектила"],
    ["forlax", "omega", "Форлакс ±2 ч от Омеги"],
    ["forlax", "vitd", "Форлакс ±2 ч от витамина D"],
  ];

  // Карточка-памятка по приёму ключевых препаратов (показывается на «Сегодня» и в Здоровье→Препараты)
  function MedMemoCard() {
    const [open, setOpen] = useLS("medMemoOpen", true);
    const rows = [
      { i: "🍽", t: "Обед (14:00): Перфектил + Омега вместе", d: "Можно принимать одновременно после полноценного обеда. Нужны жиры (масло, авокадо, орехи, рыба) — иначе плохо усваиваются." },
      { i: "🌙", t: "Ужин (20:00): A+E с жирами", d: "Витамины A и E жирорастворимы — строго с жирной едой (яйца, сыр, авокадо, масло, рыба)." },
      { i: "💧", t: "Форлакс (16:00): ~250 мл воды", d: "Развести в полном стакане воды. С едой или без. Отдельно от других таблеток — ±2 ч." },
      { i: "💧", t: "Фитомуцил (18:00): ~500 мл воды", d: "Размешать в ~250 мл и запить ещё ~250 мл. Без достаточной воды наоборот крепит." },
      { i: "🩸", t: "Железо (08:15): без кофе/чая/молочного 2 ч", d: "Витамин C рассасываешь с таблеткой. В первые 2 часа никакого кофе, чая, молочного, кальция." },
    ];
    return React.createElement("div", { style: { background: C.card, borderRadius: 14, padding: "14px 16px", marginBottom: 12, border: `0.5px solid ${C.border}` } },
      React.createElement("button", { onClick: () => setOpen(!open),
        style: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" } },
        React.createElement("span", { style: { fontSize: 13.5, fontWeight: 700, color: C.text } }, "📌 Памятка по приёму"),
        React.createElement("span", { style: { fontSize: 11, color: C.textL } }, open ? "скрыть ▲" : "показать ▼")
      ),
      open && React.createElement("div", { style: { marginTop: 10, display: "flex", flexDirection: "column", gap: 10 } },
        rows.map((r, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 9, alignItems: "flex-start" } },
          React.createElement("div", { style: { fontSize: 15, flexShrink: 0, lineHeight: 1.3 } }, r.i),
          React.createElement("div", { style: { minWidth: 0 } },
            React.createElement("div", { style: { fontSize: 12.5, fontWeight: 600, color: C.text, lineHeight: 1.4 } }, r.t),
            React.createElement("div", { style: { fontSize: 11.5, color: C.textM, lineHeight: 1.5, marginTop: 2 } }, r.d)
          )
        )),
        React.createElement("div", { style: { fontSize: 10, color: C.textL, lineHeight: 1.5, marginTop: 2, paddingTop: 8, borderTop: `0.5px solid ${C.border}` } },
          "Это памятка по твоей схеме. Дозы и сочетания — по согласованию с врачом.")
      )
    );
  }

  function PillsModule({ compact, cycleAnchor, packAnchor }) {
    const todayKey = new Date().toLocaleDateString("ru-RU");
    // Единый источник: модульный DEFAULT_PILLS + стор PILLS_LS_KEY.
    const [pills, setPills] = useLS(PILLS_LS_KEY, DEFAULT_PILLS);
    const [taken, setTaken] = useLS("pillsTaken_" + todayKey, {});
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState("");
    const [newTime, setNewTime] = useState("08:00");
    const [newNote, setNewNote] = useState("");
    const [openPill, setOpenPill] = useState(null);
    const [showRules, setShowRules] = useState(false);
    const [editId, setEditId] = useState(null);     // id препарата в режиме редактирования
    const [editFields, setEditFields] = useState({ name: "", time: "", note: "" });
    // Время приёма при отметке: если плановое время уже прошло — считаем, что принято
    // по плану (задним числом), иначе — сейчас. minOfDay.
    const smartTakeMin = (id) => {
      const nowM = new Date().getHours() * 60 + new Date().getMinutes();
      const pill = activePills.find(p => p.id === id);
      if (!pill || !pill.time) return nowM;
      const [h, m] = pill.time.split(":").map(Number);
      const planned = h * 60 + m;
      return planned <= nowM ? planned : nowM; // прошло → по плану; ещё впереди → сейчас
    };
    const toggle = (id) => {
      const next = { ...taken, [id]: !taken[id] };
      const at = { ...(taken.__at || {}) };
      if (!taken[id]) at[id] = smartTakeMin(id); else delete at[id];
      next.__at = at;
      if (id === "iron") { if (!taken.iron) next.__ironAt = Date.now(); else delete next.__ironAt; }
      setTaken(next);
    };
    const markAllTaken = () => {
      const next = { ...taken };
      const at = { ...(taken.__at || {}) };
      requiredPills.forEach(p => { next[p.id] = true; if (at[p.id] == null) at[p.id] = smartTakeMin(p.id); });
      next.__at = at;
      setTaken(next);
    };
    const [confirmDel, setConfirmDel] = useState(null);
    const addPill = () => {
      if (!newName.trim()) return;
      const id = "p_" + Date.now();
      setPills([...pills, { id, name: newName.trim(), time: newTime, color: PC.NIGHT, bg: PC.NIGHT_BG, note: newNote.trim() }]);
      setNewName(""); setNewTime("08:00"); setNewNote(""); setShowAdd(false);
    };
    const removePill = (id) => setPills(pills.filter(p => p.id !== id));
    const startEditPill = (p) => {
      setEditId(p.id);
      setEditFields({ name: p.name, time: p.time || "08:00", note: p.note || "" });
      setOpenPill(p.id);
    };
    const saveEditPill = () => {
      setPills(pills.map(p => p.id === editId
        ? { ...p, name: editFields.name.trim() || p.name, time: editFields.time || p.time, note: editFields.note }
        : p));
      setEditId(null);
    };
    const BUILTIN = BUILTIN_PILL_IDS;

    const todayDate = new Date();
    const isActive = (p) => isPillActiveOn(p, todayDate, packAnchor);
    const activePills = activePillsOn(todayDate, packAnchor, pills);
    const requiredPills = activePills.filter(p => !p.optional); // опциональные (мелатонин, Релиф) не считаем в «всё принято»
    const upcomingPills = pills.filter(p => !isActive(p) && p.startDate && mkd(p.startDate) > todayDate);
    const doneCount = requiredPills.filter(p => taken[p.id]).length;

    // Сегодня день перерыва Ярины?
    const isYarinaPillFree = packAnchor && !isYarinaActiveToday(todayDate, packAnchor);

    // --- Тайминг приёма: ближайшее, таймер железа, вечерняя сводка, конфликты ---
    const _now = new Date();
    const _cur = _now.getHours() * 60 + _now.getMinutes();
    const _pt = (t) => { const [h, m] = (t || "0:0").split(":").map(Number); return h * 60 + m; };
    const _hu = (mins) => { const h = Math.floor(Math.abs(mins) / 60), m = Math.abs(mins) % 60; return (h ? h + " ч " : "") + (m ? m + " мин" : (h ? "" : "0 мин")); };
    const _fmt = (mins) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
    // Ближайший непринятый
    const _up = requiredPills.filter(p => !taken[p.id]).map(p => ({ p, t: _pt(p.time) })).filter(x => x.t >= _cur - 20).sort((a, b) => a.t - b.t)[0];
    const nextLine = _up
      ? "Ближайшее: " + _up.p.name + " — " + (Math.abs(_up.t - _cur) <= 10 ? "сейчас" : (_up.t > _cur ? "через " + _hu(_up.t - _cur) : "пора"))
      : (requiredPills.length > 0 && doneCount === requiredPills.length ? "Всё на сегодня принято ✓" : null);
    // Таймер железа — показываем ТОЛЬКО пока окно активно (0..120 мин).
    // Работает для любой дозы (iron 25 / iron50). Время: фактическое (__at), иначе плановое.
    let ironTimerText = null;
    const ironPill = activePills.find(p => (p.id === "iron" || p.id === "iron50"));
    if (ironPill && taken[ironPill.id]) {
      const ironAt = (taken.__at && taken.__at[ironPill.id] != null) ? taken.__at[ironPill.id] : _pt(ironPill.time);
      if (ironAt != null) {
        const since = _cur - ironAt;
        if (since >= 0 && since < 120) {
          const eatLeft = 40 - since, drinkLeft = 120 - since;
          ironTimerText = (eatLeft > 0 ? "🍽 завтрак через " + _hu(eatLeft) : "🍽 можно завтракать") + " · " + (drinkLeft > 0 ? "☕ кофе/чай через " + _hu(drinkLeft) : "☕ кофе/чай можно");
        }
      }
    }
    // Конфликты: предупреждаем «развести по времени» ТОЛЬКО когда оба ещё актуальны —
    // то есть хотя бы один НЕ принят и его время рядом с текущим (±90 мин).
    // Если один уже принят несколько часов назад — разводить нечего.
    const conflictNotes = [];
    const effT = (p) => (taken[p.id] && taken.__at && taken.__at[p.id] != null) ? taken.__at[p.id] : _pt(p.time);
    INTAKE_CONFLICTS.forEach(([a, b, why]) => {
      const ia = activePills.find(p => p.id === a), ib = activePills.find(p => p.id === b);
      if (!ia || !ib) return;
      if (taken[a] && taken[b]) return;            // оба приняты — поздно
      const ta = effT(ia), tb = effT(ib);
      if (Math.abs(ta - tb) >= 120) return;        // и так далеко по времени
      // Релевантно только если ближайший из двух приёмов рядом с «сейчас»
      const soonest = Math.min(taken[a] ? Infinity : _pt(ia.time), taken[b] ? Infinity : _pt(ib.time));
      if (soonest === Infinity) return;            // непринятого нет — нечего разводить
      if (soonest < _cur - 30 || soonest > _cur + 90) return; // непринятый либо давно прошёл, либо ещё нескоро
      conflictNotes.push(why);
    });
    // Вечерняя сводка
    const eveningLeft = _now.getHours() >= 19 ? requiredPills.filter(p => !taken[p.id]) : [];

    // Активные «запретные окна» прямо сейчас (железо/форлакс) — показываем НАВЕРХУ, не пряча.
    const banAlerts = [];
    activePills.forEach(p => {
      const r = INTAKE_RULES[p.id];
      if (!r || !(r.gapBefore || r.gapAfter)) return;
      const at = (taken[p.id] && taken.__at && taken.__at[p.id] != null) ? taken.__at[p.id] : _pt(p.time);
      // окно актуально, только если препарат принят ИЛИ его плановое время уже подошло
      const started = taken[p.id] || _cur >= _pt(p.time);
      if (!started) return;
      const bEnd = at + (r.gapAfter || 0) * 60;
      if (_cur <= bEnd && _cur >= at - (r.gapBefore || 0) * 60) {
        const what = p.id === "iron" ? "кофе/чай/молочное" : "другие таблетки";
        banAlerts.push(`После «${p.name}» нельзя ${what} ещё ${_hu(bEnd - _cur)} (до ${_fmt(bEnd)})`);
      }
    });

    // ── Умная подсказка сдвига зависимой таблетки (на сегодня) ──
    // Плановое время с учётом дневного сдвига (__planShift).
    const planShift = taken.__planShift || {};
    const plannedOf = (p) => (planShift[p.id] != null ? planShift[p.id] : _pt(p.time));
    // Пары с ОБЯЗАТЕЛЬНЫМ интервалом: у одной из таблеток есть gapBefore/gapAfter (Форлакс ±2ч).
    // Если «ведущая» принята в фактическое время, и из-за этого нарушается интервал
    // с «зависимой» (ещё не принятой) — предлагаем сдвинуть зависимую на сегодня.
    const shiftSuggestions = [];
    INTAKE_CONFLICTS.forEach(([a, b]) => {
      const pa = activePills.find(p => p.id === a), pb = activePills.find(p => p.id === b);
      if (!pa || !pb) return;
      // Зависимая = та, у кого есть правило интервала (gap). Ведущая = другая.
      let dep, lead;
      if (INTAKE_RULES[a] && (INTAKE_RULES[a].gapBefore || INTAKE_RULES[a].gapAfter)) { dep = pa; lead = pb; }
      else if (INTAKE_RULES[b] && (INTAKE_RULES[b].gapBefore || INTAKE_RULES[b].gapAfter)) { dep = pb; lead = pa; }
      else return; // нет обязательного интервала — независимые, не трогаем
      if (taken[dep.id]) return; // зависимая уже принята — поздно двигать
      if (!taken[lead.id]) return; // ведущая ещё не принята — нет факта, нечего пересчитывать
      const leadAt = (taken.__at && taken.__at[lead.id] != null) ? taken.__at[lead.id] : _pt(lead.time);
      const gap = (INTAKE_RULES[dep.id].gapBefore || INTAKE_RULES[dep.id].gapAfter || 2) * 60;
      const depPlanned = plannedOf(dep);
      if (Math.abs(depPlanned - leadAt) >= gap) return; // интервал и так соблюдён
      // Нужно отодвинуть зависимую так, чтобы было >= gap от ведущей.
      // Двигаем в ту сторону, куда ближе к исходному плановому (обычно позже).
      let target = leadAt + gap; // после ведущей
      if (depPlanned < leadAt) target = leadAt - gap; // если зависимая была раньше — двигаем раньше
      target = Math.max(0, Math.min(23 * 60 + 59, target));
      if (target === depPlanned) return;
      // не дублируем, если уже сдвинули ровно туда
      if (planShift[dep.id] === target) return;
      shiftSuggestions.push({ depId: dep.id, depName: dep.name, leadName: lead.name,
        from: depPlanned, to: target, leadAt });
    });
    const applyShift = (depId, mins) => {
      const next = { ...taken, __planShift: { ...(taken.__planShift || {}), [depId]: mins } };
      setTaken(next);
    };
    const undoShift = (depId) => {
      const ps = { ...(taken.__planShift || {}) };
      delete ps[depId];
      setTaken({ ...taken, __planShift: ps });
    };

    // Полоска статуса приёма (общая для compact и полного вида)
    const hasStatusInfo = nextLine || ironTimerText || banAlerts.length > 0;
    const statusStrip = React.createElement(React.Fragment, null,
      hasStatusInfo && React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 11, padding: "11px 13px", marginBottom: 8 } },
        nextLine && React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: C.text } },
          React.createElement("span", { style: { fontSize: 14, flexShrink: 0 } }, "⏰"),
          React.createElement("span", null, nextLine)),
        ironTimerText && React.createElement("div", { style: { fontSize: 11.5, color: C.textM, lineHeight: 1.5, marginTop: nextLine ? 7 : 0, paddingTop: nextLine ? 7 : 0, borderTop: nextLine ? `0.5px solid ${C.border}` : "none" } }, ironTimerText),
        banAlerts.length > 0 && React.createElement("div", { style: { marginTop: (nextLine || ironTimerText) ? 7 : 0, paddingTop: (nextLine || ironTimerText) ? 7 : 0, borderTop: (nextLine || ironTimerText) ? `0.5px solid ${C.border}` : "none" } },
          React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: C.warn, marginBottom: 3 } }, "🚫 Сейчас нельзя"),
          banAlerts.map((w, i) => React.createElement("div", { key: i, style: { fontSize: 11, color: C.textM, lineHeight: 1.5 } }, "• ", w))
        )
      ),
      conflictNotes.length > 0 && React.createElement("div", { style: { background: C.warnSoft, borderRadius: 8, padding: "7px 10px", marginBottom: 6 } },
        React.createElement("div", { style: { fontSize: 10.5, fontWeight: 700, color: C.warn, marginBottom: 2 } }, "⚠️ Развести по времени"),
        conflictNotes.map((w, i) => React.createElement("div", { key: i, style: { fontSize: 10.5, color: C.text, lineHeight: 1.45 } }, "• ", w))
      ),
      shiftSuggestions.map((sg, i) => React.createElement("div", { key: "sg" + i, style: { background: C.oliveSoft, borderRadius: 8, padding: "8px 10px", marginBottom: 6, border: `0.5px solid ${C.olive}44` } },
        React.createElement("div", { style: { fontSize: 10.5, fontWeight: 700, color: C.oliveDeep, marginBottom: 2 } }, "🕐 Сдвинуть время?"),
        React.createElement("div", { style: { fontSize: 10.5, color: C.text, lineHeight: 1.45, marginBottom: 6 } },
          "«" + sg.leadName + "» принят в " + _fmt(sg.leadAt) + ". Чтобы сохранить интервал, «" + sg.depName + "» лучше сдвинуть с " + _fmt(sg.from) + " на " + _fmt(sg.to) + " (только на сегодня)."),
        React.createElement("button", { onClick: () => applyShift(sg.depId, sg.to),
          style: { fontSize: 11, fontWeight: 600, color: "#fff", background: C.olive, border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" } },
          "Сдвинуть на " + _fmt(sg.to))
      )),
      Object.keys(taken.__planShift || {}).length > 0 && React.createElement("div", { style: { marginBottom: 6 } },
        Object.keys(taken.__planShift).map(depId => {
          const p = activePills.find(x => x.id === depId);
          if (!p) return null;
          return React.createElement("div", { key: "sh" + depId, style: { fontSize: 10, color: C.textM, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 6, marginTop: 2 } },
            React.createElement("span", null, "✓ «" + p.name + "» сдвинут на " + _fmt(taken.__planShift[depId]) + " (сегодня)"),
            React.createElement("button", { onClick: () => undoShift(depId), style: { fontSize: 10, color: C.textL, background: "none", border: "none", textDecoration: "underline", cursor: "pointer", fontFamily: "inherit", padding: 0 } }, "вернуть"));
        })
      ),
      eveningLeft.length > 0 && React.createElement("div", { style: { background: C.warnSoft, borderRadius: 8, padding: "7px 10px", marginBottom: 6 } },
        React.createElement("div", { style: { fontSize: 10.5, fontWeight: 700, color: C.warn, marginBottom: 2 } }, "🌙 Ещё не отмечено"),
        React.createElement("div", { style: { fontSize: 10.5, color: C.text, lineHeight: 1.45 } }, eveningLeft.map(p => p.name).join(", "))
      )
    );

    // Структурные правила приёма для раскрытой карточки.
    // Окна считаются от ФАКТИЧЕСКОГО времени приёма (taken.__at[id]), если оно есть,
    // иначе — от планового p.time.
    const setTakenAt = (id, mins) => {
      const at = { ...(taken.__at || {}) };
      at[id] = mins;
      const next = { ...taken, __at: at };
      if (!taken[id]) next[id] = true; // если меняем время — считаем принятым
      if (id === "iron") next.__ironAt = Date.now() - (( (new Date().getHours()*60+new Date().getMinutes()) - mins) * 60000);
      setTaken(next);
    };
    const renderRules = (p) => {
      const r = INTAKE_RULES[p.id];
      const isTaken = !!taken[p.id];
      const actualAt = taken.__at && taken.__at[p.id] != null ? taken.__at[p.id] : null;
      const baseT = (isTaken && actualAt != null) ? actualAt : _pt(p.time);
      const fromActual = isTaken && actualAt != null;
      const nowM = () => new Date().getHours() * 60 + new Date().getMinutes();
      const clamp = (v) => Math.max(0, Math.min(1439, v));

      // Поле «Принято в:» с быстрой правкой — для ЛЮБОЙ принятой таблетки
      const timeField = isTaken && React.createElement("div", { style: { marginTop: 7, paddingTop: 7, borderTop: `0.5px solid ${C.border}` } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" } },
          React.createElement("span", { style: { fontSize: 11, color: C.textM } }, "Принято в:"),
          React.createElement("input", { type: "time", value: _fmt(baseT),
            onChange: (e) => { const v = e.target.value; if (v) { const [h, m] = v.split(":").map(Number); setTakenAt(p.id, h * 60 + m); } },
            style: { fontSize: 12, fontFamily: "inherit", padding: "3px 6px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: "#fff", color: C.text } }),
          React.createElement("button", { onClick: () => setTakenAt(p.id, clamp(baseT - 15)),
            style: { fontSize: 11, padding: "3px 8px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: C.bg, color: C.textM, cursor: "pointer", fontFamily: "inherit" } }, "−15"),
          React.createElement("button", { onClick: () => setTakenAt(p.id, clamp(baseT + 15)),
            style: { fontSize: 11, padding: "3px 8px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: C.bg, color: C.textM, cursor: "pointer", fontFamily: "inherit" } }, "+15"),
          React.createElement("button", { onClick: () => setTakenAt(p.id, nowM()),
            style: { fontSize: 11, padding: "3px 8px", borderRadius: 6, border: `0.5px solid ${C.olive}55`, background: C.oliveSoft, color: C.oliveDeep, cursor: "pointer", fontFamily: "inherit" } }, "сейчас")
        ),
        React.createElement("div", { style: { fontSize: 9.5, color: C.textL, marginTop: 3 } }, fromActual ? "✓ по факту" : "по плану — поправь, если приняла в другое время")
      );

      // Нет правил приёма — показываем заметку (если есть) + поле времени
      if (!r) return React.createElement(React.Fragment, null,
        p.note && React.createElement("div", { style: { lineHeight: 1.5 } }, p.note),
        timeField
      );

      let banLine = null;
      if (r.gapBefore || r.gapAfter) {
        const bStart = baseT - (r.gapBefore || 0) * 60, bEnd = baseT + (r.gapAfter || 0) * 60;
        if (_cur >= bStart && _cur <= bEnd) banLine = { warn: true, text: `🚫 Сейчас нельзя ${r.gapReason || "кофе/чай/молочное"} — ещё ${_hu(bEnd - _cur)} (до ${_fmt(bEnd)})` };
        else if (_cur < bStart) banLine = { warn: false, text: `Запрет: ${_fmt(bStart)}–${_fmt(bEnd)}` };
        else banLine = { warn: false, text: `✅ Окно запрета прошло (было до ${_fmt(bEnd)})` };
      }
      return React.createElement(React.Fragment, null,
        r.can && r.can.length > 0 && React.createElement("div", { style: { display: "flex", gap: 7, marginBottom: 5 } },
          React.createElement("div", { style: { flexShrink: 0 } }, "✅"),
          React.createElement("div", { style: { lineHeight: 1.5 } }, r.can.join(" · "))),
        r.cant && r.cant.length > 0 && React.createElement("div", { style: { display: "flex", gap: 7, marginBottom: banLine ? 5 : 0 } },
          React.createElement("div", { style: { flexShrink: 0 } }, "🚫"),
          React.createElement("div", { style: { lineHeight: 1.5 } }, r.cant.join(" · "))),
        banLine && React.createElement("div", { style: { fontSize: 11.5, fontWeight: 600, color: banLine.warn ? C.warn : C.textM, marginTop: 2, padding: banLine.warn ? "6px 9px" : 0, background: banLine.warn ? C.warnSoft : "transparent", borderRadius: 8 } }, banLine.text),
        timeField,
        p.note && React.createElement("div", { style: { fontSize: 11, color: C.textL, lineHeight: 1.5, marginTop: 6, paddingTop: 6, borderTop: `0.5px solid ${C.border}` } }, p.note)
      );
    };

    if (compact) {
      const allDone = requiredPills.length > 0 && doneCount === requiredPills.length;
      return React.createElement("div", { style: { background: C.card, borderRadius: 12, padding: "12px 14px", marginBottom: 12, border: `0.5px solid ${allDone ? C.ok + "55" : C.border}` } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, "💊 Таблетки сегодня"),
          React.createElement(MiniRing, { done: doneCount, total: requiredPills.length })
        ),
        allDone && React.createElement("div", { style: { fontSize: 11.5, color: C.ok, fontWeight: 600, marginBottom: 9, textAlign: "center" } }, "Всё принято на сегодня 🎉"),
        // Полоска статуса приёма (ближайшее, таймер железа, конфликты, вечер)
        statusStrip,
        // Сетка 2 колонки — карточки таблеток с подложкой по времени дня
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, width: "100%" } },
          activePills.map(p => React.createElement("button", {
            key: p.id, onClick: () => toggle(p.id),
            "aria-pressed": !!taken[p.id],
            "aria-label": (taken[p.id] ? "Отменить приём: " : "Отметить принятым: ") + p.name + ", " + p.time,
            title: p.name,
            style: { display: "flex", alignItems: "center", gap: 7, padding: "9px 9px", minHeight: 44, minWidth: 0, boxSizing: "border-box",
              background: taken[p.id] ? p.bg : C.bg,
              border: `0.5px solid ${taken[p.id] ? p.color : C.border}`,
              borderRadius: 8, cursor: "pointer", textAlign: "left", fontFamily: "inherit", overflow: "hidden" }
          },
            React.createElement("div", { className: taken[p.id] ? "ux-pop" : "", style: { width: 16, height: 16, border: `1.5px solid ${p.color}`, borderRadius: 4, background: taken[p.id] ? p.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
              taken[p.id] && React.createElement("span", { style: { color: "#fff", fontSize: 11, lineHeight: 1 } }, "✓")
            ),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: p.color, textDecoration: taken[p.id] ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, p.name),
              (function(){
                // Принята → показываем фактическое время (__at). Не принята → плановое.
                const tk = taken[p.id];
                const at = (tk && taken.__at && taken.__at[p.id] != null) ? taken.__at[p.id] : null;
                if (tk && at != null) {
                  const hh = String(Math.floor(at / 60)).padStart(2, "0"), mm = String(at % 60).padStart(2, "0");
                  const factTime = hh + ":" + mm;
                  const shifted = factTime !== p.time;
                  return React.createElement("div", { style: { fontSize: 10, color: shifted ? C.oliveDeep : C.textM, marginTop: 1 } }, factTime + (shifted ? " ✓" : ""));
                }
                return React.createElement("div", { style: { fontSize: 10, color: (planShift[p.id] != null ? C.oliveDeep : C.textM), marginTop: 1 } }, (planShift[p.id] != null ? _fmt(planShift[p.id]) + " ↦" : p.time));
              })()
            )
          ))
        ),
        // Плашка про перерыв Ярины — спокойная, в стиле приложения
        isYarinaPillFree && React.createElement("div", { style: { marginTop: 9, padding: "9px 12px", background: C.bgWarm, borderRadius: 9, display: "flex", alignItems: "center", gap: 8 } },
          React.createElement("span", { style: { fontSize: 13, flexShrink: 0 } }, "🌙"),
          React.createElement("div", { style: { fontSize: 11.5, color: C.textM, lineHeight: 1.45 } }, "Перерыв Ярины — таблетки из пачки не принимаешь до начала следующей.")
        ),
        // Подробности приёма — заметная кнопка-строка
        activePills.some(p => INTAKE_RULES[p.id]) && React.createElement("div", { style: { marginTop: 9 } },
          React.createElement("button", { onClick: () => setShowRules(!showRules),
            style: { width: "100%", textAlign: "left", background: showRules ? C.oliveSoft : C.card, border: `0.5px solid ${C.olive}44`, borderRadius: 10, padding: "11px 13px", cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("span", { style: { fontSize: 12.5, fontWeight: 600, color: C.oliveDeep } }, "ⓘ Как принимать таблетки"),
            React.createElement("span", { style: { fontSize: 11, color: C.olive } }, showRules ? "скрыть ▲" : "подробнее ▼")
          ),
          showRules && React.createElement("div", { style: { marginTop: 4 } },
            // Памятка по приёму (общие правила) — перенесена сюда из отдельной карточки
            React.createElement("div", { style: { background: C.oliveSoft, borderRadius: 9, padding: "10px 12px", marginBottom: 8 } },
              React.createElement("div", { style: { fontSize: 11.5, fontWeight: 700, color: C.oliveDeep, marginBottom: 8 } }, "📌 Памятка (общее)"),
              [
                { i: "🍽", t: "Обед: Перфектил + Омега вместе", d: "После полноценного обеда, нужны жиры (масло, авокадо, орехи, рыба)." },
                { i: "🌙", t: "Ужин: A+E с жирами", d: "Витамины A и E жирорастворимы — строго с жирной едой." },
                { i: "💧", t: "Форлакс: ~250 мл воды", d: "Полный стакан. Отдельно от других таблеток ±2 ч." },
                { i: "💧", t: "Фитомуцил: ~500 мл воды", d: "Размешать в ~250 мл и запить ещё ~250 мл, иначе крепит." },
                { i: "🩸", t: "Железо: без кофе/чая/молочного 2 ч", d: "Вит C рассасываешь с таблеткой; первые 2 часа без кофе/чая/молочного." },
              ].map((r, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 } },
                React.createElement("div", { style: { fontSize: 14, flexShrink: 0, lineHeight: 1.3 } }, r.i),
                React.createElement("div", { style: { minWidth: 0 } },
                  React.createElement("div", { style: { fontSize: 11.5, fontWeight: 600, color: C.text, lineHeight: 1.4 } }, r.t),
                  React.createElement("div", { style: { fontSize: 10.5, color: C.textM, lineHeight: 1.45, marginTop: 1 } }, r.d)
                )
              ))
            ),
            activePills.filter(p => INTAKE_RULES[p.id]).map(p => React.createElement("div", { key: p.id, style: { background: C.bg, borderRadius: 9, padding: "9px 11px", marginBottom: 6, fontSize: 11.5, color: C.text } },
              React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: p.color, marginBottom: 5 } }, p.name, " · ", p.time),
              renderRules(p)
            ))
          )
        )
      );
    }

    return React.createElement("div", null,
      React.createElement("div", { style: { background: C.card, borderRadius: 14, padding: "14px 16px", marginBottom: 12, border: `0.5px solid ${C.border}` } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
          React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: C.text } }, "💊 Мои таблетки"),
          React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } },
            React.createElement(MiniRing, { done: doneCount, total: requiredPills.length }),
            React.createElement("button", { onClick: () => setShowAdd(!showAdd),
              "aria-label": showAdd ? "Закрыть форму добавления" : "Добавить таблетку", title: "Добавить таблетку",
              style: { width: 30, height: 30, borderRadius: "50%", background: C.olive, border: "none", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1, paddingBottom: 2, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" } }, showAdd ? "×" : "+")
          )
        ),
        // Быстрое действие: отметить всё принятым (когда есть что отмечать)
        requiredPills.length > 0 && doneCount < requiredPills.length && React.createElement("button", {
          onClick: markAllTaken,
          style: { width: "100%", padding: "8px", marginBottom: 10, borderRadius: 9, background: C.sandSoft,
            border: `0.5px solid ${C.sand}55`, color: C.sandDeep, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }
        }, "✓ Отметить все принятыми (", requiredPills.length - doneCount, ")"),
        // Плашка про перерыв Ярины (на верху списка)
        isYarinaPillFree && React.createElement("div", { style: { padding: "9px 12px", background: C.pinkSoft, borderRadius: 9, border: `0.5px solid ${C.pink}33`, marginBottom: 10 } },
          React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: C.pink, marginBottom: 2 } }, "Перерыв в приёме Ярины"),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.5 } }, "Сегодня день ", cycleAnchor ? getCycleDay(todayDate, cycleAnchor) : "?", " цикла. Активный приём возобновится с начала следующей пачки.")
        ),
        activePills.map(p => React.createElement("div", { key: p.id },
          React.createElement("div", {
            style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `0.5px solid ${C.border}`, cursor: "pointer" },
            onClick: () => setOpenPill(openPill === p.id ? null : p.id)
          },
            React.createElement("button", {
              onClick: (e) => { e.stopPropagation(); toggle(p.id); },
              "aria-pressed": !!taken[p.id],
              "aria-label": (taken[p.id] ? "Отменить приём: " : "Отметить принятым: ") + p.name,
              className: taken[p.id] ? "ux-pop" : "",
              style: { width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${taken[p.id] ? p.color : C.borderM}`,
                background: taken[p.id] ? p.color : "transparent", cursor: "pointer", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontFamily: "inherit" }
            }, taken[p.id] ? "✓" : ""),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: taken[p.id] ? C.textL : C.text, textDecoration: taken[p.id] ? "line-through" : "none" } }, p.name),
              React.createElement("div", { style: { fontSize: 11, color: p.color, marginTop: 1, fontWeight: 500 } }, p.time)
            ),
            React.createElement("div", { "aria-hidden": "true", style: { fontSize: 11, color: C.textL } }, openPill === p.id ? "▲" : "▼")
          ),
          openPill === p.id && React.createElement("div", { className: "ux-enter", style: { background: p.bg, borderRadius: 8, padding: "10px 12px", margin: "4px 0 8px", fontSize: 12, color: C.text, lineHeight: 1.6 } },
            editId === p.id
              ? React.createElement("div", null,
                  React.createElement("input", { value: editFields.name, onChange: e => setEditFields({ ...editFields, name: e.target.value }),
                    "aria-label": "Название", placeholder: "Название",
                    style: { width: "100%", padding: "7px 9px", borderRadius: 7, border: `0.5px solid ${C.border}`, fontSize: 12, fontFamily: "inherit", marginBottom: 6, boxSizing: "border-box", outline: "none", background: "#fff" } }),
                  React.createElement("input", { type: "time", value: editFields.time, onChange: e => setEditFields({ ...editFields, time: e.target.value }),
                    "aria-label": "Время",
                    style: { width: "100%", padding: "7px 9px", borderRadius: 7, border: `0.5px solid ${C.border}`, fontSize: 12, fontFamily: "inherit", marginBottom: 6, boxSizing: "border-box", outline: "none", background: "#fff" } }),
                  React.createElement("textarea", { value: editFields.note, onChange: e => setEditFields({ ...editFields, note: e.target.value }),
                    "aria-label": "Заметка", placeholder: "Заметка", rows: 3,
                    style: { width: "100%", padding: "7px 9px", borderRadius: 7, border: `0.5px solid ${C.border}`, fontSize: 12, fontFamily: "inherit", marginBottom: 8, boxSizing: "border-box", outline: "none", background: "#fff", resize: "vertical" } }),
                  React.createElement("div", { style: { display: "flex", gap: 6 } },
                    React.createElement("button", { onClick: saveEditPill,
                      style: { flex: 1, padding: "7px", borderRadius: 7, background: C.olive, border: "none", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, "Сохранить"),
                    React.createElement("button", { onClick: () => setEditId(null),
                      style: { flex: 1, padding: "7px", borderRadius: 7, background: C.border, border: "none", color: C.textM, fontSize: 11, cursor: "pointer", fontFamily: "inherit" } }, "Отмена")
                  )
                )
              : React.createElement(React.Fragment, null,
                  renderRules(p),
                  React.createElement("div", { style: { display: "flex", gap: 14, marginTop: 8, alignItems: "center" } },
                    React.createElement("button", { onClick: () => startEditPill(p),
                      style: { background: "none", border: "none", color: C.info, fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" } }, "✎ Изменить"),
                    !BUILTIN.includes(p.id) && (confirmDel === p.id
                      ? React.createElement("span", { style: { display: "flex", gap: 8, alignItems: "center" } },
                          React.createElement("span", { style: { fontSize: 11, color: C.warn, fontWeight: 600 } }, "Удалить?"),
                          React.createElement("button", { onClick: () => { removePill(p.id); setConfirmDel(null); },
                            style: { background: C.warn, border: "none", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: "5px 12px", borderRadius: 7, fontFamily: "inherit" } }, "Да"),
                          React.createElement("button", { onClick: () => setConfirmDel(null),
                            style: { background: C.border, border: "none", color: C.textM, fontSize: 11, cursor: "pointer", padding: "5px 12px", borderRadius: 7, fontFamily: "inherit" } }, "Нет")
                        )
                      : React.createElement("button", {
                          onClick: () => setConfirmDel(p.id),
                          style: { background: "none", border: "none", color: C.warn, fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit" }
                        }, "✕ Удалить"))
                  )
                )
          )
        )),
        showAdd && React.createElement("div", { style: { marginTop: 12, background: C.bg, borderRadius: 10, padding: "12px" } },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 } }, "Добавить таблетку"),
          React.createElement("input", { value: newName, onChange: e => setNewName(e.target.value), placeholder: "Название", style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", marginBottom: 6, boxSizing: "border-box", outline: "none" } }),
          React.createElement("input", { value: newTime, onChange: e => setNewTime(e.target.value), type: "time", style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", marginBottom: 6, boxSizing: "border-box", outline: "none" } }),
          React.createElement("input", { value: newNote, onChange: e => setNewNote(e.target.value), placeholder: "Заметка (зачем, как принимать...)", style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", marginBottom: 8, boxSizing: "border-box", outline: "none" } }),
          React.createElement("div", { style: { display: "flex", gap: 6 } },
            React.createElement("button", { onClick: addPill, style: { flex: 1, padding: "9px", borderRadius: 8, background: C.olive, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, "Добавить"),
            React.createElement("button", { onClick: () => setShowAdd(false), style: { flex: 1, padding: "9px", borderRadius: 8, background: C.border, border: "none", color: C.textM, fontSize: 12, cursor: "pointer", fontFamily: "inherit" } }, "Отмена")
          )
        )
      ),
      // Блок «Скоро появится» — будущие препараты (Перфектил, железо, цинк до их startDate)
      upcomingPills.length > 0 && React.createElement("div", { style: { background: C.infoSoft, borderRadius: 12, padding: "12px 14px", border: `0.5px solid ${C.info}33`, marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.info, marginBottom: 8 } }, "📅 Скоро появится"),
        upcomingPills.map((p, i) => React.createElement("div", { key: p.id, style: { marginBottom: i < upcomingPills.length - 1 ? 6 : 0 } },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text } }, p.name),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2, lineHeight: 1.5 } }, "С ", mkd(p.startDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" }), " · ", p.time)
        ))
      ),
      // Совместимость — короткий блок-подсказка, полная матрица будет на вкладке «Здоровье»
      React.createElement("div", { style: { background: C.oliveSoft, borderRadius: 12, padding: "12px 14px", border: `0.5px solid ${C.olive}33` } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.oliveDeep, marginBottom: 8 } }, "💡 Главные правила"),
        [
          ["Железо + витамин C", "Всегда вместе — витамин C усиливает усвоение."],
          ["Железо НЕ совмещать", "С Перфектилом, цинком, кофе, чаем, молочным — минимум 2 часа разрыв."],
          ["Чёрный стул от железа", "Это норма, не кровь. Алая кровь — точно не от железа, к врачу."],
          ["Перфектил только с едой", "Натощак — тошнота и раздражение ЖКТ."],
        ].map(([q, a], i, arr) => React.createElement("div", { key: i, style: { marginBottom: i < arr.length - 1 ? 8 : 0 } },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.oliveDeep } }, q),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2, lineHeight: 1.5 } }, a)
        )),
        React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 10, fontStyle: "italic" } }, "Полная матрица совместимости — на вкладке «Здоровье».")
      ),
      // История приёма (стрик + 14 дней)
      React.createElement(AdherenceHistory, { packAnchor })
    );
  }

  function SleepTracker() {
    const today = new Date().toLocaleDateString("ru-RU");
    const [log, setLog] = useLS("sleepLog", {});
    const entry = log[today] || { h: 0, q: 0 };
    const setEntry = (val) => setLog({ ...log, [today]: val });
    const hours = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
    const qualities = [
      { v: 1, l: "\ud83d\ude34 \u041f\u043b\u043e\u0445\u043e" },
      { v: 2, l: "\ud83d\ude15 \u0421\u0440\u0435\u0434\u043d\u0435" },
      { v: 3, l: "\ud83d\ude42 \u041d\u043e\u0440\u043c\u0430" },
      { v: 4, l: "\ud83d\ude04 \u0425\u043e\u0440\u043e\u0448\u043e" },
    ];
    const sleepColor = entry.h >= 7 ? "#4A6741" : entry.h >= 6 ? "#CC5500" : entry.h > 0 ? "#DC2626" : "#9E9890";
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 6 + i);
      const key = d.toLocaleDateString("ru-RU");
      const e = log[key] || { h: 0, q: 0 };
      return { key, h: e.h, q: e.q, label: ["\u041f\u043d","\u0412\u0442","\u0421\u0440","\u0427\u0442","\u041f\u0442","\u0421\u0431","\u0412\u0441"][d.getDay() === 0 ? 6 : d.getDay() - 1], isToday: key === today };
    });
    const avg = (() => { const filled = weekDays.filter(d => d.h > 0); return filled.length ? (filled.reduce((s, d) => s + d.h, 0) / filled.length).toFixed(1) : null; })();
    return React.createElement("div", { style: { background: C.card, borderRadius: 12, padding: "14px 16px", marginBottom: 12, border: `0.5px solid ${C.border}` } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, "\ud83c\udf19 \u0421\u043e\u043d \u0441\u0435\u0433\u043e\u0434\u043d\u044f"),
        entry.h > 0
          ? React.createElement("div", { style: { fontSize: 13, fontWeight: 800, color: sleepColor } }, entry.h, " \u0447")
          : React.createElement("div", { style: { fontSize: 11, color: "#9E9890" } }, "\u043d\u0435 \u043e\u0442\u043c\u0435\u0447\u0435\u043d\u043e")
      ),
      React.createElement("div", { style: { marginBottom: 10 } },
        React.createElement("div", { style: { fontSize: 10, color: "#9E9890", marginBottom: 5, fontWeight: 600 } }, "\u0421\u043a\u043e\u043b\u044c\u043a\u043e \u0447\u0430\u0441\u043e\u0432 \u0441\u043f\u0430\u043b\u0430?"),
        React.createElement("div", { style: { display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 } },
          hours.map(h => React.createElement("button", {
            key: h, onClick: () => setEntry({ ...entry, h }),
            style: { padding: "5px 9px", borderRadius: 7, border: `1.5px solid ${entry.h === h ? sleepColor : "#DDD8CF"}`,
              background: entry.h === h ? sleepColor + "18" : "#F7F4F0", fontSize: 11, fontWeight: entry.h === h ? 700 : 500,
              color: entry.h === h ? sleepColor : "#6B6560", cursor: "pointer", fontFamily: "inherit" }
          }, h, "\u0447"))
        )
      ),
      React.createElement("div", { style: { marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 10, color: "#9E9890", marginBottom: 5, fontWeight: 600 } }, "\u041a\u0430\u0447\u0435\u0441\u0442\u0432\u043e?"),
        React.createElement("div", { style: { display: "flex", gap: 6 } },
          qualities.map(q => React.createElement("button", {
            key: q.v, onClick: () => setEntry({ ...entry, q: q.v }),
            style: { flex: 1, padding: "6px 4px", borderRadius: 8, border: `1.5px solid ${entry.q === q.v ? "#4A6741" : "#DDD8CF"}`,
              background: entry.q === q.v ? "#D8E8D4" : "#F7F4F0", fontSize: 10, fontWeight: entry.q === q.v ? 700 : 500,
              color: entry.q === q.v ? "#2E4428" : "#6B6560", cursor: "pointer", fontFamily: "inherit", lineHeight: 1.3 }
          }, q.l))
        )
      ),
      React.createElement("div", { style: { borderTop: "1px solid #DDD8CF", paddingTop: 10 } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 } },
          React.createElement("div", { style: { fontSize: 10, color: "#9E9890", fontWeight: 600 } }, "\u041d\u0435\u0434\u0435\u043b\u044f"),
          avg && React.createElement("div", { style: { fontSize: 10, color: "#4A6741", fontWeight: 700 } }, "\u0421\u0440\u0435\u0434\u043d\u0435\u0435: ", avg, "\u0447")
        ),
        React.createElement("div", { style: { display: "flex", gap: 4, alignItems: "flex-end", height: 32 } },
          weekDays.map(d => React.createElement("div", { key: d.key, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 } },
            React.createElement("div", { style: {
              width: "100%", borderRadius: 3,
              height: d.h ? Math.max(4, Math.round(d.h / 9 * 28)) : 4,
              background: d.h >= 7 ? "#4A6741" : d.h >= 6 ? "#CC5500" : d.h > 0 ? "#FCA5A5" : "#DDD8CF",
              opacity: d.isToday ? 1 : 0.7,
              border: d.isToday ? "1.5px solid #CC5500" : "none"
            } }),
            React.createElement("div", { style: { fontSize: 8, color: d.isToday ? "#CC5500" : "#9E9890", fontWeight: d.isToday ? 700 : 400 } }, d.label)
          ))
        )
      )
    );
  }

  function WaterTracker() {
    const todayKey = `water_${(/* @__PURE__ */ new Date()).toDateString()}`;
    const [glasses, setGlasses] = useLS(todayKey, 0);
    const goal = 8;
    const pct = Math.min(100, Math.round(glasses / goal * 100));
    return /* @__PURE__ */ React.createElement("div", { style: { background: C.card, borderRadius: 12, padding: "12px 14px", marginBottom: 12, boxShadow: C.shadow, border: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, "💧 \u0412\u043E\u0434\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.textM } }, glasses, "/", goal, " \u0441\u0442\u0430\u043A\u0430\u043D\u043E\u0432")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 8 } }, Array.from({ length: goal }, (_, i) => /* @__PURE__ */ React.createElement("div", { key: i, onClick: () => setGlasses(i < glasses ? i : i + 1), style: { flex: 1, height: 22, borderRadius: 4, background: i < glasses ? C.olive : C.bgWarm, border: `1px solid ${i < glasses ? C.olive : C.border}`, cursor: "pointer", transition: "all .15s" } }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.textL } }, pct === 100 ? "\u0426\u0435\u043B\u044C \u0434\u043E\u0441\u0442\u0438\u0433\u043D\u0443\u0442\u0430! 🎉" : `\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C ${goal - glasses} \u0441\u0442\u0430\u043A\u0430\u043D\u0430 (\u2248${(goal - glasses) * 250}\u043C\u043B)`), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setGlasses(Math.max(0, glasses - 1)), style: { width: 24, height: 24, borderRadius: 6, border: `1px solid ${C.border}`, background: "none", cursor: "pointer", fontSize: 12, color: C.textM } }, "\u2212"), /* @__PURE__ */ React.createElement("button", { onClick: () => setGlasses(Math.min(goal, glasses + 1)), style: { width: 24, height: 24, borderRadius: 6, border: "none", background: C.olive, cursor: "pointer", fontSize: 12, color: C.white, fontWeight: 700 } }, "+"))),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, color: C.textM, lineHeight: 1.5, marginTop: 9, paddingTop: 9, borderTop: `0.5px solid ${C.border}` } },
        "🌸 ~1,5–2 л в день — мягкая профилактика цистита: моча светлая, бактерии вымываются. Не терпи позывы и пей чуть больше в жару и после зала."));
  }
  function WorkoutNotes({ dayId }) {
    const dateKey = `note_${dayId}_${(/* @__PURE__ */ new Date()).toLocaleDateString("ru-RU")}`;
    const [note, setNote] = useLS(dateKey, "");
    const [open, setOpen] = useState(false);
    return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen(!open), style: { width: "100%", padding: "9px 12px", borderRadius: 9, background: C.card, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.textM } }, "\u270F\uFE0F \u0417\u0430\u043C\u0435\u0442\u043A\u0438 \u043A \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0435"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.textL } }, note ? `${note.length} \u0441\u0438\u043C\u0432.` : "\u043F\u0443\u0441\u0442\u043E", " ", open ? "\u25B2" : "\u25BC")), open && /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: note,
        onChange: (e) => setNote(e.target.value),
        placeholder: "\u041A\u0430\u043A \u0441\u0435\u0431\u044F \u0447\u0443\u0432\u0441\u0442\u0432\u0443\u0435\u0448\u044C? \u0427\u0442\u043E \u0434\u0430\u043B\u043E\u0441\u044C \u043B\u0435\u0433\u043A\u043E \u0438\u043B\u0438 \u0441\u043B\u043E\u0436\u043D\u043E? \u0427\u0442\u043E \u0445\u043E\u0447\u0435\u0448\u044C \u0437\u0430\u043F\u043E\u043C\u043D\u0438\u0442\u044C...",
        style: { width: "100%", marginTop: 5, padding: "10px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 12, fontFamily: "inherit", color: C.text, resize: "vertical", minHeight: 80, boxSizing: "border-box", outline: "none", lineHeight: 1.6 }
      }
    ));
  }
  function WorkoutScreen({ day }) {
    const [phase, setPhase] = useState("pre");
    const phases = [{ id: "pre", l: "🎯 \u0421\u0442\u0430\u0440\u0442" }, { id: "warm", l: "🔥 \u0420\u0430\u0437\u043C\u0438\u043D\u043A\u0430" }, { id: "main", l: "💪 \u0422\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430" }, { id: "cool", l: "🌙 \u0417\u0430\u043C\u0438\u043D\u043A\u0430" }];
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 3, marginBottom: 13, background: C.bgWarm, borderRadius: 9, padding: 3 } }, phases.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.id, onClick: () => setPhase(p.id), style: { flex: 1, padding: "7px 3px", borderRadius: 7, border: "none", cursor: "pointer", background: phase === p.id ? C.white : "transparent", color: phase === p.id ? C.text : C.textL, fontFamily: "inherit", fontSize: 10, fontWeight: phase === p.id ? 700 : 500, boxShadow: phase === p.id ? C.shadow : "none", transition: "all .15s", whiteSpace: "nowrap" } }, p.l))), phase === "pre" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: C.card, borderRadius: 12, padding: "12px 14px", marginBottom: 10, border: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 } }, "\u23F1 \u041F\u043B\u0430\u043D \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438"), [{ l: "\u0420\u0430\u0437\u043C\u0438\u043D\u043A\u0430", m: 10, e: "🔥" }, { l: "\u041E\u0441\u043D\u043E\u0432\u043D\u0430\u044F \u0447\u0430\u0441\u0442\u044C", m: day.totalMin - 20, e: "💪" }, { l: "\u0417\u0430\u043C\u0438\u043D\u043A\u0430", m: 10, e: "🌙" }].map((it) => /* @__PURE__ */ React.createElement("div", { key: it.l, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.text } }, it.e, " ", it.l), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: day.clr } }, it.m, " \u043C\u0438\u043D"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 7 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.text } }, "\u0418\u0442\u043E\u0433\u043E"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: C.text } }, day.totalMin, " \u043C\u0438\u043D"))), /* @__PURE__ */ React.createElement(PreWorkoutCheck, { onDone: () => setPhase("warm") })), phase === "warm" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 11px", background: C.warnSoft, borderRadius: 8, marginBottom: 10, border: `1px solid ${C.warn}33` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.warn } }, "10 \u043C\u0438\u043D \xB7 \u041F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435 \u0440\u0430\u0437\u043C\u0438\u043D\u043A\u0430 \u0432\u0434\u0432\u043E\u0439\u043D\u0435 \u0432\u0430\u0436\u043D\u0430. \u041D\u0430\u0436\u043C\u0438 \xAB\u041A\u0430\u043A \u0434\u0435\u043B\u0430\u0442\u044C\xBB \u0434\u043B\u044F \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u0439 \u0438 \u0432\u0438\u0434\u0435\u043E.")), day.warmup.map((ex, i) => /* @__PURE__ */ React.createElement(WCCard, { key: i, ex, clr: day.clr })), /* @__PURE__ */ React.createElement("button", { onClick: () => setPhase("main"), style: { width: "100%", marginTop: 8, padding: "12px", borderRadius: 11, background: day.clr, border: "none", color: C.white, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" } }, "\u041D\u0430\u0447\u0430\u0442\u044C \u043E\u0441\u043D\u043E\u0432\u043D\u0443\u044E \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0443 \u2192")), phase === "main" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(WorkoutNotes, { dayId: day.id }), /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 11px", background: C.bgWarm, borderRadius: 8, marginBottom: 10, border: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.textM } }, day.exercises.length, " \u0443\u043F\u0440\u0430\u0436\u043D\u0435\u043D\u0438\u0439 \xB7 \xAB\u25B6 \u0421\u0445\u0435\u043C\u0430 + \u0442\u0435\u0445\u043D\u0438\u043A\u0430\xBB \u2014 \u0438\u043B\u043B\u044E\u0441\u0442\u0440\u0430\u0446\u0438\u044F + AI-\u0442\u0440\u0435\u043D\u0435\u0440 \xB7 \u0417\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u0439 \u043F\u043E\u0434\u0445\u043E\u0434\u044B \u043F\u0440\u044F\u043C\u043E \u0437\u0434\u0435\u0441\u044C")), day.exercises.map((ex, i) => /* @__PURE__ */ React.createElement(ExCard, { key: i, ex, dayId: day.id, clr: day.clr }))), phase === "cool" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 11px", background: C.oliveSoft, borderRadius: 8, marginBottom: 10, border: `1px solid ${C.olive}44` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.oliveDeep } }, "10\u201312 \u043C\u0438\u043D \xB7 \u0420\u0430\u0441\u0441\u043B\u0430\u0431\u043B\u0435\u043D\u0438\u0435 \u0442\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u0434\u043D\u0430 \u0432 \u043A\u043E\u043D\u0446\u0435 \u2014 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u043F\u0440\u0438 \u0441\u043F\u0430\u0437\u043C\u0435!")), day.cooldown.map((ex, i) => /* @__PURE__ */ React.createElement(WCCard, { key: i, ex, clr: day.clr })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, padding: "18px", background: C.oliveSoft, borderRadius: 13, border: `1px solid ${C.olive}55`, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 26, marginBottom: 7 } }, "\u2713"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17, fontWeight: 700, color: C.text } }, "\u0422\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430!"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.textM, marginTop: 5, lineHeight: 1.6 } }, "\u0412\u044B\u043F\u0435\u0439 400 \u043C\u043B \u0432\u043E\u0434\u044B \xB7 \u0411\u0435\u043B\u043E\u043A + \u0443\u0433\u043B\u0435\u0432\u043E\u0434\u044B \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 \u0447\u0430\u0441\u0430"))));
  }
  function DayPickerModal({ workoutDays, onChange, onClose }) {
    const [sel, setSel] = useState(workoutDays);
    const DAY_NAMES = ["\u041F\u043D", "\u0412\u0442", "\u0421\u0440", "\u0427\u0442", "\u041F\u0442", "\u0421\u0431", "\u0412\u0441"];
    const toggle = (d) => {
      if (sel.includes(d)) {
        if (sel.length > 1) setSel(sel.filter((x) => x !== d));
      } else if (sel.length < 3) setSel([...sel, d].sort());
    };
    return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(42,36,24,.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { background: C.card, borderRadius: "16px 16px 0 0", padding: "20px 18px 36px", width: "100%", maxWidth: 430, boxSizing: "border-box" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 5 } }, "\u0412\u044B\u0431\u0435\u0440\u0438 \u0434\u043D\u0438 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043E\u043A"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.textM, marginBottom: 16 } }, "\u0412\u044B\u0431\u0435\u0440\u0438 \u0434\u043E 3 \u0434\u043D\u0435\u0439 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E. \u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u0430\u0434\u0430\u043F\u0442\u0438\u0440\u0443\u0435\u0442\u0441\u044F."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 } }, DAY_NAMES.map((name, i) => {
      const isSel = sel.includes(i);
      return /* @__PURE__ */ React.createElement("button", { key: i, onClick: () => toggle(i), style: { flex: "0 0 calc(25% - 6px)", padding: "12px 4px", borderRadius: 10, border: `2px solid ${isSel ? C.olive : C.border}`, background: isSel ? C.oliveSoft : C.bg, cursor: "pointer", fontSize: 13, fontWeight: isSel ? 700 : 500, color: isSel ? C.oliveDeep : C.textM, fontFamily: "inherit", transition: "all .15s" } }, name);
    })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { flex: 1, padding: "11px", borderRadius: 10, background: C.bgWarm, border: "none", cursor: "pointer", fontSize: 13, color: C.textM, fontFamily: "inherit" } }, "\u041E\u0442\u043C\u0435\u043D\u0430"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      onChange(sel);
      onClose();
    }, style: { flex: 2, padding: "11px", borderRadius: 10, background: C.olive, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: C.white, fontFamily: "inherit" } }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C"))));
  }
  // ===========================================================================
  // HairTab — раздел «Волосы»: фотодневник (раз в месяц), таймлайн ожиданий,
  // объяснение «почему твой план уже работает на волосы», мягкая отметка выпадения.
  // Фото хранятся локально (downscale до ~900px), как и всё в приложении.
  // ===========================================================================
  // ===========================================================================
  // PcosTab — мягкий объясняющий блок про СПКЯ: связывает волосы, цикл, вес,
  // андрогены и то, почему план работает. Без диагнозов, спокойный тон.
  // ===========================================================================
  // ===========================================================================
  // FlareLog — лог обострений (цистит, тазовая боль и пр.): по желанию, не ежедневно.
  // Помогает заметить закономерности и показать врачу. Спокойный тон.
  // ===========================================================================
  function FlareLog() {
    const [flares, setFlares] = useLS("flaresV1", []); // [{id, date, type, severity, trigger, note}]
    const [adding, setAdding] = useState(false);
    const [d, setD] = useState({ date: dayKey(), type: "Цистит", severity: 2, trigger: "", note: "" });
    const TYPES = ["Цистит", "Тазовая боль", "ЖКТ", "Другое"];
    const SEV = [["1", "лёгкое"], ["2", "среднее"], ["3", "сильное"]];

    const save = () => {
      setFlares([{ id: "fl" + Date.now(), ...d, severity: Number(d.severity) }, ...flares]);
      setD({ date: dayKey(), type: "Цистит", severity: 2, trigger: "", note: "" });
      setAdding(false);
    };
    const del = (id) => { if (confirm("Удалить запись?")) setFlares(flares.filter(f => f.id !== id)); };
    const sevLabel = (s) => (SEV.find(x => Number(x[0]) === Number(s)) || ["", ""])[1];
    const sevColor = (s) => Number(s) >= 3 ? C.warn : Number(s) === 2 ? C.sand : C.ok;

    const inp = { width: "100%", padding: "9px 11px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: "inherit", color: C.text, boxSizing: "border-box", outline: "none" };

    return React.createElement("div", null,
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.6 } },
          "Записывай обострения, только когда они есть — это не ежедневный дневник. Со временем видно закономерности (например, что провоцирует цистит), и это удобно показать врачу.")
      ),

      !adding && React.createElement("button", { onClick: () => setAdding(true),
        style: { width: "100%", padding: "12px", borderRadius: 11, background: C.olive, border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 14 } },
        "+ Записать обострение"),

      adding && React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "14px", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 3 } }, "Дата"),
        React.createElement("input", { type: "date", value: d.date, onChange: e => setD({ ...d, date: e.target.value }), style: { ...inp, marginBottom: 10 } }),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 4 } }, "Что беспокоит"),
        React.createElement("div", { style: { display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 } },
          TYPES.map(t => React.createElement("button", { key: t, onClick: () => setD({ ...d, type: t }),
            style: { padding: "7px 12px", borderRadius: 999, border: `0.5px solid ${d.type === t ? C.olive : C.border}`, background: d.type === t ? C.oliveSoft : C.card, color: d.type === t ? C.oliveDeep : C.textM, fontSize: 12, fontWeight: d.type === t ? 600 : 500, cursor: "pointer", fontFamily: "inherit" } }, t))),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 4 } }, "Насколько сильно"),
        React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 10 } },
          SEV.map(s => React.createElement("button", { key: s[0], onClick: () => setD({ ...d, severity: s[0] }),
            style: { flex: 1, padding: "8px", borderRadius: 8, border: `0.5px solid ${String(d.severity) === s[0] ? C.olive : C.border}`, background: String(d.severity) === s[0] ? C.oliveSoft : C.card, color: String(d.severity) === s[0] ? C.oliveDeep : C.textM, fontSize: 12, fontWeight: String(d.severity) === s[0] ? 600 : 500, cursor: "pointer", fontFamily: "inherit" } }, s[1]))),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 4 } }, "Возможный триггер (по желанию)"),
        React.createElement("input", { type: "text", value: d.trigger, onChange: e => setD({ ...d, trigger: e.target.value }), placeholder: "переохлаждение, новый продукт, стресс…", style: { ...inp, marginBottom: 10 } }),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 4 } }, "Заметка (по желанию)"),
        React.createElement("textarea", { value: d.note, onChange: e => setD({ ...d, note: e.target.value }), placeholder: "что помогло, что принимала…", style: { ...inp, minHeight: 50, resize: "vertical", marginBottom: 12 } }),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("button", { onClick: () => setAdding(false), style: { flex: 1, padding: "10px", borderRadius: 9, background: C.bgWarm, border: "none", color: C.textM, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, "Отмена"),
          React.createElement("button", { onClick: save, style: { flex: 2, padding: "10px", borderRadius: 9, background: C.olive, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, "Сохранить")
        )
      ),

      flares.length === 0
        ? React.createElement("div", { style: { fontSize: 12.5, color: C.textL, textAlign: "center", padding: "20px 10px", lineHeight: 1.5 } }, "Пока нет записей. Это хорошо 🌿")
        : flares.map(f => React.createElement("div", { key: f.id, style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 11, padding: "11px 13px", marginBottom: 7 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: f.trigger || f.note ? 6 : 0 } },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                React.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: sevColor(f.severity), flexShrink: 0 } }),
                React.createElement("div", null,
                  React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, f.type),
                  React.createElement("span", { style: { fontSize: 11, color: C.textM, marginLeft: 7 } }, sevLabel(f.severity))
                )
              ),
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                React.createElement("span", { style: { fontSize: 10.5, color: C.textL } }, f.date),
                React.createElement("button", { onClick: () => del(f.id), "aria-label": "удалить", style: { background: "none", border: "none", color: C.textL, fontSize: 15, cursor: "pointer", fontFamily: "inherit" } }, "×")
              )
            ),
            f.trigger && React.createElement("div", { style: { fontSize: 11.5, color: C.textM, lineHeight: 1.5 } }, "Триггер: ", f.trigger),
            f.note && React.createElement("div", { style: { fontSize: 11.5, color: C.textM, fontStyle: "italic", lineHeight: 1.5, marginTop: 2 } }, "«", f.note, "»")
          ))
    );
  }

  // ===========================================================================
  // SkinCareTab — уход за кожей при СПКЯ: мягкая рутина, без обещаний.
  // ===========================================================================
  function SkinCareTab() {
    const [routine, setRoutine] = useLS("skinRoutineV1", {}); // {dayKey: {am:bool, pm:bool}}
    const todayK = dayKey();
    const t = routine[todayK] || {};
    const setStep = (k) => setRoutine({ ...routine, [todayK]: { ...t, [k]: !t[k] } });

    const Block = (title, children) => React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12 } },
      React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 9 } }, title), children);
    const bullet = (txt) => React.createElement("div", { style: { display: "flex", gap: 9, marginBottom: 8 } },
      React.createElement("div", { style: { width: 6, height: 6, borderRadius: "50%", background: C.olive, marginTop: 6, flexShrink: 0 } }),
      React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.55 } }, txt));

    return React.createElement("div", null,
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 14, padding: "14px 16px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.oliveDeep, marginBottom: 5 } }, "🌿 Кожа при СПКЯ"),
        React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.6 } },
          "При СПКЯ из-за андрогенов кожа бывает жирнее и склонна к высыпаниям. Хорошая новость: Ярина снижает андрогены, и кожа часто улучшается вместе с волосами. Уход — мягкий и регулярный, без агрессии.")
      ),

      // Мини-рутина с галочками
      Block("Сегодня", React.createElement(React.Fragment, null,
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          [["am", "🌅 Утро", "Умывание + лёгкий крем + SPF"], ["pm", "🌙 Вечер", "Очищение + актив/крем"]].map(s => React.createElement("button", { key: s[0], onClick: () => setStep(s[0]),
            style: { flex: 1, padding: "12px 10px", borderRadius: 11, border: `0.5px solid ${t[s[0]] ? C.olive : C.border}`, background: t[s[0]] ? C.oliveSoft : C.card, cursor: "pointer", fontFamily: "inherit", textAlign: "left" } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: t[s[0]] ? C.oliveDeep : C.text } }, (t[s[0]] ? "✓ " : "") + s[1]),
            React.createElement("div", { style: { fontSize: 10.5, color: C.textM, marginTop: 3, lineHeight: 1.4 } }, s[2])
          ))
        )
      )),

      Block("Утро", React.createElement(React.Fragment, null,
        bullet("Мягкое умывание (гель без агрессивных ПАВ, не «до скрипа»)."),
        bullet("Лёгкий увлажняющий крем — даже жирной коже нужна влага."),
        bullet(React.createElement("span", null, React.createElement("b", null, "SPF 30+ каждый день"), " — обязательно: солнце усиливает пигментацию и постакне."))
      )),
      Block("Вечер", React.createElement(React.Fragment, null,
        bullet("Очищение — смыть SPF и себум."),
        bullet("Актив 2–3 раза в неделю: ниацинамид (себум, поры) или салициловая кислота (BHA) точечно."),
        bullet("Ретиноид — только по согласованию с врачом; ⚠ не сочетается с беременностью."),
        bullet("Крем по типу кожи завершает уход.")
      )),
      Block("Что обсудить с врачом", React.createElement(React.Fragment, null,
        bullet("Если высыпания болезненные, кистозные или по линии челюсти — это гормональное акне, есть отдельные подходы."),
        bullet("Не выдавливать — постакне и пятна потом дольше уходят."),
        bullet("Резкие «чистки» и спирт сушат и усиливают жирность в ответ.")
      )),
      React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.55, padding: "11px 13px", background: C.bgWarm, borderRadius: 10 } },
        "Это общие принципы, не назначение. Конкретные средства (особенно кислоты и ретиноиды) лучше подобрать с дерматологом — можно записать вопрос в разделе «Врачи».")
    );
  }

  // ===========================================================================
  // SleepRitualTab — ритуал засыпания (не трекер часов): мягкая последовательность.
  // ===========================================================================
  function SleepRitualTab() {
    const [ritual, setRitual] = useLS("sleepRitualV1", {}); // {dayKey: {id:bool}}
    const todayK = dayKey();
    const done = ritual[todayK] || {};
    const STEPS = [
      ["dim", "🕯 Приглушить свет", "За 30–60 мин до сна — меньше яркого и экранов. Свет сбивает мелатонин."],
      ["screen", "📵 Отложить телефон", "Хотя бы за 20 мин. Если листаешь тревожное — это в «Место для тревоги»."],
      ["warm", "🍵 Тёплый ритуал", "Ромашковый чай или тёплый душ — сигнал телу, что день закончен."],
      ["breathe", "🫧 Дыхание 4-7-8", "Вдох на 4, задержка на 7, выдох на 8. Несколько циклов — расслабляет."],
      ["tomorrow", "📝 Отпустить завтра", "Если крутятся мысли — выпиши их, чтобы не держать в голове ночью."],
    ];
    const toggle = (id) => setRitual({ ...ritual, [todayK]: { ...done, [id]: !done[id] } });
    const count = STEPS.filter(s => done[s[0]]).length;

    return React.createElement("div", null,
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 14, padding: "14px 16px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.oliveDeep, marginBottom: 5 } }, "🌙 Ритуал засыпания"),
        React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.6 } },
          "Сон — это половина восстановления: волос, гормонов, настроения. Дело не в количестве часов, а в том, как ты в сон входишь. Эти шаги мягко настраивают тело. Не обязательно все — даже пара помогает.")
      ),
      React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 9, textAlign: "right" } }, "Сегодня: ", count, " из ", STEPS.length),
      STEPS.map(s => React.createElement("button", { key: s[0], onClick: () => toggle(s[0]),
        style: { width: "100%", textAlign: "left", display: "flex", gap: 11, alignItems: "flex-start", background: done[s[0]] ? C.oliveSoft : C.card, border: `0.5px solid ${done[s[0]] ? C.olive : C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer", fontFamily: "inherit" } },
        React.createElement("div", { style: { width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${done[s[0]] ? C.olive : C.border}`, background: done[s[0]] ? C.olive : "transparent", color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 } }, done[s[0]] ? "✓" : ""),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, s[1]),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2, lineHeight: 1.5 } }, s[2])
        )
      )),
      React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.55, padding: "11px 13px", background: C.bgWarm, borderRadius: 10, marginTop: 4 } },
        "Цель — стабильное время отхода ко сну (примерно 23:00). Засыпать и просыпаться в одно время важнее, чем «отоспаться» в выходные.")
    );
  }
  // ===========================================================================
  // GlossaryLabs — глоссарий анализов простым языком.
  // ===========================================================================
  function GlossaryLabs() {
    const [open, setOpen] = useState(null);
    const items = [
      ["Ферритин", "Запас железа в организме — главный маркер для тебя. Низкий ферритin (<30) связан с выпадением волос и усталостью, даже если гемоглобин в норме. Цель — поднять до 30–50+.", "мкг/л · норма 30–100"],
      ["Гемоглобин", "Белок в эритроцитах, переносит кислород. Падает позже ферритина — то есть запасы железа могут быть на нуле, а гемоглобин ещё «нормальный».", "г/л · норма 120–155"],
      ["Сывороточное железо", "Железо, которое прямо сейчас в крови. Колеблется в течение дня, поэтому само по себе мало о чём говорит — смотрят вместе с ферритином и ОЖСС.", "мкмоль/л · норма 7–29"],
      ["ОЖСС / Трансферрин", "Способность крови связывать железо. При дефиците железа повышается — организм «тянется» за железом.", "г/л"],
      ["Витамин B12", "Нужен для кроветворения и нервов. Дефицит даёт усталость и тоже может влиять на волосы.", "пг/мл · норма 189–785"],
      ["Фолат (B9)", "Витамин для кроветворения и клеток. Важен особенно если возможна беременность.", "нг/мл · >3"],
      ["ТТГ", "Гормон, управляющий щитовидкой. И слишком высокий, и слишком низкий влияют на вес, энергию, волосы и цикл — поэтому его проверяют при выпадении.", "мЕд/л · норма 0.4–4.0"],
      ["Витамин D", "Влияет на иммунитет, настроение, кости, и косвенно на волосы. Зимой в Польше часто низкий — отсюда добавка.", "нг/мл · норма 30–80"],
      ["Цинк", "Минерал для кожи, волос, иммунитета. Проверяют по назначению; избыток тоже вреден.", "мкмоль/л"],
      ["ALT / AST", "Печёночные пробы. Их смотрят на фоне приёма лекарств (например дулоксетина), чтобы убедиться, что печени комфортно.", "Ед/л · до 35"],
      ["ГСПГ (SHBG)", "Белок, связывающий половые гормоны. Чем он выше, тем меньше «свободных» андрогенов — а значит меньше влияния на волосы и кожу. Ярина повышает ГСПГ — это хорошо для тебя.", "нмоль/л"],
      ["Тестостерон свободный", "«Активные» мужские гормоны. При СПКЯ бывают повышены — влияют на волосы, кожу, цикл. Цель лечения — мягко их снизить.", "—"],
    ];
    return React.createElement("div", null,
      React.createElement("div", { style: { fontSize: 11.5, color: C.textM, lineHeight: 1.6, marginBottom: 12 } },
        "Что означают строчки в твоих анализах — простым языком. Нажми, чтобы раскрыть."),
      items.map((it, i) => React.createElement("div", { key: i, style: { background: C.card, border: `0.5px solid ${open === i ? C.olive : C.border}`, borderRadius: 11, marginBottom: 7, overflow: "hidden" } },
        React.createElement("button", { onClick: () => setOpen(open === i ? null : i),
          style: { width: "100%", textAlign: "left", padding: "11px 13px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } },
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, it[0]),
            React.createElement("div", { style: { fontSize: 10, color: C.textL, marginTop: 1 } }, it[2])
          ),
          React.createElement("div", { style: { fontSize: 13, color: C.olive, flexShrink: 0 } }, open === i ? "−" : "+")
        ),
        open === i && React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.6, padding: "0 13px 12px" } }, it[1])
      ))
    );
  }

  // ===========================================================================
  // GlossaryPcos — термины СПКЯ и гормоны простым языком.
  // ===========================================================================
  function GlossaryPcos() {
    const [open, setOpen] = useState(null);
    const items = [
      ["Андрогены", "«Мужские» гормоны (есть у всех). При СПКЯ их влияние повышено — отсюда выпадение волос на голове, рост на лице/теле, жирная кожа. Главная цель лечения — снизить их действие."],
      ["Инсулинорезистентность", "Клетки хуже «слышат» инсулин, организму труднее регулировать сахар и легче запасать жир. Частый спутник СПКЯ. Помогают движение, белок, мягкий дефицит — не жёсткий голод."],
      ["Эстроген", "Главный женский гормон. Влияет на цикл, кожу, настроение, кости. В Ярине есть его форма (этинилэстрадиол)."],
      ["Прогестин / дроспиренон", "Синтетический прогестерон. Дроспиренон (в Ярине) особенный — он антиандрогенный, то есть напрямую помогает против выпадения и акне."],
      ["Овуляция", "Выход яйцеклетки. При СПКЯ бывает нерегулярной — отсюда сбои цикла. На Ярине овуляции нет, цикл управляется пачкой."],
      ["ЛГ и ФСГ", "Гормоны гипофиза, управляющие яичниками. При СПКЯ их соотношение часто смещено; иногда смотрят в диагностике."],
      ["АМГ", "Антимюллеров гормон — показатель запаса яйцеклеток. При СПКЯ часто повышен. Не повод для тревоги сам по себе."],
      ["Кортизол", "Гормон стресса. Хронический стресс и недосып поднимают его — а это бьёт и по волосам, и по весу, и по циклу. Поэтому сон и спокойствие — часть лечения."],
      ["Воспаление", "При СПКЯ часто есть лёгкое хроническое воспаление. Против него работают омега-3, сон, движение, достаточно еды."],
    ];
    return React.createElement("div", null,
      React.createElement("div", { style: { fontSize: 11.5, color: C.textM, lineHeight: 1.6, marginBottom: 12 } },
        "Слова, которые встречаются у врачей и в статьях про СПКЯ — без пугающей латыни."),
      items.map((it, i) => React.createElement("div", { key: i, style: { background: C.card, border: `0.5px solid ${open === i ? C.olive : C.border}`, borderRadius: 11, marginBottom: 7, overflow: "hidden" } },
        React.createElement("button", { onClick: () => setOpen(open === i ? null : i),
          style: { width: "100%", textAlign: "left", padding: "11px 13px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, it[0]),
          React.createElement("div", { style: { fontSize: 13, color: C.olive, flexShrink: 0 } }, open === i ? "−" : "+")
        ),
        open === i && React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.6, padding: "0 13px 12px" } }, it[1])
      )),
      React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.55, padding: "11px 13px", background: C.bgWarm, borderRadius: 10, marginTop: 4 } },
        "Это объяснения для понимания, не диагноз. Свои показатели разбирай с врачом.")
    );
  }

  // ===========================================================================
  // AskSupplement — «спроси про добавку»: проверка сочетаемости с твоей схемой.
  // ===========================================================================
  function AskSupplement() {
    const [q, setQ] = useState("");
    const KB = [
      { keys: ["кальц", "calcium", "кости"], name: "Кальций", txt: "Мешает усвоению железа — разнеси с железом минимум на 2 часа. С Яриной совместим. Не пей вместе с утренним железом." },
      { keys: ["магн", "magn"], name: "Магний", txt: "Обычно хорошо переносится, помогает при спазмах и сне. Не пей в один приём с железом (конкуренция) — лучше вечером." },
      { keys: ["цинк", "zinc", "zink"], name: "Цинк", txt: "Уже есть в твоей схеме (Zinkorot). Не дублируй из разных добавок — избыток цинка вреден и мешает усвоению меди." },
      { keys: ["витамин c", "аскорб", "vitamin c", "vit c"], name: "Витамин C", txt: "Немного помогает усвоению железа — можно вместе. Большие дозы не нужны." },
      { keys: ["витамин d", "vit d", "д3", "d3"], name: "Витамин D", txt: "Уже в твоей схеме. Жирорастворимый — пей с едой. Не превышай назначенную дозу." },
      { keys: ["витамин a", "ретинол", "vit a"], name: "Витамин A", txt: "⚠ Уже поступает с Перфектилом и A+E. Избыток витамина A опасен, особенно при возможной беременности. Не добавляй третий источник без врача." },
      { keys: ["омега", "omega", "рыбий", "fish oil"], name: "Омега-3", txt: "Уже в схеме. Противовоспалительно, для настроения и кожи. В больших дозах может влиять на свёртываемость — на фоне Ярины обсуди дозу с врачом." },
      { keys: ["железо", "iron", "феррум"], name: "Железо", txt: "Это основа твоего плана. Не дублируй из нескольких добавок. Пей через день если так назначено, отдельно от кофе/чая/кальция." },
      { keys: ["зверобой", "hypericum", "st john"], name: "Зверобой", txt: "⚠ Серьёзно: снижает эффективность Ярины (риск нежелательной беременности) и взаимодействует с дулоксетином. Не принимай без врача." },
      { keys: ["биотин", "biotin", "h"], name: "Биотин", txt: "Часто пьют «для волос», но доказательств мало, если нет дефицита. ⚠ Важно: биотин искажает результаты анализов (ТТГ, ферритин и др.) — отмени за 2–3 дня до сдачи крови." },
      { keys: ["мелатонин", "melaton"], name: "Мелатонин", txt: "Иногда помогает заснуть. Кратковременно обычно ок. На фоне дулоксетина и при тревоге — лучше обсудить с врачом." },
      { keys: ["коллаген", "collagen"], name: "Коллаген", txt: "Безопасен, но доказательств пользы для волос немного. Не повредит, но это не замена железу и Ярине." },
      { keys: ["инозитол", "inositol", "мио"], name: "Инозитол", txt: "Часто обсуждается при СПКЯ (инсулин, цикл). Может быть полезен, но это решение с врачом — особенно вместе с Яриной." },
    ];
    const norm = (s) => (s || "").toLowerCase().replace(/ё/g, "е");
    const found = q.trim() ? KB.filter(k => k.keys.some(key => norm(q).includes(norm(key)) || norm(key).includes(norm(q)))) : [];
    return React.createElement("div", null,
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.6 } },
          "Думаешь добавить новую добавку или таблетку? Введи название — подскажу, как она сочетается с твоей схемой (Ярина, железо, дулоксетин и др.). Это ориентир, финальное слово — за врачом.")
      ),
      React.createElement("input", { value: q, onChange: e => setQ(e.target.value), placeholder: "Например: магний, биотин, зверобой…",
        style: { width: "100%", padding: "11px 13px", borderRadius: 10, border: `0.5px solid ${C.border}`, background: C.card, fontSize: 13, fontFamily: "inherit", color: C.text, boxSizing: "border-box", outline: "none", marginBottom: 12 } }),
      q.trim() && found.length === 0 && React.createElement("div", { style: { fontSize: 12, color: C.textM, lineHeight: 1.6, padding: "13px", background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 11 } },
        "Не нашла это в базе. Общее правило: новую добавку вводи по одной, проверь сочетаемость с Яриной и дулоксетином у врача или фармацевта, и не дублируй то, что уже есть в схеме."),
      found.map((k, i) => React.createElement("div", { key: i, style: { background: C.card, border: `0.5px solid ${k.txt.includes("⚠") ? C.warn + "55" : C.border}`, borderRadius: 11, padding: "12px 14px", marginBottom: 8 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 } }, k.name),
        React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.6 } }, k.txt)
      )),
      React.createElement("div", { style: { fontSize: 10.5, color: C.textL, lineHeight: 1.5, marginTop: 8 } },
        "База — частые добавки. Это не назначение и не полный список взаимодействий.")
    );
  }
  function PcosTab() {
    return React.createElement("div", null,
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: C.oliveDeep, marginBottom: 5 } }, "🌿 Что такое СПКЯ простыми словами"),
        React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.6 } },
          "СПКЯ (синдром поликистозных яичников) — частое гормональное состояние, не болезнь «навсегда сломанного» организма. Главное звено — чуть более высокий уровень мужских гормонов (андрогенов) и особенности того, как тело реагирует на инсулин. Именно это связывает между собой то, что тебя беспокоит: волосы, цикл и вес.")
      ),

      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 } }, "Как это связано между собой"),
        [
          ["Волосы", "повышенные андрогены укорачивают жизнь волосяных фолликулов на голове — отсюда выпадение/поредение. Снижение андрогенов работает в обратную сторону."],
          ["Цикл", "при СПКЯ овуляция бывает нерегулярной, отсюда сбои цикла. КОК (Ярина) даёт телу предсказуемый ритм."],
          ["Вес и инсулин", "клетки хуже слышат инсулин → организму легче запасать. Поэтому худеть бывает труднее, и помогает не жёсткий голод, а мягкий дефицит + движение + белок."],
          ["Воспаление", "лёгкое хроническое воспаление — фон СПКЯ; омега-3, сон и снижение стресса работают против него."],
        ].map((it, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 9, marginBottom: 9 } },
          React.createElement("div", { style: { width: 6, height: 6, borderRadius: "50%", background: C.olive, marginTop: 6, flexShrink: 0 } }),
          React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.55 } },
            React.createElement("b", null, it[0]), " — ", it[1])
        ))
      ),

      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 } }, "Почему твой план попадает в корень"),
        [
          ["Ярина (дроспиренон)", "снижает действие андрогенов — напрямую помогает и волосам, и коже, и регулярности."],
          ["Железо", "дефицит сам по себе усиливает выпадение; восстановление запасов убирает один из факторов."],
          ["Мягкий дефицит + движение", "улучшает чувствительность к инсулину — ключевой рычаг при СПКЯ, без вреда для волос."],
          ["Белок, сон, спокойствие", "поддерживают гормональный фон и снижают воспаление."],
        ].map((it, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 9, marginBottom: 9 } },
          React.createElement("div", { style: { color: C.ok, fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 } }, "✓"),
          React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.55 } },
            React.createElement("b", null, it[0]), " — ", it[1])
        ))
      ),

      React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.55, padding: "11px 13px", background: C.bgWarm, borderRadius: 10 } },
        "Это общая информация, не диагноз и не замена врачу. Конкретно твою картину (анализы, УЗИ, назначения) лучше обсуждать с гинекологом-эндокринологом — вопросы можно копить в разделе «Врачи».")
    );
  }

  function HairTab() {
    const [photos, setPhotos] = useLS("hairPhotosV1", []); // [{id, date, angle, data}]
    const [shed, setShed] = useLS("hairShedV1", {});       // { 'YYYY-Www': 'less'|'same'|'more' }
    const [compare, setCompare] = useState(false);
    const fileRef = React.useRef(null);
    const pendingAngle = React.useRef("пробор");

    const ANGLES = ["пробор", "виски", "макушка"];

    const addPhoto = (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          // downscale до макс 900px по большей стороне
          const max = 900;
          let { width: w, height: h } = img;
          if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
          else if (h > max) { w = Math.round(w * max / h); h = max; }
          const cv = document.createElement("canvas");
          cv.width = w; cv.height = h;
          cv.getContext("2d").drawImage(img, 0, 0, w, h);
          const data = cv.toDataURL("image/jpeg", 0.8);
          const entry = { id: "p" + Date.now(), date: dayKey(), angle: pendingAngle.current, data };
          setPhotos([entry, ...photos]);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(f);
      e.target.value = "";
    };

    const triggerAdd = (angle) => { pendingAngle.current = angle; fileRef.current && fileRef.current.click(); };
    const delPhoto = (id) => { if (confirm("Удалить это фото?")) setPhotos(photos.filter(p => p.id !== id)); };

    // Неделя для отметки выin
    const weekKey = (() => {
      const d = new Date();
      const onejan = new Date(d.getFullYear(), 0, 1);
      const wk = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${wk}`;
    })();

    const byAngle = {};
    ANGLES.forEach(a => { byAngle[a] = photos.filter(p => p.angle === a).sort((x, y) => y.date < x.date ? -1 : 1); });

    const monthsSinceStart = (() => {
      const start = mkd("2026-05-25");
      const now = new Date();
      return Math.max(0, Math.round((now - start) / (1000 * 60 * 60 * 24 * 30)));
    })();

    return React.createElement("div", null,
      // Тёплая шапка
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: C.oliveDeep, marginBottom: 5 } }, "🦊 Твои волосы"),
        React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.6 } },
          "Это марафон, не спринт. Первая цель сейчас — не отрастить, а остановить выпадение. Глаз не замечает медленных изменений, поэтому фото раз в месяц — твой главный союзник: через 3 месяца разница видна, даже когда в зеркале кажется, что ничего не меняется.")
      ),

      // Почему план работает на волосы
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 } }, "Почему твой план уже работает на волосы"),
        [
          ["Ярина (дроспиренон)", "снижает действие андрогенов — гормонов, которые при СПКЯ запускают выпадение. Это уже лечение, а не только контрацепция."],
          ["Восстановление железа", "низкий ферритин связан с выпадением; по мере роста запасов волосы получают «топливо». Особенно работает в паре с Яриной."],
          ["Белок и достаточное питание", "волос на 90% состоит из белка; нехватка еды и резкие дефициты — частый триггер выпадения."],
          ["Сон и снижение тревоги", "стресс и недосып подталкивают волосы в фазу выпадения; спокойный режим работает в твою пользу."],
        ].map((it, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 9, marginBottom: 9 } },
          React.createElement("div", { style: { width: 6, height: 6, borderRadius: "50%", background: C.olive, marginTop: 6, flexShrink: 0 } }),
          React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.55 } },
            React.createElement("b", null, it[0]), " — ", it[1])
        ))
      ),

      // Таймлайн ожиданий
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 } }, "Чего ожидать по месяцам"),
        [
          ["0–2 мес", "Возможно, выпадение даже усилится в начале — это часто знак, что фолликулы перезапускаются, а не ухудшение. Цель сейчас — остановить, не отрастить.", monthsSinceStart <= 2],
          ["2–4 мес", "Выпадение замедляется. У пробора могут появиться короткие новые волоски.", monthsSinceStart > 2 && monthsSinceStart <= 4],
          ["6–12 мес", "Видимая густота. Это марафон — изменения накапливаются медленно.", monthsSinceStart > 4],
        ].map((it, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 10, marginBottom: 10, opacity: it[2] ? 1 : 0.6 } },
          React.createElement("div", { style: { minWidth: 64, fontSize: 11.5, fontWeight: 700, color: it[2] ? C.oliveDeep : C.textM } }, it[0]),
          React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.55 } }, it[1])
        )),
        React.createElement("div", { style: { fontSize: 10.5, color: C.textL, lineHeight: 1.5, marginTop: 4 } },
          "Сроки индивидуальны и не гарантированы — это ориентир, а не обещание.")
      ),

      // Фотодневник
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, "Фотодневник"),
          photos.length >= 2 && React.createElement("button", { onClick: () => setCompare(c => !c),
            style: { fontSize: 11.5, color: C.oliveDeep, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: 3 } },
            compare ? "обычный вид" : "сравнить до/сейчас")
        ),
        React.createElement("div", { style: { fontSize: 11.5, color: C.textM, lineHeight: 1.5, marginBottom: 12 } },
          "Раз в месяц, при одном и том же свете. Три ракурса. Сравнивай не с зеркалом, а с собой месяц назад."),
        React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", capture: "environment", onChange: addPhoto, style: { display: "none" } }),
        ANGLES.map(angle => {
          const list = byAngle[angle];
          return React.createElement("div", { key: angle, style: { marginBottom: 14 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } },
              React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.oliveDeep } }, angle),
              React.createElement("button", { onClick: () => triggerAdd(angle),
                style: { fontSize: 11.5, padding: "5px 11px", borderRadius: 8, background: C.oliveSoft, border: `0.5px solid ${C.olive}44`, color: C.oliveDeep, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, "+ фото")
            ),
            list.length === 0
              ? React.createElement("div", { style: { fontSize: 11.5, color: C.textL, padding: "10px 0" } }, "Пока нет фото")
              : compare && list.length >= 2
                ? React.createElement("div", { style: { display: "flex", gap: 8 } },
                    [list[list.length - 1], list[0]].map((p, i) => React.createElement("div", { key: i, style: { flex: 1 } },
                      React.createElement("img", { src: p.data, alt: "", style: { width: "100%", borderRadius: 10, display: "block", border: `0.5px solid ${C.border}` } }),
                      React.createElement("div", { style: { fontSize: 10.5, color: C.textM, textAlign: "center", marginTop: 3 } }, i === 0 ? "начало · " + p.date : "сейчас · " + p.date)
                    ))
                  )
                : React.createElement("div", { style: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 } },
                    list.map(p => React.createElement("div", { key: p.id, style: { position: "relative", flexShrink: 0 } },
                      React.createElement("img", { src: p.data, alt: "", style: { height: 110, borderRadius: 10, display: "block", border: `0.5px solid ${C.border}` } }),
                      React.createElement("div", { style: { fontSize: 10, color: C.textM, textAlign: "center", marginTop: 3 } }, p.date),
                      React.createElement("button", { onClick: () => delPhoto(p.id), "aria-label": "удалить",
                        style: { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.45)", color: "#fff", border: "none", fontSize: 13, cursor: "pointer", lineHeight: 1, fontFamily: "inherit" } }, "×")
                    ))
                  )
          );
        }),
        React.createElement("div", { style: { fontSize: 10.5, color: C.textL, lineHeight: 1.5, marginTop: 2 } },
          "Фото хранятся только на этом устройстве. Раз в месяц — достаточно; чаще не нужно и может усиливать тревогу.")
      ),

      // Мягкая отметка выпадения (по желанию, раз в неделю, без цифр)
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 } }, "Как ощущается выпадение на этой неделе"),
        React.createElement("div", { style: { fontSize: 11.5, color: C.textM, lineHeight: 1.5, marginBottom: 10 } },
          "По ощущению, без подсчётов. Считать волосы не нужно — это только усиливает тревогу."),
        React.createElement("div", { style: { display: "flex", gap: 6 } },
          [["less", "меньше"], ["same", "так же"], ["more", "больше"]].map(o => React.createElement("button", {
            key: o[0], onClick: () => setShed({ ...shed, [weekKey]: o[0] }),
            style: { flex: 1, padding: "10px 0", borderRadius: 9, border: `0.5px solid ${shed[weekKey] === o[0] ? C.olive : C.border}`,
              background: shed[weekKey] === o[0] ? C.oliveSoft : C.card, color: shed[weekKey] === o[0] ? C.oliveDeep : C.text,
              fontSize: 12, fontWeight: shed[weekKey] === o[0] ? 600 : 500, cursor: "pointer", fontFamily: "inherit" } }, o[1]))
        )
      )
    );
  }

  // Общий мини-график (используется в трендах Питания и Спорта)
  const LineChart = ({ values, color, max = 5, height = 56 }) => {
    const width = 260;
    const step = width / Math.max(1, values.length - 1);
    const points = values.map((v, i) => `${i * step},${height - (v / max) * (height - 8) - 4}`).join(" ");
    const lastY = height - (values[values.length - 1] / max) * (height - 8) - 4;
    const lastX = (values.length - 1) * step;
    return React.createElement("svg", { width: "100%", height, viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: "none" },
      React.createElement("polyline", { points, fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }),
      React.createElement("circle", { cx: lastX, cy: lastY, r: 3, fill: color })
    );
  };

  function NutritionTrends() {
    const [range, setRange] = useState(30);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = range - 1; i >= 0; i--) { const d = new Date(today); d.setDate(d.getDate() - i); days.push(d); }
    let diary = {}, gut = {}, mood = {};
    try { diary = (JSON.parse(localStorage.getItem("foodDiaryV1") || "{}") || {}); } catch (e) {}
    try { gut = (JSON.parse(localStorage.getItem("gutFoodDaysV1") || "{}") || {}); } catch (e) {}
    try { mood = (JSON.parse(localStorage.getItem("moodDiaryV1") || "{}") || {}); } catch (e) {}
    const dayItems = (d) => diary[d.toLocaleDateString("ru-RU")] || [];
    const kcalArr = days.map(d => dayItems(d).reduce((a, it) => a + (it.k || 0), 0));
    const protArr = days.map(d => dayItems(d).reduce((a, it) => a + (it.p || 0), 0));
    const daysWithFood = days.filter(d => dayItems(d).length > 0).length;
    const protFilled = protArr.filter(v => v > 0);
    const avgProt = protFilled.length ? Math.round(protFilled.reduce((a, b) => a + b, 0) / protFilled.length) : 0;
    const daysProtGoal = protArr.filter(v => v >= 90).length;
    // Баланс БЖУ за период (по граммам -> ккал: Б/У *4, Ж *9)
    let pSum = 0, fSum = 0, cSum = 0;
    days.forEach(d => dayItems(d).forEach(it => { pSum += it.p || 0; fSum += it.f || 0; cSum += it.c || 0; }));
    const pK = pSum * 4, fK = fSum * 9, cK = cSum * 4; const totK = pK + fK + cK;
    const pct = (x) => totK > 0 ? Math.round(x / totK * 100) : 0;
    // Регулярность ЖКТ
    const gutDays = days.filter(d => gut[d.toLocaleDateString("ru-RU")]).length;
    // Топ-блюда
    const counts = {};
    days.forEach(d => dayItems(d).forEach(it => { const nm = (it.name || "").replace(/\s*\(\d+\s*\u0433\)/, "").trim(); if (nm) counts[nm] = (counts[nm] || 0) + 1; }));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    // Связь: белок vs энергия
    let corr = null; const hi = [], lo = [];
    days.forEach((d, i) => { const m = mood[dayKey(d)]; if (m && m.energy > 0 && protArr[i] > 0) (protArr[i] >= 90 ? hi : lo).push(m.energy); });
    if (hi.length >= 2 && lo.length >= 2) {
      const hm = hi.reduce((a, b) => a + b, 0) / hi.length, lm = lo.reduce((a, b) => a + b, 0) / lo.length;
      if (hm - lm >= 0.4) corr = "\u0412 \u0434\u043d\u0438 \u0441 \u0431\u0435\u043b\u043a\u043e\u043c 90\u0433+ \u044d\u043d\u0435\u0440\u0433\u0438\u044f \u0432 \u0441\u0440\u0435\u0434\u043d\u0435\u043c \u0432\u044b\u0448\u0435. \u041d\u0430\u0431\u043b\u044e\u0434\u0435\u043d\u0438\u0435 \u043f\u043e \u0442\u0432\u043e\u0438\u043c \u0434\u0430\u043d\u043d\u044b\u043c, \u043d\u0435 \u043f\u0440\u0430\u0432\u0438\u043b\u043e.";
    }
    const card = (inner) => React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 11, padding: "12px 14px", marginBottom: 10 } }, inner);
    if (daysWithFood < 1 && gutDays < 1) {
      return React.createElement("div", { style: { padding: "30px 16px", textAlign: "center", color: C.textM, fontSize: 12.5, lineHeight: 1.6 } },
        "\u041a\u043e\u0433\u0434\u0430 \u043d\u0430\u0447\u043d\u0451\u0448\u044c \u0432\u0435\u0441\u0442\u0438 \u0434\u043d\u0435\u0432\u043d\u0438\u043a \u0435\u0434\u044b \u0432 \u00ab\u041c\u043e\u0438 \u0446\u0435\u043b\u0438\u00bb, \u0437\u0434\u0435\u0441\u044c \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u0442\u0432\u043e\u0438 \u0442\u0440\u0435\u043d\u0434\u044b \u043f\u043e \u043f\u0438\u0442\u0430\u043d\u0438\u044e.");
    }
    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 12 } },
        [7, 30, 90].map(r => React.createElement("button", { key: r, onClick: () => setRange(r),
          style: { flex: 1, padding: "7px 0", borderRadius: 7, border: `0.5px solid ${range === r ? C.olive : C.border}`, background: range === r ? C.olive : C.card, fontSize: 12, fontWeight: 600, color: range === r ? "#fff" : C.textM, cursor: "pointer", fontFamily: "inherit" } }, r, " \u0434\u043d"))
      ),
      card(React.createElement(React.Fragment, null,
        React.createElement("div", { style: { fontSize: 12.5, fontWeight: 700, color: C.oliveDeep, marginBottom: 8 } }, "\ud83d\udccb \u0421\u0432\u043e\u0434\u043a\u0430 \u0437\u0430 " + range + " \u0434\u043d"),
        React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.7 } },
          "\ud83d\udcaa \u0431\u0435\u043b\u043e\u043a \u0432 \u0441\u0440\u0435\u0434\u043d\u0435\u043c: " + (avgProt || "\u2014") + " \u0433  \u00b7  \u0434\u043d\u0435\u0439 \u0441 \u0446\u0435\u043b\u044c\u044e (90\u0433+): " + daysProtGoal),
        React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.7 } }, "\ud83c\udf7d \u0434\u043d\u0435\u0439 \u0441 \u0434\u043d\u0435\u0432\u043d\u0438\u043a\u043e\u043c: " + daysWithFood + "  \u00b7  \ud83c\udf3f \u0435\u043b\u0430 \u0434\u043b\u044f \u0416\u041a\u0422: " + gutDays + " \u0434\u043d")
      )),
      protFilled.length >= 3 && card(React.createElement(React.Fragment, null,
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 10 } },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text } }, "\ud83d\udcaa \u0411\u0435\u043b\u043e\u043a, \u0433"),
          React.createElement("div", { style: { fontSize: 11, color: C.textM } }, "\u0446\u0435\u043b\u044c 90\u2013105")),
        LineChart({ values: protArr, color: C.oliveDeep, max: Math.max(110, ...protArr) })
      )),
      kcalArr.filter(v => v > 0).length >= 3 && card(React.createElement(React.Fragment, null,
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4 } }, "\ud83c\udf7d \u041a\u0430\u043b\u043e\u0440\u0438\u0438 \u043f\u043e \u0434\u043d\u044f\u043c"),
        React.createElement("div", { style: { fontSize: 10, color: C.textL, marginBottom: 10, lineHeight: 1.4 } }, "\u041d\u0435\u0439\u0442\u0440\u0430\u043b\u044c\u043d\u043e, \u0431\u0435\u0437 \u043d\u043e\u0440\u043c \u0438 \u043e\u0446\u0435\u043d\u043e\u043a \u2014 \u043f\u0440\u043e\u0441\u0442\u043e \u043e\u0431\u0449\u0430\u044f \u043a\u0430\u0440\u0442\u0438\u043d\u0430."),
        LineChart({ values: kcalArr, color: C.textM, max: Math.max(2000, ...kcalArr) })
      )),
      totK > 0 && card(React.createElement(React.Fragment, null,
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 } }, "\u2696\ufe0f \u0411\u0430\u043b\u0430\u043d\u0441 \u0411\u0416\u0423 (\u0432 \u0441\u0440\u0435\u0434\u043d\u0435\u043c)"),
        React.createElement("div", { style: { display: "flex", height: 22, borderRadius: 6, overflow: "hidden", marginBottom: 6 } },
          React.createElement("div", { style: { width: pct(pK) + "%", background: C.oliveDeep } }),
          React.createElement("div", { style: { width: pct(fK) + "%", background: C.sand } }),
          React.createElement("div", { style: { width: pct(cK) + "%", background: C.bark } })),
        React.createElement("div", { style: { fontSize: 11, color: C.textM } }, "\u0411\u0435\u043b\u043a\u0438 " + pct(pK) + "%  \u00b7  \u0416\u0438\u0440\u044b " + pct(fK) + "%  \u00b7  \u0423\u0433\u043b\u0435\u0432\u043e\u0434\u044b " + pct(cK) + "%")
      )),
      top.length > 0 && card(React.createElement(React.Fragment, null,
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 } }, "\ud83c\udf72 \u0427\u0430\u0449\u0435 \u0432\u0441\u0435\u0433\u043e \u0435\u043b\u0430"),
        top.map((t, i) => React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: C.text, padding: "3px 0" } },
          React.createElement("span", { style: { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 } }, t[0]),
          React.createElement("b", { style: { flexShrink: 0 } }, t[1] + "\u00d7")))
      )),
      corr && card(React.createElement("div", { style: { fontSize: 11.5, color: C.textM, lineHeight: 1.5 } }, "\ud83d\udca1 " + corr))
    );
  }

  function NutritionTab() {
    const [subTab, setSubTab] = useState("recipes");
    const subs = [
      { id: "recipes", l: "🍳 Рецепты" },
      { id: "goals", l: "📊 Мои цели" },
      { id: "trends", l: "📈 Тренды" },
    ];
    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", gap: 3, marginBottom: 14, background: C.bgWarm, borderRadius: 9, padding: 3 } },
        subs.map(t => React.createElement("button", { key: t.id, onClick: () => setSubTab(t.id),
          style: { flex: 1, padding: "8px 4px", borderRadius: 7, border: "none", cursor: "pointer",
            background: subTab === t.id ? C.card : "transparent", color: subTab === t.id ? C.text : C.textL,
            fontFamily: "inherit", fontSize: 12.5, fontWeight: subTab === t.id ? 700 : 500, transition: "all .15s" }
        }, t.l))
      ),
      subTab === "recipes" && React.createElement(RecipesTab, null),
      subTab === "goals" && React.createElement(GoalsTab, null),
      subTab === "trends" && React.createElement(NutritionTrends, null)
    );
  }

  // ===========================================================================
  // ProteinFoodsTab — белковые блюда для ленивых.
  // Сгруппированы по приёму пищи. У каждого блюда: состав, граммы белка, время готовки.
  // ===========================================================================
  function ProteinFoodsTab() {
    const [proteinGoal] = useLS("proteinGoal", 90);
    const [filterMeal, setFilterMeal] = useState("all");
    const [filterTime, setFilterTime] = useState("all");

    // Каталог рецептов — простые "формулы" для набора белка
    const foods = [
      // ЗАВТРАК
      { meal: "breakfast", name: "Творог + ягоды + мёд", protein: 36, time: 2, ing: "Творог 5% 200г + любые ягоды + ложка мёда" },
      { meal: "breakfast", name: "Омлет с сыром", protein: 28, time: 7, ing: "3 яйца + 50г твёрдого сыра + помидор" },
      { meal: "breakfast", name: "Греческий йогурт с овсянкой", protein: 25, time: 3, ing: "Греч. йогурт 250г + овсянка 30г + орехи" },
      { meal: "breakfast", name: "Протеиновый смузи", protein: 30, time: 2, ing: "Протеин 25г + банан + молоко/растительное 200мл" },
      { meal: "breakfast", name: "Скрэмбл с творогом", protein: 32, time: 5, ing: "3 яйца + 100г творога взбить вместе" },
      // ОБЕД
      { meal: "lunch", name: "Куриная грудка + крупа", protein: 35, time: 20, ing: "Куриная грудка 150г + гречка/киноа + овощи" },
      { meal: "lunch", name: "Запечённая рыба", protein: 32, time: 25, ing: "Лосось/треска 180г запечь + овощи на пару" },
      { meal: "lunch", name: "Тушёная говядина", protein: 30, time: 30, ing: "Говядина 130г тушить с овощами" },
      { meal: "lunch", name: "Чечевица с яйцом", protein: 25, time: 25, ing: "Варёная чечевица 200г + 2 яйца + овощи (вегет.)" },
      { meal: "lunch", name: "Тунец-салат с яйцом", protein: 33, time: 10, ing: "Банка тунца + 2 яйца + овощи + майонез" },
      // ПЕРЕКУС
      { meal: "snack", name: "Банка тунца", protein: 25, time: 1, ing: "Тунец в собственном соку 170г" },
      { meal: "snack", name: "Протеиновый коктейль", protein: 22, time: 2, ing: "Протеин 25г + вода/молоко 250мл" },
      { meal: "snack", name: "Творог + орехи", protein: 18, time: 1, ing: "Творог 100г + горсть миндаля/грецких" },
      { meal: "snack", name: "3 варёных яйца", protein: 18, time: 10, ing: "Варить 8-10 мин, можно заранее на 3 дня" },
      { meal: "snack", name: "Сыр + кешью", protein: 15, time: 1, ing: "30г сыра + 30г кешью" },
      // УЖИН
      { meal: "dinner", name: "Рыба + овощи на пару", protein: 30, time: 20, ing: "Рыба 150г + брокколи/спаржа/морковь" },
      { meal: "dinner", name: "Куриные котлеты", protein: 28, time: 25, ing: "Фарш куриный 130г + лук + специи, в духовке" },
      { meal: "dinner", name: "Омлет с тунцом", protein: 30, time: 8, ing: "3 яйца + 100г тунца + зелень" },
      { meal: "dinner", name: "Творожная запеканка", protein: 32, time: 35, ing: "Творог 200г + 2 яйца + ваниль, в духовке" },
      { meal: "dinner", name: "Креветки + овощи", protein: 28, time: 12, ing: "Креветки 150г + цукини + чеснок на сковороде" },
    ];

    const mealLabels = { all: "Все", breakfast: "Завтрак", lunch: "Обед", snack: "Перекус", dinner: "Ужин" };
    const timeFilters = [
      { id: "all", l: "Любое" },
      { id: "fast", l: "< 5 мин", max: 5 },
      { id: "med", l: "5—15 мин", min: 5, max: 15 },
      { id: "slow", l: "15+ мин", min: 15 },
    ];

    const filtered = foods.filter(f => {
      if (filterMeal !== "all" && f.meal !== filterMeal) return false;
      const tf = timeFilters.find(t => t.id === filterTime);
      if (tf && tf.id !== "all") {
        if (tf.min !== undefined && f.time < tf.min) return false;
        if (tf.max !== undefined && f.time > tf.max) return false;
      }
      return true;
    }).sort((a, b) => b.protein - a.protein);

    return React.createElement("div", null,
      // Заголовок с целью
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 10, padding: "11px 13px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.oliveDeep, marginBottom: 4 } },
          "🥩 Цель: ", proteinGoal, " г белка / день"
        ),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.5 } },
          "Распредели на 3—4 приёма по 20—30 г. Организм не усваивает >30 г за раз — нет смысла съесть всё на ужин."
        )
      ),

      // Фильтры
      React.createElement("div", { style: { fontSize: 10, color: C.textM, fontWeight: 600, marginBottom: 6, letterSpacing: 0.3 } }, "ПРИЁМ ПИЩИ"),
      React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" } },
        Object.entries(mealLabels).map(([id, l]) => React.createElement("button", { key: id, onClick: () => setFilterMeal(id),
          style: { padding: "6px 11px", borderRadius: 7, border: `0.5px solid ${filterMeal === id ? C.olive : C.border}`,
            background: filterMeal === id ? C.oliveSoft : C.card, color: filterMeal === id ? C.oliveDeep : C.textM,
            fontSize: 11, fontWeight: filterMeal === id ? 600 : 500, cursor: "pointer", fontFamily: "inherit" }
        }, l))
      ),
      React.createElement("div", { style: { fontSize: 10, color: C.textM, fontWeight: 600, marginBottom: 6, letterSpacing: 0.3 } }, "ВРЕМЯ ГОТОВКИ"),
      React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" } },
        timeFilters.map(t => React.createElement("button", { key: t.id, onClick: () => setFilterTime(t.id),
          style: { padding: "6px 11px", borderRadius: 7, border: `0.5px solid ${filterTime === t.id ? C.olive : C.border}`,
            background: filterTime === t.id ? C.oliveSoft : C.card, color: filterTime === t.id ? C.oliveDeep : C.textM,
            fontSize: 11, fontWeight: filterTime === t.id ? 600 : 500, cursor: "pointer", fontFamily: "inherit" }
        }, t.l))
      ),

      // Список блюд
      filtered.length === 0
        ? React.createElement("div", { style: { textAlign: "center", padding: "30px 20px", color: C.textM, fontSize: 12 } }, "Нет блюд под эти фильтры")
        : filtered.map((f, i) => React.createElement("div", { key: i,
            style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "11px 13px", marginBottom: 6 }
          },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 4 } },
              React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, flex: 1 } }, f.name),
              React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 } },
                React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.olive } }, f.protein, " г"),
                React.createElement("div", { style: { fontSize: 10, color: C.textL, marginTop: 1 } }, f.time, " мин")
              )
            ),
            React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.5 } }, f.ing)
          ))
    );
  }
  function MealTimingBlock() {
    const [mealTimes] = useLS("mealTimes", { b: "08:00", l: "13:00", s: "16:30", d: "19:00" });
    const meals = [
      { k: "b", m: "\u0417\u0430\u0432\u0442\u0440\u0430\u043A", pct: "30%", n: "\u0423\u0433\u043B\u0435\u0432\u043E\u0434\u044B + \u0431\u0435\u043B\u043E\u043A" },
      { k: "l", m: "\u041E\u0431\u0435\u0434", pct: "35%", n: "\u0421\u0430\u043C\u044B\u0439 \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u043F\u0440\u0438\u0451\u043C" },
      { k: "s", m: "\u041F\u0435\u0440\u0435\u043A\u0443\u0441", pct: "10%", n: "\u0411\u0435\u043B\u043E\u043A \u0438\u043B\u0438 \u0444\u0440\u0443\u043A\u0442" },
      { k: "d", m: "\u0423\u0436\u0438\u043D", pct: "25%", n: "\u0411\u0435\u043B\u043E\u043A + \u043E\u0432\u043E\u0449\u0438" }
    ];
    return /* @__PURE__ */ React.createElement("div", { style: { background: C.card, borderRadius: 10, padding: "10px 12px", boxShadow: C.shadow, border: `1px solid ${C.border}`, marginTop: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.text } }, "\u0420\u0435\u0436\u0438\u043C \u043F\u0438\u0442\u0430\u043D\u0438\u044F (4 \u043F\u0440\u0438\u0451\u043C\u0430)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: C.textL } }, "\u0412\u0440\u0435\u043C\u044F \u2192 \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u2699\uFE0F")), meals.map((it) => /* @__PURE__ */ React.createElement("div", { key: it.k, style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.olive, fontWeight: 700, width: 42, flexShrink: 0 } }, mealTimes[it.k]), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, background: C.bgWarm, borderRadius: 6, height: 6, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: it.pct, background: C.olive, borderRadius: 6 } })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: C.text, width: 60, flexShrink: 0 } }, it.m), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.textL, flex: 1 } }, it.n))));
  }
  function MacrosTab() {
    const [mode, setMode] = useState("training");
    const [showRef, setShowRef] = useLS("macrosRefOpen", true);
    const RefCard = React.createElement("div", { style: { background: C.card, borderRadius: 12, padding: "12px 14px", marginBottom: 10, border: `1px solid ${C.border}` } },
      React.createElement("button", { onClick: () => setShowRef(!showRef), style: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" } },
        React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, "📊 Мои ориентиры (справка)"),
        React.createElement("span", { style: { fontSize: 11, color: C.textL } }, showRef ? "скрыть ▲" : "показать ▼")),
      showRef && React.createElement("div", { style: { marginTop: 10, fontSize: 12, color: C.text, lineHeight: 1.6 } },
        React.createElement("div", null, "Рост 168 см · вес 55 кг · активный образ жизни (зал + бег + тренировки)"),
        React.createElement("div", { style: { marginTop: 6, display: "flex", flexDirection: "column", gap: 4 } },
          React.createElement("div", null, "🔸 Поддержание: ~", React.createElement("b", null, "1900 ккал")),
          React.createElement("div", null, "🔸 День без тренировки: ~", React.createElement("b", null, "1650 ккал")),
          React.createElement("div", null, "🔸 День тренировки: ~", React.createElement("b", null, "1750–1850 ккал")),
          React.createElement("div", null, "🔸 Белок: ", React.createElement("b", null, "90–105 г"), " · Жиры: ", React.createElement("b", null, "45–55 г"), " · Клетчатка: ", React.createElement("b", null, "≥30–35 г"))
        ),
        React.createElement("div", { style: { marginTop: 8, fontSize: 10.5, color: C.textL, lineHeight: 1.5, paddingTop: 8, borderTop: `0.5px solid ${C.border}` } },
          "Это ориентир, не жёсткая норма. У тебя СПКЯ и щитовидка у нижней границы — они меняют реальный расход на ±200 ккал. Если устаёшь, мёрзнешь или сильнее лезут волосы — это сигнал, что мало, добавь еды. Сверь с врачом/диетологом.")
      )
    );
    const [goalKcal, setGoalKcal] = useLS("nKcal", 1750);
    const [goalWt, setGoalWt] = useLS("nGW", 51.5);
    const [curWt, setCurWt] = useLS("nCW", 55);
    const [editing, setEditing] = useState(false);
    const [tK, setTK] = useState(String(goalKcal));
    const [tG, setTG] = useState(String(goalWt));
    const [tC, setTC] = useState(String(curWt));
    const kcal = mode === "training" ? Number(goalKcal) : Math.max(1400, Number(goalKcal) - 150);
    const macP = Math.round(kcal * 0.27 / 4);
    const macF = Math.round(kcal * 0.3 / 9);
    const macC = Math.round(kcal * 0.43 / 4);
    const rem = Math.max(0, Number(curWt) - Number(goalWt)).toFixed(1);
    const prog = Math.min(100, Math.max(0, Math.round((55 - Number(curWt)) / Math.max(0.1, 55 - Number(goalWt)) * 100)));
    return /* @__PURE__ */ React.createElement("div", null, RefCard, /* @__PURE__ */ React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 12, padding: "10px 13px", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: C.oliveDeep, lineHeight: 1.55 } }, "\u{1F98A} \u0426\u0435\u043B\u044C \u2014 51,5 \u043A\u0433, \u044D\u0442\u043E \u043E\u043A. \u0412\u0430\u0436\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E, \u0447\u0442\u043E\u0431\u044B \u0434\u0435\u0444\u0438\u0446\u0438\u0442 \u0431\u044B\u043B \u043C\u044F\u0433\u043A\u0438\u043C: \u0440\u0435\u0437\u043A\u043E\u0435 \u0443\u0440\u0435\u0437\u0430\u043D\u0438\u0435 \u0435\u0434\u044B \u043C\u0435\u0448\u0430\u0435\u0442 \u0432\u043E\u043B\u043E\u0441\u0430\u043C \u0438 \u0436\u0435\u043B\u0435\u0437\u0443. \u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u0438 \u0441\u044B\u0442\u043E \u2014 \u043B\u0443\u0447\u0448\u0435, \u0447\u0435\u043C \u0431\u044B\u0441\u0442\u0440\u043E.")), /* @__PURE__ */ React.createElement("div", { style: { background: C.card, borderRadius: 12, padding: "12px 14px", marginBottom: 10, boxShadow: C.shadow, border: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, "\u041C\u043E\u0439 \u0432\u0435\u0441 \u0438 \u0446\u0435\u043B\u044C"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setEditing(!editing);
      setTK(String(goalKcal));
      setTG(String(goalWt));
      setTC(String(curWt));
    }, style: { background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", color: C.textM, fontSize: 10, fontFamily: "inherit" } }, editing ? "\u2715" : "\u270F \u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C")), editing ? /* @__PURE__ */ React.createElement("div", null, [{ l: "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0432\u0435\u0441 (\u043A\u0433)", v: tC, s: setTC }, { l: "\u0426\u0435\u043B\u0435\u0432\u043E\u0439 \u0432\u0435\u0441 (\u043A\u0433)", v: tG, s: setTG }, { l: "\u041A\u043A\u0430\u043B (\u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043E\u0447\u043D\u044B\u0439 \u0434\u0435\u043D\u044C)", v: tK, s: setTK }].map((it) => /* @__PURE__ */ React.createElement("div", { key: it.l, style: { marginBottom: 7 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.textM, marginBottom: 2 } }, it.l), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: it.v,
        onChange: (e) => it.s(e.target.value),
        step: "0.5",
        style: { width: "100%", padding: "7px 10px", borderRadius: 7, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 14, fontFamily: "inherit", color: C.text, boxSizing: "border-box", outline: "none" }
      }
    ))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setGoalKcal(Number(tK));
          setGoalWt(Number(tG));
          setCurWt(Number(tC));
          setEditing(false);
        },
        style: { width: "100%", padding: "9px", borderRadius: 8, background: C.olive, border: "none", color: C.white, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }
      },
      "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u2713"
    )) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 8 } }, [{ l: "\u0421\u0435\u0439\u0447\u0430\u0441", v: `${curWt} \u043A\u0433` }, { l: "\u0426\u0435\u043B\u044C", v: `${goalWt} \u043A\u0433` }, { l: "\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C", v: `${rem} \u043A\u0433` }].map((it) => /* @__PURE__ */ React.createElement("div", { key: it.l, style: { flex: 1, background: C.bgWarm, borderRadius: 7, padding: "7px 4px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: C.textL } }, it.l), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.text } }, it.v)))), /* @__PURE__ */ React.createElement("div", { style: { background: C.bgWarm, borderRadius: 4, height: 5, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${prog}%`, background: `linear-gradient(90deg, ${C.olive}, ${C.sand})`, borderRadius: 4, transition: "width .5s" } })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: C.textL, marginTop: 2, textAlign: "right" } }, prog, "% \u043A \u0446\u0435\u043B\u0438"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 10 } }, [{ k: "training", l: "\u0414\u0435\u043D\u044C \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438", e: "💪" }, { k: "rest", l: "\u0414\u0435\u043D\u044C \u043E\u0442\u0434\u044B\u0445\u0430", e: "🌙" }].map((it) => /* @__PURE__ */ React.createElement("button", { key: it.k, onClick: () => setMode(it.k), style: { flex: 1, padding: "9px 6px", borderRadius: 10, border: `1.5px solid ${mode === it.k ? C.olive : C.border}`, background: mode === it.k ? C.oliveSoft : C.card, cursor: "pointer", boxShadow: mode === it.k ? C.shadow : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17 } }, it.e), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: mode === it.k ? C.oliveDeep : C.textM, marginTop: 3 } }, it.l)))), /* @__PURE__ */ React.createElement("div", { style: { background: C.card, borderRadius: 10, padding: "10px 12px", boxShadow: C.shadow, border: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 } }, kcal, " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 500, color: C.textM } }, "\u043A\u043A\u0430\u043B/\u0434\u0435\u043D\u044C")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5 } }, [{ l: "\u0411\u0435\u043B\u043E\u043A", v: macP, bg: C.oliveSoft, tx: C.oliveDeep }, { l: "\u0416\u0438\u0440\u044B", v: macF, bg: C.sandSoft, tx: C.sandDeep }, { l: "\u0423\u0433\u043B\u0435\u0432\u043E\u0434\u044B", v: macC, bg: C.barkSoft, tx: C.bark }].map((it) => /* @__PURE__ */ React.createElement("div", { key: it.l, style: { flex: 1, background: it.bg, borderRadius: 8, padding: "8px 5px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17, fontWeight: 700, color: it.tx } }, it.v, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9 } }, "\u0433")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.textM } }, it.l)))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.textL, marginTop: 8 } }, mode === "training" ? "\u0423\u0433\u043B\u0435\u0432\u043E\u0434\u044B \u0432\u044B\u0448\u0435 \u2014 \u043D\u0443\u0436\u043D\u044B \u0434\u043B\u044F \u044D\u043D\u0435\u0440\u0433\u0438\u0438 \u0438 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043C\u044B\u0448\u0446." : "\u0423\u0433\u043B\u0435\u0432\u043E\u0434\u044B \u043D\u0438\u0436\u0435, \u0431\u0435\u043B\u043E\u043A \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u043C \u2014 \u043C\u044B\u0448\u0446\u044B \u0440\u0430\u0441\u0442\u0443\u0442 \u0432 \u0434\u043D\u0438 \u043E\u0442\u0434\u044B\u0445\u0430.")), /* @__PURE__ */ React.createElement(MealTimingBlock, null));
  }

  // ===========================================================================
  // RecipesTab — реальные рецепты из книги «Сергей & Маша», полноэкранный просмотр.
  // Данные курированы и дедуплицированы; добавлены рецепты под задачи Маши.
  // ===========================================================================
const RECIPES = [{"id": "b1", "ch": "breakfast", "name": "Жареные яйца с перцем и хлебом", "time": 7, "tags": ["до 20 мин"], "kbju": {"k": 160, "p": 10, "f": 10, "c": 8}, "ing": ["Яйца — 2 шт (120г)", "Болгарский перец — ½ шт (80г)", "Хлеб цельнозерновой — 2 куска (60г)", "Масло оливковое/сливочное — ½ ч.л. (3г)", "Соль, чёрный перец"], "steps": ["Перец нарезать кольцами или соломкой.", "Сковороду разогреть на среднем огне, добавить масло.", "Выложить перец, обжарить 2–3 мин до лёгкой мягкости.", "Сдвинуть перец, разбить яйца рядом.", "Жарить 2–3 мин — белок схватился, желток по желанию.", "Посолить, поперчить. Подавать с хлебом."], "masha": "1 яйцо + 1 кусок хлеба (~240 ккал, 14г белка). Или 2 яйца без хлеба (~260 ккал, 18г). В Фазу 1 удобнее без хлеба.", "tip": "Идеальная прожарка — края белка хрустят, желток жидкий. Капля воды + крышка на 30 сек — желток схватится сверху.", "why": ""}, {"id": "b2", "ch": "breakfast", "name": "Шакшука — яйца в томатном соусе", "time": 20, "tags": ["до 20 мин"], "kbju": {"k": 85, "p": 5, "f": 5, "c": 6}, "ing": ["Яйца — 4 шт (240г)", "Помидоры — 3 шт (450г) или консерв. 400г", "Болгарский перец — 1 шт (150г)", "Лук — 1 шт (100г)", "Чеснок — 2 зубчика", "Паприка — 1 ч.л.", "Тмин молотый — ½ ч.л.", "Оливковое масло — 1 ст.л.", "Соль, перец", "По желанию: Фета 40г, петрушка/кинза"], "steps": ["Лук нарезать кубиком, перец полосками, чеснок раздавить.", "Обжарить лук на масле 4–5 мин. Добавить перец, ещё 3 мин.", "Добавить чеснок, паприку, тмин — 1 мин, помешивая.", "Добавить помидоры. Тушить 8–10 мин до загустения. Посолить.", "Сделать 4 углубления, разбить в каждое яйцо.", "Накрыть крышкой, готовить 4–5 мин — белок схватился, желток жидкий.", "Посыпать Фетой и зеленью."], "masha": "Та же порция — 2 яйца + половина соуса. КБЖУ одинаковые.", "tip": "Тмин — обязательная специя. Консервированные помидоры дают более насыщенный вкус.", "why": ""}, {"id": "b3", "ch": "breakfast", "name": "Протеиновые блинчики без муки", "time": 15, "tags": ["белок", "до 20 мин"], "kbju": {"k": 135, "p": 11, "f": 6, "c": 9}, "ing": ["Яйца — 3 шт (180г)", "Творог 5% — 100г", "Банан спелый — ½ шт (60г)", "Корица — ½ ч.л.", "Масло сливочное — ½ ч.л."], "steps": ["Пробить яйца, творог, банан и корицу блендером до гладкого теста.", "Сковороду разогреть, смазать маслом.", "Налить порциями (~3 ст.л. = 1 блинчик).", "Жарить 2 мин до пузырей. Перевернуть, ещё 1,5 мин.", "Получается ~6 небольших блинчиков."], "masha": "4 блинчика (~310 ккал, 25г белка). Отличный вариант в тренировочный день.", "tip": "Банан должен быть спелым — даёт сладость и связывает тесто.", "why": ""}, {"id": "b4", "ch": "breakfast", "name": "Белковые вафли в вафельнице", "time": 15, "tags": ["белок", "холестерин", "до 20 мин", "стул"], "kbju": {"k": 145, "p": 10, "f": 5, "c": 14}, "ing": ["Яйца — 2 шт (120г)", "Творог 5% — 150г", "Овсяные хлопья — 3 ст.л. (30г)", "Банан — ½ шт (60г)", "Разрыхлитель — ½ ч.л.", "Ванилин — щепотка"], "steps": ["Пробить все ингредиенты блендером до однородности.", "Дать постоять 3 мин — хлопья набухнут.", "Вафельницу разогреть, слегка смазать маслом.", "Выпекать порциями 3–4 мин до золотистого цвета.", "Получается ~3 вафли."], "masha": "2 вафли (~345 ккал, 24г белка). Хорошо после тренировки. Клетчатка работает лучше при достаточном питье воды.", "tip": "Тесто густое — не растекается. Хрустят сразу из вафельницы.", "why": ""}, {"id": "b5", "ch": "breakfast", "name": "Яичные кексы с овощами (заготовка)", "time": 25, "tags": ["белок", "заготовка"], "kbju": {"k": 115, "p": 9, "f": 7, "c": 3}, "ing": ["Яйца — 6 шт (360г)", "Болгарский перец — ½ шт (75г)", "Шпинат свежий — горсть (30г)", "Помидоры черри — 6 шт", "Фета — 40г", "Соль, перец", "Форма для маффинов — 6 ячеек"], "steps": ["Разогреть духовку до 180°С.", "Взбить яйца с солью и перцем.", "Мелко нарезать перец и шпинат, выложить в формочки.", "В каждую — половинка черри и щепотка Феты.", "Залить яйцом на ¾ высоты.", "Духовка 180°С 18–20 мин (аэрогриль 170°С 14–16 мин)."], "masha": "3 кекса к завтраку — быстро и питательно. Хранятся 4 дня.", "tip": "Готовить 6–12 штук в воскресенье — разогревать 1 мин в микроволновке.", "why": ""}, {"id": "b6", "ch": "breakfast", "name": "Яйцо пашот", "time": 5, "tags": ["белок", "до 20 мин"], "kbju": {"k": 155, "p": 13, "f": 11, "c": 1}, "ing": ["Яйца свежие — 2 шт", "Уксус 9% — 1 ст.л.", "Вода — 1л", "Соль — щепотка"], "steps": ["Воду довести до лёгкого кипения (~90°С).", "Добавить уксус и щепотку соли.", "Каждое яйцо разбить в чашку.", "Ложкой сделать воронку, влить яйцо в центр.", "Варить 3 мин (жидкий желток) или 4 мин (полутвёрдый).", "Вынуть шумовкой, промокнуть."], "masha": "185 ккал, 16г белка — отличный лёгкий белковый завтрак.", "tip": "Уксус помогает белку свернуться. Если яйцо растекается — оно несвежее.", "why": ""}, {"id": "b7", "ch": "breakfast", "name": "Авокадо-тост с яйцом", "time": 10, "tags": ["до 20 мин"], "kbju": {"k": 175, "p": 7, "f": 10, "c": 14}, "ing": ["Хлеб цельнозерновой — 2 куска (60г)", "Авокадо — ½ шт (80г)", "Яйцо варёное/пашот — 1 шт", "Помидор — 1 шт", "Лимонный сок — 1 ч.л.", "Оливковое масло — 1 ч.л.", "Соль, перец, чили"], "steps": ["Хлеб поджарить.", "Авокадо размять с лимонным соком, солью, перцем.", "Намазать на тост, выложить помидор.", "Сверху яйцо. Сбрызнуть маслом, посыпать чили."], "masha": "1 тост (~265 ккал, 10г белка). Для Фазы 1 добавить ещё 1 яйцо.", "tip": "Лимонный сок не даёт авокадо темнеть — готовить перед едой.", "why": ""}, {"id": "b8", "ch": "breakfast", "name": "Тост с арахисовой пастой и фруктами", "time": 5, "tags": ["до 20 мин", "стул"], "kbju": {"k": 255, "p": 8, "f": 10, "c": 33}, "ing": ["Хлеб цельнозерновой — 2 куска", "Арахисовая паста 100% — 1,5 ст.л. (25г)", "Банан — ½ шт или груша", "Семена чиа — 1 ч.л.", "Корица — ½ ч.л.", "Мёд — ½ ч.л. (по желанию)"], "steps": ["Поджарить хлеб.", "Намазать арахисовую пасту.", "Выложить нарезанный банан/грушу.", "Посыпать корицей и чиа."], "masha": "В дни без тренировок уменьшить пасту до 1 ч.л. (~320 ккал). Клетчатка работает лучше при достаточном питье воды.", "tip": "Паста 100% — без сахара и масла. Корица улучшает усвоение углеводов.", "why": ""}, {"id": "b9", "ch": "breakfast", "name": "Творог со сметаной, ягодами и семенами", "time": 3, "tags": ["ЖКТ", "холестерин", "до 20 мин", "стул"], "kbju": {"k": 140, "p": 9, "f": 7, "c": 10}, "ing": ["Творог 5% — 150г", "Сметана 15% — 1 ст.л.", "Ягоды — горсть (80г)", "Семена чиа — 1 ч.л.", "Семена льна молотые — 1 ч.л.", "Овсяные отруби — 1 ст.л.", "Грецкие орехи — 15г", "Варенье/мёд — 1 ч.л. (по желанию)"], "steps": ["Творог смешать со сметаной.", "Сверху ягоды, чиа, лён, отруби.", "Посыпать дроблёными орехами.", "Добавить варенье по вкусу."], "masha": "Основной завтрак Маши. ~395 ккал, 26г белка — хорошо для Фазы 1. Клетчатка работает лучше при достаточном питье воды.", "tip": "Смешать заранее и убрать в холодильник — к утру нежнее.", "why": "Семена льна и отруби — растворимая клетчатка, мягко помогает ЖКТ."}, {"id": "b10", "ch": "breakfast", "name": "Домашняя гранола", "time": 30, "tags": ["флора", "заготовка", "холестерин", "стул"], "kbju": {"k": 440, "p": 11, "f": 22, "c": 50}, "ing": ["Овсяные хлопья — 200г", "Грецкие орехи — 30г", "Миндаль — 30г", "Кешью — 20г", "Тыквенные семечки — 2 ст.л.", "Кунжут — 1 ст.л.", "Семена льна — 1 ст.л.", "Оливковое масло — 2 ст.л.", "Мёд/варенье — 2 ст.л.", "Корица — 1 ч.л.", "Чернослив/вишня — 50г (после запекания)"], "steps": ["Орехи порубить крупно.", "Смешать хлопья, орехи, семена с маслом, мёдом, корицей.", "Выложить слоем ~1 см на противень.", "Запекать 160°С 20–25 мин, мешать каждые 10 мин.", "Полностью остудить (нельзя убирать горячей!).", "Добавить сухофрукты. Хранить до 2 недель."], "masha": "50г гранолы + 150г йогурта + ягоды = ~380 ккал, 16г белка. Клетчатка работает лучше при достаточном питье воды.", "tip": "Ключ к хрусту — полностью остудить.", "why": ""}, {"id": "b11", "ch": "breakfast", "name": "Рисовая каша с кокосовым молоком и манго", "time": 20, "tags": ["до 20 мин", "стул"], "kbju": {"k": 175, "p": 3, "f": 7, "c": 25}, "ing": ["Рис жасминовый — 80г", "Кокосовое молоко — 150мл", "Вода — 150мл", "Манго — ½ шт", "Корица — ½ ч.л.", "Семена чиа — 1 ч.л.", "Соль — щепотка"], "steps": ["Смешать кокосовое молоко и воду, довести до кипения.", "Добавить рис и соль. Варить 15–20 мин на малом огне, помешивая.", "Добавить корицу.", "Выложить в миску, сверху манго и чиа."], "masha": "~360 ккал. В тренировочный день добавить 2 варёных яйца (+14г белка). Клетчатка работает лучше при достаточном питье воды.", "tip": "Мешать часто — рис с кокосовым молоком пристаёт ко дну.", "why": ""}, {"id": "b12", "ch": "breakfast", "name": "Смузи-боул с гранолой", "time": 5, "tags": ["флора", "до 20 мин", "стул"], "kbju": {"k": 130, "p": 4, "f": 4, "c": 20}, "ing": ["Черника замороженная — 100г", "Вишня замороженная — 50г", "Банан замороженный — ½ шт", "Кефир/йогурт — 100мл", "Гранола — 30г", "Семена чиа — 1 ч.л."], "steps": ["Пробить замороженные ягоды и банан с кефиром.", "Консистенция густая, как мягкое мороженое.", "Переложить в миску.", "Сверху гранола и чиа. Есть сразу."], "masha": "~450 ккал, 14г белка. Углеводный завтрак — хорошо в день тренировки.", "tip": "Есть сразу — гранола размягчается через 5–7 мин.", "why": ""}, {"id": "b13", "ch": "breakfast", "name": "Банановые панкейки (3 ингредиента)", "time": 15, "tags": ["флора", "холестерин", "до 20 мин", "стул"], "kbju": {"k": 145, "p": 6, "f": 4, "c": 22}, "ing": ["Банан — 1 шт (120г), спелый", "Яйца — 2 шт", "Рисовая/овсяная мука — 3 ст.л. (45г)"], "steps": ["Банан измельчить в блендере с яйцами.", "Добавить муку, перемешать.", "Жарить небольшие панкейки по 2–3 мин с каждой стороны.", "Получается 6–8 шт."], "masha": "4 панкейка — 275 ккал, 11г белка. В тренировочный день добавить йогурт. Клетчатка работает лучше при достаточном питье воды.", "tip": "Банан очень спелый — даёт сладость и связывает тесто.", "why": ""}, {"id": "b14", "ch": "breakfast", "name": "Чиа пудинг", "time": 5, "tags": ["ЖКТ", "заготовка", "до 20 мин", "холестерин", "стул"], "kbju": {"k": 120, "p": 4, "f": 7, "c": 11}, "ing": ["Семена чиа — 5–6 ст.л. (60г)", "Кокосовое молоко — 200мл", "Вода — 200мл", "Гранола — 50г (для подачи)", "Ягоды — 80г", "Банан — ½ шт"], "steps": ["Смешать чиа с молоком и водой.", "Через 2 мин перемешать снова — семена не должны осесть.", "Повторить 1–2 раза. В холодильник на ночь.", "Утром добавить гранолу, ягоды, банан."], "masha": "420 ккал, 12г белка, клетчатка + омега-3. Работает при достаточном питье воды в течение дня — иначе клетчатка может, наоборот, крепить. Готовить вечером.", "tip": "Перемешивать несколько раз в первые 15 мин — иначе слипнутся.", "why": "Чиа — растворимая клетчатка + омега-3: мягкий стул и противовоспалительный эффект."}, {"id": "b15", "ch": "breakfast", "name": "Зелёный протеиновый смузи", "time": 5, "tags": ["флора", "до 20 мин", "стул"], "kbju": {"k": 55, "p": 3, "f": 1, "c": 8}, "ing": ["Шпинат свежий — горсть (80г)", "Банан замороженный — ½ шт", "Кефир/йогурт — 200мл", "Семена чиа — 1 ч.л.", "Имбирь тёртый — ½ ч.л.", "Лимонный сок — 1 ч.л.", "Мёд — ½ ч.л. (по желанию)"], "steps": ["Пробить шпинат с кефиром до однородности.", "Добавить банан, имбирь, чиа, лимон, мёд.", "Пробить ещё 30 сек.", "Пить сразу."], "masha": "~200 ккал, 10г белка. Быстрый завтрак перед тренировкой. Клетчатка работает лучше при достаточном питье воды.", "tip": "Шпинат пробивать первым — исчезнет во вкусе.", "why": ""}, {"id": "b16", "ch": "breakfast", "name": "Омлет со шпинатом и Фетой", "time": 7, "tags": ["белок", "до 20 мин"], "kbju": {"k": 155, "p": 12, "f": 11, "c": 2}, "ing": ["Яйца — 2 шт", "Шпинат свежий — горсть (60г)", "Фета — 30г", "Масло сливочное — ½ ч.л.", "Соль, перец", "По желанию: черри 4–5 шт"], "steps": ["Взбить яйца с солью и перцем.", "Шпинат обжарить на масле 1–2 мин.", "Вылить яйца. Не мешать — ждать пока края схватятся.", "Раскрошить Фету на половину.", "Сложить пополам, накрыть крышкой на 1 мин."], "masha": "Весь омлет — ~270 ккал, 18г белка. Сытный лёгкий ужин.", "tip": "Не мешать — это не scrambled. Складывать когда центр влажный.", "why": ""}, {"id": "b17", "ch": "breakfast", "name": "Запечённые помидоры с Фетой и яйцами", "time": 20, "tags": ["до 20 мин"], "kbju": {"k": 85, "p": 5, "f": 5, "c": 6}, "ing": ["Помидоры крупные — 4 шт", "Фета — 60г", "Яйца — 2 шт", "Оливковое масло — 1 ч.л.", "Орегано — щепотка", "Соль, перец", "Базилик (по желанию)"], "steps": ["Разогреть духовку до 200°С.", "Срезать верхушки помидоров, вынуть часть мякоти.", "Посолить внутри, добавить каплю масла.", "В каждый — Фета и орегано. В 2 крупных — по яйцу.", "Духовка 200°С 15–18 мин."], "masha": "390 ккал, 23г белка. Красивый завтрак или лёгкий ужин.", "tip": "Мякоть не выбрасывать — в соус или суп.", "why": ""}, {"id": "b19", "ch": "breakfast", "name": "Творожные сырники", "time": 20, "tags": ["белок", "до 20 мин"], "kbju": {"k": 175, "p": 13, "f": 5, "c": 18}, "ing": ["Творог 5% — 300г", "Яйца — 2 шт", "Мука/молотые хлопья — 3 ст.л.", "Сахар — 1 ст.л. (или без)", "Ваниль, соль — щепотка", "Мука для обваливания — 2 ст.л."], "steps": ["Смешать творог, яйца, муку, ваниль, соль.", "Если масса влажная — добавить ложку муки.", "Сформировать сырники, обвалять в муке.", "Аэрогриль 180°С 10–12 мин, или духовка 180°С 20–25 мин, или сковорода 3–4 мин/сторону на малом огне."], "masha": "3–4 сырника (~395 ккал, 29г белка). Хороший завтрак в тренировочный день.", "tip": "Влажный творог отжать через марлю. На малом огне — не подгорят.", "why": ""}, {"id": "b20", "ch": "breakfast", "name": "Омлет со шпинатом и Камамбером", "time": 8, "tags": ["белок", "до 20 мин"], "kbju": {"k": 190, "p": 12, "f": 15, "c": 2}, "ing": ["Яйца — 2 шт", "Шпинат свежий — горсть (60г)", "Камамбер — 30г", "Масло сливочное — ½ ч.л.", "Соль, перец"], "steps": ["Взбить яйца с солью.", "Шпинат обжарить на масле 1–2 мин.", "Вылить яйца, не мешать.", "Выложить камамбер на половину.", "Сложить, накрыть крышкой на 1 мин."], "masha": "Весь омлет — ~290 ккал, 20г белка. Насыщенный, но лёгкий ужин.", "tip": "Камамбер расплавится под крышкой.", "why": ""}, {"id": "b21", "ch": "breakfast", "name": "Тост с Моцареллой, помидором и авокадо", "time": 7, "tags": ["до 20 мин"], "kbju": {"k": 195, "p": 8, "f": 13, "c": 13}, "ing": ["Хлеб цельнозерновой — 2 куска", "Моцарелла — 50г", "Помидор — 1 шт", "Авокадо — ½ шт", "Оливковое масло — 1 ч.л.", "Лимонный сок, соль, базилик"], "steps": ["Хлеб поджарить.", "Авокадо размять с лимоном и солью.", "Намазать на тост, выложить помидор, сверху моцарелла.", "Сбрызнуть маслом, посыпать базиликом."], "masha": "1 тост — 285 ккал, 12г белка.", "tip": "Моцарелла комнатной температуры вкуснее.", "why": ""}, {"id": "b24", "ch": "breakfast", "name": "Овсяная каша с ягодами и семенами", "time": 10, "tags": ["ЖКТ", "холестерин", "до 20 мин", "стул"], "kbju": {"k": 140, "p": 5, "f": 4, "c": 21}, "ing": ["Овсяные хлопья — 80г", "Молоко/кокосовое — 200мл", "Ягоды замороженные — горсть (80г)", "Семена чиа — 1 ч.л.", "Семена льна молотые — 1 ч.л.", "Корица — ½ ч.л.", "Мёд — 1 ч.л. (по желанию)", "Соль — щепотка"], "steps": ["Хлопья залить молоком, добавить соль.", "Варить 5–7 мин, помешивая.", "Добавить корицу.", "Сверху ягоды, семена, мёд."], "masha": "~430 ккал, 16г белка. В Фазе 2 добавить горсть орехов. Клетчатка работает лучше при достаточном питье воды.", "tip": "Ягоды добавлять замороженными — дадут сок прямо в каше.", "why": "Овёс — бета-глюкан (растворимая клетчатка): сытость и мягкий стул."}, {"id": "b26", "ch": "breakfast", "name": "Зернёный творог Маши (с семенами и черносливом)", "time": 2, "tags": ["ЖКТ", "до 20 мин", "стул"], "kbju": {"k": 115, "p": 11, "f": 3, "c": 11}, "ing": ["Зернёный творог 5% — 150–170г", "Варенье — 1 ч.л.", "Семена чиа — 1 ч.л.", "Семена льна молотые — 1 ч.л.", "Чернослив — 3 шт"], "steps": ["Выложить творог в миску.", "Добавить варенье, сверху чиа и лён.", "Положить чернослив рядом."], "masha": "~215г = 250 ккал, 24г белка. Лёгкий ужин с клетчаткой — идеально для Фазы 1. Клетчатка работает лучше при достаточном питье воды.", "tip": "Чернослив ежедневно — для регулярности ЖКТ.", "why": "Чернослив (сорбитол) + молотый лён — доказанная мягкая помощь при запоре."}, {"id": "s1", "ch": "soup", "name": "Куриный суп классический", "time": 50, "tags": [], "kbju": {"k": 45, "p": 5, "f": 1, "c": 4}, "ing": ["Курица (грудка/бёдра) — 400–500г", "Картошка — 2 шт", "Морковь — 1 шт", "Лук — 1 шт", "Рис 3 ст.л. или вермишель 50г", "Чеснок — 2 зубчика", "Лавровый лист, перец горошком", "Соль", "Вода — 2л"], "steps": ["Курицу залить 2л холодной воды, довести до кипения, снять пену.", "Добавить целую луковицу, морковь, лавровый лист, перец. Варить 30 мин.", "Вынуть курицу и луковицу (лук выбросить).", "Добавить картошку кубиком и рис/вермишель.", "Варить 15 мин.", "Курицу разобрать, вернуть. Добавить чеснок. Посолить."], "masha": "300мл + 120г курицы — 235 ккал, 26г белка. Хороший лёгкий обед.", "tip": "Прозрачный бульон — от медленного кипения и снятия пены.", "why": ""}, {"id": "s2", "ch": "soup", "name": "Кокосовый крем-суп с курицей", "time": 35, "tags": [], "kbju": {"k": 90, "p": 8, "f": 5, "c": 4}, "ing": ["Куриная грудка — 400г", "Цветная капуста — 300г", "Кокосовое молоко — 200мл", "Вода — 500мл", "Лук — 1 шт", "Морковь — 1 шт", "Имбирь — 2 см", "Чеснок — 3 зубчика", "Оливковое масло — 1 ст.л.", "Куркума — ½ ч.л.", "Соль, перец"], "steps": ["Лук и морковь обжарить на масле 5 мин.", "Добавить имбирь и чеснок, 2 мин.", "Добавить курицу кубиками и капусту. Залить водой, варить 20 мин.", "Достать курицу.", "Влить кокосовое молоко, пробить блендером.", "Вернуть курицу, прогреть. Добавить куркуму, посолить."], "masha": "350мл + 80г курицы — 285 ккал, 28г белка. Сытный обед при небольшом калораже.", "tip": "Кокосовое молоко добавлять после блендера — не кипятить.", "why": ""}, {"id": "s3", "ch": "soup", "name": "Крем-суп из брокколи с Пармезаном", "time": 25, "tags": [], "kbju": {"k": 65, "p": 4, "f": 3, "c": 5}, "ing": ["Брокколи — 500г", "Лук — 1 шт", "Чеснок — 2 зубчика", "Бульон/вода — 600мл", "Пармезан — 30г", "Оливковое масло — 1 ст.л.", "Мускатный орех — щепотка", "Соль, перец"], "steps": ["Лук обжарить на масле 3 мин, добавить чеснок 1 мин.", "Добавить брокколи и бульон. Довести до кипения.", "Варить 12–15 мин до мягкости.", "Пробить блендером.", "Добавить пармезан, мускат, соль, перец."], "masha": "Та же порция — 320 ккал. Хороший обед.", "tip": "Мускатный орех обязателен — раскрывает вкус брокколи.", "why": ""}, {"id": "s4", "ch": "soup", "name": "Суп с фрикадельками", "time": 40, "tags": ["B12"], "kbju": {"k": 75, "p": 6, "f": 3, "c": 5}, "ing": ["Говяжий фарш — 300г", "Яйцо — 1 шт", "Лук — 1 шт", "Картошка — 2 шт", "Морковь — 1 шт", "Лавровый лист", "Зелень", "Соль, перец", "Вода — 1,5л"], "steps": ["½ луковицы смешать с фаршем, яйцом, солью, перцем.", "Скатать фрикадельки с грецкий орех.", "Остальной лук и морковь обжарить 5 мин.", "Залить водой, добавить картошку. Через 10 мин — фрикадельки.", "Не мешать 3 мин. Варить 15 мин. Добавить лавровый лист, зелень."], "masha": "Та же порция — 290 ккал, 22г белка. Сытный обед.", "tip": "Тёртый лук в фарш — фрикадельки держат форму.", "why": ""}, {"id": "s5", "ch": "soup", "name": "Тыквенный крем-суп", "time": 30, "tags": [], "kbju": {"k": 75, "p": 2, "f": 4, "c": 8}, "ing": ["Тыква — 600г", "Лук — 1 шт", "Чеснок — 3 зубчика", "Кокосовое молоко — 150мл", "Вода — 400мл", "Имбирь — 1 см", "Куркума — ½ ч.л.", "Мускатный орех — щепотка", "Оливковое масло — 1 ст.л.", "Соль, перец"], "steps": ["Лук и чеснок обжарить 3 мин.", "Добавить тыкву, имбирь, куркуму.", "Залить водой, варить 20 мин.", "Влить кокосовое молоко, пробить блендером.", "Посолить, добавить мускат."], "masha": "350мл — 265 ккал. Добавить 100г куриной грудки для полноценного обеда (+22г белка).", "tip": "Тыква Хокайдо не требует чистки.", "why": ""}, {"id": "s6", "ch": "soup", "name": "Красный чечевичный суп (Мерджимек)", "time": 30, "tags": ["железо", "ЖКТ", "холестерин", "СПКЯ"], "kbju": {"k": 80, "p": 5, "f": 2, "c": 12}, "ing": ["Красная чечевица — 200г", "Лук — 1 шт", "Морковь — 1 шт", "Чеснок — 3 зубчика", "Томатная паста — 1 ст.л.", "Куркума, тмин, паприка", "Оливковое масло — 1 ст.л.", "Вода/бульон — 1л", "Лимонный сок — 1 ст.л.", "Соль, перец"], "steps": ["Лук и морковь обжарить 5 мин.", "Добавить чеснок, специи, томатную пасту — 2 мин.", "Добавить чечевицу и воду. Варить 20 мин.", "Пробить блендером. Посолить. Лимонный сок при подаче."], "masha": "350мл — 310 ккал, 20г белка. Растительный белок + клетчатка = отлично для ЖКТ.", "tip": "Лимонный сок в конце обязателен. Чечевица варится без замачивания.", "why": "Чечевица — негемовое железо + клетчатка; витамин C из лимона улучшает усвоение железа."}, {"id": "f4", "ch": "fish", "name": "Тунец с хрустящей корочкой", "time": 10, "tags": ["белок", "B12", "до 20 мин"], "kbju": {"k": 145, "p": 24, "f": 5, "c": 0}, "ing": ["Стейк тунца — 160г", "Оливковое масло — 1 ч.л.", "Соль, перец", "Кунжут — 1 ст.л. (по желанию)"], "steps": ["Стейк обсушить — критично для корочки.", "Посолить, поперчить (или обвалять в кунжуте).", "Сковороду раскалить на максимуме.", "Выложить тунца, не трогать 2 мин.", "Перевернуть, ещё 1,5–2 мин.", "Дать отдохнуть 1 мин."], "masha": "1 стейк 250г = 360 ккал, 60г белка. Тунец — 1–2 раза в неделю (ртуть), особенно если возможна беременность.", "tip": "Внутри розовый центр — это правильно. Пересушенный тунец резиновый.", "why": ""}, {"id": "f5", "ch": "fish", "name": "Тунец запечённый в фольге с лимоном", "time": 20, "tags": ["белок", "B12", "до 20 мин"], "kbju": {"k": 135, "p": 23, "f": 4, "c": 0}, "ing": ["Стейк тунца — 160г", "Лимон — ½ шт", "Оливковое масло — 1 ч.л.", "Тимьян/розмарин — щепотка", "Соль, перец"], "steps": ["Стейк на фольгу, посолить, сбрызнуть маслом.", "Сверху лимон и тимьян.", "Завернуть конвертом плотно.", "Духовка 180°С 15 мин (аэрогриль 180°С 12 мин)."], "masha": "1 стейк 250г = 340 ккал, 58г белка. Тунец — 1–2 раза в неделю из-за ртути.", "tip": "Не передерживать — 15 мин достаточно.", "why": ""}, {"id": "f7", "ch": "fish", "name": "Лосось с кунжутной корочкой", "time": 15, "tags": ["белок", "до 20 мин", "B12", "омега", "холестерин"], "kbju": {"k": 220, "p": 24, "f": 13, "c": 2}, "ing": ["Филе лосося — 150–180г", "Кунжут — 2 ст.л.", "Горчица зернистая — 1 ч.л.", "Соль, перец"], "steps": ["Лосось обсушить, посолить верх.", "Смазать горчицей, обвалять в кунжуте.", "Жарить на сухой раскалённой сковороде кунжутом вниз 3 мин.", "Перевернуть, ещё 3–4 мин. Внутри чуть розовый."], "masha": "200г в Фазе 1 (~440 ккал, 48г белка).", "tip": "Горчица держит кунжут. Сковорода полностью сухая и горячая.", "why": "Жирная рыба — омега-3: противовоспалительно, поддержка настроения."}, {"id": "f8", "ch": "fish", "name": "Лосось запечённый в фольге с лимоном", "time": 20, "tags": ["белок", "до 20 мин", "B12", "омега", "холестерин"], "kbju": {"k": 195, "p": 22, "f": 11, "c": 0}, "ing": ["Филе лосося — 150–180г", "Лимон — ½ шт", "Оливковое масло — 1 ч.л.", "Тимьян/укроп — щепотка", "Соль, перец"], "steps": ["Порцию завернуть в фольгу.", "Посолить, сбрызнуть маслом и лимоном.", "Сверху лимон и зелень. Завернуть конвертом.", "Духовка 180°С 18 мин (аэрогриль 180°С 14–15 мин)."], "masha": "200г в Фазе 1 (~390 ккал, 44г белка).", "tip": "Открывать осторожно — горячий пар.", "why": "Омега-3 2 раза в неделю — доказанная польза для настроения и сердца."}, {"id": "f11", "ch": "fish", "name": "Паста с лососем и шпинатом", "time": 20, "tags": ["B12", "омега", "холестерин", "до 20 мин"], "kbju": {"k": 195, "p": 12, "f": 9, "c": 18}, "ing": ["Паста — 65–80г", "Лосось — 100–120г", "Шпинат — горсть (60г)", "Сливки 20% — 100мл", "Чеснок — 2 зубчика", "Оливковое масло — 1 ч.л.", "Цедра лимона", "Соль, белый перец, мускат"], "steps": ["Отварить пасту al dente, сохранить воду.", "Обжарить чеснок 30 сек, добавить лосось — 2 мин.", "Добавить шпинат, влить сливки.", "Цедра, соль, перец, мускат. Тушить 2 мин.", "Добавить пасту, при необходимости воду от варки."], "masha": "65г пасты + 100г лосося = 480 ккал, 35г белка. Хорошо в тренировочный день.", "tip": "Цедра (не сок!) — аромат без кислоты.", "why": ""}, {"id": "m1", "ch": "meat", "name": "Говяжий гуляш (готовить накануне)", "time": 80, "tags": ["железо", "B12"], "kbju": {"k": 155, "p": 17, "f": 8, "c": 5}, "ing": ["Говяжья вырезка — 500г", "Лук — 2 шт", "Морковь — 1 шт", "Чеснок — 3 зубчика", "Помидоры — 2 шт или паста 1 ст.л.", "Паприка — 1 ч.л.", "Лавровый лист", "Оливковое масло — 1,5 ст.л.", "Соль, перец", "Вода — ~400мл"], "steps": ["Мясо нарезать кубиками, обсушить.", "Обжарить партиями на максимуме, не мешать 2 мин. Убрать.", "Обжарить лук до золотистого (5–7 мин).", "Добавить морковь, чеснок, паприку — 3 мин.", "Вернуть мясо, добавить помидоры.", "Залить водой, тушить 1 час под крышкой.", "Лавровый лист, соль в конце."], "masha": "170г порция — 365 ккал, 39г белка. С гречкой 80г — обед Фазы 2.", "tip": "Вкуснее на следующий день. Партионная жарка обязательна.", "why": "Красное мясо — гемовое железо (усваивается лучше всего)."}, {"id": "m3", "ch": "meat", "name": "Стейк говяжий", "time": 15, "tags": ["белок", "железо", "B12", "до 20 мин"], "kbju": {"k": 270, "p": 28, "f": 17, "c": 0}, "ing": ["Стейк говяжий — 160–200г", "Оливковое масло — 1 ч.л.", "Соль крупная, перец"], "steps": ["Разморозить накануне. За 30 мин до жарки вынуть из холодильника.", "Обсушить, посолить, поперчить, смазать маслом.", "Сковороду раскалить на максимуме.", "Выложить стейк, не двигать 3–4 мин.", "Перевернуть, ещё 3–4 мин (medium 57–63°С).", "Дать отдохнуть 5 мин."], "masha": "160г = 430 ккал, 45г белка. Отличный вариант в день тренировки.", "tip": "Не двигать стейк — корочка только при постоянном контакте.", "why": ""}, {"id": "m4", "ch": "meat", "name": "Говяжьи котлеты в духовке", "time": 30, "tags": ["железо", "B12"], "kbju": {"k": 205, "p": 20, "f": 13, "c": 3}, "ing": ["Говяжий фарш — 400г", "Лук — 1 шт (натереть)", "Яйцо — 1 шт", "Чеснок — 2 зубчика", "Соль, перец, паприка", "Горчица — 1 ч.л."], "steps": ["Лук натереть на мелкой тёрке.", "Смешать фарш, лук, яйцо, чеснок, специи.", "Убрать в холодильник на 15 мин.", "Сформировать котлеты толщиной 2 см.", "Духовка 200°С 22–25 мин (аэрогриль 190°С 15–17 мин)."], "masha": "1,5 котлеты (~150г) — 310 ккал, 30г белка.", "tip": "Тёртый лук — секрет сочных котлет.", "why": ""}, {"id": "c1", "ch": "chicken", "name": "Печёночные оладьи из куриной печени", "time": 25, "tags": ["железо", "B12"], "kbju": {"k": 165, "p": 17, "f": 9, "c": 5}, "ing": ["Куриная печень — 400г", "Лук — 1 шт", "Яйца — 2 шт", "Кукурузная/гречневая мука — 2 ст.л.", "Соль, перец", "Масло для жарки — 2 ст.л."], "steps": ["Печень и лук пробить блендером.", "Добавить яйца, муку, соль, перец.", "Выкладывать ложкой на горячую сковороду (~8 см).", "Жарить 3–4 мин с каждой стороны."], "masha": "3 оладьи — 295 ккал, 31г белка. Важный источник железа.", "tip": "Печень — рекордсмен по железу, B12 и фолиевой кислоте.", "why": "Куриная печень 1–2 раза в неделю — самый эффективный пищевой источник железа и B12."}, {"id": "c2", "ch": "chicken", "name": "Пряная куриная грудка (мариновать накануне)", "time": 25, "tags": ["белок"], "kbju": {"k": 135, "p": 26, "f": 3, "c": 2}, "ing": ["Куриная грудка — 2 шт (~400г)", "Кефир 2,5% — 3 ст.л.", "Чеснок — 2 зубчика", "Паприка — 1 ч.л.", "Горчица зернистая — 1 ч.л.", "Оливковое масло — 1 ч.л.", "Соль, перец"], "steps": ["Грудку отбить до толщины ~2 см.", "Смешать кефир, чеснок, паприку, горчицу, масло, соль.", "Обмазать, убрать в холодильник на ночь.", "Достать за 20 мин до готовки.", "Духовка 180°С 20–22 мин (аэрогриль 180°С 18 мин).", "Дать отдохнуть 5 мин."], "masha": "150–170г = 230 ккал, 39г белка. Отличный белок при низком калораже.", "tip": "Кефир — секрет сочности: кислота расщепляет белок.", "why": ""}, {"id": "c3", "ch": "chicken", "name": "Куриная грудка по-азиатски с кунжутом", "time": 20, "tags": ["белок", "холестерин", "до 20 мин"], "kbju": {"k": 150, "p": 27, "f": 4, "c": 2}, "ing": ["Куриная грудка — 2 шт (~400г)", "Соевый соус — 2 ст.л.", "Имбирь тёртый — 1 ч.л.", "Чеснок — 2 зубчика", "Кунжут — 1 ст.л.", "Оливковое масло — 1 ч.л."], "steps": ["Грудку нарезать полосками 1,5 см.", "Смешать соус, имбирь, чеснок. Замариновать 15 мин.", "Обжарить в один слой 3–4 мин без перемешивания, затем 2–3 мин помешивая.", "Посыпать кунжутом."], "masha": "150–170г = 255 ккал, 41г белка.", "tip": "Соевый соус солёный — не досаливать. Резать поперёк волокон.", "why": ""}, {"id": "c8", "ch": "chicken", "name": "Куриная грудка в духовке — заготовка на неделю", "time": 45, "tags": ["белок", "заготовка"], "kbju": {"k": 130, "p": 26, "f": 3, "c": 0}, "ing": ["Куриная грудка — 4–6 шт (800г–1,2кг)", "Соль, перец", "Чеснок — 3 зубчика", "Оливковое масло — 1 ст.л.", "Паприка — ½ ч.л."], "steps": ["Грудки обсушить, натереть маслом, чесноком, специями.", "Выложить в форму, накрыть фольгой плотно.", "Духовка 150°С 45 мин.", "Не открывать 15 мин после выключения.", "Остудить, убрать в холодильник. Хранить до 4 дней."], "masha": "170г = 215 ккал, 39г белка. Самая удобная заготовка — обед за 5 мин.", "tip": "150°С + фольга = всегда сочная грудка.", "why": ""}, {"id": "c9", "ch": "chicken", "name": "Куриная печень с луком и яблоком", "time": 20, "tags": ["железо", "B12", "до 20 мин"], "kbju": {"k": 145, "p": 17, "f": 6, "c": 7}, "ing": ["Куриная печень — 400г", "Лук — 2 шт", "Яблоко кислое — 1 шт", "Масло сливочное — 1 ч.л.", "Оливковое масло — 1 ст.л.", "Соль, перец, тимьян"], "steps": ["Печень очистить от плёнок, нарезать.", "Лук обжарить на смеси масел 7–8 мин.", "Добавить яблоко, тимьян. Жарить 3 мин.", "Печень одним слоем 2–3 мин без перемешивания.", "Перевернуть, ещё 2 мин. Солить в конце.", "Центр чуть розовый."], "masha": "150г = 275 ккал, 32г белка + железо + B12. 1–2 раза в неделю.", "tip": "Соль только в конце — иначе печень жёсткая. Яблоко убирает горечь.", "why": "Печень сама по себе очень богата хорошо усваиваемым железом и B12. Лук — для вкуса (значимого витамина C в порции лука нет)."}, {"id": "c11", "ch": "chicken", "name": "Паштет из куриной печени", "time": 25, "tags": ["железо", "заготовка", "B12"], "kbju": {"k": 210, "p": 15, "f": 15, "c": 3}, "ing": ["Куриная печень — 400г", "Лук — 1 шт", "Чеснок — 3 зубчика", "Масло сливочное — 40г + 20г для верха", "Коньяк — 2 ст.л. (по желанию)", "Тимьян, соль, перец"], "steps": ["Лук и чеснок обжарить на 20г масла 5 мин.", "Добавить печень, жарить 4–5 мин.", "Влить коньяк, выпарить 1 мин.", "Пробить блендером с 20г масла до гладкости.", "Переложить в форму, залить растопленным маслом.", "В холодильник на 2 часа. Хранить до 5 дней."], "masha": "2 ст.л. = 63 ккал, 5г белка. Перекус на хлебе, богат железом и B12.", "tip": "Масляный слой сверху — паштет не темнеет.", "why": ""}, {"id": "sal2", "ch": "salad", "name": "Тёплый салат с нутом, шпинатом и Фетой", "time": 15, "tags": ["ЖКТ", "СПКЯ", "до 20 мин"], "kbju": {"k": 170, "p": 7, "f": 10, "c": 14}, "ing": ["Нут консервированный — 200г", "Шпинат свежий — горсть (80г)", "Фета — 50г", "Чеснок — 2 зубчика", "Оливковое масло — 2 ст.л.", "Лимонный сок — 1 ст.л.", "Куркума — ½ ч.л.", "Соль, перец"], "steps": ["Нут обсушить.", "Обжарить с чесноком и куркумой 3–4 мин.", "Добавить шпинат — увянет за 1 мин.", "Снять с огня, добавить лимон и масло.", "Раскрошить Фету. Подавать тёплым."], "masha": "200г = 340 ккал, 14г белка. Сытный ужин или обед.", "tip": "Горячий нут с холодной Фетой — контраст делает салат особенным.", "why": "Нут — клетчатка + растительный белок, мягко для ЖКТ."}, {"id": "sal3", "ch": "salad", "name": "Греческий салат с курицей", "time": 15, "tags": ["белок", "до 20 мин"], "kbju": {"k": 115, "p": 11, "f": 7, "c": 4}, "ing": ["Куриная грудка — 150г", "Огурец — 1 шт", "Помидоры — 2 шт", "Фета — 50г", "Маслины — горсть", "Лук красный — ½ шт", "Оливковое масло — 1,5 ст.л.", "Орегано", "Соль, перец"], "steps": ["Огурец, помидоры, лук нарезать крупно.", "Курицу нарезать полосками.", "Смешать, добавить Фету и маслины.", "Заправить: масло + орегано + соль."], "masha": "300г = 345 ккал, 33г белка. Полноценный обед без гарнира.", "tip": "Нарезать крупно. Заправлять перед подачей.", "why": ""}, {"id": "sal7", "ch": "salad", "name": "Салат Нисуаз с тунцом", "time": 15, "tags": ["СПКЯ", "белок", "до 20 мин", "B12", "холестерин", "стул"], "kbju": {"k": 120, "p": 12, "f": 7, "c": 4}, "ing": ["Тунец консерв. — 160г или свежий", "Яйца варёные — 2 шт", "Зелёная фасоль — 80г", "Помидоры черри — 8 шт", "Огурец — 1 шт", "Маслины — горсть", "Листья салата", "Заправка: масло 2 ст.л. + лимон 1 ст.л. + горчица ½ ч.л."], "steps": ["Фасоль бланшировать 3 мин, в холодную воду.", "Яйца на четвертинки, тунец слить.", "Выложить на салат. Заправить перед подачей."], "masha": "Весь салат — 440 ккал, 44г белка. Отличный обед. Клетчатка работает лучше при достаточном питье воды.", "tip": "Нисуаз не перемешивают — выкладывают по зонам.", "why": ""}, {"id": "v3", "ch": "veg", "name": "Тушёный шпинат с чесноком", "time": 5, "tags": ["до 20 мин"], "kbju": {"k": 40, "p": 3, "f": 2, "c": 3}, "ing": ["Шпинат свежий — 100–150г", "Чеснок — 2 зубчика", "Оливковое масло — 1 ч.л.", "Соль, мускатный орех — щепотка"], "steps": ["Разогреть масло.", "Добавить чеснок, 30 сек.", "Добавить шпинат, жарить 1–2 мин.", "Посолить, добавить мускат."], "masha": "80г готового — 50 ккал. Почти без калорий — добавлять к любому блюду.", "tip": "Шпинат уменьшается в 5–6 раз.", "why": ""}, {"id": "v1", "ch": "veg", "name": "Брокколи паровая", "time": 8, "tags": ["до 20 мин"], "kbju": {"k": 45, "p": 3, "f": 1, "c": 5}, "ing": ["Брокколи — 150–200г", "Соль — щепотка", "Оливковое масло — 1 ч.л.", "Лимонный сок — несколько капель"], "steps": ["Разобрать на соцветия.", "В кастрюлю 3 см воды, довести до кипения.", "Брокколи в пароварку/дуршлаг над водой.", "Накрыть, готовить 5–6 мин — ярко-зелёная, чуть хрустит.", "Сбрызнуть маслом и лимоном."], "masha": "150г = 75 ккал, 5г белка. Почти бесплатный гарнир.", "tip": "Переложить в холодную воду после варки — останется яркой.", "why": ""}, {"id": "d1", "ch": "baking", "name": "Овсяное печенье без муки и сахара", "time": 20, "tags": ["холестерин", "до 20 мин", "стул"], "kbju": {"k": 345, "p": 8, "f": 10, "c": 55}, "ing": ["Овсяные хлопья — 150г", "Банан спелый — 2 шт", "Арахисовая паста — 2 ст.л.", "Корица — 1 ч.л.", "Ваниль — щепотка", "По желанию: шоколад/вишня — 30г"], "steps": ["Бананы размять в пюре.", "Смешать с пастой, хлопьями, корицей, ванилью.", "Дать постоять 5 мин.", "Выложить ложкой на бумагу (12–14 шт).", "Духовка 170°С 12–15 мин.", "Остудить 5 мин."], "masha": "2 печенья = 275 ккал. Перекус или сладкое после тренировки. Клетчатка работает лучше при достаточном питье воды.", "tip": "Спелые бананы с пятнами — для сладости.", "why": ""}, {"id": "d4", "ch": "baking", "name": "Шоколадный мусс из авокадо", "time": 10, "tags": ["до 20 мин"], "kbju": {"k": 185, "p": 2, "f": 15, "c": 12}, "ing": ["Авокадо спелый — 2 шт", "Какао-порошок — 3 ст.л.", "Кокосовое молоко — 3 ст.л.", "Мёд — 1 ст.л.", "Ваниль — ½ ч.л.", "Соль — щепотка"], "steps": ["Авокадо должен быть спелым.", "Пробить всё блендером до гладкости.", "Попробовать, добавить мёд/какао по вкусу.", "В холодильник на 30 мин.", "Подавать с ягодами."], "masha": "½ порции = 240 ккал. Полезные жиры, умеренные углеводы.", "tip": "Никто не угадывает авокадо — мусс как настоящий шоколадный.", "why": ""}, {"id": "d6", "ch": "baking", "name": "Запечённое яблоко с корицей и мёдом", "time": 15, "tags": ["ЖКТ", "холестерин", "до 20 мин", "стул"], "kbju": {"k": 85, "p": 1, "f": 2, "c": 16}, "ing": ["Яблоко — 1 шт (кисло-сладкое)", "Мёд — 1 ч.л.", "Корица — ½ ч.л.", "Масло сливочное — ½ ч.л.", "Грецкие орехи — 1 ч.л. (по желанию)"], "steps": ["Вырезать сердцевину снизу вверх, оставить донышко.", "Внутрь — масло, мёд, корицу, орехи.", "Аэрогриль 180°С 12–15 мин (духовка 180°С 20–25 мин).", "Готово когда кожица морщится, мякоть мягкая."], "masha": "1 яблоко — 170 ккал. Лёгкий десерт вместо конфет. Клетчатка работает лучше при достаточном питье воды.", "tip": "Донышко оставлять целым — иначе начинка вытечет.", "why": "Печёное яблоко — мягкая клетчатка (пектин); эффект при запоре умеренный. Сильнее работают киви, чернослив, псиллиум, овёс."}, {"id": "sn1", "ch": "sauce", "name": "Гуакамоле домашний", "time": 10, "tags": ["до 20 мин"], "kbju": {"k": 160, "p": 2, "f": 15, "c": 6}, "ing": ["Авокадо — 2 шт", "Лимонный/лаймовый сок — 1 ст.л.", "Чеснок — 1 зубчик", "Помидор — 1 шт", "Соль, перец", "Кинза (по желанию)"], "steps": ["Авокадо размять вилкой, оставить кусочки.", "Добавить лимон, чеснок, помидор, соль.", "Перемешать, попробовать."], "masha": "3 ст.л. = 80 ккал. Добавка к тостам или рыбе.", "tip": "Лимон — вкус и защита от потемнения.", "why": ""}, {"id": "sn2", "ch": "sauce", "name": "Домашний хумус", "time": 15, "tags": ["ЖКТ", "СПКЯ", "до 20 мин"], "kbju": {"k": 200, "p": 8, "f": 11, "c": 17}, "ing": ["Нут консервированный — 400г (сохранить жидкость)", "Тахини — 2 ст.л.", "Лимон — сок (~40мл)", "Чеснок — 1–2 зубчика", "Оливковое масло — 2 ст.л.", "Соль", "Паприка, тмин"], "steps": ["Пробить нут с тахини, лимоном, чесноком, маслом.", "Добавлять аква-фабу по 1 ст.л. до нужной консистенции.", "Посолить, пробить ещё 2 мин.", "Подавать с маслом, паприкой, тмином."], "masha": "4 ст.л. = 160 ккал, 6г белка. Снек или намазка.", "tip": "Аква-фаба (жидкость от нута) — секрет кремовой текстуры.", "why": ""}, {"id": "sn5", "ch": "sauce", "name": "Энергетические шарики без выпечки", "time": 15, "tags": ["заготовка", "холестерин", "стул"], "kbju": {"k": 395, "p": 10, "f": 16, "c": 52}, "ing": ["Овсяные хлопья — 100г", "Арахисовая паста — 3 ст.л.", "Мёд — 2 ст.л.", "Семена чиа — 1 ст.л.", "Кунжут — 1 ст.л.", "Корица — ½ ч.л.", "Шоколад/вишня — 30г"], "steps": ["Смешать всё в миске.", "Если сухо — добавить мёд, если липко — хлопьев.", "Скатать шарики ~20г.", "Обвалять в кунжуте.", "В холодильник на 30 мин."], "masha": "2 шарика = 160 ккал. Перекус между приёмами. Клетчатка работает лучше при достаточном питье воды.", "tip": "Хранить в холодильнике до 2 недель.", "why": ""}, {"id": "dr1", "ch": "drink", "name": "Золотое молоко (куркума латте)", "time": 7, "tags": ["до 20 мин"], "kbju": {"k": 45, "p": 2, "f": 2, "c": 5}, "ing": ["Молоко/растительное — 250мл", "Куркума — ½ ч.л.", "Корица — ¼ ч.л.", "Имбирь — ¼ ч.л.", "Чёрный перец — щепотка", "Мёд — ½ ч.л. (по желанию)", "Кокосовое масло — ½ ч.л. (по желанию)"], "steps": ["Налить молоко в кастрюльку.", "Добавить специи. Нагреть, не доводя до кипения.", "Когда появится пар (~70°С) — снять.", "Добавить мёд."], "masha": "250мл — 115 ккал. Противовоспалительный напиток вечером.", "tip": "Чёрный перец увеличивает усвоение куркумина. Не кипятить.", "why": ""}, {"id": "dr3", "ch": "drink", "name": "Чай с имбирём, лимоном и мёдом", "time": 8, "tags": ["ЖКТ", "до 20 мин"], "kbju": {"k": 10, "p": 0, "f": 0, "c": 2}, "ing": ["Имбирь свежий — 3 см", "Лимон — ½ шт", "Мёд — 1 ч.л.", "Вода — 300мл", "Перец горошком — 2–3 (по желанию)"], "steps": ["Имбирь нарезать кружочками.", "Залить водой, варить 5 мин.", "Снять, добавить лимонный сок.", "Настоять 2–3 мин. Добавить мёд в тёплый (не горячий)."], "masha": "Почти без калорий. Приятный напиток, может уменьшать тошноту и дискомфорт; при запоре доказательств мало.", "tip": "Мёд в тёплый напиток — выше 60°С теряются ферменты.", "why": ""}, {"id": "dr8", "ch": "drink", "name": "Ягодный кефир с семенами (пробиотик)", "time": 3, "tags": ["флора", "ЖКТ", "до 20 мин", "стул"], "kbju": {"k": 60, "p": 3, "f": 2, "c": 8}, "ing": ["Кефир с пробиотиком — 250мл", "Черника/вишня замороженная — 80г", "Семена чиа — 1 ч.л.", "Семена льна молотые — 1 ч.л.", "Мёд — ½ ч.л. (по желанию)"], "steps": ["Пробить кефир с ягодами.", "Добавить чиа и лён, перемешать.", "Дать постоять 10 мин — семена набухнут."], "masha": "~340мл — 205 ккал, 10г белка. Лучший напиток для ЖКТ — утром или вечером. Клетчатка работает лучше при достаточном питье воды.", "tip": "Пробиотики + пребиотики (клетчатка семян) в одном стакане.", "why": "Кефир может содержать живые культуры (зависит от производителя и хранения) + клетчатка семян (пребиотик) — поддержка микрофлоры."}, {"id": "dr10", "ch": "drink", "name": "Ромашковый чай с лавандой и мёдом", "time": 7, "tags": ["сон", "до 20 мин"], "kbju": {"k": 5, "p": 0, "f": 0, "c": 1}, "ing": ["Ромашка сушёная — 2 ч.л. или 1 пакетик", "Лаванда пищевая — ½ ч.л.", "Кипяток — 300мл", "Мёд — 1 ч.л.", "Лимон — 2–3 кружочка"], "steps": ["Ромашку и лаванду в заварник.", "Залить кипятком 90°С.", "Настоять 5 мин под крышкой.", "Процедить. Добавить мёд и лимон."], "masha": "Почти без калорий. Успокаивает, помогает при вздутии — вечером.", "tip": "Лаванду брать только пищевую. Расслабляющий напиток перед сном.", "why": "Ромашка — мягкий расслабляющий эффект; хороший вечерний ритуал при тревоге."}, {"id": "ferm4", "ch": "ferment", "name": "Домашняя квашеная капуста", "time": 20, "tags": ["флора", "ЖКТ", "заготовка"], "kbju": {"k": 19, "p": 1, "f": 0, "c": 4}, "ing": ["Капуста белокочанная — 1кг", "Морковь — 1 шт", "Соль НЕ йодированная — 20г", "Тмин — 1 ч.л. (по желанию)", "Банка 1–2л"], "steps": ["Капусту нашинковать, морковь натереть.", "Смешать с солью, мять 5–7 мин до сока.", "Утрамбовать в банку, покрыть соком.", "Гнёт сверху. 3–5 дней при комнатной температуре.", "Каждый день прокалывать до дна.", "Убрать в холодильник."], "masha": "80г ежедневно для ЖКТ. Источник живых ферментированных бактерий (состав непостоянен).", "tip": "Только не йодированная соль — йод убивает бактерии.", "why": "Живые лактобактерии — могут поддерживать микрофлору. Эффект зависит от закваски; выбирай непастеризованную, не грей сильно."}, {"id": "add1", "ch": "breakfast", "name": "Киви + йогурт на ночь (анти-запор)", "time": 3, "tags": ["флора", "ЖКТ", "до 20 мин", "стул"], "kbju": {"k": 75, "p": 4, "f": 2, "c": 12}, "ing": ["Киви спелые — 2 шт", "Греческий йогурт — 150г", "Семена чиа — 1 ч.л.", "Грецкие орехи — 10г (по желанию)"], "steps": ["Киви очистить, нарезать.", "Выложить на йогурт.", "Посыпать чиа и орехами.", "Съесть вечером или на завтрак."], "masha": "~190 ккал, 12г белка. Мягкая помощь при запоре. Клетчатка работает лучше при достаточном питье воды.", "tip": "Спелые киви мягче и слаще.", "why": "Киви — один из самых доказанных продуктов для регулярности стула (несколько РКИ): 2 киви в день. Сильнее, чем печёное яблоко."}, {"id": "add2", "ch": "salad", "name": "Салат со скумбрией, яйцом и свёклой", "time": 12, "tags": ["холестерин", "до 20 мин", "железо", "омега", "B12"], "kbju": {"k": 150, "p": 14, "f": 9, "c": 6}, "ing": ["Скумбрия запечёная/консерв. — 100г", "Яйца варёные — 2 шт", "Свёкла запечёная — 100г", "Руккола/шпинат — 60г", "Оливковое масло — 1 ч.л.", "Лимонный сок, соль, перец"], "steps": ["Свёклу и яйца нарезать.", "Скумбрию разобрать на кусочки.", "Выложить на рукколу.", "Заправить маслом и лимоном."], "masha": "~330 ккал, 28г белка. Обед: железо + омега-3 в одной тарелке.", "tip": "Скумбрия — недорогая жирная рыба.", "why": "Рыба даёт немного хорошо усваиваемого железа и омега-3; яйца ценны белком и B12. Зелень и лимон дают витамин C и фолат."}, {"id": "add3", "ch": "drink", "name": "Тёплый какао на молоке с магнием", "time": 6, "tags": ["сон", "до 20 мин"], "kbju": {"k": 90, "p": 5, "f": 3, "c": 12}, "ing": ["Молоко/растительное — 250мл", "Какао натуральное — 2 ч.л.", "Мёд — 1 ч.л.", "Корица — щепотка", "Соль — крошечная щепотка"], "steps": ["Какао размешать с 2 ст.л. холодного молока.", "Остальное молоко нагреть до ~70°С.", "Добавить какао-пасту, мёд, корицу, соль.", "Взбить венчиком 1 мин."], "masha": "250мл — 140 ккал, 8г белка. Вечерний напиток вместо десерта.", "tip": "Сначала какао с холодным молоком — иначе комочки.", "why": "Какао и молоко содержат магний и триптофан — мягкий вечерний ритуал при тревоге и для сна."}, {"id": "add4", "ch": "breakfast", "name": "Овсянка с черносливом и льном (для ЖКТ)", "time": 10, "tags": ["ЖКТ", "холестерин", "до 20 мин", "стул"], "kbju": {"k": 150, "p": 6, "f": 5, "c": 22}, "ing": ["Овсяные хлопья — 50г", "Молоко/вода — 200мл", "Чернослив — 4 шт", "Семена льна молотые — 1 ст.л.", "Грецкие орехи — 10г", "Корица — ½ ч.л."], "steps": ["Хлопья залить молоком, варить 5–7 мин.", "Чернослив нарезать, добавить в кашу.", "Сверху молотый лён, орехи, корица."], "masha": "~330 ккал, 11г белка. Утренний старт для регулярного ЖКТ. Клетчатка работает лучше при достаточном питье воды.", "tip": "Молотый лён усваивается лучше целого.", "why": "Овёс (бета-глюкан) + чернослив (сорбитол) + молотый лён — три доказанных мягких помощника при запоре сразу."}, {"id": "iron-b1", "ch": "breakfast", "name": "Тёплый салат-завтрак: яйца, авокадо, перец", "time": 12, "tags": ["белок", "до 20 мин", "после железа"], "kbju": {"k": 175, "p": 9, "f": 13, "c": 6}, "ing": ["Яйца — 2 шт", "Авокадо — ½ шт", "Болгарский перец красный — ½ шт", "Шпинат свежий — горсть", "Оливковое масло — 1 ч.л.", "Лимонный сок — несколько капель", "Соль, перец"], "steps": ["Перец нарезать соломкой, обжарить на масле 2–3 мин.", "Добавить шпинат, прогреть 1 мин.", "Яйца отварить всмятку или пашот.", "Выложить овощи, сверху авокадо и яйца.", "Сбрызнуть лимоном, посолить."], "masha": "~290 ккал, 16г белка. Идеален в день железа: без молочного, без кофе/чая. Перец и лимон — витамин C бонусом (хотя ты и так рассасываешь вит C).", "tip": "В дни железа НЕ запивай кофе/чаем — подожди 2 часа после таблетки. Вода или вода с лимоном — отлично.", "why": "Не содержит основных ингибиторов усвоения железа (кальций, кофе, чай) — это важнее всего на практике. Перец/лимон дают витамин C."}, {"id": "iron-b2", "ch": "breakfast", "name": "Овсянка на воде с ягодами и орехами (день железа)", "time": 10, "tags": ["холестерин", "ЖКТ", "до 20 мин", "после железа", "железо", "B12", "стул"], "kbju": {"k": 160, "p": 5, "f": 6, "c": 23}, "ing": ["Овсяные хлопья — 60г", "Вода — 200мл (НЕ молоко)", "Ягоды (клубника/смородина) — горсть", "Грецкие орехи — 10г", "Семена чиа — 1 ч.л.", "Мёд — 1 ч.л. (по желанию)"], "steps": ["Хлопья залить водой (не молоком — в день железа).", "Варить 5–7 мин.", "Сверху ягоды, орехи, чиа.", "Мёд по желанию."], "masha": "~310 ккал. Важно: на ВОДЕ, а не на молоке — молочное мешает железу. Ягоды дают витамин C.", "tip": "Молоко/йогурт оставь на вторую половину дня — через 2 часа после железа.", "why": "Овёс на воде — без кальция. Но овёс и орехи содержат фитаты, которые тоже немного снижают усвоение железа: это допустимый завтрак после железа, но не лучший. Сильнее всего усвоению помогают мясо/печень или фрукты с витамином C."}, {"id": "fat-l1", "ch": "salad", "name": "Обед с жирами: курица, авокадо, оливковое масло", "time": 15, "tags": ["белок", "жиры", "до 20 мин", "холестерин"], "kbju": {"k": 155, "p": 16, "f": 9, "c": 3}, "ing": ["Куриная грудка — 150г", "Авокадо — ½ шт", "Микс салата — горсть", "Помидоры черри — 6 шт", "Оливковое масло — 1 ст.л.", "Семечки/орехи — 10г", "Лимон, соль, перец"], "steps": ["Курицу обжарить/запечь, нарезать.", "Выложить на салат с черри.", "Добавить авокадо и орехи.", "Заправить оливковым маслом и лимоном."], "masha": "~350 ккал, 33г белка. Хороший обед под Перфектил и Омегу — жиры (масло, авокадо, орехи) помогают усвоению.", "tip": "Перфектил и Омегу прими ВМЕСТЕ после этого обеда — жиры обеспечат усвоение.", "why": "Перфектил (вит А/Е) и Омега жирорастворимы. В этом блюде уже достаточно жира (масло, авокадо, орехи) для их усвоения — отдельно много жира добавлять не нужно."}, {"id": "fat-l2", "ch": "fish", "name": "Обед с жирами: лосось с оливковым маслом и киноа", "time": 20, "tags": ["СПКЯ", "белок", "жиры", "до 20 мин", "B12", "омега", "холестерин"], "kbju": {"k": 190, "p": 18, "f": 11, "c": 7}, "ing": ["Филе лосося — 150г", "Киноа отварная — 100г", "Оливковое масло — 1 ст.л.", "Зелень, лимон", "Овощи на гарнир — по вкусу", "Соль, перец"], "steps": ["Лосось запечь/обжарить 12 мин.", "Киноа отварить.", "Выложить вместе, сбрызнуть маслом и лимоном.", "Посыпать зеленью."], "masha": "~420 ккал, 32г белка. Лосось сам по себе омега-3, плюс оливковое масло — отличная база под дневные витамины.", "tip": "Если в этот день уже пьёшь Омегу-капсулы — лосось это бонус, не замена; всё ок.", "why": "Жирная рыба + немного масла. Для усвоения жирорастворимых витаминов достаточно умеренного жира в блюде (5–15 г) — специально жирный приём не нужен."}, {"id": "fat-d1", "ch": "breakfast", "name": "Ужин с жирами: омлет с сыром, авокадо и оливковым маслом", "time": 10, "tags": ["белок", "жиры", "до 20 мин"], "kbju": {"k": 185, "p": 13, "f": 14, "c": 2}, "ing": ["Яйца — 2 шт", "Сыр (чеддер/фета) — 30г", "Авокадо — ½ шт", "Шпинат — горсть", "Оливковое/сливочное масло — 1 ч.л.", "Соль, перец"], "steps": ["Шпинат обжарить на масле 1 мин.", "Влить взбитые яйца.", "Когда схватится — сыр на половину.", "Сложить, подавать с авокадо."], "masha": "~360 ккал, 22г белка. Хороший ужин под A+E: яйца, сыр, авокадо, масло — все жиры, которые нужны витаминам А и Е.", "tip": "A+E прими с этим ужином или сразу после — без жиров эти витамины почти не усваиваются.", "why": "A+E жирорастворимы. В блюде уже достаточно жира (яйца, сыр, авокадо, масло) для усвоения — большого количества жира не требуется."}, {"id": "fat-d2", "ch": "fish", "name": "Ужин с жирами: скумбрия с овощами и оливковым маслом", "time": 20, "tags": ["белок", "жиры", "B12", "омега", "холестерин"], "kbju": {"k": 170, "p": 15, "f": 11, "c": 4}, "ing": ["Скумбрия — 120г", "Овощи (кабачок, перец, лук) — 200г", "Оливковое масло — 1 ст.л.", "Чеснок, зелень", "Лимон, соль, перец"], "steps": ["Овощи нарезать, сбрызнуть маслом.", "Запечь 15 мин при 200°С.", "Скумбрию добавить на 8 мин.", "Сбрызнуть лимоном, посыпать зеленью."], "masha": "~330 ккал, 26г белка. Скумбрия — жирная рыба (омега + жир для A+E). Плюс оливковое масло.", "tip": "Жирная рыба на ужин — отличная база, чтобы A+E усвоились.", "why": "Скумбрия и немного масла. Для усвоения A+E достаточно умеренного жира в блюде (5–15 г) — много жира не требуется."}, {"id": "iron-b3", "ch": "breakfast", "name": "Скрэмбл с креветками и шпинатом", "time": 12, "tags": ["белок", "до 20 мин", "после железа"], "kbju": {"k": 135, "p": 15, "f": 7, "c": 2}, "ing": ["Яйца — 2 шт", "Креветки очищенные — 80г", "Шпинат — горсть", "Помидор — 1 шт", "Оливковое масло — 1 ч.л.", "Соль, перец, чеснок"], "steps": ["Креветки обжарить на масле с чесноком 2 мин.", "Добавить шпинат и помидор, 1 мин.", "Влить взбитые яйца, мешать до готовности.", "Посолить."], "masha": "~300 ккал, 26г белка. День железа: без молочного. Хороший белковый вариант, не мешает усвоению железа.", "tip": "Не пересушивай яйца — снимай чуть влажными.", "why": "Креветки и яйца — лёгкий белок без молочного; не мешает усвоению утреннего железа. Креветки по железу скромны — основной вклад дают мясо/печень/препарат."}, {"id": "iron-b4", "ch": "breakfast", "name": "Гречневая каша с яйцом и зеленью", "time": 15, "tags": ["белок", "ЖКТ", "после железа"], "kbju": {"k": 130, "p": 7, "f": 4, "c": 18}, "ing": ["Гречка — 60г", "Яйцо — 1–2 шт", "Зелень (укроп, петрушка)", "Оливковое масло — 1 ч.л.", "Соль", "Помидор/перец — по желанию"], "steps": ["Гречку отварить (1:2 воды, 15 мин).", "Яйцо отварить или сделать пашот.", "Смешать гречку с маслом и зеленью.", "Сверху яйцо, овощи."], "masha": "~330 ккал, 16г белка. Гречка без молочного — не мешает железу. Содержит немного железа, но основной вклад дают мясо, печень и препарат.", "tip": "Гречку можно запарить с вечера — утром только разогреть.", "why": "Гречка — немного негемового железа и клетчатка; ценность скорее в том, что без кальция/кофеина не мешает усвоению утреннего железа."}, {"id": "fat-l3", "ch": "meat", "name": "Тёплый боул: говядина, авокадо, киноа, кунжут", "time": 20, "tags": ["холестерин", "белок", "жиры", "железо", "B12"], "kbju": {"k": 180, "p": 16, "f": 10, "c": 8}, "ing": ["Говядина (стейк/полоски) — 150г", "Киноа отварная — 100г", "Авокадо — ½ шт", "Морковь, огурец — по вкусу", "Оливковое масло — 1 ст.л.", "Кунжут, соевый соус, лимон"], "steps": ["Говядину обжарить полосками 3–4 мин.", "Киноа отварить.", "Собрать боул: киноа, говядина, авокадо, овощи.", "Заправить маслом, соусом, кунжутом."], "masha": "~430 ккал, 33г белка. Обед под Перфектил+Омегу: жиры (авокадо, масло, кунжут) + гемовое железо из говядины.", "tip": "Прими Перфектил и Омегу сразу после — жиры помогут усвоению.", "why": "Жиры для жирорастворимых витаминов + красное мясо = железо. Удобный обед-комбо."}, {"id": "fat-l4", "ch": "chicken", "name": "Курица в сливочно-горчичном соусе с овощами", "time": 20, "tags": ["СПКЯ", "белок", "жиры", "до 20 мин", "холестерин"], "kbju": {"k": 150, "p": 18, "f": 8, "c": 3}, "ing": ["Куриная грудка — 180г", "Сливки 20% — 80мл", "Горчица зернистая — 1 ч.л.", "Брокколи/стручковая фасоль — 150г", "Чеснок, оливковое масло — 1 ч.л.", "Соль, перец"], "steps": ["Курицу нарезать, обжарить 4–5 мин.", "Добавить чеснок, сливки, горчицу.", "Тушить 3 мин до загустения.", "Овощи приготовить на пару, подать рядом."], "masha": "~360 ккал, 40г белка. Жиры из сливок и масла — под дневные витамины. Очень сытно.", "tip": "Соус не кипятить сильно — сливки свернутся.", "why": "Сливки/масло — жир для Перфектила и Омеги; курица — лёгкий белок."}, {"id": "fat-l5", "ch": "fish", "name": "Боул с тунцом, авокадо и рисом", "time": 15, "tags": ["белок", "жиры", "до 20 мин", "B12", "омега", "холестерин"], "kbju": {"k": 165, "p": 15, "f": 7, "c": 12}, "ing": ["Тунец (стейк или консерв.) — 120г", "Рис отварной — 100г", "Авокадо — ½ шт", "Огурец, морковь, нори", "Кунжутное/оливковое масло — 1 ст.л.", "Соевый соус, кунжут"], "steps": ["Рис отварить, остудить.", "Тунец обжарить или слить.", "Собрать боул: рис, тунец, авокадо, овощи.", "Заправить маслом и соусом, посыпать кунжутом."], "masha": "~400 ккал, 28г белка. Жиры из авокадо и масла + омега из тунца. Тунец 1–2 раза в неделю (ртуть).", "tip": "Рис чуть остудить — боул вкуснее тёплым, не горячим.", "why": "Авокадо + масло — жир для усвоения; тунец даёт омега-3 и белок."}, {"id": "fat-d3", "ch": "fish", "name": "Запечённый лосось с песто и овощами", "time": 20, "tags": ["белок", "жиры", "B12", "омега", "холестерин"], "kbju": {"k": 200, "p": 19, "f": 13, "c": 3}, "ing": ["Филе лосося — 150г", "Песто — 1 ст.л.", "Цуккини, перец, черри — 200г", "Оливковое масло — 1 ст.л.", "Соль, перец"], "steps": ["Овощи нарезать, сбрызнуть маслом, на противень.", "Лосось смазать песто, выложить к овощам.", "Запекать 180°С 15–18 мин."], "masha": "~420 ккал, 30г белка. Ужин под A+E: лосось + масло + песто (орехи/масло) — отличная жировая база.", "tip": "A+E прими с этим ужином — жиры обеспечат усвоение.", "why": "Жирная рыба + оливковое масло + песто — жиры для витаминов А и Е."}, {"id": "fat-d4", "ch": "meat", "name": "Тёплый салат с говядиной, орехами и сыром", "time": 18, "tags": ["белок", "железо", "жиры", "B12"], "kbju": {"k": 175, "p": 15, "f": 12, "c": 4}, "ing": ["Говядина — 150г", "Микс салата — горсть", "Грецкие орехи — 15г", "Сыр (пармезан/фета) — 30г", "Оливковое масло — 1 ст.л.", "Бальзамик, помидоры черри"], "steps": ["Говядину обжарить полосками, отдохнуть 3 мин.", "На салат выложить мясо, орехи, сыр, черри.", "Заправить маслом и бальзамиком."], "masha": "~390 ккал, 28г белка. Ужин под A+E: масло, орехи, сыр — жиры; говядина — железо.", "tip": "Мясо тёплое, салат комнатный — контраст вкуснее.", "why": "Орехи + масло + сыр = жир для A+E; говядина = гемовое железо вечером."}, {"id": "iron-m1", "ch": "meat", "name": "Печень говяжья в сметанно-луковом соусе", "time": 25, "tags": ["железо", "B12", "белок"], "kbju": {"k": 150, "p": 18, "f": 7, "c": 4}, "ing": ["Говяжья печень — 300г", "Лук — 2 шт", "Сметана 15% — 2 ст.л.", "Оливковое масло — 1 ст.л.", "Соль, перец, тимьян"], "steps": ["Печень нарезать, обвалять (по желанию в муке).", "Обжарить на сильном огне 2 мин с каждой стороны, убрать.", "Лук обжарить до золотистого.", "Вернуть печень, добавить сметану, тушить 3 мин. Солить в конце."], "masha": "~250 ккал, 27г белка. Рекордсмен по железу и B12. 1 раз в неделю.", "tip": "Не пережаривай — печень должна остаться нежной. Соль только в конце.", "why": "Говяжья печень — самый концентрированный источник железа и B12 (твой B12 был в нижней трети)."}, {"id": "iron-s1", "ch": "salad", "name": "Салат с печёной свёклой, нутом и тыквенными семечками", "time": 15, "tags": ["железо", "ЖКТ", "СПКЯ", "до 20 мин"], "kbju": {"k": 130, "p": 6, "f": 6, "c": 14}, "ing": ["Свёкла печёная — 150г", "Нут отварной — 100г", "Тыквенные семечки — 1 ст.л.", "Руккола/шпинат — горсть", "Оливковое масло — 1 ст.л.", "Лимон, соль"], "steps": ["Свёклу нарезать кубиком.", "Смешать с нутом и зеленью.", "Заправить маслом и лимоном.", "Посыпать семечками."], "masha": "~320 ккал, 11г белка. Растительное железо + клетчатка для ЖКТ. Лимон даёт витамин C.", "tip": "Свёклу удобно печь заранее партией.", "why": "Свёкла, нут, тыквенные семечки, зелень — растительное железо; лимон (вит C) усиливает усвоение; клетчатка для ЖКТ."}, {"id": "gut-d1", "ch": "soup", "name": "Чечевичное рагу с овощами и курицей", "time": 35, "tags": ["СПКЯ", "белок", "ЖКТ", "железо", "холестерин", "стул"], "kbju": {"k": 110, "p": 9, "f": 3, "c": 12}, "ing": ["Зелёная/коричневая чечевица — 150г", "Куриная грудка — 200г", "Морковь, сельдерей, лук — по 1", "Томаты — 200г", "Оливковое масло — 1 ст.л.", "Чеснок, тмин, паприка, зелень"], "steps": ["Овощи обжарить 5 мин.", "Добавить курицу кубиками, обжарить 3 мин.", "Добавить чечевицу, томаты, специи, воду.", "Тушить 25 мин до мягкости чечевицы."], "masha": "~350 ккал, 30г белка. Железо (чечевица+курица) + клетчатка для ЖКТ в одной кастрюле. Клетчатка работает лучше при достаточном питье воды.", "tip": "Зелёная чечевица держит форму — рагу не превращается в кашу.", "why": "Чечевица — железо и клетчатка; курица даёт белок и немного гемового железа (основные источники железа — печень, красное мясо, моллюски). Мягко и сытно для ЖКТ."}, {"id": "mama-bliny", "ch": "baking", "name": "Тонкие блинчики (мамин рецепт)", "time": 40, "tags": ["заготовка"], "kbju": {"k": 282, "p": 10, "f": 12, "c": 35}, "ing": ["Яйца — 2 шт", "Сахар — 1 ст.л.", "Соль — щепотка", "Молоко — 0,5 л (двумя частями по ¼ л)", "Мука просеянная — 7 ст.л.", "Подсолнечное масло — 1,5 ст.л."], "steps": ["Взбить 2 яйца с 1 ст.л. сахара и щепоткой соли.", "Влить ¼ литра молока, взбить.", "Добавить 7 столовых ложек просеянной муки, взбить венчиком до гладкости.", "Долить ещё ¼ литра молока, взбить.", "Добавить 1,5 ложки подсолнечного масла, взбить.", "Дать тесту постоять 20 минут.", "Хорошо перемешать и выпекать тонкие блинчики на разогретой сковороде."], "masha": "Мамин рецепт ♥ Всё тесто ~1130 ккал (≈13 тонких блинов, ~87 ккал за блин). Порция ~3 блина — около 280 ккал. Масло уже в тесте — сковороду почти не смазывать.", "tip": "Тесто обязательно должно постоять 20 минут — блины получаются тоньше и эластичнее. Первый блин — пробный, отрегулируй огонь.", "why": "Семейный рецепт. Это праздничное/уютное блюдо, не из «полезной» категории — и это нормально. Главное — радость."}, {"id": "add-mussels1", "ch": "fish", "name": "Мидии в томатном соусе", "time": 20, "tags": ["железо", "белок", "B12", "до 20 мин"], "kbju": {"k": 160, "p": 19, "f": 5, "c": 8}, "ing": ["Мидии (мясо) — 200г", "Помидоры — 250г или паста 1 ст.л.", "Чеснок — 2 зубчика", "Оливковое масло — 1 ч.л.", "Петрушка, лимон", "Соль, перец"], "steps": ["Чеснок обжарить на масле 30 сек.", "Добавить помидоры, тушить 5 мин.", "Добавить мидии, тушить 3–5 мин.", "Петрушка, лимон, соль."], "masha": "~320 ккал, 38г белка. Один из лучших источников B12 и хорошее гемовое железо при низкой калорийности.", "tip": "Готовые мидии не переваривать — станут резиновыми.", "why": "Мидии — топ по B12 (твой был в нижней трети) и железу; много белка на калорию."}, {"id": "add-sardines1", "ch": "fish", "name": "Сардины на тосте с томатами", "time": 8, "tags": ["белок", "до 20 мин", "B12", "омега", "холестерин"], "kbju": {"k": 210, "p": 15, "f": 11, "c": 14}, "ing": ["Сардины консерв. в масле — 1 банка (~90г)", "Хлеб цельнозерновой — 2 куска", "Помидор — 1 шт", "Лимон, петрушка", "Чёрный перец"], "steps": ["Хлеб поджарить.", "Сардины размять вилкой.", "Выложить на тост с дольками помидора.", "Сбрызнуть лимоном, поперчить."], "masha": "~330 ккал, 23г белка. Сардины — омега-3, B12 и кальций, мало ртути (лучше тунца).", "tip": "Сардины с косточками — их едят, это кальций.", "why": "Сардины богаче тунца по омега-3 и B12, и в них меньше ртути."}, {"id": "add-trout1", "ch": "fish", "name": "Запечённая форель с лимоном", "time": 20, "tags": ["белок", "до 20 мин", "B12", "омега", "холестерин"], "kbju": {"k": 175, "p": 22, "f": 9, "c": 1}, "ing": ["Филе форели — 180г", "Лимон — ½ шт", "Оливковое масло — 1 ч.л.", "Тимьян/укроп", "Соль, перец"], "steps": ["Форель на фольгу, посолить, сбрызнуть маслом и лимоном.", "Сверху зелень. Завернуть.", "Духовка 180°С 15–18 мин."], "masha": "~330 ккал, 40г белка. Форель — омега-3 и B12, нежнее лосося.", "tip": "Не передерживать — форель готовится быстро.", "why": "Форель — омега-3 и B12 при умеренной калорийности."}, {"id": "add-edamame1", "ch": "salad", "name": "Тёплый боул с эдамаме и лососем", "time": 18, "tags": ["СПКЯ", "белок", "жиры", "B12", "омега", "холестерин"], "kbju": {"k": 175, "p": 16, "f": 9, "c": 9}, "ing": ["Лосось — 120г", "Эдамаме (соевые бобы) — 100г", "Киноа/рис — 80г отварного", "Огурец, морковь", "Кунжутное масло — 1 ч.л.", "Соевый соус, кунжут"], "steps": ["Лосось обжарить/запечь.", "Эдамаме отварить 4 мин.", "Собрать боул с киноа и овощами.", "Заправить маслом и соусом."], "masha": "~430 ккал, 33г белка. СПКЯ-дружелюбно: соевый белок + омега + клетчатка, мягкая гликемическая нагрузка.", "tip": "Эдамаме продаётся замороженным — удобно держать про запас.", "why": "Соя (эдамаме) — растительный белок, может мягко улучшать липидный профиль; хорошо при СПКЯ."}, {"id": "add-tofu1", "ch": "breakfast", "name": "Тофу-скрэмбл со шпинатом и куркумой", "time": 12, "tags": ["белок", "СПКЯ", "холестерин", "до 20 мин"], "kbju": {"k": 115, "p": 11, "f": 7, "c": 3}, "ing": ["Тофу плотный — 200г", "Шпинат — горсть", "Куркума — ½ ч.л.", "Чеснок, лук — по вкусу", "Оливковое масло — 1 ч.л.", "Соль, перец, паприка"], "steps": ["Тофу размять вилкой.", "Лук/чеснок обжарить 2 мин.", "Добавить тофу и куркуму, жарить 5 мин.", "Добавить шпинат, 1 мин. Посолить."], "masha": "~230 ккал, 22г белка. Разнообразие завтраков без яиц; соевый белок для СПКЯ.", "tip": "Куркума даёт «яичный» цвет; плотный тофу отжать перед готовкой.", "why": "Соевый белок; альтернатива яичным завтракам, которых много."}, {"id": "add-chili1", "ch": "meat", "name": "Чили из фасоли и индейки", "time": 35, "tags": ["СПКЯ", "белок", "ЖКТ", "железо", "холестерин"], "kbju": {"k": 120, "p": 12, "f": 4, "c": 11}, "ing": ["Индейка фарш — 300г", "Фасоль красная (отварная/консерв.) — 200г", "Томаты — 400г", "Лук, чеснок, перец", "Паприка, тмин, орегано", "Оливковое масло — 1 ст.л."], "steps": ["Лук и перец обжарить 5 мин.", "Добавить индейку, обжарить.", "Добавить специи, томаты, фасоль.", "Тушить 20 мин."], "masha": "~360 ккал, 34г белка. Клетчатка (фасоль) + белок; хорошо для ЖКТ и холестерина.", "tip": "На след. день вкуснее. Замораживается порциями.", "why": "Фасоль — растворимая клетчатка (холестерин, ЖКТ) + растительное железо; индейка — лёгкий белок."}, {"id": "add-lentilsal1", "ch": "salad", "name": "Салат из чечевицы, перца и петрушки", "time": 15, "tags": ["СПКЯ", "ЖКТ", "до 20 мин", "железо", "холестерин"], "kbju": {"k": 140, "p": 8, "f": 5, "c": 17}, "ing": ["Чечевица отварная — 150г", "Перец болгарский — 1 шт", "Помидоры черри — 8 шт", "Петрушка — пучок", "Лимон — ½ шт", "Оливковое масло — 1 ст.л.", "Соль, перец"], "steps": ["Чечевицу отварить, остудить.", "Перец и черри нарезать.", "Смешать с петрушкой.", "Заправить лимоном и маслом."], "masha": "~330 ккал, 16г белка. Чечевица + перец/лимон (вит C) = усвоение железа лучше.", "tip": "Зелёная/коричневая чечевица держит форму.", "why": "Витамин C из перца и лимона усиливает усвоение негемового железа чечевицы."}, {"id": "add-bran1", "ch": "breakfast", "name": "Овсяные отруби с киви и йогуртом", "time": 5, "tags": ["флора", "ЖКТ", "до 20 мин", "холестерин", "стул"], "kbju": {"k": 120, "p": 7, "f": 3, "c": 17}, "ing": ["Овсяные отруби — 3 ст.л.", "Греческий йогурт — 150г", "Киви — 2 шт", "Семена льна молотые — 1 ч.л.", "Мёд — ½ ч.л. (по желанию)"], "steps": ["Отруби смешать с йогуртом, дать постоять 5 мин.", "Сверху нарезанные киви и лён.", "Мёд по желанию."], "masha": "~250 ккал, 14г белка. Двойной удар по запору (отруби + киви) и польза для холестерина. Клетчатка работает лучше при достаточном питье воды.", "tip": "Йогурт/молочное — не в первые 2 часа после железа.", "why": "Овсяные отруби (бета-глюкан) — холестерин + стул; киви — доказанная регулярность."}, {"id": "add-oatpsyl1", "ch": "breakfast", "name": "Overnight oats с псиллиумом и киви", "time": 5, "tags": ["ЖКТ", "заготовка", "холестерин", "стул"], "kbju": {"k": 135, "p": 6, "f": 4, "c": 21}, "ing": ["Овсяные хлопья — 50г", "Псиллиум (шелуха) — 1 ч.л.", "Молоко/вода — 200мл", "Киви — 1 шт", "Семена чиа — 1 ч.л.", "Мёд — ½ ч.л."], "steps": ["Смешать хлопья, псиллиум, чиа с жидкостью.", "Размешать, убрать в холодильник на ночь.", "Утром добавить киви.", "ВАЖНО: запить стаканом воды."], "masha": "~300 ккал. Псиллиум + овёс + киви — сильная анти-запорная связка. Обязательно пить воду.", "tip": "Псиллиум без достаточной воды крепит — пей стакан воды к порции.", "why": "Псиллиум — один из самых доказанных средств от запора (работает только с водой)."}, {"id": "add-sardpasta1", "ch": "fish", "name": "Паста с сардинами и лимоном", "time": 20, "tags": ["белок", "до 20 мин", "B12", "омега", "холестерин"], "kbju": {"k": 190, "p": 12, "f": 8, "c": 20}, "ing": ["Паста — 70г", "Сардины консерв. — 1 банка (~90г)", "Чеснок — 2 зубчика", "Лимон — цедра + сок", "Оливковое масло — 1 ч.л.", "Петрушка, перец чили"], "steps": ["Отварить пасту al dente.", "Чеснок обжарить 30 сек.", "Добавить сардины, размять.", "Смешать с пастой, цедрой, лимоном, петрушкой."], "masha": "~430 ккал, 24г белка. Сардины — омега-3 и B12; быстрый ужин.", "tip": "Цедра даёт аромат без кислоты.", "why": "Сардины — омега-3 и B12, дешевле и чище тунца по ртути."}, {"id": "add-tempe1", "ch": "salad", "name": "Боул с темпе, эдамаме и кунжутом", "time": 18, "tags": ["СПКЯ", "белок", "жиры", "холестерин"], "kbju": {"k": 185, "p": 17, "f": 10, "c": 10}, "ing": ["Темпе — 150г", "Эдамаме — 80г", "Рис/киноа — 80г отварного", "Морковь, огурец", "Кунжутное масло — 1 ч.л.", "Соевый соус, кунжут, имбирь"], "steps": ["Темпе нарезать, обжарить 6–7 мин до золотистого.", "Эдамаме отварить.", "Собрать боул.", "Заправить соусом, маслом, кунжутом."], "masha": "~430 ккал, 32г белка. Растительный белок + ферментация; СПКЯ-дружелюбно.", "tip": "Темпе перед жаркой можно отварить 5 мин — мягче и без горчинки.", "why": "Соевый белок (темпе+эдамаме); хорошо для СПКЯ и разнообразия. Темпе ферментирован, но после жарки живых культур может не остаться — это не пробиотик."}, {"id": "add-barley1", "ch": "soup", "name": "Ячневая каша с грибами и индейкой", "time": 40, "tags": ["белок", "ЖКТ", "холестерин", "СПКЯ"], "kbju": {"k": 110, "p": 9, "f": 3, "c": 13}, "ing": ["Ячневая крупа — 150г", "Индейка (филе) — 250г", "Грибы — 200г", "Лук, морковь", "Оливковое масло — 1 ст.л.", "Зелень, соль, перец"], "steps": ["Крупу отварить (1:2,5, ~25 мин).", "Индейку и овощи обжарить.", "Добавить грибы, 5 мин.", "Смешать с кашей, потушить 5 мин."], "masha": "~380 ккал, 30г белка. Ячмень — бета-глюкан (холестерин), сытный медленный углевод для СПКЯ.", "tip": "Ячневую крупу удобно сварить заранее.", "why": "Ячмень — бета-глюкан (холестерин), низкий ГИ — хорошо при СПКЯ."}, {"id": "add-whitebean1", "ch": "soup", "name": "Суп с белой фасолью и овощами", "time": 35, "tags": ["белок", "ЖКТ", "холестерин", "СПКЯ"], "kbju": {"k": 85, "p": 6, "f": 2, "c": 13}, "ing": ["Белая фасоль (отварная/консерв.) — 250г", "Морковь, сельдерей, лук", "Томаты — 200г", "Чеснок, оливковое масло — 1 ст.л.", "Тимьян, зелень, соль"], "steps": ["Овощи обжарить 5 мин.", "Добавить томаты и воду.", "Добавить фасоль, варить 20 мин.", "Часть пюрировать для густоты."], "masha": "~300 ккал, 16г белка. Клетчатка фасоли — холестерин и ЖКТ; сытно при низком калораже.", "tip": "Часть супа пюрировать — станет кремовым без сливок.", "why": "Белая фасоль — растворимая клетчатка (холестерин) и растительный белок."}, {"id": "add-mussels2", "ch": "salad", "name": "Тёплый салат с мидиями и чечевицей", "time": 20, "tags": ["холестерин", "СПКЯ", "белок", "железо", "B12"], "kbju": {"k": 140, "p": 15, "f": 4, "c": 12}, "ing": ["Мидии (мясо) — 150г", "Чечевица отварная — 150г", "Руккола/шпинат — 60г", "Помидоры черри — 8 шт", "Лимон, оливковое масло — 1 ст.л.", "Чеснок, петрушка"], "steps": ["Мидии прогреть с чесноком 3 мин.", "Смешать с чечевицей и зеленью.", "Заправить лимоном и маслом."], "masha": "~350 ккал, 30г белка. Мидии (B12, железо) + чечевица (железо, клетчатка) + лимон (вит C).", "tip": "Лимон обязателен — витамин C усиливает усвоение железа.", "why": "Мидии — гемовое железо и B12; чечевица + витамин C — дополнительное усвоение."}, {"id": "add-trout-br", "ch": "breakfast", "name": "Тост с форелью, яйцом и авокадо", "time": 10, "tags": ["белок", "до 20 мин", "после железа", "B12", "омега", "холестерин", "стул"], "kbju": {"k": 215, "p": 15, "f": 13, "c": 11}, "ing": ["Слабосолёная форель — 60г", "Хлеб цельнозерновой — 1–2 куска", "Яйцо пашот — 1 шт", "Авокадо — ½ шт", "Лимон, укроп, перец"], "steps": ["Хлеб поджарить.", "Авокадо размять с лимоном, намазать.", "Сверху форель и яйцо пашот.", "Укроп, перец."], "masha": "~340 ккал, 22г белка. Рыбный завтрак: омега-3 и B12 с утра, без молочного — ок в день железа. Клетчатка работает лучше при достаточном питье воды.", "tip": "Если день железа — кофе/чай через 2 ч.", "why": "Рыбный завтрак закрывает омега-3 и B12; разнообразит яичные завтраки."}, {"id": "gpt-oat-psyl", "ch": "breakfast", "name": "Ночной овёс с псиллиумом, киви и йогуртом", "time": 5, "tags": ["заготовка", "ЖКТ", "стул", "холестерин"], "kbju": {"k": 135, "p": 7, "f": 4, "c": 20}, "ing": ["Овсяные хлопья — 50г", "Псиллиум — 1 ч.л.", "Греческий йогурт — 100г", "Молоко/вода — 100мл", "Киви — 2 шт", "Семена льна молотые — 1 ч.л."], "steps": ["Смешать хлопья, псиллиум, йогурт, молоко.", "Убрать на ночь в холодильник.", "Утром добавить киви и лён.", "ВАЖНО: запить стаканом воды."], "masha": "~280 ккал, 14г белка. Самая сильная анти-запорная связка: псиллиум + киви + овёс. Клетчатка работает лучше при достаточном питье воды.", "tip": "Йогурт/молочное — не в первые 2 часа после железа.", "why": "По силе доказательств при запоре: псиллиум ≈ киви > чернослив > овёс. Здесь сразу три."}, {"id": "gpt-chia-kiwi", "ch": "breakfast", "name": "Чиа-пудинг с киви и льном", "time": 5, "tags": ["заготовка", "ЖКТ", "стул"], "kbju": {"k": 130, "p": 5, "f": 8, "c": 12}, "ing": ["Семена чиа — 3 ст.л.", "Молоко/растительное — 200мл", "Киви — 2 шт", "Семена льна молотые — 1 ч.л.", "Мёд — ½ ч.л. (по желанию)"], "steps": ["Чиа залить молоком, размешать.", "Через 5 мин размешать снова, убрать на ночь.", "Утром добавить киви и лён."], "masha": "~250 ккал. Киви + чиа + лён — мягкая помощь при запоре. Пей достаточно воды в течение дня.", "tip": "Перемешать дважды в первые 15 мин — чиа не слипнется.", "why": "Киви — сильная доказательная база при запоре; чиа/лён — растворимая клетчатка (нужна вода)."}, {"id": "gpt-mussel-bean", "ch": "salad", "name": "Салат с мидиями, белой фасолью и лимоном", "time": 18, "tags": ["железо", "B12", "белок", "холестерин", "СПКЯ"], "kbju": {"k": 135, "p": 14, "f": 4, "c": 12}, "ing": ["Мидии (мясо) — 150г", "Белая фасоль отварная — 150г", "Руккола — 60г", "Лимон — ½ шт", "Оливковое масло — 1 ст.л.", "Чеснок, петрушка, перец"], "steps": ["Мидии прогреть с чесноком 3 мин.", "Смешать с фасолью и рукколой.", "Заправить лимоном и маслом."], "masha": "~340 ккал, 28г белка. Мидии — мощно по B12 и железу; фасоль — клетчатка для холестерина и ЖКТ.", "tip": "Лимон обязателен — витамин C усиливает усвоение железа.", "why": "Мидии — один из лучших источников B12 и гемового железа; белая фасоль — растворимая клетчатка."}, {"id": "gpt-beef-lentil", "ch": "meat", "name": "Тушёная говядина с чечевицей и томатами", "time": 70, "tags": ["железо", "белок", "ЖКТ", "холестерин"], "kbju": {"k": 140, "p": 14, "f": 5, "c": 10}, "ing": ["Говядина для тушения — 400г", "Зелёная чечевица — 150г", "Томаты — 400г", "Лук, морковь, чеснок", "Оливковое масло — 1 ст.л.", "Паприка, тмин, лавровый лист"], "steps": ["Говядину обжарить кусочками.", "Добавить лук, морковь, специи.", "Добавить томаты и воду, тушить 40 мин.", "Добавить чечевицу, ещё 25 мин."], "masha": "~390 ккал, 34г белка. Гемовое железо (говядина) + негемовое (чечевица) + витамин C из томатов = отлично для ферритина.", "tip": "На след. день вкуснее. Замораживается порциями.", "why": "Длительно тушёная говядина + чечевица + томаты (вит C) — сильная связка под ферритин."}, {"id": "gpt-sardine-bean", "ch": "salad", "name": "Боул с сардинами, фасолью и печёным перцем", "time": 15, "tags": ["омега", "B12", "белок", "холестерин"], "kbju": {"k": 160, "p": 13, "f": 8, "c": 10}, "ing": ["Сардины консерв. — 1 банка (~90г)", "Белая фасоль — 150г", "Печёный перец — 1 шт", "Руккола/салат — 60г", "Лимон, оливковое масло — 1 ст.л.", "Петрушка"], "steps": ["Перец запечь/взять готовый, нарезать.", "Смешать фасоль, перец, зелень.", "Сверху сардины.", "Заправить лимоном и маслом."], "masha": "~360 ккал, 24г белка. Сардины — омега-3 и B12; фасоль — клетчатка для холестерина.", "tip": "Сардины с косточками — их едят, это кальций.", "why": "Сардины богаче тунца по омега-3 и B12, меньше ртути; фасоль — бета-ничего, но растворимая клетчатка."}, {"id": "gpt-squid-bean", "ch": "salad", "name": "Тёплый салат с кальмарами и белой фасолью", "time": 15, "tags": ["белок", "B12", "холестерин"], "kbju": {"k": 120, "p": 15, "f": 3, "c": 9}, "ing": ["Кальмары — 200г", "Белая фасоль — 150г", "Помидоры черри — 8 шт", "Руккола — 60г", "Лимон, чеснок, оливковое масло — 1 ст.л.", "Петрушка, перец"], "steps": ["Кальмары почистить, нарезать кольцами.", "Обжарить на сильном огне 1–2 мин (не передержать!).", "Смешать с фасолью, черри, рукколой.", "Заправить лимоном, чесноком, маслом."], "masha": "~330 ккал, 30г белка. Кальмары — лёгкий белок и B12; фасоль — клетчатка.", "tip": "Кальмары жарить максимум 2 мин — иначе резиновые.", "why": "Кальмары — белок и B12 при низкой калорийности; разнообразие морепродуктов кроме рыбы."}, {"id": "gpt-lentil-turkey", "ch": "soup", "name": "Суп-пюре из красной чечевицы с индейкой", "time": 35, "tags": ["белок", "ЖКТ", "железо", "СПКЯ", "холестерин"], "kbju": {"k": 95, "p": 9, "f": 2, "c": 11}, "ing": ["Красная чечевица — 150г", "Индейка (филе) — 250г", "Морковь, лук, чеснок", "Томатная паста — 1 ст.л.", "Куркума, тмин, паприка", "Оливковое масло — 1 ст.л.", "Лимон"], "steps": ["Индейку и овощи обжарить 5 мин.", "Добавить чечевицу, специи, воду.", "Варить 20 мин.", "Часть пюрировать. Лимон при подаче."], "masha": "~360 ккал, 32г белка. Белковый суп (их не хватало): чечевица + индейка, клетчатка для ЖКТ.", "tip": "Красная чечевица разваривается — идеально для пюре-супа.", "why": "Чечевица — железо и растворимая клетчатка (холестерин); индейка — лёгкий белок."}, {"id": "gpt-barley-risotto", "ch": "soup", "name": "Ячменное ризотто с грибами и индейкой", "time": 45, "tags": ["белок", "ЖКТ", "холестерин", "СПКЯ"], "kbju": {"k": 120, "p": 10, "f": 3, "c": 15}, "ing": ["Перловка/ячмень — 150г", "Индейка — 250г", "Грибы — 200г", "Лук, чеснок", "Бульон — 600мл", "Пармезан — 20г", "Оливковое масло — 1 ст.л.", "Тимьян"], "steps": ["Ячмень отварить почти до готовности.", "Индейку и грибы обжарить с луком.", "Соединить, добавляя бульон, до кремовости.", "Пармезан, тимьян в конце."], "masha": "~400 ккал, 30г белка. Ячмень — бета-глюкан (холестерин), низкий ГИ для СПКЯ.", "tip": "Ячмень можно сварить заранее партией.", "why": "Ячмень — бета-глюкан (доказанно снижает холестерин), медленный углевод — хорошо при СПКЯ."}, {"id": "gpt-tofu-bowl", "ch": "salad", "name": "Тофу-боул с эдамаме и стручковой фасолью", "time": 18, "tags": ["белок", "СПКЯ", "холестерин", "жиры"], "kbju": {"k": 150, "p": 14, "f": 8, "c": 9}, "ing": ["Тофу плотный — 200г", "Эдамаме — 80г", "Стручковая фасоль — 100г", "Рис/киноа — 80г отварного", "Кунжутное масло — 1 ч.л.", "Соевый соус, кунжут, имбирь"], "steps": ["Тофу обжарить кубиками до корочки.", "Фасоль и эдамаме отварить 4 мин.", "Собрать боул с крупой.", "Заправить соусом, маслом, кунжутом."], "masha": "~420 ккал, 28г белка. Соевый белок для СПКЯ; без брокколи — стручковая фасоль вместо неё.", "tip": "Тофу отжать перед жаркой — будет румяным.", "why": "Соя (тофу+эдамаме) — растительный белок, может мягко улучшать липидный профиль; хорошо при СПКЯ."}, {"id": "gpt-liver-salad", "ch": "chicken", "name": "Тёплый салат с куриной печенью, рукколой и перцем", "time": 18, "tags": ["железо", "B12", "белок"], "kbju": {"k": 140, "p": 16, "f": 6, "c": 6}, "ing": ["Куриная печень — 250г", "Руккола — 60г", "Печёный перец — 1 шт", "Помидоры черри — 8 шт", "Бальзамик, оливковое масло — 1 ст.л.", "Соль, перец"], "steps": ["Печень обжарить 2–3 мин с каждой стороны (центр чуть розовый).", "На рукколу выложить перец, черри.", "Сверху тёплую печень.", "Заправить бальзамиком и маслом."], "masha": "~310 ккал, 28г белка. Печень — рекордсмен по железу и B12. 1–2 раза в неделю.", "tip": "Печень солить в конце — иначе жёсткая.", "why": "Куриная печень — самый концентрированный пищевой источник железа и B12."}, {"id": "gpt-prune-bran", "ch": "breakfast", "name": "Чернослив с йогуртом и овсяными отрубями", "time": 3, "tags": ["ЖКТ", "стул", "холестерин"], "kbju": {"k": 120, "p": 7, "f": 2, "c": 19}, "ing": ["Чернослив — 5 шт", "Греческий йогурт — 150г", "Овсяные отруби — 2 ст.л.", "Семена льна молотые — 1 ч.л."], "steps": ["Отруби смешать с йогуртом, дать постоять 5 мин.", "Чернослив нарезать, добавить.", "Сверху лён."], "masha": "~230 ккал, 13г белка. Чернослив + отруби — мягкая ежедневная помощь при запоре. Пей достаточно воды.", "tip": "Йогурт — не в первые 2 часа после железа.", "why": "Чернослив (сорбитол) + овсяные отруби (бета-глюкан) — стул и холестерин одновременно."}, {"id": "gpt-mackerel-bean", "ch": "fish", "name": "Скумбрия с белой фасолью и томатами", "time": 20, "tags": ["омега", "B12", "белок", "холестерин"], "kbju": {"k": 175, "p": 15, "f": 10, "c": 8}, "ing": ["Скумбрия — 120г", "Белая фасоль отварная — 150г", "Томаты — 200г", "Лук, чеснок", "Оливковое масло — 1 ст.л.", "Петрушка, лимон"], "steps": ["Лук и чеснок обжарить.", "Добавить томаты, тушить 5 мин.", "Добавить фасоль, прогреть.", "Скумбрию добавить на 5 мин. Лимон, петрушка."], "masha": "~400 ккал, 28г белка. Скумбрия — омега-3 и B12; фасоль — клетчатка для холестерина.", "tip": "Можно с консервированной скумбрией в собственном соку — ещё быстрее.", "why": "Скумбрия — омега-3 и B12; белая фасоль — растворимая клетчатка (холестерин, ЖКТ)."}];

  const RECIPE_CHAPTERS = [
    { id: "breakfast", l: "🍳 Завтраки" },
    { id: "soup",      l: "🍲 Супы" },
    { id: "fish",      l: "🐟 Рыба" },
    { id: "meat",      l: "🥩 Мясо" },
    { id: "chicken",   l: "🍗 Курица и печень" },
    { id: "salad",     l: "🥗 Салаты" },
    { id: "veg",       l: "🥦 Гарниры" },
    { id: "baking",    l: "🍪 Выпечка и сладкое" },
    { id: "sauce",     l: "🥑 Соусы и перекусы" },
    { id: "drink",     l: "☕ Напитки" },
    { id: "ferment",   l: "🫙 Ферментация" },
  ];
  const RECIPE_FILTERS = [
    { id: "all",   l: "Все" },
    { id: "до 20 мин", l: "⏱ До 20 мин" },
    { id: "белок", l: "💪 Белок" },
    { id: "после железа", l: "🩸 После железа" },
    { id: "железо", l: "🥩 Железо/ферритин" },
    { id: "B12", l: "🐚 B12" },
    { id: "жиры", l: "🥑 Омега и A+E" },
    { id: "стул", l: "🌿 Мягкий стул" },
    { id: "ЖКТ",   l: "🌀 ЖКТ" },
    { id: "флора", l: "🦠 Флора" },
    { id: "СПКЯ",  l: "♀ СПКЯ" },
    { id: "холестерин", l: "❤ Холестерин" },
    { id: "омега", l: "🐟 Омега" },
    { id: "сон",   l: "🌙 Сон/покой" },
    { id: "заготовка", l: "📦 Заготовки" },
  ];

  // Полноэкранный просмотр одного рецепта
  function RecipeDetail({ recipe, onClose }) {
    const r = recipe;
    return React.createElement("div", {
      style: { position: "fixed", inset: 0, zIndex: 100, background: C.bg, overflowY: "auto",
        maxWidth: 430, left: "50%", transform: "translateX(-50%)", width: "100%" }
    },
      // Шапка
      React.createElement("div", { style: { position: "sticky", top: 0, background: C.card, borderBottom: `0.5px solid ${C.border}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, zIndex: 2 } },
        React.createElement("button", { onClick: onClose, "aria-label": "Назад",
          style: { background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.oliveDeep, lineHeight: 1, padding: 0, fontFamily: "inherit" } }, "←"),
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.text, flex: 1 } }, r.name)
      ),
      React.createElement("div", { style: { padding: "14px 16px 40px" } },
        // Метки и время
        React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 } },
          React.createElement("span", { style: { fontSize: 11, color: C.textM, background: C.bgWarm, borderRadius: 999, padding: "4px 10px" } }, "⏱ ", r.time, " мин"),
          r.tags.map((t, i) => React.createElement("span", { key: i, style: { fontSize: 11, color: C.oliveDeep, background: C.oliveSoft, borderRadius: 999, padding: "4px 10px" } }, t))
        ),
        // КБЖУ на 100г
        React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 14 } },
          [{ l: "ккал", v: r.kbju.k, bg: C.bgWarm, tx: C.text }, { l: "белок", v: r.kbju.p + "г", bg: C.oliveSoft, tx: C.oliveDeep }, { l: "жиры", v: r.kbju.f + "г", bg: C.sandSoft, tx: C.sandDeep }, { l: "углев", v: r.kbju.c + "г", bg: C.barkSoft, tx: C.bark }].map((it, i) =>
            React.createElement("div", { key: i, style: { flex: 1, background: it.bg, borderRadius: 9, padding: "8px 4px", textAlign: "center" } },
              React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: it.tx } }, it.v),
              React.createElement("div", { style: { fontSize: 9, color: C.textM, marginTop: 1 } }, it.l)
            )
          )
        ),
        React.createElement("div", { style: { fontSize: 10, color: C.textL, marginBottom: 16, textAlign: "right" } }, "значения на 100 г"),
        // Заметка для Маши
        r.masha && React.createElement("div", { style: { background: C.pinkSoft, border: `0.5px solid ${C.pink}33`, borderRadius: 10, padding: "11px 13px", marginBottom: 16 } },
          React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: C.pink, marginBottom: 3 } }, "🦊 Маше"),
          React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.55 } }, r.masha)
        ),
        // Польза (если есть)
        r.why && React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 10, padding: "11px 13px", marginBottom: 16 } },
          React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: C.oliveDeep, marginBottom: 3 } }, "💚 Чем полезно"),
          React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.55 } }, r.why)
        ),
        // Ингредиенты
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 } }, "Ингредиенты"),
        React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", marginBottom: 16 } },
          r.ing.map((it, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 8, padding: "5px 0", borderBottom: i < r.ing.length - 1 ? `0.5px solid ${C.border}` : "none" } },
            React.createElement("div", { style: { width: 5, height: 5, borderRadius: "50%", background: C.olive, marginTop: 7, flexShrink: 0 } }),
            React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.5 } }, it)
          ))
        ),
        // Шаги
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 } }, "Приготовление"),
        React.createElement("div", { style: { marginBottom: 16 } },
          r.steps.map((it, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 10, marginBottom: 10 } },
            React.createElement("div", { style: { width: 24, height: 24, borderRadius: "50%", background: C.oliveSoft, color: C.oliveDeep, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, i + 1),
            React.createElement("div", { style: { fontSize: 13, color: C.text, lineHeight: 1.55, paddingTop: 2 } }, it)
          ))
        ),
        // Совет
        r.tip && React.createElement("div", { style: { background: C.bgWarm, borderRadius: 10, padding: "11px 13px", fontSize: 12, color: C.textM, lineHeight: 1.55 } },
          React.createElement("b", { style: { color: C.text } }, "💡 Совет: "), r.tip
        )
      )
    );
  }

  function RecipesTab() {
    const [query, setQuery] = useState("");
    const [chapter, setChapter] = useState("all");
    const [filter, setFilter] = useState("all");
    const [viewMode, setViewMode] = useState("type"); // 'type' = по блюдам, 'goal' = по цели
    const [openId, setOpenId] = useState(null);
    const [favs, setFavs] = useLS("recipeFavsV1", []);
    const [trainMode, setTrainMode] = useState(null); // null | 'train' | 'rest'
    const toggleFav = (id, e) => {
      if (e) { e.stopPropagation(); }
      setFavs(favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id]);
    };

    const norm = (s) => (s || "").toLowerCase().replace(/ё/g, "е");
    const q = norm(query).trim();
    const list = RECIPES.filter(r => {
      if (filter === "fav" && !favs.includes(r.id)) return false;
      if (chapter !== "all" && r.ch !== chapter) return false;
      if (filter !== "all" && filter !== "fav" && !(r.tags || []).includes(filter)) return false;
      if (q) {
        const hay = norm(r.name + " " + r.ing.join(" ") + " " + (r.masha || "") + " " + (r.why || ""));
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // Группируем по главам для вывода
    const byChapter = {};
    list.forEach(r => { (byChapter[r.ch] = byChapter[r.ch] || []).push(r); });
    const openRecipe = openId ? RECIPES.find(r => r.id === openId) : null;

    // Идеи под цель дня. Учитываем приёмы пищи и твои цели (железо, омега, ЖКТ).
    const [ideaCount, setIdeaCount] = useState(4);
    const norm0 = (s) => (s || "").toLowerCase();
    const breakfastIdeas = RECIPES.filter(r => r.ch === "breakfast");
    const lunchIdeas = RECIPES.filter(r => ["chicken", "meat", "fish", "salad", "soup"].includes(r.ch));
    const dinnerIdeas = RECIPES.filter(r => ["fish", "salad", "chicken", "veg", "soup"].includes(r.ch));
    const snackIdeas = RECIPES.filter(r => ["baking", "sauce", "drink"].includes(r.ch) || (r.ch === "breakfast" && r.kbju.k < 150));
    // Скоринг: трен.день — белок+углеводы (восстановление); отдых — белок, меньше углеводов.
    // Небольшой бонус блюдам под твои приоритеты (железо/омега/B12/ЖКТ).
    const goalBonus = (r) => {
      const t = r.tags || [];
      let b = 0;
      if (t.includes("железо")) b += 3;
      if (t.includes("B12")) b += 2;
      if (t.includes("омега")) b += 2;
      if (t.includes("стул") || t.includes("ЖКТ")) b += 1;
      return b;
    };
    const pick = (arr, n, hiCarb) => arr.slice().sort((a, b) => {
      const base = (x) => hiCarb ? (x.kbju.p + x.kbju.c) : (x.kbju.p * 1.5 - x.kbju.c * 0.5);
      return (base(b) + goalBonus(b)) - (base(a) + goalBonus(a));
    }).slice(0, n);

    const ideaCard = (r) => React.createElement("button", { key: r.id, onClick: () => setOpenId(r.id),
      style: { textAlign: "left", background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 11, padding: "10px 12px", cursor: "pointer", fontFamily: "inherit", minWidth: 150, flexShrink: 0, width: 175 } },
      React.createElement("div", { style: { fontSize: 12.5, fontWeight: 600, color: C.text, lineHeight: 1.3, marginBottom: 4 } }, r.name),
      React.createElement("div", { style: { fontSize: 10.5, color: C.textM, marginBottom: 4 } }, r.kbju.p, "г белка · ", r.kbju.k, " ккал/100г"),
      (r.tags || []).filter(t => ["железо", "B12", "омега", "стул", "ЖКТ", "СПКЯ", "холестерин", "белок"].includes(t)).slice(0, 2).map((t, i) =>
        React.createElement("span", { key: i, style: { fontSize: 9.5, color: C.oliveDeep, background: C.oliveSoft, borderRadius: 5, padding: "1px 6px", marginRight: 4 } }, t))
    );
    const mealRow = (title, arr, hiCarb) => React.createElement("div", { style: { marginBottom: 8 } },
      React.createElement("div", { style: { fontSize: 10.5, fontWeight: 700, color: C.oliveDeep, margin: "2px 0 5px" } }, title),
      React.createElement("div", { style: { display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4 } }, pick(arr, ideaCount, hiCarb).map(ideaCard))
    );

    return React.createElement("div", null,
      openRecipe && React.createElement(RecipeDetail, { recipe: openRecipe, onClose: () => setOpenId(null) }),

      // ——— Идеи под цель дня ———
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.oliveDeep, marginBottom: 8 } }, "🍽 Что приготовить сегодня"),
        React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 10 } },
          [["train", "🏋 День тренировки"], ["rest", "🌿 День отдыха"]].map(m => React.createElement("button", { key: m[0], onClick: () => { setTrainMode(trainMode === m[0] ? null : m[0]); setIdeaCount(4); },
            style: { flex: 1, padding: "8px", borderRadius: 9, border: `0.5px solid ${trainMode === m[0] ? C.olive : C.border}`, background: trainMode === m[0] ? C.card : "transparent", color: trainMode === m[0] ? C.oliveDeep : C.textM, fontSize: 12, fontWeight: trainMode === m[0] ? 600 : 500, cursor: "pointer", fontFamily: "inherit" } }, m[1]))
        ),
        trainMode && React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 8, lineHeight: 1.5 } },
            trainMode === "train" ? "В день тренировки — больше белка и углеводов для энергии и восстановления. В подборке приоритет блюдам с железом, B12 и омега (твои цели):" : "В день отдыха — полегче, упор на белок и овощи, меньше быстрых углеводов. Приоритет железу, ЖКТ и омега:"),
          mealRow("🍳 Завтрак", breakfastIdeas, trainMode === "train"),
          mealRow("🥗 Обед", lunchIdeas, trainMode === "train"),
          mealRow("🌙 Ужин", dinnerIdeas, false),
          mealRow("🍎 Перекус", snackIdeas, trainMode === "train"),
          React.createElement("button", { onClick: () => setIdeaCount(ideaCount >= 8 ? 4 : ideaCount + 2),
            style: { marginTop: 4, fontSize: 11.5, fontWeight: 600, color: C.oliveDeep, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" } },
            ideaCount >= 8 ? "Свернуть ▲" : "Показать ещё варианты ▾")
        ),
        !trainMode && React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.5 } }, "Выбери тип дня — подберу идеи на завтрак, обед, ужин и перекус под твои цели.")
      ),

      // Поиск
      React.createElement("input", {
        value: query, onChange: e => setQuery(e.target.value), placeholder: "Поиск: лосось, печень, чернослив…",
        "aria-label": "Поиск рецептов",
        style: { width: "100%", padding: "10px 12px", borderRadius: 10, border: `0.5px solid ${C.border}`, background: C.card, fontSize: 13, fontFamily: "inherit", color: C.text, boxSizing: "border-box", outline: "none", marginBottom: 10 }
      }),
      // Переключатель режима: по типу блюда / по цели
      React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 10 } },
        [["type", "🍽 По типу блюда"], ["goal", "🎯 По цели"]].map(m => React.createElement("button", { key: m[0],
          onClick: () => { setViewMode(m[0]); setChapter("all"); setFilter("all"); },
          style: { flex: 1, padding: "9px 4px", borderRadius: 9, border: `0.5px solid ${viewMode === m[0] ? C.olive : C.border}`, background: viewMode === m[0] ? C.oliveSoft : "transparent", color: viewMode === m[0] ? C.oliveDeep : C.textM, fontSize: 12.5, fontWeight: viewMode === m[0] ? 700 : 500, cursor: "pointer", fontFamily: "inherit" } }, m[1]))
      ),
      // Чипсы выбора — зависят от режима. Избранное доступно всегда.
      React.createElement("div", { style: { display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4, marginBottom: 12 } },
        viewMode === "goal"
          ? [{ id: "fav", l: "⭐ Избранное" }].concat(RECIPE_FILTERS).map(f => React.createElement("button", { key: f.id, onClick: () => setFilter(f.id),
              style: { padding: "7px 12px", borderRadius: 999, border: "none", whiteSpace: "nowrap", flexShrink: 0,
                background: filter === f.id ? C.olive : C.bgWarm, color: filter === f.id ? "#fff" : C.textM,
                fontSize: 11.5, fontWeight: filter === f.id ? 600 : 500, cursor: "pointer", fontFamily: "inherit" } }, f.l))
          : [{ id: "all", l: "Все" }, { id: "fav", l: "⭐ Избранное" }].concat(RECIPE_CHAPTERS).map(c => React.createElement("button", { key: c.id,
              onClick: () => { c.id === "fav" ? (setFilter("fav"), setChapter("all")) : (setChapter(c.id), setFilter("all")); },
              style: { padding: "7px 12px", borderRadius: 999, border: "none", whiteSpace: "nowrap", flexShrink: 0,
                background: (c.id === "fav" ? filter === "fav" : (chapter === c.id && filter !== "fav")) ? C.olive : C.bgWarm,
                color: (c.id === "fav" ? filter === "fav" : (chapter === c.id && filter !== "fav")) ? "#fff" : C.textM,
                fontSize: 11.5, fontWeight: "500", cursor: "pointer", fontFamily: "inherit" } }, c.l))
      ),
      // Счётчик
      React.createElement("div", { style: { fontSize: 11, color: C.textL, marginBottom: 10 } }, "Найдено: ", list.length),
      // Список по главам
      list.length === 0
        ? React.createElement("div", { style: { textAlign: "center", padding: "30px 20px", color: C.textM, fontSize: 13 } }, filter === "fav" ? "Здесь будут твои избранные рецепты — нажми ⭐ на любом." : "Ничего не нашлось. Попробуй другой запрос или сбрось фильтры.")
        : RECIPE_CHAPTERS.filter(c => byChapter[c.id]).map(c => React.createElement("div", { key: c.id, style: { marginBottom: 16 } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.oliveDeep, marginBottom: 8 } }, c.l),
            byChapter[c.id].map(r => React.createElement("div", { key: r.id, style: { position: "relative", marginBottom: 6 } },
              React.createElement("button", { onClick: () => setOpenId(r.id),
                style: { width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10, background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 11, padding: "11px 40px 11px 13px", cursor: "pointer", fontFamily: "inherit" } },
                React.createElement("div", { style: { flex: 1 } },
                  React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 } }, r.name),
                  React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } },
                    React.createElement("span", { style: { fontSize: 11, color: C.textM } }, "⏱ ", r.time, " мин · ", r.kbju.k, " ккал/100г · ", r.kbju.p, "г белка"),
                    (r.tags || []).filter(t => t !== "до 20 мин").slice(0, 2).map((t, i) => React.createElement("span", { key: i, style: { fontSize: 9.5, color: C.oliveDeep, background: C.oliveSoft, borderRadius: 999, padding: "2px 7px" } }, t))
                  )
                )
              ),
              React.createElement("button", { onClick: (e) => toggleFav(r.id, e), "aria-label": "В избранное",
                style: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: favs.includes(r.id) ? C.sand : C.border, fontFamily: "inherit", lineHeight: 1 } }, favs.includes(r.id) ? "★" : "☆")
            ))
          )),
      React.createElement("div", { style: { fontSize: 11, color: C.textL, lineHeight: 1.5, marginTop: 8, padding: "10px 12px", background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 9 } },
        "Рецепты из книги «Сергей & Маша». КБЖУ указаны на 100 г; порции и заметки в блоке «Маше» уже адаптированы под тебя и фазы плана.")
    );
  }
  // GoalsTab — ориентиры КБЖУ + мягкий дневник съеденного (без давления).
  function GoalsTab() {
    const todayK = new Date().toLocaleDateString("ru-RU");
    const [diary, setDiary] = useLS("foodDiaryV1", {});
    const [gutDays, setGutDays] = useLS("gutFoodDaysV1", {});
    const [showRef, setShowRef] = useLS("goalsRefOpen", true);
    const [pickerMeal, setPickerMeal] = useState(null); // null | breakfast|lunch|dinner|snack
    const [q, setQ] = useState("");
    const [grams, setGrams] = useState("");           // граммы для выбранного рецепта
    const [pendingRecipe, setPendingRecipe] = useState(null); // рецепт, ждущий граммовки
    const [cName, setCName] = useState(""); const [cK, setCK] = useState(""); const [cP, setCP] = useState(""); const [cF, setCF] = useState(""); const [cC, setCC] = useState("");

    const todayItems = diary[todayK] || [];
    const gutToday = !!gutDays[todayK];
    const sum = todayItems.reduce((a, it) => ({ k: a.k + (it.k || 0), p: a.p + (it.p || 0), f: a.f + (it.f || 0), c: a.c + (it.c || 0) }), { k: 0, p: 0, f: 0, c: 0 });

    const MEALS = [{ id: "breakfast", l: "Завтрак" }, { id: "lunch", l: "Обед" }, { id: "dinner", l: "Ужин" }, { id: "snack", l: "Перекус" }];
    const mealLabel = (id) => (MEALS.find(m => m.id === id) || {}).l || "Другое";

    const addItem = (it) => { setDiary({ ...diary, [todayK]: [...todayItems, it] }); };
    const removeItem = (idx) => { const arr = todayItems.slice(); arr.splice(idx, 1); setDiary({ ...diary, [todayK]: arr }); };
    const toggleGut = () => { setGutDays({ ...gutDays, [todayK]: !gutToday }); };

    // Добавление рецепта с граммовкой: КБЖУ на 100 г → пересчёт на съеденные граммы
    const addRecipeWithGrams = () => {
      if (!pendingRecipe) return;
      const g = parseFloat(grams) || 100;
      const f = g / 100;
      const r = pendingRecipe;
      addItem({ name: r.name + " (" + Math.round(g) + " г)", meal: pickerMeal,
        k: Math.round(r.kbju.k * f), p: Math.round(r.kbju.p * f), f: Math.round(r.kbju.f * f), c: Math.round(r.kbju.c * f) });
      setPendingRecipe(null); setGrams(""); setQ("");
    };
    const addCustom = () => {
      if (!cName.trim()) return;
      addItem({ name: cName.trim(), meal: pickerMeal, custom: true,
        k: parseInt(cK) || 0, p: parseInt(cP) || 0, f: parseInt(cF) || 0, c: parseInt(cC) || 0 });
      setCName(""); setCK(""); setCP(""); setCF(""); setCC("");
    };
    const repeatItem = (it) => { addItem({ ...it }); };

    const norm = (s) => (s || "").toLowerCase().replace(/ё/g, "е");
    const found = q.trim() ? RECIPES.filter(r => norm(r.name).includes(norm(q))).slice(0, 8) : [];

    const numInput = (val, set, ph) => React.createElement("input", { value: val, onChange: e => set(e.target.value), placeholder: ph, inputMode: "numeric",
      style: { flex: 1, minWidth: 0, padding: "8px 8px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.bg, fontSize: 12, fontFamily: "inherit", color: C.text, boxSizing: "border-box", outline: "none" } });

    // Блок «добавить» для конкретного приёма пищи
    const pickerBlock = (mealId) => React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.olive}55`, borderRadius: 12, padding: "12px 14px", marginBottom: 10 } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
        React.createElement("div", { style: { fontSize: 12.5, fontWeight: 700, color: C.text } }, "Добавить в «" + mealLabel(mealId) + "»"),
        React.createElement("button", { onClick: () => { setPickerMeal(null); setPendingRecipe(null); setQ(""); }, style: { background: "none", border: "none", fontSize: 12, color: C.textL, cursor: "pointer", fontFamily: "inherit" } }, "закрыть")),
      // Если рецепт выбран — спрашиваем граммы
      pendingRecipe
        ? React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 12.5, color: C.text, fontWeight: 600, marginBottom: 2 } }, pendingRecipe.name),
            React.createElement("div", { style: { fontSize: 10.5, color: C.textM, marginBottom: 8 } }, "на 100 г: ", pendingRecipe.kbju.k, " ккал · Б", pendingRecipe.kbju.p, " Ж", pendingRecipe.kbju.f, " У", pendingRecipe.kbju.c),
            React.createElement("div", { style: { fontSize: 11.5, color: C.textM, marginBottom: 4 } }, "Сколько грамм съела?"),
            React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8 } },
              React.createElement("input", { value: grams, onChange: e => setGrams(e.target.value), placeholder: "напр. 250", inputMode: "numeric", autoFocus: true,
                style: { flex: 1, padding: "9px 11px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: "inherit", color: C.text, boxSizing: "border-box", outline: "none" } }),
              [150, 200, 250, 300].map(g => React.createElement("button", { key: g, onClick: () => setGrams(String(g)),
                style: { padding: "0 9px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: grams === String(g) ? C.oliveSoft : C.bg, color: C.textM, fontSize: 11, cursor: "pointer", fontFamily: "inherit" } }, g))),
            grams && React.createElement("div", { style: { fontSize: 11, color: C.oliveDeep, marginBottom: 8 } }, "= ", Math.round(pendingRecipe.kbju.k * (parseFloat(grams) || 0) / 100), " ккал · Б", Math.round(pendingRecipe.kbju.p * (parseFloat(grams) || 0) / 100), " Ж", Math.round(pendingRecipe.kbju.f * (parseFloat(grams) || 0) / 100), " У", Math.round(pendingRecipe.kbju.c * (parseFloat(grams) || 0) / 100)),
            React.createElement("div", { style: { display: "flex", gap: 6 } },
              React.createElement("button", { onClick: () => setPendingRecipe(null), style: { padding: "9px 12px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.bg, color: C.textM, fontSize: 12, cursor: "pointer", fontFamily: "inherit" } }, "← назад"),
              React.createElement("button", { onClick: addRecipeWithGrams, style: { flex: 1, padding: "9px", borderRadius: 8, border: "none", background: C.olive, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, "Добавить"))
          )
        : React.createElement("div", null,
            React.createElement("input", { value: q, onChange: e => setQ(e.target.value), placeholder: "Найти рецепт: лосось, печень…",
              style: { width: "100%", padding: "9px 11px", borderRadius: 9, border: `0.5px solid ${C.border}`, background: C.bg, fontSize: 12.5, fontFamily: "inherit", color: C.text, boxSizing: "border-box", outline: "none", marginBottom: 8 } }),
            found.map(r => React.createElement("button", { key: r.id, onClick: () => { setPendingRecipe(r); setGrams("250"); },
              style: { width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", gap: 8, background: C.bgWarm, border: "none", borderRadius: 8, padding: "9px 11px", marginBottom: 5, cursor: "pointer", fontFamily: "inherit" } },
              React.createElement("span", { style: { fontSize: 12, color: C.text } }, r.name),
              React.createElement("span", { style: { fontSize: 11, color: C.textM, flexShrink: 0 } }, r.kbju.k, " ккал/100г"))),
            React.createElement("div", { style: { borderTop: `0.5px solid ${C.border}`, paddingTop: 10, marginTop: 4 } },
              React.createElement("div", { style: { fontSize: 11.5, fontWeight: 600, color: C.textM, marginBottom: 6 } }, "Или вручную (весь КБЖУ):"),
              React.createElement("input", { value: cName, onChange: e => setCName(e.target.value), placeholder: "Название",
                style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.bg, fontSize: 12, fontFamily: "inherit", color: C.text, boxSizing: "border-box", outline: "none", marginBottom: 6 } }),
              React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8 } },
                numInput(cK, setCK, "ккал"), numInput(cP, setCP, "белок"), numInput(cF, setCF, "жиры"), numInput(cC, setCC, "углев")),
              React.createElement("button", { onClick: addCustom,
                style: { width: "100%", padding: "9px", borderRadius: 8, border: "none", background: C.olive, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, "Добавить вручную"))
          )
    );

    return React.createElement("div", null,
      // Ориентиры
      React.createElement("div", { style: { background: C.card, borderRadius: 12, padding: "12px 14px", marginBottom: 12, border: `1px solid ${C.border}` } },
        React.createElement("button", { onClick: () => setShowRef(!showRef), style: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" } },
          React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, "📊 Мои ориентиры"),
          React.createElement("span", { style: { fontSize: 11, color: C.textL } }, showRef ? "скрыть ▲" : "показать ▼")),
        showRef && React.createElement("div", { style: { marginTop: 10, fontSize: 12, color: C.text, lineHeight: 1.6 } },
          React.createElement("div", null, "🔸 День без тренировки: ~", React.createElement("b", null, "1650 ккал")),
          React.createElement("div", null, "🔸 День тренировки: ~", React.createElement("b", null, "1750–1850 ккал")),
          React.createElement("div", null, "🔸 Белок: ", React.createElement("b", null, "90–105 г"), " · Жиры: ", React.createElement("b", null, "45–55 г"), " · Клетчатка: ", React.createElement("b", null, "≥30–35 г")),
          React.createElement("div", { style: { marginTop: 8, fontSize: 10.5, color: C.textL, lineHeight: 1.5, paddingTop: 8, borderTop: `0.5px solid ${C.border}` } },
            "Ориентир, не жёсткая норма. СПКЯ и щитовидка меняют реальный расход на ±200 ккал. Если устаёшь, мёрзнешь или сильнее лезут волосы — это сигнал, что мало. Сверь с врачом/диетологом.")
        )
      ),
      // Сегодняшний итог — все 4 макроса
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.oliveDeep, marginBottom: 8 } }, "🍽 Сегодня съедено"),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          [["ккал", sum.k, "~1650–1850"], ["белок", sum.p + "г", "90–105"], ["жиры", sum.f + "г", "45–55"], ["углев", sum.c + "г", ""]].map((m, i) =>
            React.createElement("div", { key: i, style: { flex: 1, textAlign: "center" } },
              React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: C.text } }, m[1]),
              React.createElement("div", { style: { fontSize: 9, color: C.textM, marginTop: 1 } }, m[0]),
              m[2] && React.createElement("div", { style: { fontSize: 8.5, color: C.textL } }, m[2])
            ))
        ),
        React.createElement("div", { style: { fontSize: 10, color: C.textL, marginTop: 8, lineHeight: 1.5 } }, "Примерная картина, не точный подсчёт. Цель — общее представление, а не контроль каждой калории.")
      ),
      // Галочка «ела для ЖКТ»
      React.createElement("button", { onClick: toggleGut,
        style: { width: "100%", display: "flex", alignItems: "center", gap: 10, background: gutToday ? C.oliveSoft : C.card, border: `0.5px solid ${gutToday ? C.olive : C.border}`, borderRadius: 11, padding: "11px 13px", marginBottom: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" } },
        React.createElement("div", { style: { width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${C.olive}`, background: gutToday ? C.olive : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
          gutToday && React.createElement("span", { style: { color: "#fff", fontSize: 13 } }, "✓")),
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 12.5, fontWeight: 600, color: C.text } }, "Сегодня ела для ЖКТ"),
          React.createElement("div", { style: { fontSize: 10.5, color: C.textM, lineHeight: 1.4 } }, "киви, чернослив, псиллиум, бобовые, овёс/отруби"))
      ),
      // Список съеденного по приёмам пищи
      MEALS.map(meal => {
        const items = todayItems.map((it, idx) => ({ it, idx })).filter(x => (x.it.meal || "snack") === meal.id);
        if (items.length === 0 && pickerMeal !== meal.id) {
          return React.createElement("button", { key: meal.id, onClick: () => { setPickerMeal(meal.id); setPendingRecipe(null); },
            style: { width: "100%", textAlign: "left", background: "none", border: `1px dashed ${C.border}`, borderRadius: 10, padding: "10px 13px", marginBottom: 8, cursor: "pointer", fontFamily: "inherit", color: C.textL, fontSize: 12 } },
            "+ " + meal.l);
        }
        return React.createElement("div", { key: meal.id, style: { marginBottom: 8 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 } },
            React.createElement("div", { style: { fontSize: 11.5, fontWeight: 700, color: C.oliveDeep } }, meal.l),
            React.createElement("button", { onClick: () => { setPickerMeal(meal.id); setPendingRecipe(null); }, style: { fontSize: 11, color: C.oliveDeep, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" } }, "+ добавить")),
          items.map(({ it, idx }) => React.createElement("div", { key: idx, style: { display: "flex", alignItems: "center", gap: 8, background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 9, padding: "9px 12px", marginBottom: 5 } },
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { style: { fontSize: 12.5, color: C.text, fontWeight: 500 } }, it.name),
              React.createElement("div", { style: { fontSize: 10.5, color: C.textM } }, it.k, " ккал · Б", it.p || 0, " Ж", it.f || 0, " У", it.c || 0)),
            React.createElement("button", { onClick: () => repeatItem(it), "aria-label": "Повторить", title: "Повторить", style: { background: "none", border: "none", fontSize: 14, color: C.textL, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 } }, "⟳"),
            React.createElement("button", { onClick: () => removeItem(idx), "aria-label": "Убрать", style: { background: "none", border: "none", fontSize: 16, color: C.textL, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 } }, "×")
          )),
          pickerMeal === meal.id && pickerBlock(meal.id)
        );
      }),
      React.createElement("div", { style: { fontSize: 10.5, color: C.textL, lineHeight: 1.5, marginTop: 8, padding: "10px 12px", background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 9 } },
        "Дневник — для мягкого ориентира, не для строгого контроля. Записи хранятся на этом устройстве.")
    );
  }

  function CalorieCalc() {
    const FOODS = [
      { n: "\u041A\u0443\u0440\u0438\u043D\u0430\u044F \u0433\u0440\u0443\u0434\u043A\u0430", per100: { k: 155, p: 30, f: 3, c: 0 } },
      { n: "\u041A\u0443\u0440\u0438\u043D\u044B\u0435 \u0431\u0451\u0434\u0440\u0430", per100: { k: 195, p: 22, f: 11, c: 1 } },
      { n: "\u041B\u043E\u0441\u043E\u0441\u044C", per100: { k: 195, p: 22, f: 11, c: 0 } },
      { n: "\u0422\u0443\u043D\u0435\u0446", per100: { k: 145, p: 24, f: 5, c: 0 } },
      { n: "\u0422\u0440\u0435\u0441\u043A\u0430", per100: { k: 75, p: 17, f: 1, c: 0 } },
      { n: "\u0413\u043E\u0432\u044F\u0434\u0438\u043D\u0430", per100: { k: 187, p: 29, f: 7, c: 0 } },
      { n: "\u0424\u0430\u0440\u0448 \u0438\u043D\u0434\u0435\u0439\u043A\u0438", per100: { k: 160, p: 20, f: 9, c: 0 } },
      { n: "\u042F\u0439\u0446\u043E", per100: { k: 155, p: 13, f: 11, c: 1 } },
      { n: "\u0422\u0432\u043E\u0440\u043E\u0433 5%", per100: { k: 121, p: 18, f: 5, c: 3 } },
      { n: "\u0419\u043E\u0433\u0443\u0440\u0442 \u0433\u0440\u0435\u0447\u0435\u0441\u043A\u0438\u0439", per100: { k: 70, p: 10, f: 2, c: 4 } },
      { n: "\u0424\u0435\u0442\u0430", per100: { k: 264, p: 14, f: 21, c: 4 } },
      { n: "\u041E\u0432\u0441\u044F\u043D\u043A\u0430", per100: { k: 370, p: 13, f: 7, c: 62 } },
      { n: "\u0413\u0440\u0435\u0447\u043A\u0430 \u0432\u0430\u0440\u0451\u043D\u0430\u044F", per100: { k: 110, p: 4, f: 1, c: 22 } },
      { n: "\u0420\u0438\u0441 \u0431\u0443\u0440\u044B\u0439 \u0432\u0430\u0440\u0451\u043D\u044B\u0439", per100: { k: 110, p: 3, f: 1, c: 23 } },
      { n: "\u041F\u0430\u0441\u0442\u0430 \u0432\u0430\u0440\u0451\u043D\u0430\u044F", per100: { k: 157, p: 6, f: 1, c: 31 } },
      { n: "\u041D\u0443\u0442", per100: { k: 100, p: 7, f: 2, c: 16 } },
      { n: "\u0411\u0430\u0442\u0430\u0442", per100: { k: 86, p: 2, f: 0, c: 20 } },
      { n: "\u0410\u0432\u043E\u043A\u0430\u0434\u043E", per100: { k: 160, p: 2, f: 15, c: 5 } },
      { n: "\u0411\u0430\u043D\u0430\u043D", per100: { k: 89, p: 1, f: 0, c: 23 } },
      { n: "\u0411\u0440\u043E\u043A\u043A\u043E\u043B\u0438", per100: { k: 35, p: 3, f: 0, c: 5 } },
      { n: "\u0428\u043F\u0438\u043D\u0430\u0442", per100: { k: 23, p: 3, f: 0, c: 2 } },
      { n: "\u041A\u0430\u0431\u0430\u0447\u043E\u043A", per100: { k: 24, p: 2, f: 0, c: 5 } },
      { n: "\u041F\u043E\u043C\u0438\u0434\u043E\u0440", per100: { k: 18, p: 1, f: 0, c: 4 } },
      { n: "\u041E\u043B\u0438\u0432\u043A\u043E\u0432\u043E\u0435 \u043C\u0430\u0441\u043B\u043E", per100: { k: 884, p: 0, f: 100, c: 0 } },
      { n: "\u041C\u0438\u043D\u0434\u0430\u043B\u044C", per100: { k: 579, p: 21, f: 50, c: 10 } },
      { n: "\u0421\u0435\u043C\u0435\u043D\u0430 \u0447\u0438\u0430", per100: { k: 490, p: 17, f: 31, c: 42 } },
      { n: "\u0421\u043C\u0435\u0442\u0430\u043D\u0430 15%", per100: { k: 160, p: 3, f: 15, c: 4 } }
    ];
    const [query, setQuery] = useState("");
    const [grams, setGrams] = useState("100");
    const [result, setResult] = useState(null);
    const [log, setLog] = useState([]);
    const [goalKcal] = useLS("nKcal", 1750);
    const doSearch = () => {
      const q = query.toLowerCase().trim();
      if (!q) return;
      const found = FOODS.find((f) => f.n.toLowerCase().includes(q));
      if (found) {
        const g = parseFloat(grams) || 100, m = g / 100;
        setResult({ name: found.n, grams: g, k: Math.round(found.per100.k * m), p: Math.round(found.per100.p * m * 10) / 10, f: Math.round(found.per100.f * m * 10) / 10, c: Math.round(found.per100.c * m * 10) / 10 });
      } else setResult({ name: query, notFound: true });
    };
    const addLog = () => {
      if (result && !result.notFound) {
        setLog((l) => [...l, result]);
        setResult(null);
        setQuery("");
        setGrams("100");
      }
    };
    const tot = log.reduce((a, i) => ({ k: a.k + i.k, p: a.p + i.p, f: a.f + i.f, c: a.c + i.c }), { k: 0, p: 0, f: 0, c: 0 });
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: C.card, borderRadius: 12, padding: "12px 14px", marginBottom: 10, boxShadow: C.shadow, border: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, "🔢 \u0421\u0447\u0451\u0442\u0447\u0438\u043A \u041A\u0411\u0416\u0423"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } }, "\u0412\u0432\u0435\u0434\u0438 \u043F\u0440\u043E\u0434\u0443\u043A\u0442 \u0438 \u0433\u0440\u0430\u043C\u043C\u044B \u2014 \u0434\u043E\u0431\u0430\u0432\u044C \u0432 \u0434\u043D\u0435\u0432\u043D\u0438\u043A \u0434\u043D\u044F.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("input", { value: query, onChange: (e) => setQuery(e.target.value), onKeyDown: (e) => e.key === "Enter" && doSearch(), placeholder: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442 (\u043A\u0443\u0440\u0438\u0446\u0430, \u044F\u0439\u0446\u043E...)", style: { flex: 2, padding: "9px 11px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: "inherit", color: C.text, outline: "none" } }), /* @__PURE__ */ React.createElement("input", { value: grams, onChange: (e) => setGrams(e.target.value), type: "number", placeholder: "100", style: { width: 56, padding: "9px 8px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: "inherit", color: C.text, outline: "none" } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textL } }, "\u0433"), /* @__PURE__ */ React.createElement("button", { onClick: doSearch, style: { padding: "9px 12px", borderRadius: 8, background: C.olive, border: "none", color: C.white, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" } }, "\u2192")), result && /* @__PURE__ */ React.createElement("div", { style: { background: C.card, borderRadius: 10, padding: "11px 13px", marginBottom: 8, border: `1.5px solid ${result.notFound ? C.border : C.olive + "55"}`, boxShadow: C.shadow } }, result.notFound ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.textM } }, "\xAB", result.name, "\xBB \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439: \u043A\u0443\u0440\u0438\u0446\u0430, \u044F\u0439\u0446\u043E, \u0433\u0440\u0435\u0447\u043A\u0430, \u0442\u0432\u043E\u0440\u043E\u0433...") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 } }, result.name, " \xB7 ", result.grams, "\u0433"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 10 } }, [{ l: "\u041A\u043A\u0430\u043B", v: result.k, c: C.text }, { l: "\u0411\u0435\u043B\u043E\u043A", v: result.p + "\u0433", c: C.olive }, { l: "\u0416\u0438\u0440\u044B", v: result.f + "\u0433", c: C.sand }, { l: "\u0423\u0433\u043B\u0435\u0432.", v: result.c + "\u0433", c: C.bark }].map((it) => /* @__PURE__ */ React.createElement("div", { key: it.l, style: { flex: 1, background: C.bgWarm, borderRadius: 8, padding: "7px 4px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: it.c } }, it.v), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: C.textL } }, it.l)))), /* @__PURE__ */ React.createElement("button", { onClick: addLog, style: { width: "100%", padding: "8px", borderRadius: 8, background: C.oliveSoft, border: `1px solid ${C.olive}44`, color: C.oliveDeep, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" } }, "+ \u0412 \u0434\u043D\u0435\u0432\u043D\u0438\u043A"))), log.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { background: C.card, borderRadius: 10, padding: "11px 13px", boxShadow: C.shadow, border: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.text } }, "\u0414\u043D\u0435\u0432\u043D\u0438\u043A \u043F\u0438\u0442\u0430\u043D\u0438\u044F"), /* @__PURE__ */ React.createElement("button", { onClick: () => setLog([]), style: { background: "none", border: "none", cursor: "pointer", fontSize: 10, color: C.textL, fontFamily: "inherit" } }, "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C")), log.map((item, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.text } }, item.name, " ", item.grams, "\u0433"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.olive, fontWeight: 700 } }, item.k, " \u043A\u043A\u0430\u043B"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, padding: "9px", background: C.bgWarm, borderRadius: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 5 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, "\u0418\u0442\u043E\u0433\u043E: ", tot.k, " \u043A\u043A\u0430\u043B"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: tot.k > goalKcal ? C.warn : C.olive } }, tot.k > goalKcal ? `+${tot.k - Number(goalKcal)} \u0441\u0432\u0435\u0440\u0445` : `${Number(goalKcal) - tot.k} \u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C`)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, [{ l: "\u0411", v: Math.round(tot.p), c: C.olive }, { l: "\u0416", v: Math.round(tot.f), c: C.sand }, { l: "\u0423", v: Math.round(tot.c), c: C.bark }].map((it) => /* @__PURE__ */ React.createElement("div", { key: it.l, style: { flex: 1, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: it.c } }, it.v, "\u0433"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: C.textL } }, it.l)))))));
  }
  const HOME_CATS = [
    {
      cat: "\u0420\u0430\u0441\u0441\u043B\u0430\u0431\u043B\u0435\u043D\u0438\u0435 \u0442\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u0434\u043D\u0430",
      clr: C.olive,
      clrS: C.oliveSoft,
      urgent: true,
      warn: "\u041F\u0440\u0438 \u0441\u043F\u0430\u0437\u043C\u0435 (\u0433\u0438\u043F\u0435\u0440\u0442\u043E\u043D\u0443\u0441\u0435) \u0443\u043F\u0440\u0430\u0436\u043D\u0435\u043D\u0438\u044F \u041A\u0435\u0433\u0435\u043B\u044F \u043F\u0440\u043E\u0442\u0438\u0432\u043E\u043F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u0431\u0435\u0437 \u043F\u0440\u0435\u0434\u0432\u0430\u0440\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u0440\u0430\u0441\u0441\u043B\u0430\u0431\u043B\u0435\u043D\u0438\u044F. \u041D\u0430\u0447\u043D\u0438 \u0437\u0434\u0435\u0441\u044C.",
      items: [
        {
          name: "\u0414\u0438\u0430\u0444\u0440\u0430\u0433\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u0434\u044B\u0445\u0430\u043D\u0438\u0435",
          freq: "\u041A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C, \u0443\u0442\u0440\u043E\u043C \u0438 \u0432\u0435\u0447\u0435\u0440\u043E\u043C",
          dur: "5\u201310 \u043C\u0438\u043D",
          how: "\u041B\u0451\u0436\u0430 \u043D\u0430 \u0441\u043F\u0438\u043D\u0435, \u043D\u043E\u0433\u0438 \u0441\u043E\u0433\u043D\u0443\u0442\u044B. \u041E\u0434\u043D\u0430 \u0440\u0443\u043A\u0430 \u043D\u0430 \u0436\u0438\u0432\u043E\u0442\u0435. \u0412\u0434\u043E\u0445 \u043D\u043E\u0441\u043E\u043C \u2014 \u0436\u0438\u0432\u043E\u0442 \u043F\u043E\u0434\u043D\u0438\u043C\u0430\u0435\u0442\u0441\u044F, \u0433\u0440\u0443\u0434\u044C \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F. \u0412\u044B\u0434\u043E\u0445 \u0440\u0442\u043E\u043C. \u041D\u0430 \u043A\u0430\u0436\u0434\u043E\u043C \u0432\u0434\u043E\u0445\u0435 \u0442\u0430\u0437\u043E\u0432\u043E\u0435 \u0434\u043D\u043E \u0440\u0430\u0441\u0441\u043B\u0430\u0431\u043B\u044F\u0435\u0442\u0441\u044F \u0438 \u043E\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F \u0432\u043D\u0438\u0437.",
          why: "\u0414\u0438\u0430\u0444\u0440\u0430\u0433\u043C\u0430 \u0438 \u0442\u0430\u0437\u043E\u0432\u043E\u0435 \u0434\u043D\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u043D\u043E. \u042D\u0442\u043E \u043E\u0441\u043D\u043E\u0432\u0430 \u0441\u043D\u044F\u0442\u0438\u044F \u0441\u043F\u0430\u0437\u043C\u0430."
        },
        {
          name: "Happy Baby (\u0441\u0447\u0430\u0441\u0442\u043B\u0438\u0432\u044B\u0439 \u0440\u0435\u0431\u0451\u043D\u043E\u043A)",
          freq: "\u041A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C",
          dur: "2\u20133 \u043C\u0438\u043D",
          how: "\u041B\u0451\u0436\u0430 \u043D\u0430 \u0441\u043F\u0438\u043D\u0435. \u0421\u043E\u0433\u043D\u0438 \u043D\u043E\u0433\u0438, \u0432\u043E\u0437\u044C\u043C\u0438\u0441\u044C \u0437\u0430 \u0432\u043D\u0435\u0448\u043D\u0438\u0435 \u0441\u0442\u043E\u0440\u043E\u043D\u044B \u0441\u0442\u043E\u043F. \u041A\u043E\u043B\u0435\u043D\u0438 \u0442\u044F\u043D\u0438 \u043A \u043F\u043E\u0434\u043C\u044B\u0448\u043A\u0430\u043C \u0448\u0438\u0440\u043E\u043A\u043E. \u041F\u043E\u043A\u0430\u0447\u0430\u0439\u0441\u044F. \u0420\u0430\u0441\u0441\u043B\u0430\u0431\u044C \u043F\u0440\u043E\u043C\u0435\u0436\u043D\u043E\u0441\u0442\u044C \u0438 \u0436\u0438\u0432\u043E\u0442 \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E.",
          why: "\u041B\u0443\u0447\u0448\u0430\u044F \u043F\u043E\u0437\u0430 \u0434\u043B\u044F \u043C\u0435\u0445\u0430\u043D\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0440\u0430\u0441\u0441\u043B\u0430\u0431\u043B\u0435\u043D\u0438\u044F \u0442\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u0434\u043D\u0430."
        },
        {
          name: "\u0413\u043B\u0443\u0431\u043E\u043A\u0438\u0439 \u043F\u0440\u0438\u0441\u0435\u0434 (Malasana)",
          freq: "\u041A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C",
          dur: "30\u201390 \u0441\u0435\u043A",
          how: "\u0421\u0442\u043E\u043F\u044B \u0447\u0443\u0442\u044C \u0448\u0438\u0440\u0435 \u043F\u043B\u0435\u0447, \u043D\u043E\u0441\u043A\u0438 \u043D\u0430\u0440\u0443\u0436\u0443. \u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u043E\u043F\u0443\u0441\u0442\u0438\u0441\u044C \u0432 \u0433\u043B\u0443\u0431\u043E\u043A\u0438\u0439 \u043F\u0440\u0438\u0441\u0435\u0434. \u0414\u0435\u0440\u0436\u0438\u0441\u044C \u0437\u0430 \u0441\u0442\u0443\u043B \u0438\u043B\u0438 \u0441\u0442\u0435\u043D\u0443. \u041F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0440\u0430\u0441\u0441\u043B\u0430\u0431\u044C \u043F\u0440\u043E\u043C\u0435\u0436\u043D\u043E\u0441\u0442\u044C.",
          why: "\u041C\u044B\u0448\u0446\u044B \u0442\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u0434\u043D\u0430 \u0440\u0430\u0441\u0442\u044F\u0433\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0438 \u043E\u0442\u043F\u0443\u0441\u043A\u0430\u044E\u0442 \u0441\u043F\u0430\u0437\u043C \u043C\u0435\u0445\u0430\u043D\u0438\u0447\u0435\u0441\u043A\u0438."
        },
        {
          name: "\u0411\u0430\u0431\u043E\u0447\u043A\u0430 \u043B\u0451\u0436\u0430",
          freq: "\u041A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C",
          dur: "3 \u043C\u0438\u043D",
          how: "\u041B\u0451\u0436\u0430 \u043D\u0430 \u0441\u043F\u0438\u043D\u0435. \u0421\u0442\u043E\u043F\u044B \u0441\u0432\u0435\u0434\u0438, \u043A\u043E\u043B\u0435\u043D\u0438 \u0440\u0430\u0437\u0432\u0435\u0434\u0438 \u0432 \u0441\u0442\u043E\u0440\u043E\u043D\u044B. \u041D\u0435 \u0434\u0430\u0432\u043B\u0438 \u2014 \u043F\u043E\u0437\u0432\u043E\u043B\u044C \u0438\u043C \u043E\u043F\u0443\u0441\u043A\u0430\u0442\u044C\u0441\u044F. \u0420\u0430\u0441\u0441\u043B\u0430\u0431\u044C \u0436\u0438\u0432\u043E\u0442 \u0438 \u0442\u0430\u0437\u043E\u0432\u043E\u0435 \u0434\u043D\u043E.",
          why: "\u0420\u0430\u0441\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0442 \u043F\u0440\u0438\u0432\u043E\u0434\u044F\u0449\u0438\u0435 \u043C\u044B\u0448\u0446\u044B, \u043D\u0430\u043F\u0440\u044F\u043C\u0443\u044E \u0441\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0435 \u0441\u043E \u0441\u043F\u0430\u0437\u043C\u043E\u043C \u0442\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u0434\u043D\u0430."
        },
        {
          name: "\u0421\u0430\u043C\u043E\u043C\u0430\u0441\u0441\u0430\u0436 \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0435\u0439 \u0447\u0430\u0441\u0442\u0438 \u0431\u0451\u0434\u0435\u0440",
          freq: "3\u20134 \u0440\u0430\u0437\u0430 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E",
          dur: "5 \u043C\u0438\u043D",
          how: "\u0421\u0438\u0434\u044F \u0438\u043B\u0438 \u043B\u0451\u0436\u0430. \u041C\u044F\u0433\u043A\u043E \u0440\u0430\u0437\u043C\u0438\u043D\u0430\u0439 \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044E\u044E \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u0431\u0451\u0434\u0435\u0440 \u043E\u0442 \u043A\u043E\u043B\u0435\u043D\u0430 \u043A \u043F\u0430\u0445\u0443. \u0414\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443\u043C\u0435\u0440\u0435\u043D\u043D\u043E\u0435 \u2014 \u043D\u0435 \u0434\u043E \u0431\u043E\u043B\u0438. \u041D\u0430\u0439\u0434\u0438 \u043D\u0430\u043F\u0440\u044F\u0436\u0451\u043D\u043D\u044B\u0435 \u0442\u043E\u0447\u043A\u0438, \u0443\u0434\u0435\u0440\u0436\u0438 30\u201360 \u0441\u0435\u043A.",
          why: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u0431\u0435\u0434\u0440\u0430 \u043D\u0430\u043F\u0440\u044F\u043C\u0443\u044E \u0441\u0432\u044F\u0437\u0430\u043D\u0430 \u0441 \u0442\u0430\u0437\u043E\u0432\u044B\u043C \u0434\u043D\u043E\u043C."
        }
      ]
    },
    {
      cat: "\u041A\u043E\u0440 \u0438 \u0441\u043F\u0438\u043D\u0430 \u0434\u043E\u043C\u0430",
      clr: C.sand,
      clrS: C.sandSoft,
      urgent: false,
      warn: null,
      items: [
        {
          name: "Dead Bug",
          freq: "3\u20134 \u0440\u0430\u0437\u0430 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E",
          dur: "3 \xD7 8/\u0441\u0442\u043E\u0440\u043E\u043D\u0443",
          how: "\u041B\u0451\u0436\u0430 \u043D\u0430 \u0441\u043F\u0438\u043D\u0435. \u0420\u0443\u043A\u0438 \u0432\u0432\u0435\u0440\u0445, \u043D\u043E\u0433\u0438 90\xB0. \u041F\u0440\u0438\u0436\u043C\u0438 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0443. \u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u0432\u044B\u0442\u044F\u043D\u0438 \u043F\u0440\u0430\u0432\u0443\u044E \u0440\u0443\u043A\u0443 \u0438 \u043B\u0435\u0432\u0443\u044E \u043D\u043E\u0433\u0443. \u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438 \u0432 5\u201310 \u0441\u043C \u043E\u0442 \u043F\u043E\u043B\u0430. \u0427\u0435\u0440\u0435\u0434\u0443\u0439. \u0422\u043E\u043B\u044C\u043A\u043E \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E.",
          why: "\u041B\u0443\u0447\u0448\u0435\u0435 \u0443\u043F\u0440\u0430\u0436\u043D\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u0441\u0442\u0430\u0431\u0438\u043B\u0438\u0437\u0430\u0446\u0438\u0438 \u043F\u043E\u0437\u0432\u043E\u043D\u043E\u0447\u043D\u0438\u043A\u0430 \u043F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435."
        },
        {
          name: "Bird Dog",
          freq: "3\u20134 \u0440\u0430\u0437\u0430 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E",
          dur: "3 \xD7 8/\u0441\u0442\u043E\u0440\u043E\u043D\u0443",
          how: "\u041D\u0430 \u0447\u0435\u0442\u0432\u0435\u0440\u0435\u043D\u044C\u043A\u0430\u0445. \u041E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u0432\u044B\u0442\u044F\u043D\u0438 \u043F\u0440\u043E\u0442\u0438\u0432\u043E\u043F\u043E\u043B\u043E\u0436\u043D\u044B\u0435 \u0440\u0443\u043A\u0443 \u0438 \u043D\u043E\u0433\u0443. \u0421\u043F\u0438\u043D\u0430 \u2014 \u0433\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u0442\u043E\u043B. \u0417\u0430\u0434\u0435\u0440\u0436\u0438\u0441\u044C 2\u20133 \u0441\u0435\u043A.",
          why: "\u0423\u043A\u0440\u0435\u043F\u043B\u044F\u0435\u0442 \u0433\u043B\u0443\u0431\u043E\u043A\u0438\u0435 \u043C\u044B\u0448\u0446\u044B \u043F\u043E\u0437\u0432\u043E\u043D\u043E\u0447\u043D\u0438\u043A\u0430 \u2014 \u0432\u0430\u0436\u043D\u0435\u0439\u0448\u0438\u0435 \u043F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435."
        },
        {
          name: "\u0411\u043E\u043A\u043E\u0432\u0430\u044F \u043F\u043B\u0430\u043D\u043A\u0430 \u0441 \u043A\u043E\u043B\u0435\u043D\u0430",
          freq: "3\u20134 \u0440\u0430\u0437\u0430 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E",
          dur: "3 \xD7 25 \u0441\u0435\u043A/\u0441\u0442\u043E\u0440\u043E\u043D\u0443",
          how: "\u041B\u0451\u0436\u0430 \u043D\u0430 \u0431\u043E\u043A\u0443, \u0443\u043F\u043E\u0440 \u043D\u0430 \u043F\u0440\u0435\u0434\u043F\u043B\u0435\u0447\u044C\u0435 \u0438 \u043A\u043E\u043B\u0435\u043D\u043E. \u041F\u043E\u0434\u043D\u0438\u043C\u0438 \u0442\u0430\u0437. \u0422\u0435\u043B\u043E \u043F\u0440\u044F\u043C\u0430\u044F \u043B\u0438\u043D\u0438\u044F. \u0421\u043B\u0430\u0431\u0443\u044E \u0441\u0442\u043E\u0440\u043E\u043D\u0443 \u0434\u0435\u0440\u0436\u0438 \u0434\u043E\u043B\u044C\u0448\u0435.",
          why: "\u0423\u0441\u0442\u0440\u0430\u043D\u044F\u0435\u0442 \u043C\u044B\u0448\u0435\u0447\u043D\u044B\u0439 \u0434\u0438\u0441\u0431\u0430\u043B\u0430\u043D\u0441 \u043F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435."
        },
        {
          name: "\u041A\u043E\u0448\u043A\u0430-\u043A\u043E\u0440\u043E\u0432\u0430",
          freq: "\u041A\u0430\u0436\u0434\u043E\u0435 \u0443\u0442\u0440\u043E",
          dur: "2\u20133 \u043C\u0438\u043D",
          how: "\u041D\u0430 \u0447\u0435\u0442\u0432\u0435\u0440\u0435\u043D\u044C\u043A\u0430\u0445. \u0412\u0434\u043E\u0445 \u2014 \u0436\u0438\u0432\u043E\u0442 \u0432\u043D\u0438\u0437, \u0441\u043F\u0438\u043D\u0430 \u043F\u0440\u043E\u0433\u0438\u0431\u0430\u0435\u0442\u0441\u044F. \u0412\u044B\u0434\u043E\u0445 \u2014 \u0441\u043F\u0438\u043D\u0430 \u0432\u044B\u0433\u0438\u0431\u0430\u0435\u0442\u0441\u044F \u0432\u0432\u0435\u0440\u0445, \u043F\u043E\u0434\u0431\u043E\u0440\u043E\u0434\u043E\u043A \u043A \u0433\u0440\u0443\u0434\u0438. \u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E.",
          why: "\u0421\u043D\u0438\u043C\u0430\u0435\u0442 \u0443\u0442\u0440\u0435\u043D\u043D\u044E\u044E \u0441\u043A\u043E\u0432\u0430\u043D\u043D\u043E\u0441\u0442\u044C \u043F\u043E\u0437\u0432\u043E\u043D\u043E\u0447\u043D\u0438\u043A\u0430."
        }
      ]
    },
    {
      cat: "\u042F\u0433\u043E\u0434\u0438\u0446\u044B \u0434\u043E\u043C\u0430",
      clr: C.olive,
      clrS: C.oliveSoft,
      urgent: false,
      warn: null,
      items: [
        {
          name: "\u042F\u0433\u043E\u0434\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u0441\u0442\u0438\u043A \u0441 \u0437\u0430\u0434\u0435\u0440\u0436\u043A\u043E\u0439",
          freq: "\u041C\u043E\u0436\u043D\u043E \u043A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C",
          dur: "3 \xD7 15",
          how: "\u041B\u0451\u0436\u0430, \u043D\u043E\u0433\u0438 \u0441\u043E\u0433\u043D\u0443\u0442\u044B. \u041F\u043E\u0434\u043D\u044F\u0442\u044C \u0442\u0430\u0437 \u0434\u043E \u043F\u0440\u044F\u043C\u043E\u0439 \u043B\u0438\u043D\u0438\u0438. \u0417\u0430\u0434\u0435\u0440\u0436\u0430\u0442\u044C 3 \u0441\u0435\u043A, \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E \u0441\u0436\u0438\u043C\u0430\u044F \u044F\u0433\u043E\u0434\u0438\u0446\u044B. \u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u043D\u0435 \u043A\u0430\u0441\u0430\u044F\u0441\u044C \u043F\u043E\u043B\u0430. \u041B\u0435\u043D\u0442\u0430 \u043D\u0430 \u0431\u0451\u0434\u0440\u0430\u0445 \u0443\u0434\u0432\u043E\u0438\u0442 \u044D\u0444\u0444\u0435\u043A\u0442.",
          why: "\u0410\u043A\u0442\u0438\u0432\u0438\u0440\u0443\u0435\u0442 \u0431\u043E\u043B\u044C\u0448\u0443\u044E \u044F\u0433\u043E\u0434\u0438\u0447\u043D\u0443\u044E \u0431\u0435\u0437 \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u043D\u0430 \u043F\u043E\u044F\u0441\u043D\u0438\u0446\u0443."
        },
        {
          name: "\u041F\u043E\u0436\u0430\u0440\u043D\u044B\u0439 \u0433\u0438\u0434\u0440\u0430\u043D\u0442",
          freq: "3\u20134 \u0440\u0430\u0437\u0430 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E",
          dur: "3 \xD7 15/\u0441\u0442\u043E\u0440\u043E\u043D\u0443",
          how: "\u041D\u0430 \u0447\u0435\u0442\u0432\u0435\u0440\u0435\u043D\u044C\u043A\u0430\u0445. \u041F\u043E\u0434\u043D\u0438\u043C\u0438 \u0441\u043E\u0433\u043D\u0443\u0442\u0443\u044E \u043D\u043E\u0433\u0443 \u0432 \u0441\u0442\u043E\u0440\u043E\u043D\u0443 \u2014 \u0431\u0435\u0434\u0440\u043E \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u044C\u043D\u043E \u043F\u043E\u043B\u0443. \u0422\u0430\u0437 \u043D\u0435 \u0437\u0430\u0432\u0430\u043B\u0438\u0432\u0430\u0439. \u041C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u043E\u043F\u0443\u0441\u0442\u0438.",
          why: "\u0418\u0437\u043E\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043D\u0430 \u0441\u0440\u0435\u0434\u043D\u044E\u044E \u044F\u0433\u043E\u0434\u0438\u0447\u043D\u0443\u044E \u2014 \u0434\u0430\u0451\u0442 \u043E\u043A\u0440\u0443\u0433\u043B\u043E\u0441\u0442\u044C."
        },
        {
          name: "\u041C\u043E\u0441\u0442\u0438\u043A \u043D\u0430 \u043E\u0434\u043D\u043E\u0439 \u043D\u043E\u0433\u0435",
          freq: "3\u20134 \u0440\u0430\u0437\u0430 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E",
          dur: "3 \xD7 10/\u043D\u043E\u0433\u0430",
          how: "\u041A\u0430\u043A \u043C\u043E\u0441\u0442\u0438\u043A, \u043D\u043E \u043E\u0434\u043D\u0430 \u043D\u043E\u0433\u0430 \u0432\u044B\u0442\u044F\u043D\u0443\u0442\u0430 \u0432\u0432\u0435\u0440\u0445. \u0422\u0430\u0437 \u0440\u043E\u0432\u043D\u044B\u0439 \u2014 \u043D\u0435 \u043F\u0435\u0440\u0435\u043A\u0430\u0448\u0438\u0432\u0430\u0439.",
          why: "\u0418\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442 \u043C\u044B\u0448\u0435\u0447\u043D\u044B\u0439 \u0434\u0438\u0441\u0431\u0430\u043B\u0430\u043D\u0441 \u043F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435."
        }
      ]
    }
  ];
  function ActivityRing({ pct, size, strokeWidth, color, bgColor, children }) {
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const off = circ - Math.min(pct, 100) / 100 * circ;
    return /* @__PURE__ */ React.createElement("div", { style: { position: "relative", width: size, height: size, flexShrink: 0 } },
      /* @__PURE__ */ React.createElement("svg", { width: size, height: size, style: { transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 } },
        /* @__PURE__ */ React.createElement("circle", { cx: size/2, cy: size/2, r, fill: "none", stroke: bgColor || color + "22", strokeWidth }),
        /* @__PURE__ */ React.createElement("circle", { cx: size/2, cy: size/2, r, fill: "none", stroke: color, strokeWidth, strokeDasharray: circ, strokeDashoffset: off, strokeLinecap: "round", style: { transition: "stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)" } })
      ),
      /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" } }, children)
    );
  }
  function DayRing({ isWD, isToday, isDone, label, dayLabel, clr, onClick }) {
    const size = 44;
    const pct = isDone ? 100 : 0;
    const ringColor = isDone ? clr : isToday && isWD ? clr : C.border;
    const bg = isDone ? clr + "22" : isToday && isWD ? clr + "15" : C.bgWarm;
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: isWD ? "pointer" : "default" }, onClick: isWD ? onClick : undefined },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, fontWeight: isToday ? 800 : 500, color: isToday ? clr : C.textL, letterSpacing: 0.5, textTransform: "uppercase" } }, dayLabel),
      /* @__PURE__ */ React.createElement(ActivityRing, { pct, size, strokeWidth: isToday ? 4.5 : 3.5, color: ringColor, bgColor: bg },
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center" } },
          isDone
            ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, lineHeight: 1 } }, "✓")
            : isWD
              ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, lineHeight: 1 } }, label)
              : /* @__PURE__ */ React.createElement("span", { style: { width: 4, height: 4, borderRadius: "50%", background: C.border, display: "block" } })
        )
      )
    );
  }
    function HomeTab() {
    const [openCat, setOpenCat] = useState(null);
    const [openItem, setOpenItem] = useState(null);
    return React.createElement("div", null,
      React.createElement("div", {
        style: { padding: "10px 13px", background: C.warnSoft, borderRadius: 10,
          border: `0.5px solid ${C.warn}44`, marginBottom: 14 }
      },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.warn, marginBottom: 3 } }, "При спазме тазового дна"),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.6 } },
          "Упражнения Кегеля ",
          React.createElement("b", { style: { color: C.warn } }, "противопоказаны"),
          " при гипертонусе без расслабления. Начни с первого раздела ниже. Желательна консультация физиотерапевта по женскому здоровью."
        )
      ),
      HOME_CATS.map((cat, ci) => React.createElement("div", { key: ci, style: { marginBottom: 7 } },
        React.createElement("button", {
          onClick: () => setOpenCat(openCat === ci ? -1 : ci),
          style: { width: "100%", padding: "12px 13px", borderRadius: 11,
            background: openCat === ci ? cat.clrS : C.card,
            border: `0.5px solid ${openCat === ci ? cat.clr + "66" : C.border}`,
            cursor: "pointer", display: "flex", justifyContent: "space-between",
            alignItems: "center", textAlign: "left", fontFamily: "inherit" }
        },
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, cat.cat),
            React.createElement("div", { style: { fontSize: 10, color: cat.clr, marginTop: 2 } },
              cat.items.length, " упражнений", cat.urgent ? " · Приоритет" : "")
          ),
          React.createElement("div", { style: { color: C.textL, fontSize: 12 } }, openCat === ci ? "▲" : "▼")
        ),
        openCat === ci && React.createElement("div", { style: { marginTop: 5 } },
          cat.warn && React.createElement("div", {
            style: { padding: "8px 11px", background: C.warnSoft, borderRadius: 8,
              marginBottom: 7, border: `0.5px solid ${C.warn}33` }
          },
            React.createElement("div", { style: { fontSize: 11, color: C.warn, lineHeight: 1.55 } }, cat.warn)
          ),
          cat.items.map((item, ii) => React.createElement("div", { key: ii,
            style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10,
              padding: "11px 12px", marginBottom: 6 }
          },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text } }, item.name),
            React.createElement("div", { style: { fontSize: 10, color: cat.clr, fontWeight: 600, marginTop: 2 } },
              item.dur, " · ", item.freq),
            React.createElement("button", {
              onClick: () => setOpenItem(openItem === `${ci}-${ii}` ? null : `${ci}-${ii}`),
              style: { marginTop: 5, background: "none", border: `0.5px solid ${C.border}`,
                borderRadius: 6, cursor: "pointer", color: C.textM, fontSize: 10, padding: "3px 8px", fontFamily: "inherit" }
            }, openItem === `${ci}-${ii}` ? "▲ Скрыть" : "▼ Как делать"),
            openItem === `${ci}-${ii}` && React.createElement("div", {
              style: { marginTop: 6, padding: "10px 11px", background: C.bgWarm, borderRadius: 8 }
            },
              React.createElement("div", { style: { fontSize: 11, color: C.text, lineHeight: 1.65, marginBottom: 6 } }, item.how),
              React.createElement("div", { style: { fontSize: 11, color: C.textM, paddingLeft: 9, borderLeft: `2px solid ${cat.clr}88` } },
                React.createElement("b", { style: { color: cat.clr } }, "Зачем:"), " ", item.why
              )
            )
          ))
        )
      ))
    );
  }
  // ===========================================================================
  // CycleSubTab — два связанных счётчика: цикл (28 дн от месячных) и пачка Ярины (21+7).
  // Календарь месяца + список будущих циклов + якори в одном месте.
  // ===========================================================================
  function CycleSubTab({ cycleAnchor: extAnchor, packAnchor: extPack }) {
    const [packAnchor, setPackAnchor] = useLS("packAnchorV2", defaultPackAnchor());
    // На Ярине цикл не независим — всё считаем от пачки (единый источник правды).
    const cycleAnchor = packAnchor;
    const [periodOverrides, setPeriodOverrides] = useLS("periodOverridesV1", {});
    const [editing, setEditing] = useState(false);
    const [editCycleNum, setEditCycleNum] = useState(null);
    const [editDate, setEditDate] = useState("");
    const [calMonth, setCalMonth] = useState(() => {
      const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPackDay = getPackDay(today, packAnchor);
    const todayCycleDay = todayPackDay; // на Ярине день цикла = день пачки
    const yarinaActive = isYarinaActiveToday(today, packAnchor);

    // Всё считаем от пачки
    const packAnchorDate = mkd(packAnchor);
    const currentPackNum = Math.floor((today - packAnchorDate) / 86400000 / CYCLE_LEN) + 1;
    const currentCycleNum = currentPackNum;

    // Прогноз месячных (кровотечение отмены) — привязан к номеру ПАЧКИ.
    const cycles = [currentPackNum, currentPackNum + 1, currentPackNum + 2, currentPackNum + 3]
      .filter(n => n >= 1)
      .map(n => {
        const ov = periodOverrides[n];
        const periodStart = ov ? mkd(ov) : getPredictedPeriodStart(n, packAnchor);
        periodStart.setHours(0, 0, 0, 0);
        const periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + PERIOD_LENGTH - 1);
        return { n, periodStart, periodEnd, isOverride: !!ov, isCurrent: n === currentPackNum };
      });

    // Прогноз будущих пачек Ярины
    const packs = [currentPackNum, currentPackNum + 1, currentPackNum + 2]
      .filter(n => n >= 1)
      .map(n => {
        const first = getCycleStart(n, packAnchor);
        const last = getLastPillOfPack(n, packAnchor);
        const breakStart = new Date(last); breakStart.setDate(breakStart.getDate() + 1);
        const breakEnd = new Date(first); breakEnd.setDate(breakEnd.getDate() + CYCLE_LEN - 1);
        return { n, first, last, breakStart, breakEnd, isCurrent: n === currentPackNum };
      });

    // До следующих месячных (с учётом overrides)
    const nextPeriodCycle = cycles.find(c => c.periodStart > today) || cycles[0];
    const daysToNextPeriod = Math.max(0, Math.ceil((nextPeriodCycle.periodStart - today) / 86400000));

    const fmt = (d) => new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

    const startEdit = (n) => {
      setEditCycleNum(n);
      const cur = periodOverrides[n] || dayKey(cycles.find(c => c.n === n).periodStart);
      setEditDate(cur);
      setEditing(true);
    };
    const saveEdit = () => {
      setPeriodOverrides({ ...periodOverrides, [editCycleNum]: editDate });
      setEditing(false);
    };
    const clearOverride = () => {
      const upd = { ...periodOverrides };
      delete upd[editCycleNum];
      setPeriodOverrides(upd);
      setEditing(false);
    };

    // КАЛЕНДАРЬ МЕСЯЦА
    const renderCalendar = () => {
      const year = calMonth.getFullYear();
      const month = calMonth.getMonth();
      const monthName = calMonth.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
      const daysInMonth = lastDay.getDate();

      // Сетка 6 недель × 7 дней = 42 ячейки
      const cells = [];
      for (let i = 0; i < startDow; i++) cells.push(null);
      for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
      while (cells.length < 42) cells.push(null);

      const prevMonth = () => setCalMonth(new Date(year, month - 1, 1));
      const nextMonth = () => setCalMonth(new Date(year, month + 1, 1));

      return React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "13px", marginBottom: 12 } },
        // Шапка месяца
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
          React.createElement("button", { onClick: prevMonth,
            style: { background: "none", border: "none", fontSize: 18, color: C.textM, cursor: "pointer", padding: "0 8px", fontFamily: "inherit" }
          }, "‹"),
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, textTransform: "capitalize" } }, monthName),
          React.createElement("button", { onClick: nextMonth,
            style: { background: "none", border: "none", fontSize: 18, color: C.textM, cursor: "pointer", padding: "0 8px", fontFamily: "inherit" }
          }, "›")
        ),
        // Заголовки дней недели
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 } },
          ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((d, i) => React.createElement("div", { key: i,
            style: { fontSize: 9, color: C.textL, textAlign: "center", padding: "2px 0" }
          }, d))
        ),
        // Дни
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 } },
          cells.map((d, i) => {
            if (!d) return React.createElement("div", { key: i, style: { aspectRatio: "1" } });
            d.setHours(0, 0, 0, 0);
            const isToday = d.getTime() === today.getTime();
            const periodDay = getPeriodDay(d, cycleAnchor, periodOverrides);
            // Для пачки: показываем расписание ТОЛЬКО с даты начала пачки и позже.
            // До packAnchor мы не знаем что там была за пачка — не красим.
            const packAnchorDate = mkd(packAnchor);
            const inPackEra = d >= packAnchorDate;
            const packDay = inPackEra ? getPackDay(d, packAnchor) : 0;
            const isYarinaDay = inPackEra && packDay >= 1 && packDay <= ACTIVE_PILLS;
            const isYarinaBreak = inPackEra && packDay > ACTIVE_PILLS;
            // Цвет фона ячейки — приоритет: месячные > пачка > перерыв
            let bg = "transparent", fg = C.text, fw = 400;
            if (periodDay >= 1 && periodDay <= PERIOD_LENGTH) {
              bg = "#D45D7A"; fg = "#fff"; fw = 700;
            } else if (isYarinaDay) {
              bg = "#E5E3FA"; fg = "#534AB7"; fw = 500;
            } else if (isYarinaBreak) {
              bg = "#FFF4D6"; fg = "#9C7A1E"; fw = 500;
            }
            const border = isToday ? `2px solid ${C.olive}` : "0.5px solid transparent";
            return React.createElement("div", { key: i,
              style: { aspectRatio: "1", background: bg, border, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: fg, fontWeight: isToday ? 700 : fw }
            }, d.getDate());
          })
        ),
        // Легенда
        React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px 14px", marginTop: 10, fontSize: 10, color: C.textM } },
          [
            { c: "#E5E3FA", l: "Таблетка пачки" },
            { c: "#FFF4D6", l: "Перерыв Ярины" },
            { c: "#D45D7A", l: "Месячные" },
          ].map((it, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 5 } },
            React.createElement("div", { style: { width: 10, height: 10, background: it.c, borderRadius: 3 } }),
            React.createElement("span", null, it.l)
          ))
        )
      );
    };

    return React.createElement("div", null,
      // Главная карточка — текущее состояние
      React.createElement("div", { style: { background: C.card, borderRadius: 12, padding: "13px 14px", marginBottom: 10, border: `0.5px solid ${C.border}` } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 } },
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, "Цикл и Ярина"),
            React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } },
              "Цикл = 28 дн · Пачка = 21 + 7"
            )
          )
        ),
        // Два счётчика
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 } },
          // Месячные (кровотечение отмены) — статус
          React.createElement("div", { style: { background: C.pinkSoft, borderRadius: 9, padding: "10px 11px", border: `0.5px solid ${C.pink}33` } },
            React.createElement("div", { style: { fontSize: 10, color: C.pink, fontWeight: 600, letterSpacing: 0.3 } }, "МЕСЯЧНЫЕ"),
            (() => {
              const pd = getPeriodDay(today, packAnchor, periodOverrides);
              return pd >= 1
                ? React.createElement(React.Fragment, null,
                    React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: C.pink, marginTop: 2, lineHeight: 1 } }, "День ", pd),
                    React.createElement("div", { style: { fontSize: 10, color: C.textM, marginTop: 4 } }, "идут сейчас"))
                : React.createElement(React.Fragment, null,
                    React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: C.pink, marginTop: 2, lineHeight: 1 } }, daysToNextPeriod),
                    React.createElement("div", { style: { fontSize: 10, color: C.textM, marginTop: 4 } }, daysToNextPeriod === 1 ? "день до них" : "дней до них"));
            })()
          ),
          // Пачка
          React.createElement("div", { style: { background: "#F2F0FE", borderRadius: 9, padding: "10px 11px", border: `0.5px solid #534AB733` } },
            React.createElement("div", { style: { fontSize: 10, color: "#534AB7", fontWeight: 600, letterSpacing: 0.3 } },
              yarinaActive ? "ТАБЛЕТКА" : "ПЕРЕРЫВ"),
            React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: "#534AB7", marginTop: 2, lineHeight: 1 } },
              yarinaActive ? todayPackDay : (todayPackDay - ACTIVE_PILLS)),
            React.createElement("div", { style: { fontSize: 10, color: C.textM, marginTop: 4 } },
              yarinaActive ? "из 21" : "из 7")
          )
        ),
        // До следующих месячных
        React.createElement("div", { style: { padding: "8px 10px", background: C.bgWarm, borderRadius: 8, fontSize: 11, color: C.text, lineHeight: 1.5 } },
          "🌸 До следующих месячных: ",
          React.createElement("b", { style: { color: C.pink } }, daysToNextPeriod, " ", daysToNextPeriod === 1 ? "день" : daysToNextPeriod < 5 ? "дня" : "дней"),
          " · ", fmt(nextPeriodCycle.periodStart)
        )
      ),

      // Календарь месяца
      renderCalendar(),

      // Контекст фазы — что может ощущаться (мягко, без обязаловки)
      (() => {
        const pd = getPeriodDay(today, packAnchor, periodOverrides);
        let icon, title, body;
        if (pd >= 1) {
          icon = "🌸"; title = "Сейчас: дни отмены (месячные)";
          body = "Может быть усталость, спазмы, тяга к сладкому и чувствительность — это нормально. Будь к себе мягче: тренировку можно заменить мягким движением, добавить тепло и отдых. Железо в эти дни особенно важно.";
        } else if (!yarinaActive) {
          icon = "🌷"; title = "Сейчас: перерыв в пачке";
          body = "7 дней без таблеток. Может начаться кровотечение отмены. Энергия обычно возвращается к концу перерыва. Не пропусти первую таблетку новой пачки — приложение напомнит.";
        } else if (todayPackDay <= 7) {
          icon = "🌱"; title = "Начало пачки";
          body = "Гормоны на Ярине ровные — резких качелей настроения обычно меньше, чем без неё. Хорошее время вработаться в режим: сон, белок, тренировки.";
        } else if (todayPackDay <= 14) {
          icon = "🌿"; title = "Середина пачки";
          body = "Обычно стабильный период: ровная энергия и настроение. Удачное окно для нагрузки в зале и новых привычек.";
        } else {
          icon = "🍂"; title = "Конец пачки";
          body = "Ближе к перерыву может появляться лёгкая усталость или тяга к сладкому. Это объяснимо. Чуть больше отдыха и спокойной еды — и всё ок.";
        }
        return React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 12, padding: "13px 15px", marginTop: 12, marginBottom: 12 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.oliveDeep, marginBottom: 5 } }, icon, " ", title),
          React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.6 } }, body),
          React.createElement("div", { style: { fontSize: 10.5, color: C.textM, lineHeight: 1.5, marginTop: 7 } },
            "Это общие закономерности, а не правило — твоё тело может ощущаться иначе, и это тоже нормально.")
        );
      })(),

      // Прогноз будущих месячных
      React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: C.textM, marginBottom: 7, letterSpacing: 0.3, textTransform: "uppercase" } }, "Прогноз месячных"),
      cycles.map(c => React.createElement("div", { key: c.n,
        style: { background: c.isCurrent ? C.oliveSoft : C.card, border: `0.5px solid ${c.isCurrent ? C.olive : C.border}`,
          borderRadius: 10, padding: "10px 13px", marginBottom: 6 }
      },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 2 } },
              c.isCurrent ? "Текущий цикл" : `Цикл ${c.n}`,
              c.isOverride && React.createElement("span", { style: { color: C.info, fontStyle: "italic", marginLeft: 5 } }, "(уточнено)")
            ),
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.pink } },
              fmt(c.periodStart), " — ", fmt(c.periodEnd)
            )
          ),
          React.createElement("button", { onClick: () => startEdit(c.n),
            style: { background: "none", border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "4px 9px",
              fontSize: 10, color: C.textM, cursor: "pointer", fontFamily: "inherit" }
          }, "Уточнить")
        )
      )),

      // Пачки Ярины
      React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: C.textM, marginBottom: 7, marginTop: 14, letterSpacing: 0.3, textTransform: "uppercase" } }, "Пачки Ярины"),
      packs.map(p => React.createElement("div", { key: p.n,
        style: { background: p.isCurrent ? "#F2F0FE" : C.card, border: `0.5px solid ${p.isCurrent ? "#534AB7" : C.border}`,
          borderRadius: 10, padding: "10px 13px", marginBottom: 6 }
      },
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 2 } },
          p.isCurrent ? "Текущая пачка" : `Пачка ${p.n}`
        ),
        React.createElement("div", { style: { fontSize: 12, fontWeight: 500, color: C.text } },
          "Таблетки: ", fmt(p.first), " — ", fmt(p.last)
        ),
        React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 2 } },
          "Перерыв: ", fmt(p.breakStart), " — ", fmt(p.breakEnd)
        )
      )),

      // Якорь (одна дата — первая таблетка пачки)
      React.createElement("div", { style: { background: C.bgWarm, borderRadius: 10, padding: "11px 13px", marginTop: 14 } },
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 6 } }, "Первая таблетка текущей пачки Ярины"),
        React.createElement("input", { type: "date", value: packAnchor, onChange: e => setPackAnchor(e.target.value),
          "aria-label": "Дата первой таблетки текущей пачки Ярины",
          style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: `0.5px solid ${C.border}`,
            background: C.card, fontSize: 13, fontFamily: "inherit", color: C.text,
            minWidth: 0, boxSizing: "border-box", outline: "none" }
        }),
        React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 8, lineHeight: 1.5 } },
          "На Ярине месячные — это кровотечение отмены в 7-дневный перерыв. Приложение само рассчитывает их от даты пачки (≈через 2 дня после последней таблетки). Если фактически началось в другой день — нажми «Уточнить» у нужного месяца.")
      ),

      // Модалка редактирования
      editing && React.createElement("div", {
        style: { position: "fixed", inset: 0, background: "rgba(46,36,24,0.55)", zIndex: 200,
          display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16 },
        onClick: () => setEditing(false)
      },
        React.createElement("div", { onClick: e => e.stopPropagation(),
          style: { background: C.card, borderRadius: 14, padding: 18, width: "100%", maxWidth: 380 }
        },
          React.createElement("div", { style: { fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 } }, "Уточнить дату месячных"),
          React.createElement("div", { style: { fontSize: 12, color: C.textM, marginBottom: 14, lineHeight: 1.5 } },
            "Когда фактически начались (или ожидаются) месячные в цикле ", editCycleNum, "?"
          ),
          React.createElement("input", { type: "date", value: editDate, onChange: e => setEditDate(e.target.value),
            style: { width: "100%", padding: "11px 13px", borderRadius: 10, border: `0.5px solid ${C.border}`,
              fontSize: 14, fontFamily: "inherit", background: C.bg,
              minWidth: 0, boxSizing: "border-box", outline: "none", color: C.text, marginBottom: 14 }
          }),
          React.createElement("div", { style: { display: "flex", gap: 8 } },
            React.createElement("button", { onClick: () => setEditing(false),
              style: { flex: 1, padding: "11px", borderRadius: 9, background: C.bgWarm, border: `0.5px solid ${C.border}`,
                color: C.textM, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }
            }, "Отмена"),
            periodOverrides[editCycleNum] && React.createElement("button", { onClick: clearOverride,
              style: { flex: 1, padding: "11px", borderRadius: 9, background: "none", border: `0.5px solid ${C.warn}`,
                color: C.warn, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }
            }, "Сбросить"),
            React.createElement("button", { onClick: saveEdit,
              style: { flex: 1, padding: "11px", borderRadius: 9, background: C.olive, border: "none",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }
            }, "Сохранить")
          )
        )
      )
    );
  }
  // ===========================================================================
  // WalksSubTab — подвкладка «Прогулки» в Спорт. Логика собака/без собаки.
  // ===========================================================================
  function WalksSubTab() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dogHere = today < KEY_DATES.dogLeaveDate;
    const walkWith = dogHere ? "с собакой" : "одной";

    const days = [
      { d: "ПН", evening: true, special: null },
      { d: "ВТ", evening: true, special: null },
      { d: "СР", evening: true, special: null },
      { d: "ЧТ", evening: true, special: null },
      { d: "ПТ", evening: true, special: null },
      { d: "СБ", evening: true, special: "long" },
      { d: "ВС", evening: false, special: "rest" },
    ];

    return React.createElement("div", null,
      // Прогулка — это полноценная активность
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 11 } },
        React.createElement("div", { style: { fontSize: 12.5, fontWeight: 700, color: C.oliveDeep, marginBottom: 3 } }, "🚶 Прогулка — это тоже тренировка"),
        React.createElement("div", { style: { fontSize: 11.5, color: C.text, lineHeight: 1.6 } },
          "Ходьба считается полноценной нагрузкой: мягко тратит энергию, помогает при ПМС и плохих днях, не нагружает на фоне низкого ферритина. День, когда вместо зала была прогулка, — не пропущенный день. Это засчитывается.")
      ),
      // Статус: собака сейчас или нет
      React.createElement("div", {
        style: { background: dogHere ? C.sandSoft : C.barkSoft, border: `0.5px solid ${dogHere ? C.sand : C.bark}33`,
          borderRadius: 10, padding: "11px 13px", marginBottom: 11 }
      },
        React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "flex-start" } },
          React.createElement("div", { style: { fontSize: 20 } }, dogHere ? "🐕" : "🚶"),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 } },
              dogHere ? "Собака дома" : "Собака у родителей"
            ),
            React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.55 } },
              dogHere ? "Прогулки вечером, иногда днём. Утром не нужно." : "До конца августа гуляешь одной по желанию."
            )
          )
        )
      ),

      // Будущий статус (если собака ещё здесь — показываем напоминание)
      dogHere && React.createElement("div", {
        style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 10, padding: "10px 13px", marginBottom: 13 }
      },
        React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "flex-start" } },
          React.createElement("div", { style: { fontSize: 14 } }, "📅"),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: C.oliveDeep, marginBottom: 2 } }, "С 27 мая — собака у родителей"),
            React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.55 } },
              "До конца августа. Прогулки с собакой выпадают, но движение остаётся: зал, бег, прогулки одной."
            )
          )
        )
      ),

      // Расписание недели
      React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: C.textM, marginBottom: 7, letterSpacing: 0.3, textTransform: "uppercase" } }, "Эта неделя"),
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 13px", marginBottom: 11 } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 3 } },
          days.map((d, i) => React.createElement("div", { key: i, style: { flex: 1, textAlign: "center" } },
            React.createElement("div", { style: { fontSize: 10, color: C.textM, marginBottom: 4 } }, d.d),
            React.createElement("div", {
              style: { height: 36, borderRadius: 6, background: d.special === "rest" ? C.bgWarm : (d.special === "long" ? C.barkSoft : C.sandSoft),
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }
            },
              d.special === "rest"
                ? React.createElement("div", { style: { fontSize: 9, color: C.textL } }, "отдых")
                : [
                    React.createElement("div", { key: "e", style: { fontSize: 11 } }, dogHere ? "🐕" : "🚶"),
                    React.createElement("div", { key: "l", style: { fontSize: 8, color: d.special === "long" ? C.bark : C.sandDeep, fontWeight: 600 } }, d.special === "long" ? "долгая" : "веч.")
                  ]
            )
          ))
        ),
        React.createElement("div", { style: { fontSize: 10, color: C.textM, marginTop: 9, lineHeight: 1.5 } }, "Дневные прогулки — по желанию, не отмечаются. Утром не гуляем.")
      ),

      // Когда собаки не будет
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 13px" } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 7 } }, "Когда собаки не будет (с 27 мая)"),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.6 } },
          "• Утром — без прогулок (как сейчас)", React.createElement("br"),
          "• Вечером — короткая прогулка одной, по желанию", React.createElement("br"),
          "• Суббота — длинная прогулка (как было)", React.createElement("br"),
          "• ВС — отдых"
        )
      )
    );
  }

  // ===========================================================================
  // PelvicSubTab — курс тазового дна (даты берутся из KEY_DATES.pelvicStart/pelvicEnd).
  // ===========================================================================
  function PelvicSubTab() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = dayKey(today);
    const [log, setLog] = useLS("pelvicLogV1", {});

    const beforeStart = today < KEY_DATES.pelvicStart;
    const afterEnd = today > KEY_DATES.pelvicEnd;
    const inCourse = !beforeStart && !afterEnd;

    const todayDone = !!log[todayKey];
    const toggleToday = () => setLog({ ...log, [todayKey]: !log[todayKey] });

    // Считаем сколько дней сделано за курс
    const startMs = KEY_DATES.pelvicStart.getTime();
    const todayMs = today.getTime();
    const daysSinceStart = Math.max(0, Math.floor((todayMs - startMs) / 86400000) + 1);
    const totalDays = Math.floor((KEY_DATES.pelvicEnd - KEY_DATES.pelvicStart) / 86400000) + 1;
    const doneCount = Object.values(log).filter(Boolean).length;

    if (beforeStart) {
      const startLabel = KEY_DATES.pelvicStart.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
      return React.createElement("div", null,
        React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}44`, borderRadius: 10, padding: "13px 15px" } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.oliveDeep, marginBottom: 5 } }, "🌸 Курс стартует ", startLabel),
          React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.6 } },
            "До ", startLabel, " курс ещё не начался. Сейчас — режим, сон, прогулки. С начала курса — 6 раз в неделю, отдых в воскресенье."
          )
        )
      );
    }

    if (afterEnd) {
      return React.createElement("div", null,
        React.createElement("div", { style: { background: C.sandSoft, border: `0.5px solid ${C.sand}44`, borderRadius: 10, padding: "13px 15px", marginBottom: 12 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.sandDeep, marginBottom: 5 } }, "✓ Курс окончен"),
          React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.6 } },
            "Базовые 2 месяца пройдены — ", doneCount, " дней из ~", totalDays, ". Если есть улучшения и хочется продолжать — обсуди с тем, кто вёл курс. Если всё хорошо без — оставляй ключевые упражнения раз в неделю для поддержки."
          )
        )
      );
    }

    return React.createElement("div", null,
      // Шапка — прогресс курса
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 13px", marginBottom: 10 } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, "Курс тазового дна"),
          React.createElement("div", { style: { fontSize: 11, color: C.olive, fontWeight: 600 } }, "День ", daysSinceStart, " из ", totalDays)
        ),
        React.createElement("div", { style: { height: 6, background: C.bgWarm, borderRadius: 3, overflow: "hidden", marginBottom: 7 } },
          React.createElement("div", { style: { height: "100%", width: Math.min(100, daysSinceStart / totalDays * 100) + "%", background: C.olive } })
        ),
        React.createElement("div", { style: { fontSize: 11, color: C.textM } }, "Сделано: ", doneCount, " занятий")
      ),

      // Сегодня
      React.createElement("div", {
        style: { background: todayDone ? C.sandSoft : C.card, border: `0.5px solid ${todayDone ? C.sand : C.border}`,
          borderRadius: 10, padding: "13px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }
      },
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: todayDone ? C.sandDeep : C.text } }, "Сегодня"),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } }, todayDone ? "Отлично, занятие отмечено" : "Отметь когда сделаешь")
        ),
        React.createElement("button", { onClick: toggleToday,
          style: { padding: "8px 14px", borderRadius: 9, background: todayDone ? C.sand : C.olive, border: "none",
            color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }
        }, todayDone ? "✓ Сделано" : "Отметить")
      ),

      // Короткие практики
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "14px 15px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 } }, "Короткие практики · 5–10 минут"),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 11, lineHeight: 1.5 } },
          "При тазовой боли цель — научиться РАССЛАБЛЯТЬ мышцы, а не только напрягать. Дыши, не задерживай дыхание, не доводи до боли."),
        [
          ["1. Диафрагмальное дыхание", "Ляг, колени согнуты. Рука на животе. Вдох — живот мягко поднимается, таз расслаблен. Выдох — живот опадает. 1–2 минуты. Это база расслабления тазового дна."],
          ["2. Мягкое сокращение Кегеля", "На выдохе мягко «подтяни» мышцы (как будто останавливаешь струю мочи) на 3–5 сек, на вдохе ПОЛНОСТЬЮ отпусти на 5–10 сек. Отпускание важнее сжатия. 8–10 раз."],
          ["3. Поза ребёнка", "Колени широко, таз к пяткам, лоб на пол. Дыши в поясницу и таз 1–2 минуты. Растягивает и успокаивает."],
          ["4. Счастливый ребёнок (happy baby)", "Лёжа на спине, подтяни колени к подмышкам, держи стопы/голени. Мягко покачивайся. Расслабляет тазовое дно."],
          ["5. Растяжка бабочки", "Сидя, стопы вместе, колени в стороны. Наклон вперёд с прямой спиной. Дыши в напряжённые места."],
        ].map((ex, i) => React.createElement("div", { key: i, style: { padding: "9px 0", borderTop: i > 0 ? `0.5px solid ${C.border}` : "none" } },
          React.createElement("div", { style: { fontSize: 12.5, fontWeight: 600, color: C.oliveDeep, marginBottom: 3 } }, ex[0]),
          React.createElement("div", { style: { fontSize: 11.5, color: C.text, lineHeight: 1.55 } }, ex[1])
        )),
        React.createElement("div", { style: { fontSize: 10.5, color: C.textM, lineHeight: 1.5, marginTop: 9, paddingTop: 9, borderTop: `0.5px solid ${C.border}` } },
          "Если курс ведёт специалист — следуй его программе, это лишь поддержка между сессиями.")
      ),

      // Напоминание про возможное усиление боли
      React.createElement("div", { style: { background: C.warnSoft, border: `0.5px solid ${C.warn}33`, borderRadius: 10, padding: "11px 13px" } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.warn, marginBottom: 5 } }, "⚠ Если боль усиливается"),
        React.createElement("div", { style: { fontSize: 11, color: C.text, lineHeight: 1.6 } },
          "Это значит ты перестаралась — упражнения на расслабление, а не на усилие. Можно временно снизить до 4-5 раз в неделю."
        )
      )
    );
  }

  function IronSubTab() {
    // Таблица анализов: пользователь заполняет значения "старт", "середина", "финиш"
    const [labResults, setLabResults] = useLS("labResultsV1", {});
    const labRows = [
      { id: "ferritin", name: "Ферритин", unit: "мкг/л", norm: "30–100", note: "Основной маркер запасов железа" },
      { id: "hb", name: "Гемоглобин", unit: "г/л", norm: "120–155", note: "Падает позже ферритина" },
      { id: "iron", name: "Сыв. железо", unit: "мкмоль/л", norm: "7–29", note: "Текущий уровень железа" },
      { id: "tibc", name: "ОЖСС / Трансферрин", unit: "г/л", norm: "2–3.6", note: "Повышен при дефиците" },
      { id: "b12", name: "Витамин B12", unit: "пг/мл", norm: "189–785", note: "Нужен для кроветворения" },
      { id: "folate", name: "Фолат", unit: "нг/мл", norm: ">3", note: "B9 для кроветворения" },
      { id: "tsh", name: "ТТГ", unit: "мЕд/л", norm: "0.4–4.0", note: "Щитовидка" },
      { id: "ft4", name: "fT4 (своб. Т4)", unit: "пмоль/л", norm: "12–22", note: "Был у нижней границы — наблюдать" },
      { id: "vitd", name: "Витамин D (25-OH)", unit: "нг/мл", norm: "30–80", note: "Норма для иммунитета и кости" },
      { id: "zinc", name: "Цинк", unit: "мкмоль/л", norm: "10.7–22.2", note: "Только если врач назначит" },
      { id: "alt", name: "ALT / AST", unit: "Ед/л", norm: "до 35", note: "Печёночные пробы (фон Дуксета)" },
    ];
    const fmtD = (d) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
    // Дополнительные пользовательские колонки (даты сдачи) — превращают таблицу в ленту
    const extraCols = labResults.__cols || []; // [{id, l, d}]
    const cols = [
      { id: "start", l: "Старт", d: fmtD(KEY_DATES.forlaxStart) },
      { id: "mid", l: "Контроль", d: fmtD(KEY_DATES.trichoLabsFrom) },
      { id: "end", l: "Трихолог", d: fmtD(KEY_DATES.trichoVisit) },
      ...extraCols,
    ];
    const setVal = (rowId, colId, val) => {
      setLabResults({ ...labResults, [`${rowId}_${colId}`]: val });
    };
    const addCol = () => {
      const today = new Date();
      const id = "c" + Date.now();
      const next = (labResults.__cols || []).concat([{ id, l: "Сдача", d: fmtD(today) }]);
      setLabResults({ ...labResults, __cols: next });
    };
    const removeCol = (id) => {
      if (!confirm("Удалить эту колонку и её значения?")) return;
      const next = (labResults.__cols || []).filter(c => c.id !== id);
      const cleaned = { ...labResults, __cols: next };
      Object.keys(cleaned).forEach(k => { if (k.endsWith("_" + id)) delete cleaned[k]; });
      setLabResults(cleaned);
    };

    return React.createElement("div", null,
      // Главная таблица — динамика
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 } }, "🩸 Динамика анализов"),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 12, lineHeight: 1.5 } },
          "Заполняй по факту получения результатов. Прогресс будет видно сразу — особенно ферритин."
        ),
        React.createElement("div", { style: { overflowX: "auto" } },
          React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 11 } },
            React.createElement("thead", null,
              React.createElement("tr", null,
                React.createElement("th", { style: { textAlign: "left", padding: "6px 4px", color: C.textM, fontWeight: 600, borderBottom: `0.5px solid ${C.border}`, minWidth: 90 } }, "Маркер"),
                ...cols.map(c => React.createElement("th", { key: c.id,
                  style: { textAlign: "center", padding: "6px 4px", color: C.textM, fontWeight: 600, borderBottom: `0.5px solid ${C.border}`, minWidth: 60 }
                },
                  React.createElement("div", null, c.l),
                  React.createElement("div", { style: { fontSize: 9, color: C.textL, fontWeight: 400, marginTop: 1 } }, c.d)
                )),
                React.createElement("th", { style: { textAlign: "left", padding: "6px 4px", color: C.textM, fontWeight: 600, borderBottom: `0.5px solid ${C.border}`, minWidth: 70 } }, "Норма")
              )
            ),
            React.createElement("tbody", null,
              labRows.map(row => React.createElement("tr", { key: row.id },
                React.createElement("td", { style: { padding: "8px 4px", color: C.text, fontWeight: 500, borderBottom: `0.5px solid ${C.border}` } },
                  React.createElement("div", { style: { fontSize: 12 } }, row.name),
                  React.createElement("div", { style: { fontSize: 9, color: C.textL, marginTop: 1 } }, row.unit)
                ),
                ...cols.map(c => React.createElement("td", { key: c.id, style: { padding: "8px 2px", borderBottom: `0.5px solid ${C.border}` } },
                  React.createElement("input", {
                    type: "number", step: "0.1",
                    value: labResults[`${row.id}_${c.id}`] || "",
                    onChange: e => setVal(row.id, c.id, e.target.value),
                    placeholder: "—",
                    style: { width: "100%", padding: "5px 4px", border: `0.5px solid ${C.border}`, borderRadius: 5,
                      fontSize: 12, fontFamily: "inherit", outline: "none", background: C.bg, color: C.text,
                      minWidth: 0, boxSizing: "border-box", textAlign: "center" }
                  })
                )),
                React.createElement("td", { style: { padding: "8px 4px", color: C.textM, fontSize: 11, borderBottom: `0.5px solid ${C.border}` } }, row.norm)
              ))
            )
          )
        ),
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 8 } },
          React.createElement("div", { style: { fontSize: 11, color: C.textL, lineHeight: 1.5, flex: 1 } },
            "💡 Добавляй новую колонку при каждой новой сдаче — история будет расти, и ферритин на графике видно за все месяцы."),
          React.createElement("button", { onClick: addCol,
            style: { padding: "7px 12px", borderRadius: 8, background: C.oliveSoft, border: `0.5px solid ${C.olive}44`, color: C.oliveDeep, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 } }, "+ колонка")
        ),
        extraCols.length > 0 && React.createElement("div", { style: { marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${C.border}` } },
          React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 6 } }, "Свои даты сдачи:"),
          extraCols.map(c => React.createElement("div", { key: c.id, style: { display: "flex", gap: 6, alignItems: "center", marginBottom: 5 } },
            React.createElement("input", { type: "text", value: c.l, placeholder: "Название",
              onChange: e => { const next = extraCols.map(x => x.id === c.id ? { ...x, l: e.target.value } : x); setLabResults({ ...labResults, __cols: next }); },
              style: { flex: 1, padding: "6px 8px", border: `0.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none", background: C.bg, color: C.text } }),
            React.createElement("input", { type: "text", value: c.d, placeholder: "дата",
              onChange: e => { const next = extraCols.map(x => x.id === c.id ? { ...x, d: e.target.value } : x); setLabResults({ ...labResults, __cols: next }); },
              style: { width: 80, padding: "6px 8px", border: `0.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none", background: C.bg, color: C.text } }),
            React.createElement("button", { onClick: () => removeCol(c.id), "aria-label": "удалить колонку",
              style: { background: "none", border: "none", color: C.textL, fontSize: 16, cursor: "pointer", fontFamily: "inherit" } }, "×")
          ))
        )
      ),

      // График ферритина — главная метрика прогресса
      (() => {
        const pts = cols.map(c => ({
          label: c.l, date: c.d,
          val: parseFloat(labResults[`ferritin_${c.id}`]) || null
        }));
        const filled = pts.filter(p => p.val !== null);
        const target = 50; // ориентир для волос (обсуждаемо, но практичный таргет)
        return React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 12 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, "📈 Ферритин — динамика"),
            React.createElement("div", { style: { fontSize: 11, color: C.textL } }, "цель ~", target, " мкг/л")
          ),
          filled.length === 0
            ? React.createElement("div", { style: { fontSize: 11.5, color: C.textM, lineHeight: 1.5, padding: "8px 0" } },
                "Заполни ферритин в таблице выше — здесь появится график роста. Это один из показателей прогресса.")
            : (() => {
                const W = 280, H = 90, pad = 22;
                const maxV = Math.max(target + 10, ...filled.map(p => p.val)) * 1.1;
                const xFor = i => pad + (cols.length === 1 ? 0 : i * (W - pad * 2) / (cols.length - 1));
                const yFor = v => H - pad - (v / maxV) * (H - pad * 2);
                const linePts = pts.map((p, i) => p.val !== null ? `${xFor(i)},${yFor(p.val)}` : null).filter(Boolean).join(" ");
                const targetY = yFor(target);
                return React.createElement("div", null,
                  React.createElement("svg", { width: "100%", viewBox: `0 0 ${W} ${H}`, style: { display: "block" } },
                    // целевая линия
                    React.createElement("line", { x1: pad, y1: targetY, x2: W - pad, y2: targetY, stroke: C.ok, strokeWidth: 1, strokeDasharray: "4 3", opacity: 0.6 }),
                    React.createElement("text", { x: W - pad, y: targetY - 4, fontSize: 8, fill: C.ok, textAnchor: "end" }, "цель"),
                    // линия динамики
                    filled.length > 1 && React.createElement("polyline", { points: linePts, fill: "none", stroke: C.olive, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }),
                    // точки
                    pts.map((p, i) => p.val !== null && React.createElement("g", { key: i },
                      React.createElement("circle", { cx: xFor(i), cy: yFor(p.val), r: 3.5, fill: p.val >= target ? C.ok : C.olive }),
                      React.createElement("text", { x: xFor(i), y: yFor(p.val) - 7, fontSize: 9, fill: C.text, textAnchor: "middle", fontWeight: 600 }, p.val)
                    )),
                    // подписи оси X
                    pts.map((p, i) => React.createElement("text", { key: "l" + i, x: xFor(i), y: H - 6, fontSize: 8, fill: C.textL, textAnchor: "middle" }, p.label))
                  ),
                  filled.length >= 2 && React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 4, textAlign: "center" } },
                    (() => {
                      const delta = filled[filled.length - 1].val - filled[0].val;
                      return delta > 0 ? `↑ +${delta.toFixed(0)} мкг/л за период — растёт` : delta < 0 ? `↓ ${delta.toFixed(0)} — обсуди с врачом` : "без изменений";
                    })()
                  )
                );
              })()
        );
      })(),

      // Что сдавать
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 } }, "Список для анализов"),
        labRows.map((row, i) => React.createElement("div", { key: i,
          style: { padding: "8px 0", borderBottom: i < labRows.length - 1 ? `0.5px solid ${C.border}` : "none" }
        },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 2 } },
            React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: C.text } }, row.name),
            React.createElement("span", { style: { fontSize: 11, color: C.textL } }, row.norm, " ", row.unit)
          ),
          React.createElement("div", { style: { fontSize: 10, color: C.textM } }, row.note)
        ))
      ),

      // ⚠ КОК и ферритин
      React.createElement("div", { style: { background: C.warnSoft, borderRadius: 10, padding: "10px 13px", marginBottom: 12, border: `0.5px solid ${C.warn}44` } },
        React.createElement("div", { style: { fontSize: 11, color: C.warn, fontWeight: 600, marginBottom: 3 } }, "⚠ При КОК (Ярина)"),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.5 } }, "КОК может слегка завышать трансферрин и скрывать анемию. Делай анализы регулярно — это компенсирует.")
      ),

      // Железо в еде
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 } }, "🥩 Железо в еде"),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("div", { style: { flex: 1, background: C.barkSoft, borderRadius: 9, padding: "10px 11px" } },
            React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: C.bark, marginBottom: 6 } }, "🥩 Животное"),
            ["Печень говяжья", "Красное мясо", "Устрицы, сардины", "Курица", "Икра трески"].map((item, i) => React.createElement("div", { key: i, style: { fontSize: 11, color: C.textM, marginBottom: 3 } }, "• ", item))
          ),
          React.createElement("div", { style: { flex: 1, background: C.sandSoft, borderRadius: 9, padding: "10px 11px" } },
            React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: C.sandDeep, marginBottom: 6 } }, "🌿 Растительное"),
            ["Гречка, киноа", "Чечевица, бобовые", "Орехи, тыкв. семечки", "Спирулина", "Сушёные абрикосы"].map((item, i) => React.createElement("div", { key: i, style: { fontSize: 11, color: C.textM, marginBottom: 3 } }, "• ", item))
          )
        )
      ),

      // Правила усвоения
      React.createElement("div", { style: { background: C.oliveSoft, borderRadius: 12, padding: "13px 14px", border: `0.5px solid ${C.olive}33` } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.oliveDeep, marginBottom: 8 } }, "💡 Правила усвоения"),
        [
          "Витамин C немного помогает усвоению железа — приятный плюс, не обязательное условие. Не переживай, если иногда забыла",
          "Чай / кофе за 1 час до или после еды снижают усвоение железа",
          "Кальций (молоко) мешает — лучше не совмещать в одном приёме",
          "Добавки запивай водой или соком (не молоком)",
        ].map((text, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 8, marginBottom: 6 } },
          React.createElement("span", { style: { color: C.ok, fontWeight: 700, fontSize: 13, flexShrink: 0 } }, "✓"),
          React.createElement("span", { style: { fontSize: 12, color: C.text, lineHeight: 1.5 } }, text)
        ))
      )
    );
  }


  // ===========================================================================
  // SportTab — объединяет Зал, Прогулки, Бег, Дома, Тазовое дно.
  // ===========================================================================
  // ===========================================================================
  // RestTimer — крупный таймер отдыха между подходами.
  // ===========================================================================
  function RestTimer() {
    const [sec, setSec] = useState(0);
    const [running, setRunning] = useState(false);
    React.useEffect(() => {
      if (!running) return;
      if (sec <= 0) { setRunning(false); return; }
      const t = setTimeout(() => setSec(s => s - 1), 1000);
      return () => clearTimeout(t);
    }, [running, sec]);
    const start = (s) => { setSec(s); setRunning(true); };
    const mm = String(Math.floor(sec / 60)).padStart(1, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "16px", marginBottom: 12, textAlign: "center" } },
      React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.textM, marginBottom: 8 } }, "⏱ Таймер отдыха"),
      React.createElement("div", { style: { fontSize: 52, fontWeight: 800, color: sec > 0 ? C.oliveDeep : C.textL, lineHeight: 1, fontVariantNumeric: "tabular-nums", marginBottom: 12 } }, mm, ":", ss),
      React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "center", marginBottom: 8 } },
        [60, 75, 90, 120].map(s => React.createElement("button", { key: s, onClick: () => start(s),
          style: { padding: "9px 14px", borderRadius: 10, border: `0.5px solid ${C.olive}55`, background: C.oliveSoft, color: C.oliveDeep, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, s, "с"))
      ),
      running && React.createElement("button", { onClick: () => { setRunning(false); setSec(0); },
        style: { padding: "7px 16px", borderRadius: 9, border: "none", background: C.bgWarm, color: C.textM, fontSize: 12, cursor: "pointer", fontFamily: "inherit" } }, "Стоп")
    );
  }

  // ===========================================================================
  // GymComfortTab — «Спокойно в зал»: всё, что снижает тревогу тренироваться одной.
  // ===========================================================================
  function GymComfortTab() {
    const [arrivals, setArrivals] = useLS("gymArrivalsV1", []);     // [{date, mood, note}]
    const [packed, setPacked] = useLS("gymPackedV1", {});           // {key: bool} сбрасывается на новый день
    const [gymMap, setGymMap] = useLS("gymMapV1", "");              // свободный текст «где что»
    const [logMood, setLogMood] = useState(null);
    const [logNote, setLogNote] = useState("");

    const todayK = dayKey();
    // Чек-лист сборов сбрасываем каждый день
    const packedToday = packed.date === todayK ? packed : { date: todayK };
    const PACK_ITEMS = ["Бутылка воды", "Наушники", "Полотенце", "Перекус с белком", "Форма / кроссовки", "Телефон заряжен"];
    const togglePack = (item) => {
      const next = { ...packedToday, [item]: !packedToday[item] };
      setPacked(next);
    };
    const packedCount = PACK_ITEMS.filter(i => packedToday[i]).length;

    const logArrival = () => {
      setArrivals([{ id: "a" + Date.now(), date: todayK, mood: logMood, note: logNote.trim() }, ...arrivals]);
      setLogMood(null); setLogNote("");
    };
    const arrivalsThisMonth = arrivals.filter(a => {
      const d = mkd(a.date); const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const Sec = (title, children, sub) => React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12 } },
      React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: sub ? 2 : 9 } }, title),
      sub && React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 9, lineHeight: 1.5 } }, sub),
      children
    );

    const inp = { width: "100%", padding: "10px 12px", borderRadius: 9, border: `0.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: "inherit", color: C.text, boxSizing: "border-box", outline: "none", resize: "vertical" };

    return React.createElement("div", null,
      // Тёплое вступление
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 14, padding: "14px 16px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.oliveDeep, marginBottom: 5 } }, "🦊 Тренироваться одной — это нормально"),
        React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.6 } },
          "Никто в зале не смотрит — все заняты собой. Здесь всё, что помогает прийти спокойно: что взять, когда меньше людей, что говорить, и куда отметить, что справилась.")
      ),

      // «Я пришла» — счётчик побед
      React.createElement("div", { style: { background: C.card, border: `1px solid ${C.olive}44`, borderRadius: 14, padding: "16px", marginBottom: 12, textAlign: "center" } },
        React.createElement("div", { style: { fontSize: 30, fontWeight: 800, color: C.oliveDeep, lineHeight: 1 } }, arrivalsThisMonth),
        React.createElement("div", { style: { fontSize: 12, color: C.textM, marginTop: 4 } }, arrivalsThisMonth === 1 ? "раз в зале в этом месяце" : "раз в зале в этом месяце"),
        React.createElement("div", { style: { fontSize: 11, color: C.oliveDeep, marginTop: 6, lineHeight: 1.5 } }, "Прийти — уже победа. Не важно, как прошла тренировка.")
      ),

      // Дневник «как прошло»
      Sec("Я была сегодня — как прошло?", React.createElement(React.Fragment, null,
        React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 9 } },
          [["💪", "горжусь"], ["🙂", "норм"], ["😮‍💨", "тревожно, но пришла"]].map(m => React.createElement("button", { key: m[0], onClick: () => setLogMood(m[1]),
            style: { flex: 1, padding: "10px 6px", borderRadius: 10, border: `0.5px solid ${logMood === m[1] ? C.olive : C.border}`, background: logMood === m[1] ? C.oliveSoft : C.card, cursor: "pointer", fontFamily: "inherit" } },
            React.createElement("div", { style: { fontSize: 20 } }, m[0]),
            React.createElement("div", { style: { fontSize: 10.5, color: logMood === m[1] ? C.oliveDeep : C.textM, marginTop: 3, fontWeight: logMood === m[1] ? 600 : 400 } }, m[1])
          ))
        ),
        React.createElement("textarea", { value: logNote, onChange: e => setLogNote(e.target.value), placeholder: "Заметка (по желанию): что было легче, что понравилось…", style: { ...inp, minHeight: 44, marginBottom: 9 } }),
        React.createElement("button", { onClick: logArrival, disabled: !logMood,
          style: { width: "100%", padding: "11px", borderRadius: 10, background: logMood ? C.olive : C.bgWarm, border: "none", color: logMood ? "#fff" : C.textL, fontSize: 13, fontWeight: 600, cursor: logMood ? "pointer" : "default", fontFamily: "inherit" } }, "Отметить, что пришла ✓"),
        arrivals.length > 0 && React.createElement("div", { style: { marginTop: 12 } },
          arrivals.slice(0, 5).map(a => React.createElement("div", { key: a.id, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: `0.5px solid ${C.border}` } },
            React.createElement("div", { style: { fontSize: 12, color: C.text } }, a.mood, a.note ? " · " + a.note : ""),
            React.createElement("div", { style: { fontSize: 10.5, color: C.textL } }, a.date)
          ))
        )
      ), "Не про килограммы — про то, что ты пришла. Со временем видно, что тревоги меньше."),

      // Чек-лист сборов
      Sec("Собраться в зал", React.createElement(React.Fragment, null,
        React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } },
          PACK_ITEMS.map(item => React.createElement("button", { key: item, onClick: () => togglePack(item),
            style: { display: "flex", alignItems: "center", gap: 7, padding: "8px 11px", borderRadius: 999, border: `0.5px solid ${packedToday[item] ? C.olive : C.border}`, background: packedToday[item] ? C.oliveSoft : C.card, cursor: "pointer", fontFamily: "inherit" } },
            React.createElement("span", { style: { fontSize: 13 } }, packedToday[item] ? "✓" : "○"),
            React.createElement("span", { style: { fontSize: 12, color: packedToday[item] ? C.oliveDeep : C.textM, fontWeight: packedToday[item] ? 600 : 400 } }, item)
          ))
        ),
        React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 9 } }, "Собрано: ", packedCount, " из ", PACK_ITEMS.length, " · обнуляется каждый день")
      ), "Отметь перед выходом, чтобы ничего не забыть."),

      // Лучшее время прийти
      Sec("Когда в зале меньше людей", React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.7 } },
        React.createElement("div", null, "🟢 ", React.createElement("b", null, "Спокойно:"), " будни 10:00–16:00, раннее утро до 8:00"),
        React.createElement("div", null, "🟡 ", React.createElement("b", null, "Средне:"), " будни 14:00–17:00, выходные после обеда"),
        React.createElement("div", null, "🔴 ", React.createElement("b", null, "Час пик:"), " будни 17:00–20:00, утро выходных"),
        React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 7, lineHeight: 1.5 } }, "Если толпа напрягает — выбирай зелёные окна. Это нормально подстраиваться под себя.")
      )),

      // Разминка-настройка (перед входом)
      Sec("Настройка перед входом · 1 минута", React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.65 } },
        React.createElement("div", null, "1. Постой у входа, сделай 3 медленных вдоха-выдоха"),
        React.createElement("div", null, "2. Скажи себе: «я имею право здесь быть»"),
        React.createElement("div", null, "3. Надень наушники — это твой «пузырь»"),
        React.createElement("div", null, "4. Первое упражнение — самое простое, чтобы вработаться")
      )),

      // Таймер отдыха
      RestTimer(),

      // Наушники / плейлист
      Sec("Наушники — твой пузырь", React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.6 } },
        "Наушники — законный способ сказать «я в своём мире». В них проще не замечать окружающих и держать темп. Заранее собери плейлист, под который тебе хорошо двигаться, — это часть ритуала, который настраивает на тренировку."
      )),

      // Тихий маршрут
      Sec("Тихий маршрут по залу", React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.65 } },
        React.createElement("div", null, "Если зона со штангами и «качками» напрягает — почти все упражнения плана можно сделать на тренажёрах и в спокойных углах:"),
        React.createElement("div", { style: { marginTop: 6 } }, "• Ягодицы/ноги → тренажёры (жим ногами, отведения, сгибания)"),
        React.createElement("div", null, "• Спина → верхняя тяга, гребная тяга в тренажёре"),
        React.createElement("div", null, "• Кор → коврик в зоне для растяжки"),
        React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 7, lineHeight: 1.5 } }, "Свободные веса можно освоить позже, когда будешь чувствовать себя увереннее. Спешить некуда.")
      )),

      // План Б для занятого тренажёра
      Sec("Если тренажёр занят", React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.65 } },
        React.createElement("div", null, "Не нужно стоять и ждать неловко. Варианты:"),
        React.createElement("div", { style: { marginTop: 6 } }, "• Сделай другое упражнение из плана, вернись позже"),
        React.createElement("div", null, "• Замена: жим ногами ↔ приседания в Смите ↔ выпады с гантелями"),
        React.createElement("div", null, "• Отведение в тренажёре ↔ с резинкой на коврике"),
        React.createElement("div", null, "• Верхняя тяга ↔ тяга гантели в наклоне"),
        React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 7, lineHeight: 1.5 } }, "Порядок упражнений не священный — можно менять местами.")
      )),

      // Фразы на польском
      Sec("Фразы по-польски", React.createElement("div", null,
        [
          ["Вы ещё подходы делаете?", "Czy pan/pani jeszcze ćwiczy na tym?"],
          ["Можно вклиниться между подходами?", "Czy mogę wejść między seriami?"],
          ["Это свободно?", "Czy to jest wolne?"],
          ["Простите", "Przepraszam"],
          ["Спасибо", "Dziękuję"],
          ["Где раздевалка?", "Gdzie jest szatnia?"],
          ["Как работает этот тренажёр?", "Jak działa ta maszyna?"],
        ].map((p, i) => React.createElement("div", { key: i, style: { padding: "8px 0", borderBottom: i < 6 ? `0.5px solid ${C.border}` : "none" } },
          React.createElement("div", { style: { fontSize: 12, color: C.textM } }, p[0]),
          React.createElement("div", { style: { fontSize: 13.5, color: C.oliveDeep, fontWeight: 600, marginTop: 2 } }, p[1])
        ))
      ), "Тапни глазами перед входом — и будет спокойнее заговорить."),

      // Карта зала «где что» (свои заметки)
      Sec("Моя карта зала", React.createElement("div", null,
        React.createElement("textarea", { value: gymMap, onChange: e => setGymMap(e.target.value),
          placeholder: "Запиши, где что: «жим ногами — у окна», «гантели — справа от входа», «коврики — за кардио»…",
          style: { ...inp, minHeight: 80 } }),
        React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 7, lineHeight: 1.5 } }, "Заполни в первый спокойный визит — потом не нужно искать и теряться.")
      ), "Чтобы не чувствовать себя потерянной среди тренажёров.")
    );
  }

  function weekStartKey(d) {
    const x = new Date(d); x.setHours(0, 0, 0, 0);
    const dow = x.getDay() === 0 ? 6 : x.getDay() - 1;
    x.setDate(x.getDate() - dow);
    return dayKey(x);
  }
  const SPORT_ACTS = [
    { id: "gym", l: "\u0417\u0430\u043b", icon: "\ud83c\udfcb" },
    { id: "run", l: "\u0411\u0435\u0433", icon: "\ud83c\udfc3" },
    { id: "tennis", l: "\u0422\u0435\u043d\u043d\u0438\u0441", icon: "\ud83c\udfbe" },
    { id: "stretch", l: "\u0420\u0430\u0441\u0442\u044f\u0436\u043a\u0430", icon: "\ud83e\udd38" },
  ];
  function SportTrends() {
    const [range, setRange] = useState(30);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = range - 1; i >= 0; i--) { const d = new Date(today); d.setDate(d.getDate() - i); days.push(d); }
    let steps = {}, plan = {}, wlog = {};
    try { steps = (JSON.parse(localStorage.getItem("stepsLogV1") || "{}") || {}); } catch (e) {}
    try { plan = (JSON.parse(localStorage.getItem("sportWeekPlanV1") || "{}") || {}); } catch (e) {}
    try { wlog = (JSON.parse(localStorage.getItem("wLog5") || "{}") || {}); } catch (e) {}
    const stepArr = days.map(d => steps[dayKey(d)] || 0);
    const stepsFilled = stepArr.filter(v => v > 0);
    const avgSteps = stepsFilled.length ? Math.round(stepsFilled.reduce((a, b) => a + b, 0) / stepsFilled.length) : 0;
    const activeDays = stepArr.filter(v => v >= 4000).length;
    // Сводка тренировок по типам из плана (за период)
    const typeCount = { gym: 0, run: 0, tennis: 0, stretch: 0 };
    let pelvicDone = 0, plannedSlots = 0, filledSlots = 0;
    days.forEach(d => {
      const x = new Date(d); const dw = x.getDay() === 0 ? 6 : x.getDay() - 1;
      x.setDate(x.getDate() - dw); const wk = dayKey(x);
      const wd = plan[wk]; if (!wd) return;
      const di = d.getDay() === 0 ? 6 : d.getDay() - 1;
      const acts = (wd.acts && wd.acts[di]) || [];
      acts.forEach(a => { const id = typeof a === "string" ? a : a.id; if (typeCount[id] != null) typeCount[id]++; });
      if (wd.pelvic && wd.pelvic[di]) pelvicDone++;
    });
    // streak активности (шаги >=4000) с конца
    let streak = 0;
    for (let i = stepArr.length - 1; i >= 0; i--) { if (stepArr[i] >= 4000) streak++; else break; }
    const totalTrainings = typeCount.gym + typeCount.run + typeCount.tennis + typeCount.stretch;
    const pelvicStartPassed = today >= KEY_DATES.pelvicStart;
    // связь: шаги vs (если есть mood)
    let moodLog = {}; try { moodLog = (JSON.parse(localStorage.getItem("moodDiaryV1") || "{}") || {}); } catch (e) {}
    let corr = null;
    const act = [], pas = [];
    days.forEach((d, i) => { const m = moodLog[dayKey(d)]; if (m && m.mood > 0) (stepArr[i] >= 4000 ? act : pas).push(m.mood); });
    if (act.length >= 2 && pas.length >= 2) {
      const am = act.reduce((a, b) => a + b, 0) / act.length, pm = pas.reduce((a, b) => a + b, 0) / pas.length;
      if (am - pm >= 0.4) corr = "\u0412 \u0434\u043d\u0438 \u0441 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c\u044e (4000+ \u0448\u0430\u0433\u043e\u0432) \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d\u0438\u0435 \u0432 \u0441\u0440\u0435\u0434\u043d\u0435\u043c \u0432\u044b\u0448\u0435. \u041d\u0430\u0431\u043b\u044e\u0434\u0435\u043d\u0438\u0435 \u043f\u043e \u0442\u0432\u043e\u0438\u043c \u0434\u0430\u043d\u043d\u044b\u043c, \u043d\u0435 \u043f\u0440\u0430\u0432\u0438\u043b\u043e.";
    }
    const card = (inner, mb) => React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 11, padding: "12px 14px", marginBottom: mb == null ? 10 : mb } }, inner);
    const typeRow = (icon, label, n) => React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: C.text, padding: "3px 0" } },
      React.createElement("span", null, icon + " " + label), React.createElement("b", null, n));
    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 12 } },
        [7, 30, 90].map(r => React.createElement("button", { key: r, onClick: () => setRange(r),
          style: { flex: 1, padding: "7px 0", borderRadius: 7, border: `0.5px solid ${range === r ? C.olive : C.border}`, background: range === r ? C.olive : C.card, fontSize: 12, fontWeight: 600, color: range === r ? "#fff" : C.textM, cursor: "pointer", fontFamily: "inherit" } }, r, " \u0434\u043d"))
      ),
      card(React.createElement(React.Fragment, null,
        React.createElement("div", { style: { fontSize: 12.5, fontWeight: 700, color: C.oliveDeep, marginBottom: 8 } }, "\ud83d\udccb \u0421\u0432\u043e\u0434\u043a\u0430 \u0437\u0430 " + range + " \u0434\u043d"),
        React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.7 } },
          "\ud83d\udc63 \u0448\u0430\u0433\u0438 \u0432 \u0441\u0440\u0435\u0434\u043d\u0435\u043c: " + (avgSteps || "\u2014") + "  \u00b7  \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u0434\u043d\u0435\u0439 (4000+): " + activeDays),
        streak >= 2 && React.createElement("div", { style: { fontSize: 11.5, color: C.oliveDeep, marginTop: 4 } }, "\ud83d\udd25 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c " + streak + " \u0434\u043d. \u043f\u043e\u0434\u0440\u044f\u0434")
      )),
      stepsFilled.length >= 3 && card(React.createElement(React.Fragment, null,
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 10 } },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text } }, "\ud83d\udc63 \u0428\u0430\u0433\u0438"),
          React.createElement("div", { style: { fontSize: 11, color: C.textM } }, "\u0441\u0440\u0435\u0434. " + avgSteps)),
        LineChart({ values: stepArr, color: C.bark, max: Math.max(8000, ...stepArr) })
      )),
      totalTrainings > 0 && card(React.createElement(React.Fragment, null,
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 } }, "\ud83c\udfcb \u0422\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0438 \u0437\u0430 \u043f\u0435\u0440\u0438\u043e\u0434 (\u0438\u0437 \u043f\u043b\u0430\u043d\u0430)"),
        typeRow("\ud83c\udfcb", "\u0417\u0430\u043b", typeCount.gym),
        typeRow("\ud83c\udfc3", "\u0411\u0435\u0433", typeCount.run),
        typeRow("\ud83c\udfbe", "\u0422\u0435\u043d\u043d\u0438\u0441", typeCount.tennis),
        typeRow("\ud83e\udd38", "\u0420\u0430\u0441\u0442\u044f\u0436\u043a\u0430", typeCount.stretch),
        React.createElement("div", { style: { fontSize: 10.5, color: C.textL, marginTop: 6, lineHeight: 1.4 } }, "\u041f\u043e \u0437\u0430\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u043c\u0443 \u0432 \u00ab\u041f\u043b\u0430\u043d \u043d\u0435\u0434\u0435\u043b\u0438\u00bb.")
      )),
      pelvicStartPassed && card(React.createElement(React.Fragment, null,
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4 } }, "\ud83c\udf38 \u041a\u0443\u0440\u0441 \u0442\u0430\u0437\u043e\u0432\u043e\u0433\u043e \u0434\u043d\u0430"),
        React.createElement("div", { style: { fontSize: 12, color: C.text } }, "\u0417\u0430\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u043e \u0434\u043d\u0435\u0439 \u0441 \u0437\u0430\u043d\u044f\u0442\u0438\u0435\u043c: ", React.createElement("b", null, pelvicDone), " \u0438\u0437 " + range),
        React.createElement("div", { style: { fontSize: 10.5, color: C.textL, marginTop: 4, lineHeight: 1.4 } }, "\u041a\u0443\u0440\u0441 \u0441 15 \u0438\u044e\u043d\u044f, \u043a\u0430\u0436\u0434\u044b\u0439 \u0434\u0435\u043d\u044c \u043f\u043e 30 \u043c\u0438\u043d.")
      )),
      corr && card(React.createElement("div", { style: { fontSize: 11.5, color: C.textM, lineHeight: 1.5 } }, "\ud83d\udca1 " + corr)),
      (stepsFilled.length < 3 && totalTrainings === 0) && card(React.createElement("div", { style: { fontSize: 12, color: C.textM, lineHeight: 1.5, textAlign: "center", padding: "8px 0" } }, "\u0413\u0440\u0430\u0444\u0438\u043a\u0438 \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f, \u043a\u043e\u0433\u0434\u0430 \u043d\u0430\u043a\u043e\u043f\u044f\u0442\u0441\u044f \u0434\u0430\u043d\u043d\u044b\u0435 \u043f\u043e \u0448\u0430\u0433\u0430\u043c \u0438 \u0442\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0430\u043c."))
    );
  }
  function SportPlanner() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [offset, setOffset] = useState(0);
    const [openDay, setOpenDay] = useState(-1);
    const base = new Date(today); base.setDate(base.getDate() + offset * 7);
    const wk = weekStartKey(base);
    const [plan, setPlan] = useLS("sportWeekPlanV1", {});
    const weekData = plan[wk] || { acts: {}, pelvic: {} };
    const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const monday = (() => { const m = new Date(base); const dow = m.getDay() === 0 ? 6 : m.getDay() - 1; m.setDate(m.getDate() - dow); m.setHours(0, 0, 0, 0); return m; })();
    const TOD = [["morning", "Утро"], ["day", "День"], ["evening", "Вечер"]];

    // Нормализация: старый формат acts[di] = ["gym"] → [{id:"gym"}]
    const getActs = (di) => {
      const raw = weekData.acts[di] || [];
      return raw.map(a => (typeof a === "string" ? { id: a } : a));
    };
    const writeActs = (di, arr) => setPlan({ ...plan, [wk]: { ...weekData, acts: { ...weekData.acts, [di]: arr } } });

    const toggleAct = (di, actId) => {
      const cur = getActs(di);
      const i = cur.findIndex(a => a.id === actId);
      if (i >= 0) cur.splice(i, 1); else cur.push({ id: actId });
      writeActs(di, cur);
    };
    const setActTod = (di, actId, tod) => {
      const cur = getActs(di);
      const a = cur.find(x => x.id === actId); if (!a) return;
      a.tod = a.tod === tod ? null : tod;
      writeActs(di, cur.slice());
    };
    const setActTime = (di, actId, time) => {
      const cur = getActs(di);
      const a = cur.find(x => x.id === actId); if (!a) return;
      a.time = time || null;
      writeActs(di, cur.slice());
    };
    // Тазовое дно: {tod:"morning"|"evening", time}
    const getPelvic = (di) => {
      const p = weekData.pelvic[di];
      if (!p) return null;
      return typeof p === "string" ? { tod: p } : p;
    };
    const setPelvicTod = (di, tod) => {
      const cur = getPelvic(di);
      const next = (cur && cur.tod === tod) ? null : { ...(cur || {}), tod };
      setPlan({ ...plan, [wk]: { ...weekData, pelvic: { ...weekData.pelvic, [di]: next } } });
    };
    const setPelvicTime = (di, time) => {
      const cur = getPelvic(di) || {};
      setPlan({ ...plan, [wk]: { ...weekData, pelvic: { ...weekData.pelvic, [di]: { ...cur, time: time || null } } } });
    };

    const isSunday = today.getDay() === 0;
    const nextWeekEmpty = !plan[weekStartKey(new Date(today.getTime() + 7 * 86400000))];

    const todChip = (active, label, onClick) => React.createElement("button", { onClick,
      style: { padding: "5px 11px", borderRadius: 8, border: `0.5px solid ${active ? C.olive : C.border}`, background: active ? C.olive : "transparent", color: active ? "#fff" : C.textM, fontSize: 11, fontWeight: active ? 600 : 500, cursor: "pointer", fontFamily: "inherit" } }, label);

    const todMap = { morning: "\u0443\u0442\u0440\u043e\u043c", day: "\u0434\u043d\u0451\u043c", evening: "\u0432\u0435\u0447\u0435\u0440\u043e\u043c" };
    const actColor = { gym: C.bark, run: C.olive, tennis: C.sand, stretch: C.info };
    return React.createElement("div", null,
      isSunday && offset === 0 && nextWeekEmpty && React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}44`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12.5, fontWeight: 700, color: C.oliveDeep, marginBottom: 3 } }, "\ud83d\uddd3 \u0412\u043e\u0441\u043a\u0440\u0435\u0441\u0435\u043d\u044c\u0435 \u2014 \u0432\u0440\u0435\u043c\u044f \u0441\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043d\u0435\u0434\u0435\u043b\u044e"),
        React.createElement("div", { style: { fontSize: 11.5, color: C.text, lineHeight: 1.5, marginBottom: 8 } }, "\u0420\u0430\u0441\u0441\u0442\u0430\u0432\u044c \u0442\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0438 \u043d\u0430 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0443\u044e \u043d\u0435\u0434\u0435\u043b\u044e."),
        React.createElement("button", { onClick: () => { setOffset(1); setOpenDay(-1); }, style: { fontSize: 12, fontWeight: 600, color: "#fff", background: C.olive, border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit" } }, "\u041f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0443\u044e \u2192")
      ),
      React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 14 } },
        [0, 1, 2, 3].map(o => {
          const m = new Date(today); m.setDate(m.getDate() + o * 7);
          const mon = new Date(m); const dw = mon.getDay() === 0 ? 6 : mon.getDay() - 1; mon.setDate(mon.getDate() - dw);
          const label = o === 0 ? "Эта" : (mon.getDate() + " " + mon.toLocaleDateString("ru-RU", { month: "short" }).replace(".", ""));
          return React.createElement("button", { key: o, onClick: () => { setOffset(o); setOpenDay(-1); },
            style: { flex: 1, padding: "9px 2px", borderRadius: 9, border: `0.5px solid ${offset === o ? C.olive : C.border}`, background: offset === o ? C.oliveSoft : "transparent", color: offset === o ? C.oliveDeep : C.textM, fontSize: 11.5, fontWeight: offset === o ? 700 : 500, cursor: "pointer", fontFamily: "inherit" } }, label);
        })
      ),
      // \u0412\u0430\u0440\u0438\u0430\u043d\u0442 \u0413: \u0442\u043e\u043d\u043a\u0438\u0435 \u0441\u0442\u0440\u043e\u043a\u0438-\u0434\u043d\u0438 \u0441 \u0430\u043a\u0446\u0435\u043d\u0442\u043e\u043c \u043d\u0430 \u0437\u0430\u043d\u044f\u0442\u044b\u0445
      React.createElement("div", { style: { borderRadius: 12, overflow: "hidden", border: `0.5px solid ${C.border}`, marginBottom: 12 } },
        dayLabels.map((dl, di) => {
          const dayDate = new Date(monday); dayDate.setDate(dayDate.getDate() + di);
          const isToday = dayKey(dayDate) === dayKey(today);
          const acts = getActs(di);
          const pelvic = getPelvic(di);
          const pelvicCourseStarted = dayDate >= KEY_DATES.pelvicStart;
          const isOpen = openDay === di;
          const busy = acts.length > 0 || pelvic;
          const accent = busy ? (acts.length ? (actColor[acts[0].id] || C.olive) : C.pink) : "transparent";
          // Сортировка по времени: точное время → по нему; иначе по части суток (утро<день<вечер)
          const todRank = { morning: 1, day: 2, evening: 3 };
          const sortKey = (tod, time) => time ? (parseInt(time.split(":")[0], 10) * 60 + parseInt(time.split(":")[1] || "0", 10)) : ((todRank[tod] || 2) * 600);
          const dayItems = [];
          acts.forEach(a => { const s = SPORT_ACTS.find(x => x.id === a.id); if (s) dayItems.push({ kind: "act", icon: s.icon, label: s.l, time: a.time, tod: a.tod, color: actColor[a.id] || C.olive, sk: sortKey(a.tod, a.time) }); });
          if (pelvic) dayItems.push({ kind: "pelvic", icon: "🌸", label: "Тазовое дно", time: pelvic.time, tod: pelvic.tod, color: C.pink, sk: sortKey(pelvic.tod, pelvic.time) });
          dayItems.sort((a, b) => a.sk - b.sk);
          return React.createElement("div", { key: di, style: { borderTop: di > 0 ? `0.5px solid ${C.border}` : "none", background: isOpen ? C.bgWarm : (isToday ? C.oliveSoft + "55" : C.card) } },
            // Строка дня
            React.createElement("button", { onClick: () => setOpenDay(isOpen ? -1 : di),
              style: { width: "100%", textAlign: "left", background: "transparent", border: "none", borderLeft: `3px solid ${accent}`, padding: "11px 13px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 11 } },
              React.createElement("div", { style: { width: 42, flexShrink: 0 } },
                React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: isToday ? C.oliveDeep : C.textM } }, dayShort[di]),
                React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: busy || isToday ? C.text : C.textL } }, dayDate.getDate(), " ", dayDate.toLocaleDateString("ru-RU", { month: "short" }).replace(".", ""))
              ),
              React.createElement("div", { style: { flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" } },
                busy ? dayItems.map((it, k) => {
                  const when = it.time || (it.tod ? todMap[it.tod] : "");
                  return React.createElement("span", { key: k, style: { fontSize: 11.5, fontWeight: 600, color: it.kind === "pelvic" ? C.pink : C.text, background: it.color + (it.kind === "pelvic" ? "1e" : "22"), borderRadius: 999, padding: "3px 9px" } }, it.icon, " ", it.label, when ? (" · " + when) : "");
                }) : React.createElement("span", { style: { fontSize: 12, color: C.textL } }, "Отдых")
              ),
              React.createElement("span", { style: { fontSize: 11, color: C.textL, flexShrink: 0 } }, isOpen ? "✕" : "+")
            ),
            // \u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u043e\u0434 \u0441\u0442\u0440\u043e\u043a\u043e\u0439
            isOpen && React.createElement("div", { style: { padding: "2px 14px 14px 16px" } },
              React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 7 } }, "\u0422\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0438:"),
              React.createElement("div", { style: { display: "flex", gap: 5, flexWrap: "wrap" } },
                SPORT_ACTS.map(a => {
                  const on = acts.some(x => x.id === a.id);
                  return React.createElement("button", { key: a.id, onClick: () => toggleAct(di, a.id),
                    style: { padding: "6px 11px", borderRadius: 999, border: `0.5px solid ${on ? C.olive : C.border}`, background: on ? C.olive : "transparent", color: on ? "#fff" : C.textM, fontSize: 11.5, fontWeight: on ? 600 : 500, cursor: "pointer", fontFamily: "inherit" } }, a.icon, " ", a.l);
                })
              ),
              acts.map(a => {
                const s = SPORT_ACTS.find(x => x.id === a.id); if (!s) return null;
                return React.createElement("div", { key: a.id, style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 9, padding: "9px 11px", marginTop: 7 } },
                  React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 } }, s.icon, " ", s.l),
                  React.createElement("div", { style: { display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" } },
                    TOD.map(t => todChip(a.tod === t[0], t[1], () => setActTod(di, a.id, t[0]))),
                    React.createElement("input", { type: "time", value: a.time || "", onChange: e => setActTime(di, a.id, e.target.value),
                      style: { marginLeft: "auto", padding: "5px 8px", borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 11.5, fontFamily: "inherit", color: C.text, background: C.bg, outline: "none" } })
                  )
                );
              }),
              React.createElement("div", { style: { marginTop: 11, paddingTop: 11, borderTop: `0.5px solid ${C.border}` } },
                React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 7 } }, "\ud83c\udf38 \u0422\u0430\u0437\u043e\u0432\u043e\u0435 \u0434\u043d\u043e", !pelvicCourseStarted ? " (\u043a\u0443\u0440\u0441 \u0441 15 \u0438\u044e\u043d\u044f)" : ""),
                React.createElement("div", { style: { display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" } },
                  todChip(pelvic && pelvic.tod === "morning", "\u0423\u0442\u0440\u043e\u043c", () => setPelvicTod(di, "morning")),
                  todChip(pelvic && pelvic.tod === "evening", "\u0412\u0435\u0447\u0435\u0440\u043e\u043c", () => setPelvicTod(di, "evening")),
                  pelvic && React.createElement("input", { type: "time", value: pelvic.time || "", onChange: e => setPelvicTime(di, e.target.value),
                    style: { marginLeft: "auto", padding: "5px 8px", borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 11.5, fontFamily: "inherit", color: C.text, background: C.bg, outline: "none" } })
                )
              )
            )
          );
        })
      ),
      React.createElement("div", { style: { fontSize: 10.5, color: C.textL, lineHeight: 1.5, padding: "10px 12px", background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 9 } },
        "\u0426\u0432\u0435\u0442\u043d\u0430\u044f \u043f\u043e\u043b\u043e\u0441\u043a\u0430 \u0441\u043b\u0435\u0432\u0430 \u2014 \u0434\u0435\u043d\u044c \u0441 \u0442\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u043e\u0439. \u0422\u0430\u043f\u043d\u0438 \u0434\u0435\u043d\u044c, \u0447\u0442\u043e\u0431\u044b \u0432\u044b\u0431\u0440\u0430\u0442\u044c \u0442\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0438, \u0432\u0440\u0435\u043c\u044f \u0441\u0443\u0442\u043e\u043a \u0438 \u0442\u043e\u0447\u043d\u043e\u0435 \u0432\u0440\u0435\u043c\u044f. \u0417\u0430\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0435 \u043f\u043e\u044f\u0432\u0438\u0442\u0441\u044f \u0432 \u00ab\u0421\u0435\u0433\u043e\u0434\u043d\u044f\u00bb.")
    );
  }
  function TennisGuide() {
    const sections = [
      { h: "\ud83c\udfbe \u0421 \u0447\u0435\u0433\u043e \u043d\u0430\u0447\u0430\u0442\u044c \u043d\u043e\u0432\u0438\u0447\u043a\u0443", items: [
        "\u0417\u0430\u043f\u0438\u0448\u0438\u0441\u044c \u043d\u0430 3\u20135 \u0438\u043d\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043b\u044c\u043d\u044b\u0445 \u0437\u0430\u043d\u044f\u0442\u0438\u0439 \u0441 \u0442\u0440\u0435\u043d\u0435\u0440\u043e\u043c \u2014 \u043f\u043e\u0441\u0442\u0430\u0432\u044f\u0442 \u0445\u0432\u0430\u0442 \u0438 \u0443\u0434\u0430\u0440, \u044d\u0442\u043e \u0441\u044d\u043a\u043e\u043d\u043e\u043c\u0438\u0442 \u043c\u0435\u0441\u044f\u0446\u044b.",
        "\u041f\u0435\u0440\u0432\u044b\u0435 \u0442\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0438 \u2014 \u043f\u0440\u043e \u0447\u0443\u0432\u0441\u0442\u0432\u043e \u043c\u044f\u0447\u0430 \u0438 \u0440\u0430\u043a\u0435\u0442\u043a\u0438, \u0430 \u043d\u0435 \u043f\u0440\u043e \u0441\u0438\u043b\u0443. \u0420\u0430\u0441\u0441\u043b\u0430\u0431\u043b\u0435\u043d\u043d\u0430\u044f \u0440\u0443\u043a\u0430 \u0431\u044c\u0451\u0442 \u0442\u043e\u0447\u043d\u0435\u0435.",
        "\u041d\u0430\u0447\u0438\u043d\u0430\u0439 \u0441 \u0442\u0440\u0435\u043d\u0435\u0440\u043e\u043c \u043d\u0430 \u0443\u043a\u043e\u0440\u043e\u0447\u0435\u043d\u043d\u043e\u043c \u043a\u043e\u0440\u0442\u0435 \u2014 \u0431\u043e\u043b\u044c\u0448\u0435 \u043a\u0430\u0441\u0430\u043d\u0438\u0439 \u043c\u044f\u0447\u0430 \u0438 \u0431\u044b\u0441\u0442\u0440\u0435\u0435 \u043f\u0440\u043e\u0433\u0440\u0435\u0441\u0441." ] },
      { h: "\ud83d\udccf \u041f\u0440\u0430\u0432\u0438\u043b\u0430 (\u043a\u043e\u0440\u043e\u0442\u043a\u043e)", items: [
        "\u0421\u0447\u0451\u0442 \u0432 \u0433\u0435\u0439\u043c\u0435: 15 \u2192 30 \u2192 40 \u2192 \u0433\u0435\u0439\u043c. \u041f\u0440\u0438 40:40 (\u00ab\u0440\u043e\u0432\u043d\u043e\u00bb) \u043d\u0430\u0434\u043e \u0432\u044b\u0438\u0433\u0440\u0430\u0442\u044c 2 \u043e\u0447\u043a\u0430 \u043f\u043e\u0434\u0440\u044f\u0434.",
        "\u0421\u0435\u0442 \u2014 6 \u0433\u0435\u0439\u043c\u043e\u0432 (\u0441 \u0440\u0430\u0437\u043d\u0438\u0446\u0435\u0439 \u0432 2). \u041c\u0430\u0442\u0447 \u2014 \u043e\u0431\u044b\u0447\u043d\u043e 2 \u0432\u044b\u0438\u0433\u0440\u0430\u043d\u043d\u044b\u0445 \u0441\u0435\u0442\u0430 \u0438\u0437 3.",
        "\u041f\u043e\u0434\u0430\u0447\u0430 \u2014 \u043f\u043e \u0434\u0438\u0430\u0433\u043e\u043d\u0430\u043b\u0438, \u0434\u0430\u0451\u0442\u0441\u044f \u0434\u0432\u0430 \u0448\u0430\u043d\u0441\u0430. \u041c\u044f\u0447 \u0432 \u0441\u0432\u043e\u0451\u043c \u043f\u043e\u043b\u0435 \u043c\u043e\u0436\u0435\u0442 \u0443\u0434\u0430\u0440\u0438\u0442\u044c\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u043e\u0434\u0438\u043d \u0440\u0430\u0437.",
        "\u041c\u044f\u0447 \u043d\u0430 \u043b\u0438\u043d\u0438\u0438 \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044f \u00ab\u0432 \u0438\u0433\u0440\u0435\u00bb (\u0437\u0430\u0441\u0447\u0438\u0442\u0430\u043d)." ] },
      { h: "\ud83c\udf92 \u0427\u0442\u043e \u0431\u0440\u0430\u0442\u044c \u0441 \u0441\u043e\u0431\u043e\u0439", items: [
        "\u0420\u0430\u043a\u0435\u0442\u043a\u0430, 3\u20134 \u043c\u044f\u0447\u0430, \u0432\u043e\u0434\u0430, \u043f\u043e\u043b\u043e\u0442\u0435\u043d\u0446\u0435, \u0437\u0430\u043f\u0430\u0441\u043d\u0430\u044f \u0444\u0443\u0442\u0431\u043e\u043b\u043a\u0430.",
        "\u041d\u0430\u043f\u0443\u043b\u044c\u0441\u043d\u0438\u043a (\u043f\u043e\u0442 \u043d\u0435 \u0442\u0435\u0447\u0451\u0442 \u043d\u0430 \u043b\u0430\u0434\u043e\u043d\u044c), \u043a\u0435\u043f\u043a\u0430/\u043a\u043e\u0437\u044b\u0440\u0451\u043a \u043d\u0430 \u0443\u043b\u0438\u0446\u0435.",
        "\u0417\u0430\u043a\u043b\u0435\u0438\u0442\u044c \u043c\u043e\u0437\u043e\u043b\u0438 \u0437\u0430\u0440\u0430\u043d\u0435\u0435 \u2014 \u043d\u0430 \u0441\u0442\u0430\u0440\u0442\u0435 \u043a\u043e\u0436\u0430 \u043d\u0430 \u043b\u0430\u0434\u043e\u043d\u0438 \u043d\u0435 \u043f\u0440\u0438\u0432\u044b\u043a\u043b\u0430 \u043a \u0440\u0443\u0447\u043a\u0435." ] },
      { h: "\ud83c\udff8 \u041a\u0430\u043a \u0432\u044b\u0431\u0440\u0430\u0442\u044c \u0440\u0430\u043a\u0435\u0442\u043a\u0443", items: [
        "\u041d\u043e\u0432\u0438\u0447\u043a\u0443 \u2014 \u043b\u0451\u0433\u043a\u0430\u044f (260\u2013285 \u0433) \u0441 \u0431\u043e\u043b\u044c\u0448\u043e\u0439 \u0433\u043e\u043b\u043e\u0432\u043e\u0439 (100\u2013110 \u043a\u0432.\u0434\u044e\u0439\u043c\u043e\u0432): \u043f\u0440\u043e\u0449\u0430\u0435\u0442 \u043d\u0435\u0442\u043e\u0447\u043d\u044b\u0435 \u0443\u0434\u0430\u0440\u044b.",
        "\u0420\u0430\u0437\u043c\u0435\u0440 \u0440\u0443\u0447\u043a\u0438 (\u0433\u0440\u0438\u043f) \u0434\u043b\u044f \u0436\u0435\u043d\u0441\u043a\u043e\u0439 \u0440\u0443\u043a\u0438 \u043e\u0431\u044b\u0447\u043d\u043e L1 \u0438\u043b\u0438 L2.",
        "\u041d\u0435 \u0431\u0435\u0440\u0438 \u0434\u043e\u0440\u043e\u0433\u0443\u044e \u043f\u0440\u043e-\u043c\u043e\u0434\u0435\u043b\u044c \u2014 \u043e\u043d\u0438 \u0442\u044f\u0436\u0451\u043b\u044b\u0435 \u0438 \u0436\u0451\u0441\u0442\u043a\u0438\u0435, \u043d\u043e\u0432\u0438\u0447\u043a\u0443 \u043d\u0435\u0443\u0434\u043e\u0431\u043d\u043e.",
        "\u041f\u043e\u0434\u0435\u0440\u0436\u0438 \u0432 \u0440\u0443\u043a\u0435 \u043f\u0435\u0440\u0435\u0434 \u043f\u043e\u043a\u0443\u043f\u043a\u043e\u0439: \u0434\u043e\u043b\u0436\u043d\u0430 \u043b\u0435\u0436\u0430\u0442\u044c \u043a\u043e\u043c\u0444\u043e\u0440\u0442\u043d\u043e, \u043d\u0435 \u0442\u044f\u043d\u0443\u0442\u044c \u043a\u0438\u0441\u0442\u044c." ] },
      { h: "\ud83d\udc55 \u0424\u043e\u0440\u043c\u0430", items: [
        "\u0414\u044b\u0448\u0430\u0449\u0430\u044f \u0444\u0443\u0442\u0431\u043e\u043b\u043a\u0430/\u0442\u043e\u043f, \u0448\u043e\u0440\u0442\u044b \u0438\u043b\u0438 \u0442\u0435\u043d\u043d\u0438\u0441\u043d\u0430\u044f \u044e\u0431\u043a\u0430 \u0441\u043e \u0432\u0441\u0442\u0440\u043e\u0435\u043d\u043d\u044b\u043c\u0438 \u0448\u043e\u0440\u0442\u0438\u043a\u0430\u043c\u0438.",
        "\u041a\u0440\u043e\u0441\u0441\u043e\u0432\u043a\u0438 \u0438\u043c\u0435\u043d\u043d\u043e \u0442\u0435\u043d\u043d\u0438\u0441\u043d\u044b\u0435 (\u043f\u043b\u043e\u0441\u043a\u0430\u044f \u043f\u043e\u0434\u043e\u0448\u0432\u0430, \u0431\u043e\u043a\u043e\u0432\u0430\u044f \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430) \u2014 \u0431\u0435\u0433\u043e\u0432\u044b\u0435 \u0441\u043a\u043e\u043b\u044c\u0437\u044f\u0442 \u0438 \u0433\u0440\u043e\u0437\u044f\u0442 \u0442\u0440\u0430\u0432\u043c\u043e\u0439 \u0433\u043e\u043b\u0435\u043d\u043e\u0441\u0442\u043e\u043f\u0430.",
        "\u0421\u043f\u043e\u0440\u0442\u0438\u0432\u043d\u044b\u0439 \u0431\u0440\u0430 \u0441 \u0445\u043e\u0440\u043e\u0448\u0435\u0439 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u043e\u0439 \u2014 \u0432 \u0442\u0435\u043d\u043d\u0438\u0441\u0435 \u043c\u043d\u043e\u0433\u043e \u0440\u044b\u0432\u043a\u043e\u0432 \u0438 \u043f\u0440\u044b\u0436\u043a\u043e\u0432." ] },
      { h: "\u2728 \u041b\u0430\u0439\u0444\u0445\u0430\u043a\u0438 \u0438 \u043f\u0440\u0438\u0451\u043c\u044b", items: [
        "\u0421\u043c\u043e\u0442\u0440\u0438 \u043d\u0430 \u043c\u044f\u0447 \u0434\u043e \u043c\u043e\u043c\u0435\u043d\u0442\u0430 \u0443\u0434\u0430\u0440\u0430 \u2014 \u0433\u043b\u0430\u0432\u043d\u0430\u044f \u043e\u0448\u0438\u0431\u043a\u0430 \u043d\u043e\u0432\u0438\u0447\u043a\u043e\u0432 \u0432 \u0442\u043e\u043c, \u0447\u0442\u043e \u043e\u0442\u0432\u043e\u0434\u044f\u0442 \u0432\u0437\u0433\u043b\u044f\u0434.",
        "\u0413\u043e\u0442\u043e\u0432\u044c\u0441\u044f \u0437\u0430\u0440\u0430\u043d\u0435\u0435: \u0440\u0430\u0437\u0432\u043e\u0440\u0430\u0447\u0438\u0432\u0430\u0439 \u043a\u043e\u0440\u043f\u0443\u0441 \u0438 \u0437\u0430\u043d\u043e\u0441\u0438 \u0440\u0430\u043a\u0435\u0442\u043a\u0443, \u043f\u043e\u043a\u0430 \u043c\u044f\u0447 \u0435\u0449\u0451 \u043b\u0435\u0442\u0438\u0442.",
        "\u041f\u043e\u0441\u043b\u0435 \u0443\u0434\u0430\u0440\u0430 \u043f\u0440\u043e\u0432\u043e\u0436\u0430\u0439 \u043c\u044f\u0447 \u0440\u0430\u043a\u0435\u0442\u043a\u043e\u0439 (follow through), \u043d\u0435 \u00ab\u0442\u044b\u043a\u0430\u0439\u00bb.",
        "\u041d\u043e\u0433\u0438 \u0440\u0430\u0431\u043e\u0442\u0430\u044e\u0442 \u0432\u0441\u0435\u0433\u0434\u0430: \u043c\u0435\u043b\u043a\u0438\u0435 \u043f\u043e\u0434\u0448\u0430\u0433\u0438, \u043d\u0435 \u0441\u0442\u043e\u0439 \u043d\u0430 \u043c\u0435\u0441\u0442\u0435.",
        "\u041f\u043e\u0434\u0430\u0447\u0430: \u043f\u043e\u0434\u0431\u0440\u0430\u0441\u044b\u0432\u0430\u0439 \u043c\u044f\u0447 \u0441\u0442\u0430\u0431\u0438\u043b\u044c\u043d\u043e \u043f\u0435\u0440\u0435\u0434 \u0441\u043e\u0431\u043e\u0439 \u0447\u0443\u0442\u044c \u0432\u043f\u0440\u0430\u0432\u043e \u2014 \u044d\u0442\u043e \u043f\u043e\u043b\u043e\u0432\u0438\u043d\u0430 \u0443\u0441\u043f\u0435\u0445\u0430.",
        "\u0412\u044b\u0434\u044b\u0445\u0430\u0439 \u043d\u0430 \u0443\u0434\u0430\u0440\u0435 \u2014 \u0441\u043d\u0438\u043c\u0430\u0435\u0442 \u0437\u0430\u0436\u0430\u0442\u043e\u0441\u0442\u044c, \u043a\u0430\u043a \u0432 \u0437\u0430\u043b\u0435." ] },
      { h: "\ud83d\udc9b \u0414\u043b\u044f \u041c\u0430\u0448\u0438", items: [
        "\u0422\u0435\u043d\u043d\u0438\u0441 \u2014 \u043e\u0442\u043b\u0438\u0447\u043d\u043e\u0435 \u043a\u0430\u0440\u0434\u0438\u043e \u0438 \u043a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0446\u0438\u044f, \u0438 \u044d\u0442\u043e \u043f\u0440\u043e\u0441\u0442\u043e \u0440\u0430\u0434\u043e\u0441\u0442\u043d\u043e. \u041d\u0435 \u0441\u0443\u0434\u0438 \u0441\u0435\u0431\u044f \u0437\u0430 \u00ab\u043a\u0440\u0438\u0432\u044b\u0435\u00bb \u0443\u0434\u0430\u0440\u044b \u0432\u043d\u0430\u0447\u0430\u043b\u0435 \u2014 \u0447\u0435\u0440\u0435\u0437 \u044d\u0442\u043e \u043f\u0440\u043e\u0445\u043e\u0434\u044f\u0442 \u0432\u0441\u0435.",
        "\u0412 \u0434\u043d\u0438 \u043c\u0435\u0441\u044f\u0447\u043d\u044b\u0445 \u0438\u043b\u0438 \u0443\u0441\u0442\u0430\u043b\u043e\u0441\u0442\u0438 \u2014 \u0441\u043f\u043e\u043a\u043e\u0439\u043d\u044b\u0439 \u0440\u0430\u0437\u043c\u0435\u0440\u0435\u043d\u043d\u044b\u0439 \u0442\u0435\u043c\u043f, \u0431\u0435\u0437 \u0440\u044b\u0432\u043a\u043e\u0432 \u043d\u0430 \u0433\u0440\u0430\u043d\u0438.",
        "\u0420\u0430\u0437\u043e\u043c\u043d\u0438 \u043f\u043b\u0435\u0447\u0438, \u043a\u0438\u0441\u0442\u044c \u0438 \u043a\u043e\u0440\u043f\u0443\u0441 \u043f\u0435\u0440\u0435\u0434 \u0438\u0433\u0440\u043e\u0439 \u2014 \u0431\u0435\u0440\u0435\u0436\u0451\u043c \u0441\u043f\u0438\u043d\u0443." ] },
    ];
    return React.createElement("div", null,
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 11, padding: "12px 14px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.oliveDeep, marginBottom: 3 } }, "\ud83c\udfbe \u0422\u0435\u043d\u043d\u0438\u0441 \u0441 \u043d\u0443\u043b\u044f"),
        React.createElement("div", { style: { fontSize: 11.5, color: C.text, lineHeight: 1.5 } }, "\u041a\u043e\u0440\u043e\u0442\u043a\u0438\u0439 \u0433\u0438\u0434, \u0447\u0442\u043e\u0431\u044b \u043d\u0430\u0447\u0430\u0442\u044c \u0443\u0432\u0435\u0440\u0435\u043d\u043d\u043e. \u0413\u043b\u0430\u0432\u043d\u043e\u0435 \u2014 \u0443\u0434\u043e\u0432\u043e\u043b\u044c\u0441\u0442\u0432\u0438\u0435, \u0442\u0435\u0445\u043d\u0438\u043a\u0430 \u043f\u0440\u0438\u0434\u0451\u0442.")),
      sections.map((s, i) => React.createElement("div", { key: i, style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 11, padding: "12px 14px", marginBottom: 9 } },
        React.createElement("div", { style: { fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 8 } }, s.h),
        s.items.map((it, j) => React.createElement("div", { key: j, style: { fontSize: 11.5, color: C.textM, lineHeight: 1.55, marginBottom: 6, display: "flex", gap: 7 } },
          React.createElement("span", { style: { color: C.olive, flexShrink: 0 } }, "\u2022"),
          React.createElement("span", null, it)))
      ))
    );
  }
  function SportTab({ workoutDays, doneCount, weekLog, markDay, DR, todayDow, selDay, setSelDay, dayCAvailable, setWorkoutDays, cycleAnchor, periodOverrides }) {
    const [sub, setSub] = useState("today");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const gymOpen = today >= KEY_DATES.gymStart;
    const runOpen = today >= KEY_DATES.runStart;
    const pelvicOpen = today >= KEY_DATES.pelvicStart;

    const subs = [
      { id: "today",  l: "📅 Сегодня" },
      { id: "plan",   l: "📋 План недели" },
      { id: "trends", l: "📊 Тренды" },
      { id: "gym",    l: "🏋 Зал" },
      { id: "pelvic", l: "🌸 Таз.дно" },
      { id: "run",    l: "🏃 Бег" },
      { id: "tennis", l: "🎾 Теннис" },
    ];

    // Карточка "Сегодня в спорте" — что по плану на этот день
    const renderTodayCard = () => {
      const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
      let plannedToday = null, plannedPelvic = null;
      try {
        const wp = (JSON.parse(localStorage.getItem("sportWeekPlanV1") || "{}") || {});
        const wd = wp[weekStartKey(today)];
        if (wd) {
          plannedToday = (wd.acts && wd.acts[dow]) ? wd.acts[dow] : [];
          plannedPelvic = (wd.pelvic && wd.pelvic[dow]) ? wd.pelvic[dow] : null;
        }
      } catch {}
      const isTrain = gymOpen && workoutDays.includes(dow);
      const dayLabels = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];
      // Учитываем дни 1-3 месячных — заменяем тренировку на прогулку (как на Сегодня)
      const periodDay = cycleAnchor ? getPeriodDay(today, cycleAnchor, periodOverrides || {}) : 0;
      const isLowDay = periodDay >= 1 && periodDay <= 3;
      // Учитываем badDay из localStorage
      let badDayActive = false;
      try { badDayActive = JSON.parse(localStorage.getItem("badDayToday_" + new Date().toDateString()) || "false"); } catch {}

      // Список активностей сегодня
      const acts = [];
      if (badDayActive) {
        acts.push({ icon: "💛", time: "—", label: "Плохой день — режим лёгкого движения", dur: "Без силовой, мягкое движение по желанию" });
      } else if (isLowDay) {
        acts.push({ icon: "🌸", time: "—", label: `День ${periodDay} месячных — лёгкая интенсивность`, dur: "Без силовой, мягкое движение по желанию" });
        if (pelvicOpen && dow !== 6) acts.push({ icon: "🌸", time: "18:00", label: "Курс таз. дна", dur: "30 мин · помогает при ПМС" });
      } else if (isTrain) {
        let trainingCount = 0;
        if (cycleAnchor) {
          const d0 = new Date(KEY_DATES.gymStart);
          const d1 = new Date(today); d1.setHours(0, 0, 0, 0);
          for (let d = new Date(d0); d < d1; d.setDate(d.getDate() + 1)) {
            const dw = d.getDay() === 0 ? 6 : d.getDay() - 1;
            if (workoutDays.includes(dw)) {
              const pd = getPeriodDay(d, cycleAnchor, periodOverrides || {});
              if (pd < 1 || pd > 3) trainingCount++;
            }
          }
        }
        const types = (dayCAvailable && workoutDays.length >= 3) ? 3 : 2;
        const dayType = trainingCount % types;
        const dayName = dayType === 0 ? "День A (Ягодицы + Кор)"
          : dayType === 1 ? "День B (Спина + Кор)"
          : "День C (Ягодицы + Ноги)";
        acts.push({ icon: "🏋", time: "18:00", label: `Зал — ${dayName}`, dur: "50 мин (10 разминка + 40 силовая)" });
        if (pelvicOpen) acts.push({ icon: "🌸", time: "18:50", label: "Курс таз. дна в зале", dur: "30 мин (заминка после силовой)" });
      } else {
        if (pelvicOpen && dow !== 6) acts.push({ icon: "🌸", time: "18:00", label: "Курс таз. дна", dur: "30 мин" });
        if (dow === 5 && runOpen) acts.push({ icon: "🏃", time: "10:00", label: "Ходьба / лёгкий бег", dur: "30 мин (в любое удобное время)" });
        if (dow === 6) acts.push({ icon: "🌙", time: "—", label: "День отдыха", dur: "Восстановление" });
      }

      return React.createElement("div", null,
        // Твой план на сегодня (из планировщика недели)
        (plannedToday && (plannedToday.length > 0 || plannedPelvic)) && React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}44`, borderRadius: 12, padding: "13px 14px", marginBottom: 12 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.oliveDeep, marginBottom: 8 } }, "📋 Твой план на сегодня"),
          plannedToday.map((item, i) => {
            const aid = typeof item === "string" ? item : item.id;
            const a = SPORT_ACTS.find(x => x.id === aid);
            if (!a) return null;
            const todMap = { morning: "утром", day: "днём", evening: "вечером" };
            const when = (typeof item === "object") ? (item.time || (item.tod ? todMap[item.tod] : "")) : "";
            return React.createElement("div", { key: i, style: { fontSize: 12.5, color: C.text, lineHeight: 1.7 } }, a.icon, " ", a.l, when ? (" · " + when) : "");
          }),
          plannedPelvic && (() => {
            const pv = typeof plannedPelvic === "string" ? { tod: plannedPelvic } : plannedPelvic;
            const when = pv.time || (pv.tod === "morning" ? "утром" : "вечером");
            return React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.7 } }, "🌸 Тазовое дно — ", when, " (30 мин)");
          })(),
          (plannedToday.length === 0 && !plannedPelvic) && React.createElement("div", { style: { fontSize: 12, color: C.textM, fontStyle: "italic" } }, "На сегодня ничего не запланировано — отдых"),
          React.createElement("div", { style: { fontSize: 10, color: C.textL, marginTop: 6 } }, "Изменить — во вкладке «План недели»")
        ),
        React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 12 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, "Сегодня · ", dayLabels[dow]),
            React.createElement("div", { style: { fontSize: 11, color: C.textM } }, today.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }))
          ),
          acts.length === 0
            ? React.createElement("div", { style: { fontSize: 12, color: C.textM, fontStyle: "italic", padding: "10px 0" } }, "Сегодня нет запланированных активностей")
            : acts.map((a, i) => React.createElement("div", { key: i,
                style: { display: "flex", alignItems: "center", gap: 11, padding: "9px 0",
                  borderBottom: i < acts.length - 1 ? `0.5px solid ${C.border}` : "none" }
              },
                React.createElement("div", { style: { fontSize: 20 } }, a.icon),
                React.createElement("div", { style: { flex: 1 } },
                  React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "baseline" } },
                    React.createElement("div", { style: { fontSize: 11, color: C.olive, fontWeight: 600, fontVariantNumeric: "tabular-nums" } }, a.time),
                    React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, a.label)
                  ),
                  React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } }, a.dur)
                )
              ))
        ),

        // Кнопки перехода в подвкладки
        React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: C.textM, marginBottom: 7, letterSpacing: 0.3 } }, "ОТКРЫТЬ ДЕТАЛИ"),
        React.createElement("button", { onClick: () => setSub("plan"),
          style: { width: "100%", display: "flex", alignItems: "center", gap: 10, background: C.oliveSoft, border: `0.5px solid ${C.olive}44`, borderRadius: 10, padding: "11px 13px", marginBottom: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "left" } },
          React.createElement("div", { style: { fontSize: 18, flexShrink: 0 } }, "📋"),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.oliveDeep } }, "План недели"),
            React.createElement("div", { style: { fontSize: 10.5, color: C.textM, marginTop: 1 } }, "Расставить тренировки на каждый день")
          ),
          React.createElement("div", { "aria-hidden": "true", style: { fontSize: 13, color: C.olive } }, "›")
        ),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 } },
          [
            { id: "gym", l: "🏋 Зал", sub: gymOpen ? "Программы тренировок" : "С 10 июня" },
            { id: "pelvic", l: "🌸 Таз. дно", sub: pelvicOpen ? "30 мин в день" : "С " + KEY_DATES.pelvicStart.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) },
            { id: "tennis", l: "🎾 Теннис", sub: "Гид для начинающих" },
            { id: "run", l: "🏃 Бег", sub: runOpen ? "Программа ходьба→бег" : "С 15 июня" },
          ].map(b => React.createElement("button", { key: b.id, onClick: () => setSub(b.id),
            style: { padding: "11px 13px", borderRadius: 10, background: C.card, border: `0.5px solid ${C.border}`,
              cursor: "pointer", textAlign: "left", fontFamily: "inherit" }
          },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, b.l),
            React.createElement("div", { style: { fontSize: 10, color: C.textM, marginTop: 3 } }, b.sub)
          ))
        ),
        // «Не могу в зал» → мягкая альтернатива
        isTrain && React.createElement("div", { style: { marginTop: 10, background: C.bgWarm, borderRadius: 11, padding: "12px 14px" } },
          React.createElement("div", { style: { fontSize: 12.5, fontWeight: 600, color: C.text, marginBottom: 4 } }, "Сегодня не получается в зал?"),
          React.createElement("div", { style: { fontSize: 11.5, color: C.textM, lineHeight: 1.55 } },
            "Это ок. Пропустить зал — не значит пропустить день. Мягкое движение 30–40 минут тоже считается и тоже работает на тебя.")
        )
      );
    };

    // Настройки активности
    const renderSettings = () => {
      const toggleDay = (d) => {
        const cur = workoutDays.includes(d) ? workoutDays.filter(x => x !== d) : workoutDays.length < 3 ? [...workoutDays, d].sort() : workoutDays;
        setWorkoutDays(cur);
      };
      return React.createElement("div", null,
        React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "13px 14px", marginBottom: 10 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 } }, "Дни силовых тренировок"),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 10, lineHeight: 1.5 } },
            "По умолчанию — среда + пятница. Можешь выбрать до 3 дней. С 6 июля доступен День C — добавь третий день."
          ),
          React.createElement("div", { style: { display: "flex", gap: 5, flexWrap: "wrap" } },
            DR.map((d, i) => {
              const sel = workoutDays.includes(i);
              return React.createElement("button", {
                key: i, onClick: () => toggleDay(i),
                style: { padding: "10px 13px", borderRadius: 9, border: `0.5px solid ${sel ? C.olive : C.border}`,
                  background: sel ? C.oliveSoft : C.bg, cursor: "pointer", fontFamily: "inherit",
                  fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? C.oliveDeep : C.textM }
              }, d);
            })
          ),
          React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 8 } },
            "Выбрано: ", workoutDays.map(d => DR[d]).join(", ") || "нет"
          )
        ),
        React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 10, padding: "11px 13px" } },
          React.createElement("div", { style: { fontSize: 11, color: C.oliveDeep, lineHeight: 1.6 } },
            "💡 По плану: ср+пт (День A в среду, День B в пятницу). С 6 июля можно добавить День C — раз в 2 недели вместо A или B, не в дополнение."
          )
        )
      );
    };

    return React.createElement("div", null,
      // Tab strip
      React.createElement("div", { style: { display: "flex", gap: 3, marginBottom: 14, overflowX: "auto", paddingBottom: 2 } },
        subs.map(s => React.createElement("button", { key: s.id, onClick: () => setSub(s.id),
          style: { padding: "8px 11px", borderRadius: 8, border: `0.5px solid ${sub === s.id ? C.olive : C.border}`,
            background: sub === s.id ? C.olive : C.card, color: sub === s.id ? "#fff" : C.textM,
            fontSize: 11, fontWeight: sub === s.id ? 600 : 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }
        }, s.l))
      ),

      sub === "today" && renderTodayCard(),
      sub === "plan" && React.createElement(SportPlanner, null),
      sub === "trends" && React.createElement(SportTrends, null),
      sub === "tennis" && React.createElement(TennisGuide, null),
      sub === "pelvic" && React.createElement(PelvicSubTab, null),

      // GYM — если до 10 июня, показываем предупреждение
      sub === "gym" && !gymOpen && React.createElement("div", { style: { padding: "13px 15px", background: C.oliveSoft, border: `0.5px solid ${C.olive}44`, borderRadius: 10 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.oliveDeep, marginBottom: 5 } }, "🔒 Зал стартует 10 июня"),
        React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.6 } },
          "До 10 июня — мягкое движение и курс таз. дна. Первая силовая будет в среду 10 июня — День A (Ягодицы + Кор). По плану ср + пт. Программа: 10 мин разминка + 40 мин силовая + 30 мин таз. дна = 80 мин."
        )
      ),
      sub === "gym" && gymOpen && React.createElement("div", null,
        // Кнопки A / B / C
        React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 12 } },
          DAYS.map((d, i) => {
            const locked = (i === 2 && !dayCAvailable);
            return React.createElement("button", { key: i, onClick: () => { if (!locked) setSelDay(i); }, disabled: locked,
              style: { flex: 1, padding: "11px 4px", borderRadius: 10, border: `0.5px solid ${selDay === i ? d.clr : C.border}`,
                background: locked ? C.bgWarm : (selDay === i ? d.clrS : C.card),
                cursor: locked ? "not-allowed" : "pointer", opacity: locked ? 0.55 : 1, fontFamily: "inherit" }
            },
              React.createElement("div", { style: { fontSize: 17 } }, locked ? "🔒" : d.emoji),
              React.createElement("div", { style: { fontSize: 11, color: selDay === i ? d.clrD : C.textM, fontWeight: 600, marginTop: 3 } }, "День ", d.id),
              React.createElement("div", { style: { fontSize: 10, color: C.textL } }, locked ? "с 6 июля" : (workoutDays.length > i ? DR[workoutDays[i]] : ""))
            );
          })
        ),
        selDay === 2 && dayCAvailable && React.createElement("div", { style: { padding: "11px 13px", borderRadius: 10, marginBottom: 11, background: C.warnSoft, border: `0.5px solid ${C.warn}44` } },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.warn, marginBottom: 4 } }, "⚠ День C — высокая интенсивность"),
          React.createElement("div", { style: { fontSize: 11, color: C.text, lineHeight: 1.55 } }, "Начинай с минимальных весов. Без натуживания. Раз в 2 недели вместо Дня A или B — не в дополнение.")
        ),
        React.createElement("div", { style: { padding: "11px 13px", borderRadius: 11, marginBottom: 11, background: DAYS[selDay].clrS, border: `0.5px solid ${DAYS[selDay].clr}55` } },
          React.createElement("div", { style: { fontSize: 15, fontWeight: 600, color: C.text } }, DAYS[selDay].emoji, " ", DAYS[selDay].name),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } },
            "10 мин разминка · ", DAYS[selDay].exercises.length, " упражнений · 30 мин таз. дна после"
          )
        ),
        React.createElement(WorkoutScreen, { day: DAYS[selDay] }),
        React.createElement(WorkoutHistory, null),
        React.createElement("div", { style: { marginTop: 14, paddingTop: 14, borderTop: `0.5px solid ${C.border}` } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.oliveDeep, marginBottom: 10 } }, "🦊 Спокойно в зал"),
          React.createElement(GymComfortTab, null)
        )
      ),

      sub === "run" && React.createElement("div", null,
        !runOpen && React.createElement("div", { style: { padding: "13px 15px", background: C.oliveSoft, border: `0.5px solid ${C.olive}44`, borderRadius: 10, marginBottom: 11 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.oliveDeep, marginBottom: 5 } }, "🏃 Бег/ходьба стартует 15 июня"),
          React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.6 } },
            "На старте — быстрая ходьба или incline walking. Темп разговорный (должна мочь говорить). При низком ферритине бегать рано — начнём с ходьбы, потом постепенно введём беговые отрезки. 1 раз в неделю (суббота если не тренировочный день)."
          )
        ),
        React.createElement(RunTab, null)
      )
    );
  }

  // ===========================================================================
  // IronGutTab — железо и запоры: доказательная, структурированная информация.
  // Источники: Stoffel et al. (Lancet Haematology 2017; Haematologica 2020),
  // данные по ferrous bisglycinate vs ferrous sulfate, профиль дулоксетина, макрогол.
  // ===========================================================================
  function IronGutTab() {
    const [open, setOpen] = useState(-1);
    const [showProtocol, setShowProtocol] = useState(false);
    const Card = (children, bg, bd) => React.createElement("div", {
      style: { background: bg || C.card, border: `0.5px solid ${bd || C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 10 }
    }, children);
    const H = (t, c) => React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: c || C.text, marginBottom: 6 } }, t);
    const P = (t) => React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 6 } }, t);
    const Li = (items, clr) => React.createElement("div", null,
      items.map((t, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" } },
        React.createElement("div", { style: { color: clr || C.olive, fontSize: 12, lineHeight: 1.5, flexShrink: 0 } }, "•"),
        React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.55 } }, t)
      ))
    );

    const faq = [
      { q: "Почему именно «через день», а не каждый день?",
        a: "В рандомизированных исследованиях (Stoffel и соавт., Lancet Haematology 2017; Haematologica 2020) приём железа через день у женщин с дефицитом давал более высокое усвоение каждой дозы и меньше желудочно-кишечных побочных эффектов, чем ежедневный приём. Причина — гепсидин: после дозы железа он растёт и на ~24 ч снижает всасывание следующей дозы. Пауза в день даёт гепсидину опуститься." },
      { q: "Gentle Iron крепит так же, как обычное железо?",
        a: "Обычно меньше. Gentle Iron — это бисглицинат железа (хелат): железо «упаковано» в аминокислоту и высвобождается уже в клетке слизистой, а не в просвете кишки. Поэтому свободного железа, раздражающего кишечник, меньше, и в сравнительных исследованиях бисглицинат даёт значимо меньше запоров и тошноты, чем сульфат железа — при сопоставимом росте ферритина и часто на меньшей дозе." },
      { q: "У меня запор и от Дуксета тоже?",
        a: "Да, это важно учитывать: запор — частый побочный эффект дулоксетина (примерно у 10–15% по данным производителя). То есть на запор работают сразу два фактора (железо + Дуксет), плюс исходный хронический запор. Поэтому Форлакс в плане — не «на всякий случай», а обоснованная поддержка." },
      { q: "Форлакс можно долго? Не будет привыкания?",
        a: "Макрогол (действующее вещество Форлакса) — осмотическое слабительное, считается средством первой линии при хроническом запоре и подходит для длительного приёма под контролем врача. Он не всасывается в кровь, не раздражает стенку кишки (в отличие от стимулирующих слабительных) и не вызывает физической зависимости. Дозу по мере улучшения обычно постепенно снижают, а не бросают резко." },
      { q: "Через сколько подействует Форлакс?",
        a: "Не сразу — обычно через 24–48 часов после первой дозы (нужно время, чтобы вода набралась в кишечнике и размягчила стул). Не пугайся, если в первый день эффекта нет." },
      { q: "Чёрный стул от железа — это опасно?",
        a: "Нет, тёмный/почти чёрный стул на фоне железа — норма. Тревожный признак — алая кровь или чёрный дёгтеобразный (липкий, блестящий) стул: это уже повод к врачу, и к обычному потемнению от железа отношения не имеет." },
    ];

    return React.createElement("div", null,
      // Вступление
      Card(React.createElement(React.Fragment, null,
        H("🌀 Железо и запоры — почему это связано", C.oliveDeep),
        P("У тебя на запор работают три фактора сразу: само железо, Дуксет (дулоксетин) и исходный хронический запор. Хорошая новость — план это уже учитывает: мягкая форма железа (Gentle Iron), приём через день и Форлакс."),
        React.createElement("div", { style: { fontSize: 11, color: C.textL, fontStyle: "italic", lineHeight: 1.5 } },
          "Это справочная информация, не замена консультации врача.")
      ), C.oliveSoft, C.olive + "55"),
      // Коротко: что делать (быстрый чек-лист)
      Card(React.createElement(React.Fragment, null,
        H("✅ Что делать (коротко)"),
        Li([
          React.createElement(React.Fragment, null, React.createElement("b", null, "Железо — через день"), " (Ср/Пт/Вс), с витамином C, без кофе/чая/молочного 2 ч."),
          React.createElement(React.Fragment, null, React.createElement("b", null, "Форлакс"), " — полный стакан воды (~250 мл), отдельно от таблеток ±2 ч."),
          React.createElement(React.Fragment, null, React.createElement("b", null, "Вода и движение"), " — без жидкости слабительное не работает; ежедневная ходьба помогает."),
          React.createElement(React.Fragment, null, React.createElement("b", null, "Клетчатка"), " — киви, чернослив, псиллиум, овёс (см. рецепты для ЖКТ)."),
          React.createElement(React.Fragment, null, React.createElement("b", null, "Тёмный стул"), " от железа — норма; алая кровь или чёрный липкий — к врачу."),
        ])
      )),
      // 7-дневный протокол восстановления моторики (раскрывается)
      React.createElement("button", {
        onClick: () => setShowProtocol(v => !v),
        "aria-expanded": showProtocol,
        style: { width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
          background: C.oliveSoft, border: `0.5px solid ${C.olive}44`, borderRadius: 10, padding: "12px 14px", marginTop: 2,
          cursor: "pointer", fontFamily: "inherit" }
      },
        React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.oliveDeep } }, "💧 7-дневный протокол моторики кишечника"),
        React.createElement("span", { "aria-hidden": "true", style: { fontSize: 11, color: C.olive } }, showProtocol ? "Скрыть ▲" : "Открыть ▼")
      ),
      showProtocol && React.createElement("div", { className: "ux-enter", style: { marginTop: 8 } },
        React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.5, marginBottom: 10 } },
          "Каждый день — новый навык. Делай последовательно, не торопись. Накладывается на Форлакс — это поведенческая часть."),
        GUT_PROTOCOL.map((p, pi) => React.createElement("div", { key: pi, style: { background: C.card, borderRadius: 12, padding: "12px 13px", marginBottom: 8, border: `0.5px solid ${C.border}` } },
          React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 7, alignItems: "center" } },
            React.createElement("div", { style: { width: 28, height: 28, borderRadius: 8, background: C.oliveSoft, border: `1px solid ${C.olive}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: C.oliveDeep, flexShrink: 0 } }, p.day),
            React.createElement("div", { style: { fontSize: 12.5, fontWeight: 700, color: C.text } }, p.title)
          ),
          p.items.map((item, ii) => React.createElement("div", { key: ii, style: { display: "flex", gap: 8, marginBottom: 4 } },
            React.createElement("div", { style: { width: 4, height: 4, borderRadius: "50%", background: C.olive, marginTop: 7, flexShrink: 0 } }),
            React.createElement("div", { style: { fontSize: 12, color: C.textM, lineHeight: 1.5 } }, item)
          ))
        ))
      ),

      // Что снижает запор от железа
      Card(React.createElement(React.Fragment, null,
        H("Что реально снижает запор от железа"),
        Li([
          React.createElement(React.Fragment, null, React.createElement("b", null, "Форма железа."), " Gentle Iron (бисглицинат) мягче для ЖКТ, чем сульфат железа."),
          React.createElement(React.Fragment, null, React.createElement("b", null, "Приём через день."), " Меньше железа раздражает кишечник и выше усвоение каждой дозы."),
          React.createElement(React.Fragment, null, React.createElement("b", null, "Достаточно воды."), " Без жидкости любое слабительное (и Форлакс) не работает."),
          React.createElement(React.Fragment, null, React.createElement("b", null, "Клетчатка и движение."), " Овощи, фрукты, цельные злаки + ежедневная ходьба поддерживают моторику."),
          React.createElement(React.Fragment, null, React.createElement("b", null, "Не превышать дозу."), " Больше железа ≠ быстрее результат: лишнее не усваивается и усиливает запор."),
        ])
      )),

      // Красные флаги
      Card(React.createElement(React.Fragment, null,
        H("🚩 Когда к врачу", C.warn),
        Li([
          "Алая кровь в стуле или чёрный липкий дёгтеобразный стул",
          "Запор дольше 3 дней подряд несмотря на Форлакс, или сильная боль/вздутие",
          "Рвота, отсутствие газов и стула (признаки непроходимости) — срочно",
          "Резкая смена режима стула, которая держится неделями",
        ], C.warn)
      ), C.warnSoft, C.warn + "55"),

      // FAQ
      React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: C.textM, margin: "4px 0 8px", letterSpacing: 0.3, textTransform: "uppercase" } }, "Подробнее (доказательно)"),
      faq.map((f, i) => React.createElement("div", { key: i, style: { marginBottom: 7 } },
        React.createElement("button", {
          onClick: () => setOpen(open === i ? -1 : i),
          "aria-expanded": open === i,
          style: { width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
            background: C.card, border: `0.5px solid ${open === i ? C.olive : C.border}`, borderRadius: 10, padding: "11px 13px",
            cursor: "pointer", fontFamily: "inherit" }
        },
          React.createElement("span", { style: { fontSize: 12.5, fontWeight: 600, color: C.text } }, f.q),
          React.createElement("span", { "aria-hidden": "true", style: { fontSize: 11, color: C.textL, flexShrink: 0 } }, open === i ? "▲" : "▼")
        ),
        open === i && React.createElement("div", { className: "ux-enter", style: { background: C.bgWarm, borderRadius: 9, padding: "11px 13px", marginTop: 4, fontSize: 12, color: C.text, lineHeight: 1.6 } }, f.a)
      )),

      // Источники
      React.createElement("div", { style: { fontSize: 11, color: C.textL, lineHeight: 1.6, marginTop: 10, padding: "10px 12px", background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 9 } },
        React.createElement("b", null, "Источники:"), " Stoffel NU et al., Lancet Haematology 2017 и Haematologica 2020 (приём железа через день); сравнительные данные ferrous bisglycinate vs ferrous sulfate; инструкция дулоксетина (частота запора 10–15%); рекомендации по макроголу как средству первой линии при хроническом запоре."
      ),

    );
  }

  // ===========================================================================
  // HealthTab — Цикл, Совместимость, Железо и ЖКТ, Это нормально, Тренды, Анализы, Питание.
  // ===========================================================================
  function MyMedsList({ packAnchor }) {
    const fmt = (ds) => { try { return mkd(ds).toLocaleDateString("ru-RU", { day: "numeric", month: "long" }); } catch (e) { return ds; } };
    const dowNames = ["\u041f\u043d", "\u0412\u0442", "\u0421\u0440", "\u0427\u0442", "\u041f\u0442", "\u0421\u0431", "\u0412\u0441"];
    const schedText = (p) => {
      if (p.yarinaPack) return "21 \u0442\u0430\u0431\u043b\u0435\u0442\u043a\u0430 + 7 \u0434\u043d\u0435\u0439 \u043f\u0435\u0440\u0435\u0440\u044b\u0432";
      if (p.ironRule) return "\u0447\u0435\u0440\u0435\u0437 \u0434\u0435\u043d\u044c (\u0421\u0440/\u041f\u0442/\u0412\u0441)";
      if (p.everyOtherFrom) return "\u0447\u0435\u0440\u0435\u0437 \u0434\u0435\u043d\u044c";
      if (p.weekdays) return p.weekdays.map((d) => dowNames[d]).join(" / ");
      return "\u043a\u0430\u0436\u0434\u044b\u0439 \u0434\u0435\u043d\u044c";
    };
    const groupsByTime = [
      { l: "\ud83c\udf05 \u0423\u0442\u0440\u043e", t: ["08:15", "09:00"] },
      { l: "\ud83c\udf7d \u0414\u0435\u043d\u044c", t: ["14:00", "16:00", "18:00"] },
      { l: "\ud83c\udf06 \u0412\u0435\u0447\u0435\u0440", t: ["20:00"] },
      { l: "\ud83c\udf19 \u041d\u043e\u0447\u044c", t: ["21:00", "22:00"] },
    ];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return React.createElement("div", null,
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 11, padding: "12px 14px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.oliveDeep, marginBottom: 3 } }, "\ud83d\udc8a \u041c\u043e\u0438 \u043f\u0440\u0435\u043f\u0430\u0440\u0430\u0442\u044b"),
        React.createElement("div", { style: { fontSize: 11.5, color: C.text, lineHeight: 1.5 } }, "\u0427\u0442\u043e, \u0432 \u043a\u0430\u043a\u043e\u0439 \u0434\u043e\u0437\u0435 \u0438 \u0441 \u043a\u0430\u043a\u043e\u0433\u043e \u0434\u043d\u044f. \u0423\u0434\u043e\u0431\u043d\u043e \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0432\u0440\u0430\u0447\u0443. \u041f\u0440\u0438\u0451\u043c \u0438 \u0440\u0430\u0441\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u2014 \u043d\u0430 \u0432\u043a\u043b\u0430\u0434\u043a\u0435 \u00ab\u0421\u0435\u0433\u043e\u0434\u043d\u044f\u00bb.")),
      groupsByTime.map((grp, gi) => {
        const meds = DEFAULT_PILLS.filter((p) => grp.t.includes(p.time));
        if (meds.length === 0) return null;
        return React.createElement("div", { key: gi, style: { marginBottom: 12 } },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.textM, marginBottom: 6 } }, grp.l),
          meds.map((p) => {
            const started = p.startDate ? mkd(p.startDate) <= today : true;
            const ended = p.endDate ? mkd(p.endDate) < today : false;
            return React.createElement("div", { key: p.id, style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 6, opacity: ended ? 0.5 : 1 } },
              React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 } },
                React.createElement("div", { style: { fontSize: 12.5, fontWeight: 600, color: p.color } }, p.name),
                React.createElement("div", { style: { fontSize: 11, color: C.textM, flexShrink: 0 } }, p.time)
              ),
              React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 3, lineHeight: 1.5 } },
                schedText(p),
                p.startDate ? (" \u00b7 \u0441 " + fmt(p.startDate)) : "",
                p.endDate ? (" \u0434\u043e " + fmt(p.endDate)) : "",
                (!started && p.startDate) ? " \u00b7 \u0435\u0449\u0451 \u043d\u0435 \u043d\u0430\u0447\u0430\u0442" : "",
                ended ? " \u00b7 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043d" : ""
              ),
              p.optional && React.createElement("div", { style: { fontSize: 10.5, color: C.textL, marginTop: 2 } }, "\u043f\u043e \u043d\u0435\u043e\u0431\u0445\u043e\u0434\u0438\u043c\u043e\u0441\u0442\u0438")
            );
          })
        );
      }),
      React.createElement("div", { style: { fontSize: 10.5, color: C.textL, lineHeight: 1.5, marginTop: 2, padding: "10px 12px", background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 9 } },
        "\u0414\u043e\u0437\u044b \u0438 \u0441\u0445\u0435\u043c\u0430 \u2014 \u043f\u043e \u0441\u043e\u0433\u043b\u0430\u0441\u043e\u0432\u0430\u043d\u0438\u044e \u0441 \u0432\u0440\u0430\u0447\u043e\u043c. \u042d\u0442\u043e \u0442\u0432\u043e\u044f \u0442\u0435\u043a\u0443\u0449\u0430\u044f \u0441\u0445\u0435\u043c\u0430 \u0432 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0438.")
    );
  }
  function HealthTab({ cycleAnchor, packAnchor, periodOverrides }) {
    const [sub, setSub] = useState("cycle");
    // Сгруппировано: Цикл · Препараты(совмест.+норма+ЖКТ) · Прогресс(тренды+анализы) · Питание
    const groups = [
      { id: "hairgrp", l: "🦊 Волосы", views: [] },
      { id: "cycle", l: "🌿 Цикл", views: [] },
      { id: "meds", l: "💊 Препараты", views: [
        { id: "mymeds", l: "Мои препараты" }, { id: "compat", l: "Совместимость" }, { id: "gut", l: "Железо и ЖКТ" } ] },
      { id: "progress", l: "📈 Прогресс", views: [
        { id: "trends", l: "Тренды" }, { id: "tests", l: "Анализы" }, { id: "flares", l: "Обострения" } ] },
    ];
    // Определяем активную группу по текущему sub
    const groupOf = (s) => {
      if (["hair", "pcos", "gloss_pcos"].includes(s)) return "hairgrp";
      if (s === "cycle") return "cycle";
      if (["skin", "sleep", "season"].includes(s)) return "body";
      if (["mymeds", "compat", "ask_supp", "gut", "normal"].includes(s)) return "meds";
      return "progress";
    };
    const activeGroup = groupOf(sub);
    const onGroup = (g) => {
      if (g.id === "hairgrp") setSub("hair");
      else if (g.views.length === 0) setSub(g.id);
      else if (!g.views.some(v => v.id === sub)) setSub(g.views[0].id);
    };
    const curGroup = groups.find(g => g.id === activeGroup);

    return React.createElement("div", null,
      // Первый уровень — группы
      React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 10 } },
        groups.map(g => React.createElement("button", { key: g.id, onClick: () => onGroup(g),
          style: { flex: 1, padding: "9px 6px", borderRadius: 9, border: `0.5px solid ${activeGroup === g.id ? C.olive : C.border}`,
            background: activeGroup === g.id ? C.olive : C.card, color: activeGroup === g.id ? "#fff" : C.textM,
            fontSize: 11.5, fontWeight: activeGroup === g.id ? 600 : 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }
        }, g.l))
      ),
      // Второй уровень — виды внутри группы (если есть)
      curGroup && curGroup.views.length > 0 && React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 14 } },
        curGroup.views.map(v => React.createElement("button", { key: v.id, onClick: () => setSub(v.id),
          style: { padding: "6px 12px", borderRadius: 999, border: "none",
            background: sub === v.id ? C.oliveSoft : C.bgWarm, color: sub === v.id ? C.oliveDeep : C.textM,
            fontSize: 11.5, fontWeight: sub === v.id ? 600 : 500, cursor: "pointer", fontFamily: "inherit" }
        }, v.l))
      ),
      (curGroup && curGroup.views.length === 0) && React.createElement("div", { style: { height: 4 } }),

      sub === "hair" && React.createElement(HairTab, null),
      sub === "cycle" && React.createElement(CycleSubTab, { cycleAnchor, packAnchor }),
      sub === "mymeds" && React.createElement(MyMedsList, { packAnchor }),
      sub === "compat" && React.createElement(CompatibilityMatrix, null),
      sub === "gut" && React.createElement(IronGutTab, null),
      sub === "trends" && React.createElement(TrendsTab, null),
      sub === "flares" && React.createElement(FlareLog, null),
      sub === "tests" && React.createElement(IronSubTab, null)
    );
  }
    function DayDot({ isWD, isToday, isDone, label, clr }) {
    const size = 36;
    if (isDone) return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 36 36" }, /* @__PURE__ */ React.createElement("rect", { width: "36", height: "36", rx: "9", fill: C.olive }), /* @__PURE__ */ React.createElement("path", { d: "M10 18 L15.5 23.5 L26 13", stroke: "white", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }));
    if (isToday && isWD) return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 36 36" }, /* @__PURE__ */ React.createElement("rect", { width: "36", height: "36", rx: "9", fill: C.oliveSoft }), /* @__PURE__ */ React.createElement("rect", { x: "1", y: "1", width: "34", height: "34", rx: "8", fill: "none", stroke: C.olive, strokeWidth: "2" }), /* @__PURE__ */ React.createElement("text", { x: "18", y: "23", textAnchor: "middle", fontSize: "15", fontFamily: "sans-serif" }, label));
    if (isWD) return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 36 36" }, /* @__PURE__ */ React.createElement("rect", { width: "36", height: "36", rx: "9", fill: "white", stroke: C.borderM, strokeWidth: "1.5" }), /* @__PURE__ */ React.createElement("text", { x: "18", y: "23", textAnchor: "middle", fontSize: "15", fontFamily: "sans-serif" }, label));
    return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 36 36" }, /* @__PURE__ */ React.createElement("rect", { width: "36", height: "36", rx: "9", fill: C.bgWarm }), /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "18", r: "3", fill: C.border }));
  }
  const RUN_WEEKS = [
    { week: 1, title: "\u041F\u0440\u0438\u0432\u044B\u043A\u0430\u0435\u043C", sessions: [
      { day: "\u0414\u0435\u043D\u044C 1", plan: "\u0425\u043E\u0434\u044C\u0431\u0430 20 \u043C\u0438\u043D", detail: "\u041F\u0440\u043E\u0441\u0442\u043E \u0445\u043E\u0434\u044C\u0431\u0430 \u0431\u044B\u0441\u0442\u0440\u044B\u043C \u0448\u0430\u0433\u043E\u043C, \u0442\u0435\u043C\u043F 6\u20137 \u043A\u043C/\u0447. \u0426\u0435\u043B\u044C \u2014 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430 \u0432\u044B\u0445\u043E\u0434\u0438\u0442\u044C.", feel: "\u0414\u043E\u043B\u0436\u043D\u0430 \u0447\u0443\u0432\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C \u0441\u0435\u0431\u044F \u043A\u043E\u043C\u0444\u043E\u0440\u0442\u043D\u043E, \u043D\u0435 \u0437\u0430\u043F\u044B\u0445\u0430\u0442\u044C\u0441\u044F." },
      { day: "\u0414\u0435\u043D\u044C 2", plan: "\u0425\u043E\u0434\u044C\u0431\u0430 20 \u043C\u0438\u043D", detail: "\u0422\u043E \u0436\u0435 \u0441\u0430\u043C\u043E\u0435. \u0417\u0430\u043C\u0435\u0447\u0430\u0439 \u0441\u0432\u043E\u0451 \u0434\u044B\u0445\u0430\u043D\u0438\u0435 \u0438 \u043E\u0441\u0430\u043D\u043A\u0443. \u041F\u043B\u0435\u0447\u0438 \u0440\u0430\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u044B, \u0432\u0437\u0433\u043B\u044F\u0434 \u0432\u043F\u0435\u0440\u0451\u0434.", feel: "\u041D\u0435\u0431\u043E\u043B\u044C\u0448\u0430\u044F \u0443\u0441\u0442\u0430\u043B\u043E\u0441\u0442\u044C \u2014 \u043D\u043E\u0440\u043C\u0430." },
      { day: "\u0414\u0435\u043D\u044C 3", plan: "\u0425\u043E\u0434\u044C\u0431\u0430 25 \u043C\u0438\u043D", detail: "\u041D\u0435\u043C\u043D\u043E\u0433\u043E \u0434\u043B\u0438\u043D\u043D\u0435\u0435. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u043D\u0430\u043A\u043B\u043E\u043D \u0435\u0441\u043B\u0438 \u0435\u0441\u0442\u044C \u0433\u043E\u0440\u043A\u0430 \u2014 \u044F\u0433\u043E\u0434\u0438\u0446\u044B \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442 \u043B\u0443\u0447\u0448\u0435.", feel: "\u041B\u0435\u0433\u043A\u043E. \u0422\u0430\u043A \u0438 \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043D\u0430 \u043F\u0435\u0440\u0432\u043E\u0439 \u043D\u0435\u0434\u0435\u043B\u0435." }
    ] },
    { week: 2, title: "\u041F\u0435\u0440\u0432\u044B\u0435 \u0431\u0435\u0433\u043E\u0432\u044B\u0435 \u0432\u0441\u0442\u0430\u0432\u043A\u0438", sessions: [
      { day: "\u0414\u0435\u043D\u044C 1", plan: "1 \u043C\u0438\u043D \u0431\u0435\u0433 / 4 \u043C\u0438\u043D \u0445\u043E\u0434\u044C\u0431\u0430 \xD7 4", detail: "\u0427\u0435\u0440\u0435\u0434\u0443\u0439: 1 \u043C\u0438\u043D\u0443\u0442\u0430 \u043B\u0451\u0433\u043A\u043E\u0433\u043E \u0431\u0435\u0433\u0430, \u043F\u043E\u0442\u043E\u043C 4 \u043C\u0438\u043D\u0443\u0442\u044B \u0445\u043E\u0434\u044C\u0431\u044B. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 4 \u0440\u0430\u0437\u0430. \u0418\u0442\u043E\u0433\u043E 20 \u043C\u0438\u043D.", feel: "\u0411\u0435\u0433 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u043D\u044B\u043C \u2014 \u0435\u0441\u043B\u0438 \u043D\u0435 \u043C\u043E\u0436\u0435\u0448\u044C \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C, \u0437\u0430\u043C\u0435\u0434\u043B\u0438\u0441\u044C." },
      { day: "\u0414\u0435\u043D\u044C 2", plan: "1 \u043C\u0438\u043D \u0431\u0435\u0433 / 4 \u043C\u0438\u043D \u0445\u043E\u0434\u044C\u0431\u0430 \xD7 4", detail: "\u0422\u0430 \u0436\u0435 \u0441\u0445\u0435\u043C\u0430. \u041E\u0431\u0440\u0430\u0449\u0430\u0439 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u0435 \u043D\u0430 \u043F\u0440\u0438\u0437\u0435\u043C\u043B\u0435\u043D\u0438\u0435 \u2014 \u043D\u0430 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0443 \u0441\u0442\u043E\u043F\u044B, \u043D\u0435 \u043D\u0430 \u043F\u044F\u0442\u043A\u0443.", feel: "\u041D\u0435\u0431\u043E\u043B\u044C\u0448\u0430\u044F \u043B\u0451\u0433\u043A\u043E\u0441\u0442\u044C \u2014 \u0445\u043E\u0440\u043E\u0448\u0438\u0439 \u0437\u043D\u0430\u043A." },
      { day: "\u0414\u0435\u043D\u044C 3", plan: "1 \u043C\u0438\u043D \u0431\u0435\u0433 / 3 \u043C\u0438\u043D \u0445\u043E\u0434\u044C\u0431\u0430 \xD7 5", detail: "\u041D\u0435\u043C\u043D\u043E\u0433\u043E \u0443\u0432\u0435\u043B\u0438\u0447\u0438\u043B\u0438 \u0431\u0435\u0433\u043E\u0432\u044B\u0435 \u043E\u0442\u0440\u0435\u0437\u043A\u0438 \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0445\u043E\u0434\u044C\u0431\u044B. 25 \u043C\u0438\u043D\u0443\u0442 \u0438\u0442\u043E\u0433\u043E.", feel: "\u0414\u044B\u0445\u0430\u043D\u0438\u0435 \u0440\u043E\u0432\u043D\u043E\u0435, \u043C\u043E\u0436\u0435\u0448\u044C \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F\u043C\u0438." }
    ] },
    { week: 3, title: "\u0421\u0442\u0440\u043E\u0438\u043C \u0432\u044B\u043D\u043E\u0441\u043B\u0438\u0432\u043E\u0441\u0442\u044C", sessions: [
      { day: "\u0414\u0435\u043D\u044C 1", plan: "2 \u043C\u0438\u043D \u0431\u0435\u0433 / 3 \u043C\u0438\u043D \u0445\u043E\u0434\u044C\u0431\u0430 \xD7 5", detail: "25 \u043C\u0438\u043D\u0443\u0442. \u0411\u0435\u0433\u043E\u0432\u044B\u0435 \u043E\u0442\u0440\u0435\u0437\u043A\u0438 \u0443\u0436\u0435 2 \u043C\u0438\u043D\u0443\u0442\u044B \u2014 \u044D\u0442\u043E \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u0437\u0430 2 \u043D\u0435\u0434\u0435\u043B\u0438!", feel: "\u041B\u0451\u0433\u043A\u0438\u0439 \u0434\u0438\u0441\u043A\u043E\u043C\u0444\u043E\u0440\u0442 \u0432 \u043A\u043E\u043D\u0446\u0435 \u0431\u0435\u0433\u043E\u0432\u044B\u0445 \u043E\u0442\u0440\u0435\u0437\u043A\u043E\u0432 \u2014 \u043D\u043E\u0440\u043C\u0430." },
      { day: "\u0414\u0435\u043D\u044C 2", plan: "2 \u043C\u0438\u043D \u0431\u0435\u0433 / 2 \u043C\u0438\u043D \u0445\u043E\u0434\u044C\u0431\u0430 \xD7 6", detail: "24 \u043C\u0438\u043D\u0443\u0442\u044B. \u0425\u043E\u0434\u044C\u0431\u0430 \u0438 \u0431\u0435\u0433 \u043F\u043E\u0440\u043E\u0432\u043D\u0443. \u0422\u0435\u043C\u043F \u0431\u0435\u0433\u043E\u0432\u043E\u0439 \u0447\u0430\u0441\u0442\u0438 \u2014 \u043B\u0451\u0433\u043A\u0438\u0439, \u043D\u0435 \u0433\u043E\u043D\u0438.", feel: "\u041A \u043A\u043E\u043D\u0446\u0443 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438 \u2014 \u043F\u0440\u0438\u044F\u0442\u043D\u0430\u044F \u0443\u0441\u0442\u0430\u043B\u043E\u0441\u0442\u044C." },
      { day: "\u0414\u0435\u043D\u044C 3", plan: "3 \u043C\u0438\u043D \u0431\u0435\u0433 / 2 \u043C\u0438\u043D \u0445\u043E\u0434\u044C\u0431\u0430 \xD7 4", detail: "20 \u043C\u0438\u043D\u0443\u0442. \u041F\u0435\u0440\u0432\u044B\u0439 \u0440\u0430\u0437 \u0431\u0435\u0436\u0438\u0448\u044C 3 \u043C\u0438\u043D\u0443\u0442\u044B \u043F\u043E\u0434\u0440\u044F\u0434. \u042D\u0442\u043E \u043F\u043E\u0431\u0435\u0434\u0430!", feel: "\u0415\u0441\u043B\u0438 \u0442\u044F\u0436\u0435\u043B\u043E \u2014 \u0437\u0430\u043C\u0435\u0434\u043B\u0438 \u0431\u0435\u0433 \u0434\u043E \u043F\u043E\u0447\u0442\u0438 \u0445\u043E\u0434\u044C\u0431\u044B, \u043D\u043E \u043D\u0435 \u043E\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0439\u0441\u044F." }
    ] },
    { week: 4, title: "\u041F\u0435\u0440\u0432\u044B\u0439 \u043D\u0435\u043F\u0440\u0435\u0440\u044B\u0432\u043D\u044B\u0439 \u0431\u0435\u0433", sessions: [
      { day: "\u0414\u0435\u043D\u044C 1", plan: "5 \u043C\u0438\u043D \u0431\u0435\u0433 / 2 \u043C\u0438\u043D \u0445\u043E\u0434\u044C\u0431\u0430 \xD7 3", detail: "21 \u043C\u0438\u043D\u0443\u0442\u0430. 5 \u043C\u0438\u043D\u0443\u0442 \u043D\u0435\u043F\u0440\u0435\u0440\u044B\u0432\u043D\u043E\u0433\u043E \u0431\u0435\u0433\u0430 \u2014 \u0437\u043D\u0430\u0447\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0440\u0443\u0431\u0435\u0436.", feel: "\u0422\u0435\u043C\u043F \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0442\u0430\u043A\u043E\u0439, \u0447\u0442\u043E\u0431\u044B \u0442\u044B \u043C\u043E\u0433\u043B\u0430 \u043F\u0435\u0442\u044C (\u043F\u043E\u0447\u0442\u0438)." },
      { day: "\u0414\u0435\u043D\u044C 2", plan: "8 \u043C\u0438\u043D \u0431\u0435\u0433 / 2 \u043C\u0438\u043D \u0445\u043E\u0434\u044C\u0431\u0430 \xD7 2", detail: "20 \u043C\u0438\u043D\u0443\u0442. \u0414\u0432\u0430 \u0434\u043B\u0438\u043D\u043D\u044B\u0445 \u0431\u0435\u0433\u043E\u0432\u044B\u0445 \u043E\u0442\u0440\u0435\u0437\u043A\u0430 \u0441 \u043E\u0434\u043D\u0438\u043C \u043F\u0435\u0440\u0435\u0440\u044B\u0432\u043E\u043C.", feel: "\u0413\u043E\u0440\u0434\u043E\u0441\u0442\u044C \u2014 \u0442\u044B \u0431\u0435\u0436\u0438\u0448\u044C 8 \u043C\u0438\u043D\u0443\u0442 \u043F\u043E\u0434\u0440\u044F\u0434!" },
      { day: "\u0414\u0435\u043D\u044C 3", plan: "\u0411\u0435\u0433 15\u201320 \u043C\u0438\u043D \u043D\u0435\u043F\u0440\u0435\u0440\u044B\u0432\u043D\u043E", detail: "\u041F\u0435\u0440\u0432\u044B\u0439 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0439 \u043D\u0435\u043F\u0440\u0435\u0440\u044B\u0432\u043D\u044B\u0439 \u0431\u0435\u0433! \u0422\u0435\u043C\u043F \u043E\u0447\u0435\u043D\u044C \u043B\u0451\u0433\u043A\u0438\u0439 \u2014 \u0433\u043B\u0430\u0432\u043D\u043E\u0435 \u043D\u0435 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C\u0441\u044F. \u041C\u043E\u0436\u043D\u043E \u0438\u0434\u0442\u0438 \u0435\u0441\u043B\u0438 \u0441\u043E\u0432\u0441\u0435\u043C \u0442\u044F\u0436\u0435\u043B\u043E.", feel: "\u041F\u043E\u0441\u043B\u0435 \u2014 \u044D\u0439\u0444\u043E\u0440\u0438\u044F. \u0417\u0430\u0441\u043B\u0443\u0436\u0435\u043D\u043D\u0430\u044F." }
    ] },
    { week: 5, title: "\u0423\u043A\u0440\u0435\u043F\u043B\u044F\u0435\u043C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443", sessions: [
      { day: "\u0414\u0435\u043D\u044C 1", plan: "\u0411\u0435\u0433 20 \u043C\u0438\u043D", detail: "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u0443\u0432\u0435\u043B\u0438\u0447\u0438\u0442\u044C \u0442\u0435\u043C\u043F \u043D\u0430 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0445 5 \u043C\u0438\u043D\u0443\u0442\u0430\u0445.", feel: "\u0411\u0435\u0433 \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043D\u044B\u043C \u2014 \u0437\u0430\u043C\u0435\u0447\u0430\u0435\u0448\u044C?" },
      { day: "\u0414\u0435\u043D\u044C 2", plan: "\u0418\u043D\u0442\u0435\u0440\u0432\u0430\u043B\u044B: 1 \u043C\u0438\u043D \u0431\u044B\u0441\u0442\u0440\u043E / 2 \u043C\u0438\u043D \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u043E \xD7 6", detail: "\u041F\u0435\u0440\u0432\u0430\u044F \u0438\u043D\u0442\u0435\u0440\u0432\u0430\u043B\u044C\u043D\u0430\u044F \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430. \u0411\u044B\u0441\u0442\u0440\u043E \u2014 \u043D\u0435 \u0441\u043F\u0440\u0438\u043D\u0442, \u043F\u0440\u043E\u0441\u0442\u043E \u043A\u043E\u043C\u0444\u043E\u0440\u0442\u043D\u043E \u0431\u044B\u0441\u0442\u0440\u0435\u0435 \u043E\u0431\u044B\u0447\u043D\u043E\u0433\u043E.", feel: "\u041F\u0440\u0438\u044F\u0442\u043D\u0430\u044F \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043D\u0430 \u0441\u0435\u0440\u0434\u0446\u0435. \u0414\u044B\u0448\u0438\u0448\u044C \u0433\u043B\u0443\u0431\u043E\u043A\u043E." },
      { day: "\u0414\u0435\u043D\u044C 3", plan: "\u0411\u0435\u0433 25 \u043C\u0438\u043D", detail: "\u0414\u043B\u0438\u043D\u043D\u0435\u0439\u0448\u0430\u044F \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430! \u0422\u0435\u043C\u043F \u2014 \u0441\u0430\u043C\u044B\u0439 \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u044B\u0439. \u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0432\u0430\u0436\u043D\u0435\u0435 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u0438.", feel: "\u041A \u0444\u0438\u043D\u0438\u0448\u0443 \u2014 \u0443\u0441\u0442\u0430\u043B\u0430\u044F \u043D\u043E \u0434\u043E\u0432\u043E\u043B\u044C\u043D\u0430\u044F." }
    ] },
    { week: 6, title: "5 \u043A\u043C \u2014 \u0446\u0435\u043B\u044C \u0431\u043B\u0438\u0437\u043A\u043E", sessions: [
      { day: "\u0414\u0435\u043D\u044C 1", plan: "\u0411\u0435\u0433 25 \u043C\u0438\u043D", detail: "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u0435 \u0444\u043E\u0440\u043C\u044B. \u0414\u043E\u0431\u0430\u0432\u044C \u0434\u0438\u043D\u0430\u043C\u0438\u0447\u0435\u0441\u043A\u0443\u044E \u0440\u0430\u0437\u043C\u0438\u043D\u043A\u0443 \u2014 5 \u043C\u0438\u043D \u0445\u043E\u0434\u044C\u0431\u044B \u043F\u0435\u0440\u0435\u0434 \u0431\u0435\u0433\u043E\u043C.", feel: "\u042D\u0442\u043E \u0443\u0436\u0435 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430 \u2014 \u043E\u0442\u043B\u0438\u0447\u043D\u043E!" },
      { day: "\u0414\u0435\u043D\u044C 2", plan: "\u0418\u043D\u0442\u0435\u0440\u0432\u0430\u043B\u044B: 2 \u043C\u0438\u043D \u0431\u044B\u0441\u0442\u0440\u043E / 2 \u043C\u0438\u043D \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u043E \xD7 5", detail: "\u0411\u043E\u043B\u0435\u0435 \u0441\u043B\u043E\u0436\u043D\u044B\u0435 \u0438\u043D\u0442\u0435\u0440\u0432\u0430\u043B\u044B \u0434\u043B\u044F \u0440\u0430\u0437\u0432\u0438\u0442\u0438\u044F \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u0438.", feel: "\u041B\u0451\u0433\u043A\u043E\u0435 \u0436\u0436\u0435\u043D\u0438\u0435 \u0432 \u043C\u044B\u0448\u0446\u0430\u0445 \u2014 \u044D\u0442\u043E \u0440\u043E\u0441\u0442." },
      { day: "\u0414\u0435\u043D\u044C 3", plan: "\u0411\u0435\u0433 30 \u043C\u0438\u043D", detail: "30 \u043C\u0438\u043D\u0443\u0442 \u043D\u0435\u043F\u0440\u0435\u0440\u044B\u0432\u043D\u043E\u0433\u043E \u0431\u0435\u0433\u0430. \u0422\u044B \u043F\u0440\u043E\u0448\u043B\u0430 \u043F\u0443\u0442\u044C \u043E\u0442 \u043D\u0443\u043B\u044F \u0434\u043E \u043F\u043E\u043B\u0447\u0430\u0441\u0430 \u0437\u0430 6 \u043D\u0435\u0434\u0435\u043B\u044C!", feel: "\u0413\u043E\u0440\u0434\u043E\u0441\u0442\u044C. \u0422\u044B \u044D\u0442\u043E \u0441\u0434\u0435\u043B\u0430\u043B\u0430." }
    ] }
  ];
  const RUN_TIPS = [
    { icon: "🦴", title: "\u0411\u0435\u0433 \u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437", text: "\u0411\u0435\u0433 \u2014 \u0443\u0434\u0430\u0440\u043D\u0430\u044F \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0430. \u041F\u0440\u0438 \u0441\u043A\u043E\u043B\u0438\u043E\u0437\u0435 \u0432\u0430\u0436\u043D\u043E: \u0431\u0435\u0433\u043E\u0432\u0430\u044F \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u0441 \u0430\u043C\u043E\u0440\u0442\u0438\u0437\u0430\u0446\u0438\u0435\u0439 (\u0431\u0435\u0433\u043E\u0432\u0430\u044F \u0434\u043E\u0440\u043E\u0436\u043A\u0430 \u0438\u043B\u0438 \u043C\u044F\u0433\u043A\u0438\u0439 \u0430\u0441\u0444\u0430\u043B\u044C\u0442), \u0445\u043E\u0440\u043E\u0448\u0438\u0435 \u043A\u0440\u043E\u0441\u0441\u043E\u0432\u043A\u0438 \u0441 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u043E\u0439, \u0438 \u0440\u0430\u0437\u043C\u0438\u043D\u043A\u0430 \u043F\u0435\u0440\u0435\u0434 \u043A\u0430\u0436\u0434\u043E\u0439 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u043E\u0439. \u041F\u0440\u0438\u0441\u043B\u0443\u0448\u0438\u0432\u0430\u0439\u0441\u044F \u043A \u0441\u043F\u0438\u043D\u0435." },
    { icon: "🌸", title: "\u0411\u0435\u0433 \u0438 \u0442\u0430\u0437\u043E\u0432\u043E\u0435 \u0434\u043D\u043E", text: "\u041F\u0440\u0438 \u0441\u043F\u0430\u0437\u043C\u0435 \u0442\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u0434\u043D\u0430 \u043D\u0430\u0447\u0438\u043D\u0430\u0439 \u0442\u043E\u043B\u044C\u043A\u043E \u0441 \u0445\u043E\u0434\u044C\u0431\u044B. \u041F\u0435\u0440\u0435\u0445\u043E\u0434\u0438 \u043A \u0431\u0435\u0433\u0443 \u043A\u043E\u0433\u0434\u0430 \u043F\u043E\u0447\u0443\u0432\u0441\u0442\u0432\u0443\u0435\u0448\u044C \u0443\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u0435. \u041F\u043E\u0441\u043B\u0435 \u043A\u0430\u0436\u0434\u043E\u0439 \u0431\u0435\u0433\u043E\u0432\u043E\u0439 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u0434\u0435\u043B\u0430\u0439 \u0434\u0438\u0430\u0444\u0440\u0430\u0433\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u0434\u044B\u0445\u0430\u043D\u0438\u0435 \u043B\u0451\u0436\u0430 \u2014 5 \u043C\u0438\u043D\u0443\u0442." },
    { icon: "👟", title: "\u041E\u0431\u0443\u0432\u044C \u2014 \u043A\u0440\u0438\u0442\u0438\u0447\u043D\u043E \u0432\u0430\u0436\u043D\u0430", text: "\u0414\u043B\u044F \u043D\u0430\u0447\u0430\u043B\u0430 \u0431\u0435\u0433\u0430 \u043D\u0443\u0436\u043D\u044B \u043A\u0440\u043E\u0441\u0441\u043E\u0432\u043A\u0438 \u0441 \u0445\u043E\u0440\u043E\u0448\u0435\u0439 \u0430\u043C\u043E\u0440\u0442\u0438\u0437\u0430\u0446\u0438\u0435\u0439 \u0438 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u043E\u0439 \u0441\u0432\u043E\u0434\u0430. \u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u044E: Asics Gel-Nimbus, Brooks Ghost, New Balance Fresh Foam. \u041A\u0443\u043F\u0438 \u0432 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u043C \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0435 \u0441 \u0430\u043D\u0430\u043B\u0438\u0437\u043E\u043C \u043F\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 \u0441\u0442\u043E\u043F\u044B." },
    { icon: "💨", title: "\u041A\u0430\u043A \u0434\u044B\u0448\u0430\u0442\u044C \u043F\u0440\u0438 \u0431\u0435\u0433\u0435", text: "\u0414\u044B\u0448\u0438 \u0447\u0435\u0440\u0435\u0437 \u043D\u043E\u0441 \u0438 \u0440\u043E\u0442 \u043E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E. \u0420\u0438\u0442\u043C 2:2 \u2014 \u0432\u0434\u043E\u0445 \u043D\u0430 2 \u0448\u0430\u0433\u0430, \u0432\u044B\u0434\u043E\u0445 \u043D\u0430 2 \u0448\u0430\u0433\u0430. \u0415\u0441\u043B\u0438 \u0437\u0430\u0434\u044B\u0445\u0430\u0435\u0448\u044C\u0441\u044F \u2014 \u0437\u0430\u043C\u0435\u0434\u043B\u0438\u0441\u044C \u0434\u043E \u0445\u043E\u0434\u044C\u0431\u044B. \u042D\u0442\u043E \u043D\u0435 \u0441\u043B\u0430\u0431\u043E\u0441\u0442\u044C, \u044D\u0442\u043E \u0443\u043C\u043D\u044B\u0439 \u043F\u043E\u0434\u0445\u043E\u0434." },
    { icon: "🕐", title: "\u041A\u043E\u0433\u0434\u0430 \u0431\u0435\u0433\u0430\u0442\u044C", text: "\u041D\u0435 \u0432 \u043E\u0434\u0438\u043D \u0434\u0435\u043D\u044C \u0441 \u0441\u0438\u043B\u043E\u0432\u043E\u0439 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u043E\u0439 \u043F\u0435\u0440\u0432\u044B\u0435 4 \u043D\u0435\u0434\u0435\u043B\u0438. \u0418\u0434\u0435\u0430\u043B\u044C\u043D\u043E: \u0431\u0435\u0433 \u0432 \u0434\u043D\u0438 \u043E\u0442\u0434\u044B\u0445\u0430 \u043E\u0442 \u0437\u0430\u043B\u0430 (\u0412\u0442, \u0427\u0442, \u0421\u0431 \u0438\u043B\u0438 \u043F\u043E \u0441\u0432\u043E\u0435\u043C\u0443 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044E). \u041F\u043E\u0441\u043B\u0435 4 \u043D\u0435\u0434\u0435\u043B\u0438 \u043C\u043E\u0436\u043D\u043E \u043A\u043E\u043C\u0431\u0438\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C: \u0437\u0430\u043B \u0443\u0442\u0440\u043E\u043C, \u043B\u0451\u0433\u043A\u0438\u0439 \u0431\u0435\u0433 \u0432\u0435\u0447\u0435\u0440\u043E\u043C." },
    { icon: "📏", title: "\u0422\u0435\u043C\u043F \u0434\u043B\u044F \u043D\u043E\u0432\u0438\u0447\u043A\u0430", text: "\u0420\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u043D\u044B\u0439 \u0442\u0435\u043C\u043F \u2014 \u043F\u0440\u0430\u0432\u0438\u043B\u043E \u21161. \u0422\u044B \u0434\u043E\u043B\u0436\u043D\u0430 \u043C\u043E\u0447\u044C \u043F\u0440\u043E\u0438\u0437\u043D\u0435\u0441\u0442\u0438 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0438\u0437 5 \u0441\u043B\u043E\u0432 \u043D\u0435 \u0437\u0430\u0434\u044B\u0445\u0430\u044F\u0441\u044C. \u0421\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0443 \u0431\u043E\u043B\u044C\u0448\u0438\u043D\u0441\u0442\u0432\u0430 \u043D\u043E\u0432\u0438\u0447\u043A\u043E\u0432: 6\u20138 \u043C\u0438\u043D/\u043A\u043C. \u042D\u0442\u043E \u043D\u043E\u0440\u043C\u0430\u043B\u044C\u043D\u043E \u0438 \u0434\u0430\u0436\u0435 \u0445\u043E\u0440\u043E\u0448\u043E." }
  ];
  function RunTab() {
    const [selWeek, setSelWeek] = useLS("runWeek", 0);
    const [doneRuns, setDoneRuns] = useLS("runDone", {});
    const [showTips, setShowTips] = useState(false);
    const totalRuns = RUN_WEEKS.reduce((a, w) => a + w.sessions.length, 0);
    const completedRuns = Object.values(doneRuns).filter(Boolean).length;
    const toggleRun = (key) => setDoneRuns((d) => ({ ...d, [key]: !d[key] }));
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: `linear-gradient(135deg, ${C.oliveSoft}, ${C.card})`, borderRadius: 14, padding: "14px 16px", marginBottom: 14, border: `1.5px solid ${C.olive}44`, boxShadow: C.shadow } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: C.text } }, "🏃\u200D\u2640\uFE0F \u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u0431\u0435\u0433\u0430"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } }, "6 \u043D\u0435\u0434\u0435\u043B\u044C \xB7 \u0421 \u043D\u0443\u043B\u044F \u0434\u043E 30 \u043C\u0438\u043D")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 800, color: C.olive } }, completedRuns, "/", totalRuns), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: C.textL } }, "\u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043E\u043A"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, background: C.bgWarm, borderRadius: 5, height: 6, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${Math.round(completedRuns / totalRuns * 100)}%`, background: `linear-gradient(90deg, ${C.olive}, ${C.sand})`, borderRadius: 5, transition: "width .5s" } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 5 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: C.textL } }, "\u041D\u0430\u0447\u0430\u043B\u043E"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: C.textL } }, "30 \u043C\u0438\u043D \u043D\u0435\u043F\u0440\u0435\u0440\u044B\u0432\u043D\u043E\u0433\u043E \u0431\u0435\u0433\u0430"))), /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 12px", background: C.warnSoft, borderRadius: 10, marginBottom: 12, border: `1px solid ${C.warn}44` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.warn, marginBottom: 3 } }, "\u0412\u0430\u0436\u043D\u043E \u043F\u0435\u0440\u0435\u0434 \u0441\u0442\u0430\u0440\u0442\u043E\u043C"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.6 } }, "\u041F\u0440\u0438 \u0441\u043F\u0430\u0437\u043C\u0435 \u0442\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u0434\u043D\u0430 \u2014 \u043D\u0430\u0447\u0438\u043D\u0430\u0439 \u0442\u043E\u043B\u044C\u043A\u043E \u0441 \u0445\u043E\u0434\u044C\u0431\u044B (\u043D\u0435\u0434\u0435\u043B\u0438 1\u20132). \u041F\u0435\u0440\u0435\u0445\u043E\u0434\u0438 \u043A \u0431\u0435\u0433\u0443 \u043F\u043E\u0441\u0442\u0435\u043F\u0435\u043D\u043D\u043E. \u041F\u043E\u0441\u043B\u0435 \u043A\u0430\u0436\u0434\u043E\u0439 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438: \u0434\u0438\u0430\u0444\u0440\u0430\u0433\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u0434\u044B\u0445\u0430\u043D\u0438\u0435 \u043B\u0451\u0436\u0430 5 \u043C\u0438\u043D \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" } }, RUN_WEEKS.map((w, i) => {
      const wDone = w.sessions.filter((_, j) => doneRuns[`${i}-${j}`]).length;
      const allDone = wDone === w.sessions.length;
      return /* @__PURE__ */ React.createElement("button", { key: i, onClick: () => setSelWeek(i), style: {
        padding: "7px 10px",
        borderRadius: 9,
        border: `1.5px solid ${selWeek === i ? C.olive : allDone ? C.olive + "66" : C.border}`,
        background: selWeek === i ? C.oliveSoft : allDone ? C.oliveSoft + "88" : C.card,
        cursor: "pointer",
        fontFamily: "inherit"
      } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: selWeek === i ? C.oliveDeep : C.textL } }, "\u041D\u0435\u0434 ", i + 1), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: selWeek === i ? C.oliveDeep : C.textM } }, allDone ? "\u2713" : `${wDone}/${w.sessions.length}`));
    })), (() => {
      const w = RUN_WEEKS[selWeek];
      return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: C.card, borderRadius: 12, padding: "12px 14px", marginBottom: 12, boxShadow: C.shadow, border: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 800, color: C.text } }, "\u041D\u0435\u0434\u0435\u043B\u044F ", selWeek + 1, ": ", w.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } }, w.sessions.length, " \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438 \xB7 \u041D\u0435 \u0432 \u0434\u043D\u0438 \u0441\u0438\u043B\u043E\u0432\u044B\u0445 \u043F\u0435\u0440\u0432\u044B\u0435 4 \u043D\u0435\u0434")), w.sessions.map((s, j) => {
        const key = `${selWeek}-${j}`;
        const done = doneRuns[key];
        return /* @__PURE__ */ React.createElement("div", { key: j, style: { background: done ? C.oliveSoft : C.card, border: `1.5px solid ${done ? C.olive + "66" : C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 8, boxShadow: C.shadow } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.textL, fontWeight: 600 } }, s.day), /* @__PURE__ */ React.createElement("div", { style: { background: done ? C.olive : C.bgWarm, borderRadius: 5, padding: "1px 7px", fontSize: 10, fontWeight: 700, color: done ? C.white : C.text } }, s.plan)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.textM, lineHeight: 1.55, marginBottom: 5 } }, s.detail), /* @__PURE__ */ React.createElement("div", { style: { padding: "6px 9px", background: done ? C.olive + "18" : C.bgWarm, borderRadius: 7 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.oliveDeep } }, "💡 ", s.feel))), /* @__PURE__ */ React.createElement("button", { onClick: () => toggleRun(key), style: { width: 30, height: 30, borderRadius: 8, border: `2px solid ${done ? C.olive : C.borderM}`, background: done ? C.olive : "transparent", color: done ? C.white : C.textL, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, done ? "\u2713" : "")));
      }));
    })(), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowTips(!showTips), style: { width: "100%", marginTop: 4, padding: "10px 14px", borderRadius: 11, background: C.card, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit", boxShadow: C.shadow } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, "\u0421\u043E\u0432\u0435\u0442\u044B \u043F\u043E \u0431\u0435\u0433\u0443 \u0434\u043B\u044F \u0442\u0435\u0431\u044F"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.textL } }, showTips ? "\u25B2" : "\u25BC")), showTips && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 7 } }, RUN_TIPS.map((tip, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { background: C.card, borderRadius: 11, padding: "12px 14px", marginBottom: 7, boxShadow: C.shadow, border: `1px solid ${C.border}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 34, height: 34, borderRadius: 9, background: C.oliveSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 } }, tip.icon), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 } }, tip.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.textM, lineHeight: 1.6 } }, tip.text)))))));
  }
  // ===========================================================================
  // PillStockTracker — «Аптечка»: сколько осталось дней по каждому препарату,
  // напоминание докупить заранее. Хранит {pillId:{days,setOn}} в аптечке.
  // ===========================================================================
  // ===========================================================================
  // DoctorExport — собирает отчёт для врача: препараты, анализы, обострения,
  // вопросы. Текст можно скопировать или скачать .txt. Всё локально.
  // ===========================================================================
  function DoctorExport({ packAnchor }) {
    const [copied, setCopied] = useState(false);

    const build = () => {
      const lines = [];
      const today = new Date();
      lines.push("ОТЧЁТ ДЛЯ ВРАЧА");
      lines.push("Дата: " + today.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }));
      lines.push("");

      // Вес и цель
      try {
        const cur = JSON.parse(localStorage.getItem("nCW") || "55");
        const goal = JSON.parse(localStorage.getItem("nGW") || "51.5");
        lines.push("Вес: " + cur + " кг (цель " + goal + " кг)");
        lines.push("");
      } catch {}

      // Препараты
      lines.push("ПРЕПАРАТЫ И ДОБАВКИ (текущие):");
      try {
        const pills = JSON.parse(localStorage.getItem(PILLS_LS_KEY) || "null") || DEFAULT_PILLS;
        let active = pills;
        try { active = activePillsOn(today, packAnchor, pills); } catch {}
        active.forEach(p => lines.push("• " + p.name + (p.time ? " (" + p.time + ")" : "")));
      } catch { lines.push("— нет данных"); }
      lines.push("");

      // Анализы
      lines.push("АНАЛИЗЫ:");
      try {
        const lab = JSON.parse(localStorage.getItem("labResultsV1") || "{}");
        const rows = [["ferritin","Ферритин"],["hb","Гемоглобин"],["iron","Сыв. железо"],["tibc","ОЖСС"],["b12","B12"],["folate","Фолат"],["tsh","ТТГ"],["vitd","Витамин D"],["zinc","Цинк"],["alt","ALT/AST"]];
        const cols = [["start","Старт"],["mid","Середина"],["end","Финиш"]].concat((lab.__cols||[]).map(c=>[c.id,c.l]));
        let any = false;
        rows.forEach(([rid, rname]) => {
          const vals = cols.map(([cid, cl]) => { const v = lab[rid + "_" + cid]; return (v !== undefined && String(v).trim() !== "") ? cl + ": " + v : null; }).filter(Boolean);
          if (vals.length) { lines.push("• " + rname + " — " + vals.join(", ")); any = true; }
        });
        if (!any) lines.push("— нет внесённых значений");
      } catch { lines.push("— нет данных"); }
      lines.push("");

      // Обострения
      lines.push("ОБОСТРЕНИЯ (последние):");
      try {
        const flares = (JSON.parse(localStorage.getItem("flaresV1") || "[]") || []);
        if (flares.length) flares.slice(0, 10).forEach(f => lines.push("• " + f.date + " — " + f.type + (f.severity ? " (" + (["","лёгкое","среднее","сильное"][f.severity] || "") + ")" : "") + (f.trigger ? ", триггер: " + f.trigger : "") + (f.note ? ", " + f.note : "")));
        else lines.push("— нет записей");
      } catch { lines.push("— нет данных"); }
      lines.push("");

      // Вопросы врачам
      lines.push("ВОПРОСЫ:");
      try {
        const docs = JSON.parse(localStorage.getItem("doctorsV1") || "[]");
        let any = false;
        docs.forEach(d => {
          const qs = (d.questions || []).filter(q => !q.done);
          if (qs.length) { lines.push((d.spec || d.name || "Врач") + ":"); qs.forEach(q => lines.push("  – " + q.q)); any = true; }
        });
        if (!any) lines.push("— нет открытых вопросов");
      } catch { lines.push("— нет данных"); }

      return lines.join("\n");
    };

    const report = build();

    const copy = () => {
      try {
        navigator.clipboard.writeText(report).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
      } catch {}
    };
    const download = () => {
      try {
        const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "otchet-vrachu-" + dayKey() + ".txt";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {}
    };

    return React.createElement("div", null,
      React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.6, marginBottom: 10 } },
        "Собирает в один текст: препараты, внесённые анализы, обострения и открытые вопросы. Можно скопировать или скачать и показать на приёме."),
      React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 10 } },
        React.createElement("button", { onClick: copy,
          style: { flex: 1, padding: "11px", borderRadius: 10, background: C.olive, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, copied ? "Скопировано ✓" : "Скопировать"),
        React.createElement("button", { onClick: download,
          style: { flex: 1, padding: "11px", borderRadius: 10, background: C.card, border: `0.5px solid ${C.olive}55`, color: C.oliveDeep, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, "Скачать .txt")
      ),
      React.createElement("pre", { style: { fontSize: 11, color: C.text, lineHeight: 1.5, background: C.bgWarm, borderRadius: 9, padding: "12px", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", margin: 0, maxHeight: 280, overflowY: "auto" } }, report)
    );
  }

  function PillStockTracker({ packAnchor }) {
    const [stock, setStock] = useLS("pillStockV1", {});
    const [pills] = useLS(PILLS_LS_KEY, DEFAULT_PILLS);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    // Показываем ВСЕ препараты плана (а не только сегодняшние) — чтобы можно было
    // планировать закупки заранее. Дозовые варианты схлопываем в один пункт.
    let active = [];
    try {
      const seen = new Set();
      const skip = { iron50: "iron", crystalvag1: "crystalvag2" }; // варианты → один пункт
      active = pills.filter(p => {
        const key = skip[p.id] || p.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    } catch { active = pills; }

    const remaining = (pid) => {
      const s = stock[pid];
      if (!s || s.days == null) return null;
      const set = mkd(s.setOn);
      const passed = Math.max(0, Math.floor((today - set) / 86400000));
      return Math.max(0, s.days - passed);
    };
    const setDays = (pid, days) => {
      setStock({ ...stock, [pid]: { days: Number(days), setOn: dayKey(today) } });
    };

    return React.createElement("div", null,
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.6 } },
          "Укажи, на сколько дней осталось каждого препарата. Приложение будет считать остаток и подскажет, когда пора докупить — чтобы ничего не закончилось внезапно.")
      ),
      active.map(p => {
        const rem = remaining(p.id);
        const low = rem !== null && rem <= 7;
        return React.createElement("div", { key: p.id, style: { background: C.card, border: `0.5px solid ${low ? C.warn + "55" : C.border}`, borderRadius: 11, padding: "11px 13px", marginBottom: 8 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } },
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, p.name),
              rem !== null
                ? React.createElement("div", { style: { fontSize: 11.5, color: low ? C.warn : C.textM, marginTop: 2, fontWeight: low ? 600 : 400 } },
                    low ? `⚠ Осталось ${rem} дн. — пора докупить` : `Осталось ~${rem} дн.`)
                : React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 2 } }, "Не отмечено")
            ),
            React.createElement("div", { style: { display: "flex", gap: 4, flexShrink: 0 } },
              [14, 30, 60].map(d => React.createElement("button", { key: d, onClick: () => setDays(p.id, d),
                style: { padding: "6px 9px", borderRadius: 7, border: `0.5px solid ${C.border}`, background: C.bg, color: C.textM, fontSize: 11, cursor: "pointer", fontFamily: "inherit" } }, d, "д"))
            )
          )
        );
      }),
      React.createElement("div", { style: { fontSize: 10.5, color: C.textL, lineHeight: 1.5, marginTop: 4 } },
        "Нажми 14/30/60 в день покупки — счётчик пойдёт от сегодня. Когда докупишь, нажми снова.")
    );
  }

  function SettingsTab({ badDay, setBadDay, setOnboardingDone, packAnchor }) {
    const [userName, setUserName] = useLS("userName", "Маша");
    const [startFerritin, setStartFerritin] = useLS("startFerritin", "");
    const [currentFerritin, setCurrentFerritin] = useLS("currentFerritin", "");
    const [goalKcal, setGoalKcal] = useLS("nKcal", 1750);
    const [goalWt, setGoalWt] = useLS("nGW", 51.5);
    const [curWt, setCurWt] = useLS("nCW", 55);
    const [proteinGoal, setProteinGoal] = useLS("proteinGoal", 90);
    const [waterGoal, setWaterGoal] = useLS("waterGoal", 8);
    const [mealTimes, setMealTimes] = useLS("mealTimes", { b: "09:00", l: "14:00", s: "17:00", d: "19:00" });
    const [doctors, setDoctors] = useLS("doctorsV1", [
      { id: "d1", spec: "Трихолог", name: "", phone: "", lastVisit: "", note: "" },
      { id: "d2", spec: "Гастроэнтеролог", name: "", phone: "", lastVisit: "", note: "" },
      { id: "d3", spec: "Гинеколог", name: "", phone: "", lastVisit: "", note: "" },
      { id: "d4", spec: "Психотерапевт", name: "", phone: "", lastVisit: "", note: "" },
    ]);
    const [activeSec, setActiveSec] = useState("profile");

    const resetOnboarding = () => {
      if (!confirm("Сбросить onboarding? Приложение спросит дату начала пачки Ярины и имя заново.")) return;
      try { localStorage.removeItem("onboardingDone"); } catch {}
      setOnboardingDone(false);
    };

    const exportData = () => {
      try {
        const d = { __meta: { version: 1, exportedAt: new Date().toISOString(), app: "fox-plan" } };
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          d[k] = localStorage.getItem(k);
        }
        const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const today = dayKey();
        a.href = url; a.download = `fox_plan_backup_${today}.json`; a.click();
        try { localStorage.setItem("lastBackupAt", JSON.stringify(new Date().toISOString())); } catch {}
      } catch { alert("Ошибка экспорта"); }
    };

    const importData = (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = (ev) => {
        try {
          const d = JSON.parse(ev.target.result);
          if (!d || typeof d !== "object" || Array.isArray(d)) { alert("Файл не похож на резервную копию."); return; }
          const keys = Object.keys(d).filter(k => k !== "__meta");
          if (keys.length === 0) { alert("В файле нет данных для восстановления."); return; }
          if (!confirm("Восстановление ЗАМЕНИТ все текущие данные на данные из файла. Продолжить?")) return;
          // Полная замена: чистим текущее хранилище, затем пишем из файла
          try { localStorage.clear(); } catch {}
          keys.forEach(k => { try { localStorage.setItem(k, d[k]); } catch {} });
          alert("Восстановлено! Перезагрузи страницу.");
        } catch { alert("Ошибка импорта — файл повреждён или не тот формат."); }
      };
      r.readAsText(f);
    };

    const inputStyle = {
      width: "100%", padding: "10px 12px", borderRadius: 8, border: `0.5px solid ${C.border}`,
      background: C.bg, fontSize: 14, fontFamily: "inherit", color: C.text,
      minWidth: 0, boxSizing: "border-box", outline: "none"
    };

    const Card = ({ children, style = {} }) => React.createElement("div", {
      style: { background: C.card, borderRadius: 12, padding: "14px", marginBottom: 10, border: `0.5px solid ${C.border}`, ...style }
    }, children);

    const Field = ({ label, children, hint }) => React.createElement("div", { style: { marginBottom: 12 } },
      React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 5 } }, label),
      children,
      hint && React.createElement("div", { style: { fontSize: 11, color: C.textL, marginTop: 4, lineHeight: 1.4 } }, hint)
    );

    const sections = [
      { id: "profile", l: "👤 Профиль" },
      { id: "nutrition", l: "🎯 Цели" },
      { id: "pharmacy", l: "💊 Аптечка" },
      { id: "doctors", l: "👩‍⚕️ Врачи" },
      { id: "notify", l: "🔔 Состояние" },
      { id: "data", l: "💾 Данные" },
    ];

    return React.createElement("div", null,
      // Секции — tabs
      React.createElement("div", { style: { display: "flex", gap: 3, marginBottom: 14, overflowX: "auto", paddingBottom: 2 } },
        sections.map(s => React.createElement("button", { key: s.id, onClick: () => setActiveSec(s.id),
          style: { padding: "8px 11px", borderRadius: 8, border: `0.5px solid ${activeSec === s.id ? C.olive : C.border}`,
            background: activeSec === s.id ? C.olive : C.card, color: activeSec === s.id ? "#fff" : C.textM,
            fontSize: 11, fontWeight: activeSec === s.id ? 600 : 500, cursor: "pointer",
            fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }
        }, s.l))
      ),

      // ПРОФИЛЬ
      activeSec === "profile" && Card({ children: React.createElement(React.Fragment, null,
        Field({ label: "Имя", children: React.createElement("input", {
          value: userName, onChange: e => setUserName(e.target.value), type: "text", style: inputStyle
        })}),
        Field({ label: "Текущий вес (кг)", children: React.createElement("input", {
          type: "number", value: curWt, onChange: e => setCurWt(e.target.value), step: "0.5", style: inputStyle
        })}),
        Field({ label: "Целевой вес (кг)", children: React.createElement("input", {
          type: "number", value: goalWt, onChange: e => setGoalWt(e.target.value), step: "0.5", style: inputStyle
        })}),
        Field({ label: "Стартовый ферритин (мкг/л)", children: React.createElement("input", {
          type: "number", value: startFerritin, onChange: e => setStartFerritin(e.target.value), placeholder: "28", style: inputStyle
        }), hint: "Стартовый ферритин для отслеживания прогресса. Норма 30-100." }),
        Field({ label: "Текущий ферритин", children: React.createElement("input", {
          type: "number", value: currentFerritin, onChange: e => setCurrentFerritin(e.target.value), placeholder: "—", style: inputStyle
        }), hint: "Обновляй после каждых анализов чтобы видеть динамику в трендах." })
      )}),

      // ЦЕЛИ (бывш. Питание)
      activeSec === "nutrition" && Card({ children: React.createElement(React.Fragment, null,
        Field({ label: "Цель белка (г / день)", children: React.createElement("input", {
          type: "number", value: proteinGoal, onChange: e => setProteinGoal(Number(e.target.value)), min: "50", max: "200", style: inputStyle
        }), hint: "По плану: 90 г/день для волос и спорта (1.6 г/кг)." }),
        Field({ label: "Цель воды (стаканов)", children: React.createElement("input", {
          type: "number", value: waterGoal, onChange: e => setWaterGoal(Number(e.target.value)), min: "4", max: "20", style: inputStyle
        }), hint: "~30 мл / кг веса + по стакану на каждую чашку кофе/чая." }),
        Field({ label: "Калории / день", children: React.createElement("input", {
          type: "number", value: goalKcal, onChange: e => setGoalKcal(e.target.value), min: "1200", max: "3000", style: inputStyle
        })}),
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginTop: 14, marginBottom: 8 } }, "Время приёмов пищи"),
        [{ k: "b", l: "Завтрак" }, { k: "l", l: "Обед" }, { k: "s", l: "Перекус" }, { k: "d", l: "Ужин" }].map(m =>
          React.createElement("div", { key: m.k, style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 } },
            React.createElement("div", { style: { fontSize: 12, color: C.textM, width: 70, flexShrink: 0 } }, m.l),
            React.createElement("input", { type: "time", value: mealTimes[m.k],
              onChange: e => setMealTimes({ ...mealTimes, [m.k]: e.target.value }),
              style: { ...inputStyle, flex: 1, padding: "8px 10px", fontSize: 13 }
            })
          )
        )
      )}),

      // АПТЕЧКА
      activeSec === "pharmacy" && React.createElement(PillStockTracker, { packAnchor }),

      // ВРАЧИ
      activeSec === "doctors" && React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 12, color: C.textM, lineHeight: 1.6, marginBottom: 10, padding: "0 4px" } },
          "Контакты врачей всегда под рукой — чтобы быстро написать или показать на приёме у другого врача."
        ),
        doctors.map((doc, di) => Card({ children: React.createElement(React.Fragment, null,
          React.createElement("div", { style: { fontSize: 12, color: C.oliveDeep, fontWeight: 600, marginBottom: 8 } }, doc.spec),
          Field({ label: "ФИО", children: React.createElement("input", {
            value: doc.name, onChange: e => {
              const upd = [...doctors]; upd[di] = { ...doc, name: e.target.value }; setDoctors(upd);
            }, type: "text", placeholder: "Имя Фамилия", style: inputStyle
          })}),
          Field({ label: "Телефон", children: React.createElement("input", {
            value: doc.phone, onChange: e => {
              const upd = [...doctors]; upd[di] = { ...doc, phone: e.target.value }; setDoctors(upd);
            }, type: "tel", placeholder: "+48 ...", style: inputStyle
          })}),
          Field({ label: "Последний визит", children: React.createElement("input", {
            type: "date", value: doc.lastVisit, onChange: e => {
              const upd = [...doctors]; upd[di] = { ...doc, lastVisit: e.target.value }; setDoctors(upd);
            }, style: inputStyle
          })}),
          Field({ label: "Заметки", children: React.createElement("textarea", {
            value: doc.note, onChange: e => {
              const upd = [...doctors]; upd[di] = { ...doc, note: e.target.value }; setDoctors(upd);
            }, placeholder: "Назначения, рекомендации...",
            style: { ...inputStyle, minHeight: 50, padding: "10px 12px", resize: "vertical" }
          })}),
          // Вопросы на приём — антидот ночному гуглению
          React.createElement("div", { style: { marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${C.border}` } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.oliveDeep, marginBottom: 7 } }, "Спросить на приёме"),
            (doc.questions || []).length === 0 && React.createElement("div", { style: { fontSize: 11.5, color: C.textL, marginBottom: 7 } },
              "Появилась тревожная мысль? Запиши сюда — и можно отложить до приёма."),
            (doc.questions || []).map((q, qi) => React.createElement("div", { key: qi, style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 5 } },
              React.createElement("button", { onClick: () => {
                const upd = [...doctors]; const qs = [...(doc.questions || [])]; qs[qi] = { ...qs[qi], done: !qs[qi].done }; upd[di] = { ...doc, questions: qs }; setDoctors(upd);
              }, "aria-label": "отметить", style: { width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${q.done ? C.olive : C.border}`, background: q.done ? C.olive : "transparent", color: "#fff", fontSize: 12, cursor: "pointer", flexShrink: 0, fontFamily: "inherit", lineHeight: 1 } }, q.done ? "✓" : ""),
              React.createElement("div", { style: { flex: 1, fontSize: 12.5, color: q.done ? C.textL : C.text, textDecoration: q.done ? "line-through" : "none", lineHeight: 1.4 } }, q.q),
              React.createElement("button", { onClick: () => {
                const upd = [...doctors]; const qs = (doc.questions || []).filter((_, j) => j !== qi); upd[di] = { ...doc, questions: qs }; setDoctors(upd);
              }, "aria-label": "удалить", style: { background: "none", border: "none", color: C.textL, fontSize: 15, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" } }, "×")
            )),
            React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 6 } },
              React.createElement("input", {
                type: "text", placeholder: "+ вопрос", value: doc._draft || "",
                onChange: e => { const upd = [...doctors]; upd[di] = { ...doc, _draft: e.target.value }; setDoctors(upd); },
                onKeyDown: e => {
                  if (e.key === "Enter" && (doc._draft || "").trim()) {
                    const upd = [...doctors]; const qs = [...(doc.questions || []), { q: doc._draft.trim(), done: false }]; upd[di] = { ...doc, questions: qs, _draft: "" }; setDoctors(upd);
                  }
                },
                style: { ...inputStyle, flex: 1 }
              }),
              React.createElement("button", { onClick: () => {
                if (!(doc._draft || "").trim()) return;
                const upd = [...doctors]; const qs = [...(doc.questions || []), { q: doc._draft.trim(), done: false }]; upd[di] = { ...doc, questions: qs, _draft: "" }; setDoctors(upd);
              }, style: { padding: "0 16px", borderRadius: 8, background: C.olive, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, "+")
            ),
            (doc.questions || []).some(q => !q.done) && React.createElement("div", { style: { fontSize: 11, color: C.oliveDeep, marginTop: 8, lineHeight: 1.5 } },
              "Записала? Тогда можно отложить до приёма. Сейчас — выдох 🦊")
          )
        ) }))
      ),

      // СОСТОЯНИЕ / УВЕДОМЛЕНИЯ
      activeSec === "notify" && Card({ children: React.createElement(React.Fragment, null,
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 } },
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: C.text } }, "Плохо себя сегодня"),
            React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 3, lineHeight: 1.5 } },
              "Тренировки заменятся на лёгкий день. Сбросится в полночь."
            )
          ),
          React.createElement("button", { onClick: () => setBadDay(!badDay),
            role: "switch", "aria-checked": badDay ? "true" : "false", "aria-label": "Плохо себя сегодня",
            style: { width: 48, height: 28, borderRadius: 14, border: "none",
              background: badDay ? C.olive : C.border, cursor: "pointer", position: "relative", flexShrink: 0, fontFamily: "inherit" }
          },
            React.createElement("div", { style: {
              position: "absolute", top: 2, left: badDay ? 22 : 2, width: 24, height: 24, borderRadius: "50%",
              background: "#fff", transition: "left .15s"
            }})
          )
        )
      )}),

      // ДАННЫЕ
      activeSec === "data" && React.createElement("div", null,
        Card({ children: React.createElement(React.Fragment, null,
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 } }, "🩺 Отчёт для врача"),
          React.createElement(DoctorExport, { packAnchor })
        )}),
        Card({ children: React.createElement(React.Fragment, null,
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 } }, "Резервная копия"),
          // Статус последнего бэкапа
          (() => {
            let last = null;
            try {
              const raw = localStorage.getItem("lastBackupAt");
              if (raw) last = new Date(JSON.parse(raw));
            } catch {}
            if (!last) {
              return React.createElement("div", {
                style: { padding: "8px 11px", background: C.warnSoft, border: `0.5px solid ${C.warn}44`,
                  borderRadius: 8, marginBottom: 10 }
              },
                React.createElement("div", { style: { fontSize: 11, color: C.warn, fontWeight: 600 } }, "⚠ Бэкапа ещё не было"),
                React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2, lineHeight: 1.5 } },
                  "Сделай первую копию прямо сейчас — занимает 5 секунд."
                )
              );
            }
            const daysAgo = Math.floor((Date.now() - last.getTime()) / 86400000);
            const isOld = daysAgo > 7;
            return React.createElement("div", {
              style: { padding: "8px 11px", background: isOld ? C.warnSoft : C.sandSoft,
                border: `0.5px solid ${isOld ? C.warn + "44" : C.sand + "44"}`, borderRadius: 8, marginBottom: 10 }
            },
              React.createElement("div", { style: { fontSize: 11, color: isOld ? C.warn : C.sandDeep, fontWeight: 600 } },
                isOld ? `⚠ Последний бэкап ${daysAgo} дн. назад` : `✓ Последний бэкап ${daysAgo === 0 ? "сегодня" : daysAgo === 1 ? "вчера" : daysAgo + " дн. назад"}`
              ),
              React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2, lineHeight: 1.5 } },
                last.toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
              )
            );
          })(),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.6, marginBottom: 10 } },
            "Данные хранятся в Safari на iPhone. Делай копию раз в неделю — это защитит от случайного сброса при очистке Safari или если iOS почистит «неактивные» сайты."
          ),
          React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12 } },
            React.createElement("button", { onClick: exportData,
              style: { flex: 1, padding: "10px", borderRadius: 9, background: C.oliveSoft, border: `0.5px solid ${C.olive}44`,
                color: C.oliveDeep, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }
            }, "⬇ Скачать копию"),
            React.createElement("label", {
              style: { flex: 1, padding: "10px", borderRadius: 9, background: C.sandSoft, border: `0.5px solid ${C.sand}44`,
                color: C.sandDeep, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }
            },
              "⬆ Восстановить",
              React.createElement("input", { type: "file", accept: ".json", onChange: importData, style: { display: "none" } })
            )
          ),
          // Инструкция как куда сохранять и как восстанавливать
          React.createElement("div", { style: { padding: "10px 12px", background: C.bgWarm, borderRadius: 8, fontSize: 11, color: C.textM, lineHeight: 1.6 } },
            React.createElement("div", { style: { fontWeight: 600, color: C.text, marginBottom: 4 } }, "📁 Куда сохранять бэкап"),
            "После нажатия «Скачать копию» Safari предложит куда сохранить. Рекомендую: ",
            React.createElement("br"),
            "• ", React.createElement("b", null, "Файлы → iCloud Drive"), " — синхронизируется автоматически",
            React.createElement("br"),
            "• ", React.createElement("b", null, "Telegram → Избранное"), " — самый быстрый доступ",
            React.createElement("br"),
            React.createElement("br"),
            React.createElement("div", { style: { fontWeight: 600, color: C.text, marginBottom: 4 } }, "🔄 Как восстановить"),
            "1. Нажми ⬆ Восстановить", React.createElement("br"),
            "2. Выбери JSON-файл из Файлов / Telegram", React.createElement("br"),
            "3. Перезагрузи страницу", React.createElement("br"),
            React.createElement("br"),
            React.createElement("b", { style: { color: C.warn } }, "⚠ Важно:"), " бэкап ", React.createElement("b", null, "заменяет"), " все текущие данные. Если после потери открыла приложение — восстанавливай сразу, до того как что-то отметишь."
          )
        )}),
        Card({ children: React.createElement(React.Fragment, null,
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 } }, "Офлайн-режим"),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.6, marginBottom: 10 } },
            "Приложение работает без интернета — открывается и грузится мгновенно. После одной загрузки с сетью всё сохранится на устройстве. Кнопка ниже — если обновила файлы и хочешь подтянуть свежую версию сразу."
          ),
          React.createElement("button", { onClick: async () => {
            try {
              if ("caches" in window) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); }
              if (navigator.serviceWorker) { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister())); }
            } catch {}
            location.reload();
          },
            style: { width: "100%", padding: "10px", borderRadius: 9, background: C.bgWarm, border: `0.5px solid ${C.border}`,
              color: C.textM, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }
          }, "🔄 Обновить до последней версии")
        )}),
        Card({ children: React.createElement(React.Fragment, null,
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 } }, "Сбросить настройки"),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.6, marginBottom: 10 } },
            "Если изменилась дата начала пачки Ярины, ферритин или имя — можешь пройти стартовый опрос заново."
          ),
          React.createElement("button", { onClick: resetOnboarding,
            style: { width: "100%", padding: "10px", borderRadius: 9, background: C.bgWarm, border: `0.5px solid ${C.border}`,
              color: C.textM, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }
          }, "Пройти onboarding заново")
        )})
      ),

      // Изменения сохраняются автоматически — отдельная кнопка не нужна
      React.createElement("div", { style: { textAlign: "center", fontSize: 11.5, color: C.textM, marginTop: 10, marginBottom: 14 } },
        "✓ Изменения сохраняются автоматически")
    );
  }
  function MultiRing({ rings }) {
    const base = 136, sw = 12, gap = 5, cx = 68;
    return React.createElement("div", { style: { position: "relative", width: base, height: base, flexShrink: 0 } },
      React.createElement("svg", { width: base, height: base, style: { transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 } },
        rings.map((ring, i) => {
          const r = cx - sw/2 - i * (sw + gap);
          const circ = 2 * Math.PI * r;
          const off = circ - Math.min(ring.pct, 100) / 100 * circ;
          return React.createElement(React.Fragment, { key: i },
            React.createElement("circle", { cx, cy: cx, r, fill: "none", stroke: ring.color + "28", strokeWidth: sw }),
            React.createElement("circle", { cx, cy: cx, r, fill: "none", stroke: ring.color, strokeWidth: sw,
              strokeDasharray: circ, strokeDashoffset: off, strokeLinecap: "round",
              style: { transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" } })
          );
        })
      ),
      React.createElement("div", { style: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 } },
        React.createElement("div", { style: { fontSize: 20, lineHeight: 1 } }, "🌸")
      )
    );
  }

  // ===========================================================================
  // CalmTool — быстрый инструмент при тревоге: дыхание «квадрат» (4-4-4-4)
  // с анимированным кругом + заземление 5-4-3-2-1. Без оценок и метрик.
  // ===========================================================================
  // ===========================================================================
  // WorryBox — «Место для тревоги» (CBT worry-time): записать тревожную мысль,
  // отложить её, и вернуться к списку в спокойное время вечером.
  // ===========================================================================
  function WorryBox({ onClose }) {
    const [worries, setWorries] = useLS("worriesV1", []); // [{id, text, at, released}]
    const [doctors, setDoctors] = useLS("doctorsV1", []);
    const [draft, setDraft] = useState("");
    const [pickFor, setPickFor] = useState(null); // worry id awaiting doctor choice
    const add = () => {
      const t = draft.trim();
      if (!t) return;
      setWorries([{ id: "w" + Date.now(), text: t, at: new Date().toISOString(), released: false }, ...worries]);
      setDraft("");
    };
    const toggle = (id) => setWorries(worries.map(w => w.id === id ? { ...w, released: !w.released } : w));
    const del = (id) => setWorries(worries.filter(w => w.id !== id));
    const sendToDoctor = (worry, di) => {
      const upd = [...doctors];
      const doc = upd[di];
      const qs = [...(doc.questions || []), { q: worry.text, done: false }];
      upd[di] = { ...doc, questions: qs };
      setDoctors(upd);
      // помечаем тревогу как отпущенную (передана врачу)
      setWorries(worries.map(w => w.id === worry.id ? { ...w, released: true } : w));
      setPickFor(null);
    };
    const fmt = (iso) => {
      try { const d = new Date(iso); return d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
      catch { return ""; }
    };
    const active = worries.filter(w => !w.released);
    const released = worries.filter(w => w.released);
    const hour = new Date().getHours();
    const isEvening = hour >= 18 && hour <= 23;

    return React.createElement("div", {
      style: { position: "fixed", inset: 0, zIndex: 100, background: C.bg, overflowY: "auto",
        maxWidth: 430, left: "50%", transform: "translateX(-50%)", width: "100%" }
    },
      React.createElement("div", { style: { position: "sticky", top: 0, background: C.card, borderBottom: `0.5px solid ${C.border}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, zIndex: 2 } },
        React.createElement("button", { onClick: onClose, "aria-label": "Закрыть",
          style: { background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.oliveDeep, lineHeight: 1, padding: 0, fontFamily: "inherit" } }, "←"),
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.text } }, "Место для тревоги")
      ),
      React.createElement("div", { style: { padding: "16px" } },
        // Объяснение техники
        React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 12, padding: "13px 15px", marginBottom: 16 } },
          React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.6 } },
            "Тревожная мысль не требует решения прямо сейчас. Запиши её сюда и отложи — а вернуться к списку можно вечером, в спокойное «время для тревоги». Часто к вечеру половина уже не кажется такой важной. Это нормально 🦊")
        ),
        // Поле ввода
        React.createElement("div", { style: { marginBottom: 18 } },
          React.createElement("textarea", {
            value: draft, onChange: e => setDraft(e.target.value),
            placeholder: "Что тревожит прямо сейчас? Запиши и отложи…",
            style: { width: "100%", minHeight: 70, padding: "11px 13px", borderRadius: 11, border: `0.5px solid ${C.border}`, background: C.card, fontSize: 13, fontFamily: "inherit", color: C.text, boxSizing: "border-box", outline: "none", resize: "vertical", lineHeight: 1.5 }
          }),
          React.createElement("button", { onClick: add, disabled: !draft.trim(),
            style: { width: "100%", marginTop: 8, padding: "12px", borderRadius: 11, background: draft.trim() ? C.olive : C.bgWarm, border: "none", color: draft.trim() ? "#fff" : C.textL, fontSize: 14, fontWeight: 600, cursor: draft.trim() ? "pointer" : "default", fontFamily: "inherit" } },
            "Отложить тревогу")
        ),
        // Вечернее приглашение вернуться
        active.length > 0 && isEvening && React.createElement("div", { style: { background: C.sandSoft, border: `0.5px solid ${C.sand}55`, borderRadius: 11, padding: "11px 13px", marginBottom: 14 } },
          React.createElement("div", { style: { fontSize: 12, color: C.sandDeep, lineHeight: 1.55 } },
            "🌙 Сейчас вечер — спокойное время. Можно перечитать записанное: что-то, возможно, уже отпустило. Отметь такие мысли как «отпустила».")
        ),
        // Активные тревоги
        active.length > 0 && React.createElement("div", { style: { marginBottom: 18 } },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 } }, "Отложенные мысли"),
          active.map(w => React.createElement("div", { key: w.id, style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 11, padding: "11px 13px", marginBottom: 7 } },
            React.createElement("div", { style: { fontSize: 13, color: C.text, lineHeight: 1.5, marginBottom: 7 } }, w.text),
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, flexWrap: "wrap" } },
              React.createElement("div", { style: { fontSize: 10.5, color: C.textL } }, fmt(w.at)),
              React.createElement("div", { style: { display: "flex", gap: 6 } },
                doctors.length > 0 && React.createElement("button", { onClick: () => setPickFor(pickFor === w.id ? null : w.id),
                  style: { fontSize: 11.5, padding: "5px 11px", borderRadius: 8, background: C.sandSoft, border: `0.5px solid ${C.sand}55`, color: C.sandDeep, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, "→ врачу"),
                React.createElement("button", { onClick: () => toggle(w.id),
                  style: { fontSize: 11.5, padding: "5px 11px", borderRadius: 8, background: C.oliveSoft, border: `0.5px solid ${C.olive}44`, color: C.oliveDeep, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, "отпустила"),
                React.createElement("button", { onClick: () => del(w.id), "aria-label": "удалить",
                  style: { fontSize: 14, padding: "5px 9px", borderRadius: 8, background: "none", border: `0.5px solid ${C.border}`, color: C.textL, cursor: "pointer", fontFamily: "inherit" } }, "×")
              )
            ),
            // Инлайн-выбор врача
            pickFor === w.id && React.createElement("div", { style: { marginTop: 9, paddingTop: 9, borderTop: `0.5px solid ${C.border}` } },
              React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 6 } }, "Кому из врачей добавить этот вопрос?"),
              React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
                doctors.map((doc, di) => React.createElement("button", { key: di, onClick: () => sendToDoctor(w, di),
                  style: { fontSize: 11.5, padding: "6px 11px", borderRadius: 999, background: C.card, border: `0.5px solid ${C.olive}55`, color: C.oliveDeep, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } },
                  doc.spec || doc.name || ("Врач " + (di + 1))))
              )
            )
          ))
        ),
        // Отпущенные
        released.length > 0 && React.createElement("details", { style: { marginBottom: 10 } },
          React.createElement("summary", { style: { fontSize: 12, color: C.oliveDeep, cursor: "pointer", fontWeight: 600 } }, "Отпущенные (", released.length, ")"),
          React.createElement("div", { style: { marginTop: 8 } },
            released.map(w => React.createElement("div", { key: w.id, style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 11px", marginBottom: 5, background: C.bgWarm, borderRadius: 9 } },
              React.createElement("div", { style: { fontSize: 12, color: C.textM, textDecoration: "line-through", lineHeight: 1.4, flex: 1 } }, w.text),
              React.createElement("div", { style: { display: "flex", gap: 6, flexShrink: 0 } },
                React.createElement("button", { onClick: () => toggle(w.id),
                  style: { fontSize: 11, padding: "4px 8px", borderRadius: 7, background: "none", border: `0.5px solid ${C.border}`, color: C.textM, cursor: "pointer", fontFamily: "inherit" } }, "вернуть"),
                React.createElement("button", { onClick: () => del(w.id), "aria-label": "удалить",
                  style: { fontSize: 13, padding: "4px 8px", borderRadius: 7, background: "none", border: `0.5px solid ${C.border}`, color: C.textL, cursor: "pointer", fontFamily: "inherit" } }, "×")
              )
            ))
          )
        ),
        worries.length === 0 && React.createElement("div", { style: { fontSize: 12, color: C.textL, textAlign: "center", padding: "10px 0", lineHeight: 1.5 } },
          "Здесь пока пусто. Это хорошо 🌿")
      )
    );
  }

  function CalmTool({ onClose }) {
    const [mode, setMode] = useState("breath"); // breath | ground
    const PHASES = [
      { label: "Вдох", sec: 4 },
      { label: "Задержи", sec: 4 },
      { label: "Выдох", sec: 4 },
      { label: "Задержи", sec: 4 },
    ];
    const [phase, setPhase] = useState(0);
    const [count, setCount] = useState(4);
    const [running, setRunning] = useState(false);
    const [cycles, setCycles] = useState(0);

    useEffect(() => {
      if (!running || mode !== "breath") return;
      const t = setInterval(() => {
        setCount(c => {
          if (c > 1) return c - 1;
          setPhase(p => {
            const np = (p + 1) % 4;
            if (np === 0) setCycles(x => x + 1);
            return np;
          });
          return 4;
        });
      }, 1000);
      return () => clearInterval(t);
    }, [running, mode]);

    const cur = PHASES[phase];
    const isInhale = cur.label === "Вдох";
    const isExhale = cur.label === "Выдох";
    const circleScale = isInhale ? 1.35 : isExhale ? 0.75 : (phase === 1 ? 1.35 : 0.75);

    const GROUND = [
      { n: 5, sense: "вещей, которые ВИДИШЬ", icon: "👀" },
      { n: 4, sense: "вещи, которые МОЖЕШЬ ПОТРОГАТЬ", icon: "✋" },
      { n: 3, sense: "звука, которые СЛЫШИШЬ", icon: "👂" },
      { n: 2, sense: "запаха, которые ЧУВСТВУЕШЬ", icon: "👃" },
      { n: 1, sense: "вкус во рту", icon: "👅" },
    ];

    return React.createElement("div", {
      style: { position: "fixed", inset: 0, zIndex: 100, background: C.bg, overflowY: "auto",
        maxWidth: 430, left: "50%", transform: "translateX(-50%)", width: "100%" }
    },
      React.createElement("div", { style: { position: "sticky", top: 0, background: C.card, borderBottom: `0.5px solid ${C.border}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 } },
        React.createElement("button", { onClick: onClose, "aria-label": "Закрыть",
          style: { background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.oliveDeep, lineHeight: 1, padding: 0, fontFamily: "inherit" } }, "←"),
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.text } }, "Минутка покоя")
      ),
      React.createElement("div", { style: { padding: "16px" } },
        React.createElement("div", { style: { fontSize: 12.5, color: C.textM, lineHeight: 1.55, marginBottom: 16, textAlign: "center" } },
          "Тревога — это волна. Она поднимается и обязательно спадает. Давай поможем телу успокоиться."),
        // Переключатель
        React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 20 } },
          [{ id: "breath", l: "🫧 Дыхание" }, { id: "ground", l: "🌿 Заземление" }].map(m =>
            React.createElement("button", { key: m.id, onClick: () => { setMode(m.id); setRunning(false); setPhase(0); setCount(4); setCycles(0); },
              style: { flex: 1, padding: "9px", borderRadius: 9, border: `0.5px solid ${mode === m.id ? C.olive : C.border}`,
                background: mode === m.id ? C.oliveSoft : C.card, color: mode === m.id ? C.oliveDeep : C.textM,
                fontSize: 12.5, fontWeight: mode === m.id ? 600 : 500, cursor: "pointer", fontFamily: "inherit" } }, m.l))
        ),
        mode === "breath"
          ? React.createElement("div", { style: { textAlign: "center" } },
              React.createElement("div", { style: { height: 220, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 } },
                React.createElement("div", {
                  style: { width: 150, height: 150, borderRadius: "50%", background: C.oliveSoft,
                    border: `2px solid ${C.olive}`, display: "flex", alignItems: "center", justifyContent: "center",
                    transform: `scale(${running ? circleScale : 1})`, transition: "transform 1s ease-in-out" }
                },
                  React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 17, fontWeight: 700, color: C.oliveDeep } }, running ? cur.label : "Готова?"),
                    running && React.createElement("div", { style: { fontSize: 32, fontWeight: 800, color: C.oliveDeep, lineHeight: 1.1 } }, count)
                  )
                )
              ),
              React.createElement("button", { onClick: () => setRunning(r => !r),
                style: { padding: "12px 30px", borderRadius: 12, background: running ? C.bgWarm : C.olive, border: running ? `0.5px solid ${C.border}` : "none",
                  color: running ? C.textM : "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } },
                running ? "Пауза" : "Начать"),
              cycles > 0 && React.createElement("div", { style: { fontSize: 12, color: C.textM, marginTop: 14 } }, "Циклов пройдено: ", cycles, cycles >= 4 ? " — ты молодец 💛" : ""),
              React.createElement("div", { style: { fontSize: 11.5, color: C.textL, lineHeight: 1.55, marginTop: 18 } },
                "Дыхание «квадрат»: вдох 4 сек → задержка 4 → выдох 4 → задержка 4. Длинный выдох включает парасимпатику — тело само переходит в режим покоя. 4–6 циклов обычно достаточно.")
            )
          : React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 12.5, color: C.textM, lineHeight: 1.55, marginBottom: 14, textAlign: "center" } },
                "Назови про себя — это возвращает из тревожных мыслей в «здесь и сейчас»:"),
              GROUND.map((g, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 12, alignItems: "center", background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 11, padding: "13px 15px", marginBottom: 8 } },
                React.createElement("div", { style: { fontSize: 24, flexShrink: 0 } }, g.icon),
                React.createElement("div", null,
                  React.createElement("span", { style: { fontSize: 22, fontWeight: 800, color: C.oliveDeep } }, g.n),
                  React.createElement("span", { style: { fontSize: 13, color: C.text, marginLeft: 8 } }, g.sense)
                )
              )),
              React.createElement("div", { style: { fontSize: 11.5, color: C.textL, lineHeight: 1.55, marginTop: 10 } },
                "Не спеши. Если мысли уносят — спокойно вернись к следующему пункту. Это нормально.")
            )
      ),
      // Спокойная строка поддержки — всегда внизу, без тревожности
      React.createElement("div", { style: { padding: "0 16px 28px" } },
        React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.6, padding: "11px 13px", background: C.bgWarm, borderRadius: 10 } },
          "Если тебе невыносимо тяжело или есть мысли причинить себе вред — ты не одна. В Польше: телефон доверия ",
          React.createElement("b", null, "116 123"),
          " (для взрослых, круглосуточно), кризисная линия ",
          React.createElement("b", null, "116 111"),
          ", экстренный номер ",
          React.createElement("b", null, "112"),
          ". Позвонить — это нормально и смело."
        )
      )
    );
  }

  // Небольшой заголовок-разделитель между группами на «Сегодня»
  function SectionLabel({ children }) {
    return React.createElement("div", {
      style: { fontSize: 10.5, fontWeight: 700, color: C.textL, letterSpacing: 0.6,
        textTransform: "uppercase", margin: "16px 2px 8px" }
    }, children);
  }

  // Текстовая заметка-напоминание, которую можно закрыть на сегодня.
  function DismissibleNote({ id, icon, title, text, accent }) {
    const dayK = dayKey();
    const lsKey = "noteDismissed_" + id;
    const [dismissed, setDismissed] = useState(() => {
      try { return localStorage.getItem(lsKey) === dayK; } catch { return false; }
    });
    if (dismissed) return null;
    const close = () => {
      try { localStorage.setItem(lsKey, dayK); } catch {}
      setDismissed(true);
    };
    const ac = accent || C.textM;
    return React.createElement("div", {
      style: { background: C.bgWarm, borderRadius: 10, padding: "10px 12px", marginBottom: 8,
        display: "flex", gap: 10, alignItems: "flex-start", borderLeft: `3px solid ${ac}55` }
    },
      icon && React.createElement("div", { style: { fontSize: 15, flexShrink: 0, marginTop: 1 } }, icon),
      React.createElement("div", { style: { flex: 1, minWidth: 0 } },
        title && React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: ac } }, title),
        text && React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: title ? 2 : 0, lineHeight: 1.5 } }, text)
      ),
      React.createElement("button", { onClick: close, "aria-label": "Скрыть на сегодня",
        style: { background: "none", border: "none", color: C.textL, fontSize: 16, lineHeight: 1, cursor: "pointer", padding: "0 2px", flexShrink: 0, fontFamily: "inherit" } }, "×")
    );
  }

  // ===========================================================================
  // ProgressSummary — спокойная сводка прогресса: вес, ферритин, дни в ритме.
  // Читает существующие данные (nCW/nGW, labResultsV1, pillsTaken_*). Без давления.
  // ===========================================================================
  // ===========================================================================
  // IntakeGuide — «Как принимать сегодня»: для непростых препаратов явно пишет
  // что можно / что нельзя / за сколько, и считает тайминг по часам.
  // ===========================================================================
  function IntakeGuide({ packAnchor }) {
    const now = new Date();
    const todayDate = new Date(now); todayDate.setHours(0, 0, 0, 0);
    const todayKey = now.toLocaleDateString("ru-RU");
    const [taken, setTaken] = useLS("pillsTaken_" + todayKey, {});
    const curMins = now.getHours() * 60 + now.getMinutes();
    const fmt = (mins) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
    const parseT = (t) => { const [h, m] = (t || "0:0").split(":").map(Number); return h * 60 + m; };
    const human = (mins) => { const h = Math.floor(Math.abs(mins) / 60), m = Math.abs(mins) % 60; return (h ? h + " ч " : "") + (m ? m + " мин" : (h ? "" : "0 мин")); };

    // Пары, которые нельзя принимать близко по времени (id1, id2, причина)
    const CONFLICTS = [
      ["iron", "zinc", "железо и цинк конкурируют — развести подальше"],
      ["iron", "vitd", "железо лучше отдельно от жирорастворимых"],
      ["ae", "perfectil", "оба содержат витамин А — следи за суммарной дозой"],
      ["iron", "forlax", "Форлакс ±2 ч от железа (мешает всасыванию)"],
    ];

    // Правила для «непростых» препаратов. gapBefore/gapAfter — часы запрета вокруг приёма.
    const RULES = {
      iron: {
        emoji: "🩸", label: "Железо + витамин C",
        can: ["Запивать водой или соком с витамином C", "Принять натощак", "После окна — еда с витамином C: киви, цитрус, болгарский перец, ягоды"],
        cant: ["Кофе, чёрный/зелёный чай", "Молочное, кальций", "Антациды", "Отруби/много клетчатки в тот же приём"],
        gapBefore: 2, gapAfter: 2,
        extra: "Натощак, за 30–45 мин до завтрака. Чёрный стул — это норма.",
      },
      forlax: {
        emoji: "💧", label: "Форлакс",
        can: ["Развести в стакане воды и выпить", "С едой или без — на еду не завязан", "Пить больше воды в течение дня"],
        cant: ["Другие таблетки ±2 ч (ускоряет кишечник, мешает всасыванию)"],
        gapBefore: 2, gapAfter: 2, gapReason: "от других таблеток",
        extra: "Действует мягко через 24–48 ч. Можно долго.",
      },
      perfectil: {
        emoji: "🍽", label: "Перфектил",
        can: ["Только после полноценного обеда"],
        cant: ["Натощак — будет тошнить"],
        extra: "Содержит витамин А — не дублировать с A+E в один день без контроля дозы.",
      },
      ae: {
        emoji: "🟡", label: "A+E Medana",
        can: ["С едой, содержащей жиры (так усваивается)"],
        cant: ["Отдельно от витамина C и селена", "Не дублировать витамин А с Перфектилом"],
        extra: "Жирорастворимые витамины. Витамин E слегка разжижает кровь.",
      },
      zinc: {
        emoji: "🌙", label: "Zinkorot (цинк)",
        can: ["С ужином или сразу после"],
        cant: ["Натощак — тошнит", "Близко к железу"],
        extra: "Идеально — большой разрыв с железом (~12 ч).",
      },
      vitd: {
        emoji: "☀️", label: "Витамин D",
        can: ["С жирной едой — лучше усваивается"],
        cant: [],
        extra: "Только ПН / СР / СБ.",
      },
      duxet: {
        emoji: "💊", label: "Дуксет",
        can: ["Утром, в одно и то же время"],
        cant: ["Не пропускать, не бросать резко"],
        extra: "При резкой отмене — синдром отмены. Может вызывать запор — для этого есть Форлакс.",
      },
      omega: {
        emoji: "🐟", label: "Омега-3",
        can: ["С обедом (с жирами), 2 капсулы"],
        cant: [],
        extra: "Слегка разжижает кровь — учитывать с витамином E и Яриной.",
      },
      niac: {
        emoji: "🌙", label: "Ниацинамид",
        can: ["С ужином — лучше переносится"],
        cant: [],
        extra: "Это НЕ никотиновая кислота — нет покраснения, на холестерин не влияет.",
      },
      yarina: {
        emoji: "🌸", label: "Ярина",
        can: ["Строго в 21:00 каждый день пачки"],
        cant: ["Не пропускать", "Осторожно с зверобоем — снижает действие"],
        extra: "21 таблетка + 7 дней перерыв. В перерыв приложение её скрывает.",
      },
      cystenium: {
        emoji: "🌙", label: "Цистениум",
        can: ["На ночь, запивать водой"],
        cant: [],
        extra: "Профилактика цистита, не лечение. При симптомах — к врачу.",
      },
      mel: {
        emoji: "😴", label: "Мелатонин (опц.)",
        can: ["За час до сна, по необходимости"],
        cant: ["После приёма не смотреть в экраны"],
        extra: "Опционально — только если трудно заснуть.",
      },
    };

    let active = [];
    try { active = activePillsOn(todayDate, packAnchor); } catch { active = []; }
    const items = active.filter(p => RULES[p.id]).map(p => ({ p, r: RULES[p.id], t: parseT(p.time) }))
      .sort((a, b) => a.t - b.t);
    if (items.length === 0) return null;

    const toggle = (id) => setTaken({ ...taken, [id]: !taken[id] });

    // Ближайший НЕпринятый приём
    const upcoming = items.filter(x => !taken[x.p.id] && x.t >= curMins - 20).sort((a, b) => a.t - b.t)[0];
    const nextLine = (() => {
      if (!upcoming) {
        const allTaken = items.every(x => taken[x.p.id]);
        return allTaken ? "Всё на сегодня принято ✓" : null;
      }
      const d = upcoming.t - curMins;
      const when = Math.abs(d) <= 10 ? "сейчас" : (d > 0 ? "через " + human(d) : "пора (было в " + upcoming.p.time + ")");
      return "Ближайшее: " + upcoming.r.label + " — " + when;
    })();

    // Таймер «можно есть/пить» после железа (если железо принято сегодня)
    let ironTimer = null;
    const ironItem = items.find(x => x.p.id === "iron");
    if (ironItem && taken.iron && taken.__ironAt) {
      const since = Math.floor((Date.now() - taken.__ironAt) / 60000); // минут прошло
      const eatLeft = 40 - since;   // 40 мин до еды
      const drinkLeft = 120 - since; // 2 ч до кофе/чая/молочного
      ironTimer = React.createElement("div", { style: { background: C.sandSoft, border: `0.5px solid ${C.sand}44`, borderRadius: 10, padding: "10px 13px", marginBottom: 8 } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.sandDeep, marginBottom: 3 } }, "⏱ Железо принято — отсчёт"),
        React.createElement("div", { style: { fontSize: 11.5, color: C.text, lineHeight: 1.6 } },
          eatLeft > 0 ? `🍽 Завтрак можно через ${human(eatLeft)}` : "🍽 Можно завтракать",
          " · ",
          drinkLeft > 0 ? `☕ Кофе/чай/молочное — через ${human(drinkLeft)}` : "☕ Кофе/чай снова можно")
      );
    }

    // Конфликты среди сегодняшних препаратов (близко по времени, оба не приняты)
    const conflictNotes = [];
    CONFLICTS.forEach(([a, b, why]) => {
      const ia = items.find(x => x.p.id === a), ib = items.find(x => x.p.id === b);
      if (ia && ib) {
        const gap = Math.abs(ia.t - ib.t);
        if (gap < 120 && !(taken[a] && taken[b])) conflictNotes.push(why);
      }
    });

    return React.createElement("div", { style: { marginBottom: 10 } },
      // Ближайший приём
      nextLine && React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 10, padding: "10px 13px", marginBottom: 8, fontSize: 12.5, fontWeight: 600, color: C.oliveDeep } }, "⏰ ", nextLine),
      // Вечерняя сводка: что ещё не принято (после 19:00)
      (() => {
        if (now.getHours() < 19) return null;
        const left = active.filter(p => !taken[p.id]);
        if (left.length === 0) return null;
        return React.createElement("div", { style: { background: C.warnSoft, border: `0.5px solid ${C.warn}44`, borderRadius: 10, padding: "10px 13px", marginBottom: 8 } },
          React.createElement("div", { style: { fontSize: 11.5, fontWeight: 700, color: C.warn, marginBottom: 3 } }, "🌙 Ещё не отмечено сегодня"),
          React.createElement("div", { style: { fontSize: 11, color: C.text, lineHeight: 1.5 } }, left.map(p => p.name).join(", "))
        );
      })(),
      // Таймер железа
      ironTimer,
      // Конфликты
      conflictNotes.length > 0 && React.createElement("div", { style: { background: C.warnSoft, border: `0.5px solid ${C.warn}44`, borderRadius: 10, padding: "10px 13px", marginBottom: 8 } },
        React.createElement("div", { style: { fontSize: 11.5, fontWeight: 700, color: C.warn, marginBottom: 3 } }, "⚠️ Развести по времени"),
        conflictNotes.map((w, i) => React.createElement("div", { key: i, style: { fontSize: 11, color: C.text, lineHeight: 1.5 } }, "• ", w))
      ),
      items.map(({ p, r, t }) => {
        const isTaken = !!taken[p.id];
        const diff = t - curMins;
        let statusColor = C.textM, statusText;
        if (isTaken) { statusColor = C.ok; statusText = "принято ✓"; }
        else if (Math.abs(diff) <= 10) { statusColor = C.warn; statusText = "сейчас"; }
        else if (diff > 0) { statusColor = C.oliveDeep; statusText = "через " + human(diff); }
        else { statusColor = C.textL; statusText = "было в " + p.time; }

        let banLine = null;
        if ((r.gapBefore || r.gapAfter) && !isTaken) {
          const bStart = t - (r.gapBefore || 0) * 60;
          const bEnd = t + (r.gapAfter || 0) * 60;
          const inBan = curMins >= bStart && curMins <= bEnd;
          if (inBan) {
            const leftToEnd = bEnd - curMins;
            banLine = { warn: true, text: `🚫 Сейчас нельзя ${r.gapReason || "кофе/чай/молочное"} — ещё ${human(leftToEnd)} (до ${fmt(bEnd)})` };
          } else if (curMins < bStart) {
            banLine = { warn: false, text: `Запрет начнётся в ${fmt(bStart)} — за ${human(r.gapBefore * 60)} до приёма` };
          } else {
            banLine = { warn: false, text: `✅ Окно запрета прошло (было до ${fmt(bEnd)})` };
          }
        }

        return React.createElement("div", { key: p.id, style: { background: C.card, border: `0.5px solid ${isTaken ? C.ok + "44" : C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8, opacity: isTaken ? 0.75 : 1 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, marginBottom: 8 } },
            React.createElement("div", { style: { fontSize: 18, flexShrink: 0 } }, r.emoji),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { style: { fontSize: 13.5, fontWeight: 700, color: C.text } }, r.label),
              React.createElement("div", { style: { fontSize: 11, color: C.textL } }, "в ", p.time)
            ),
            React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: statusColor, flexShrink: 0 } }, statusText)
          ),
          r.can && r.can.length > 0 && React.createElement("div", { style: { display: "flex", gap: 7, marginBottom: 5 } },
            React.createElement("div", { style: { fontSize: 12, flexShrink: 0 } }, "✅"),
            React.createElement("div", { style: { fontSize: 11.5, color: C.text, lineHeight: 1.5 } }, r.can.join(" · "))
          ),
          r.cant && r.cant.length > 0 && React.createElement("div", { style: { display: "flex", gap: 7, marginBottom: banLine || r.extra ? 5 : 0 } },
            React.createElement("div", { style: { fontSize: 12, flexShrink: 0 } }, "🚫"),
            React.createElement("div", { style: { fontSize: 11.5, color: C.text, lineHeight: 1.5 } }, r.cant.join(" · "))
          ),
          banLine && React.createElement("div", { style: { fontSize: 11.5, fontWeight: 600, color: banLine.warn ? C.warn : C.textM, lineHeight: 1.5, marginTop: 2, padding: banLine.warn ? "6px 9px" : 0, background: banLine.warn ? C.warnSoft : "transparent", borderRadius: 8 } }, banLine.text),
          r.extra && React.createElement("div", { style: { fontSize: 10.5, color: C.textL, lineHeight: 1.5, marginTop: 6, paddingTop: 6, borderTop: `0.5px solid ${C.border}` } }, r.extra),
          // Кнопка отметки прямо из гайда
          React.createElement("button", { onClick: () => {
              const next = { ...taken, [p.id]: !taken[p.id] };
              if (p.id === "iron") { if (!taken.iron) next.__ironAt = Date.now(); else delete next.__ironAt; }
              setTaken(next);
            },
            style: { marginTop: 9, width: "100%", padding: "9px", borderRadius: 9, border: `0.5px solid ${isTaken ? C.border : C.olive}`, background: isTaken ? C.bgWarm : C.oliveSoft, color: isTaken ? C.textM : C.oliveDeep, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } },
            isTaken ? "Отменить отметку" : "Принял(а) ✓")
        );
      })
    );
  }

  function ProgressSummary({ packAnchor }) {
    const [curWt] = useLS("nCW", 55);
    const [goalWt] = useLS("nGW", 51.5);
    const startWt = 55;

    // Дни в ритме (streak по таблеткам) — мягко
    let streak = 0;
    try {
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = "pillsTaken_" + d.toLocaleDateString("ru-RU");
        const taken = JSON.parse(localStorage.getItem(key) || "null");
        if (taken && Object.keys(taken).length > 0 && Object.values(taken).some(Boolean)) streak++;
        else if (i > 0) break; // сегодня может быть ещё не отмечено — не рвём
      }
    } catch {}

    // Прогресс веса 0..1 (от старта к цели)
    const wtProg = Math.min(1, Math.max(0, (startWt - Number(curWt)) / Math.max(0.1, startWt - Number(goalWt))));

    // День цикла (вместо ферритина) — релевантно «сегодня»
    let cycleVal = "—", cycleSub = "";
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const overrides = JSON.parse(localStorage.getItem("periodOverridesV1") || "{}");
      const pDay = getPeriodDay(today, packAnchor, overrides);
      if (pDay >= 1) { cycleVal = "День " + pDay; cycleSub = "месячные"; }
      else if (isYarinaActiveToday(today, packAnchor)) { const pk = getPackDay(today, packAnchor); cycleVal = pk + " / 21"; cycleSub = "таблетка пачки"; }
      else { const pk = getPackDay(today, packAnchor); cycleVal = (pk - ACTIVE_PILLS) + " / 7"; cycleSub = "перерыв"; }
    } catch {}

    const Stat = (label, value, sub, prog, accent) => React.createElement("div", {
      style: { flex: 1, background: C.bgWarm, borderRadius: 12, padding: "11px 12px", minWidth: 0 }
    },
      React.createElement("div", { style: { fontSize: 9.5, color: C.textL, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 } }, label),
      React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.1 } }, value),
      sub && React.createElement("div", { style: { fontSize: 10, color: C.textM, marginTop: 2 } }, sub),
      prog !== null && prog !== undefined && React.createElement("div", { style: { height: 4, background: C.border, borderRadius: 3, marginTop: 7, overflow: "hidden" } },
        React.createElement("div", { style: { width: Math.round(prog * 100) + "%", height: "100%", background: accent || C.olive, borderRadius: 3, transition: "width .5s" } })
      )
    );

    return React.createElement("div", {
      style: { display: "flex", gap: 8, marginBottom: 10 }
    },
      Stat("Вес", Number(curWt).toString().replace(".", ",") + " кг", "цель " + Number(goalWt).toString().replace(".", ",") + " кг", wtProg, C.olive),
      Stat("Цикл", cycleVal, cycleSub, null, C.pink),
      Stat("В ритме", streak > 0 ? streak : "—", streak === 1 ? "день" : (streak >= 2 && streak <= 4 ? "дня" : "дней"), null, C.oliveDeep)
    );
  }

  function TodayTab({ todayDow, DR, setTab, workoutDays, cycleAnchor, packAnchor, periodOverrides, badDay, userName }) {
    const [showDiary, setShowDiary] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [showTrackers, setShowTrackers] = useLS("todayShowTrackers", false);
    const [showCalm, setShowCalm] = useState(false);
    const [showWorry, setShowWorry] = useState(false);
    const [moodLog] = useLS("moodDiaryV1", {});

    // Активность дня
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activity = getTodayActivity({
      date: today, cycleAnchor, periodOverrides, workoutDays, badDay
    });
    // Запланированный спорт из планировщика недели
    let plannedSport = [], plannedSportPelvic = null;
    try {
      const wp = (JSON.parse(localStorage.getItem("sportWeekPlanV1") || "{}") || {});
      const x = new Date(today); const dw = x.getDay() === 0 ? 6 : x.getDay() - 1;
      x.setDate(x.getDate() - dw); x.setHours(0, 0, 0, 0);
      const wkk = dayKey(x);
      const wd = wp[wkk];
      const dowIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;
      if (wd) { plannedSport = (wd.acts && wd.acts[dowIdx]) || []; plannedSportPelvic = (wd.pelvic && wd.pelvic[dowIdx]) || null; }
    } catch {}
    const SPORT_LABELS = { gym: "🏋 Зал", run: "🏃 Бег", tennis: "🎾 Теннис", stretch: "🤸 Растяжка" };
    const hasPlanned = plannedSport.length > 0 || plannedSportPelvic;

    // Дневник сегодня — заполнен или нет
    const todayDiaryKey = dayKey(today);
    const diaryDone = !!moodLog[todayDiaryKey];

    // Таблетки сегодня — для AlertsBanner (единый фильтр)
    const todayKey = new Date().toLocaleDateString("ru-RU");
    let activeCount = 0;
    let takenCount = 0;
    try {
      const taken = JSON.parse(localStorage.getItem("pillsTaken_" + todayKey) || "{}");
      const active = activePillsOn(today, packAnchor);
      activeCount = active.length;
      takenCount = active.filter(p => taken[p.id]).length;
    } catch {}

    // Текущий блок плана — null если план ещё не начался или уже закончился
    const currentBlock = (() => {
      for (let i = 0; i < PLAN_BLOCKS.length; i++) {
        const b = PLAN_BLOCKS[i];
        const from = mkd(b.from);
        const to = mkd(b.to); to.setHours(23, 59, 59, 999);
        if (today >= from && today <= to) {
          const dayInBlock = Math.floor((today - from) / 86400000) + 1;
          const blockTotal = Math.floor((to - from) / 86400000) + 1;
          return { ...b, dayInBlock, blockTotal };
        }
      }
      return null;
    })();

    // Курс тазового дна — активен ли
    const pelvicActive = today >= KEY_DATES.pelvicStart && today <= KEY_DATES.pelvicEnd;
    const pelvicStartLabel = today < KEY_DATES.pelvicStart
      ? "с " + KEY_DATES.pelvicStart.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
      : null;

    // До месячных (кровотечение отмены) — считаем от пачки
    const packNumNow = packAnchor ? Math.floor((today - mkd(packAnchor)) / 86400000 / CYCLE_LEN) + 1 : 1;
    let daysToPeriod = 0;
    if (packAnchor) {
      for (let n = packNumNow; n <= packNumNow + 1; n++) {
        const ps = (periodOverrides && periodOverrides[n]) ? mkd(periodOverrides[n]) : getPredictedPeriodStart(n, packAnchor);
        const diff = Math.round((ps - today) / 86400000);
        if (diff >= 0) { daysToPeriod = diff; break; }
      }
    }
    const showPeriodAlert = daysToPeriod >= 1 && daysToPeriod <= 3;

    // Состояние плана — до старта / идёт / после конца
    const beforePlan = today < KEY_DATES.planStart;
    const afterPlan = today > KEY_DATES.planEnd;
    // Точный расчёт дней до старта — оба объекта 00:00 местного времени
    const daysToStart = beforePlan
      ? Math.round((KEY_DATES.planStart - today) / 86400000)
      : 0;

    const activityClickable = ["gym_a", "gym_b", "gym_c", "run"].includes(activity.kind);

    // Есть ли активные текстовые напоминания (для заголовка-разделителя).
    const _dayK = dayKey();
    const _ls = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
    const _now = new Date();
    const analysisOn = _now >= KEY_DATES.trichoBookFrom && _now <= KEY_DATES.trichoVisit && (_ls("trichoBookDismissed") !== "true" || _ls("trichoLabsDismissed") !== "true");
    // Напоминание о фото волос: прошло ≥30 дней с последнего снимка (или их вообще нет, но план уже идёт)
    const hairPhotoReminder = (() => {
      if (beforePlan) return false;
      if (_ls("noteDismissed_hairphoto") === _dayK) return false;
      try {
        const photos = JSON.parse(_ls("hairPhotosV1") || "[]");
        if (!photos.length) {
          // нет фото — мягко предложить начать, но не в первую неделю плана
          const daysIn = Math.floor((_now - KEY_DATES.planStart) / 86400000);
          return daysIn >= 7;
        }
        const latest = photos.reduce((m, p) => (p.date > m ? p.date : m), "0000");
        const last = mkd(latest);
        const days = Math.floor((_now - last) / 86400000);
        return days >= 30;
      } catch { return false; }
    })();
    const hasNotices = showPeriodAlert || badDay || analysisOn || hairPhotoReminder;

    return React.createElement("div", null,
      // Оверлей «Минутка покоя»
      showCalm && React.createElement(CalmTool, { onClose: () => setShowCalm(false) }),
      // Оверлей «Место для тревоги»
      showWorry && React.createElement(WorryBox, { onClose: () => setShowWorry(false) }),

      // Обратный отсчёт до старта плана (если ещё не началось)
      beforePlan && React.createElement("div", {
        style: { background: C.card, border: `1.5px solid ${C.olive}`, borderRadius: 12, padding: "13px 15px",
          marginBottom: 10, position: "relative", overflow: "hidden" }
      },
        React.createElement("div", { style: { position: "absolute", right: -6, top: -4, opacity: 0.18, pointerEvents: "none" } },
          React.createElement(FoxImage, { kind: "main", size: 60 })
        ),
        React.createElement("div", { style: { fontSize: 11, color: C.oliveDeep, fontWeight: 600, position: "relative" } }, "🌱 ДО СТАРТА ПЛАНА"),
        React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: C.text, marginTop: 3, position: "relative" } },
          daysToStart === 0 ? "Сегодня!" : daysToStart === 1 ? "Завтра!" :
            `${daysToStart} ${daysToStart >= 2 && daysToStart <= 4 ? 'дня' : 'дней'}`
        ),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 4, lineHeight: 1.5, position: "relative" } },
          "Приём по плану стартует 30 мая (суббота). Сегодня — привычный режим. К старту подготовь: Форлакс и Zinkorot под рукой, будильник на 8:00, бутылка воды."
        )
      ),

      React.createElement(SectionLabel, null, "Сегодня"),
      !beforePlan && React.createElement(ProgressSummary, { packAnchor }),
      // Напоминания (текст, можно закрывать)
      hasNotices && React.createElement(SectionLabel, null, "Напоминания"),
      // Напоминание сделать фото волос (раз в ~месяц)
      hairPhotoReminder && React.createElement(DismissibleNote, {
        id: "hairphoto", icon: "📸", accent: C.oliveDeep,
        title: "Пора для фото волос",
        text: "Прошёл месяц с последнего снимка. Сделай фото при том же свете — в разделе Здоровье → Волосы. Так виден настоящий прогресс."
      }),
      // Напоминания (анализы, бэкап) — про приём таблеток напоминает полоска статуса в блоке «Таблетки»
      React.createElement(AnalysisReminder, null),
      React.createElement(BackupReminder, { setTab }),

      // Предупреждение о близких месячных
      showPeriodAlert && React.createElement("div", {
        style: { padding: "10px 12px", background: C.bgWarm, borderLeft: `3px solid ${C.pink}66`,
          borderRadius: 10, marginBottom: 8 }
      },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.pink, marginBottom: 2 } },
          "🌸 Скоро месячные — через ", daysToPeriod, " ", daysToPeriod === 1 ? "день" : "дня"
        ),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.5 } },
          "Заранее: тампоны/прокладки, болеутоляющее если нужно. В дни 1-3 — лёгкий день вместо зала."
        )
      ),

      // Bad day режим (активное состояние — не закрывается, но в стиле заметки)
      badDay && React.createElement("div", {
        style: { padding: "10px 12px", background: C.bgWarm, borderLeft: `3px solid ${C.olive}55`,
          borderRadius: 10, marginBottom: 8 }
      },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.oliveDeep } }, "💛 «Плохо себя сегодня» включён"),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2, lineHeight: 1.5 } },
          "Тренировки → лёгкий день. Выключить в Настройках."
        )
      ),

      // Режим дня (компактный таймлайн) — показываем ВСЕГДА, включая до старта плана
      React.createElement(DayScheduleCard, {
        cycleAnchor, periodOverrides, workoutDays, packAnchor,
        onOpen: () => setShowSchedule(true)
      }),
      showSchedule && React.createElement(FullScheduleModal, {
        onClose: () => setShowSchedule(false),
        workoutDays, cycleAnchor, packAnchor, periodOverrides
      }),

      // Активность / тренировка дня — сразу после режима дня
      !beforePlan && React.createElement("div", {
        style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 10,
          cursor: "pointer" },
        onClick: () => setTab("sport")
      },
        hasPlanned
          ? React.createElement("div", { style: { display: "flex", gap: 11, alignItems: "flex-start" } },
              React.createElement("div", { style: { fontSize: 24, flexShrink: 0 } }, "📋"),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 2 } }, "Запланировано на сегодня"),
                React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.5 } },
                  [plannedSport.map(it => { const id = typeof it === "string" ? it : it.id; const t = (typeof it === "object" && (it.time || it.tod)) ? (it.time || ({ morning: "утром", day: "днём", evening: "вечером" })[it.tod]) : ""; return (SPORT_LABELS[id] || id) + (t ? (" " + t) : ""); }).join(", "), plannedSportPelvic ? ("🌸 Таз. дно " + (() => { const pv = typeof plannedSportPelvic === "string" ? { tod: plannedSportPelvic } : plannedSportPelvic; return pv.time || (pv.tod === "morning" ? "утром" : "вечером"); })()) : ""].filter(Boolean).join(" · ")),
                React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 4, lineHeight: 1.5 } }, "Изменить — в разделе Спорт → План недели")
              ),
              React.createElement("div", { style: { fontSize: 14, color: C.textL, flexShrink: 0, alignSelf: "center" } }, "→")
            )
          : React.createElement("div", { style: { display: "flex", gap: 11, alignItems: "flex-start" } },
              React.createElement("div", { style: { fontSize: 24, flexShrink: 0 } }, activity.icon),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 2 } }, "Активность сегодня"),
                React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: C.text } }, activity.label),
                React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 4, lineHeight: 1.5 } }, activity.hint)
              ),
              activityClickable && React.createElement("div", { style: { fontSize: 14, color: C.textL, flexShrink: 0, alignSelf: "center" } }, "→")
            )
      ),

      // Таблетки (compact)
      React.createElement(PillsModule, { compact: true, cycleAnchor, packAnchor }),

      // Трекеры — свёрнуты по умолчанию, но с кратким превью значений
      (() => {
        const _dk = dayKey();
        let prot = 0, water = 0, sleepH = 0, steps = 0, pGoal = 90;
        try { prot = ((JSON.parse(localStorage.getItem("proteinLogV1") || "{}") || {}))[_dk] || 0; } catch {}
        try { pGoal = JSON.parse(localStorage.getItem("proteinGoal") || "90"); } catch {}
        try { water = JSON.parse(localStorage.getItem("water_" + new Date().toDateString()) || "0"); } catch {}
        try { const sl = (JSON.parse(localStorage.getItem("sleepLog") || "{}") || {})[new Date().toLocaleDateString("ru-RU")]; sleepH = sl ? sl.h : 0; } catch {}
        try { steps = ((JSON.parse(localStorage.getItem("stepsLogV1") || "{}") || {}))[_dk] || 0; } catch {}
        const fmtSteps = steps >= 1000 ? (steps / 1000).toFixed(steps >= 10000 ? 0 : 1).replace(".", ",") + "k" : String(steps);
        const bits = [
          "белок " + Math.round(prot) + "/" + pGoal + "г",
          "вода " + water + "/8",
          "сон " + (sleepH ? (String(sleepH).replace(".", ",") + "ч") : "—"),
          "шаги " + (steps ? fmtSteps : "—"),
        ];
        return React.createElement("button", {
          onClick: () => setShowTrackers(!showTrackers),
          "aria-expanded": showTrackers,
          style: { width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12,
            background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px",
            marginBottom: 10, cursor: "pointer", fontFamily: "inherit" }
        },
          React.createElement("div", { style: { width: 34, height: 34, borderRadius: "50%", background: C.oliveSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 } }, "📊"),
          React.createElement("div", { style: { flex: 1, minWidth: 0 } },
            React.createElement("div", { style: { fontSize: 13.5, fontWeight: 600, color: C.text } }, "Мой день"),
            React.createElement("div", { style: { fontSize: 11.5, color: C.textM, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, (diaryDone ? "✓ состояние · " : "") + bits.join("  ·  "))
          ),
          React.createElement("div", { "aria-hidden": "true", style: { fontSize: 11, color: C.oliveDeep, flexShrink: 0 } }, showTrackers ? "скрыть" : "открыть")
        );
      })(),
      showTrackers && React.createElement("div", { className: "ux-enter" },
        React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: C.textL, letterSpacing: 0.3, margin: "0 2px 8px", textTransform: "uppercase" } }, "Показатели"),
        // Трекер белка
        React.createElement(ProteinTracker, null),
        // Трекер воды
        React.createElement(WaterTracker, null),
        // Трекер сна
        React.createElement(SleepTracker, null),
        // Трекер шагов
        React.createElement(StepsTracker, null),

      // Разделитель: самочувствие
      React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: C.textL, letterSpacing: 0.3, margin: "4px 2px 8px", textTransform: "uppercase" } }, "Самочувствие"),
      // Дневник состояния — всегда открыт, автосохранение, единый стиль
      React.createElement(MoodDiary, { inline: true })
      ),

      // ——— Спокойствие: две тапабельные строки в одной карточке, единый цвет ———
      React.createElement(SectionLabel, null, "Спокойствие"),
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 14, marginBottom: 10, overflow: "hidden" } },
        React.createElement("button", { onClick: () => setShowCalm(true),
          style: { width: "100%", display: "flex", alignItems: "center", gap: 11, background: "none",
            border: "none", padding: "12px 14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }
        },
          React.createElement("div", { style: { fontSize: 20, flexShrink: 0 } }, "🫧"),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.oliveDeep } }, "Тревожно или напряжённо?"),
            React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 1 } }, "Минутка покоя: дыхание и заземление")
          ),
          React.createElement("div", { "aria-hidden": "true", style: { fontSize: 14, color: C.olive } }, "›")
        ),
        React.createElement("div", { style: { height: "0.5px", background: `${C.olive}26`, margin: "0 14px" } }),
        React.createElement("button", { onClick: () => setShowWorry(true),
          style: { width: "100%", display: "flex", alignItems: "center", gap: 11, background: "none",
            border: "none", padding: "12px 14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }
        },
          React.createElement("div", { style: { fontSize: 20, flexShrink: 0 } }, "📝"),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.oliveDeep } }, "Место для тревоги"),
            React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 1 } }, "Записать мысль и отложить до вечера")
          ),
          React.createElement("div", { "aria-hidden": "true", style: { fontSize: 14, color: C.olive } }, "›")
        )
      ),
      // Курс таз. дна — мини-карточка если активен
      pelvicActive && React.createElement("div", {
        onClick: () => setTab("sport"),
        style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "10px 13px",
          marginBottom: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }
      },
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text } }, "🌸 Курс таз. дна сегодня"),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } }, "30 минут · отметить в Спорте")
        ),
        React.createElement("div", { style: { fontSize: 14, color: C.textL } }, "→")
      )
    );
  }

  // ===========================================================================
  // CompatibilityMatrix — таблица совместимости препаратов и веществ.
  // Группирована по препаратам, для каждого — что можно (✓) и что нельзя (✕ с интервалом).
  // ===========================================================================
  function CompatibilityMatrix() {
    const sections = [
      {
        name: "Железо · Gentle Iron",
        color: "#7A4A1A",
        bg: C.barkSoft,
        items: [
          { with: "Витамин C", ok: true, note: "вместе — усиливает усвоение" },
          { with: "Перфектил", ok: false, note: "разрыв 2 ч (цинк в составе)" },
          { with: "Цинк", ok: false, note: "разрыв 2 ч" },
          { with: "Кофе / чай", ok: false, note: "разрыв 1 ч (танины блокируют)" },
          { with: "Молочное", ok: false, note: "разрыв 2 ч (кальций блокирует)" },
          { with: "Дуксет / Ярина", ok: true, note: "можно вместе" },
        ]
      },
      {
        name: "Перфектил",
        color: "#3B6D11",
        bg: C.sandSoft,
        items: [
          { with: "С едой", ok: true, note: "обязательно, иначе тошнота" },
          { with: "Витамин A / E", ok: false, note: "уже в составе — перегруз опасен" },
          { with: "Натощак", ok: false, note: "тошнота, раздражение ЖКТ" },
        ]
      },
      {
        name: "Ярина",
        color: "#534AB7",
        bg: "#EEEDFE",
        items: [
          { with: "Рифампицин, противосудорожные, зверобой", ok: false, note: "индукторы ферментов — снижают защиту" },
          { with: "Обычные антибиотики", ok: true, note: "амоксициллин и пр. НЕ снижают (миф)" },
          { with: "Сильная диарея/рвота", ok: false, note: "всасывание падает — доп. защита" },
          { with: "Калий (диуретики/НПВП/АПФ)", ok: false, note: "дроспиренон задерживает калий — к врачу" },
          { with: "Грейпфрут, алкоголь умеренно", ok: true, note: "влияние незначительное" },
        ]
      },
      {
        name: "Витамин D",
        color: "#BA7517",
        bg: C.oliveSoft,
        items: [
          { with: "С жирной едой", ok: true, note: "усваивается с жиром" },
          { with: "Каждый день", ok: false, note: "только пн/ср/сб (3× в неделю)" },
        ]
      },
      {
        name: "Цинк",
        color: "#7A4A1A",
        bg: C.barkSoft,
        items: [
          { with: "С ужином", ok: true, note: "лучше с едой — без тошноты" },
          { with: "Железо", ok: false, note: "разрыв минимум 2 ч" },
        ]
      },
      {
        name: "A+E Medana",
        color: "#7A4A1A",
        bg: C.barkSoft,
        items: [
          { with: "С жирной едой", ok: true, note: "жирорастворимые — нужна еда с жирами" },
          { with: "Витамин C / селен", ok: false, note: "лучше разнести по времени" },
          { with: "Омега + Ярина", ok: true, note: "можно, но всё вместе слегка разжижает кровь" },
          { with: "Перфектил", ok: false, note: "A/E уже есть в составе — не дублировать впритык" },
        ]
      },
      {
        name: "Форлакс (макрогол)",
        color: "#6E7C3F",
        bg: C.oliveSoft,
        items: [
          { with: "Отдельно от таблеток", ok: false, note: "разрыв ±2 ч — ускоряет транзит, может снижать всасывание других" },
          { with: "Достаточно воды", ok: true, note: "без жидкости не работает" },
          { with: "Длительный приём", ok: true, note: "безопасен, не вызывает зависимости (под контролем врача)" },
        ]
      },
      {
        name: "Дуксет (дулоксетин)",
        color: "#C68A3E",
        bg: C.sandSoft,
        items: [
          { with: "В одно и то же время", ok: true, note: "не пропускать; резкая отмена даёт синдром отмены" },
          { with: "Омега + вит E + Ярина", ok: false, note: "сам слегка повышает кровоточивость — сумма заметнее; сказать врачу перед операцией/стоматологией" },
          { with: "Зверобой, триптаны, трамадол", ok: false, note: "серотониновый риск — обсудить с врачом" },
        ]
      },
      {
        name: "Цистениум / Кристалваг / Лактриол",
        color: "#534AB7",
        bg: "#EEEDFE",
        items: [
          { with: "На ночь, с водой", ok: true, note: "совместимы со всем основным" },
          { with: "Кристалваг 2 капс → 1 капс", ok: true, note: "10 дней по 2, затем по 1 до конца курса" },
          { with: "Лактриол через день", ok: true, note: "с 13 июня, длительно" },
        ]
      },
    ];

    return React.createElement(CompatMatrixView, { sections });
  }

  function CompatMatrixView({ sections }) {
    const [openIdx, setOpenIdx] = useState(0); // первый раздел (железо) открыт по умолчанию

    return React.createElement("div", null,
      // Главное правило — наглядно, с чипами
      React.createElement("div", { style: { background: C.warnSoft, border: `0.5px solid ${C.warn}66`, borderRadius: 12, padding: "13px 14px", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.warn, marginBottom: 8 } }, "⚠ Самое важное про железо"),
        React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.55, marginBottom: 9 } }, "Железо держи отдельно (разрыв ~2 часа) от:"),
        React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } },
          ["Перфектил", "Цинк", "Кофе / чай", "Молочное"].map((t, i) => React.createElement("span", { key: i, style: { fontSize: 11.5, fontWeight: 600, color: C.warn, background: "#fff", border: `0.5px solid ${C.warn}55`, borderRadius: 999, padding: "5px 11px" } }, "✕ ", t))),
        React.createElement("div", { style: { fontSize: 11.5, color: C.text, lineHeight: 1.55, marginTop: 10 } },
          React.createElement("span", { style: { color: C.ok, fontWeight: 700 } }, "✓ Можно вместе: "), "витамин C (усиливает усвоение), Дуксет, Ярина.")
      ),

      // Подсказка
      React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 10, lineHeight: 1.5 } }, "Нажми на препарат, чтобы посмотреть, с чем он сочетается:"),

      // Аккордеон по препаратам
      sections.map((s, si) => {
        const isOpen = openIdx === si;
        const okCount = s.items.filter(it => it.ok).length;
        const noCount = s.items.length - okCount;
        return React.createElement("div", { key: si, style: { marginBottom: 8, borderRadius: 12, overflow: "hidden", border: `0.5px solid ${isOpen ? s.color + "66" : C.border}` } },
          React.createElement("button", {
            onClick: () => setOpenIdx(isOpen ? -1 : si),
            style: { width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
              background: isOpen ? s.bg : C.card, border: "none", padding: "12px 14px", cursor: "pointer", fontFamily: "inherit" }
          },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, minWidth: 0 } },
              React.createElement("div", { style: { width: 9, height: 9, borderRadius: "50%", background: s.color, flexShrink: 0 } }),
              React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, s.name)
            ),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 } },
              React.createElement("span", { style: { fontSize: 10.5, color: C.textL } }, "✓", okCount, " · ✕", noCount),
              React.createElement("span", { style: { fontSize: 11, color: C.textL } }, isOpen ? "▲" : "▼")
            )
          ),
          isOpen && React.createElement("div", { style: { background: C.card } },
            s.items.map((item, ii) => React.createElement("div", {
              key: ii,
              style: { display: "flex", alignItems: "flex-start", padding: "10px 14px", gap: 10,
                borderTop: `0.5px solid ${C.border}` }
            },
              React.createElement("div", { style: {
                fontSize: 11, fontWeight: 700, color: item.ok ? C.ok : C.warn, flexShrink: 0,
                padding: "3px 8px", borderRadius: 6, background: (item.ok ? C.ok : C.warn) + "18", minWidth: 58, textAlign: "center"
              } }, item.ok ? "Можно" : "Разнести"),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 12.5, color: C.text, fontWeight: 500 } }, item.with),
                React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2, lineHeight: 1.45 } }, item.note)
              )
            ))
          )
        );
      }),

      // Универсальная плашка снизу
      React.createElement("div", { style: { background: C.infoSoft, borderRadius: 9, padding: "10px 13px", border: `0.5px solid ${C.info}33`, margin: "12px 0" } },
        React.createElement("div", { style: { fontSize: 11.5, color: C.info, lineHeight: 1.6 } }, "💡 Омега, Лактриол, Ниацинамид, Мелатонин — совместимы со всем основным, можно в любое время.")
      ),

      // Ярина — спокойно, подробности под раскрытием
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.olive}33`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.oliveDeep, marginBottom: 5 } }, "🦊 Ярина и твои волосы"),
        React.createElement("div", { style: { fontSize: 11.5, color: C.text, lineHeight: 1.6, marginBottom: 8 } },
          "Дроспиренон снижает действие андрогенов — тех самых гормонов, что при СПКЯ влияют на выпадение. Вместе с восстановлением железа Ярина работает на твои волосы. Тромбозы на КОК — редкость; сигналы можно спокойно прочитать ниже, без тревоги."),
        React.createElement("details", null,
          React.createElement("summary", { style: { fontSize: 11.5, color: C.warn, cursor: "pointer", fontWeight: 600 } }, "Когда срочно к врачу (раскрыть)"),
          React.createElement("div", { style: { fontSize: 11.5, color: C.text, lineHeight: 1.6, marginTop: 6 } },
            "Резкая боль или отёк в одной голени, внезапная одышка, боль в груди, резкая сильная головная боль или нарушение зрения. Перед операцией или долгим перелётом — предупреди врача. Курение усиливает риск.")
        )
      ),

      // Дисклеймер
      React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.55, padding: "10px 12px", background: C.bgWarm, borderRadius: 9 } },
        "Справочная информация, не замена консультации врача. Дозы и сочетания подтверждай со своими врачами и фармацевтом."
      )
    );
  }

  // ===========================================================================
  // NormalFAQ — раздел «Это нормально». FAQ для тревожных моментов.
  // ===========================================================================
  function NormalFAQ() {
    const [open, setOpen] = useState(null);
    const items = [
      {
        q: "Чёрный стул от железа",
        a: "Это нормально, а не кровь. Препараты железа меняют цвет стула — он может стать тёмным, почти чёрным. Алая кровь — это другое, к врачу. Темнота — норма."
      },
      {
        q: "Не вижу результата по волосам через месяц",
        a: "Это нормально. Видимые изменения начинаются через 1.5–2 месяца. Первая цель плана — остановить выпадение, а не отрастить. Не считай волосы каждый день — это усиливает тревожную фиксацию."
      },
      {
        q: "Курс тазового дна сначала неудобный",
        a: "Это нормально. Гипертонусной мышце сложно расслабиться — это и есть проблема. Если боль усилилась — снизь интенсивность до 4–5 раз в неделю, и фокус на расслаблении, не на усилии."
      },
      {
        q: "Тошнота от Перфектила",
        a: "Чаще всего — потому что принят натощак или с лёгким перекусом. Перфектил нужно с полноценной едой (полный обед). Если тошнит даже с едой — поговори с терапевтом."
      },
      {
        q: "Запор не уходит сразу после Форлакса",
        a: "Это нормально. Форлакс работает мягко через сутки. Если стул стал реже 1 раза в 3 дня после старта — обсудить дозу. Если началась кровь — к проктологу."
      },
      {
        q: "Прибавка веса на Ярине",
        a: "В первые 2-3 месяца возможна задержка воды — это не жир. Через 3 месяца обычно стабилизируется. Если прибавка более 3 кг и держится — обсудить с гинекологом."
      },
      {
        q: "Усталость после старта железа",
        a: "Часто наоборот — энергия растёт. Но если есть тошнота, тяжесть в желудке — попробуй принимать перед сном вместо вечера. Или с большим количеством воды."
      },
      {
        q: "Тревога утром после Дуксета",
        a: "Иногда бывает в первые недели. Если держится дольше 2-3 недель — обсуди с психотерапевтом дозу или время приёма."
      },
      {
        q: "Слабость в первые недели тренировок (с 15 июня)",
        a: "Ферритин ещё восстанавливается, тело адаптируется к Дуксету и Перфектилу. Бери минимальные веса, верхняя граница повторов. Через 2-3 недели станет легче."
      },
    ];

    return React.createElement("div", null,
      // Шапка с грибочками
      React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", marginBottom: 14, padding: "11px 13px", background: C.sandSoft, borderRadius: 10, border: `0.5px solid ${C.sand}33` } },
        React.createElement(FoxImage, { kind: "mushrooms", size: 50, opacity: 0.9 }),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.sandDeep, marginBottom: 3 } }, "Это нормально"),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.5 } }, "Частые тревожные моменты и почему они не должны пугать.")
        )
      ),

      items.map((it, i) => React.createElement("div", {
        key: i,
        style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, marginBottom: 6, overflow: "hidden" }
      },
        React.createElement("button", {
          onClick: () => setOpen(open === i ? null : i),
          style: { width: "100%", padding: "12px 13px", background: "none", border: "none", cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit", textAlign: "left", gap: 10 }
        },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: C.text, flex: 1 } }, it.q),
          React.createElement("div", { style: { fontSize: 14, color: C.textL, flexShrink: 0 } }, open === i ? "▲" : "▼")
        ),
        open === i && React.createElement("div", { style: { padding: "0 13px 13px", fontSize: 12, color: C.textM, lineHeight: 1.6 } }, it.a)
      ))
    );
  }

  // ===========================================================================
  // TrendsTab — графики из дневника состояния
  // ===========================================================================
  function TrendsTab() {
    const [log] = useLS("moodDiaryV1", {});
    const [range, setRange] = useState(30);

    // Собираем последние N дней
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entries = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      entries.push({ date: d, key, data: log[key] || null });
    }
    const filled = entries.filter(e => e.data && e.data.mood > 0);

    // Показываем пустое состояние только если совсем нет данных (ни настроения, ни еды/шагов/белка)
    let _anyOther = false;
    try {
      const ss = (JSON.parse(localStorage.getItem("stepsLogV1") || "{}") || {});
      const ps = (JSON.parse(localStorage.getItem("proteinLogV1") || "{}") || {});
      const fs = (JSON.parse(localStorage.getItem("foodDiaryV1") || "{}") || {});
      const cntS = entries.filter(e => ss[e.key] > 0).length;
      const cntP = entries.filter(e => ps[e.key] > 0).length;
      const cntF = entries.filter(e => (fs[e.date.toLocaleDateString("ru-RU")] || []).length > 0).length;
      _anyOther = cntS >= 3 || cntP >= 3 || cntF >= 3;
    } catch {}
    if (filled.length < 3 && !_anyOther) {
      return React.createElement("div", { style: { padding: "20px 16px", textAlign: "center" } },
        React.createElement(FoxImage, { kind: "path", size: 280, style: { margin: "0 auto 18px", borderRadius: 12 } }),
        React.createElement("div", { style: { fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 } }, "Лиса только встала на тропу"),
        React.createElement("div", { style: { fontSize: 12, color: C.textM, lineHeight: 1.6, maxWidth: 280, margin: "0 auto" } },
          "Графики появятся, когда наберётся несколько дней данных — дневник состояния, еда, шаги. Сейчас заполнено дней состояния: ", filled.length, "."
        )
      );
    }

    // Простая SVG-линия для тренда
    const LineChart = ({ values, color, max = 5, height = 56 }) => {
      const width = 260;
      const step = width / Math.max(1, values.length - 1);
      const points = values.map((v, i) => `${i * step},${height - (v / max) * (height - 8) - 4}`).join(" ");
      const lastY = height - (values[values.length - 1] / max) * (height - 8) - 4;
      const lastX = (values.length - 1) * step;
      return React.createElement("svg", { width: "100%", height, viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: "none" },
        React.createElement("polyline", { points, fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement("circle", { cx: lastX, cy: lastY, r: 3, fill: color })
      );
    };

    const moods = filled.map(e => e.data.mood);
    const energies = filled.map(e => e.data.energy || 0);
    // Сон берём из единого источника sleepLog (ключи в формате ru-RU)
    let sleepStore = {};
    try { sleepStore = (JSON.parse(localStorage.getItem("sleepLog") || "{}") || {}); } catch {}
    const sleeps = filled.map(e => {
      const ruKey = e.date.toLocaleDateString("ru-RU");
      const s = sleepStore[ruKey];
      return (s && s.h) || e.data.sleepH || 0;
    });

    const avgSleep = sleeps.length ? (sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1) : "—";
    const moodTrend = moods.length >= 2 ? (moods[moods.length - 1] - moods[0]) : 0;
    const trendLabel = moodTrend > 0.5 ? "↑ растёт" : moodTrend < -0.5 ? "↓ снижается" : "стабильно";
    const trendColor = moodTrend > 0.5 ? C.ok : moodTrend < -0.5 ? C.warn : C.textM;

    // ЖКТ — bar chart по неделям (упрощённо)
    const gutCounts = { soft: 0, norm: 0, hard: 0, blood: 0, skip: 0 };
    filled.forEach(e => { if (e.data.gut && gutCounts[e.data.gut] !== undefined) gutCounts[e.data.gut]++; });

    // ── Сводка за период, регулярность, наблюдения ──
    let _ss = {}, _ps = {}, _fs = {}, _gf = {};
    try { _ss = (JSON.parse(localStorage.getItem("stepsLogV1") || "{}") || {}); } catch {}
    try { _ps = (JSON.parse(localStorage.getItem("proteinLogV1") || "{}") || {}); } catch {}
    try { _fs = (JSON.parse(localStorage.getItem("foodDiaryV1") || "{}") || {}); } catch {}
    try { _gf = (JSON.parse(localStorage.getItem("gutFoodDaysV1") || "{}") || {}); } catch {}
    const avgPos = (arr) => { const f = arr.filter(v => v > 0); return f.length ? Math.round(f.reduce((a, b) => a + b, 0) / f.length) : 0; };
    const stepsAll = entries.map(e => _ss[e.key] || 0);
    const protAll = entries.map(e => _ps[e.key] || 0);
    const diaryDays = entries.filter(e => (_fs[e.date.toLocaleDateString("ru-RU")] || []).length > 0).length;
    const gutFoodDays = entries.filter(e => _gf[e.date.toLocaleDateString("ru-RU")]).length;
    const moodDaysCount = filled.length;
    let stateStreak = 0;
    for (let i = entries.length - 1; i >= 0; i--) { if (log[entries[i].key] && log[entries[i].key].mood > 0) stateStreak++; else break; }
    let corrNote = null;
    if (filled.length >= 5) {
      const active = [], lazy = [];
      filled.forEach(e => { const st = _ss[e.key] || 0; (st >= 4000 ? active : lazy).push(e.data.mood); });
      if (active.length >= 2 && lazy.length >= 2) {
        const am = active.reduce((a, b) => a + b, 0) / active.length, lm = lazy.reduce((a, b) => a + b, 0) / lazy.length;
        if (am - lm >= 0.4) corrNote = "В дни с активностью (4000+ шагов) настроение в среднем выше. Это наблюдение по твоим данным, не правило.";
      }
    }
    const summaryBits = [];
    const _sl = sleeps.filter(v => v > 0); if (_sl.length) summaryBits.push("😴 сон ~" + (_sl.reduce((a, b) => a + b, 0) / _sl.length).toFixed(1) + " ч");
    if (avgPos(stepsAll)) summaryBits.push("👣 шаги ~" + avgPos(stepsAll));
    if (avgPos(protAll)) summaryBits.push("💪 белок ~" + avgPos(protAll) + " г");
    if (moodDaysCount) summaryBits.push("😊 состояние: " + moodDaysCount + " дн");
    if (diaryDays) summaryBits.push("🍽 еда: " + diaryDays + " дн");
    if (gutFoodDays) summaryBits.push("🌿 для ЖКТ: " + gutFoodDays + " дн");

    // Ферритин — динамика числом (старт → текущий)
    let fStart = 0, fCur = 0;
    try { fStart = Number(JSON.parse(localStorage.getItem("startFerritin") || "0")) || 0; } catch {}
    try { fCur = Number(JSON.parse(localStorage.getItem("currentFerritin") || "0")) || 0; } catch {}
    const fDelta = (fStart && fCur) ? (fCur - fStart) : null;

    // Заметки к дню (из дневника состояния) — последние, чтобы помнить контекст
    const dayNotes = entries
      .map(e => ({ date: e.date, note: (log[e.key] && log[e.key].note) ? String(log[e.key].note).trim() : "" }))
      .filter(x => x.note)
      .slice(-8).reverse();

    return React.createElement("div", null,
      // Range switcher
      React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 12 } },
        [7, 30, 90].map(r => React.createElement("button", {
          key: r, onClick: () => setRange(r),
          style: { flex: 1, padding: "7px 0", borderRadius: 7, border: `0.5px solid ${range === r ? C.olive : C.border}`,
            background: range === r ? C.olive : C.card, fontSize: 12, fontWeight: 600,
            color: range === r ? "#fff" : C.textM, cursor: "pointer", fontFamily: "inherit" }
        }, r, " дн"))
      ),

      // Сводка за период
      summaryBits.length > 0 && React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 11, padding: "12px 14px", marginBottom: 10 } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.oliveDeep, marginBottom: 7 } }, "📋 Сводка за ", range, " дн"),
        React.createElement("div", { style: { fontSize: 11.5, color: C.text, lineHeight: 1.7 } }, summaryBits.join("  ·  ")),
        stateStreak >= 2 && React.createElement("div", { style: { fontSize: 11, color: C.oliveDeep, marginTop: 6 } }, "🔥 дневник состояния ", stateStreak, " ", stateStreak < 5 ? "дня" : "дней", " подряд"),
        corrNote && React.createElement("div", { style: { fontSize: 10.5, color: C.textM, marginTop: 7, lineHeight: 1.5, paddingTop: 7, borderTop: `0.5px solid ${C.olive}22` } }, "💡 ", corrNote)
      ),

      // Ферритин — динамика числом
      (fStart || fCur) && React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 11, padding: "12px 14px", marginBottom: 10 } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 7 } }, "🩸 Ферритин (запас железа)"),
        React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 8 } },
          React.createElement("span", { style: { fontSize: 13, color: C.textM } }, "старт ", fStart || "—"),
          React.createElement("span", { style: { fontSize: 13, color: C.textL } }, "→"),
          React.createElement("span", { style: { fontSize: 22, fontWeight: 700, color: C.text } }, fCur || "—"),
          fDelta != null && React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: fDelta > 0 ? C.ok : (fDelta < 0 ? C.warn : C.textM) } }, fDelta > 0 ? "▲ +" + fDelta : (fDelta < 0 ? "▼ " + fDelta : "= 0"))
        ),
        React.createElement("div", { style: { fontSize: 10.5, color: C.textL, marginTop: 6, lineHeight: 1.5 } }, "Цель — рост к 40+. Обновляй «текущий» в Настройки → Профиль после анализов."),
        fCur && fCur >= 40 && React.createElement("div", { style: { fontSize: 11, color: C.ok, marginTop: 4, fontWeight: 600 } }, "🎉 Ферритин в целевой зоне!")
      ),

      // === МАРКЕР_СТАРЫХ_ГРАФИКОВ ===
      filled.length >= 3 && React.createElement("div", { style: { background: C.card, borderRadius: 10, padding: "12px 13px", marginBottom: 9, border: `0.5px solid ${C.border}` } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text } }, "😊 Настроение"),
          React.createElement("div", { style: { fontSize: 11, color: trendColor, fontWeight: 600 } }, trendLabel)
        ),
        LineChart({ values: moods, color: C.olive })
      ),

      // Energy
      filled.length >= 3 && React.createElement("div", { style: { background: C.card, borderRadius: 10, padding: "12px 13px", marginBottom: 9, border: `0.5px solid ${C.border}` } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 10 } }, "⚡ Энергия"),
        LineChart({ values: energies, color: C.sand })
      ),

      // Sleep
      filled.length >= 3 && React.createElement("div", { style: { background: C.card, borderRadius: 10, padding: "12px 13px", marginBottom: 9, border: `0.5px solid ${C.border}` } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text } }, "😴 Сон, ч"),
          React.createElement("div", { style: { fontSize: 11, color: C.textM } }, "сред. ", avgSleep, " ч")
        ),
        LineChart({ values: sleeps, color: "#534AB7", max: 9 })
      ),

      // Gut
      filled.length >= 3 && React.createElement("div", { style: { background: C.card, borderRadius: 10, padding: "12px 13px", border: `0.5px solid ${C.border}`, marginBottom: 9 } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 10 } }, "💧 ЖКТ — распределение"),
        React.createElement("div", { style: { display: "flex", gap: 4, height: 30, alignItems: "flex-end" } },
          [
            { l: "Кровь", v: gutCounts.blood, c: C.warn },
            { l: "Твёрдый", v: gutCounts.hard, c: C.olive },
            { l: "Мягкий", v: gutCounts.soft, c: C.ok },
            { l: "Норма", v: gutCounts.norm, c: C.ok },
            { l: "—", v: gutCounts.skip, c: C.textL },
          ].map((g, i) => React.createElement("div", { key: i, style: { flex: 1, textAlign: "center" } },
            React.createElement("div", {
              style: { height: 20 + g.v * 4, background: g.c, borderRadius: 4, marginBottom: 4 }
            }),
            React.createElement("div", { style: { fontSize: 9, color: C.textL } }, g.l, " (", g.v, ")")
          ))
        )
      ),

      // ── Здоровье-специфичные тренды: выпадение волос, ЖКТ, обострения ──
      (function () {
        let shedStore = {}, flaresStore = {};
        try { shedStore = (JSON.parse(localStorage.getItem("hairShedV1") || "{}") || {}); } catch {}
        try { flaresStore = (JSON.parse(localStorage.getItem("flaresV1") || "[]") || []); } catch {}

        // Выпадение волос по неделям (less/same/more)
        const shedEntries = Object.entries(shedStore).sort((a, b) => a[0].localeCompare(b[0])).slice(-8);
        const shedMap = { less: { l: "Меньше", v: 1, c: C.ok }, same: { l: "Так же", v: 2, c: C.sand }, more: { l: "Больше", v: 3, c: C.warn } };

        // Обострения за период
        const periodStart = entries.length ? entries[0].date : today;
        const flaresInRange = (Array.isArray(flaresStore) ? flaresStore : []).filter(f => {
          try { return mkd(f.date) >= periodStart; } catch { return false; }
        });

        return React.createElement(React.Fragment, null,
          // Выпадение волос — главная цель
          shedEntries.length >= 2 && React.createElement("div", { style: { background: C.card, borderRadius: 10, padding: "12px 13px", marginBottom: 9, border: `0.5px solid ${C.border}` } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4 } }, "💇‍♀️ Выпадение волос (по неделям)"),
            React.createElement("div", { style: { fontSize: 10, color: C.textL, marginBottom: 10, lineHeight: 1.4 } }, "Твоя главная цель. Меньше — это прогресс."),
            React.createElement("div", { style: { display: "flex", gap: 4, alignItems: "flex-end", height: 50 } },
              shedEntries.map((e, i) => {
                const m = shedMap[e[1]] || shedMap.same;
                return React.createElement("div", { key: i, style: { flex: 1, textAlign: "center" } },
                  React.createElement("div", { style: { height: m.v * 14, background: m.c, borderRadius: 4, marginBottom: 3 } }),
                  React.createElement("div", { style: { fontSize: 8.5, color: C.textL } }, m.l));
              })
            )
          ),
          // ЖКТ распределение
          gutCounts && (gutCounts.norm + gutCounts.soft + gutCounts.hard + gutCounts.blood) > 0 && React.createElement("div", { style: { background: C.card, borderRadius: 10, padding: "12px 13px", marginBottom: 9, border: `0.5px solid ${C.border}` } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 10 } }, "💧 ЖКТ за период"),
            React.createElement("div", { style: { display: "flex", gap: 4, height: 30, alignItems: "flex-end" } },
              [{ l: "Норма", v: gutCounts.norm, c: C.ok }, { l: "Мягкий", v: gutCounts.soft, c: C.olive }, { l: "Твёрдый", v: gutCounts.hard, c: C.sand }, { l: "Кровь", v: gutCounts.blood, c: C.warn }].map((g, i) =>
                React.createElement("div", { key: i, style: { flex: 1, textAlign: "center" } },
                  React.createElement("div", { style: { height: 8 + g.v * 5, background: g.c, borderRadius: 4, marginBottom: 4 } }),
                  React.createElement("div", { style: { fontSize: 9, color: C.textL } }, g.l, " (", g.v, ")")))
            )
          ),
          // Обострения
          React.createElement("div", { style: { background: C.card, borderRadius: 10, padding: "12px 13px", marginBottom: 9, border: `0.5px solid ${C.border}` } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4 } }, "🩹 Обострения за период"),
            React.createElement("div", { style: { fontSize: 13, color: C.text } }, flaresInRange.length === 0 ? "Ни одного — это хорошо 🌿" : (flaresInRange.length + (flaresInRange.length === 1 ? " запись" : " записей"))),
            React.createElement("div", { style: { fontSize: 10.5, color: C.textL, marginTop: 4, lineHeight: 1.4 } }, "Отмечать можно в Здоровье → Обострения.")
          )
        );
      })(),

      // Заметки к дню
      dayNotes.length > 0 && React.createElement("div", { style: { background: C.card, borderRadius: 10, padding: "12px 13px", marginTop: 9, border: `0.5px solid ${C.border}` } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 } }, "📝 Заметки к дням"),
        dayNotes.map((n, i) => React.createElement("div", { key: i, style: { fontSize: 11, color: C.textM, lineHeight: 1.5, marginBottom: 6, paddingBottom: 6, borderBottom: i < dayNotes.length - 1 ? `0.5px solid ${C.border}` : "none" } },
          React.createElement("span", { style: { fontWeight: 600, color: C.text } }, n.date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }), ": "),
          n.note))
      )
    );
  }

  // ===========================================================================
  // OnboardingScreen — первый запуск, спросить дату начала пачки и ферритин.
  // ===========================================================================
  function OnboardingScreen({ onDone }) {
    const [name, setName] = useState("Маша");
    const [packAnchorVal, setPackAnchorVal] = useState(defaultPackAnchor());
    const [ferritin, setFerritin] = useState("");
    const [step, setStep] = useState(0);

    const save = () => {
      try {
        localStorage.setItem("userName", JSON.stringify(name.trim() || "Маша"));
        localStorage.setItem("packAnchorV2", JSON.stringify(packAnchorVal));
        // cycleAnchor больше не запрашиваем отдельно — на Ярине он = якорю пачки.
        localStorage.setItem("cycleAnchorV2", JSON.stringify(packAnchorVal));
        if (ferritin) localStorage.setItem("startFerritin", JSON.stringify(Number(ferritin)));
        localStorage.setItem("onboardingDone", "true");
      } catch {}
      onDone();
    };

    const wrap = (children) => React.createElement("div", {
      style: { position: "fixed", inset: 0, background: C.bg, zIndex: 1000, padding: "32px 20px", overflow: "auto", boxSizing: "border-box" }
    },
      React.createElement("div", { style: { maxWidth: 380, margin: "0 auto" } }, children)
    );

    const dateInputStyle = {
      width: "100%", padding: "11px 13px", borderRadius: 10, border: `0.5px solid ${C.border}`,
      fontSize: 15, fontFamily: "inherit", background: C.card, color: C.text,
      minWidth: 0, boxSizing: "border-box", outline: "none"
    };

    if (step === 0) {
      return wrap(React.createElement("div", null,
        React.createElement("div", { style: { textAlign: "center", marginBottom: 22 } },
          React.createElement(FoxImage, { kind: "main", size: 160, style: { margin: "0 auto" } })
        ),
        React.createElement("div", { style: { fontSize: 22, fontWeight: 600, color: C.text, textAlign: "center", marginBottom: 8 } }, "Привет!"),
        React.createElement("div", { style: { fontSize: 14, color: C.textM, textAlign: "center", lineHeight: 1.6, marginBottom: 22 } },
          "Это твой план восстановления на 9 недель. Чтобы приложение знало где ты сейчас, ответь на пару вопросов."
        ),
        React.createElement("div", { style: { marginBottom: 16 } },
          React.createElement("div", { style: { fontSize: 12, color: C.textM, marginBottom: 6 } }, "Как тебя зовут?"),
          React.createElement("input", { value: name, onChange: e => setName(e.target.value),
            style: { ...dateInputStyle, padding: "11px 13px" }
          })
        ),
        React.createElement("button", { onClick: () => setStep(1),
          style: { width: "100%", padding: "13px", borderRadius: 10, background: C.olive, border: "none",
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }
        }, "Дальше →")
      ));
    }

    if (step === 1) {
      const packDate = mkd(packAnchorVal);
      const lastPill = new Date(packDate); lastPill.setDate(lastPill.getDate() + ACTIVE_PILLS - 1);
      const nextPeriod = getPredictedPeriodStart(1, packAnchorVal);
      const nextPeriodEnd = new Date(nextPeriod); nextPeriodEnd.setDate(nextPeriodEnd.getDate() + PERIOD_LENGTH - 1);
      const breakStart = new Date(lastPill); breakStart.setDate(breakStart.getDate() + 1);
      const fmt = d => d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

      return wrap(React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 8 } }, "Ярина и месячные"),
        React.createElement("div", { style: { fontSize: 13, color: C.textM, lineHeight: 1.6, marginBottom: 18 } },
          "На Ярине месячные — это кровотечение отмены в 7-дневный перерыв. Поэтому достаточно одной даты: когда была первая таблетка ", React.createElement("b", null, "текущей пачки"), "? Всё остальное приложение посчитает само."
        ),
        React.createElement("input", { type: "date", value: packAnchorVal, onChange: e => setPackAnchorVal(e.target.value),
          "aria-label": "Дата первой таблетки текущей пачки",
          style: { ...dateInputStyle, marginBottom: 16 }
        }),
        React.createElement("div", { style: { fontSize: 11, color: C.textL, lineHeight: 1.7, marginBottom: 18, padding: "11px 13px", background: C.bgWarm, borderRadius: 8 } },
          "💊 Последняя таблетка пачки: ", React.createElement("b", { style: { color: C.olive } }, fmt(lastPill)), React.createElement("br"),
          "⏸ Перерыв: с ", React.createElement("b", null, fmt(breakStart)), React.createElement("br"),
          "🌸 Прогноз месячных: ", React.createElement("b", { style: { color: C.pink } }, fmt(nextPeriod), " — ", fmt(nextPeriodEnd)), React.createElement("br"),
          React.createElement("span", { style: { fontStyle: "italic" } }, "Точную дату можно будет поправить в разделе «Здоровье → Цикл».")
        ),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("button", { onClick: () => setStep(0),
            style: { flex: 1, padding: "13px", borderRadius: 10, background: C.bgWarm, border: `0.5px solid ${C.border}`,
              color: C.textM, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }
          }, "Назад"),
          React.createElement("button", { onClick: () => setStep(2),
            style: { flex: 2, padding: "13px", borderRadius: 10, background: C.olive, border: "none",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }
          }, "Дальше →")
        )
      ));
    }

    if (step === 2) {
      return wrap(React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 8 } }, "Стартовый ферритин"),
        React.createElement("div", { style: { fontSize: 13, color: C.textM, lineHeight: 1.6, marginBottom: 18 } },
          "Знаешь свой ферритин на старте? Можешь пропустить — спрошу позже. Это поможет отслеживать прогресс."
        ),
        React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", marginBottom: 6 } },
          React.createElement("input", { type: "number", value: ferritin, onChange: e => setFerritin(e.target.value),
            placeholder: "28",
            style: { ...dateInputStyle, flex: 1 }
          }),
          React.createElement("span", { style: { fontSize: 13, color: C.textM } }, "мкг/л")
        ),
        React.createElement("div", { style: { fontSize: 11, color: C.textL, marginBottom: 22, lineHeight: 1.5 } },
          "Норма для женщин: 30—100. Можно пропустить и заполнить позже в Настройках."
        ),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("button", { onClick: () => setStep(1),
            style: { flex: 1, padding: "13px", borderRadius: 10, background: C.bgWarm, border: `0.5px solid ${C.border}`,
              color: C.textM, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }
          }, "Назад"),
          React.createElement("button", { onClick: () => setStep(3),
            style: { flex: 2, padding: "13px", borderRadius: 10, background: C.olive, border: "none",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }
          }, "Дальше →")
        )
      ));
    }

    if (step === 3) {
      return wrap(React.createElement("div", null,
        React.createElement("div", { style: { textAlign: "center", marginBottom: 16 } },
          React.createElement(FoxImage, { kind: "main", size: 120, style: { margin: "0 auto" } })
        ),
        React.createElement("div", { style: { fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 12, textAlign: "center" } }, "Пара слов перед стартом"),
        React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 12, padding: "14px 16px", marginBottom: 12 } },
          React.createElement("div", { style: { fontSize: 13.5, color: C.text, lineHeight: 1.65 } },
            "Это марафон, а не спринт. Организм не «сломан» — он просто хронически напряжён, и ему нужно время.")
        ),
        React.createElement("div", { style: { marginBottom: 14 } },
          [
            ["🦊", "Первые 1–2 месяца — про то, чтобы остановить выпадение, а не отрастить. Это уже успех."],
            ["🌿", "Изменения медленные и незаметные день в день — поэтому есть фотодневник и графики."],
            ["💛", "Пропуск — не провал. Можно вернуться в любой момент, без вины."],
            ["📝", "Тревожные мысли можно складывать в «Место для тревоги» и вопросы — в «Врачи», чтобы не носить их в голове."],
          ].map((it, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 11, marginBottom: 11, alignItems: "flex-start" } },
            React.createElement("div", { style: { fontSize: 18, flexShrink: 0 } }, it[0]),
            React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.55 } }, it[1])
          ))
        ),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("button", { onClick: () => setStep(2),
            style: { flex: 1, padding: "13px", borderRadius: 10, background: C.bgWarm, border: `0.5px solid ${C.border}`,
              color: C.textM, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }
          }, "Назад"),
          React.createElement("button", { onClick: save,
            style: { flex: 2, padding: "13px", borderRadius: 10, background: C.olive, border: "none",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }
          }, "Начать 🦊")
        )
      ));
    }
  }

  // ===========================================================================
  // AlertsBanner — баннер «не забудь» вверху Сегодня (если есть просроченные таблетки)
  // ===========================================================================
  function AlertsBanner({ activePillsCount, takenCount }) {
    // Если все приняты — баннера нет
    if (activePillsCount === 0 || takenCount >= activePillsCount) return null;
    // Если сейчас вечер (после 19:00) и есть непринятые — показываем напоминание
    const now = new Date();
    const hour = now.getHours();
    const dayK = dayKey();
    const [dismissed, setDismissed] = useState(() => {
      try { return localStorage.getItem("noteDismissed_pills") === dayK; } catch { return false; }
    });
    if (hour < 19) return null; // днём не дёргаем — таблетки разнесены по времени
    if (dismissed) return null;
    const close = () => {
      try { localStorage.setItem("noteDismissed_pills", dayK); } catch {}
      setDismissed(true);
    };
    return React.createElement("div", {
      style: { padding: "10px 12px", background: C.bgWarm, borderLeft: `3px solid ${C.warn}66`,
        borderRadius: 10, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }
    },
      React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.warn } }, "💊 Не забудь таблетки"),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } }, "Сегодня осталось ", activePillsCount - takenCount, " из ", activePillsCount)
      ),
      React.createElement("button", { onClick: close, "aria-label": "Скрыть на сегодня",
        style: { background: "none", border: "none", color: C.textL, fontSize: 16, lineHeight: 1, cursor: "pointer", padding: "0 2px", flexShrink: 0, fontFamily: "inherit" } }, "×")
    );
  }

  // ===========================================================================
  // TrichoReminder — напоминания про визит к трихологу:
  //   • за 2 недели (с 25 июля) — пора записаться
  //   • за неделю (с 1 августа) — пора сдать анализы
  // Каждое можно скрыть отдельно. После даты визита — не показываем.
  function AnalysisReminder() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [bookDismissed, setBookDismissed] = useLS("trichoBookDismissed", false);
    const [labsDismissed, setLabsDismissed] = useLS("trichoLabsDismissed", false);
    const afterVisit = today > KEY_DATES.trichoVisit;
    if (afterVisit) return null;

    const visitStr = KEY_DATES.trichoVisit.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    const showBook = today >= KEY_DATES.trichoBookFrom && !bookDismissed;
    const showLabs = today >= KEY_DATES.trichoLabsFrom && !labsDismissed;
    if (!showBook && !showLabs) return null;

    const card = (key, color, title, text, onClose) => React.createElement("div", {
      key, style: { padding: "10px 12px", background: C.bgWarm, borderLeft: `3px solid ${color}66`, borderRadius: 10, marginBottom: 8 }
    },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 } },
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color, marginBottom: 4 } }, title),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.55 } }, text)
        ),
        React.createElement("button", { onClick: onClose, "aria-label": "Скрыть",
          style: { background: "none", border: "none", fontSize: 16, color: C.textL, cursor: "pointer", padding: "0 2px", lineHeight: 1, fontFamily: "inherit", flexShrink: 0 } }, "×")
      )
    );

    return React.createElement(React.Fragment, null,
      showBook && card("book", C.pink, "📅 Пора записаться к трихологу",
        "Приём примерно " + visitStr + " (2 месяца плана). Запишись заранее — к хорошему специалисту места разбирают. Контакты — в Настройки → Врачи.",
        () => setBookDismissed(true)),
      showLabs && card("labs", C.info, "🩸 Пора сдать анализы перед трихологом",
        "За неделю до приёма (" + visitStr + ") сдай: ОАК, ферритин, железо, B12, витамин D, цинк, ТТГ, fT4, ALT/AST. Возьми результаты на приём.",
        () => setLabsDismissed(true))
    );
  }

  // ===========================================================================
  // BackupReminder — мягкое напоминание про бэкап.
  // Показывается если:
  //   - бэкапа никогда не было И есть какие-то данные (хотя бы что-то отмечено)
  //   - последний бэкап был >14 дней назад
  //   - сегодня воскресенье вечером (после 19:00) И бэкап >7 дней назад
  // ===========================================================================
  function BackupReminder({ setTab }) {
    const [dismissedKey, setDismissedKey] = useLS("backupReminderDismissed", "");

    let lastBackup = null;
    try {
      const raw = localStorage.getItem("lastBackupAt");
      if (raw) lastBackup = new Date(JSON.parse(raw));
    } catch {}

    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const dow = today.getDay(); // 0=вс, 1=пн, ...
    const hour = now.getHours();
    const isSundayEvening = dow === 0 && hour >= 19;

    const daysSinceBackup = lastBackup ? Math.floor((now - lastBackup) / 86400000) : null;

    // Сделать ключ "когда было закрыто" — чтобы можно было закрыть на день
    // dismissedKey содержит ISO дату когда закрыли — если совпадает с сегодня, не показываем
    const todayISO = dayKey(today);
    if (dismissedKey === todayISO) return null;

    // Определяем нужно ли показывать
    let kind = null; // "sunday" | "old" | "very_old" | "never"
    if (!lastBackup) {
      // Проверяем, есть ли вообще какие-то данные (не пустое приложение)
      const hasAnyData = localStorage.length > 5; // больше базовых ключей
      if (hasAnyData && isSundayEvening) kind = "never";
    } else if (daysSinceBackup > 14) {
      kind = "very_old";
    } else if (isSundayEvening && daysSinceBackup >= 7) {
      kind = "sunday";
    }

    if (!kind) return null;

    const msg = {
      never: { color: C.warn, bg: C.warnSoft, title: "💾 Сделай первый бэкап",
        text: "Вечер воскресенья — хорошее время. Займёт 5 секунд: Настройки → Данные → ⬇ Скачать копию." },
      sunday: { color: C.olive, bg: C.oliveSoft, title: "💾 Воскресный бэкап",
        text: `Прошло ${daysSinceBackup} дн. с последней копии. Хороший момент чтобы обновить.` },
      very_old: { color: C.warn, bg: C.warnSoft, title: "⚠ Давно не было бэкапа",
        text: `${daysSinceBackup} дн. без копии — пора обновить. Настройки → Данные → ⬇ Скачать копию.` },
    }[kind];

    return React.createElement("div", {
      style: { padding: "10px 12px", background: C.bgWarm, borderLeft: `3px solid ${msg.color}66`,
        borderRadius: 10, marginBottom: 8 }
    },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 } },
        React.createElement("div", { style: { flex: 1, cursor: "pointer" }, onClick: () => setTab && setTab("settings") },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: msg.color, marginBottom: 4 } }, msg.title),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.55 } }, msg.text)
        ),
        React.createElement("button", { onClick: () => setDismissedKey(todayISO), "aria-label": "Скрыть",
          style: { background: "none", border: "none", fontSize: 16, color: C.textL, cursor: "pointer", padding: "0 2px", lineHeight: 1, fontFamily: "inherit", flexShrink: 0 } }, "×")
      )
    );
  }

  // ===== ВКЛАДКА "ПЛАН" =====
  // 9 недель восстановления (25 мая — 26 июля). Каждая неделя имеет имя и фокус.
  // Текущая неделя подсвечивается автоматически по дате.
  // 5 "волн подключения" — это активности, которые стартуют в конкретные даты.
  const PLAN_BLOCKS = [
    {
      n: 1, from: "2026-05-25", to: "2026-05-31",
      title: "25 — 31 мая",
      subtitle: "Вход в режим",
      goal: "Стабилизировать сон, ритм еды и питьё воды. Подключить первые добавки. Без перегруза.",
      sections: [
        { h: "Что подключается на этой неделе", items: [
          "СБ 30 мая — старт: Форлакс (16:00, отдельно от таблеток ±2 ч) + Zinkorot 25 мг (20:00)"
        ], ok: true },
        { h: "Уже принимаешь стабильно", items: [
          "Дуксет 60 мг утром натощак (09:00)",
          "Ярина в 21:00"
        ]},
        { h: "Активность", items: [
          "Мягкое движение вечером по желанию",
          "Зал и курс таз. дна — пока НЕ начинаем",
          "Главное: восстановить ритм, ложиться в 22:00, вставать в 8:00"
        ]},
        { h: "Купить до 2 июня", items: [
          "Gentle Iron 25 мг + витамин C (старт 3 июня, через день)",
          "Перфектил, Омега-3, Витамин D (старт 7 июня)",
          "Ниацинамид 500 мг (старт 7 июня)",
          "Перфектил/Омега/вит D (старт 8 июня); Цистениум, Кристалваг (старт 10 июня); A+E Medana (старт 12 июня); Лактриол с 13 июня"
        ]},
        { h: "Цели на конец недели", items: [
          "Стабильный режим сна 23:00—08:00",
          "Дневник — когда хочется, даже пара записей в неделю уже даёт картину",
          "Белок 80+ г/день к концу недели"
        ], ok: true },
      ]
    },
    {
      n: 2, from: "2026-06-01", to: "2026-06-07",
      title: "1 — 7 июня",
      subtitle: "Подключение нутриентов",
      goal: "Добавить железо (через день), затем обеденный и вечерний блоки. Главное — ЖКТ должен справиться.",
      sections: [
        { h: "Что подключается", items: [
          "СР 3 июня — Gentle Iron 25 мг + витамин C (08:15 натощак, через день: ср/пт/вс)",
          "ВС 7 июня — обед: Перфектил + Омега-3; Витамин D (пн/ср/сб)",
          "ВС 7 июня — ужин: Ниацинамид 500 мг"
        ], ok: true },
        { h: "Важно про Перфектил", items: [
          "Только после полноценного обеда (натощак — тошнота)",
          "В составе уже есть железо, цинк, B-группа — поэтому между ним и отдельным железом разрыв (у нас железо утром, Перфектил в обед — ок)",
          "Если тошнит — попробовать с большим количеством воды"
        ], warn: true },
        { h: "Железо — главные правила", items: [
          "08:15 натощак, за 30–45 мин до завтрака",
          "Без кофе/чая/молочного 2 ч до и после",
          "Через день (ср/пт/вс). С 17 июня доза растёт до 50 мг (тоже через день)",
          "Чёрный стул — норма. Подробнее: Здоровье → Железо и ЖКТ"
        ], warn: true },
        { h: "Цели на конец недели", items: [
          "Перфектил переносится без тошноты",
          "Железо переносится (следим за ЖКТ, Форлакс помогает)",
          "Месячные ожидаются ~8 июня — записать факт"
        ], ok: true },
      ]
    },
    {
      n: 3, from: "2026-06-08", to: "2026-06-14",
      title: "8 — 14 июня",
      subtitle: "Вечерний блок и зал",
      goal: "Подключить A+E, Цистениум, Кристалваг и начать силовые. Слушать тело.",
      sections: [
        { h: "Что подключается", items: [
          "ПН 8 июня — обед: Перфектил + Омега + вит D; СР 10 июня — на ночь: Цистениум + Кристалваг 2 капс; ПТ 12 июня — вечер: A+E Medana 2 капс",
          "ПТ 13 июня — на ночь добавляется Лактриол (через день)",
          "СР 10 июня — Зал 18:00 (разминка 10 мин + силовая 40 мин)"
        ], ok: true },
        { h: "Железо — главные правила", items: [
          "08:15 натощак, за 30–45 мин до завтрака",
          "Без кофе/чая/молочного 2 ч до и после",
          "Через день (ср/пт/вс). С 17 июня доза 50 мг (через день)",
          "A+E держать отдельно от витамина C/селена (поэтому A+E вечером)"
        ], warn: true },
        { h: "Месячные на этой неделе", items: [
          "Ожидаются ~8 июня (кровотечение отмены в перерыве Ярины)",
          "Первые 3 дня — лёгкая интенсивность",
          "В ПН 8 июня зал НЕ начинаем. Первая силовая = СР 10 июня"
        ]},
        { h: "Зал — старт", items: [
          "Программа: 10 мин разминка + 40 мин силовая",
          "Минимальные веса! Запас 3-4 повтора",
          "Выдох на усилии, не задерживай дыхание",
          "Без жима лёжа, без приседа со штангой пока"
        ]},
      ]
    },
    {
      n: 4, from: "2026-06-15", to: "2026-06-21",
      title: "15 — 21 июня",
      subtitle: "Закрепление",
      goal: "Все добавки и активности уже подключены. Закрепить ритм, добавить бег/ходьбу.",
      sections: [
        { h: "Что подключается", items: [
          "ПН 15 июня — Курс таз. дна (6 раз в неделю, 30 мин, отдых в вс)",
          "ПН 15 июня — Бег/ходьба 1 раз в неделю (по самочувствию)",
          "С 17 июня — железо переходит на 50 мг (через день)",
          "Начать с быстрой ходьбы или incline walking"
        ], ok: true },
        { h: "Курс таз. дна", items: [
          "ПН-СБ по 30 мин в 18:00 (в дни зала — после силовой)",
          "Воскресенье — отдых",
          "Главное правило: РАССЛАБЛЕНИЕ, не усилие",
          "Если боль усилилась — снижай интенсивность, не бросай"
        ]},
        { h: "Полный режим работает", items: [
          "Все таблетки по расписанию",
          "Зал ср+пт + таз. дно после",
          "Курс таз. дна 6/7 дней",
          "Мягкое движение вечером"
        ]},
        { h: "Что отслеживать", items: [
          "Энергия — должна постепенно расти",
          "ЖКТ — стул должен быть мягким (Форлакс работает)",
          "Тренировки — без боли в тазовом дне после"
        ]},
      ]
    },
    {
      n: 5, from: "2026-06-22", to: "2026-06-28",
      title: "22 — 28 июня",
      subtitle: "Полная нагрузка",
      goal: "Железо уже на дозе 50 мг через день (с 17 июня). Закрепляем полный режим.",
      sections: [
        { h: "Режим железа", items: [
          "Железо 50 мг в 08:15 натощак, через день (ср/пт/вс)",
          "Без кофе/чая/молочного 2 ч до и после",
          "Утренний чай/кофе — через 2 ч после железа"
        ], warn: true },
        { h: "Месячные на следующей неделе", items: [
          "Прогноз: 6—10 июля",
          "Заранее: тампоны/прокладки, болеутоляющее если нужно"
        ]},
        { h: "Контрольный чек", items: [
          "Сравнить настроение/энергию с началом плана (неделя 1)",
          "Заметки в дневнике: что улучшилось, что нет",
          "Подготовиться к анализам (записать когда сдавать)"
        ]},
      ]
    },
    {
      n: 6, from: "2026-06-29", to: "2026-07-05",
      title: "29 июня — 5 июля",
      subtitle: "Середина пути",
      goal: "Закрепляем режим. Главная контрольная точка — визит к трихологу ~12 августа (2 месяца от старта полного приёма 12 июня). Анализы сдаём за неделю до него.",
      sections: [
        { h: "Ключевые даты впереди", items: [
          "~29 июля — записаться к трихологу (приложение напомнит)",
          "~5 августа — сдать контрольные анализы (за неделю до приёма)",
          "~12 августа — визит к трихологу с результатами"
        ], ok: true },
        { h: "Список для будущих анализов", items: [
          "ОАК, ферритин (главное — рост с 28 до 40+), железо, B12, фолат",
          "ТТГ, fT4 (был у нижней границы), витамин D, цинк",
          "ALT/AST/GGTP, креатинин"
        ]},
        { h: "Что отметить в дневнике", items: [
          "Как изменилось самочувствие за месяц",
          "Стабильность ЖКТ (Форлакс/Фитомуцил)",
          "Энергия для тренировок"
        ]},
      ]
    },
    {
      n: 7, from: "2026-07-06", to: "2026-07-12",
      title: "6 — 12 июля",
      subtitle: "Продолжаем",
      goal: "Ровный режим. До анализов (~5 августа) и трихолога (~12 августа) ещё есть время — просто продолжаем приём и наблюдаем.",
      sections: [
        { h: "Анализы сдаём позже — ~1 августа", items: [
          "Не сейчас! Контрольные анализы — за неделю до трихолога (~5 августа)",
          "Список держим наготове (см. неделю 6)",
          "Ферритин — главный показатель: цель рост к 40+"
        ], ok: true },
        { h: "Что значит результат", items: [
          "Ферритин 30—50 — норма, продолжаем железо",
          "Ферритин 50+ — отлично, можно снизить дозу",
          "Ферритин не подрос — обсудить дозу или форму с врачом",
          "Витамин D 30—60 нг/мл — норма",
          "Цинк в норме — можно отменить отдельный приём"
        ]},
        { h: "День C доступен", items: [
          "ПН 6 июля — открывается День C (ягодицы + ноги, высокая интенсивность)",
          "Раз в 2 недели вместо Дня A или B — не в дополнение!",
          "Только при хорошем самочувствии и достаточно сна"
        ]},
      ]
    },
    {
      n: 8, from: "2026-07-13", to: "2026-07-19",
      title: "13 — 19 июля",
      subtitle: "Ровный режим",
      goal: "Продолжаем полный приём. Анализы и трихолог — в начале августа. Сейчас главное — стабильность и наблюдение.",
      sections: [
        { h: "Что будем корректировать ПОСЛЕ анализов (~1 авг)", items: [
          "Если ферритин <40 — продолжаем железо 50 мг через день",
          "Если ферритин >50 — можно реже",
          "Если витамин D <30 — обсудить увеличение дозы",
          "Если цинк в норме — отдельный курс можно завершить"
        ], ok: true },
        { h: "Подготовка к трихологу (визит ~12 августа)", items: [
          "Фото волос: пробор, виски, макушка — при том же освещении что в начале плана",
          "Результаты анализов распечатать",
          "Список вопросов: динамика выпадения, новые волоски, нужен ли миноксидил, можно ли снизить Перфектил"
        ]},
        { h: "Самооценка прогресса", items: [
          "Что улучшилось за 8 недель",
          "Что осталось без изменений",
          "Что хочется изменить в плане на следующий период"
        ]},
      ]
    },
    {
      n: 9, from: "2026-07-20", to: "2026-07-26",
      title: "20 — 26 июля",
      subtitle: "Финиш и удержание",
      goal: "Закрепить новые привычки. Решить что продолжать после плана. Не «откатиться».",
      sections: [
        { h: "Что точно продолжать после плана", items: [
          "Режим сна 23:00—08:00",
          "Белок 90+ г/день",
          "Дуксет и Ярина без изменений (если не сказал врач)",
          "Витамин D осенью—весной",
          "Дневник состояния (хотя бы 1 раз в неделю)"
        ], ok: true },
        { h: "Что обсудить с врачами", items: [
          "Трихолог — дальнейший план (Перфектил, миноксидил, ниацинамид)",
          "Гастроэнтеролог — нужно ли продолжать Форлакс",
          "Гинеколог — насколько долго Ярина",
          "Терапевт — длительный курс железа или достаточно"
        ]},
        { h: "Подведение итогов плана", items: [
          "Сравнить начальные и конечные анализы",
          "Сравнить начальные и конечные фото волос",
          "Записать главные выводы за 9 недель",
          "Поставить цели на следующие 3 месяца"
        ], ok: true },
      ]
    },
  ];

  // ===========================================================================
  // JourneyTab — «Путь»: эмоциональная опора на длинном марафоне.
  // Стрик-календарь (мягкий), карта пути, главы восстановления, письмо себе, капсула.
  // ===========================================================================
  // ===========================================================================
  // SeasonWeatherTab — сезонность + связь погоды и самочувствия (ручная, без API).
  // ===========================================================================
  function SeasonWeatherTab() {
    const [log, setLog] = useLS("weatherFeelV1", {}); // {dayKey: {weather, feel, note}}
    const todayK = dayKey();
    const t = log[todayK] || {};
    const set = (patch) => setLog({ ...log, [todayK]: { ...t, ...patch } });

    const month = new Date().getMonth(); // 0..11
    let season, sIcon, sTips;
    if (month >= 2 && month <= 4) {
      season = "Весна"; sIcon = "🌷";
      sTips = ["Свет прибавляется — настроение и энергия обычно растут.", "Хорошее время добавить движение и витамин D по назначению.", "Сезонная аллергия может усиливать усталость — учитывай."];
    } else if (month >= 5 && month <= 7) {
      season = "Лето"; sIcon = "☀️";
      sTips = ["Жара = больше воды: важно для профилактики цистита.", "Солнце — это витамин D, но коже нужен SPF каждый день.", "В жару тренировки лучше утром или вечером."];
    } else if (month >= 8 && month <= 10) {
      season = "Осень"; sIcon = "🍂";
      sTips = ["Света меньше — следи за витамином D и режимом сна.", "Настроение может проседать — это сезонное, будь к себе мягче.", "Тёплые ритуалы (чай, какао) поддерживают вечером."];
    } else {
      season = "Зима"; sIcon = "❄️";
      sTips = ["Мало солнца — витамин D особенно важен (по назначению).", "Сухой воздух от отопления — больше воды и крем для кожи.", "Короткий день влияет на настроение — свет утром помогает."];
    }

    const weathers = [["☀️", "ясно"], ["⛅", "облачно"], ["🌧", "дождь"], ["🌫", "давление/туман"], ["❄️", "холод"]];
    const feels = [["😊", "хорошо"], ["😐", "средне"], ["😣", "тяжело"], ["🤕", "голова/боль"]];

    // Простой разбор закономерностей по накопленным данным
    const entries = Object.values(log).filter(e => e.weather && e.feel);
    const insight = (() => {
      if (entries.length < 5) return null;
      const bad = entries.filter(e => e.feel === "тяжело" || e.feel === "голова/боль");
      if (bad.length < 2) return null;
      const counts = {};
      bad.forEach(e => { counts[e.weather] = (counts[e.weather] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top && top[1] >= 2) return `Замечено: в дни «${top[0]}» ты чаще отмечала, что тяжело (${top[1]} раз). Возможно, погода влияет — стоит обратить внимание.`;
      return null;
    })();

    return React.createElement("div", null,
      // Сезон
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.oliveDeep, marginBottom: 7 } }, sIcon, " ", season, ": на что обратить внимание"),
        sTips.map((tip, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 8, marginBottom: 6 } },
          React.createElement("div", { style: { width: 5, height: 5, borderRadius: "50%", background: C.olive, marginTop: 6, flexShrink: 0 } }),
          React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.55 } }, tip)
        ))
      ),
      // Погода и самочувствие
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 } }, "Погода и самочувствие"),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.5, marginBottom: 11 } },
          "Если замечаешь, что давление или погода влияют на голову и тело — отмечай. Со временем приложение подскажет закономерности."),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 5 } }, "Погода сегодня"),
        React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 11, flexWrap: "wrap" } },
          weathers.map(w => React.createElement("button", { key: w[1], onClick: () => set({ weather: w[1] }),
            style: { padding: "7px 10px", borderRadius: 9, border: `0.5px solid ${t.weather === w[1] ? C.olive : C.border}`, background: t.weather === w[1] ? C.oliveSoft : C.card, cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: t.weather === w[1] ? C.oliveDeep : C.textM } }, w[0], " ", w[1]))),
        React.createElement("div", { style: { fontSize: 11, color: C.textM, marginBottom: 5 } }, "Как ты себя чувствуешь"),
        React.createElement("div", { style: { display: "flex", gap: 5, flexWrap: "wrap" } },
          feels.map(f => React.createElement("button", { key: f[1], onClick: () => set({ feel: f[1] }),
            style: { padding: "7px 10px", borderRadius: 9, border: `0.5px solid ${t.feel === f[1] ? C.olive : C.border}`, background: t.feel === f[1] ? C.oliveSoft : C.card, cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: t.feel === f[1] ? C.oliveDeep : C.textM } }, f[0], " ", f[1])))
      ),
      insight && React.createElement("div", { style: { background: C.sandSoft, border: `0.5px solid ${C.sand}55`, borderRadius: 11, padding: "12px 14px", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12, color: C.sandDeep, lineHeight: 1.6 } }, "💡 ", insight)),
      React.createElement("div", { style: { fontSize: 10.5, color: C.textL, lineHeight: 1.5 } },
        "Погода вводится вручную — у приложения нет доступа к датчикам. Это наблюдение для тебя, не диагноз.")
    );
  }
  function JourneyTab() {
    const [sub, setSub] = useState("map");
    const subs = [
      { id: "map", l: "🗺 Карта" },
      { id: "chapters", l: "📖 Главы" },
    ];
    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 12, overflowX: "auto" } },
        subs.map(s => React.createElement("button", { key: s.id, onClick: () => setSub(s.id),
          style: { flex: "1 0 auto", padding: "8px 10px", borderRadius: 9, border: `0.5px solid ${sub === s.id ? C.olive : C.border}`, whiteSpace: "nowrap",
            background: sub === s.id ? C.oliveSoft : C.card, color: sub === s.id ? C.oliveDeep : C.textM, fontSize: 12, fontWeight: sub === s.id ? 600 : 500, cursor: "pointer", fontFamily: "inherit" } }, s.l))
      ),
      sub === "map" && React.createElement(JourneyMap, null),
      sub === "chapters" && React.createElement(RecoveryChapters, null)
    );
  }

  // Годовая карта пути — вехи по месяцам
  function JourneyMap() {
    const [labResults] = useLS("labResultsV1", {});
    const [photos] = useLS("hairPhotosV1", []);
    const now = new Date();
    const milestones = [
      { d: KEY_DATES.planStart, t: "Начало пути", s: "Первый день плана. Самый важный шаг — начать." },
      { d: KEY_DATES.ironStart, t: "Железо стартовало", s: "Запуск восстановления запасов." },
      { d: KEY_DATES.gymStart, t: "Первый зал", s: "Тело включается в движение." },
      { d: KEY_DATES.pelvicStart, t: "Курс тазового дна", s: "Забота о теле глубже." },
      { d: KEY_DATES.block7Start, t: "Контрольные анализы", s: "Смотрим, как выросли запасы." },
      { d: KEY_DATES.planEnd, t: "Конец 9 недель", s: "Первый большой рубеж. Но путь продолжается." },
      { d: mkd("2026-09-25"), t: "4 месяца", s: "Волосы: выпадение обычно заметно меньше." },
      { d: mkd("2026-11-25"), t: "6 месяцев", s: "Видимая густота начинает возвращаться." },
    ];
    const ferrCols = ["start", "mid", "end", ...((labResults.__cols || []).map(c => c.id))];
    let ferr = null;
    ferrCols.forEach(c => { const v = labResults["ferritin_" + c]; if (v && !isNaN(parseFloat(v))) ferr = parseFloat(v); });

    return React.createElement("div", null,
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.oliveDeep, marginBottom: 5 } }, "🗺 Твой путь"),
        React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.6 } },
          "Восстановление — это не точка, а дорога. Вот её вехи. Пройденное закрашено — видно, как много уже позади."),
        (photos.length > 0 || ferr !== null) && React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 10 } },
          photos.length > 0 && React.createElement("div", { style: { flex: 1, background: C.card, borderRadius: 9, padding: "8px 10px", textAlign: "center" } },
            React.createElement("div", { style: { fontSize: 17, fontWeight: 700, color: C.oliveDeep } }, photos.length),
            React.createElement("div", { style: { fontSize: 9.5, color: C.textM } }, "фото волос")),
          ferr !== null && React.createElement("div", { style: { flex: 1, background: C.card, borderRadius: 9, padding: "8px 10px", textAlign: "center" } },
            React.createElement("div", { style: { fontSize: 17, fontWeight: 700, color: C.sand } }, Math.round(ferr)),
            React.createElement("div", { style: { fontSize: 9.5, color: C.textM } }, "ферритин")))
      ),
      React.createElement("div", { style: { position: "relative", paddingLeft: 24 } },
        React.createElement("div", { style: { position: "absolute", left: 7, top: 6, bottom: 6, width: 2, background: C.border } }),
        milestones.map((m, i) => {
          const passed = now >= m.d;
          return React.createElement("div", { key: i, style: { position: "relative", marginBottom: 16 } },
            React.createElement("div", { style: { position: "absolute", left: -24, top: 2, width: 16, height: 16, borderRadius: "50%", background: passed ? C.olive : C.card, border: `2px solid ${passed ? C.olive : C.border}`, display: "flex", alignItems: "center", justifyContent: "center" } },
              passed && React.createElement("span", { style: { color: "#fff", fontSize: 9, fontWeight: 800 } }, "✓")),
            React.createElement("div", { style: { fontSize: 10, color: C.textL } }, m.d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })),
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: passed ? C.text : C.textM, marginTop: 1 } }, m.t),
            React.createElement("div", { style: { fontSize: 11.5, color: C.textM, lineHeight: 1.5, marginTop: 2 } }, m.s)
          );
        })
      )
    );
  }

  // Сезон восстановления — главы с тёплыми названиями
  function RecoveryChapters() {
    const now = new Date();
    const chapters = [
      { from: KEY_DATES.planStart, to: mkd("2026-06-08"), icon: "🌱", t: "Глава 1. Мягкий старт", s: "Привыкаем к режиму, запускаем железо и таблетки. Ничего форсировать не нужно — тело знакомится с новым ритмом." },
      { from: mkd("2026-06-09"), to: mkd("2026-06-29"), icon: "🌿", t: "Глава 2. Тело включается", s: "Добавляются зал, бег, курс тазового дна. Движение становится частью дня." },
      { from: mkd("2026-06-30"), to: KEY_DATES.planEnd, icon: "🌻", t: "Глава 3. Первые плоды", s: "Контрольные анализы, видно рост ферритина. Выпадение начинает замедляться." },
      { from: mkd("2026-07-27"), to: mkd("2026-09-30"), icon: "🍂", t: "Глава 4. Терпение и рост", s: "Самый «невидимый» период — изменения копятся медленно. Фотодневник покажет то, что не видит зеркало." },
      { from: mkd("2026-10-01"), to: mkd("2026-12-31"), icon: "❄️", t: "Глава 5. Возвращение густоты", s: "К полугоду обычно видна новая густота. Путь продолжается, но самое трудное — позади." },
    ];
    const curIdx = chapters.findIndex(c => now >= c.from && now <= c.to);
    const doneCount = chapters.filter(c => now > c.to).length;
    return React.createElement("div", null,
      React.createElement("div", { style: { fontSize: 12, color: C.textM, lineHeight: 1.6, marginBottom: 12 } },
        "Долгий путь легче, если разбить его на главы. Ты сейчас в одной из них — и каждая ведёт к следующей."),
      // Прогресс по главам — точки
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5, marginBottom: 16, padding: "0 4px" } },
        chapters.map((c, i) => React.createElement(React.Fragment, { key: i },
          React.createElement("div", { style: { width: i === curIdx ? 13 : 10, height: i === curIdx ? 13 : 10, borderRadius: "50%", flexShrink: 0,
            background: now > c.to ? C.olive : (i === curIdx ? C.oliveDeep : C.border),
            border: i === curIdx ? `2px solid ${C.oliveDeep}` : "none" } }),
          i < chapters.length - 1 && React.createElement("div", { style: { flex: 1, height: 2, background: now > c.to ? C.olive : C.border, borderRadius: 2 } })
        ))
      ),
      React.createElement("div", { style: { fontSize: 11.5, color: C.oliveDeep, fontWeight: 600, marginBottom: 12, textAlign: "center" } },
        curIdx >= 0 ? ("Сейчас: глава " + (curIdx + 1) + " из " + chapters.length) : (doneCount === chapters.length ? "Все главы пройдены 🌻" : "Путь скоро начнётся")),
      chapters.map((c, i) => {
        const isCur = i === curIdx;
        const passed = now > c.to;
        return React.createElement("div", { key: i, style: { background: isCur ? C.oliveSoft : C.card, border: `0.5px solid ${isCur ? C.olive : C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 10, opacity: passed ? 0.65 : 1 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, marginBottom: isCur ? 5 : 0 } },
            React.createElement("div", { style: { fontSize: 20 } }, c.icon),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontSize: 13.5, fontWeight: 700, color: isCur ? C.oliveDeep : C.text } }, c.t),
              React.createElement("div", { style: { fontSize: 10, color: C.textL } }, c.from.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }), " – ", c.to.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }))
            ),
            isCur && React.createElement("div", { style: { fontSize: 9.5, fontWeight: 700, color: "#fff", background: C.olive, borderRadius: 999, padding: "3px 9px" } }, "СЕЙЧАС"),
            passed && React.createElement("div", { style: { fontSize: 13, color: C.ok } }, "✓")
          ),
          // Описание показываем полностью у текущей; у остальных — тоже, но компактнее
          React.createElement("div", { style: { fontSize: 12, color: isCur ? C.text : C.textM, lineHeight: 1.6, marginTop: isCur ? 0 : 5 } }, c.s)
        );
      })
    );
  }

  // Мягкий стрик-календарь — тёплая сетка, без наказаний
  function SoftStreak() {
    const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const y = month.getFullYear(), m = month.getMonth();
    const monthName = month.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7; // пн=0
    const days = new Date(y, m + 1, 0).getDate();
    const now = new Date(); now.setHours(0, 0, 0, 0);

    // День «в ритме», если были отмечены таблетки в этот день
    const wasActive = (dd) => {
      try {
        const key = "pillsTaken_" + new Date(y, m, dd).toLocaleDateString("ru-RU");
        const t = JSON.parse(localStorage.getItem(key) || "null");
        return t && Object.values(t).some(Boolean);
      } catch { return false; }
    };
    let activeCount = 0;
    for (let d = 1; d <= days; d++) if (wasActive(d)) activeCount++;

    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);

    return React.createElement("div", null,
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.oliveDeep, marginBottom: 5 } }, "🌿 Твой ритм"),
        React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.6 } },
          "Каждый закрашенный день — день, когда ты позаботилась о себе. Пропуски — это нормально, они ничего не отменяют. Здесь нет «провала», только тёплая картина.")
      ),
      React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px" } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
          React.createElement("button", { onClick: () => setMonth(new Date(y, m - 1, 1)), style: { background: "none", border: "none", fontSize: 18, color: C.oliveDeep, cursor: "pointer", fontFamily: "inherit" } }, "‹"),
          React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, textTransform: "capitalize" } }, monthName),
          React.createElement("button", { onClick: () => setMonth(new Date(y, m + 1, 1)), style: { background: "none", border: "none", fontSize: 18, color: C.oliveDeep, cursor: "pointer", fontFamily: "inherit" } }, "›")
        ),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, marginBottom: 6 } },
          ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(d => React.createElement("div", { key: d, style: { fontSize: 9.5, color: C.textL, textAlign: "center", fontWeight: 600 } }, d))),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 } },
          cells.map((d, i) => {
            if (!d) return React.createElement("div", { key: i });
            const date = new Date(y, m, d);
            const future = date > now;
            const active = !future && wasActive(d);
            const isToday = date.getTime() === now.getTime();
            return React.createElement("div", { key: i, style: { aspectRatio: "1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
              background: active ? C.olive : (future ? "transparent" : C.bgWarm),
              color: active ? "#fff" : (future ? C.textL : C.textM),
              border: isToday ? `2px solid ${C.oliveDeep}` : "none", fontWeight: active || isToday ? 700 : 400 } }, d);
          })
        ),
        React.createElement("div", { style: { fontSize: 11.5, color: C.textM, textAlign: "center", marginTop: 12, lineHeight: 1.5 } },
          "В этом месяце ты заботилась о себе ", React.createElement("b", { style: { color: C.oliveDeep } }, activeCount), activeCount === 1 ? " день" : (activeCount >= 2 && activeCount <= 4 ? " дня" : " дней"), " 🌿")
      )
    );
  }

  // Письма себе будущей + капсула времени
  function LettersToSelf() {
    const [letters, setLetters] = useLS("lettersV1", []); // [{id, created, openAt, text, opened}]
    const [writing, setWriting] = useState(false);
    const [text, setText] = useState("");
    const [period, setPeriod] = useState(3);
    const now = new Date();

    const save = () => {
      if (!text.trim()) return;
      const openAt = new Date(); openAt.setMonth(openAt.getMonth() + period);
      setLetters([{ id: "l" + Date.now(), created: dayKey(), openAt: dayKey(openAt), text: text.trim() }, ...letters]);
      setText(""); setWriting(false);
    };
    const del = (id) => { if (confirm("Удалить письмо?")) setLetters(letters.filter(l => l.id !== id)); };
    const canOpen = (l) => mkd(l.openAt) <= now;

    return React.createElement("div", null,
      React.createElement("div", { style: { background: C.oliveSoft, border: `0.5px solid ${C.olive}33`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.oliveDeep, marginBottom: 5 } }, "💌 Письмо себе будущей"),
        React.createElement("div", { style: { fontSize: 12.5, color: C.text, lineHeight: 1.6 } },
          "Напиши себе — той, что откроет это письмо через несколько месяцев. О чём мечтаешь, чего боишься, что хочешь пожелать. Откроется в срок — как капсула времени.")
      ),
      !writing && React.createElement("button", { onClick: () => setWriting(true),
        style: { width: "100%", padding: "12px", borderRadius: 11, background: C.olive, border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 14 } }, "✍️ Написать письмо"),
      writing && React.createElement("div", { style: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px", marginBottom: 14 } },
        React.createElement("textarea", { value: text, onChange: e => setText(e.target.value), placeholder: "Дорогая я…",
          style: { width: "100%", minHeight: 120, padding: "11px 13px", borderRadius: 10, border: `0.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: "inherit", color: C.text, boxSizing: "border-box", outline: "none", resize: "vertical", lineHeight: 1.6, marginBottom: 10 } }),
        React.createElement("div", { style: { fontSize: 11.5, color: C.textM, marginBottom: 6 } }, "Открыть через:"),
        React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 12 } },
          [[1, "1 мес"], [3, "3 мес"], [6, "6 мес"], [12, "год"]].map(p => React.createElement("button", { key: p[0], onClick: () => setPeriod(p[0]),
            style: { flex: 1, padding: "9px", borderRadius: 9, border: `0.5px solid ${period === p[0] ? C.olive : C.border}`, background: period === p[0] ? C.oliveSoft : C.card, color: period === p[0] ? C.oliveDeep : C.textM, fontSize: 12, fontWeight: period === p[0] ? 600 : 500, cursor: "pointer", fontFamily: "inherit" } }, p[1]))),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("button", { onClick: () => { setWriting(false); setText(""); }, style: { flex: 1, padding: "10px", borderRadius: 9, background: C.bgWarm, border: "none", color: C.textM, fontSize: 13, cursor: "pointer", fontFamily: "inherit" } }, "Отмена"),
          React.createElement("button", { onClick: save, style: { flex: 2, padding: "10px", borderRadius: 9, background: C.olive, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } }, "Запечатать 💌"))
      ),
      letters.length === 0 && !writing && React.createElement("div", { style: { fontSize: 12, color: C.textL, textAlign: "center", padding: "20px", lineHeight: 1.5 } }, "Пока нет писем. Первое можно написать прямо сейчас 🌱"),
      letters.map(l => {
        const open = canOpen(l);
        return React.createElement("div", { key: l.id, style: { background: C.card, border: `0.5px solid ${open ? C.olive + "55" : C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 10 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? 9 : 0 } },
            React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 12.5, fontWeight: 600, color: open ? C.oliveDeep : C.textM } }, open ? "💌 Письмо открыто" : "🔒 Запечатано"),
              React.createElement("div", { style: { fontSize: 10.5, color: C.textL, marginTop: 1 } }, "написано ", l.created, open ? "" : " · откроется " + l.openAt)
            ),
            React.createElement("button", { onClick: () => del(l.id), "aria-label": "удалить", style: { background: "none", border: "none", color: C.textL, fontSize: 15, cursor: "pointer", fontFamily: "inherit" } }, "×")
          ),
          open
            ? React.createElement("div", { style: { fontSize: 13, color: C.text, lineHeight: 1.65, whiteSpace: "pre-wrap", paddingTop: 9, borderTop: `0.5px solid ${C.border}` } }, l.text)
            : React.createElement("div", { style: { fontSize: 11.5, color: C.textL, fontStyle: "italic", marginTop: 6 } }, "Содержимое скрыто до даты открытия 🌿")
        );
      })
    );
  }
  function PlanTab() {
    const [openBlock, setOpenBlock] = useState(null);
    const [planView, setPlanView] = useState("plan");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // currentBlockIdx — номер недели, которая ИДЁТ ПРЯМО СЕЙЧАС (или null).
    // null = план ещё не начался ИЛИ уже закончился.
    // upcomingBlockIdx — номер недели которая стартует следующей (если план ещё не начался).
    const currentBlockIdx = (() => {
      for (let i = 0; i < PLAN_BLOCKS.length; i++) {
        const b = PLAN_BLOCKS[i];
        const from = mkd(b.from);
        const to = mkd(b.to); to.setHours(23, 59, 59, 999);
        if (today >= from && today <= to) return i;
      }
      return null;
    })();
    const beforePlan = today < mkd(PLAN_BLOCKS[0].from);
    const afterPlan = today > mkd(PLAN_BLOCKS[PLAN_BLOCKS.length - 1].to);
    // Какой блок раскрыть по умолчанию: текущий, или первый (если до старта), или последний (если после)
    const defaultOpenIdx = currentBlockIdx !== null
      ? currentBlockIdx
      : beforePlan ? 0 : PLAN_BLOCKS.length - 1;

    // По умолчанию — открыт текущий/ближайший блок.
    useEffect(() => { if (openBlock === null) setOpenBlock(defaultOpenIdx); }, []);

    return React.createElement("div", null,
      // Переключатель: План / Путь
      React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 14 } },
        [["plan", "📋 План"], ["journey", "🗺 Путь"]].map(v => React.createElement("button", { key: v[0], onClick: () => setPlanView(v[0]),
          style: { flex: 1, padding: "10px", borderRadius: 10, border: `0.5px solid ${planView === v[0] ? C.olive : C.border}`,
            background: planView === v[0] ? C.oliveSoft : C.card, color: planView === v[0] ? C.oliveDeep : C.textM, fontSize: 13, fontWeight: planView === v[0] ? 700 : 500, cursor: "pointer", fontFamily: "inherit" } }, v[1]))
      ),
      planView === "journey" && React.createElement(JourneyTab, null),
      planView === "plan" && React.createElement("div", null,
      // Шапка плана — с лисой в углу и прогресс-баром
      React.createElement("div", {
        style: { background: C.bgWarm, borderRadius: 14, padding: "14px 16px", marginBottom: 14, border: `0.5px solid ${C.border}`, position: "relative", overflow: "hidden" }
      },
        // Лиса в правом верхнем углу шапки (не перекрывает прогресс-бар и текст)
        React.createElement("div", { style: { position: "absolute", right: 0, top: 0, width: 96, height: 64, opacity: 0.5, pointerEvents: "none",
          display: "flex", alignItems: "flex-start", justifyContent: "flex-end", overflow: "hidden", borderTopRightRadius: 14 } },
          React.createElement(FoxImage, { kind: "path", size: 96 })
        ),
        React.createElement("div", { style: { position: "relative" } },
          React.createElement("div", { style: { fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4, paddingRight: 80 } }, "План восстановления"),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, lineHeight: 1.5, paddingRight: 80 } }, "25 мая — 26 июля · 9 недель"),
          // Статус плана
          beforePlan && React.createElement("div", {
            style: { fontSize: 11, color: C.oliveDeep, fontWeight: 600, marginTop: 6 }
          },
            (() => {
              const dl = Math.round((mkd(PLAN_BLOCKS[0].from) - today) / 86400000);
              return dl === 0 ? "🌱 Сегодня старт!" : dl === 1 ? "🌱 Завтра старт!" : `🌱 До старта ${dl} ${dl >= 2 && dl <= 4 ? 'дня' : 'дней'}`;
            })()
          ),
          afterPlan && React.createElement("div", {
            style: { fontSize: 11, color: C.sandDeep, fontWeight: 600, marginTop: 6 }
          }, "✓ План завершён"),
          // Прогресс-бар: 9 полосок. Если план ещё не начался — все приглушённые.
          React.createElement("div", { style: { display: "flex", gap: 3, marginTop: 11, height: 4 } },
            PLAN_BLOCKS.map((_, i) => React.createElement("div", { key: i, style: {
              flex: 1,
              background: i === currentBlockIdx ? C.olive
                : (currentBlockIdx !== null && i < currentBlockIdx) ? C.sand + "66"
                : afterPlan ? C.sand + "66"
                : C.border,
              borderRadius: 2
            }}))
          ),
          React.createElement("div", { style: { fontSize: 11, color: C.text, marginTop: 9, fontStyle: "italic", lineHeight: 1.5 } }, "Организм не «сломан» — он хронически напряжён. Один шаг за раз.")
        )
      ),

      // Список блоков
      PLAN_BLOCKS.map((b, i) => {
        const isCurrent = i === currentBlockIdx;
        const isPast = today > (() => { const d = mkd(b.to); d.setHours(23, 59, 59, 999); return d; })();
        const isUpcoming = !isCurrent && !isPast;
        const isOpen = openBlock === i;
        const borderClr = isCurrent ? C.olive : C.border;
        const bgClr = isCurrent ? C.oliveSoft : C.card;
        return React.createElement("div", {
          key: b.n,
          style: { background: bgClr, borderRadius: 12, marginBottom: 8,
            border: isCurrent ? `1.5px solid ${C.olive}` : `0.5px solid ${C.border}`,
            overflow: "hidden", position: "relative" }
        },
          // Декор в правом верхнем углу текущей недели — следы лапок (символ движения)
          isCurrent && React.createElement("div", { style: { position: "absolute", right: 8, top: 8, opacity: 0.3, pointerEvents: "none" } },
            React.createElement(FoxImage, { kind: "tracks", size: 36 })
          ),
          // Заголовок блока — кликабельный
          React.createElement("button", {
            onClick: () => setOpenBlock(isOpen ? null : i),
            style: { width: "100%", padding: "12px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", position: "relative" }
          },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 } },
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 2 } },
                  React.createElement("div", { style: { fontSize: 10, fontWeight: 600, color: C.textM, letterSpacing: 0.5 } }, "НЕДЕЛЯ ", b.n),
                  isCurrent && React.createElement("div", { style: { fontSize: 9, fontWeight: 600, color: "#fff", background: C.olive, padding: "2px 7px", borderRadius: 4 } }, "СЕЙЧАС"),
                  isPast && !isCurrent && React.createElement("div", { style: { fontSize: 9, fontWeight: 600, color: C.textL, background: C.bgWarm, padding: "2px 7px", borderRadius: 4 } }, "✓ Пройдён")
                ),
                React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: isCurrent ? C.oliveDeep : C.text } }, b.title),
                React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2, fontStyle: "italic" } }, b.subtitle)
              ),
              React.createElement("div", { style: { fontSize: 14, color: C.textL, flexShrink: 0 } }, isOpen ? "▲" : "▼")
            )
          ),

          // Содержимое блока (если открыт)
          isOpen && React.createElement("div", { style: { padding: "0 14px 14px" } },
            // Цель недели
            React.createElement("div", {
              style: { background: C.sandSoft, borderRadius: 10, padding: "10px 12px", marginBottom: 10, border: `0.5px solid ${C.sand}33` }
            },
              React.createElement("div", { style: { fontSize: 10, fontWeight: 600, color: C.sandDeep, letterSpacing: 0.5, marginBottom: 4 } }, "ЦЕЛЬ НЕДЕЛИ"),
              React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.6 } }, b.goal)
            ),

            // Секции
            b.sections.map((s, si) => {
              const accentClr = s.warn ? C.warn : s.ok ? C.sand : C.bark;
              const accentBg = s.warn ? C.warnSoft : s.ok ? C.sandSoft : C.barkSoft;
              return React.createElement("div", {
                key: si,
                style: { background: accentBg, borderRadius: 10, padding: "10px 12px", marginBottom: 8, border: `1px solid ${accentClr}33` }
              },
                React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: accentClr, marginBottom: 6 } }, s.h),
                s.items.map((item, ii) => React.createElement("div", {
                  key: ii,
                  style: { display: "flex", gap: 8, marginBottom: ii < s.items.length - 1 ? 5 : 0 }
                },
                  React.createElement("div", { style: { width: 4, height: 4, borderRadius: "50%", background: accentClr, marginTop: 7, flexShrink: 0 } }),
                  React.createElement("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.5 } }, item)
                ))
              );
            })
          )
        );
      })
      )
    );
  }

    function App() {
    const [tab, setTab] = useState("today");
    const [selDay, setSelDay] = useState(0);
    // По плану — силовые ср+пт. workoutDays = [2, 4] (среда + пятница)
    const [workoutDays, setWorkoutDays] = useLS("wDaysV3", [2, 4]);
    const [weekLog, setWeekLog] = useLS("wLog5", {});
    const [packAnchor] = useLS("packAnchorV2", defaultPackAnchor());
    // На Ярине независимого цикла нет: «месячные» = кровотечение отмены, выводится из пачки.
    // Поэтому источник для расчёта месячных — это якорь ПАЧКИ (единый источник правды).
    const cycleAnchor = packAnchor;
    const [periodOverrides] = useLS("periodOverridesV1", {});
    const [badDay, setBadDay] = useLS("badDayToday_" + new Date().toDateString(), false);
    const [userName] = useLS("userName", "Маша");
    const [onboardingDone, setOnboardingDone] = useState(() => {
      try { return localStorage.getItem("onboardingDone") === "true"; } catch { return false; }
    });

    const today = new Date();
    const todayDow = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const wk = `w${Math.floor(Date.now() / 6048e5)}`;
    const doneCount = (weekLog[wk] || []).length;
    const markDay = (dow) => {
      const cur = weekLog[wk] || [];
      const up = cur.includes(dow) ? cur.filter((d) => d !== dow) : [...cur, dow];
      setWeekLog({ ...weekLog, [wk]: up });
    };
    const DR = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

    const dayCAvailable = today >= KEY_DATES.dayCStart;
    useEffect(() => { if (!dayCAvailable && selDay === 2) setSelDay(0); }, [dayCAvailable, selDay]);

    // Текущая неделя плана — для шапки. null если до старта или после конца.
    const currentBlock = useMemo(() => {
      const t = new Date();
      t.setHours(0, 0, 0, 0);
      for (let i = 0; i < PLAN_BLOCKS.length; i++) {
        const b = PLAN_BLOCKS[i];
        const from = mkd(b.from);
        const to = mkd(b.to); to.setHours(23, 59, 59, 999);
        if (t >= from && t <= to) {
          const dayInBlock = Math.floor((t - from) / 86400000) + 1;
          const blockTotal = Math.floor((to - from) / 86400000) + 1;
          return { n: b.n, dayInBlock, blockTotal, subtitle: b.subtitle };
        }
      }
      return null;
    }, []);

    if (!onboardingDone) {
      return React.createElement(OnboardingScreen, { onDone: () => setOnboardingDone(true) });
    }

    const tabs = [
      { id: "today", l: "Сегодня", icon: "today" },
      { id: "sport", l: "Спорт", icon: "sport" },
      { id: "nutrition", l: "Питание", icon: "nutrition" },
      { id: "health", l: "Здоровье", icon: "health" },
      { id: "plan", l: "План", icon: "plan" },
      { id: "settings", l: "Настр.", icon: "settings" },
    ];

    // Проверка: есть ли алерт-точки над вкладками
    const hour = today.getHours();
    let todayHasAlert = false;
    if (hour >= 19) {
      try {
        const taken = JSON.parse(localStorage.getItem("pillsTaken_" + new Date().toLocaleDateString("ru-RU")) || "{}");
        const t = new Date(); t.setHours(0, 0, 0, 0);
        const active = activePillsOn(t, packAnchor);
        const takenN = active.filter(p => taken[p.id]).length;
        todayHasAlert = takenN < active.length;
      } catch {}
    }

    return React.createElement("div", {
      style: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: C.bg, minHeight: "100vh", color: C.text,
        maxWidth: 430, margin: "0 auto", paddingBottom: 92
      }
    },
      // ===== ШАПКА =====
      React.createElement("div", {
        style: { padding: "52px 18px 16px", background: C.bgWarm, borderBottom: `0.5px solid ${C.border}`, position: "relative", overflow: "hidden" }
      },
        React.createElement("div", { style: { position: "absolute", right: -10, bottom: -8, opacity: 0.55, pointerEvents: "none" } },
          React.createElement(FoxImage, { kind: "main", size: 88 })
        ),
        React.createElement("div", { style: { position: "relative" } },
          React.createElement("div", { style: { fontSize: 17, fontWeight: 600, color: C.text } },
            (() => { const h = new Date().getHours(); const g = h < 5 ? "Доброй ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер"; return g + ", " + userName; })()
          ),
          React.createElement("div", { style: { fontSize: 11, color: C.textM, marginTop: 2 } },
            DR[todayDow], " · ", new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
            currentBlock && React.createElement(React.Fragment, null,
              " · ",
              React.createElement("span", { style: { color: C.oliveDeep, fontWeight: 600 } },
                "Неделя ", currentBlock.n, ", день ", currentBlock.dayInBlock, "/", currentBlock.blockTotal
              )
            )
          )
        )
      ),

      // ===== КОНТЕНТ ВКЛАДКИ =====
      React.createElement("div", { style: { padding: "14px 14px 0" } },
        tab === "today" && React.createElement(TodayTab, { todayDow, DR, setTab, workoutDays, cycleAnchor, packAnchor, periodOverrides, badDay, userName }),
        tab === "plan" && React.createElement(PlanTab, null),
        tab === "sport" && React.createElement(SportTab, { workoutDays, setWorkoutDays, doneCount, weekLog, markDay, DR, todayDow, selDay, setSelDay, dayCAvailable, cycleAnchor, periodOverrides }),
        tab === "nutrition" && React.createElement(NutritionTab, null),
        tab === "health" && React.createElement(HealthTab, { cycleAnchor, packAnchor, periodOverrides }),
        tab === "settings" && React.createElement(SettingsTab, { badDay, setBadDay, setOnboardingDone, packAnchor })
      ),

      // ===== НИЖНЯЯ НАВИГАЦИЯ =====
      // Иконки в фиксированном контейнере 32px — чтобы текст под ними был на одной высоте.
      React.createElement("div", {
        style: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%",
          maxWidth: 430, background: C.card, borderTop: `0.5px solid ${C.border}`, display: "flex", padding: "6px 0 18px" }
      },
        tabs.map(t => {
          const active = tab === t.id;
          const hasAlert = t.id === "today" && todayHasAlert;
          return React.createElement("button", {
            key: t.id, onClick: () => setTab(t.id),
            "aria-label": t.l, "aria-current": active ? "page" : undefined,
            style: { flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0", position: "relative", fontFamily: "inherit" }
          },
            // Фиксированная высота контейнера иконки, центрирование
            React.createElement("div", {
              style: { position: "relative", height: 38, display: "flex", alignItems: "center", justifyContent: "center" }
            },
              React.createElement(FoxNavIcon, { kind: t.icon, size: 38, active }),
              hasAlert && React.createElement("div", {
                style: { position: "absolute", top: 0, right: "calc(50% - 20px)", width: 8, height: 8, borderRadius: "50%", background: C.olive, border: `1.5px solid ${C.card}` }
              })
            ),
            React.createElement("div", {
              style: { fontSize: 10, fontFamily: "inherit", color: active ? C.oliveDeep : C.textL,
                fontWeight: active ? 600 : 400, lineHeight: 1 }
            }, t.l),
            active && React.createElement("div", { style: { width: 16, height: 2, borderRadius: 1, background: C.olive, marginTop: 1 } })
          );
        })
      )
    );
  }
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(React.createElement(App, null));
})();
