/* CheManca? — l'app. JavaScript semplice, niente build: si apre così com'è. */
(() => {
  "use strict";
  const L = window.Logica;
  const CFG = window.CONFIG || {};
  const TABELLE = ["inventario", "prodotti", "catalogo", "spesa", "pasti", "avvisi", "piano"];
  const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/";
  const ZXING = "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/umd/zxing-browser.min.js";
  const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto",
    "settembre", "ottobre", "novembre", "dicembre"];

  /* ---------------- piccoli attrezzi ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* memoria piena o privata */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* */ } },
  };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const ddmm = (s) => s ? s.slice(8, 10) + "/" + s.slice(5, 7) : "";

  const ICONE = {
    casa: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    frigo: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14"/><path d="M9 5v2"/><path d="M9 13v3"/>',
    dispensa: '<path d="M3 9h18v12H3z"/><path d="M3 9l2-5h14l2 5"/><path d="M10 13h4"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8"/><path d="M10 8v8"/><path d="M13 8v8"/><path d="M17 8v8"/>',
    carrello: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/>',
    calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    ingranaggio: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    allarme: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    invia: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>',
    spunta: '<path d="M20 6 9 17l-5-5"/>',
    indietro: '<path d="m15 18-6-6 6-6"/>',
    cerca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    piu: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  };
  const ico = (n, size = 22, extra = "") =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICONE[n]}</svg>`;

  /* ---------------- stato dell'app ---------------- */
  const S = {
    piano: null,
    pianoFile: null,         // piano.json pubblicato insieme all'app
    db: Object.fromEntries(TABELLE.map((t) => [t, []])),
    calc: null,
    calc7: null,
    tab: LS.get("ds_tab", "oggi"),
    casaTab: "frigo",
    cercaCasa: "",
    aggTab: LS.get("ds_aggtab", "senza"),
    cercaCat: "",
    scelta: new Map(),        // nome catalogo -> { qty, luogo }
    giornoSel: null,
    sheet: null,
    chi: LS.get("ds_chi", null),
    scan: { attivo: false, stop: null, errore: "" },
    online: false,
  };
  const OGGI_FORZATO = new URLSearchParams(location.search).get("oggi");
  const oggi = () => OGGI_FORZATO || L.iso(new Date());
  const oraAdesso = () => { const d = new Date(); return OGGI_FORZATO ? Number(new URLSearchParams(location.search).get("ora") || 7) : d.getHours() + d.getMinutes() / 60; };

  /* ---------------- archivio: Supabase o solo telefono ---------------- */
  function vuoto() { return Object.fromEntries(TABELLE.map((t) => [t, []])); }

  function archivioLocale() {
    let db = LS.get("ds_db", null) || vuoto();
    for (const t of TABELLE) db[t] = db[t] || [];
    const salva = () => LS.set("ds_db", db);
    return {
      tipo: "locale",
      async carica() { return JSON.parse(JSON.stringify(db)); },
      async scrivi(t, righe) {
        for (const r of righe) db[t] = db[t].filter((x) => x.id !== r.id).concat({ ...r });
        salva();
      },
      async nuovo(t, riga) {
        if (db[t].some((x) => x.id === riga.id)) return false;
        db[t].push({ ...riga }); salva(); return true;
      },
      async modifica(t, id, patch) { db[t] = db[t].map((x) => (x.id === id ? { ...x, ...patch } : x)); salva(); },
      async elimina(t, ids) { db[t] = db[t].filter((x) => !ids.includes(x.id)); salva(); },
      ascolta() {},
      async azzera(nuovoDb) { db = nuovoDb || vuoto(); salva(); },
    };
  }

  function archivioSupabase(url, anon) {
    const sb = window.supabase.createClient(url, anon);
    return {
      tipo: "supabase",
      async carica() {
        const out = {};
        await Promise.all(TABELLE.map(async (t) => {
          const { data, error } = await sb.from(t).select("*");
          if (error) throw error;
          out[t] = data;
        }));
        return out;
      },
      async scrivi(t, righe) {
        const { error } = await sb.from(t).upsert(righe);
        if (error) throw error;
      },
      async nuovo(t, riga) {
        const { error } = await sb.from(t).insert(riga);
        if (!error) return true;
        if (error.code === "23505") return false;   // c'è già: l'ha preso l'altro telefono
        throw error;
      },
      async modifica(t, id, patch) {
        const { error } = await sb.from(t).update(patch).eq("id", id);
        if (error) throw error;
      },
      async elimina(t, ids) {
        if (!ids.length) return;
        const { error } = await sb.from(t).delete().in("id", ids);
        if (error) throw error;
      },
      ascolta(cb) {
        const ch = sb.channel("dispensa");
        for (const t of TABELLE) ch.on("postgres_changes", { event: "*", schema: "public", table: t }, cb);
        ch.subscribe((stato) => { S.online = stato === "SUBSCRIBED"; renderTesta(); });
      },
      async azzera() {
        for (const t of TABELLE) await sb.from(t).delete().neq("id", "");
      },
    };
  }

  const sbUrl = LS.get("ds_sb_url", "") || CFG.SUPABASE_URL;
  const sbAnon = LS.get("ds_sb_anon", "") || CFG.SUPABASE_ANON;
  const condiviso = !!(CFG.CONDIVISIONE && sbUrl && sbAnon && window.supabase);
  const esterni = !!CFG.AVVISI_ESTERNI;
  const A = condiviso ? archivioSupabase(sbUrl, sbAnon) : archivioLocale();

  // scritture: prima a video (subito), poi nell'archivio
  function inMemoria(t, righe) {
    for (const r of righe) {
      const i = S.db[t].findIndex((x) => x.id === r.id);
      if (i >= 0) S.db[t][i] = { ...S.db[t][i], ...r }; else S.db[t].push({ ...r });
    }
  }
  async function salva(t, righe) {
    righe = [].concat(righe).map((r) => ({ id: r.id || uid(), ...r }));
    inMemoria(t, righe);
    try { await A.scrivi(t, righe); } catch (e) { erroreArchivio(e); }
    return righe;
  }
  async function modifica(t, id, patch) {
    inMemoria(t, [{ id, ...patch }]);
    try { await A.modifica(t, id, patch); } catch (e) { erroreArchivio(e); }
  }
  async function elimina(t, ids) {
    ids = [].concat(ids);
    S.db[t] = S.db[t].filter((x) => !ids.includes(x.id));
    try { await A.elimina(t, ids); } catch (e) { erroreArchivio(e); }
  }
  function erroreArchivio(e) {
    console.error(e);
    toast("Non riesco a salvare: " + (e.message || e) + ". Ricarico i dati.");
    ricarica();
  }

  let attesaRicarica = null;
  async function ricarica() {
    try {
      S.db = await A.carica();
      dopoModifica(false);
    } catch (e) {
      console.error(e);
      toast("Database non raggiungibile: " + (e.message || e));
    }
  }
  function ricaricaPresto() {
    clearTimeout(attesaRicarica);
    attesaRicarica = setTimeout(ricarica, 400);
  }

  /* ---------------- ricalcolo dopo ogni modifica ---------------- */
  function statiPasti() { return Object.fromEntries(S.db.pasti.map((p) => [p.id, p])); }

  // il piano caricato dall'app (PDF o JSON) sta nel database, così vale per tutti e due i telefoni;
  // la riga c'è ma vuota = piano svuotato. Senza riga si usa piano.json pubblicato con l'app.
  function scegliPiano() {
    const r = S.db.piano.find((x) => x.id === "attuale");
    S.piano = r ? r.dati || null : S.pianoFile;
    if (S.piano && S.pianoFile && !Object.keys(S.piano.categorie || {}).length) S.piano.categorie = S.pianoFile.categorie;
  }

  function ricalcola() {
    scegliPiano();
    if (!S.piano) { S.calc = { mancanze: [], totaleVoci: 0, pronte: 0, pasti: [] }; S.calc7 = S.calc; return; }
    const inv = S.db.inventario;
    S.calc = L.calcolaMancanze(S.piano, inv, statiPasti(), oggi(), 3, oraAdesso());
    S.calc7 = L.calcolaMancanze(S.piano, inv, statiPasti(), oggi(), 7, oraAdesso());
  }

  let allineando = false;
  async function allineaSpesa() {
    if (allineando || !S.calc) return;
    allineando = true;
    try {
      const ops = L.allineaSpesa(S.db.spesa, S.calc.mancanze, oggi());
      // id fisso per le voci dal piano: due telefoni che allineano insieme non creano doppioni
      const nuove = ops.inserisci.map((r) => ({ ...r, id: "piano:" + r.voce, creato: new Date().toISOString() }));
      if (nuove.length) await salva("spesa", nuove);
      for (const r of ops.aggiorna) await modifica("spesa", r.id, r);
      if (ops.elimina.length) await elimina("spesa", ops.elimina);
    } finally { allineando = false; }
  }

  function dopoModifica(scrivi = true) {
    ricalcola();
    render();
    if (scrivi !== null) {
      allineaSpesa().then(() => { renderNav(); if (S.tab === "spesa") render(); });
      controllaAvvisi();
    }
  }

  /* ---------------- avvisi: Telegram e WhatsApp ---------------- */
  const tg = () => LS.get("ds_tg", { token: "", chat: "" });
  const wa = () => LS.get("ds_wa", { max: { tel: "", key: "" }, vale: { tel: "", key: "" } });
  const avvisiAttivi = () => { const t = tg(); return esterni && !!(t.token && t.chat); };
  const whatsappAttivo = () => { const w = wa(); return esterni && !!((w.max.tel && w.max.key) || (w.vale.tel && w.vale.key)); };

  async function inviaTelegram(html) {
    const t = tg();
    if (!t.token || !t.chat) throw new Error("Telegram non configurato");
    // form-urlencoded: è una richiesta "semplice", il browser non fa la verifica preliminare che Telegram rifiuta
    const corpo = new URLSearchParams({ chat_id: t.chat, text: html, parse_mode: "HTML", disable_web_page_preview: "true" });
    const r = await fetch(`https://api.telegram.org/bot${t.token}/sendMessage`, { method: "POST", body: corpo });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) throw new Error(j.description || "Telegram ha rifiutato il messaggio");
  }
  async function inviaWhatsapp(testo) {
    const w = wa();
    for (const p of [w.max, w.vale]) {
      if (!p.tel || !p.key) continue;
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(p.tel)}&text=${encodeURIComponent(testo)}&apikey=${encodeURIComponent(p.key)}`;
      // CallMeBot non permette di leggere la risposta dal browser: si spedisce e basta
      await fetch(url, { mode: "no-cors" }).catch(() => {});
    }
  }
  async function inviaAvviso(html) {
    const errori = [];
    if (avvisiAttivi()) await inviaTelegram(html).catch((e) => errori.push("Telegram: " + e.message));
    if (whatsappAttivo()) await inviaWhatsapp(L.testoSemplice(html));
    if (errori.length) throw new Error(errori.join(" · "));
  }

  let controllando = false;
  async function controllaAvvisi() {
    if (controllando || !S.calc || !(avvisiAttivi() || whatsappAttivo())) return;
    controllando = true;
    try {
      const urgenti = S.calc.mancanze.filter((m) => m.urgente);
      const giaFatti = new Set(S.db.avvisi.map((a) => a.id));
      const nuove = [];
      for (const m of urgenti) {
        const id = "urgente:" + m.voce + "|" + m.data;
        if (giaFatti.has(id)) continue;
        // chi registra per primo l'avviso lo spedisce: l'altro telefono trova la riga e tace
        const riga = { id, inviato: new Date().toISOString(), da: S.chi || "" };
        if (await A.nuovo("avvisi", riga)) { inMemoria("avvisi", [riga]); nuove.push(m); }
      }
      if (!nuove.length) return;
      const html = L.testoAvviso(nuove, oggi(), { titolo: "CheManca? · manca qualcosa", soloUrgenti: true, link: CFG.APP_URL });
      if (html) await inviaAvviso(html);
    } catch (e) {
      console.error(e);
      toast("Avviso non inviato: " + e.message);
    } finally { controllando = false; }
  }

  /* ---------------- testata e barra ---------------- */
  function testa(sopra, titolo, conIndietro) {
    return `<header class="top">
      <div style="display:flex;align-items:center;gap:6px;min-width:0">
        ${conIndietro ? `<button class="icona-btn" data-a="vai" data-tab="${conIndietro}" aria-label="Indietro">${ico("indietro")}</button>` : ""}
        <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
          ${sopra ? `<span class="sopra">${esc(sopra)}</span>` : ""}
          <h1>${esc(titolo)}</h1>
        </div>
      </div>
      <div class="top-dx">
        ${condiviso ? `<span class="stato-rete on" id="stato-rete">${S.online ? "Condiviso" : "Condiviso…"}</span>` : ""}
        ${conIndietro ? "" : `<button class="icona-btn" data-a="vai" data-tab="imp" aria-label="Impostazioni">${ico("ingranaggio")}</button>`}
      </div>
    </header>`;
  }
  function renderTesta() {
    const el = $("#stato-rete");
    if (el) el.textContent = condiviso ? (S.online ? "Condiviso" : "Condiviso…") : "Solo qui";
  }

  function renderNav() {
    const daPrendere = S.db.spesa.filter((s) => !s.fatto).length;
    const mancano = S.calc7 ? S.calc7.mancanze : [];
    const liv = mancano.length ? Math.min(...mancano.map((m) => livello(m.data))) : 0;
    const extra = (tab) => tab === "spesa" && daPrendere ? `<span class="badge">${daPrendere}</span>`
      : tab === "oggi" && mancano.length ? `<span class="badge liv-${liv}" aria-label="${mancano.length} cibi mancano">${mancano.length}</span>` : "";
    const b = (tab, nome, icona) => `<button data-a="vai" data-tab="${tab}" ${S.tab === tab ? 'aria-current="page"' : ""}>${ico(icona)}${nome}${extra(tab)}</button>`;
    $("#nav").innerHTML = b("oggi", "Oggi", "casa") + b("casa", "Casa", "frigo") +
      `<button class="centro" data-a="vai" data-tab="aggiungi" aria-label="Aggiungi prodotti" ${S.tab === "aggiungi" ? 'aria-current="page"' : ""}>${ico("scan", 28)}</button>` +
      b("spesa", "Spesa", "carrello") + b("piano", "Piano", "calendario");
  }

  /* ---------------- OGGI ---------------- */
  function daConfermare() {
    if (!S.piano) return [];
    const stati = statiPasti();
    const out = [];
    const adesso = oraAdesso();
    for (const [i, data] of [[-1, L.piuGiorni(oggi(), -1)], [0, oggi()]]) {
      const g = L.giornoPiano(S.piano, data);
      if (!g) continue;
      for (const p of g.pasti) {
        if (p.libero || p.pasto === "Fuori pasto") continue;
        const k = L.chiavePasto(data, p.pasto);
        if (stati[k]) continue;
        if (i === 0 && L.ORA[p.pasto] + 1 > adesso) continue;
        out.push({ ...p, data, chiave: k });
      }
    }
    return out;
  }

  function descrPasto(p) {
    if (p.piatti && p.piatti.length) return p.piatti.join(", ");
    const nomi = p.voci.filter((v) => !L.PRESENZA.has(v.u) && !L.GENERICHE.has(v.nome)).map((v) => v.nome);
    return (nomi.length ? nomi : p.voci.map((v) => v.nome)).slice(0, 3).join(", ");
  }

  function schermoOggi() {
    const d = L.daIso(oggi());
    const sopra = cap(L.GIORNI[d.getDay()]) + " " + d.getDate() + " " + MESI[d.getMonth()];
    if (!S.piano) return testa(sopra, "Ciao") + `<div class="corpo"><p class="vuoto">Manca il piano: carica <code>piano.json</code> da Impostazioni.</p></div>`;
    const c = S.calc;
    const manca = c.mancanze.filter((m) => m.tipo === "manca").length;
    const scarso = c.mancanze.length - manca;
    const g0 = L.giornoPiano(S.piano, oggi());
    const fine = L.etichettaData(L.piuGiorni(oggi(), 2));
    let h = testa(sopra, "Ciao " + (S.chi === "vale" ? "Vale" : S.chi === "max" ? "Max" : ""));
    h += `<div class="corpo">`;
    if (g0 && g0.oltre) h += `<div class="avviso giallo">Il piano del mese è finito e sta ricominciando dalla settimana 1. Carica il nuovo da Impostazioni.</div>`;
    h += `<section class="riepilogo" aria-label="Prossimi 3 giorni">
      <div class="r1"><span>Prossimi 3 giorni · fino a ${esc(fine)}</span><span>Settimana ${g0 ? g0.settimana : "–"}</span></div>
      <div style="display:flex;align-items:baseline;gap:8px"><span class="num">${c.pronte}<small>/${c.totaleVoci}</small></span><span style="font-size:15px;font-weight:600">ingredienti in casa</span></div>
      <div class="barra" aria-hidden="true"><span style="flex:${c.pronte}"></span><span style="flex:${scarso}"></span><span style="flex:${manca}"></span></div>
      <div class="conti"><span>${manca} mancano</span><span>${scarso} scarseggiano</span><span>${c.pronte} pronti</span></div>
    </section>`;

    const conf = daConfermare();
    if (conf.length) {
      h += `<div class="titolo-sez"><h2>Com'è andata?</h2></div><div class="card">`;
      for (const p of conf.slice(0, 4)) {
        h += `<div class="riga" style="flex-wrap:wrap">
          <div class="testo"><span class="nome">${esc(p.pasto)} di ${esc(L.nomeGiorno(p.data, oggi()))}</span><span class="nota">${esc(descrPasto(p))}</span></div>
          <div style="display:flex;gap:6px">
            <button class="btn piccolo" data-a="pasto" data-k="${esc(p.chiave)}" data-stato="fatto">Fatto</button>
            <button class="btn piccolo sec" data-a="pasto-altro" data-k="${esc(p.chiave)}">Altro</button>
          </div></div>`;
      }
      h += `</div><p style="font-size:12px;color:var(--muted);padding:0 4px">Con «Fatto» le dosi del piano escono dal frigo e dalla dispensa.</p>`;
    }

    h += sezioneCosaManca();

    if (g0) {
      const stati = statiPasti();
      const restanti = g0.pasti.filter((p) => !p.libero && p.pasto !== "Fuori pasto" && !stati[L.chiavePasto(oggi(), p.pasto)]);
      if (restanti.length) {
        h += `<div class="titolo-sez"><h2>Oggi si mangia</h2><button class="link" data-a="vai" data-tab="piano">Piano →</button></div><div class="due">`;
        for (const p of restanti) {
          const buchi = c.mancanze.filter((m) => m.pasti.some((x) => x.data === oggi() && x.pasto === p.pasto));
          h += `<button data-a="vai" data-tab="piano" style="background:#fff;border:0;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:4px;text-align:left">
            <span style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">${esc(p.pasto)}</span>
            <span style="font-size:14px;font-weight:700;line-height:1.3">${esc(descrPasto(p))}</span>
            <span style="font-size:13px;font-weight:700;color:${buchi.length ? "var(--red)" : "var(--green)"}">${buchi.length ? "Manca: " + esc(buchi.map((b) => b.voce).join(", ")) : "Tutto in casa"}</span>
          </button>`;
        }
        h += `</div>`;
      }
    }
    return h + `</div>`;
  }

  /* ---------- i badge: cosa manca, colorato per quanto è vicino ----------
     rosso = serve oggi · arancio = domani · giallo = dopodomani · verde = più avanti (c'è tempo) */
  const LIVELLI = [
    { nome: "Oggi", breve: "oggi" },
    { nome: "Domani", breve: "domani" },
    { nome: "Dopodomani", breve: "dopodomani" },
    { nome: "Più avanti", breve: "più avanti" },
  ];
  function livello(data) { return Math.min(3, Math.max(0, L.diffGiorni(oggi(), data))); }

  function sezioneCosaManca() {
    const tutte = S.calc7 ? S.calc7.mancanze : [];
    const gruppi = [[], [], [], []];
    for (const m of tutte) gruppi[livello(m.data)].push(m);
    let h = `<div class="titolo-sez"><h2>Cosa manca</h2><button class="link" data-a="vai" data-tab="spesa">Lista spesa →</button></div>`;
    if (!tutte.length) {
      return h + `<div class="avviso verde">${ico("spunta", 20)}<span>Per tutta la settimana avete quello che serve.</span></div>`;
    }
    // la legenda fa anche da riassunto: quanti per ogni giorno
    h += `<div class="legenda-liv" aria-hidden="true">` + LIVELLI.map((l, i) =>
      `<span class="liv-${i}"><i></i>${l.nome}<b>${gruppi[i].length}</b></span>`).join("") + `</div>`;
    gruppi.forEach((g, i) => {
      if (!g.length) return;
      const quando = i < 3 ? L.etichettaData(L.piuGiorni(oggi(), i)) : "nei prossimi giorni";
      h += `<section class="gruppo-manca liv-${i}" aria-label="${LIVELLI[i].nome}: ${g.length} da comprare">
        <div class="gm-testa"><span class="gm-punto" aria-hidden="true"></span><b>${LIVELLI[i].nome}</b><span>${esc(quando)}</span><span class="gm-conta">${g.length}</span></div>
        <div class="gm-badge">`;
      // il verde (c'è tempo) può essere lungo: si mostrano i primi e il resto a richiesta
      const visibili = i === 3 && !S.tuttiVerdi ? g.slice(0, 6) : g;
      for (const m of visibili) {
        const q = L.quantitaSpesa(m);
        const quale = i === 3 ? L.etichettaData(m.data) + " · " + m.pasto.toLowerCase() : m.pasto.toLowerCase();
        h += `<button class="badge-manca" data-a="mancanza" data-voce="${esc(m.voce)}">
          <span class="bm-nome">${esc(m.voce)}${m.tipo === "scarso" ? '<span class="bm-poco">poco</span>' : ""}</span>
          <span class="bm-info">${esc(quale)}${q ? " · " + esc(q) : ""}</span></button>`;
      }
      if (visibili.length < g.length) h += `<button class="altri-manca" data-a="tutti-verdi">+ altri ${g.length - visibili.length}</button>`;
      h += `</div></section>`;
    });
    return h;
  }

  function rigaMancanza(m) {
    const col = m.tipo === "scarso" ? "giallo" : "rosso";
    const q = L.quantitaSpesa(m);
    return `<button class="riga" data-a="mancanza" data-voce="${esc(m.voce)}">
      <span class="pallino ${col}" aria-hidden="true"></span>
      <span class="testo"><span class="nome">${esc(m.voce)}</span><span class="nota">${esc(L.motivo(m, oggi()))}</span></span>
      <span class="q" style="color:${m.tipo === "scarso" ? "var(--amber)" : "var(--red)"}">${m.tipo === "scarso" ? "Scarso" : "Manca"}${q ? `<br><span style="font-size:12px;color:var(--muted)">${esc(q)}</span>` : ""}</span>
    </button>`;
  }

  /* ---------------- CASA ---------------- */
  function schermoCasa() {
    const inv = S.db.inventario.filter((i) => Number(i.qty) > 0);
    const frigo = inv.filter((i) => i.luogo === "frigo");
    const disp = inv.filter((i) => i.luogo !== "frigo");
    const lista = (S.casaTab === "frigo" ? frigo : disp)
      .filter((i) => !S.cercaCasa || i.nome.toLowerCase().includes(S.cercaCasa.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome, "it"));
    const tra2 = L.piuGiorni(oggi(), 2);
    let h = testa("", "In casa");
    h += `<div class="corpo">
      <div class="segmenti" role="tablist">
        <button role="tab" aria-pressed="${S.casaTab === "frigo"}" data-a="casa-tab" data-v="frigo">Frigo · ${frigo.length}</button>
        <button role="tab" aria-pressed="${S.casaTab === "dispensa"}" data-a="casa-tab" data-v="dispensa">Dispensa · ${disp.length}</button>
      </div>
      <label class="cerca">${ico("cerca", 18)}<span class="sr">Cerca un prodotto</span>
        <input id="cerca-casa" type="search" placeholder="Cerca: uova, ricotta, pesce…" value="${esc(S.cercaCasa)}" data-in="cercaCasa"></label>`;
    if (!lista.length) {
      h += `<p class="vuoto">${S.cercaCasa ? "Nessun prodotto con questo nome." : S.casaTab === "frigo" ? "Il frigo è vuoto. Aggiungi la spesa con il tasto verde." : "La dispensa è vuota."}</p>`;
    } else {
      h += `<div class="card">`;
      for (const it of lista) {
        const voce = (it.voci || [])[0];
        const note = [];
        let cls = "";
        if (it.scadenza) {
          if (it.scadenza < oggi()) { note.push("Scaduto il " + ddmm(it.scadenza)); cls = "err"; }
          else if (it.scadenza <= tra2) { note.push("Scade " + L.nomeGiorno(it.scadenza, oggi())); cls = "warn"; }
          else note.push("Scade il " + ddmm(it.scadenza));
        }
        if (voce && voce !== it.nome) note.push("conta come " + voce);
        if (!voce) note.push("non è nel piano");
        h += `<button class="riga" data-a="modifica-item" data-id="${esc(it.id)}">
          <span class="testo"><span class="nome">${esc(it.nome)}${it.manuale ? '<span class="mini-tag">a mano</span>' : ""}</span>
          <span class="nota ${cls}">${esc(note.join(" · "))}</span></span>
          <span class="q">${esc(L.fmtScorta(it))}</span></button>`;
      }
      h += `</div>`;
    }
    return h + `</div>`;
  }

  /* ---------------- AGGIUNGI ---------------- */
  function catalogo() {
    const propri = S.db.catalogo.map((c) => ({ ...c, proprio: true }));
    const nomi = new Set(propri.map((c) => c.nome.toLowerCase()));
    return [...window.CATALOGO_BASE.filter((c) => !nomi.has(c.nome.toLowerCase())), ...propri];
  }
  const voceMancante = () => new Set((S.calc ? S.calc.mancanze : []).map((m) => m.voce));

  function fmtScelta(c, qty) {
    if (c.unita === "g") return qty >= 1000 ? L.fmtNum(qty / 1000) + " kg" : qty + " g";
    return "×" + qty;
  }

  function schermoAggiungi() {
    let h = testa("", "Aggiungi");
    h += `<div class="corpo">
      <div class="segmenti">
        <button aria-pressed="${S.aggTab === "codice"}" data-a="agg-tab" data-v="codice">Codice a barre</button>
        <button aria-pressed="${S.aggTab === "senza"}" data-a="agg-tab" data-v="senza">Senza codice</button>
      </div>`;
    if (S.aggTab === "codice") h += pannelloScanner();
    else h += pannelloSenzaCodice();
    return h + `</div>`;
  }

  function pannelloScanner() {
    let h = `<div class="spazio-camera" id="posto-camera">`;
    if (!S.scan.attivo) {
      h += S.scan.errore
        ? `<span>${esc(S.scan.errore)}</span><button class="btn piccolo" data-a="scan-avvia">Riprova</button>`
        : `<span>Inquadra il codice a barre del prodotto</span><button class="btn piccolo" data-a="scan-avvia">${ico("scan", 18)} Avvia fotocamera</button>`;
    }
    h += `</div>
      <form data-form="ean" style="display:flex;gap:8px">
        <label class="sr" for="ean">Codice a barre a mano</label>
        <input class="input" id="ean" inputmode="numeric" placeholder="Oppure scrivi il codice (EAN)" style="flex:1">
        <button class="btn piccolo" style="min-height:52px">Cerca</button>
      </form>`;
    const recenti = [...S.db.prodotti].sort((a, b) => (b.usato || "").localeCompare(a.usato || "")).slice(0, 8);
    if (recenti.length) {
      h += `<div class="titolo-sez"><h2>Già scansionati</h2></div>
        <p style="font-size:13px;color:var(--muted);padding:0 4px;margin-top:-8px">Un tap per rimetterli in casa senza scansionare.</p><div class="card">`;
      for (const p of recenti) {
        h += `<button class="riga" data-a="prodotto-noto" data-ean="${esc(p.id)}">
          <span class="testo"><span class="nome">${esc(p.nome)}</span><span class="nota">${esc((p.voci || [])[0] || "fuori piano")} · ${p.luogo === "frigo" ? "frigo" : "dispensa"}</span></span>
          <span class="pill ${p.luogo === "frigo" ? "frigo" : "dispensa"}">${p.conf_qty ? esc(p.conf_qty + " " + (p.conf_unita || "g")) : "+1"}</span></button>`;
      }
      h += `</div>`;
    }
    return h;
  }

  function pannelloSenzaCodice() {
    const mancano = voceMancante();
    const q = S.cercaCat.trim().toLowerCase();
    const cat = catalogo().filter((c) => !q || c.nome.toLowerCase().includes(q));
    let h = `<label class="cerca">${ico("cerca", 18)}<span class="sr">Cerca nell'elenco</span>
      <input id="cerca-cat" type="search" placeholder="Cerca: mele, zucchine, spigola…" value="${esc(S.cercaCat)}" data-in="cercaCat"></label>
      <p style="font-size:13px;color:var(--muted);padding:0 4px">Ogni tap aggiunge un pezzo (o un etto). Il punto rosso indica cosa serve al piano.</p>`;
    for (const gr of window.GRUPPI_CATALOGO) {
      const voci = cat.filter((c) => (c.gruppo || "Altro") === gr);
      if (!voci.length && (q || gr !== "Altro")) continue;
      h += `<section class="gruppo"><h3>${esc(gr)}</h3><div class="chips">`;
      for (const c of voci) {
        const sel = S.scelta.get(c.nome);
        const serve = (c.voci || []).some((v) => mancano.has(v));
        h += `<button class="chip ${sel ? "scelto" : ""} ${serve ? "manca" : ""}" data-a="tap" data-nome="${esc(c.nome)}" aria-label="${esc(c.nome)}${sel ? ", scelti " + fmtScelta(c, sel.qty) : ""}${serve ? ", serve al piano" : ""}">
          ${serve && !sel ? '<span class="punto" aria-hidden="true"></span>' : ""}${esc(c.nome)}${sel ? `<span class="conta">${esc(fmtScelta(c, sel.qty))}</span>` : ""}</button>`;
      }
      if (!q) h += `<button class="chip nuovo" data-a="nuovo-cat" data-gruppo="${esc(gr)}">${ico("piu", 16)} Nuovo</button>`;
      h += `</div></section>`;
    }
    if (q && !cat.length) h += `<button class="btn sec largo" data-a="nuovo-cat" data-gruppo="Altro" data-nome="${esc(S.cercaCat)}">${ico("piu", 18)} Aggiungi «${esc(S.cercaCat)}» all'elenco</button>`;
    if (S.scelta.size) {
      h += `<div style="height:60px"></div><div class="barra-scelta"><button class="btn" data-a="rivedi">${S.scelta.size} ${S.scelta.size === 1 ? "prodotto" : "prodotti"} · Rivedi e salva</button></div>`;
    }
    return h;
  }

  /* ---------------- SPESA ---------------- */
  function schermoSpesa() {
    const lista = [...S.db.spesa].sort((a, b) =>
      (a.fatto ? 1 : 0) - (b.fatto ? 1 : 0) ||
      ["urgente", "entro", "dopo"].indexOf(a.urgenza || "dopo") - ["urgente", "entro", "dopo"].indexOf(b.urgenza || "dopo") ||
      (a.data_serve || "9").localeCompare(b.data_serve || "9"));
    const daPrendere = lista.filter((s) => !s.fatto).length;
    const presi = lista.filter((s) => s.fatto).length;
    let h = testa("", "Spesa");
    h += `<div class="corpo">
      <p style="font-size:14px;color:var(--muted);padding:0 4px;margin-top:-6px">${daPrendere} da prendere · si aggiorna da sola con quello che manca nei prossimi 3 giorni</p>`;
    if (!esterni) {
      // avvisi solo dentro l'app per ora
    } else if (avvisiAttivi() || whatsappAttivo()) {
      const ultimo = [...S.db.avvisi].sort((a, b) => (b.inviato || "").localeCompare(a.inviato || ""))[0];
      h += `<div class="avviso blu">${ico("invia", 20)}<span style="flex:1"><b>Avvisi attivi</b> su ${[avvisiAttivi() && "Telegram", whatsappAttivo() && "WhatsApp"].filter(Boolean).join(" e ")}${ultimo ? `<br>Ultimo: ${esc(new Date(ultimo.inviato).toLocaleString("it-IT", { weekday: "short", hour: "2-digit", minute: "2-digit" }))}` : ""}</span>
        <button class="mini-link" data-a="avvisa-ora" style="color:var(--blue-dark)">Invia ora</button></div>`;
    } else {
      h += `<button class="avviso giallo" data-a="vai" data-tab="imp" style="border:0;text-align:left">${ico("invia", 20)}<span>Gli avvisi su Telegram o WhatsApp non sono attivi su questo telefono. <b>Attivali</b></span></button>`;
    }
    h += `<form data-form="spesa-nuova" style="display:flex;gap:8px">
        <label class="sr" for="nuova-voce">Aggiungi alla lista</label>
        <input class="input" id="nuova-voce" placeholder="Aggiungi: caffè, detersivo…" style="flex:1" autocomplete="off">
        <button class="btn piccolo" style="min-height:52px" aria-label="Aggiungi">${ico("piu", 20)}</button>
      </form>`;
    if (!lista.length) h += `<p class="vuoto">Lista vuota: per i prossimi 3 giorni avete tutto.</p>`;
    for (const s of lista) {
      const tag = s.data_serve && s.origine === "piano"
        ? `<span class="pill liv-${livello(s.data_serve)}">Serve ${esc(L.nomeGiorno(s.data_serve, oggi()))}</span>`
        : `<span class="pill dopo">Quando capita</span>`;
      const chi = s.prende ? `<span class="pill grigio">Lo prende ${s.prende === "vale" ? "Vale" : "Max"}</span>`
        : `<button class="mini-link" data-a="prendo" data-id="${esc(s.id)}">Lo prendo io</button>`;
      h += `<div class="voce-spesa ${s.fatto ? "fatto" : ""}">
        <button class="spunta" role="checkbox" aria-checked="${!!s.fatto}" aria-label="Preso: ${esc(s.nome)}" data-a="spunta" data-id="${esc(s.id)}"><span>${s.fatto ? ico("spunta", 16, 'stroke="#fff" stroke-width="3"') : ""}</span></button>
        <div class="testo"><span class="nome">${esc(s.nome)}</span>
          <span class="perche">${esc(s.origine === "piano" ? s.motivo : "Aggiunto a mano" + (s.creato_da ? " da " + (s.creato_da === "vale" ? "Vale" : "Max") : ""))}</span>
          <span class="tags">${tag}${s.fatto ? "" : chi}${s.origine !== "piano" ? `<button class="mini-link" data-a="togli-spesa" data-id="${esc(s.id)}" style="color:var(--muted)">Togli</button>` : ""}</span></div>
        <span class="q">${esc(s.qty_txt || "")}</span></div>`;
    }
    h += `<div class="due" style="margin-top:4px">
        <button class="btn sec" data-a="whatsapp-lista">Manda su WhatsApp</button>
        <button class="btn" data-a="metti-in-casa" ${presi ? "" : "disabled"}>Metti in casa (${presi})</button>
      </div>`;
    return h + `</div>`;
  }

  /* ---------------- PIANO ---------------- */
  function schermoPiano() {
    if (!S.piano) return testa("", "Piano dieta") + `<div class="corpo"><p class="vuoto">Nessun piano caricato.</p></div>`;
    const sel = S.giornoSel || oggi();
    const g = L.giornoPiano(S.piano, sel);
    const mancanze = S.calc7 ? S.calc7.mancanze : [];
    const stati = statiPasti();
    let h = testa("", "Piano dieta");
    h += `<div class="giorni" role="group" aria-label="Giorno">`;
    for (let i = -1; i < 7; i++) {
      const d = L.piuGiorni(oggi(), i);
      const n = new Set(mancanze.flatMap((m) => m.pasti.filter((p) => p.data === d).map(() => m.voce))).size;
      const nome = i === -1 ? "Ieri" : i === 0 ? "Oggi" : i === 1 ? "Domani" : cap(L.GIORNI[L.daIso(d).getDay()]).slice(0, 3);
      h += `<button data-a="giorno" data-d="${d}" aria-pressed="${d === sel}"><small>${nome}</small><b>${esc(L.etichettaData(d))}</b>${n && i >= 0 ? `<span class="badge liv-${Math.min(3, i)}">${n}</span>` : ""}</button>`;
    }
    h += `</div>`;
    h += `<div class="legenda" style="margin:10px 0"><span><i style="background:var(--max)"></i>Max</span><span><i style="background:var(--vale)"></i>Vale</span><span style="margin-left:auto">${g ? "Settimana " + g.settimana : ""}</span></div>`;
    h += `<div class="corpo">`;
    if (!g) return h + `<p class="vuoto">Il piano comincia il ${esc(ddmm(S.piano.inizio))}.</p></div>`;
    const dove = (voce) => {
      const it = S.db.inventario.find((i) => Number(i.qty) > 0 && (i.voci || []).includes(voce));
      return it ? it.luogo : null;
    };
    for (const p of g.pasti) {
      const k = L.chiavePasto(sel, p.pasto);
      const st = stati[k];
      const buchi = new Map(mancanze.flatMap((m) => m.pasti.filter((x) => x.data === sel && x.pasto === p.pasto).map(() => [m.voce, m.tipo])));
      h += `<section class="pasto"><div class="testa"><h2>${esc(p.pasto)}</h2>`;
      if (st) h += `<span class="pill ${st.stato === "saltato" ? "grigio" : "ok"}">${esc(st.stato === "saltato" ? "Saltato" : st.stato === "fatto" ? "Fatto" : "Solo " + (st.stato === "vale" ? "Vale" : "Max"))}</span>`;
      else if (buchi.size) h += `<span style="font-size:12px;font-weight:800;color:var(--red)">${buchi.size === 1 ? "1 ingrediente manca" : buchi.size + " mancano"}</span>`;
      h += `</div>`;
      if (p.libero) { h += `<div class="piatto">Pasto libero</div></section>`; continue; }
      if (p.piatti && p.piatti.length) h += `<div class="piatto">${esc(p.piatti.join(" · "))}</div>`;
      for (const v of p.voci) {
        const b = buchi.get(v.nome);
        const f = (x) => (x == null ? "–" : L.PRESENZA.has(v.u) ? x + " " + v.u.replace("cucchiaini", "cucch.").replace("cucchiaino", "cucch.").replace("tazzina", "tazz.") : L.fmtQ(x, v.u));
        let pill;
        if (st) pill = "";
        else if (b) pill = `<span class="pill ${b === "scarso" ? "scarso" : "manca"}">${b === "scarso" ? "Poco" : "Manca"}</span>`;
        else { const lu = dove(v.nome); pill = lu ? `<span class="pill ${lu}">${lu === "frigo" ? "Frigo" : "Dispensa"}</span>` : `<span class="pill grigio">—</span>`; }
        h += `<div class="voce"><span class="n ${b && !st ? "err" : ""}">${esc(v.nome)}</span><span class="m">${esc(f(v.max))}</span><span class="v">${esc(f(v.vale))}</span>${pill}</div>`;
      }
      if (sel <= oggi()) {
        h += `<div class="azioni">` + (st
          ? `<button class="btn piccolo sec" data-a="pasto-annulla" data-k="${esc(k)}">Annulla «${esc(st.stato === "saltato" ? "saltato" : "fatto")}»</button>`
          : `<button class="btn piccolo" data-a="pasto" data-k="${esc(k)}" data-stato="fatto">Fatto</button><button class="btn piccolo sec" data-a="pasto-altro" data-k="${esc(k)}">Altro</button>`) + `</div>`;
      }
      h += `</section>`;
    }
    return h + `</div>`;
  }

  /* ---------------- IMPOSTAZIONI ---------------- */
  function schermoImpostazioni() {
    const t = tg(); const w = wa();
    let h = testa("", "Impostazioni", "oggi");
    h += `<div class="corpo">
      <section class="sezione-imp"><h2>Chi usa questo telefono</h2>
        <div class="segmenti"><button aria-pressed="${S.chi === "max"}" data-a="chi" data-v="max">Max</button><button aria-pressed="${S.chi === "vale"}" data-a="chi" data-v="vale">Vale</button></div>
      </section>

      ${condiviso || CFG.CONDIVISIONE ? `<section class="sezione-imp"><h2>Dati condivisi</h2>
        <p>${condiviso ? "I dati stanno su Supabase: Max e Vale vedono le stesse cose in tempo reale." : "Adesso i dati restano <b>solo su questo telefono</b>. Per condividerli con l'altro telefono incolla i due valori di Supabase (README, passo 2)."}</p>
        <label class="campo">Project URL<input id="sb-url" value="${esc(LS.get("ds_sb_url", "") || CFG.SUPABASE_URL || "")}" placeholder="https://xxxx.supabase.co" autocomplete="off"></label>
        <label class="campo">Anon key<input id="sb-anon" value="${esc(LS.get("ds_sb_anon", "") || CFG.SUPABASE_ANON || "")}" placeholder="eyJ…" autocomplete="off"></label>
        <button class="btn sec" data-a="salva-sb">Salva e ricarica</button>
      </section>` : ""}
      ${esterni ? `
      <section class="sezione-imp"><h2>Avvisi su Telegram</h2>
        <p>Il bot scrive nel gruppo dove ci siete tu e Vale. Il token resta solo su questo telefono, non va nel codice.</p>
        <ol><li>Su Telegram apri <b>@BotFather</b>, scrivi <code>/newbot</code> e copia il token.</li>
          <li>Crea un gruppo con Vale e aggiungi il bot. Scrivi un messaggio qualsiasi nel gruppo.</li>
          <li>Incolla il token qui sotto e premi «Trova il gruppo».</li></ol>
        <label class="campo">Token del bot<input id="tg-token" type="password" value="${esc(t.token)}" placeholder="123456:ABC…" autocomplete="off"></label>
        <label class="campo">Chat del gruppo<input id="tg-chat" value="${esc(t.chat)}" placeholder="-100…" autocomplete="off"></label>
        <div class="due"><button class="btn sec" data-a="tg-trova">Trova il gruppo</button><button class="btn sec" data-a="tg-prova">Messaggio di prova</button></div>
        <button class="btn" data-a="tg-salva">Salva Telegram</button>
      </section>

      <section class="sezione-imp"><h2>Avvisi su WhatsApp</h2>
        <p>WhatsApp non ha un bot gratuito ufficiale. Si usa <b>CallMeBot</b> (servizio gratuito, non di Meta): ognuno di voi manda una volta <code>I allow callmebot to send me messages</code> al numero indicato su callmebot.com e riceve la sua chiave.</p>
        <div class="due"><label class="campo">Numero Max<input id="wa-max-tel" value="${esc(w.max.tel)}" placeholder="+39…" inputmode="tel"></label><label class="campo">Chiave Max<input id="wa-max-key" value="${esc(w.max.key)}" autocomplete="off"></label></div>
        <div class="due"><label class="campo">Numero Vale<input id="wa-vale-tel" value="${esc(w.vale.tel)}" placeholder="+39…" inputmode="tel"></label><label class="campo">Chiave Vale<input id="wa-vale-key" value="${esc(w.vale.key)}" autocomplete="off"></label></div>
        <div class="due"><button class="btn sec" data-a="wa-prova">Messaggio di prova</button><button class="btn" data-a="wa-salva">Salva WhatsApp</button></div>
      </section>` : `<section class="sezione-imp"><h2>Avvisi</h2>
        <p>Per ora gli avvisi stanno <b>dentro l'app</b>: la sezione «Cosa manca» in Oggi e il numero colorato sulla barra in basso. Telegram arriverà dopo.</p>
        <p>I dati restano <b>su questo telefono</b>. Per passarli all'altro: «Scarica una copia» qui e «Ripristina una copia» sull'altro.</p>
      </section>`}

      <section class="sezione-imp"><h2>Piano dieta</h2>
        <p>${S.piano ? `In uso il piano dal <b>${esc(ddmm(S.piano.inizio))}/${esc(S.piano.inizio.slice(0, 4))}</b>: ${S.piano.settimane.length === 1 ? "1 settimana che si ripete" : S.piano.settimane.length + " settimane a rotazione"} · da <code>${esc(S.piano.fonte || "piano.json")}</code>` : "<b>Nessun piano in uso.</b> Finché non ne carichi uno l'app non segnala cosa manca."}</p>
        <label class="btn" style="cursor:pointer">${ico("piu", 18)} Nuova dieta dai PDF della dietista<input type="file" accept="application/pdf,.pdf" multiple data-file="pdf" class="sr"></label>
        <p style="font-size:13px">Scegli insieme i due PDF «Dieta a menu giornaliero» (Max e Vale): l'app legge ogni giorno e unisce le dosi. Va bene anche uno solo.</p>
        <label class="btn sec" style="cursor:pointer">Carica un piano.json (4 settimane)<input type="file" accept=".json,application/json" data-file="piano" class="sr"></label>
        <div class="due">
          <button class="btn rosso" data-a="piano-svuota" ${S.piano ? "" : "disabled"}>Svuota piano</button>
          <button class="btn sec" data-a="piano-ripristina" ${S.db.piano.length && S.pianoFile ? "" : "disabled"}>Piano pubblicato</button>
        </div>
      </section>

      <section class="sezione-imp"><h2>Dati</h2>
        <button class="btn sec" data-a="demo">Carica dati di esempio</button>
        <button class="btn sec" data-a="backup">Scarica una copia (JSON)</button>
        <label class="btn sec" style="cursor:pointer">Ripristina una copia<input type="file" accept=".json,application/json" data-file="copia" class="sr"></label>
        <button class="btn rosso" data-a="svuota">Cancella tutto</button>
      </section>
    </div>`;
    return h;
  }

  /* ---------------- disegno ---------------- */
  function render() {
    const app = $("#app");
    const att = document.activeElement;
    const fuoco = att && att.id && app.contains(att) ? { id: att.id, pos: att.selectionStart } : null;
    const schermi = { oggi: schermoOggi, casa: schermoCasa, aggiungi: schermoAggiungi, spesa: schermoSpesa, piano: schermoPiano, imp: schermoImpostazioni };
    app.innerHTML = (schermi[S.tab] || schermoOggi)();
    renderNav();
    posizionaCamera();
    if (fuoco) {
      const el = document.getElementById(fuoco.id);
      if (el) { el.focus(); try { el.setSelectionRange(fuoco.pos, fuoco.pos); } catch { /* */ } }
    }
  }

  function vai(tab) {
    if (tab !== "aggiungi" || S.aggTab !== "codice") fermaScanner();
    S.tab = tab;
    if (tab !== "imp") LS.set("ds_tab", tab);
    if (tab === "piano") S.giornoSel = S.giornoSel || oggi();
    render();
    window.scrollTo(0, 0);
    if (tab === "aggiungi" && S.aggTab === "codice") avviaScanner();
  }

  /* ---------------- fotocamera ---------------- */
  function posizionaCamera() {
    const cam = $("#camera");
    const posto = $("#posto-camera");
    const on = S.scan.attivo && posto && S.tab === "aggiungi" && S.aggTab === "codice";
    cam.classList.toggle("on", !!on);
    if (on) cam.style.top = posto.offsetTop + "px";
  }

  function caricaScript(src) {
    return new Promise((ok, ko) => {
      if (document.querySelector(`script[src="${src}"]`) && window.ZXingBrowser) return ok();
      const s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = () => ko(new Error("Libreria del lettore non scaricata"));
      document.head.appendChild(s);
    });
  }

  async function avviaScanner() {
    if (S.scan.attivo) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      S.scan.errore = "La fotocamera funziona solo con l'app aperta in https (GitHub Pages) o su localhost.";
      render(); return;
    }
    S.scan.errore = "";
    const video = $("#video");
    try {
      let nativo = null;
      if ("BarcodeDetector" in window) {
        try {
          const f = await window.BarcodeDetector.getSupportedFormats();
          if (f.includes("ean_13")) nativo = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
        } catch { /* lettore nativo assente */ }
      }
      if (nativo) {
        // Android/Chrome: lettore del sistema, veloce
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        video.srcObject = stream;
        await video.play();
        let vivo = true;
        S.scan.stop = () => { vivo = false; stream.getTracks().forEach((t) => t.stop()); video.srcObject = null; };
        S.scan.attivo = true; render();
        const giro = async () => {
          if (!vivo) return;
          try {
            const codici = await nativo.detect(video);
            if (codici.length) { fermaScanner(); return trovatoCodice(codici[0].rawValue); }
          } catch { /* fotogramma non pronto */ }
          setTimeout(giro, 180);
        };
        giro();
      } else {
        // iPhone/Safari e gli altri: ZXing
        await caricaScript(ZXING);
        const lettore = new window.ZXingBrowser.BrowserMultiFormatReader();
        S.scan.attivo = true; render();
        const ctrl = await lettore.decodeFromConstraints({ video: { facingMode: "environment" }, audio: false }, video, (ris, _err, c) => {
          if (ris) { c.stop(); S.scan.stop = null; S.scan.attivo = false; posizionaCamera(); trovatoCodice(ris.getText()); }
        });
        S.scan.stop = () => ctrl.stop();
      }
    } catch (e) {
      console.error(e);
      fermaScanner();
      S.scan.errore = e && e.name === "NotAllowedError" ? "Permesso per la fotocamera negato: abilitalo nelle impostazioni del browser." : "Fotocamera non disponibile: " + (e.message || e);
      render();
    }
  }
  function fermaScanner() {
    if (S.scan.stop) { try { S.scan.stop(); } catch { /* */ } }
    S.scan.stop = null;
    S.scan.attivo = false;
    posizionaCamera();
  }

  async function trovatoCodice(ean) {
    ean = String(ean).replace(/\D/g, "");
    if (navigator.vibrate) navigator.vibrate(60);
    const noto = S.db.prodotti.find((p) => p.id === ean);
    if (noto) return apriProdotto({ ean, ...daProdottoNoto(noto), noto: true });
    toast("Cerco il prodotto " + ean + "…");
    let off = null;
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${ean}.json?fields=product_name,product_name_it,generic_name_it,brands,quantity,product_quantity,product_quantity_unit,categories_tags`);
      const j = await r.json();
      if (j.status === 1) off = j.product;
    } catch { /* senza rete: si compila a mano */ }
    nascondiToast();
    const voci = L.tutteLeVoci(S.piano || { settimane: [] });
    const nome = off ? (off.product_name_it || off.product_name || off.generic_name_it || "").trim() : "";
    const voce = nome ? L.indovinaVoce(nome, voci) : null;
    const unitaOff = (off && off.product_quantity_unit) || "g";
    const peso = off && off.product_quantity && /^(g|ml)$/i.test(unitaOff) ? Math.round(Number(off.product_quantity)) : null;
    const luogo = (voce && S.piano && L.luogoDaVoce(S.piano, voce)) || (off ? L.luogoDaCategorie(off.categories_tags) : "dispensa");
    apriProdotto({
      ean, nome: nome ? nome + (off.brands ? "" : "") : "", marca: off ? (off.brands || "").split(",")[0] : "",
      voce: voce || "", luogo, conf: 1, conf_qty: voce === "Uovo di gallina" ? 6 : peso || "", conf_unita: voce === "Uovo di gallina" ? "pz" : "g",
      scadenza: "", trovato: !!off,
    });
  }
  function daProdottoNoto(p) {
    return { nome: p.nome, marca: p.marca || "", voce: (p.voci || [])[0] || "", luogo: p.luogo, conf: 1, conf_qty: p.conf_qty || "", conf_unita: p.conf_unita || "g", scadenza: "", trovato: true };
  }

  /* ---------------- fogli (finestre dal basso) ---------------- */
  function apriFoglio(sheet) { S.sheet = sheet; renderFoglio(); }
  function chiudiFoglio() {
    S.sheet = null;
    const el = $("#sheet"); el.classList.remove("on"); el.innerHTML = "";
    if (S.tab === "aggiungi" && S.aggTab === "codice" && !S.scan.attivo) avviaScanner();
  }
  function renderFoglio() {
    const el = $("#sheet");
    if (!S.sheet) { el.classList.remove("on"); el.innerHTML = ""; return; }
    const fogli = { prodotto: foglioProdotto, rivedi: foglioRivedi, item: foglioItem, nuovoCat: foglioNuovoCat, mancanza: foglioMancanza, pasto: foglioPasto, importa: foglioImporta, chi: foglioChi, gruppo: foglioGruppo };
    el.innerHTML = `<div class="velo" data-a="chiudi"></div><div class="foglio"><span class="maniglia" aria-hidden="true"></span>${fogli[S.sheet.tipo]()}</div>`;
    el.classList.add("on");
  }
  const sel = (v, opzioni) => opzioni.map(([val, txt]) => `<option value="${esc(val)}" ${val === v ? "selected" : ""}>${esc(txt)}</option>`).join("");
  const opzioniVoci = () => [["", "Non è nel piano"], ...L.tutteLeVoci(S.piano || { settimane: [] }).map((v) => [v, v])];
  const bottoniLuogo = (luogo, azione, mini) => `<div class="luoghi ${mini ? "mini" : ""}">
      <button type="button" class="frigo" aria-pressed="${luogo === "frigo"}" data-a="${azione}" data-v="frigo">${mini ? "" : ico("frigo", 20)}Frigo</button>
      <button type="button" class="dispensa" aria-pressed="${luogo !== "frigo"}" data-a="${azione}" data-v="dispensa">${mini ? "" : ico("dispensa", 20)}Dispensa</button></div>`;

  function foglioProdotto() {
    const d = S.sheet.d;
    const usi = d.voce && S.calc ? S.calc.pasti.filter((p) => p.voci.some((v) => v.nome === d.voce)).slice(0, 3)
      .map((p) => p.pasto.toLowerCase() + " di " + L.nomeGiorno(p.data, oggi())) : [];
    return `<div style="display:flex;gap:12px;align-items:center">
        <div style="width:52px;height:52px;border-radius:14px;background:${d.luogo === "frigo" ? "var(--blue-soft)" : "var(--brown-soft)"};color:${d.luogo === "frigo" ? "var(--blue)" : "var(--brown)"};display:flex;align-items:center;justify-content:center;flex:none">${ico(d.luogo === "frigo" ? "frigo" : "dispensa", 26)}</div>
        <div style="display:flex;flex-direction:column;gap:2px;min-width:0"><h2>${esc(d.nome || "Prodotto nuovo")}</h2>
        <span class="sotto">${d.noto ? "Già visto: dati ricordati" : d.trovato ? "Dati da Open Food Facts" + (d.marca ? " · " + esc(d.marca) : "") : "Codice " + esc(d.ean) + " non trovato: scrivi tu il nome"}</span></div></div>
      ${usi.length ? `<div class="avviso verde">${ico("spunta", 18)}<span>Nel piano: ${esc(usi.join(", "))}.</span></div>` : ""}
      <label class="campo">Nome<input data-f="nome" value="${esc(d.nome)}" placeholder="Es. Ricotta di vacca 250 g"></label>
      <label class="campo">Conta come (voce del piano)<select data-f="voce">${sel(d.voce, opzioniVoci())}</select></label>
      <div class="campo"><span>Dove lo metti?</span>${bottoniLuogo(d.luogo, "f-luogo")}</div>
      <div class="due">
        <div class="campo"><span>Confezioni</span><div class="stepper"><button type="button" data-a="f-conf" data-v="-1" aria-label="Una in meno">−</button><span class="val">${d.conf}</span><button type="button" data-a="f-conf" data-v="1" aria-label="Una in più">+</button></div></div>
        <label class="campo">Scadenza<input type="date" data-f="scadenza" value="${esc(d.scadenza)}"></label>
      </div>
      <div class="due">
        <label class="campo">Ogni confezione<input data-f="conf_qty" inputmode="decimal" value="${esc(d.conf_qty)}" placeholder="250"></label>
        <label class="campo">Unità<select data-f="conf_unita">${sel(d.conf_unita, [["g", "grammi"], ["pz", "pezzi"]])}</select></label>
      </div>
      <button class="btn largo" data-a="salva-prodotto">Aggiungi ${d.luogo === "frigo" ? "al frigo" : "alla dispensa"}</button>
      <button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }

  function foglioRivedi() {
    const cat = new Map(catalogo().map((c) => [c.nome, c]));
    let h = `<h2>Metti in casa</h2><p class="sotto">Controlla le quantità e dove vanno, poi salva.</p><div style="display:flex;flex-direction:column">`;
    for (const [nome, s] of S.scelta) {
      const c = cat.get(nome);
      if (!c) continue;
      h += `<div style="display:flex;flex-direction:column;gap:8px;padding:12px 0;border-bottom:1px solid var(--line-soft)">
        <div style="display:flex;align-items:center;gap:8px"><b style="flex:1;font-size:15px">${esc(nome)}</b>
          <button class="icona-btn" data-a="scelta-togli" data-nome="${esc(nome)}" aria-label="Togli ${esc(nome)}">${ico("x", 18)}</button></div>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px">
          <div class="stepper mini"><button type="button" data-a="scelta-qty" data-nome="${esc(nome)}" data-v="-1" aria-label="Meno">−</button><span class="val">${esc(fmtScelta(c, s.qty).replace("×", ""))}${c.unita === "pz" ? " pz" : ""}</span><button type="button" data-a="scelta-qty" data-nome="${esc(nome)}" data-v="1" aria-label="Più">+</button></div>
          ${bottoniLuogo(s.luogo, "scelta-luogo\" data-nome=\"" + esc(nome), true)}
        </div></div>`;
    }
    h += `</div><button class="btn largo" data-a="salva-scelta">Salva in casa</button>
      <button class="link" data-a="scelta-svuota" style="align-self:center;color:var(--muted)">Svuota la selezione</button>`;
    return h;
  }

  function foglioItem() {
    const d = S.sheet.d;
    return `<h2>${esc(d.nome)}</h2>
      <label class="campo">Nome<input data-f="nome" value="${esc(d.nome)}"></label>
      <div class="due">
        <label class="campo">Quantità<input data-f="qty" inputmode="decimal" value="${esc(d.qty)}"></label>
        <label class="campo">Unità<select data-f="unita">${sel(d.unita, [["g", "grammi"], ["pz", "pezzi"]])}</select></label>
      </div>
      <div class="campo"><span>Dove sta</span>${bottoniLuogo(d.luogo, "f-luogo")}</div>
      <label class="campo">Conta come (voce del piano)<select data-f="voce">${sel(d.voce, opzioniVoci())}</select></label>
      <label class="campo">Scadenza<input type="date" data-f="scadenza" value="${esc(d.scadenza || "")}"></label>
      <button class="btn largo" data-a="salva-item">Salva</button>
      <div class="due"><button class="btn rosso" data-a="finito-item">È finito</button><button class="btn sec" data-a="chiudi">Annulla</button></div>`;
  }

  function foglioNuovoCat() {
    const d = S.sheet.d;
    return `<h2>${d.id ? "Modifica prodotto" : "Nuovo prodotto senza codice"}</h2>
      <p class="sotto">Resta nell'elenco a tap per le prossime volte (anche sull'altro telefono).</p>
      <label class="campo">Nome<input data-f="nome" value="${esc(d.nome)}" placeholder="Es. Zucchine romanesche"></label>
      <div class="due">
        <label class="campo">Gruppo<select data-f="gruppo">${sel(d.gruppo, window.GRUPPI_CATALOGO.map((g) => [g, g]))}</select></label>
        <label class="campo">Si conta a<select data-f="unita">${sel(d.unita, [["pz", "pezzi"], ["g", "peso"]])}</select></label>
      </div>
      <label class="campo">Conta come (voce del piano)<select data-f="voce">${sel(d.voce, opzioniVoci())}</select>
        <span class="aiuto">Per una verdura qualsiasi scegli «Verdura di stagione».</span></label>
      <div class="due">
        <label class="campo">${d.unita === "g" ? "Grammi a ogni tap" : "Peso di un pezzo (g)"}<input data-f="${d.unita === "g" ? "passo" : "g_pz"}" inputmode="numeric" value="${esc(d.unita === "g" ? d.passo : d.g_pz)}"></label>
        <div class="campo"><span>Di solito va in</span>${bottoniLuogo(d.luogo, "f-luogo", true)}</div>
      </div>
      <button class="btn largo" data-a="salva-cat">Salva nell'elenco</button>
      ${d.id ? `<button class="btn rosso largo" data-a="elimina-cat">Togli dall'elenco</button>` : ""}
      <button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }

  function foglioMancanza() {
    const m = (S.calc7 ? S.calc7.mancanze : []).find((x) => x.voce === S.sheet.voce);
    const inLista = S.db.spesa.some((s) => s.voce === m?.voce && !s.fatto);
    if (!m) return `<h2>${esc(S.sheet.voce)}</h2><p class="sotto">Ora c'è: niente da comprare.</p><button class="btn" data-a="chiudi">Chiudi</button>`;
    const righe = m.pasti.map((p) => `<div class="riga"><span class="testo"><span class="nome">${esc(cap(p.pasto))} di ${esc(L.nomeGiorno(p.data, oggi()))}</span><span class="nota">${esc(L.dettaglioPersone(p, m.u) || "")}</span></span><span class="q">${esc(L.fmtQ(p.manca, m.u))}</span></div>`).join("");
    return `<h2>${esc(m.voce)}</h2>
      <p class="sotto">${m.tipo === "scarso" ? "In casa ce n'è, ma non basta." : "In casa non risulta."} ${inLista ? "È già nella lista della spesa." : "Entra nella lista della spesa quando mancano 3 giorni."}</p>
      <div class="card" style="background:var(--bg)">${righe}</div>
      <button class="btn largo" data-a="ce-l-ho" data-voce="${esc(m.voce)}">Ce l'ho già: mettilo in casa</button>
      <button class="btn sec largo" data-a="prendo-voce" data-voce="${esc(m.voce)}">Lo prendo io</button>
      <button class="link" data-a="chiudi" style="align-self:center">Chiudi</button>`;
  }

  function foglioPasto() {
    const { k } = S.sheet;
    return `<h2>${esc(k.split("|")[1])} di ${esc(L.nomeGiorno(k.split("|")[0], oggi()))}</h2>
      <p class="sotto">Chi l'ha mangiato? Le dosi escono dalla dispensa solo per chi l'ha fatto.</p>
      <div class="due"><button class="btn sec" data-a="pasto" data-k="${esc(k)}" data-stato="max">Solo Max</button><button class="btn sec" data-a="pasto" data-k="${esc(k)}" data-stato="vale">Solo Vale</button></div>
      <button class="btn rosso largo" data-a="pasto" data-k="${esc(k)}" data-stato="saltato">Saltato da tutti e due</button>
      <button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }

  function foglioChi() {
    return `<h2>Benvenuto in CheManca?</h2>
      <p class="sotto">Chi usa questo telefono? Serve per «Lo prendo io» e per sapere chi ha aggiunto cosa.</p>
      <div class="due"><button class="btn" data-a="chi" data-v="max">Max</button><button class="btn" data-a="chi" data-v="vale">Vale</button></div>`;
  }

  function foglioGruppo() {
    const { chat } = S.sheet;
    if (!chat.length) return `<h2>Nessun gruppo trovato</h2><p class="sotto">Aggiungi il bot al gruppo, scrivi un messaggio nel gruppo e riprova. Se il bot era già nel gruppo, scrivigli <code>/start</code>.</p><button class="btn" data-a="chiudi">Ok</button>`;
    return `<h2>Scegli la chat</h2><div class="card" style="background:var(--bg)">` +
      chat.map((c) => `<button class="riga" data-a="tg-scegli" data-id="${esc(c.id)}"><span class="testo"><span class="nome">${esc(c.nome)}</span><span class="nota">${esc(c.tipo)} · ${esc(c.id)}</span></span></button>`).join("") +
      `</div><button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }

  /* ---------------- nuova dieta dai PDF ---------------- */
  async function leggiPdfDieta(files) {
    toast("Leggo " + (files.length === 1 ? "il PDF" : "i PDF") + "…");
    try {
      const pdfjs = await import(PDFJS + "pdf.min.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.mjs";
      const persone = {};
      const avvisi = [];
      for (const f of files) {
        const doc = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
        const pagine = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const tc = await (await doc.getPage(i)).getTextContent();
          pagine.push(window.ImportaPdf.righeDaPdfjs(tc.items));
        }
        const p = window.ImportaPdf.leggiPersona(pagine);
        if (!p.giorni.some(Boolean)) { avvisi.push(f.name + ": nessuna pagina «Piano alimentare - giorno» trovata"); continue; }
        let chi = window.ImportaPdf.chiDalNome(p.persona + " " + f.name);
        if (!chi || persone[chi]) chi = persone.max ? "vale" : "max";
        persone[chi] = p;
        avvisi.push(...p.avvisi.map((a) => (chi === "max" ? "Max" : "Vale") + ", " + a));
      }
      nascondiToast();
      if (!persone.max && !persone.vale) return toast("Non ho trovato una dieta nel PDF");
      // di solito si parte dal lunedì: il prossimo, o oggi se è lunedì
      const d = L.daIso(oggi());
      const inizio = L.piuGiorni(oggi(), (8 - d.getDay()) % 7);
      apriFoglio({ tipo: "importa", d: { persone, avvisi, inizio, nomi: files.map((f) => f.name).join(", ") } });
    } catch (e) {
      console.error(e);
      toast("Non riesco a leggere il PDF: " + (e.message || e));
    }
  }

  function foglioImporta() {
    const d = S.sheet.d;
    const anteprima = window.ImportaPdf.unisci(d.persone.max, d.persone.vale, d.inizio, "PDF");
    const nomiG = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
    const descr = (p) => {
      if (!p) return "–";
      if (p.libero) return "pasto libero";
      if (p.piatti[0]) return p.piatti[0];
      const v = p.voci.find((x) => !L.GENERICHE.has(x.nome) && !/^pane/i.test(x.nome) && !L.PRESENZA.has(x.u)) || p.voci[0];
      return v ? v.nome : "–";
    };
    let righe = "";
    anteprima.settimane[0].forEach((pasti, g) => {
      const n = pasti.reduce((s, p) => s + p.voci.length, 0);
      righe += `<div class="riga"><span class="testo"><span class="nome">${nomiG[g]}</span><span class="nota">Pranzo: ${esc(descr(pasti.find((p) => p.pasto === "Pranzo")))} · Cena: ${esc(descr(pasti.find((p) => p.pasto === "Cena")))}</span></span><span class="q" style="font-size:13px;color:var(--muted)">${n} alimenti</span></div>`;
    });
    const chi = [d.persone.max && "Max", d.persone.vale && "Vale"].filter(Boolean).join(" e ");
    return `<h2>Nuova dieta</h2>
      <p class="sotto">Letta da: ${esc(d.nomi)}<br>Dosi di <b>${esc(chi)}</b>${d.persone.max && d.persone.vale ? ", unite pasto per pasto" : ""}. È una settimana che si ripete finché non carichi la prossima.</p>
      ${d.avvisi.length ? `<div class="avviso giallo"><span>${d.avvisi.map(esc).join("<br>")}</span></div>` : ""}
      <div class="card" style="background:var(--bg)">${righe}</div>
      <label class="campo">Comincia il<input type="date" data-f="inizio" value="${esc(d.inizio)}"></label>
      <button class="btn largo" data-a="importa-conferma">Usa questa dieta</button>
      <button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }

  async function confermaImport() {
    const d = S.sheet.d;
    if (!d.inizio) return toast("Scegli la data di inizio");
    const p = window.ImportaPdf.unisci(d.persone.max, d.persone.vale, d.inizio, "PDF del " + new Date().toLocaleDateString("it-IT"));
    if (S.pianoFile) p.categorie = S.pianoFile.categorie;
    // fino al giorno di inizio resta valido il piano di adesso
    if (S.piano && d.inizio > oggi()) p.prima = { ...S.piano, prima: undefined };
    await salva("piano", [{ id: "attuale", dati: p, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
    chiudiFoglio();
    dopoModifica();
    vai("piano");
    toast("Nuova dieta in uso dal " + ddmm(d.inizio));
  }

  /* ---------------- azioni ---------------- */
  async function segnaPasto(k, stato) {
    const [data, nomePasto] = k.split("|");
    const g = L.giornoPiano(S.piano, data);
    const pasto = g && g.pasti.find((p) => p.pasto === nomePasto);
    const prima = [];
    if (stato !== "saltato" && pasto && !pasto.libero) {
      const chi = stato === "max" ? "max" : stato === "vale" ? "vale" : null;
      const mosse = L.consumaPasto(S.db.inventario, pasto, chi);
      for (const m of mosse) {
        const it = S.db.inventario.find((i) => i.id === m.id);
        prima.push({ ...it });
        if (m.qty <= 0) await elimina("inventario", m.id);
        else await modifica("inventario", m.id, { qty: m.qty });
      }
    }
    await salva("pasti", [{ id: k, data, pasto: nomePasto, stato, chi: S.chi || "", quando: new Date().toISOString(), scalato: prima }]);
    chiudiFoglio();
    dopoModifica();
    toast(stato === "saltato" ? "Segnato come saltato" : "Fatto: dosi tolte da casa", "Annulla", () => annullaPasto(k));
  }
  async function annullaPasto(k) {
    const st = S.db.pasti.find((p) => p.id === k);
    if (!st) return;
    // rimette in casa esattamente quello che era stato tolto
    const scalato = st.scalato || [];
    if (scalato.length) await salva("inventario", scalato);
    await elimina("pasti", k);
    dopoModifica();
  }

  function tapCatalogo(nome) {
    const c = catalogo().find((x) => x.nome === nome);
    if (!c) return;
    const s = S.scelta.get(nome);
    if (s) s.qty += c.passo || 1;
    else S.scelta.set(nome, { qty: c.passo || 1, luogo: c.luogo || "frigo" });
    if (navigator.vibrate) navigator.vibrate(15);
    render();
  }

  async function salvaScelta() {
    const cat = new Map(catalogo().map((c) => [c.nome, c]));
    let n = 0;
    for (const [nome, s] of S.scelta) {
      const c = cat.get(nome);
      if (!c || s.qty <= 0) continue;
      // se c'è già lo stesso prodotto nello stesso posto, si somma
      const esiste = S.db.inventario.find((i) => i.nome === nome && i.luogo === s.luogo && i.unita === c.unita && Number(i.qty) > 0);
      if (esiste) await modifica("inventario", esiste.id, { qty: Number(esiste.qty) + s.qty, aggiornato: new Date().toISOString() });
      else await salva("inventario", [{ nome, voci: c.voci || [], luogo: s.luogo, qty: s.qty, unita: c.unita, g_pz: c.g_pz || null, manuale: true, scadenza: null, creato_da: S.chi || "", aggiornato: new Date().toISOString() }]);
      n++;
    }
    S.scelta.clear();
    chiudiFoglio();
    dopoModifica();
    toast(`${n} ${n === 1 ? "prodotto messo" : "prodotti messi"} in casa`);
  }

  async function salvaProdotto() {
    const d = S.sheet.d;
    if (!d.nome.trim()) return toast("Scrivi il nome del prodotto");
    const confQty = Number(String(d.conf_qty).replace(",", ".")) || 0;
    const voci = d.voce ? [d.voce] : [];
    let riga;
    if (d.conf_unita === "pz") riga = { qty: d.conf * (confQty || 1), unita: "pz", g_pz: null };
    else if (confQty) riga = { qty: d.conf * confQty, unita: "g", g_pz: null };
    else riga = { qty: d.conf, unita: "pz", g_pz: null };
    await salva("inventario", [{ nome: d.nome.trim(), voci, luogo: d.luogo, ...riga, ean: d.ean, manuale: false, scadenza: d.scadenza || null, creato_da: S.chi || "", aggiornato: new Date().toISOString() }]);
    // si ricorda il prodotto: la prossima volta basta un tap
    await salva("prodotti", [{ id: d.ean, nome: d.nome.trim(), marca: d.marca || "", voci, luogo: d.luogo, conf_qty: confQty || null, conf_unita: d.conf_unita, usato: new Date().toISOString() }]);
    chiudiFoglio();
    dopoModifica();
    toast(`${d.nome.trim()} ${d.luogo === "frigo" ? "nel frigo" : "in dispensa"}`);
  }

  async function salvaItem() {
    const d = S.sheet.d;
    const it = S.db.inventario.find((i) => i.id === d.id);
    const altre = (it.voci || []).filter((v) => v !== d.voce && v !== (it.voci || [])[0]);
    const voci = d.voce ? [d.voce, ...altre] : [];
    await modifica("inventario", d.id, { nome: d.nome.trim() || it.nome, qty: Number(String(d.qty).replace(",", ".")) || 0, unita: d.unita, luogo: d.luogo, voci, scadenza: d.scadenza || null, aggiornato: new Date().toISOString() });
    chiudiFoglio();
    dopoModifica();
  }

  async function salvaCatalogo() {
    const d = S.sheet.d;
    if (!d.nome.trim()) return toast("Scrivi il nome");
    const voci = d.voce ? [d.voce] : [];
    if (d.voce === "Verdura di stagione") voci.push("Misto verdure crude");
    await salva("catalogo", [{ id: d.id || uid(), nome: d.nome.trim(), gruppo: d.gruppo, luogo: d.luogo, voci, unita: d.unita, passo: d.unita === "g" ? Number(d.passo) || 100 : 1, g_pz: d.unita === "pz" ? Number(d.g_pz) || null : null }]);
    S.cercaCat = "";
    chiudiFoglio();
    tapCatalogo(d.nome.trim());
  }

  async function mettiInCasaComprati() {
    const presi = S.db.spesa.filter((s) => s.fatto);
    const cat = catalogo();
    const senza = [];
    for (const s of presi) {
      const c = cat.find((x) => x.nome === s.nome) || cat.find((x) => (x.voci || [])[0] === s.voce);
      if (c) {
        const m = S.calc.mancanze.find((x) => x.voce === s.voce);
        let qty = c.passo || 1;
        if (m && !m.presenza) {
          if (c.unita === "g" && m.u === "g") qty = Math.max(c.passo, Math.ceil(m.manca / c.passo) * c.passo);
          else if (c.unita === "pz" && m.u === "n.") qty = Math.ceil(m.manca);
          else if (c.unita === "pz" && c.g_pz && m.u === "g") qty = Math.max(1, Math.ceil(m.manca / c.g_pz));
        }
        S.scelta.set(c.nome, { qty, luogo: c.luogo || "frigo" });
      } else senza.push(s.nome);
    }
    await elimina("spesa", presi.map((s) => s.id));
    S.tab = "aggiungi"; S.aggTab = "senza"; LS.set("ds_aggtab", "senza");
    dopoModifica();
    if (S.scelta.size) apriFoglio({ tipo: "rivedi" });
    if (senza.length) toast("Da scansionare: " + senza.join(", "));
  }

  function condividiWhatsapp() {
    const lista = S.db.spesa.filter((s) => !s.fatto);
    if (!lista.length) return toast("La lista è vuota");
    const testo = "Lista della spesa\n" + lista.map((s) => `• ${s.nome}${s.qty_txt ? " " + s.qty_txt : ""}${s.urgenza === "urgente" ? " (urgente)" : ""}`).join("\n");
    window.open("https://wa.me/?text=" + encodeURIComponent(testo), "_blank");
  }

  async function trovaGruppoTelegram() {
    const token = $("#tg-token").value.trim();
    if (!token) return toast("Incolla prima il token del bot");
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.description);
      const chat = new Map();
      for (const u of j.result) {
        const c = (u.message || u.my_chat_member || u.channel_post || {}).chat;
        if (c) chat.set(String(c.id), { id: String(c.id), nome: c.title || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.username || "chat", tipo: c.type === "private" ? "chat privata" : "gruppo" });
      }
      LS.set("ds_tg", { ...tg(), token });
      apriFoglio({ tipo: "gruppo", chat: [...chat.values()] });
    } catch (e) { toast("Telegram: " + e.message); }
  }

  function caricaDemo() {
    const og = oggi();
    const tra = (n) => L.piuGiorni(og, n);
    const it = (nome, voci, luogo, qty, unita, extra) => ({ id: uid(), nome, voci, luogo, qty, unita, g_pz: null, manuale: false, scadenza: null, ...extra });
    const inv = [
      it("Bocconcini di pollo", ["Bocconcini di pollo"], "frigo", 400, "g", { scadenza: tra(1) }),
      it("Uova fresche", ["Uovo di gallina"], "frigo", 6, "pz", { scadenza: tra(12) }),
      it("Albume d'uovo", ["Albume d'uovo"], "frigo", 500, "g", { scadenza: tra(10) }),
      it("Ricotta di vacca", ["Ricotta di vacca"], "frigo", 250, "g", { scadenza: tra(8) }),
      it("Parmigiano", ["Parmigiano", "Parmigiano grattugiato"], "frigo", 300, "g", { manuale: true }),
      it("Yogurt greco 2%", ["Yogurt greco 2%"], "frigo", 300, "g", { scadenza: tra(6) }),
      it("Zucchine", ["Zucchine", "Verdura di stagione", "Misto verdure crude"], "frigo", 6, "pz", { g_pz: 200, manuale: true }),
      it("Insalata mista", ["Misto verdure crude", "Verdura di stagione"], "frigo", 500, "g", { scadenza: tra(3) }),
      it("Mele", ["Frutta di stagione"], "dispensa", 4, "pz", { g_pz: 180, manuale: true }),
      it("Avocado", ["Avocado"], "dispensa", 1, "pz", { g_pz: 200, manuale: true }),
      it("Mirtilli", ["Mirtilli", "Frutta di stagione"], "frigo", 125, "g", { manuale: true }),
      it("Prosciutto crudo", ["Prosciutto crudo magro"], "frigo", 80, "g", { scadenza: tra(5) }),
      it("Tonno all'olio", ["Tonno sott'olio"], "dispensa", 320, "g"),
      it("Riso basmati integrale", ["Riso Basmati integrale"], "dispensa", 1000, "g"),
      it("Pasta integrale", ["Pasta integrale"], "dispensa", 500, "g"),
      it("Pane di segale", ["Pane integrale di segale"], "dispensa", 750, "g", { manuale: true }),
      it("Crackers non salati", ["Crackers non salati"], "dispensa", 500, "g"),
      it("Mandorle", ["Mandorle"], "dispensa", 200, "g"),
      it("Noci", ["Noci secche"], "dispensa", 150, "g"),
      it("Arachidi tostate", ["Arachidi tostate"], "dispensa", 100, "g"),
      it("Anacardi", ["Anacardi"], "dispensa", 100, "g"),
      it("Miele millefiori", ["Miele millefiori"], "dispensa", 1, "pz"),
      it("Caffè", ["Caffè"], "dispensa", 1, "pz"),
      it("Cioccolato fondente", ["Cioccolato fondente"], "dispensa", 100, "g"),
      it("Olio extravergine", ["Olio extra vergine di oliva"], "dispensa", 1, "pz"),
      it("Farina di cocco", ["Farina di cocco"], "dispensa", 250, "g"),
      it("Patate", ["Patate"], "dispensa", 1000, "g", { manuale: true }),
    ];
    return inv;
  }

  /* ---------------- gestione dei tocchi ---------------- */
  document.addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-a]");
    if (!b) return;
    const a = b.dataset.a;
    const d = S.sheet && S.sheet.d;
    switch (a) {
      case "vai": chiudiFoglio(); vai(b.dataset.tab); break;
      case "chiudi": chiudiFoglio(); break;
      case "tutti-verdi": S.tuttiVerdi = true; render(); break;
      case "casa-tab": S.casaTab = b.dataset.v; render(); break;
      case "agg-tab":
        S.aggTab = b.dataset.v; LS.set("ds_aggtab", S.aggTab);
        if (S.aggTab === "codice") { render(); avviaScanner(); } else { fermaScanner(); render(); }
        break;
      case "scan-avvia": avviaScanner(); break;
      case "prodotto-noto": {
        const p = S.db.prodotti.find((x) => x.id === b.dataset.ean);
        fermaScanner();
        apriFoglio({ tipo: "prodotto", d: { ean: p.id, ...daProdottoNoto(p), noto: true } });
        break;
      }
      case "tap": tapCatalogo(b.dataset.nome); break;
      case "rivedi": apriFoglio({ tipo: "rivedi" }); break;
      case "scelta-qty": {
        const c = catalogo().find((x) => x.nome === b.dataset.nome);
        const s = S.scelta.get(b.dataset.nome);
        s.qty = Math.max(0, s.qty + Number(b.dataset.v) * (c.passo || 1));
        if (!s.qty) S.scelta.delete(b.dataset.nome);
        if (!S.scelta.size) chiudiFoglio(); else renderFoglio();
        render(); break;
      }
      case "scelta-luogo": S.scelta.get(b.dataset.nome).luogo = b.dataset.v; renderFoglio(); break;
      case "scelta-togli": S.scelta.delete(b.dataset.nome); if (!S.scelta.size) chiudiFoglio(); else renderFoglio(); render(); break;
      case "scelta-svuota": S.scelta.clear(); chiudiFoglio(); render(); break;
      case "salva-scelta": await salvaScelta(); break;
      case "nuovo-cat": apriFoglio({ tipo: "nuovoCat", d: { nome: b.dataset.nome || "", gruppo: b.dataset.gruppo || "Altro", luogo: ["Frutta", "Pane"].includes(b.dataset.gruppo) ? "dispensa" : "frigo", unita: b.dataset.gruppo === "Pesce" || b.dataset.gruppo === "Carne" ? "g" : "pz", passo: 100, g_pz: "", voce: b.dataset.gruppo === "Frutta" ? "Frutta di stagione" : b.dataset.gruppo === "Verdura" ? "Verdura di stagione" : "" } }); break;
      case "salva-cat": await salvaCatalogo(); break;
      case "elimina-cat": await elimina("catalogo", d.id); chiudiFoglio(); render(); break;
      case "f-luogo": d.luogo = b.dataset.v; renderFoglio(); break;
      case "f-conf": d.conf = Math.max(1, d.conf + Number(b.dataset.v)); renderFoglio(); break;
      case "salva-prodotto": await salvaProdotto(); break;
      case "modifica-item": {
        const it = S.db.inventario.find((i) => i.id === b.dataset.id);
        apriFoglio({ tipo: "item", d: { id: it.id, nome: it.nome, qty: it.qty, unita: it.unita, luogo: it.luogo, voce: (it.voci || [])[0] || "", scadenza: it.scadenza || "" } });
        break;
      }
      case "salva-item": await salvaItem(); break;
      case "finito-item": {
        const it = S.db.inventario.find((i) => i.id === d.id);
        await elimina("inventario", d.id); chiudiFoglio(); dopoModifica();
        toast(it.nome + " tolto", "Annulla", async () => { await salva("inventario", [it]); dopoModifica(); });
        break;
      }
      case "mancanza": apriFoglio({ tipo: "mancanza", voce: b.dataset.voce }); break;
      case "ce-l-ho": {
        const voce = b.dataset.voce;
        const c = catalogo().find((x) => (x.voci || [])[0] === voce) || catalogo().find((x) => (x.voci || []).includes(voce));
        chiudiFoglio();
        if (c) { S.aggTab = "senza"; S.scelta.set(c.nome, { qty: c.passo || 1, luogo: c.luogo }); vai("aggiungi"); apriFoglio({ tipo: "rivedi" }); }
        else { S.aggTab = "codice"; vai("aggiungi"); toast("Scansiona il codice di " + voce); }
        break;
      }
      case "prendo-voce": {
        const s = S.db.spesa.find((x) => x.voce === b.dataset.voce && !x.fatto);
        if (s) await modifica("spesa", s.id, { prende: S.chi || "max" });
        chiudiFoglio(); toast("Segnato: lo prendi tu"); render(); break;
      }
      case "prendo": await modifica("spesa", b.dataset.id, { prende: S.chi || "max" }); render(); break;
      case "spunta": {
        const s = S.db.spesa.find((x) => x.id === b.dataset.id);
        await modifica("spesa", s.id, { fatto: !s.fatto, prende: s.prende || S.chi || null });
        render(); renderNav(); break;
      }
      case "togli-spesa": await elimina("spesa", b.dataset.id); render(); break;
      case "metti-in-casa": await mettiInCasaComprati(); break;
      case "whatsapp-lista": condividiWhatsapp(); break;
      case "avvisa-ora": {
        const html = L.testoAvviso(S.calc.mancanze, oggi(), { titolo: "CheManca? · lista aggiornata", link: CFG.APP_URL });
        if (!html) { toast("Non manca niente: nessun messaggio da mandare"); break; }
        try { await inviaAvviso(html); await salva("avvisi", [{ id: "manuale:" + new Date().toISOString(), inviato: new Date().toISOString(), da: S.chi || "" }]); toast("Messaggio inviato"); render(); }
        catch (e) { toast(e.message); }
        break;
      }
      case "pasto": await segnaPasto(b.dataset.k, b.dataset.stato); break;
      case "pasto-altro": apriFoglio({ tipo: "pasto", k: b.dataset.k }); break;
      case "pasto-annulla": await annullaPasto(b.dataset.k); break;
      case "giorno": S.giornoSel = b.dataset.d; render(); break;
      case "chi": S.chi = b.dataset.v; LS.set("ds_chi", S.chi); chiudiFoglio(); render(); break;
      case "salva-sb":
        LS.set("ds_sb_url", $("#sb-url").value.trim()); LS.set("ds_sb_anon", $("#sb-anon").value.trim());
        location.reload(); break;
      case "tg-trova": await trovaGruppoTelegram(); break;
      case "tg-scegli": LS.set("ds_tg", { ...tg(), chat: b.dataset.id }); chiudiFoglio(); render(); toast("Gruppo scelto: ora premi «Messaggio di prova»"); break;
      case "tg-salva": LS.set("ds_tg", { token: $("#tg-token").value.trim(), chat: $("#tg-chat").value.trim() }); toast("Telegram salvato"); controllaAvvisi(); break;
      case "tg-prova":
        LS.set("ds_tg", { token: $("#tg-token").value.trim(), chat: $("#tg-chat").value.trim() });
        try { await inviaTelegram("<b>CheManca?</b>\nProva riuscita: gli avvisi arriveranno qui."); toast("Messaggio inviato su Telegram"); }
        catch (e) { toast("Telegram: " + e.message); }
        break;
      case "wa-salva":
      case "wa-prova": {
        const w = { max: { tel: $("#wa-max-tel").value.trim(), key: $("#wa-max-key").value.trim() }, vale: { tel: $("#wa-vale-tel").value.trim(), key: $("#wa-vale-key").value.trim() } };
        LS.set("ds_wa", w);
        if (a === "wa-prova") { await inviaWhatsapp("CheManca?: prova riuscita, gli avvisi arriveranno qui."); toast("Inviato: controlla WhatsApp tra qualche secondo"); }
        else toast("WhatsApp salvato");
        break;
      }
      case "piano-svuota":
        if (!confirm("Svuotare il piano alimentare? Frigo, dispensa e spesa restano; l'app smette di calcolare cosa manca finché non carichi una nuova dieta.")) break;
        await salva("piano", [{ id: "attuale", dati: null, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
        dopoModifica(); toast("Piano svuotato");
        break;
      case "piano-ripristina": await elimina("piano", "attuale"); dopoModifica(); toast("Torna il piano pubblicato con l'app"); break;
      case "importa-conferma": await confermaImport(); break;
      case "demo":
        if (!confirm("Sostituire frigo e dispensa con i dati di esempio?")) break;
        await elimina("inventario", S.db.inventario.map((i) => i.id));
        await salva("inventario", caricaDemo());
        dopoModifica(); vai("oggi"); toast("Dati di esempio caricati");
        break;
      case "backup": {
        const blob = new Blob([JSON.stringify({ salvato: new Date().toISOString(), ...S.db }, null, 1)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url; link.download = `dispensa-${oggi()}.json`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        break;
      }
      case "svuota":
        if (!confirm("Cancellare frigo, dispensa, spesa e pasti segnati" + (condiviso ? " per tutti e due i telefoni" : "") + "?")) break;
        await A.azzera(); S.db = vuoto(); dopoModifica(); toast("Tutto cancellato");
        break;
    }
  });

  // campi dei fogli e ricerche: aggiornano lo stato mentre si scrive
  document.addEventListener("input", (ev) => {
    const el = ev.target;
    if (el.dataset.f && S.sheet && S.sheet.d) {
      S.sheet.d[el.dataset.f] = el.value;
      if (el.tagName === "SELECT") {
        // cambiando voce del piano, il posto giusto viene suggerito
        if (el.dataset.f === "voce" && S.piano && S.sheet.tipo === "prodotto") {
          const lu = L.luogoDaVoce(S.piano, el.value);
          if (lu) S.sheet.d.luogo = lu;
        }
        renderFoglio();
      }
    }
    if (el.dataset.in) { S[el.dataset.in] = el.value; render(); }
  });
  document.addEventListener("change", async (ev) => {
    const el = ev.target;
    if (el.dataset.file === "piano" && el.files[0]) {
      try {
        const p = JSON.parse(await el.files[0].text());
        if (!p.inizio || !Array.isArray(p.settimane)) throw new Error("non sembra un piano.json");
        if (S.piano && p.inizio > oggi()) p.prima = { ...S.piano, prima: undefined };
        await salva("piano", [{ id: "attuale", dati: p, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
        dopoModifica(); toast("Nuovo piano in uso dal " + ddmm(p.inizio));
      } catch (e) { toast("Piano non valido: " + e.message); }
      el.value = "";
    }
    if (el.dataset.file === "copia" && el.files[0]) {
      try {
        const c = JSON.parse(await el.files[0].text());
        if (!Array.isArray(c.inventario)) throw new Error("non è una copia di CheManca?");
        if (!confirm("Sostituire tutti i dati di questo telefono con la copia del " + (c.salvato || "").slice(0, 10) + "?")) return;
        const nuovo = vuoto();
        for (const t of TABELLE) nuovo[t] = Array.isArray(c[t]) ? c[t] : [];
        await A.azzera(nuovo);
        if (condiviso) for (const t of TABELLE) if (nuovo[t].length) await A.scrivi(t, nuovo[t]);
        S.db = nuovo; dopoModifica(); toast("Copia ripristinata");
      } catch (e) { toast("Copia non valida: " + e.message); }
      el.value = "";
    }
    if (el.dataset.file === "pdf" && el.files.length) {
      await leggiPdfDieta([...el.files]);
      el.value = "";
    }
  });
  document.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.target.dataset.form;
    if (f === "ean") {
      const v = $("#ean").value.replace(/\D/g, "");
      if (v.length < 8) return toast("Il codice ha almeno 8 cifre");
      fermaScanner(); trovatoCodice(v);
    }
    if (f === "spesa-nuova") {
      const nome = $("#nuova-voce").value.trim();
      if (!nome) return;
      await salva("spesa", [{ nome, qty_txt: "", motivo: "", urgenza: "dopo", origine: "mano", fatto: false, creato_da: S.chi || "", creato: new Date().toISOString() }]);
      render(); renderNav();
      $("#nuova-voce") && $("#nuova-voce").focus();
    }
  });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && S.sheet) chiudiFoglio(); });

  function apriProdotto(d) { fermaScanner(); apriFoglio({ tipo: "prodotto", d }); }

  /* ---------------- avvisino ---------------- */
  let tToast = null;
  function toast(msg, azione, fn) {
    const el = $("#toast");
    el.innerHTML = `<span>${esc(msg)}</span>${azione ? `<button type="button">${esc(azione)}</button>` : ""}`;
    el.classList.add("on");
    if (azione) el.querySelector("button").onclick = () => { nascondiToast(); fn(); };
    clearTimeout(tToast);
    tToast = setTimeout(nascondiToast, azione ? 6000 : 3500);
  }
  function nascondiToast() { $("#toast").classList.remove("on"); }

  /* ---------------- avvio ---------------- */
  async function avvio() {
    try { S.pianoFile = await (await fetch("piano.json", { cache: "no-cache" })).json(); }
    catch { S.pianoFile = null; }
    try { S.db = await A.carica(); }
    catch (e) { console.error(e); toast("Database non raggiungibile: " + (e.message || e)); }
    A.ascolta(ricaricaPresto);
    dopoModifica();
    if (!S.chi) apriFoglio({ tipo: "chi" });
    if (S.tab === "aggiungi" && S.aggTab === "codice") avviaScanner();
    // al ritorno sull'app (dal frigo al telefono) si riallinea: il giorno può essere cambiato
    document.addEventListener("visibilitychange", () => { if (!document.hidden) ricarica(); });
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  avvio();
})();
