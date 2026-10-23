/* CheManca? — l'app. JavaScript semplice, niente build: si apre così com'è. */
(() => {
  "use strict";
  const L = window.Logica;
  const CFG = window.CONFIG || {};
  const VERSIONE = "23.10.2026 · 11";
  const TABELLE = ["inventario", "prodotti", "catalogo", "spesa", "pasti", "avvisi", "piano", "pesi", "note", "fitness"];
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
    bilancia: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 9a5 5 0 0 1 8 0"/><path d="M12 9l1.5-2"/>',
    libro: '<path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 8h6"/><path d="M8 12h6"/>',
    cambia: '<path d="M4 7h13l-3-3"/><path d="M20 17H7l3 3"/>',
    matita: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    inverti: '<path d="M7 4v16"/><path d="m3 8 4-4 4 4"/><path d="M17 20V4"/><path d="m21 16-4 4-4-4"/>',
    fitness: '<path d="M6 6v12"/><path d="M3 9v6"/><path d="M18 6v12"/><path d="M21 9v6"/><path d="M6 12h12"/>',
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
    diarioTab: "peso",
    pesoPersona: null,
    storicoGiorni: 7,
    storicoPersona: "tutti",
    online: false,
    erroreSalvataggio: "",
  };
  const OGGI_FORZATO = new URLSearchParams(location.search).get("oggi");
  // ?modo=light o ?modo=pro nel link imposta la versione (utile per far provare la Light)
  { const m = new URLSearchParams(location.search).get("modo"); if (m === "light" || m === "pro") LS.set("ds_modo", m); }
  const light = () => LS.get("ds_modo", "pro") === "light";
  const SCHERMI_LIGHT = ["oggi", "piano", "spesa", "imp", "diario"];
  const oggi = () => OGGI_FORZATO || L.iso(new Date());
  const oraAdesso = () => { const d = new Date(); return OGGI_FORZATO ? Number(new URLSearchParams(location.search).get("ora") || 7) : d.getHours() + d.getMinutes() / 60; };

  function eventoSicuro(fn) {
    return async (ev) => { try { await fn(ev); } catch (e) { erroreArchivio(e); } };
  }
  /* ---------------- archivio: Supabase o solo telefono ---------------- */
  function vuoto() { return Object.fromEntries(TABELLE.map((t) => [t, []])); }

  function archivioLocale() {
    let db, letturaFallita = false;
    try {
      const raw = localStorage.getItem("ds_db");
      db = raw === null ? vuoto() : JSON.parse(raw);
      if (!db || typeof db !== "object" || Array.isArray(db)) throw new Error("Archivio non valido");
      for (const t of TABELLE) {
        if (db[t] == null) db[t] = [];
        if (!Array.isArray(db[t])) throw new Error("Tabella non valida: " + t);
      }
    } catch { db = vuoto(); letturaFallita = true; }
    function verifica() { if (letturaFallita) throw new Error("Archivio locale non leggibile. Ripristina un backup da Impostazioni; i dati originali non sono stati sovrascritti."); }
    function conferma(nuovo, ripristino = false) {
      if (!ripristino) verifica();
      // localStorage sostituisce un solo valore: se fallisce, il vecchio archivio rimane intatto.
      try { localStorage.setItem("ds_db", JSON.stringify(nuovo)); }
      catch { throw new Error("Salvataggio non riuscito: memoria del browser piena o non disponibile. Libera spazio e riprova."); }
      db = nuovo; letturaFallita = false;
      if (ripristino) S.erroreSalvataggio = "";
    }
    return {
      tipo: "locale",
      transazione(fn) { verifica(); const nuovo=JSON.parse(JSON.stringify(db)); const risultato=fn(nuovo); conferma(nuovo); return { db:JSON.parse(JSON.stringify(nuovo)), risultato }; },
      async carica() { verifica(); return JSON.parse(JSON.stringify(db)); },
      async scrivi(t, righe) {
        verifica();
        let lista = db[t];
        for (const r of righe) lista = lista.filter((x) => x.id !== r.id).concat({ ...r });
        conferma({ ...db, [t]: lista });
      },
      async nuovo(t, riga) {
        verifica();
        if (db[t].some((x) => x.id === riga.id)) return false;
        conferma({ ...db, [t]: [...db[t], { ...riga }] }); return true;
      },
      async modifica(t, id, patch) { verifica(); conferma({ ...db, [t]: db[t].map((x) => x.id === id ? { ...x, ...patch } : x) }); },
      async elimina(t, ids) { verifica(); conferma({ ...db, [t]: db[t].filter((x) => !ids.includes(x.id)) }); },
      ascolta() {},
      async azzera(nuovoDb) { conferma(nuovoDb || vuoto()); },
      async ripristina(nuovoDb) {
        const precedente = localStorage.getItem("ds_db");
        // Non distruggere mai la copia precedente se non c'è spazio per conservarla.
        if (precedente !== null) localStorage.setItem("ds_db_pre_ripristino", precedente);
        conferma(nuovoDb, true);
      },
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
    try { await A.scrivi(t, righe); } catch (e) { erroreArchivio(e); throw e; }
    inMemoria(t, righe);
    return righe;
  }
  async function modifica(t, id, patch) {
    try { await A.modifica(t, id, patch); } catch (e) { erroreArchivio(e); throw e; }
    inMemoria(t, [{ id, ...patch }]);
  }
  async function elimina(t, ids) {
    ids = [].concat(ids);
    try { await A.elimina(t, ids); } catch (e) { erroreArchivio(e); throw e; }
    S.db[t] = S.db[t].filter((x) => !ids.includes(x.id));
  }
  function erroreArchivio(e) {
    console.error(e);
    S.erroreSalvataggio = e.message || String(e);
    toast(S.erroreSalvataggio);
    renderTesta();
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
  const COLORI_PERSONE = ["#1D5A8A", "#B4472A", "#6B3FA0", "#0F766E", "#9A3412", "#4D7C0F"];
  function persone() {
    const r = S.db.piano.find((x) => x.id === "persone");
    return r && Array.isArray(r.dati) ? r.dati : [];
  }
  function nomeDi(id) {
    const p = persone().find((x) => x.id === id);
    return p ? p.nome : id ? id.charAt(0).toUpperCase() + id.slice(1) : "";
  }
  function coloreDi(id) {
    const i = persone().findIndex((x) => x.id === id);
    return COLORI_PERSONE[(i < 0 ? 0 : i) % COLORI_PERSONE.length];
  }
  async function salvaPersone(lista) {
    await salva("piano", [{ id: "persone", dati: lista, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
  }

  function scegliPiano() {
    const r = S.db.piano.find((x) => x.id === "attuale");
    // piano.json pubblicato vale solo per chi lo usava già (Max e Vale): le famiglie nuove caricano il loro PDF
    S.piano = r ? r.dati || null : LS.get("ds_usa_pianofile", false) ? S.pianoFile : null;
    if (S.piano && S.pianoFile && !Object.keys(S.piano.categorie || {}).length) S.piano.categorie = S.pianoFile.categorie;
  }

  function giorniSpesaPro() {
    const r = S.db.piano.find((x) => x.id === "spesa_pro");
    return r && r.dati && [1,3,7,14].includes(r.dati.giorni) ? r.dati.giorni : 3;
  }
  function ricalcola() {
    scegliPiano();
    if (!S.piano) { S.calc = { mancanze: [], totaleVoci: 0, pronte: 0, pasti: [] }; S.calc7 = S.calc; S.calcSpesa = S.calc; return; }
    const inv = S.db.inventario;
    S.calc = L.calcolaMancanze(S.piano, inv, statiPasti(), oggi(), 3, oraAdesso());
    S.calc7 = L.calcolaMancanze(S.piano, inv, statiPasti(), oggi(), 7, oraAdesso());
    const giorni = giorniSpesaPro();
    S.calcSpesa = L.calcolaMancanze(S.piano, inv, statiPasti(), oggi(), giorni, oraAdesso(), giorni === 1 ? 24 : undefined);
  }

  let allineando = false;
  async function allineaSpesa() {
    if (light()) {
      return accodaSpesaLight(async () => {
        await assicuraSpesaLight();
        const stato = JSON.parse(JSON.stringify(statoSpesaLight())), p = periodoSpesaLight(stato);
        const righe = fabbisognoPeriodoLight(p);
        if (JSON.stringify(p.righe) !== JSON.stringify(righe)) { p.righe = righe; await salvaStatoLight(stato); }
      });
    }
    if (allineando || !S.calc) return;
    allineando = true;
    try {
      const ops = L.allineaSpesa(S.db.spesa, (S.calcSpesa || S.calc).mancanze, oggi());
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
      allineaSpesa().then(() => { renderNav(); if (S.tab === "spesa") render(); }).catch(erroreArchivio);
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
    if (light() || controllando || !S.calc || !(avvisiAttivi() || whatsappAttivo())) return;
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
    </header><div id="errore-salvataggio" class="avviso rosso" role="alert" style="margin:0 16px 14px;${S.erroreSalvataggio ? "" : "display:none"}" ${S.erroreSalvataggio ? "" : "hidden"}>${esc(S.erroreSalvataggio || "")}</div>`;
  }
  function renderTesta() {
    const el = $("#stato-rete");
    const errore = document.getElementById("errore-salvataggio");
    if (errore) { errore.textContent = S.erroreSalvataggio || ""; errore.hidden = !S.erroreSalvataggio; errore.style.display = S.erroreSalvataggio ? "" : "none"; }
    if (el) el.textContent = condiviso ? (S.online ? "Condiviso" : "Condiviso…") : "Solo qui";
  }

  function renderNav() {
    const daPrendere = light() ? righeListaLight().filter((r) => !r.coperto).length + periodoSpesaLight().manuali.filter((r) => !r.fatto).length : S.db.spesa.filter((s) => !s.fatto).length;
    const mancano = S.calc7 ? S.calc7.mancanze : [];
    const liv = mancano.length ? Math.min(...mancano.map((m) => livello(m.data))) : 0;
    const extra = (tab) => tab === "spesa" && daPrendere ? `<span class="badge">${daPrendere}</span>`
      : tab === "oggi" && !light() && mancano.length ? `<span class="badge liv-${liv}" aria-label="${mancano.length} cibi mancano">${mancano.length}</span>` : "";
    const b = (tab, nome, icona) => `<button data-a="vai" data-tab="${tab}" ${S.tab === tab || (light() && tab === "oggi" && S.tab === "piano") ? 'aria-current="page"' : ""}>${ico(icona)}${nome}${extra(tab)}</button>`;
    $("#nav").classList.toggle("light", light());
    if (light()) { $("#nav").innerHTML = b("oggi", "Oggi", "casa") + b("spesa", "Spesa", "carrello") + b("diario", "Diario", "libro"); return; }
    $("#nav").innerHTML = b("oggi", "Oggi", "casa") + b("casa", "Casa", "frigo") +
      `<button class="centro" data-a="vai" data-tab="aggiungi" aria-label="Aggiungi prodotti" ${S.tab === "aggiungi" ? 'aria-current="page"' : ""}>${ico("scan", 28)}</button>` +
      b("spesa", "Spesa", "carrello") + b("piano", "Piano", "calendario");
  }

  /* ---------------- i giorni passati si chiudono da soli ----------------
     I pasti passati non registrati vengono chiusi come fatti automaticamente.
     Le scorte PRO si aggiornano solo dal giorno in cui è attivata questa gestione. */
  let chiudendo = false;
  async function chiudiGiorniPassati() {
    if(chiudendo || !S.piano) return;
    chiudendo=true;
    try {
      await operazionePasti((db)=>{
        const cursore=db.piano.find((x)=>x.id==="chiusura_giorni");
        const dalScorte=cursore && cursore.dati && cursore.dati.dal || oggi();
        for(let data=S.piano.inizio;data<oggi();data=L.piuGiorni(data,1)) {
          const giorno=L.giornoPiano(S.piano,data);if(!giorno)continue;
          for(const p of giorno.pasti) {
            const k=L.chiavePasto(data,p.pasto),r=db.pasti.find((x)=>x.id===k);
            if(r && !["auto","parziale","solo:max","solo:vale","max","vale"].includes(r.stato) && !r.stato.startsWith("solo:"))continue;
            registraPastoDb(db,k,"automatico",{pasto:p,consuma:!light() && data>=dalScorte,automatico:true});
          }
        }
        scriviRigaDb(db,"piano",{id:"chiusura_giorni",dati:{dal:oggi()},aggiornato:new Date().toISOString()});
      });
    } catch(e) { erroreArchivio(e); }
    finally { chiudendo=false; }
  }

  /* ---------------- OGGI ---------------- */
  // solo i pasti di oggi, man mano che arriva la loro ora (dalla colazione in poi)
  function daConfermare() {
    if (!S.piano) return [];
    const g = L.giornoPiano(S.piano, oggi());
    if (!g) return [];
    const stati = statiPasti();
    const adesso = oraAdesso();
    return g.pasti
      .filter((p) => !p.libero && p.pasto !== "Fuori pasto" && L.ORA[p.pasto] <= adesso && !stati[L.chiavePasto(oggi(), p.pasto)])
      .map((p) => ({ ...p, data: oggi(), chiave: L.chiavePasto(oggi(), p.pasto) }));
  }

  function descrPasto(p) {
    if (p.piatti && p.piatti.length) return p.piatti.join(", ");
    const nomi = p.voci.filter((v) => !L.PRESENZA.has(v.u) && !L.GENERICHE.has(v.nome)).map((v) => v.nome);
    return (nomi.length ? nomi : p.voci.map((v) => v.nome)).slice(0, 3).join(", ");
  }


  function pastoPerPersona(p, id) { return p.libero || p.voci.some((v) => Number(L.dosi(v)[id]) > 0); }
  function registratoPerPersona(r, id) {
    if (!r || r.stato === "auto") return false;
    if (r.stato === "fatto" || r.stato === "automatico" || r.stato === "saltato") return true;
    if (r.stato === "parziale") return (r.contenuto && r.contenuto.confermati || []).includes(id);
    return r.stato === "solo:" + id || r.stato === id;
  }
  const FINE_PASTO_HOME = { Colazione: 9.5, "Metà mattina": 11.5, Pranzo: 14, Merenda: 17.5, Cena: 21 };
  function prossimoPastoHome() {
    if (!S.piano) return null;
    const stati = statiPasti();
    for (let i=0;i<8;i++) {
      const data=L.piuGiorni(oggi(),i),g=L.giornoPiano(S.piano,data); if(!g) continue;
      const pasti=[...g.pasti].filter((p)=>p.pasto!=="Fuori pasto" && pastoPerPersona(p,S.chi)).sort((a,b)=>(L.ORA[a.pasto]??12)-(L.ORA[b.pasto]??12));
      for (const p of pasti) if ((i>0 || oraAdesso() <= (FINE_PASTO_HOME[p.pasto] ?? 24)) && !registratoPerPersona(stati[L.chiavePasto(data,p.pasto)],S.chi)) return { ...p, data };
    }
    return null;
  }

  function firmaPastoHome(p) { return [oggi(), S.chi, p && p.data, p && p.pasto].join("|"); }
  function aggiornaHomeAutomatica() {
    if (document.hidden || !light() || S.tab !== "oggi") return;
    const attivo = document.activeElement;
    if (attivo && ["SELECT","INPUT","TEXTAREA"].includes(attivo.tagName)) return;
    if (S.homePastoMostrato !== firmaPastoHome(prossimoPastoHome())) render();
  }
  async function confermaPastoHome(k) {
    const [data,nome] = k.split("|");
    if (data !== oggi() || !light()) return;
    const p = pastoArchiviato(k);
    if (!p || !pastoPerPersona(p,S.chi)) return;
    const r = S.db.pasti.find((x)=>x.id===k);
    if (registratoPerPersona(r,S.chi)) return;
    const precedenti = r && r.stato !== "auto" && r.stato !== "saltato" ? chiHaMangiato(r,r.contenuto) : [];
    const partecipanti = persone().filter((x)=>pastoPerPersona(p,x.id)).map((x)=>x.id);
    const confermati = [...new Set([...precedenti,S.chi])].filter((id)=>partecipanti.includes(id));
    const stato = partecipanti.every((id)=>confermati.includes(id)) ? "fatto" : confermati.length===1 ? "solo:"+confermati[0] : "parziale";
    const contenuto = { ...(r && r.contenuto || fotoPasto(p)), confermati };
    await salva("pasti", [{ id:k, data, pasto:nome, stato, chi:S.chi, quando:new Date().toISOString(), scalato:r && r.scalato || [], contenuto }]);
    dopoModifica(); toast("Pasto di " + nomeDi(S.chi) + " registrato");
  }

  function schermoHomeLight() {
    const g=S.piano && L.giornoPiano(S.piano,oggi()),stati=statiPasti();
    const pasti=g?g.pasti.filter((p)=>p.pasto!=="Fuori pasto" && pastoPerPersona(p,S.chi)):[];
    const registrati=pasti.filter((p)=>registratoPerPersona(stati[L.chiavePasto(oggi(),p.pasto)],S.chi)).length;
    const prossimo=prossimoPastoHome(),lista=periodoSpesaLight(),daComprare=righeListaLight(lista).filter((r)=>!r.coperto).length+lista.manuali.filter((r)=>!r.fatto).length;
    S.homePastoMostrato = firmaPastoHome(prossimo);
    let h=testa(dataLunga(oggi()),"Ciao "+nomeDi(S.chi))+`<div class="corpo"><div class="home-intro"><p>Il tuo piano, giorno dopo giorno.</p>${persone().length>1?`<label class="campo">Stai guardando il piano di<select id="home-persona">${sel(S.chi,persone().map((p)=>[p.id,p.nome]))}</select></label>`:""}</div><div class="home-grid">`;
    if(!S.piano) h+=`<section class="home-card home-principale"><span class="home-etichetta">Il tuo piano alimentare</span><h2>Partiamo dalla tua dieta</h2><p>Carica il PDF della dietista e controlla l'abbinamento con i nomi della famiglia.</p><label class="btn largo carica-pdf">${ico("piu",20)}<span>Carica la dieta dal PDF</span><input type="file" accept="application/pdf,.pdf" multiple data-file="pdf" class="sr"></label></section>`;
    else if(prossimo) {
      const dosi=(prossimo.voci||[]).filter((v)=>Number(L.dosi(v)[S.chi])>0).map((v)=>`<li><span>${esc(v.nome)}</span><b>${esc(fmtLight(L.dosi(v)[S.chi],v.u))}</b></li>`).join("");
      h+=`<section class="home-card home-principale"><span class="home-etichetta">Prossimo pasto · ${esc(L.nomeGiorno(prossimo.data,oggi()))}</span><h2>${esc(prossimo.pasto)} <small>${esc(oreLight(L.ORA[prossimo.pasto]??12))}</small></h2><p class="home-caption">Orario indicativo · dosi per ${esc(nomeDi(S.chi))}</p>${prossimo.libero?'<p>Pasto libero: puoi scrivere cosa hai mangiato anche in seguito.</p>':`<ul class="home-dosi">${dosi}</ul>`}<div class="home-azioni-pasto"><button class="btn sec" data-a="piano-apri" data-d="${esc(prossimo.data)}" data-pasto="${esc(prossimo.pasto)}">Apri il pasto</button><button class="btn" data-a="home-pasto-fatto" data-k="${esc(L.chiavePasto(prossimo.data,prossimo.pasto))}" ${prossimo.data > oggi() ? 'disabled title="Puoi confermare il pasto dal giorno previsto"' : ""} aria-label="Fatto! Conferma il pasto di ${esc(nomeDi(S.chi))}">Fatto!</button></div></section>`;
    } else h+='<section class="home-card home-principale"><h2>Nessun pasto in programma</h2><p>Puoi consultare il piano completo o aggiornare la dieta dalle Impostazioni.</p><button class="btn" data-a="piano-apri">Apri il piano</button></section>';
    h+=`<section class="home-card"><span class="home-etichetta">La giornata di oggi</span><h2>${registrati} <small>di ${pasti.length} pasti registrati</small></h2><p>A fine giornata i pasti rimasti vengono registrati automaticamente. Puoi correggerli nello storico.</p><button class="btn sec largo" data-a="piano-apri" data-d="${oggi()}">Piano di oggi e settimana</button></section>
      <section class="home-card"><span class="home-etichetta">La spesa della famiglia</span><h2>${daComprare} <small>voci da prendere</small></h2><p>${esc(nomePeriodoLight(lista))}</p><button class="btn sec largo" data-a="vai" data-tab="spesa">Apri la lista</button></section>
      <section class="home-card"><span class="home-etichetta">Il tuo diario</span>${LS.get("ds_home_peso",true)?`<h2>${esc(ultimoPesoTesto())}</h2>`:"<h2>Il tuo percorso</h2>"}<p>Pasti, pesate e attività fisica, con il report per la dietista.</p><div class="due"><button class="btn piccolo sec" data-a="vai-diario" data-v="peso">Peso</button><button class="btn piccolo sec" data-a="vai-diario" data-v="storico">Storico</button></div></section></div></div>`;
    return h;
  }

  function schermoOggi() {
    if (light()) return schermoHomeLight();
    const d = L.daIso(oggi());
    const sopra = cap(L.GIORNI[d.getDay()]) + " " + d.getDate() + " " + MESI[d.getMonth()];
    if (!S.piano) return testa(sopra, "Ciao " + nomeDi(S.chi)) + `<div class="corpo">
      <div class="avviso blu"><span><b>Manca la dieta.</b> Carica il PDF «Dieta a menu giornaliero» che ti ha dato la dietista: l'app legge da sola ogni giorno e ogni pasto.</span></div>
      <label class="btn largo" style="cursor:pointer">${ico("piu", 18)} Carica la dieta (PDF)<input type="file" accept="application/pdf,.pdf" multiple data-file="pdf" class="sr"></label>
    </div>`;
    const c = S.calc;
    const manca = c.mancanze.filter((m) => m.tipo === "manca").length;
    const scarso = c.mancanze.length - manca;
    const g0 = L.giornoPiano(S.piano, oggi());
    const fine = L.etichettaData(L.piuGiorni(oggi(), 2));
    let h = testa(sopra, "Ciao " + nomeDi(S.chi));
    h += `<div class="corpo">`;
    if (g0 && g0.oltre) h += `<div class="avviso giallo">Il piano del mese è finito e sta ricominciando dalla settimana 1. Carica il nuovo da Impostazioni.</div>`;
    h += `<section class="riepilogo" aria-label="Prossimi 3 giorni">
      <div class="r1"><span>Prossimi 3 giorni · fino a ${esc(fine)}</span><span>${g0 ? (g0.alternativa ? "Sett. alternativa" : "Settimana " + g0.settimana) : "–"}</span></div>
      <div style="display:flex;align-items:baseline;gap:8px"><span class="num">${c.pronte}<small>/${c.totaleVoci}</small></span><span style="font-size:15px;font-weight:600">ingredienti in casa</span></div>
      <div class="barra" aria-hidden="true"><span style="flex:${c.pronte}"></span><span style="flex:${scarso}"></span><span style="flex:${manca}"></span></div>
      <div class="conti"><span>${manca} mancano</span><span>${scarso} scarseggiano</span><span>${c.pronte} pronti</span></div>
    </section>`;

    h += `<div class="due">
      <button class="scorciatoia" data-a="vai-diario" data-v="peso">${ico("bilancia", 22)}<span><b>Peso</b><small>${esc(ultimoPesoTesto())}</small></span></button>
      <button class="scorciatoia" data-a="vai-diario" data-v="storico">${ico("libro", 22)}<span><b>Storico</b><small>pasti e report</small></span></button>
    </div>`;

    const conf = daConfermare();
    if (conf.length) {
      h += `<div class="titolo-sez"><h2>Com'è andata oggi?</h2></div><div class="card">`;
      for (const p of conf) {
        h += `<div class="riga" style="flex-wrap:wrap">
          <div class="testo"><span class="nome">${esc(p.pasto)}</span><span class="nota">${esc(descrPasto(p))}</span></div>
          <div style="display:flex;gap:6px">
            <button class="btn piccolo" data-a="pasto" data-k="${esc(p.chiave)}" data-stato="fatto">Fatto</button>
            <button class="btn piccolo sec" data-a="pasto-altro" data-k="${esc(p.chiave)}">Altro</button>
          </div></div>`;
      }
      h += `</div><p style="font-size:12px;color:var(--muted);padding:0 4px">Con «Fatto» le dosi escono da frigo e dispensa. A fine giornata i pasti rimasti vengono registrati automaticamente e le dosi vengono scalate.</p>`;
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
    h += `<div class="legenda-liv">` + LIVELLI.map((l, i) =>
      `<button class="liv-${i}" data-a="scorri-liv" data-liv="${i}" aria-label="${l.nome}: ${gruppi[i].length}, vai alla lista">${l.nome}<b>${gruppi[i].length}</b></button>`).join("") + `</div>`;
    gruppi.forEach((g, i) => {
      if (!g.length) return;
      const quando = i < 3 ? L.etichettaData(L.piuGiorni(oggi(), i)) : "nei prossimi giorni";
      h += `<section class="gruppo-manca liv-${i}" id="manca-liv-${i}" aria-label="${LIVELLI[i].nome}: ${g.length} da comprare">
        <div class="gm-testa"><span class="gm-punto" aria-hidden="true"></span><b>${LIVELLI[i].nome}</b><span>${esc(quando)}</span><span class="gm-conta">${g.length}</span></div>
        <div class="gm-badge">`;
      // il verde (c'è tempo) può essere lungo: si mostrano i primi e il resto a richiesta
      const visibili = i === 3 && !S.tuttiVerdi ? g.slice(0, 6) : g;
      for (const m of visibili) {
        const q = L.quantitaSpesa(m);
        const quale = i === 3 ? L.etichettaData(m.data) + " · " + m.pasto.toLowerCase() : m.pasto.toLowerCase();
        h += `<button class="badge-manca" data-a="manca-tap" data-voce="${esc(m.voce)}" data-da="oggi">
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
    const cat = [...window.CATALOGO_BASE.filter((c) => !nomi.has(c.nome.toLowerCase())), ...propri];
    // pasta, crackers, pesto…: le voci del piano senza un prodotto a tap ne ricevono uno
    if (S.piano) {
      const coperte = new Set(cat.flatMap((c) => c.voci || []));
      const u = new Map();
      for (const s of S.piano.settimane) for (const g of s) for (const p of g) for (const v of p.voci) u.set(v.nome, v.u);
      for (const v of S.piano.extra || []) u.set(v.nome, v.u);
      for (const [voce, un] of u) {
        if (coperte.has(voce) || nomi.has(voce.toLowerCase())) continue;
        const base = { gruppo: "Dal piano", luogo: L.luogoDaVoce(S.piano, voce) || "dispensa", nome: voce, voci: [voce], virtuale: true };
        const r = L.REGOLE[voce];
        if (r) cat.push({ ...base, unita: r.unita, passo: 1, g_pz: r.g_pz || null });
        else if (un === "g") cat.push({ ...base, unita: "g", passo: 100, g_pz: null });
        else if (un === "n.") cat.push({ ...base, unita: "pz", passo: 1, g_pz: 60 });
        else if (un === "vasetto") cat.push({ ...base, unita: "pz", passo: 1, g_pz: 150 });
        else cat.push({ ...base, unita: "pz", passo: 1, g_pz: null });
      }
    }
    return cat;
  }
  // il prodotto a tap che copre una voce del piano: prima quello che "è" la voce, poi chi la conta
  // le voci generiche non sono un prodotto: si sceglie tu quale frutta o verdura
  const GRUPPO_GENERICO = { "Frutta di stagione": "Frutta", "Verdura di stagione": "Verdura", "Misto verdure crude": "Verdura" };
  function catalogoPerVoce(voce) {
    if (GRUPPO_GENERICO[voce]) return null;
    const cat = catalogo();
    return cat.find((c) => (c.voci || [])[0] === voce) || cat.find((c) => (c.voci || []).includes(voce)) || null;
  }
  // quanto prendere per coprire quello che manca
  function qtyPerMancanza(c, m) {
    const passo = c.passo || 1;
    if (!m || m.presenza) return passo;
    if (c.unita === "g" && m.u === "g") return Math.max(passo, Math.ceil(m.manca / passo) * passo);
    if (c.unita === "g") return passo;
    if (m.u === "n.") return Math.max(1, Math.ceil(m.manca));
    if (m.u === "g" && c.g_pz) return Math.max(1, Math.ceil(m.manca / c.g_pz));
    if (m.u === "vasetto") return Math.max(1, Math.ceil(c.g_pz ? (m.manca * 150) / c.g_pz : m.manca));
    return passo;
  }
  function scegliPerMancanza(voce) {
    const c = catalogoPerVoce(voce);
    if (!c) return null;
    const m = (S.calc7 ? S.calc7.mancanze : []).find((x) => x.voce === voce);
    const s = S.scelta.get(c.nome);
    if (s) s.qty += c.passo || 1;
    else S.scelta.set(c.nome, { qty: qtyPerMancanza(c, m), luogo: c.luogo || "frigo" });
    return c;
  }
  const voceMancante = () => new Set((S.calc ? S.calc.mancanze : []).map((m) => m.voce));

  function fmtScelta(c, qty) {
    if (c.unita === "g") return qty >= 1000 ? L.fmtNum(qty / 1000) + " kg" : qty + " g";
    if (c.unita === "l") return L.fmtLitri(qty);
    return "×" + qty;
  }
  // la quantità nel riepilogo: "2 pz", "3 pacchetti", "1 l", "400 g"
  function fmtRiepilogo(c, qty) {
    if (c.unita !== "pz") return fmtScelta(c, qty);
    const r = L.REGOLE[(c.voci || [])[0]];
    return qty + " " + (r && r.etichetta ? r.etichetta[qty === 1 ? 0 : 1] : "pz");
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
      <p style="font-size:13px;color:var(--muted);padding:0 4px">Tocca tutti i prodotti che hai, poi il bottone verde in fondo per scegliere frigo o dispensa.</p>`;
    const mancanti = !q && S.calc7 ? S.calc7.mancanze : [];
    if (mancanti.length) {
      h += `<section class="gruppo"><h3>Cosa manca</h3><div class="chips">`;
      for (const m of mancanti) {
        const gr = GRUPPO_GENERICO[m.voce];
        if (gr) {
          h += `<button class="chip chip-manca liv-${livello(m.data)}" data-a="vai-gruppo" data-gruppo="${esc(gr)}" data-voce="${esc(m.voce)}" aria-label="${esc(m.voce)}: scegli quale">
            <span class="punto-liv" aria-hidden="true"></span>${esc(m.voce)}<span style="font-weight:600;color:var(--muted)">${esc(L.quantitaSpesa(m))} · scegli</span></button>`;
          continue;
        }
        const c = catalogoPerVoce(m.voce);
        if (!c) continue;
        const sel = S.scelta.get(c.nome);
        h += `<button class="chip chip-manca liv-${livello(m.data)} ${sel ? "scelto" : ""}" data-a="manca-tap" data-voce="${esc(m.voce)}" aria-label="${esc(c.nome)}, serve ${esc(L.nomeGiorno(m.data, oggi()))}${sel ? ", scelti " + fmtScelta(c, sel.qty) : ""}">
          <span class="punto-liv" aria-hidden="true"></span>${esc(c.nome)}${sel ? `<span class="conta">${esc(fmtScelta(c, sel.qty))}</span>` : ""}</button>`;
      }
      h += `</div></section>`;
    }
    for (const gr of window.GRUPPI_CATALOGO) {
      const voci = cat.filter((c) => (c.gruppo || "Altro") === gr);
      if (!voci.length && (q || gr !== "Altro")) continue;
      h += `<section class="gruppo" id="gruppo-${esc(gr.replace(/\s+/g, "-"))}"><h3>${esc(gr)}</h3><div class="chips">`;
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
    if (light()) return schermoSpesaLight();
    const lista = [...S.db.spesa].sort((a, b) =>
      (a.origine === "piano" ? 0 : 1) - (b.origine === "piano" ? 0 : 1) ||
      (a.fatto ? 1 : 0) - (b.fatto ? 1 : 0) ||
      ["urgente", "entro", "dopo"].indexOf(a.urgenza || "dopo") - ["urgente", "entro", "dopo"].indexOf(b.urgenza || "dopo") ||
      (a.data_serve || "9").localeCompare(b.data_serve || "9"));
    const daPrendere = lista.filter((s) => !s.fatto).length;
    const presi = lista.filter((s) => s.fatto).length;
    let h = testa("", "Spesa");
    h += `<div class="corpo">
      <p style="font-size:14px;color:var(--muted);padding:0 4px;margin-top:-6px">${daPrendere} da prendere · ${giorniSpesaPro() === 1 ? "prossime 24 ore" : "prossimi " + giorniSpesaPro() + " giorni"}, sottraendo le scorte disponibili</p>`;
    h += `<label class="campo">Periodo della spesa<select id="pro-spesa-giorni">${sel(giorniSpesaPro(), [[1,"1 giorno · prossime 24 ore"],[3,"3 giorni"],[7,"7 giorni"],[14,"14 giorni"]])}</select></label>`;
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
    if (!lista.length) h += `<p class="vuoto">Lista vuota: nessun acquisto necessario per il periodo selezionato.</p>`;
    let mostratiExtra = false;
    for (const s of lista) {
      if(s.origine !== "piano" && !mostratiExtra) { h += '<h2 style="font-size:17px">Altri acquisti</h2>';mostratiExtra=true; }
      const tag = s.data_serve && s.origine === "piano"
        ? `<span class="pill liv-${livello(s.data_serve)}">Serve ${esc(L.nomeGiorno(s.data_serve, oggi()))}</span>`
        : `<span class="pill dopo">Quando capita</span>`;
      const chi = s.prende ? `<span class="pill grigio">Lo prende ${esc(nomeDi(s.prende))}</span>`
        : `<button class="mini-link" data-a="prendo" data-id="${esc(s.id)}">Lo prendo io</button>`;
      h += `<div class="voce-spesa ${s.fatto ? "fatto" : ""}">
        <button class="spunta" role="checkbox" aria-checked="${!!s.fatto}" aria-label="Preso: ${esc(s.nome)}" data-a="spunta" data-id="${esc(s.id)}"><span>${s.fatto ? ico("spunta", 16, 'stroke="#fff" stroke-width="3"') : ""}</span></button>
        <div class="testo"><span class="nome">${esc(s.nome)}</span>
          <span class="perche">${esc(s.origine === "piano" ? s.motivo : "Aggiunto a mano" + (s.creato_da ? " da " + nomeDi(s.creato_da) : ""))}</span>
          <span class="tags">${tag}${s.fatto ? "" : chi}${s.origine !== "piano" ? `<button class="mini-link" data-a="togli-spesa" data-id="${esc(s.id)}" style="color:var(--muted)">Togli</button>` : ""}</span></div>
        <span class="q">${esc(s.qty_txt || "")}</span></div>`;
    }
    h += `<div class="due" style="margin-top:4px">
        <button class="btn sec" data-a="whatsapp-lista">Manda su WhatsApp</button>
        ${light() ? "" : `<button class="btn" data-a="metti-in-casa" ${presi ? "" : "disabled"}>Metti in casa (${presi})</button>`}
      </div>`;
    return h + `</div>`;
  }

  /* ---------------- PIANO ---------------- */
  function schermoPiano() {
    if (!S.piano) return testa("", "Piano dieta") + `<div class="corpo"><p class="vuoto">Nessun piano caricato.</p><button class="btn" data-a="vai" data-tab="imp">Carica il tuo piano</button></div>`;
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
      h += `<button data-a="giorno" data-d="${d}" aria-pressed="${d === sel}"><small>${nome}</small><b>${esc(L.etichettaData(d))}</b>${n && i >= 0 && !light() ? `<span class="badge liv-${Math.min(3, i)}">${n}</span>` : ""}</button>`;
    }
    h += `</div>`;
    h += `<p class="settimana-piano">${g ? (g.alternativa ? "Settimana alternativa" : "Settimana " + g.settimana) : ""}</p>`;
    h += `<div class="corpo">`;
    if (!g) return h + `<p class="vuoto">Il piano comincia il ${esc(ddmm(S.piano.inizio))}.</p></div>`;
    const dove = (voce) => {
      const it = S.db.inventario.find((i) => Number(i.qty) > 0 && (i.voci || []).includes(voce));
      return it ? it.luogo : null;
    };
    h += schedeFitness(sel, "inizio");
    for (const p of g.pasti) {
      const k = L.chiavePasto(sel, p.pasto);
      const st = stati[k];
      const buchi = new Map(mancanze.flatMap((m) => m.pasti.filter((x) => x.data === sel && x.pasto === p.pasto).map(() => [m.voce, m.tipo])));
      const etich = p.spostato ? `Spostato da ${esc(L.etichettaData(p.spostato.split("|")[0]))} · ${esc(p.spostato.split("|")[1].toLowerCase())}` : "Cambiato";
      h += `<section class="pasto" id="pasto-${esc(k)}"><div class="testa"><h2>${esc(p.pasto)}${p.cambiato ? ` <span class="pill cambiato">${etich}</span>` : ""}</h2>`;
      if (st && st.stato !== "auto") h += `<span class="pill ${st.stato === "saltato" ? "grigio" : "ok"}">${esc(st.stato === "saltato" ? "Saltato" : st.stato === "fatto" || st.stato === "auto" ? "Fatto" : ["parziale","automatico","da_correggere"].includes(st.stato) ? cap(statoTesto(st.stato,st)) : "Solo " + nomeDi(st.stato.replace(/^solo:/, "")))}</span>`;
      else if (buchi.size && !light()) h += `<span style="font-size:12px;font-weight:800;color:var(--red)">${buchi.size === 1 ? "1 ingrediente manca" : buchi.size + " mancano"}</span>`;
      h += `<button class="icona-btn matita" data-a="nota-apri" data-k="${esc(k)}" aria-label="Scrivi cosa hai mangiato a ${esc(p.pasto.toLowerCase())}">${ico("matita", 18)}</button></div>`;
      const nota = notaDi(k);
      const notaHtml = nota ? `<button class="nota-pasto" data-a="nota-apri" data-k="${esc(k)}">${ico("matita", 14)}<span>${esc(nota.testo)}</span></button>` : "";
      if (p.libero) {
        h += `<div class="piatto">Pasto libero</div>${notaHtml || `<button class="nota-pasto vuota" data-a="nota-apri" data-k="${esc(k)}">${ico("matita", 14)}<span>Scrivi cosa hai mangiato</span></button>`}</section>`;
        h += schedeFitness(sel, p.pasto);
        continue;
      }
      if (p.piatti && p.piatti.length) h += `<div class="piatto">${esc(p.piatti.join(" · "))}</div>`;
      const conPill = !st && !light();
      h += `<div class="voce intest" aria-hidden="true"><span class="n"></span><span class="dosi">${persone().map((x) => `<span class="dose" style="color:${coloreDi(x.id)}">${esc(x.nome)}</span>`).join("")}</span>${conPill ? '<span class="pill vuota"></span>' : ""}</div>`;
      for (const v of p.voci) {
        const b = buchi.get(v.nome);
        const f = (x) => (x == null ? "–" : L.PRESENZA.has(v.u) ? x + " " + v.u.replace("cucchiaini", "cucch.").replace("cucchiaino", "cucch.").replace("tazzina", "tazz.") : L.fmtQ(x, v.u));
        let pill;
        if (st || light()) pill = "";
        else if (b) pill = `<span class="pill ${b === "scarso" ? "scarso" : "manca"}">${b === "scarso" ? "Poco" : "Manca"}</span>`;
        else { const lu = dove(v.nome); pill = lu ? `<span class="pill ${lu}">${lu === "frigo" ? "Frigo" : "Dispensa"}</span>` : `<span class="pill grigio">—</span>`; }
        const d = L.dosi(v);
        const dosiHtml = persone().map((p) => `<span class="dose" style="color:${coloreDi(p.id)}" title="${esc(p.nome)}">${esc(f(d[p.id]))}</span>`).join("");
        h += `<div class="voce"><span class="n ${b && !st && !light() ? "err" : ""}">${esc(v.nome)}</span><span class="dosi">${dosiHtml}</span>${pill}</div>`;
      }
      const azioni = [];
      const secondarie = [];
      if (sel <= oggi()) {
        azioni.push(st && !["auto","da_correggere"].includes(st.stato)
          ? `<button class="btn piccolo sec" data-a="pasto-annulla" data-k="${esc(k)}">Annulla «${esc(st.stato === "saltato" ? "saltato" : "fatto")}»</button>`
          : `<button class="btn piccolo" data-a="pasto" data-k="${esc(k)}" data-stato="fatto">Fatto!</button>`);
        secondarie.push(`<button class="btn piccolo sec" data-a="pasto-altro" data-k="${esc(k)}">${persone().length > 1 ? "Solo una persona / Saltato" : "Saltato"}</button>`);
      }
      // si può cambiare un pasto non ancora mangiato, di oggi o dei giorni dopo
      if (!st && sel >= oggi() && p.pasto !== "Fuori pasto" && window.ImportaPdf.caselle(p, g.alternative).length) {
        secondarie.push(`<button class="btn piccolo cambia" data-a="cambia-apri" data-k="${esc(k)}">${ico("cambia", 16)} Cambia pasto</button>`);
      }
      if (!st && p.cambiato && sel >= oggi()) secondarie.push(`<button class="btn piccolo sec" data-a="cambia-ripristina" data-k="${esc(k)}">${p.spostato ? "Rimetti a posto" : "Ripristina"}</button>`);
      h += notaHtml;
      if (azioni.length) h += `<div class="azioni">${azioni.join("")}</div>`;
      if (secondarie.length) h += `<details class="azioni-secondarie"><summary>Altre azioni</summary><div class="azioni">${secondarie.join("")}</div></details>`;
      h += `</section>`;
      h += schedeFitness(sel, p.pasto);
    }
    h += `<div class="${sel >= oggi() ? "due" : ""}">
      ${sel >= oggi() ? `<button class="btn sec" data-a="inverti-apri" data-d="${sel}">${ico("inverti", 18)} Inverti pasti</button>` : ""}
      <button class="btn fitness" data-a="fitness-apri" data-d="${sel}">${ico("fitness", 18)} Fitness</button>
    </div>`;
    return h + `</div>`;
  }

  /* ---------------- fitness: l'attività fisica fra un pasto e l'altro ---------------- */
  const SPORT = ["Palestra", "Nuoto", "Jogging", "Pilates", "Tai-chi", "Calcio", "Tennis", "Ballo", "Camminata", "Bici"];
  const POSTI_FITNESS = [["inizio", "Prima della colazione"], ["Colazione", "Dopo la colazione"], ["Metà mattina", "Dopo metà mattina"], ["Pranzo", "Dopo il pranzo"], ["Merenda", "Dopo la merenda"], ["Cena", "Dopo la cena"]];
  const oreDi = (hhmm) => { const [h, m] = String(hhmm || "0:0").split(":").map(Number); return h + (m || 0) / 60; };
  // dopo quale pasto cade un orario: l'ultimo pasto già passato a quell'ora
  function dopoDa(hhmm) {
    const h = oreDi(hhmm);
    let dopo = "inizio";
    for (const [k] of POSTI_FITNESS.slice(1)) if (L.ORA[k] <= h) dopo = k;
    return dopo;
  }
  function minutiFitness(f) { return Math.max(0, Math.round((oreDi(f.alle) - oreDi(f.dalle)) * 60)); }
  function durata(min) { const h = Math.floor(min / 60), m = min % 60; return h ? `${h} h${m ? " " + m + " min" : ""}` : `${m} min`; }
  function fitnessDel(data) { return S.db.fitness.filter((f) => f.data === data).sort((a, b) => (a.dalle || "").localeCompare(b.dalle || "")); }
  function prossimoPasto(dopo) {
    const i = POSTI_FITNESS.findIndex(([k]) => k === dopo);
    const n = POSTI_FITNESS[i + 1];
    return n ? n[0].toLowerCase() : null;
  }
  function schedeFitness(data, dopo) {
    return fitnessDel(data).filter((f) => (f.dopo || "inizio") === dopo).map((f) => {
      const chi = (f.persone || []).map(nomeDi).join(", ");
      const prima = prossimoPasto(f.dopo || "inizio");
      return `<button class="scheda-fitness" data-a="fitness-apri" data-id="${esc(f.id)}">
        <span class="icona-fit">${ico("fitness", 20)}</span>
        <span class="testo"><b>${esc(f.tipo)}</b><span>${esc(f.dalle)}–${esc(f.alle)} · ${esc(durata(minutiFitness(f)))}${chi ? " · " + esc(chi) : ""}</span></span>
        <small>${prima ? "prima " + (prima === "metà mattina" ? "di metà mattina" : "della " + prima) : "dopo la cena"}</small></button>`;
    }).join("");
  }
  function foglioFitness() {
    const d = S.sheet.d;
    const preset = SPORT.includes(d.tipo);
    return `<h2>Fitness · ${esc(L.nomeGiorno(d.data, oggi()))}</h2>
      <p class="sotto">Che attività hai fatto, e quando. Si mette fra i pasti della giornata e resta nello storico.</p>
      <div class="campo"><span>Attività</span><div class="chips">
        ${SPORT.map((t) => `<button type="button" class="chip ${d.tipo === t ? "scelto" : ""}" data-a="fit-tipo" data-v="${esc(t)}">${esc(t)}</button>`).join("")}
        <button type="button" class="chip ${!preset ? "scelto" : ""}" data-a="fit-tipo" data-v="">Altro</button>
      </div></div>
      ${!preset ? `<label class="campo">Scrivi l'attività<input class="input" id="fit-altro" data-f="tipo" value="${esc(d.tipo)}" placeholder="Es. yoga, padel, zumba" autocomplete="off"></label>` : ""}
      <div class="due">
        <label class="campo">Dalle ore<input type="time" class="input" data-f="dalle" value="${esc(d.dalle)}"></label>
        <label class="campo">Alle ore<input type="time" class="input" data-f="alle" value="${esc(d.alle)}"></label>
      </div>
      <label class="campo">Nella giornata<select class="input" data-f="dopo">${sel(d.dopo, POSTI_FITNESS)}</select>
        <span class="aiuto">${d.dopoManuale ? "Scelto a mano." : "Scelto in base all'orario."}${prossimoPasto(d.dopo) ? " Va prima " + (prossimoPasto(d.dopo) === "metà mattina" ? "di metà mattina" : "della " + prossimoPasto(d.dopo)) + "." : ""}</span></label>
      ${persone().length > 1 ? `<div class="campo"><span>Chi l'ha fatta</span><div class="chips">${persone().map((p) => `<button type="button" class="chip ${d.persone.includes(p.id) ? "scelto" : ""}" data-a="fit-chi" data-v="${esc(p.id)}">${esc(p.nome)}</button>`).join("")}</div></div>` : ""}
      <button class="btn largo" data-a="fit-salva">${d.id ? "Salva" : "Aggiungi l'attività"}</button>
      ${d.id ? `<button class="btn rosso largo" data-a="fit-togli">Togli l'attività</button>` : ""}
      <button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }
  async function salvaFitness() {
    const d = S.sheet.d;
    const tipo = String(d.tipo || "").trim();
    if (!tipo) return toast("Scrivi che attività hai fatto");
    if (!d.dalle || !d.alle || oreDi(d.alle) <= oreDi(d.dalle)) return toast("Controlla gli orari: la fine deve venire dopo l'inizio");
    if (!d.persone.length) return toast("Scegli chi l'ha fatta");
    await salva("fitness", [{ id: d.id || uid(), data: d.data, dalle: d.dalle, alle: d.alle, tipo, dopo: d.dopo, persone: d.persone, chi: S.chi || "", quando: new Date().toISOString() }]);
    chiudiFoglio();
    render();
    toast(`${tipo} ${d.dalle}–${d.alle} aggiunto`);
  }

  /* ---------------- la matita: cosa ho mangiato davvero ---------------- */
  const NOTA_STORICO = "A fine giornata i pasti non confermati vengono segnati automaticamente come fatti secondo il piano. Le registrazioni automatiche sono riconoscibili e puoi correggerle, aggiungere note o attività fisica anche nei giorni successivi.";
  // Per i giorni archiviati usa sempre il contenuto salvato, anche dopo un cambio dieta.
  function pastoArchiviato(k) {
    const r = S.db.pasti.find((x) => x.id === k);
    if (r && r.contenuto) return r.contenuto;
    const [data, nome] = k.split("|");
    const g = S.piano && L.giornoPiano(S.piano, data);
    return g && g.pasti.find((p) => p.pasto === nome);
  }
  function notaDi(k) { return S.db.note.find((n) => n.id === k && n.testo); }
  function foglioNota() {
    const d = S.sheet.d;
    const [data, pasto] = d.k.split("|");
    const p = pastoArchiviato(d.k);
    const registrato = S.db.pasti.find((r) => r.id === d.k);
    const nota = notaDi(d.k);
    return `<h2>${esc(pasto)} di ${esc(L.nomeGiorno(data, oggi()))}</h2>
      <p class="sotto">${p && p.libero ? "Pasto libero: scrivi cosa avete mangiato, la dietista lo vedrà nello storico." : "Scrivi cosa avete mangiato di diverso o in più rispetto al piano. Resta nello storico e nel report per la dietista."}</p>
      <label class="campo">Cosa ho mangiato<textarea id="nota-testo" rows="5" class="input area" placeholder="${p && p.libero ? "Es. pizza margherita e insalata; Vale: sushi" : "Es. aggiunto un frutto; al posto della pasta 2 fette di pane"}">${esc(nota ? nota.testo : "")}</textarea></label>
      <button class="btn largo" data-a="nota-salva">Salva</button>
      ${registrato && registrato.stato === "da_correggere" ? `<button class="btn sec largo" data-a="pasto" data-k="${esc(d.k)}" data-stato="fatto">Fatto secondo il piano</button>` : ""}
      ${data < oggi() ? `<button class="btn sec largo" data-a="storico-stato" data-k="${esc(d.k)}" data-stato="${registrato && registrato.stato === "saltato" ? "auto" : "saltato"}">${registrato && registrato.stato === "saltato" ? "Ripristina il pasto previsto" : "Segna come saltato"}</button>` : ""}
      ${nota ? `<button class="btn rosso largo" data-a="nota-togli">Cancella la nota</button>` : ""}
      <button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }

  /* ---------------- inverti: scambiare due pasti, dello stesso giorno o di giorni diversi ----------------
     Si scambia il contenuto: il pranzo di oggi diventa la cena e viceversa, oppure la cena di
     giovedì passa a venerdì e quella di venerdì a giovedì. Si usano i "cambi" del piano, quindi
     spesa e dispensa si ricalcolano e tutto si può rimettere a posto. */
  const PASTI_SCAMBIABILI = ["Colazione", "Metà mattina", "Pranzo", "Merenda", "Cena"];
  function pastoDi(data, pasto) {
    const g = L.giornoPiano(S.piano, data);
    return g && g.pasti.find((x) => x.pasto === pasto);
  }
  function scambiabile(data, pasto) {
    return data >= oggi() && !statiPasti()[L.chiavePasto(data, pasto)] && !!pastoDi(data, pasto);
  }
  function foglioInverti() {
    const d = S.sheet.d;
    const giorni = [0, 1, 2, 3, 4, 5, 6].map((i) => L.piuGiorni(oggi(), i));
    const scheda = (data, pasto) => {
      const p = pastoDi(data, pasto);
      return `<div class="scheda-pasto"><small>${esc(cap(L.nomeGiorno(data, oggi())))} · ${esc(pasto.toLowerCase())}</small><b>${p ? esc(p.libero ? "Pasto libero" : descrPasto(p)) : "—"}</b></div>`;
    };
    const chips = (chiave, dataSel) => PASTI_SCAMBIABILI.map((ps) => {
      const ok = scambiabile(dataSel, ps);
      const on = d[chiave] === ps;
      return `<button type="button" class="chip ${on ? "scelto" : ""}" data-a="inv-pasto" data-q="${chiave}" data-v="${ps}" ${ok ? "" : "disabled"}>${ps}</button>`;
    }).join("");
    const uguale = d.dataA === d.dataB && d.pastoA === d.pastoB;
    const valido = !uguale && scambiabile(d.dataA, d.pastoA) && scambiabile(d.dataB, d.pastoB);
    return `<h2>Inverti pasti</h2>
      <p class="sotto">Scambia due pasti tra loro: nello stesso giorno (pranzo e cena) o tra giorni diversi (due cene, due colazioni…). Spesa e dispensa si ricalcolano da sole.</p>
      <div class="campo"><span>Questo pasto di ${esc(L.nomeGiorno(d.dataA, oggi()))}</span><div class="chips">${chips("pastoA", d.dataA)}</div></div>
      <div class="campo"><span>Con il pasto di</span>
        <div class="giorni mini">${giorni.map((g) => `<button type="button" data-a="inv-giorno" data-v="${g}" aria-pressed="${g === d.dataB}"><small>${esc(cap(L.nomeGiorno(g, oggi())).slice(0, 10))}</small><b>${esc(L.etichettaData(g))}</b></button>`).join("")}</div>
        <div class="chips">${chips("pastoB", d.dataB)}</div></div>
      <div class="scambio-pasti">${scheda(d.dataA, d.pastoA)}<span aria-hidden="true">${ico("inverti", 22)}</span>${scheda(d.dataB, d.pastoB)}</div>
      ${uguale ? `<p class="sotto" style="text-align:center">Scegli un pasto diverso.</p>` : ""}
      <p style="font-size:12px;color:var(--muted)">Le norme del piano chiedono di non spostare alimenti o giorni senza l'indicazione della dietista: nel dubbio, chiedi a lei.</p>
      <button class="btn largo" data-a="inv-conferma" ${valido ? "" : "disabled"}>Inverti</button>
      <button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }
  async function confermaInverti() {
    const d = S.sheet.d;
    const a = pastoDi(d.dataA, d.pastoA), b = pastoDi(d.dataB, d.pastoB);
    const kA = L.chiavePasto(d.dataA, d.pastoA), kB = L.chiavePasto(d.dataB, d.pastoB);
    const contenuto = (p) => ({ libero: !!p.libero, piatti: p.piatti || [], voci: p.voci || [] });
    const pp = JSON.parse(JSON.stringify(pianoSalvato()));
    pp.cambi = { ...(pp.cambi || {}) };
    pp.cambi[kA] = { ...contenuto(b), pasto: d.pastoA, spostato: kB, coppia: kB };
    pp.cambi[kB] = { ...contenuto(a), pasto: d.pastoB, spostato: kA, coppia: kA };
    await salva("piano", [{ id: "attuale", dati: pp, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
    chiudiFoglio();
    S.giornoSel = d.dataA;
    dopoModifica();
    toast(`Invertiti: ${d.pastoA.toLowerCase()} di ${L.nomeGiorno(d.dataA, oggi())} e ${d.pastoB.toLowerCase()} di ${L.nomeGiorno(d.dataB, oggi())}`);
  }

  /* ---------------- cambia pasto ---------------- */
  const dose = (q, u) => (u === "g" ? L.fmtNum(q) + " g" : u === "n." ? L.fmtNum(q) + " pz" : L.fmtNum(q) + " " + u);

  function foglioCambia() {
    const d = S.sheet.d;
    const g = L.giornoPiano(S.piano, d.data);
    const p = g && g.pasti.find((x) => x.pasto === d.pasto);
    if (!p) return `<h2>Pasto non trovato</h2><button class="btn" data-a="chiudi">Chiudi</button>`;
    const cs = window.ImportaPdf.caselle(p, g.alternative);
    let h = `<h2>Cambia ${esc(p.pasto.toLowerCase())}</h2>
      <p class="sotto">${esc(cap(L.nomeGiorno(d.data, oggi())))}. Scegli tra i cibi consentiti dalle tabelle della dietista: le grammature sono già quelle giuste per ognuno.</p>`;
    for (const c of cs) {
      const scelta = d.scelte[c.chiave] || c.titolo;
      h += `<section class="casella"><h3>Al posto di ${esc(c.titolo)}</h3>`;
      for (const o of window.ImportaPdf.opzioniCasella(c)) {
        const righe = c.ids.map((id) => {
          const cibi = o.perPersona[id];
          const nome = `<b style="color:${coloreDi(id)}">${esc(nomeDi(id))}</b>`;
          if (!cibi) return `<span>${nome} resta ${esc(c.titolo)}</span>`;
          return `<span>${nome} ${esc(cibi.map((w) => (cibi.length > 1 ? w.nome + " " : "") + dose(w.q, w.u)).join(", "))}</span>`;
        }).join("");
        const scelto = o.nome.toLowerCase() === scelta.toLowerCase();
        h += `<button class="opzione" data-a="cambia-scegli" data-c="${esc(c.chiave)}" data-v="${esc(o.nome)}" aria-pressed="${scelto}">
          <b>${esc(o.nome)}${o.originale ? '<span class="tag-piano">adesso</span>' : ""}</b><span class="dosi-op">${righe}</span></button>`;
      }
      h += `</section>`;
    }
    return h + `<button class="btn largo" data-a="cambia-salva">Imposta questo pasto</button>
      <button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }

  async function salvaCambio() {
    const d = S.sheet.d;
    const g = L.giornoPiano(S.piano, d.data);
    const p = g && g.pasti.find((x) => x.pasto === d.pasto);
    const nuovo = window.ImportaPdf.applicaScelte(p, g.alternative, d.scelte);
    if (!nuovo.cambiato) { chiudiFoglio(); return; }
    const pp = JSON.parse(JSON.stringify(pianoSalvato()));
    pp.cambi = { ...(pp.cambi || {}), [d.k]: { pasto: d.pasto, libero: false, piatti: nuovo.piatti, voci: nuovo.voci } };
    await salva("piano", [{ id: "attuale", dati: pp, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
    chiudiFoglio();
    dopoModifica();
    toast(`${d.pasto} di ${L.nomeGiorno(d.data, oggi())} cambiato`);
  }

  /* ---------------- diario: peso e storico ---------------- */
  // cosa c'era nel pasto, persona per persona: resta anche se poi la dieta cambia
  function fotoPasto(p) {
    if (!p) return null;
    return { piatti: p.piatti || [], libero: !!p.libero, voci: (p.voci || []).map((v) => ({ nome: v.nome, q: L.dosi(v), u: v.u })) };
  }
  function pesateDi(id) { return S.db.pesi.filter((x) => x.persona === id).sort((a, b) => a.data.localeCompare(b.data)); }
  function ultimoPesoTesto() {
    const l = pesateDi(S.chi);
    const u = l[l.length - 1];
    return u ? `${L.fmtNum(u.kg)} kg · ${ddmm(u.data)}` : "segna la pesata";
  }
  const segno = (x) => (x > 0 ? "+" : x < 0 ? "−" : "±") + L.fmtNum(Math.abs(x));
  function dataLunga(d) { const x = L.daIso(d); return cap(L.GIORNI[x.getDay()]) + " " + x.getDate() + " " + MESI[x.getMonth()]; }

  function schermoDiario() {
    let h = testa("", "Diario", "oggi");
    h += `<div class="corpo">
      <div class="segmenti">
        <button aria-pressed="${S.diarioTab === "peso"}" data-a="diario-tab" data-v="peso">Peso</button>
        <button aria-pressed="${S.diarioTab === "storico"}" data-a="diario-tab" data-v="storico">Storico</button>
      </div>`;
    h += S.diarioTab === "storico" ? pannelloStorico() : pannelloPeso();
    return h + `</div>`;
  }

  function pannelloPeso() {
    if (!S.pesoPersona || !persone().some((p) => p.id === S.pesoPersona)) S.pesoPersona = S.chi || (persone()[0] || {}).id;
    const chi = S.pesoPersona;
    const lista = pesateDi(chi);
    const ultimo = lista[lista.length - 1];
    let h = persone().length > 1
      ? `<div class="segmenti">${persone().map((p) => `<button aria-pressed="${p.id === chi}" data-a="peso-persona" data-v="${esc(p.id)}">${esc(p.nome)}</button>`).join("")}</div>`
      : "";
    h += `<form data-form="peso" class="card pad" style="display:flex;flex-direction:column;gap:10px">
      <div class="due">
        <label class="campo">Peso (kg)<input id="peso-kg" inputmode="decimal" autocomplete="off" placeholder="${ultimo ? esc(L.fmtNum(ultimo.kg)) : "82,4"}"></label>
        <label class="campo">Giorno<input id="peso-data" type="date" value="${oggi()}" max="${oggi()}"></label>
      </div>
      <button class="btn">Salva la pesata di ${esc(nomeDi(chi))}</button>
    </form>`;
    if (!lista.length) return h + `<p class="vuoto">Nessuna pesata ancora. Pesati sempre alla stessa ora, meglio al mattino: la curva sarà più fedele.</p>`;
    const primo = lista[0];
    const prec = lista.length > 1 ? lista[lista.length - 2] : null;
    h += `<div class="numeri-peso">
      <div><small>Inizio · ${esc(ddmm(primo.data))}</small><b>${esc(L.fmtNum(primo.kg))} kg</b></div>
      <div><small>Ultima · ${esc(ddmm(ultimo.data))}</small><b>${esc(L.fmtNum(ultimo.kg))} kg</b></div>
      <div><small>Dall'inizio</small><b>${esc(segno(ultimo.kg - primo.kg))} kg</b></div>
    </div>`;
    if (lista.length > 1) h += `<div class="grafico">${graficoPeso(lista, coloreDi(chi))}</div>`;
    if (prec) h += `<p style="font-size:14px;color:var(--muted);padding:0 4px">Dalla pesata del ${esc(ddmm(prec.data))}: <b style="color:var(--ink)">${esc(segno(ultimo.kg - prec.kg))} kg</b> in ${L.diffGiorni(prec.data, ultimo.data)} giorni.</p>`;
    h += `<div class="card">`;
    [...lista].reverse().forEach((x, i, arr) => {
      const prima = arr[i + 1];
      h += `<div class="riga"><span class="testo"><span class="nome">${esc(L.fmtNum(x.kg))} kg</span><span class="nota">${esc(dataLunga(x.data))}${prima ? " · " + esc(segno(x.kg - prima.kg)) + " kg" : ""}</span></span>
        <button class="icona-btn" data-a="peso-togli" data-id="${esc(x.id)}" aria-label="Togli la pesata del ${esc(ddmm(x.data))}">${ico("x", 18)}</button></div>`;
    });
    return h + `</div>`;
  }

  // la curva del peso: una scala sola per punti, griglia ed etichette
  function graficoPeso(lista, colore) {
    const W = 340, H = 190, sx = 40, dx = 16, su = 18, giu = 26;
    const tempi = lista.map((x) => L.daIso(x.data).getTime());
    const t0 = Math.min(...tempi), t1 = Math.max(...tempi);
    const kg = lista.map((x) => Number(x.kg));
    const margine = Math.max(0.5, (Math.max(...kg) - Math.min(...kg)) * 0.15);
    const lo = Math.min(...kg) - margine, hi = Math.max(...kg) + margine;
    const X = (tm) => (t1 === t0 ? sx + (W - sx - dx) / 2 : sx + ((tm - t0) / (t1 - t0)) * (W - sx - dx));
    const Y = (k) => su + ((hi - k) / (hi - lo)) * (H - su - giu);
    const grezzo = (hi - lo) / 3;
    const p10 = Math.pow(10, Math.floor(Math.log10(grezzo)));
    const passo = [1, 2, 5, 10].map((m) => m * p10).find((x) => x >= grezzo);
    let g = "";
    for (let v = Math.ceil(lo / passo) * passo; v <= hi + 1e-9; v += passo) {
      g += `<line x1="${sx}" x2="${W - dx}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="#E3E8E2" stroke-width="1"/>`;
      g += `<text x="${sx - 6}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end" font-size="10" fill="#55605A">${L.fmtNum(v)}</text>`;
    }
    const pts = lista.map((x, i) => [X(tempi[i]), Y(kg[i])]);
    const linea = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = `${linea} L${pts[pts.length - 1][0].toFixed(1)} ${H - giu} L${pts[0][0].toFixed(1)} ${H - giu} Z`;
    const ult = pts[pts.length - 1];
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Andamento del peso: da ${L.fmtNum(kg[0])} a ${L.fmtNum(kg[kg.length - 1])} kg">
      ${g}
      <path d="${area}" fill="${colore}" fill-opacity="0.12"/>
      <path d="${linea}" fill="none" stroke="${colore}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === pts.length - 1 ? 5 : 3.5}" fill="${colore}" stroke="#fff" stroke-width="1.5"/>`).join("")}
      <text x="${Math.min(ult[0], W - dx - 4).toFixed(1)}" y="${(ult[1] - 10).toFixed(1)}" text-anchor="end" font-size="12" font-weight="800" fill="#16201A">${L.fmtNum(kg[kg.length - 1])} kg</text>
      <text x="${pts[0][0].toFixed(1)}" y="${H - 8}" text-anchor="start" font-size="10" fill="#55605A">${ddmm(lista[0].data)}</text>
      <text x="${(W - dx).toFixed(1)}" y="${H - 8}" text-anchor="end" font-size="10" fill="#55605A">${ddmm(lista[lista.length - 1].data)}</text>
    </svg>`;
  }

  // chi ha mangiato il pasto registrato
  function chiHaMangiato(r, contenuto) {
    if (r.stato === "saltato") return [];
    if (r.stato !== "auto" && contenuto && Array.isArray(contenuto.confermati)) return contenuto.confermati;
    const solo = r.stato.startsWith("solo:") ? r.stato.slice(5) : r.stato === "max" || r.stato === "vale" ? r.stato : null;
    if (solo) return [solo];
    return [...new Set((contenuto ? contenuto.voci : []).flatMap((v) => Object.keys(v.q || {}).filter((id) => Number(v.q[id]) > 0)))];
  }
  function statoTesto(st, r) {
    if (st === "parziale") return "confermato da " + ((r && r.contenuto && r.contenuto.confermati) || []).map(nomeDi).join(", ");
    if (st === "saltato") return "saltato";
    if (st === "automatico") return "fatto automaticamente";
    if (st === "da_correggere") return "da correggere";
    if (st === "auto") return "da piano";
    if (st === "fatto") return "confermato";
    return "solo " + nomeDi(st.replace(/^solo:/, ""));
  }

  // tutto quello che serve allo storico e al report, nell'intervallo scelto
  function datiReport(da, a, persona) {
    const ordine = (p) => L.ORA[p] || 0;
    const righe = S.db.pasti.filter((r) => r.data >= da && r.data <= a)
      .sort((x, y) => x.data.localeCompare(y.data) || ordine(x.pasto) - ordine(y.pasto));
    const giorni = [];
    let fatti = 0, saltati = 0;
    for (const r of righe) {
      let contenuto = r.contenuto;
      if (!contenuto && S.piano) { const g = L.giornoPiano(S.piano, r.data); contenuto = fotoPasto(g && g.pasti.find((p) => p.pasto === r.pasto)); }
      if (contenuto && contenuto.libero) contenuto = { ...contenuto, voci: [] };
      let ids = chiHaMangiato(r, contenuto);
      if (persona !== "tutti") {
        if (r.stato !== "saltato" && !ids.includes(persona)) continue;
        ids = ids.filter((id) => id === persona);
      }
      const molti = ids.length > 1;
      const cibi = (contenuto ? contenuto.voci : []).map((v) => {
        const parti = ids.filter((id) => Number(v.q[id]) > 0).map((id) => (molti ? nomeDi(id) + " " : "") + dose(v.q[id], v.u));
        if (!parti.length) return null;
        return molti ? `${v.nome} (${parti.join(", ")})` : `${v.nome} ${parti[0]}`;
      }).filter(Boolean);
      if (r.stato === "saltato") saltati++; else fatti++;
      let giorno = giorni.find((x) => x.data === r.data);
      if (!giorno) { giorno = { data: r.data, pasti: [] }; giorni.push(giorno); }
      const nota = notaDi(r.id);
      giorno.pasti.push({
        id: r.id, automatico: r.stato === "auto",
        nota: nota ? nota.testo : "",
        pasto: r.pasto, stato: statoTesto(r.stato,r),
        piatti: contenuto ? contenuto.piatti : [], libero: !!(contenuto && contenuto.libero), cibi,
      });
    }
    // le attività fisiche entrano nella giornata dopo il loro pasto
    let attivita = 0, minuti = 0;
    for (const f of S.db.fitness.filter((x) => x.data >= da && x.data <= a)) {
      const ids = (f.persone || []).filter((id) => persona === "tutti" || id === persona);
      if (!ids.length) continue;
      let giorno = giorni.find((x) => x.data === f.data);
      if (!giorno) { giorno = { data: f.data, pasti: [] }; giorni.push(giorno); }
      attivita++; minuti += minutiFitness(f);
      giorno.pasti.push({
        fitness: true, pasto: "Fitness", stato: durata(minutiFitness(f)), piatti: [], libero: false, nota: "",
        cibi: [`${f.tipo} · ${f.dalle}–${f.alle}${persone().length > 1 ? " · " + ids.map(nomeDi).join(", ") : ""}`],
        ordine: (f.dopo && f.dopo !== "inizio" ? L.ORA[f.dopo] : 0) + 0.1 + oreDi(f.dalle) / 100,
      });
    }
    giorni.sort((x, y) => x.data.localeCompare(y.data));
    for (const g of giorni) g.pasti.sort((x, y) => (x.ordine != null ? x.ordine : L.ORA[x.pasto] || 0) - (y.ordine != null ? y.ordine : L.ORA[y.pasto] || 0));
    const chi = persona === "tutti" ? persone().map((p) => p.id) : [persona];
    const pesi = chi.map((id) => {
      const tutte = pesateDi(id);
      const dentro = tutte.filter((x) => x.data >= da && x.data <= a);
      const prima = tutte.filter((x) => x.data < da).pop();
      return { id, nome: nomeDi(id), pesate: dentro, prima, tutte };
    }).filter((x) => x.tutte.length);
    return { da, a, persona, giorni, pesi, fatti, saltati, attivita, minuti };
  }

  // "Tutto" = dal primo pasto o dalla prima pesata registrati: l'intero percorso
  function daStorico() {
    if (S.storicoGiorni) return L.piuGiorni(oggi(), -(S.storicoGiorni - 1));
    const date = [...S.db.pasti.map((r) => r.data), ...S.db.pesi.map((r) => r.data), ...S.db.fitness.map((r) => r.data)].filter(Boolean).sort();
    return date[0] || oggi();
  }

  function pannelloStorico() {
    const rep = datiReport(daStorico(), oggi(), S.storicoPersona);
    let h = `<div class="segmenti">${[[7, "7 giorni"], [30, "30 giorni"], [0, "Tutto"]].map(([n, t]) => `<button aria-pressed="${S.storicoGiorni === n}" data-a="storico-giorni" data-v="${n}">${t}</button>`).join("")}</div>`;
    if (persone().length > 1) {
      h += `<label class="campo">Di chi<select id="storico-persona" class="input">${sel(S.storicoPersona, [["tutti", "Tutti"], ...persone().map((p) => [p.id, p.nome])])}</select></label>`;
    }
    h += `<div class="due"><button class="btn" data-a="report-stampa">Stampa o PDF</button><button class="btn sec" data-a="report-testo">File di testo</button></div>
      <p class="avviso blu">${esc(NOTA_STORICO)}</p>
      <p style="font-size:13px;color:var(--muted);padding:0 4px">Il report per la dietista: pasti di questi giorni${rep.pesi.length ? " e pesate" : ""}. Con «Stampa o PDF» scegli «Salva come PDF» nella finestra di stampa.</p>`;
    if (!rep.giorni.length) return h + `<p class="vuoto">Nessun pasto nello storico in questi giorni. I pasti previsti vengono conservati dal giorno di inizio della dieta.</p>`;
    h += `<p style="font-size:14px;padding:0 4px"><b>${rep.fatti}</b> pasti nello storico · <b>${rep.saltati}</b> saltati${rep.attivita ? ` · <b>${rep.attivita}</b> attività fisiche (${esc(durata(rep.minuti))})` : ""} · dal ${esc(ddmm(rep.da))} al ${esc(ddmm(rep.a))}</p>`;
    for (const g of [...rep.giorni].reverse()) {
      h += `<section class="giorno-storico"><h3>${esc(dataLunga(g.data))}</h3><button class="link" data-a="fitness-apri" data-d="${esc(g.data)}">Aggiungi attività fisica</button>`;
      for (const p of g.pasti) {
        if (p.fitness) { h += `<div class="pasto-storico fit"><span class="t"><span>${ico("fitness", 15)} Fitness</span><span class="pill fit">${esc(p.stato)}</span></span><span class="cibi">${esc(p.cibi[0])}</span></div>`; continue; }
        h += `<div class="pasto-storico"><span class="t"><span>${esc(p.pasto)}${p.piatti.length ? " · " + esc(p.piatti.join(", ")) : ""}</span>${p.automatico ? "" : `<span class="pill ${p.stato === "saltato" ? "grigio" : "ok"}">${esc(p.stato)}</span>`}</span>
          <span class="cibi">${p.libero ? "Pasto libero" : esc(p.cibi.join(" · ")) || "—"}</span>${p.nota ? `<span class="cibi nota-st">${ico("matita", 13)} ${esc(p.nota)}</span>` : ""}<button class="link" data-a="nota-apri" data-k="${esc(p.id)}">${p.libero && !p.nota ? "Scrivi cosa hai mangiato" : "Modifica"}</button></div>`;
      }
      h += `</section>`;
    }
    return h;
  }

  function intestazioneReport(rep) {
    const chi = rep.persona === "tutti" ? persone().map((p) => p.nome).join(", ") : nomeDi(rep.persona);
    return { titolo: "Diario alimentare · " + chi, periodo: `dal ${dataLunga(rep.da).toLowerCase()} al ${dataLunga(rep.a).toLowerCase()} ${rep.a.slice(0, 4)}` };
  }
  function righePeso(p) {
    const base = p.prima || p.pesate[0];
    return p.pesate.map((x) => `${ddmm(x.data)}: ${L.fmtNum(x.kg)} kg` + (base && base !== x ? ` (${segno(x.kg - base.kg)} kg)` : ""));
  }

  function testoReport(rep) {
    const t = intestazioneReport(rep);
    const out = ["CheManca? · " + t.titolo, t.periodo, "", NOTA_STORICO, ""];
    if (rep.pesi.length) {
      out.push("PESO");
      for (const p of rep.pesi) out.push(`${p.nome}: ${righePeso(p).join(" · ") || "nessuna pesata nel periodo"}`);
      out.push("");
    }
    out.push(`PASTI (${rep.fatti} da piano o confermati, ${rep.saltati} saltati)` + (rep.attivita ? ` · FITNESS: ${rep.attivita} attività, ${durata(rep.minuti)}` : ""));
    for (const g of rep.giorni) {
      out.push("", dataLunga(g.data));
      for (const p of g.pasti) {
        if (p.fitness) { out.push(`  Fitness (${p.stato}): ${p.cibi[0]}`); continue; }
        out.push(`  ${p.pasto} (${p.stato})${p.piatti.length ? " – " + p.piatti.join(", ") : ""}: ${p.libero ? "pasto libero" : p.cibi.join("; ") || "—"}`);
        if (p.nota) out.push(`    Nota: ${p.nota}`);
      }
    }
    out.push("", "Generato da CheManca? il " + new Date().toLocaleDateString("it-IT"));
    return out.join("\n");
  }

  function stampaReport() {
    const rep = datiReport(daStorico(), oggi(), S.storicoPersona);
    const t = intestazioneReport(rep);
    let h = `<h1>${esc(t.titolo)}</h1><p>${esc(t.periodo)} · ${rep.fatti} pasti nello storico, ${rep.saltati} saltati${rep.attivita ? ` · fitness: ${rep.attivita} attività, ${esc(durata(rep.minuti))}` : ""}</p>`;
    if (rep.pesi.length) {
      h += `<h2>Peso</h2><table><tbody>${rep.pesi.map((p) => `<tr><th>${esc(p.nome)}</th><td>${esc(righePeso(p).join(" · ") || "nessuna pesata nel periodo")}</td></tr>`).join("")}</tbody></table>`;
    }
    h += `<p>${esc(NOTA_STORICO)}</p><h2>Pasti</h2>`;
    for (const g of rep.giorni) {
      h += `<div class="giorno"><h3>${esc(dataLunga(g.data))}</h3><table><tbody>${g.pasti.map((p) =>
        p.fitness ? `<tr class="fit"><th style="width:22%">Fitness<br><small>${esc(p.stato)}</small></th><td>${esc(p.cibi[0])}</td></tr>` :
        `<tr><th style="width:22%">${esc(p.pasto)}<br><small>${esc(p.stato)}</small></th><td>${p.piatti.length ? "<b>" + esc(p.piatti.join(", ")) + "</b><br>" : ""}${p.libero ? "Pasto libero" : esc(p.cibi.join(" · ")) || "—"}${p.nota ? `<br><i>Nota: ${esc(p.nota)}</i>` : ""}</td></tr>`).join("")}</tbody></table></div>`;
    }
    h += `<p style="margin-top:12pt;font-size:9pt">Generato da CheManca? il ${esc(new Date().toLocaleDateString("it-IT"))}</p>`;
    let el = document.getElementById("stampa");
    if (!el) { el = document.createElement("div"); el.id = "stampa"; document.body.appendChild(el); }
    el.innerHTML = h;
    window.print();
  }

  async function esportaTesto() {
    const rep = datiReport(daStorico(), oggi(), S.storicoPersona);
    const nome = `CheManca-diario-${rep.da}-${rep.a}.txt`;
    const file = new File([testoReport(rep)], nome, { type: "text/plain" });
    // sul telefono si apre "Condividi" (WhatsApp, mail…); dove non c'è, si scarica il file
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "Diario CheManca?" }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url; a.download = nome; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }


  function validaBackup(file) {
    if (!file || file.formato !== "chemanca-backup" || file.versione !== 1 || !file.dati || typeof file.dati !== "object") throw new Error("Questo file non è un backup completo di CheManca?");
    const dati = {};
    for (const t of TABELLE) {
      const righe = file.dati[t];
      if (!Array.isArray(righe)) throw new Error("Backup incompleto: manca " + t);
      const ids = new Set();
      for (const r of righe) {
        if (!r || typeof r !== "object" || Array.isArray(r) || typeof r.id !== "string" || !r.id || ids.has(r.id)) throw new Error("Record non valido o duplicato in " + t);
        ids.add(r.id);
        if (t === "pesi" && !(typeof r.kg === "number" && Number.isFinite(r.kg) && r.kg > 0)) throw new Error("Pesata non valida");
        if (t === "piano" && r.id === "persone" && (!Array.isArray(r.dati) || r.dati.some((p) => !p || typeof p.id !== "string" || typeof p.nome !== "string") || new Set(r.dati.map((p) => p.id)).size !== r.dati.length)) throw new Error("Nominativi non validi");
        if (t === "piano" && r.id === "spesa_pro" && (!r.dati || ![1,3,7,14].includes(r.dati.giorni))) throw new Error("Periodo spesa PRO non valido");
        if (t === "piano" && r.id === "spesa_light") {
          const d = r.dati;
          if (!d || !Array.isArray(d.periodi) || !d.periodi.length || !d.periodi.some((p) => p.id === d.attivo)) throw new Error("Liste Light non valide");
          const listaIds = new Set();
          for (const p of d.periodi) {
            if (!p || typeof p.id !== "string" || listaIds.has(p.id) || !/^\d{4}-\d{2}-\d{2}$/.test(p.dal || "") || L.iso(L.daIso(p.dal)) !== p.dal || ![1,3,7,14].includes(p.giorni) || p.id !== p.dal + "|" + p.giorni || !Array.isArray(p.manuali) || !Array.isArray(p.righe) || !p.coperture || typeof p.coperture !== "object" || Array.isArray(p.coperture)) throw new Error("Periodo della spesa Light non valido");
            if (p.oraInizio != null && !(typeof p.oraInizio === "number" && Number.isFinite(p.oraInizio) && p.oraInizio >= 0 && p.oraInizio < 24)) throw new Error("Orario della lista non valido");
            listaIds.add(p.id);
            if (p.manuali.some((m) => !m || typeof m.id !== "string" || typeof m.nome !== "string" || typeof m.fatto !== "boolean")) throw new Error("Voci manuali Light non valide");
            if (p.righe.some((x) => !x || typeof x.id !== "string" || typeof x.nome !== "string" || typeof x.u !== "string" || !(typeof x.qty === "number" && Number.isFinite(x.qty) && x.qty >= 0) || !x.q || typeof x.q !== "object")) throw new Error("Quantità della lista Light non valide");
            for (const c of Object.values(p.coperture)) if (!c || typeof c.nome !== "string" || typeof c.u !== "string" || ![c.comprato,c.disponibile].every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0)) throw new Error("Acquisti Light non validi");
          }
        }
        if (t === "piano" && r.id === "attuale" && r.dati != null) {
          const settimane = r.dati.settimane;
          const valide = Array.isArray(settimane) && settimane.length > 0 && settimane.every((w) => Array.isArray(w) && w.length === 7 && w.every((g) => Array.isArray(g) && g.every((p) => p && typeof p.pasto === "string" && Array.isArray(p.voci))));
          if (!/^\d{4}-\d{2}-\d{2}$/.test(r.dati.inizio || "") || !valide) throw new Error("Piano alimentare non valido");
        }
      }
      dati[t] = JSON.parse(JSON.stringify(righe));
    }
    return dati;
  }
  async function creaBackup() {
    const dati = await A.carica();
    // Include anche il piano pubblicato, per renderlo indipendente dalla versione sul nuovo dispositivo.
    if (!dati.piano.some((r) => r.id === "attuale") && S.piano) dati.piano.push({ id: "attuale", dati: JSON.parse(JSON.stringify(S.piano)), aggiornato: new Date().toISOString() });
    return { formato: "chemanca-backup", versione: 1, creato: new Date().toISOString(), app: VERSIONE, dati };
  }
  async function esportaBackup() {
    const backup = await creaBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "CheManca-backup-" + oggi() + ".json"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    toast("Backup preparato: conserva il file scaricato");
  }
  function anteprimaBackup(file, nome) {
    const dati = validaBackup(file);
    apriFoglio({ tipo: "backup", d: { dati, nome, creato: typeof file.creato === "string" ? file.creato : "" } });
  }
  function foglioBackup() {
    const d = S.sheet.d, profili = d.dati.piano.find((r) => r.id === "persone");
    return `<h2>Ripristina il backup</h2><p class="sotto">${esc(d.nome)}${d.creato ? " · " + esc(d.creato) : ""}</p>
      <p>Famiglia: ${esc(profili ? profili.dati.map((p) => p.nome).join(", ") : "non specificata")}</p>
      <p>${d.dati.pasti.length} pasti · ${d.dati.pesi.length} pesate · ${d.dati.note.length} note · ${d.dati.fitness.length} attività</p>
      <p class="avviso giallo">Il ripristino sostituisce i dati di questo browser. Una copia dei dati attuali viene conservata prima della sostituzione. Il file di backup originale resta sul tuo dispositivo.</p>
      <button class="btn largo" data-a="backup-conferma">Sostituisci i dati con questo backup</button><button class="link" data-a="chiudi">Annulla</button>`;
  }
  async function ripristinaBackup(dati) {
    if (A.tipo !== "locale") throw new Error("Il ripristino è disponibile solo in modalità locale");
    await A.ripristina(dati);
    S.db = await A.carica();
    if (!persone().some((p) => p.id === S.chi)) S.chi = (persone()[0] || {}).id || null;
    LS.set("ds_chi", S.chi);
    S.giornoSel = null; S.pesoPersona = null; S.storicoPersona = "tutti"; S.scelta.clear();
    chiudiFoglio(); dopoModifica(null); toast("Backup ripristinato");
  }

  /* ---------------- IMPOSTAZIONI ---------------- */

  function pannelloMovimentiScorte() {
    if(light())return "";
    const r=S.db.piano.find((x)=>x.id==="movimenti_scorte"),voci=r && Array.isArray(r.dati)?r.dati.slice(-10).reverse():[];
    return `<section class="sezione-imp"><h2>Movimenti delle scorte</h2><p>Ultimi consumi e restituzioni legati ai pasti.</p>${voci.length?voci.map((v)=>`<details><summary>${v.tipo==="consumo"?"Consumo":"Restituzione"} · ${esc(v.pasto.replace("|"," · "))}${v.automatico?" · automatico":""}</summary><ul>${v.movimenti.map((m)=>`<li>${esc(m.prodotto.nome)}: ${v.tipo==="consumo"?"−":"+"}${esc(fmtLight(m.delta,m.unita))}</li>`).join("")}</ul></details>`).join(""):'<p>Nessun movimento registrato con la nuova versione.</p>'}</section>`;
  }

  function schermoImpostazioni() {
    const t = tg(); const w = wa();
    let h = testa("", "Impostazioni", "oggi");
    h += `<div class="corpo">
      <section class="sezione-imp"><h2>Versione dell'app</h2>
        <div class="segmenti"><button aria-pressed="${!light()}" data-a="modo" data-v="pro">PRO</button><button aria-pressed="${light()}" data-a="modo" data-v="light">Light</button></div>
        <p>${light() ? "<b>Light</b>: Piano, Spesa, Peso e storico, con Cambia pasto, Inverti pasti e Fitness. Spesa per 24 ore oppure periodi di 3, 7 o 14 giorni, con Comprato e Ce l’ho già, senza inventario." : "<b>PRO</b>: tutto, anche frigo e dispensa, codice a barre e cosa manca giorno per giorno."}</p>
      </section>

      <section class="sezione-imp"><h2>Chi usa questo telefono</h2>
        <div class="segmenti">${persone().map((p) => `<button aria-pressed="${S.chi === p.id}" data-a="chi" data-v="${esc(p.id)}">${esc(p.nome)}</button>`).join("")}</div>
      </section>

      ${light()?`<section class="sezione-imp"><h2>La tua Home</h2><label class="preferenza-home"><input type="checkbox" id="home-mostra-peso" ${LS.get("ds_home_peso",true)?"checked":""}> Mostra l'ultima pesata nella Home</label></section>`:""}
      <section class="sezione-imp"><h2>Persone in casa</h2>
        <p>Chi segue una dieta. Ognuno ha il suo colore nel piano.</p>
        ${persone().map((p) => `<div style="display:flex;gap:8px;align-items:center">
          <span style="width:14px;height:14px;border-radius:50%;background:${coloreDi(p.id)};flex:none" aria-hidden="true"></span>
          <label class="sr" for="pers-${esc(p.id)}">Nome</label><input class="input" id="pers-${esc(p.id)}" data-persona="${esc(p.id)}" value="${esc(p.nome)}" style="flex:1">
          ${persone().length > 1 ? `<button class="icona-btn" data-a="persona-togli" data-id="${esc(p.id)}" aria-label="Togli ${esc(p.nome)}">${ico("x", 18)}</button>` : ""}</div>`).join("")}
        <div class="due"><button class="btn sec" data-a="persona-aggiungi" ${persone().length >= 6 ? "disabled" : ""}>${ico("piu", 18)} Aggiungi</button><button class="btn" data-a="persone-salva">Salva i nomi</button></div>
      </section>

      <section class="sezione-imp"><h2>Piano dieta</h2>
        ${pianoSalvato() && pianoSalvato().fontiPdf ? `<button class="btn sec largo" data-a="pdf-abbina">Abbina i PDF alle persone</button><p>Puoi collegare una dieta già importata a un familiare aggiunto in seguito, senza ricaricare il PDF.</p>` : `<p>Per riassegnare PDF importati con la vecchia versione, ricaricali una volta: verranno conservati separatamente.</p>`}
        <p>${S.piano ? `In uso il piano dal <b>${esc(ddmm(S.piano.inizio))}/${esc(S.piano.inizio.slice(0, 4))}</b>: ${S.piano.settimane.length === 1 ? "1 settimana che si ripete" : S.piano.settimane.length + " settimane a rotazione"} · da <code>${esc(S.piano.fonte || "piano.json")}</code>` : "<b>Nessun piano in uso.</b> Finché non ne carichi uno l'app non segnala cosa manca."}</p>
        <label class="btn carica-pdf">${ico("piu", 22)}<span>Carica la dieta dal PDF<small>«Dieta a menu giornaliero» della dietista</small></span><input type="file" accept="application/pdf,.pdf" multiple data-file="pdf" class="sr"></label>
        <p style="font-size:13px">Scegli insieme i PDF di tutte le persone di casa: l'app legge ogni giorno, unisce le dosi e prende le tabelle delle alternative. Va bene anche uno solo.</p>
        ${pianoSalvato() ? `<form data-form="inizio-piano" style="display:flex;gap:8px;align-items:flex-end">
          <label class="campo" style="flex:1">Data di inizio della dieta<input type="date" id="inizio-piano" value="${esc(pianoSalvato().inizio)}"></label>
          <button class="btn piccolo sec" style="min-height:52px">Cambia</button>
        </form>` : ""}
        ${sezioneAlternative()}
        <button class="btn rosso" data-a="piano-svuota" ${S.piano ? "" : "disabled"}>Svuota piano</button>
      </section>


      ${condiviso || CFG.CONDIVISIONE ? `<section class="sezione-imp"><h2>Dati condivisi</h2>
        <p>${condiviso ? "I dati stanno su Supabase: tutti i telefoni di casa vedono le stesse cose in tempo reale." : "Adesso i dati restano <b>solo su questo telefono</b>. Per condividerli con l'altro telefono incolla i due valori di Supabase (README, passo 2)."}</p>
        <label class="campo">Project URL<input id="sb-url" value="${esc(LS.get("ds_sb_url", "") || CFG.SUPABASE_URL || "")}" placeholder="https://xxxx.supabase.co" autocomplete="off"></label>
        <label class="campo">Anon key<input id="sb-anon" value="${esc(LS.get("ds_sb_anon", "") || CFG.SUPABASE_ANON || "")}" placeholder="eyJ…" autocomplete="off"></label>
        <button class="btn sec" data-a="salva-sb">Salva e ricarica</button>
      </section>` : ""}
      ${esterni ? `
      <section class="sezione-imp"><h2>Avvisi su Telegram</h2>
        <p>Il bot scrive nel gruppo della famiglia. Il token resta solo su questo telefono, non va nel codice.</p>
        <ol><li>Su Telegram apri <b>@BotFather</b>, scrivi <code>/newbot</code> e copia il token.</li>
          <li>Crea un gruppo con chi vive con te e aggiungi il bot. Scrivi un messaggio qualsiasi nel gruppo.</li>
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
        <p>I dati restano <b>su questo telefono</b>. Per vederli su due telefoni servirà la condivisione (Supabase).</p>
      </section>`}


      ${pannelloMovimentiScorte()}
      <section class="sezione-imp"><h2>Backup e ripristino</h2>
        <p>Salva una copia completa di famiglia, piani importati, pasti, note, pesate, fitness, spesa e scorte. Puoi conservarla oppure trasferirla su un altro dispositivo. Non è una sincronizzazione automatica.</p>
        <button class="btn sec largo" data-a="backup-esporta">Scarica il backup completo</button>
        ${A.tipo === "locale" ? `<label class="btn sec carica-pdf"><span>Ripristina da un backup</span><input type="file" accept="application/json,.json" data-file="backup" class="sr"></label><button class="link" data-a="backup-precedente">Recupera i dati precedenti all'ultimo ripristino</button>` : ""}
        <p>Il backup contiene dati personali: conservalo in un posto riservato. Credenziali e token degli avvisi non sono inclusi.</p>
      </section>
      <section class="sezione-imp"><h2>Dati</h2>
        <p>Cancella frigo, dispensa, spesa, pasti segnati, pesate e note di questo telefono.</p>
        <button class="btn rosso" data-a="svuota">Cancella tutto</button>
      </section>

      <footer class="credits">
        <img src="icon.svg" alt="" width="48" height="48">
        <p class="credits-app">CheManca?</p>
        <p>Sviluppata da <b>Massimo Autiero</b><br>© 2026 · Tutti i diritti riservati</p>
        <p class="credits-ruolo">Versione ${VERSIONE}</p>
        <hr>
        <p>In collaborazione con lo studio medico della<br><b>Dott.ssa Ginevra Mochi</b><br><span class="credits-ruolo">Dietista - Nutrizionista</span></p>
        <p class="credits-contatti">
          <a href="tel:+393494906341">Cellulare: 349 490 6341</a>
          <a href="mailto:ginevra.mochi@gmail.com">Email: ginevra.mochi@gmail.com</a>
        </p>
      </footer>
    </div>`;
    return h;
  }

  /* ---------------- settimane alternative ---------------- */
  const pianoSalvato = () => { const r = S.db.piano.find((x) => x.id === "attuale"); return r && r.dati ? r.dati : null; };
  const haAlternative = () => { const p = pianoSalvato(); return !!(p && p.alternative && Object.keys(p.alternative).length); };
  // le prossime tre settimane del piano (iniziano nel giorno della settimana in cui parte la dieta)
  function settimaneScelta() {
    const p = pianoSalvato();
    const base = L.inizioSettimane(p);
    const k = Math.max(0, L.diffGiorni(base, oggi()));
    const prima = L.piuGiorni(base, Math.floor(k / 7) * 7);
    return [0, 1, 2].map((i) => L.piuGiorni(prima, i * 7));
  }
  function nomeSettimana(d) {
    const fine = L.piuGiorni(d, 6);
    return `dal ${L.etichettaData(d)} al ${L.etichettaData(fine)}`;
  }
  function sezioneAlternative() {
    if (!haAlternative()) {
      return `<p style="font-size:13px">La <b>settimana alternativa</b> si crea dalle tabelle «Alternative alimentari» del PDF: è disponibile quando la dieta è caricata dal PDF.</p>`;
    }
    const fissate = Object.keys(pianoSalvato().fissate || {}).filter((d) => L.piuGiorni(d, 6) >= oggi()).sort();
    return `<button class="btn sec" data-a="alt-apri">Crea settimana alternativa</button>
      <p style="font-size:13px">Cambia gli alimenti con quelli consentiti dalle tabelle delle alternative, con le grammature della dietista.</p>
      ${fissate.map((d) => `<div class="riga"><span class="testo"><span class="nome">Settimana alternativa</span><span class="nota">${esc(nomeSettimana(d))}</span></span>
        <button class="btn piccolo sec" data-a="alt-togli" data-d="${d}">Torna alla tipo</button></div>`).join("")}`;
  }
  function generaAlternativa(d) {
    const p = pianoSalvato();
    const k = L.diffGiorni(L.inizioSettimane(p), d.inizioSett);
    const base = p.settimane[Math.floor(Math.max(0, k) / 7) % p.settimane.length];
    d.base = base;
    d.settimana = window.ImportaPdf.creaSettimana(base, p.alternative);
  }
  function foglioAlternativa() {
    const d = S.sheet.d;
    const nomiG = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
    const primo = L.daIso(L.inizioSettimane(pianoSalvato())).getDay();   // il giorno della settimana in cui parte la dieta
    const etich = (g) => nomiG[(primo + 6 + g) % 7];
    let righe = "";
    let cambi = 0;
    d.settimana.forEach((pasti, g) => {
      const linee = [];
      for (const p of pasti) {
        if (p.libero || p.pasto === "Fuori pasto") continue;
        const b = d.base[g].find((x) => x.pasto === p.pasto);
        const prima = new Set((b ? b.voci : []).map((v) => v.nome));
        const nuovi = [...new Set([...p.piatti.filter((t) => !(b && b.piatti.includes(t))), ...p.voci.filter((v) => !prima.has(v.nome) && !v.piatto).map((v) => v.nome)])];
        if (!nuovi.length) continue;
        cambi += nuovi.length;
        linee.push(`<span class="nota"><b style="color:var(--ink)">${esc(p.pasto)}:</b> ${nuovi.map((n) => `<span style="color:var(--green);font-weight:800">${esc(n)}</span>`).join(", ")}</span>`);
      }
      righe += `<div class="riga" style="align-items:flex-start"><span class="nome" style="min-width:44px">${etich(g)}</span><span class="testo">${linee.join("") || '<span class="nota">come la settimana tipo</span>'}</span></div>`;
    });
    return `<h2>Settimana alternativa</h2>
      <p class="sotto">Ogni cambio viene dalle tabelle «Alternative alimentari» del PDF, con le grammature indicate dalla dietista. In verde i cibi nuovi; tutto il resto resta com'è.</p>
      <div class="segmenti">${settimaneScelta().map((s, i) => `<button aria-pressed="${s === d.inizioSett}" data-a="alt-sett" data-d="${s}">${["Questa", "Prossima", "Fra 2 sett."][i]}</button>`).join("")}</div>
      <p style="font-size:13px;color:var(--muted);text-align:center;margin-top:-6px">${esc(nomeSettimana(d.inizioSett))} · ${cambi} cambi</p>
      <div class="card" style="background:var(--bg)">${righe}</div>
      <div class="due"><button class="btn sec" data-a="alt-rigenera">Rigenera</button><button class="btn" data-a="alt-usa">Usa questa settimana</button></div>
      <button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }

  /* ---------------- Light: liste per periodo, indipendenti dalle scorte ---------------- */
  let codaSpesaLight = Promise.resolve();
  function accodaSpesaLight(fn) {
    const lavoro = codaSpesaLight.then(fn);
    codaSpesaLight = lavoro.catch(() => {});
    return lavoro;
  }
  function nuovaListaLight(dal, giorni) {
    const oraInizio = giorni === 1 && dal === oggi() ? Math.floor(oraAdesso() * 60) / 60 : 0;
    return { id: dal + "|" + giorni, dal, giorni, oraInizio, coperture: {}, manuali: [], righe: L.fabbisognoLight(S.piano, dal, giorni, persone(), oraInizio) };
  }
  function finePeriodoLight(p) { return p.giorni === 1 ? L.iso(new Date(L.istanteLocale(p.dal, p.oraInizio || 0) + 86400000)) : L.piuGiorni(p.dal, p.giorni - 1); }
  function conclusaListaLight(p) { return p.giorni === 1 ? L.istanteLocale(oggi(),oraAdesso()) >= L.istanteLocale(p.dal,p.oraInizio || 0) + 86400000 : finePeriodoLight(p) < oggi(); }
  function oreLight(ore) { const m = Math.round(ore * 60); return String(Math.floor(m/60)).padStart(2,"0") + ":" + String(m%60).padStart(2,"0"); }
  function statoSpesaLight() {
    const r = S.db.piano.find((x) => x.id === "spesa_light");
    if (r && r.dati && Array.isArray(r.dati.periodi) && r.dati.periodi.length) return r.dati;
    const p = nuovaListaLight(oggi(), 3);
    // Le voci manuali precedenti vengono copiate una volta; i dati PRO restano intatti.
    p.manuali = S.db.spesa.filter((x) => x.origine === "mano").map((x) => ({ id: x.id, nome: x.nome, fatto: !!x.fatto }));
    return { attivo: p.id, periodi: [p], durataPredefinita: 3 };
  }
  function periodoSpesaLight(stato = statoSpesaLight()) {
    return stato.periodi.find((x) => x.id === stato.attivo) || stato.periodi[0];
  }
  function fabbisognoPeriodoLight(p) {
    const fine = finePeriodoLight(p);
    // Le liste concluse rimangono consultabili anche dopo aver caricato una nuova dieta.
    if (conclusaListaLight(p)) return p.righe || [];
    return L.fabbisognoLight(S.piano, p.dal, p.giorni, persone(), p.oraInizio || 0);
  }
  function righeListaLight(p = periodoSpesaLight()) { return L.righeLight(fabbisognoPeriodoLight(p), p.coperture); }
  async function salvaStatoLight(stato) {
    await salva("piano", [{ id: "spesa_light", dati: stato, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
  }
  async function assicuraSpesaLight() {
    const esistente = S.db.piano.find((x) => x.id === "spesa_light");
    if (!esistente) { await salvaStatoLight(statoSpesaLight()); return; }
    if (esistente.dati.durataPredefinita !== 3) {
      const stato = JSON.parse(JSON.stringify(esistente.dati)), nuovo = nuovaListaLight(oggi(),3);
      if (!stato.periodi.some((p) => p.id === nuovo.id)) stato.periodi.push(nuovo);
      stato.attivo = nuovo.id; stato.durataPredefinita = 3; await salvaStatoLight(stato);
    }
  }
  function fmtLight(q, u) {
    return L.fmtNum(q) + " " + (u === "n." ? "pz" : u);
  }
  function nomePeriodoLight(p) {
    if (p.giorni === 1) {
      const fine = new Date(L.istanteLocale(p.dal,p.oraInizio || 0) + 86400000);
      return ddmm(p.dal) + " " + oreLight(p.oraInizio || 0) + " – " + ddmm(L.iso(fine)) + " " + oreLight(fine.getHours()+fine.getMinutes()/60) + " (24 ore)";
    }
    return ddmm(p.dal) + " – " + ddmm(finePeriodoLight(p)) + " (" + p.giorni + " giorni)";
  }
  function schermoSpesaLight() {
    const stato = statoSpesaLight(), p = periodoSpesaLight(stato), righe = righeListaLight(p);
    const fine = finePeriodoLight(p), conclusa = conclusaListaLight(p);
    const mancanti = righe.filter((r) => !r.coperto).length + p.manuali.filter((r) => !r.fatto).length;
    let h = testa("", "Spesa") + `<div class="corpo"><section class="card pad"><h2>Spesa ${esc(nomePeriodoLight(p))}</h2><p>${mancanti} voci da prendere. Comprato e «Ce l'ho già» valgono soltanto per questa lista.</p>
      <form data-form="light-periodo" style="display:flex;flex-direction:column;gap:10px;margin-top:12px"><div class="due"><label class="campo">Dal giorno<input type="date" id="light-dal" value="${esc(p.dal)}" required></label><label class="campo">Durata<select id="light-giorni">${sel(p.giorni, [[1,"1 giorno · 24 ore"],[3,"3 giorni"],[7,"7 giorni"],[14,"14 giorni"]])}</select></label></div><button class="btn sec" type="submit">Apri questa lista</button></form>
      ${stato.periodi.length > 1 ? `<label class="campo" style="margin-top:12px">Liste salvate<select id="light-liste">${sel(p.id, stato.periodi.map((x) => [x.id, nomePeriodoLight(x)]))}</select></label>` : ""}</section>
      ${conclusa ? '<p class="avviso blu">Periodo concluso: la lista resta nello storico della spesa.</p>' : '<p style="font-size:13px;color:var(--muted)">Le quantità seguono il piano, senza sottrarre scorte. Se il piano cambia, gli acquisti restano e vengono indicate le eventuali aggiunte. Ogni periodo è una lista autonoma.</p>'}
      ${!S.piano && !conclusa ? '<p class="avviso giallo">Carica un piano per generare gli alimenti. Puoi comunque aggiungere voci a mano.</p>' : ""}
      <form data-form="spesa-nuova" style="display:flex;gap:8px"><label class="sr" for="nuova-voce">Aggiungi alla lista</label><input class="input" id="nuova-voce" placeholder="Aggiungi: caffè, detersivo…" style="flex:1" autocomplete="off"><button class="btn piccolo" style="min-height:52px" aria-label="Aggiungi">${ico("piu",20)}</button></form>`;
    if (!righe.length && !p.manuali.length) h += '<p class="vuoto">Nessun alimento previsto per questo periodo.</p>';
    for (const r of righe) {
      const dettaglio = Object.entries(r.q || {}).map(([id, q]) => nomeDi(id) + " " + fmtLight(q, r.u)).join(" · ");
      const statoRiga = r.rimosso ? "Non più previsto dal piano" : r.aggiunta ? "Piano aggiornato: aggiungi " + fmtLight(r.manca, r.u) : r.coperto ? "Completo per questa lista" : "Da comprare";
      h += `<section class="card pad"><div class="titolo-sez"><h2 style="font-size:16px">${esc(r.nome)}</h2><b>${r.rimosso ? "" : esc(fmtLight(r.qty, r.u))}</b></div><p style="font-size:13px;color:var(--muted);margin-top:6px">${esc(dettaglio)}</p><p style="margin:8px 0;font-weight:700">${esc(statoRiga)}</p>
        ${r.comprato > 0 ? `<p>Comprato: ${esc(fmtLight(r.comprato,r.u))}</p>` : ""}${r.disponibile > 0 ? `<p>Ce l'ho già: ${esc(fmtLight(r.disponibile,r.u))}</p>` : ""}
        ${!conclusa && !r.coperto ? `<div class="due" style="margin-top:10px"><button class="btn piccolo" data-a="light-copri" data-id="${esc(r.id)}" data-stato="comprato">${r.aggiunta ? "Comprato il resto" : "Comprato"}</button><button class="btn piccolo sec" data-a="light-copri" data-id="${esc(r.id)}" data-stato="disponibile">Ce l'ho già</button></div>` : ""}
        ${!conclusa && r.comprato+r.disponibile > 0 ? `<button class="link" data-a="light-copri" data-id="${esc(r.id)}" data-stato="annulla">Annulla acquisto / disponibilità</button>` : ""}</section>`;
    }
    if (p.manuali.length) h += '<h2 style="font-size:17px">Altri acquisti</h2>';
    for(const m of p.manuali) h+=`<section class="card pad"><div class="titolo-sez"><h2 style="font-size:16px">${esc(m.nome)}</h2></div><p style="font-size:13px;color:var(--muted);margin-top:6px">Aggiunto a mano</p><p style="margin:8px 0;font-weight:700">${m.fatto?(m.stato==="disponibile"?"Ce l'ho già":"Comprato"):"Da comprare"}</p>
      ${!conclusa && !m.fatto?`<div class="due" style="margin-top:10px"><button class="btn piccolo" data-a="light-manuale" data-id="${esc(m.id)}">Comprato</button><button class="btn piccolo sec" data-a="light-manuale-disponibile" data-id="${esc(m.id)}">Ce l'ho già</button></div>`:""}
      ${!conclusa?`<div class="azioni">${m.fatto?`<button class="link" data-a="light-manuale" data-id="${esc(m.id)}">Annulla acquisto / disponibilità</button>`:""}<button class="link" data-a="light-manuale-togli" data-id="${esc(m.id)}">Togli</button></div>`:""}</section>`;
    return h + '<button class="btn sec largo" data-a="whatsapp-lista">Manda su WhatsApp</button></div>';
  }
  function cambiaPeriodoLight(...args) { return accodaSpesaLight(() => cambiaPeriodoLightOra(...args)); }
  async function cambiaPeriodoLightOra(dal, giorni) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dal) || L.iso(L.daIso(dal)) !== dal || ![1,3,7,14].includes(giorni)) throw new Error("Scegli una data valida e una durata di 1, 3, 7 o 14 giorni");
    const stato = JSON.parse(JSON.stringify(statoSpesaLight()));
    const attuale = periodoSpesaLight(stato); attuale.righe = fabbisognoPeriodoLight(attuale);
    const id = dal + "|" + giorni;
    if (!stato.periodi.some((p) => p.id === id)) stato.periodi.push(nuovaListaLight(dal, giorni));
    stato.attivo = id; await salvaStatoLight(stato); render();
  }
  function copriVoceLight(...args) { return accodaSpesaLight(() => copriVoceLightOra(...args)); }
  async function copriVoceLightOra(id, azione) {
    const stato = JSON.parse(JSON.stringify(statoSpesaLight())), p = periodoSpesaLight(stato);
    if (conclusaListaLight(p)) throw new Error("Questa lista è conclusa: apri un nuovo periodo");
    const r = righeListaLight(p).find((x) => x.id === id); if (!r) return;
    p.righe = fabbisognoPeriodoLight(p);
    if (azione === "annulla") delete p.coperture[id];
    else if (["comprato", "disponibile"].includes(azione)) {
      const c = p.coperture[id] || { nome: r.nome, u: r.u, comprato: 0, disponibile: 0 };
      c[azione] = (Number(c[azione]) || 0) + r.manca; p.coperture[id] = c;
    }
    await salvaStatoLight(stato); render();
  }
  function manualeLight(...args) { return accodaSpesaLight(() => manualeLightOra(...args)); }
  async function manualeLightOra(azione, id, nome) {
    const stato = JSON.parse(JSON.stringify(statoSpesaLight())), p = periodoSpesaLight(stato);
    if (conclusaListaLight(p)) throw new Error("Questa lista è conclusa: apri un nuovo periodo");
    p.righe = fabbisognoPeriodoLight(p);
    if (azione === "aggiungi") p.manuali.push({ id: uid(), nome, fatto: false });
    if (azione === "togli") p.manuali = p.manuali.filter((m) => m.id !== id);
    if (azione === "spunta") p.manuali = p.manuali.map((m) => m.id === id ? { ...m, fatto: !m.fatto, stato:"comprato" } : m);
    if (azione === "disponibile") p.manuali = p.manuali.map((m) => m.id === id ? { ...m, fatto:true, stato:"disponibile" } : m);
    await salvaStatoLight(stato); render();
  }

  /* ---------------- disegno ---------------- */
  function render() {
    const app = $("#app");
    document.body.classList.toggle("home-light", light() && S.tab === "oggi");
    const att = document.activeElement;
    const fuoco = att && att.id && app.contains(att) ? { id: att.id, pos: att.selectionStart } : null;
    if (light() && !SCHERMI_LIGHT.includes(S.tab)) { S.tab = "oggi"; S.giornoSel = S.giornoSel || oggi(); }
    const schermi = { oggi: schermoOggi, casa: schermoCasa, aggiungi: schermoAggiungi, spesa: schermoSpesa, piano: schermoPiano, imp: schermoImpostazioni, diario: schermoDiario };
    app.innerHTML = (schermi[S.tab] || schermoOggi)();
    renderNav();
    posizionaCamera();
    // con il bottone verde in fondo, i messaggi salgono sopra di lui
    document.body.classList.toggle("con-scelta", S.tab === "aggiungi" && S.aggTab === "senza" && S.scelta.size > 0);
    if (fuoco) {
      const el = document.getElementById(fuoco.id);
      if (el) { el.focus(); try { el.setSelectionRange(fuoco.pos, fuoco.pos); } catch { /* */ } }
    }
  }

  function vai(tab) {
    // La Home è il punto di ingresso della Light.
    if (light() && !SCHERMI_LIGHT.includes(tab)) tab = "oggi";
    if (tab !== "aggiungi" || S.aggTab !== "codice") fermaScanner();
    S.tab = tab;
    if (tab !== "imp" && tab !== "diario") LS.set("ds_tab", tab);
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
    const unitaOff = ((off && off.product_quantity_unit) || "g").toLowerCase();
    const peso = off && off.product_quantity && /^(g|ml)$/.test(unitaOff) ? Math.round(Number(off.product_quantity)) : null;
    const litri = off && off.product_quantity ? (unitaOff === "ml" ? off.product_quantity / 1000 : unitaOff === "cl" ? off.product_quantity / 100 : unitaOff === "l" ? Number(off.product_quantity) : null) : null;
    const luogo = (voce && S.piano && L.luogoDaVoce(S.piano, voce)) || (off ? L.luogoDaCategorie(off.categories_tags) : "dispensa");
    const d = {
      ean, nome, marca: off ? (off.brands || "").split(",")[0] : "",
      voce: voce || "", luogo, conf: 1, conf_qty: voce === "Uovo di gallina" ? 6 : peso || "", conf_unita: voce === "Uovo di gallina" ? "pz" : "g",
      scadenza: "", trovato: !!off,
    };
    preimpostaConfezione(d, litri);
    apriProdotto(d);
  }
  // crackers: la scatola si conta in pacchetti; olio: la bottiglia in litri
  function preimpostaConfezione(d, litri) {
    const r = L.REGOLE[d.voce];
    if (!r) return;
    d.conf_unita = r.unita;
    d.conf_qty = r.unita === "l" ? (litri || 1) : r.conf;
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
    const fogli = { prodotto: foglioProdotto, rivedi: foglioRivedi, item: foglioItem, nuovoCat: foglioNuovoCat, mancanza: foglioMancanza, pasto: foglioPasto, importa: foglioImporta, importa4: foglioImporta4, alternativa: foglioAlternativa, cambia: foglioCambia, gruppoTap: foglioGruppoTap, nota: foglioNota, inverti: foglioInverti, fitness: foglioFitness, chi: foglioChi, gruppo: foglioGruppo, benvenuto: foglioBenvenuto, abbinaPdf: foglioAbbinaPdf, backup: foglioBackup };
    // il benvenuto non si chiude toccando fuori: servono almeno i nomi
    const fissoP = S.sheet.tipo === "benvenuto" && S.sheet.d.passo < 3;
    el.innerHTML = `<div class="velo" ${fissoP ? "" : 'data-a="chiudi"'}></div><div class="foglio"><span class="maniglia" aria-hidden="true"></span>${fogli[S.sheet.tipo]()}</div>`;
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
        <label class="campo">${d.conf_unita === "pz" && L.REGOLE[d.voce] ? "Pacchetti nella scatola" : d.conf_unita === "l" ? "Litri nella bottiglia" : "Ogni confezione"}<input data-f="conf_qty" inputmode="decimal" value="${esc(d.conf_qty)}" placeholder="250"></label>
        <label class="campo">Unità<select data-f="conf_unita">${sel(d.conf_unita, [["g", "grammi"], ["pz", L.REGOLE[d.voce] && L.REGOLE[d.voce].etichetta ? "pacchetti" : "pezzi"], ["l", "litri"]])}</select></label>
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
          <div class="stepper mini"><button type="button" data-a="scelta-qty" data-nome="${esc(nome)}" data-v="-1" aria-label="Meno">−</button><span class="val">${esc(fmtRiepilogo(c, s.qty))}</span><button type="button" data-a="scelta-qty" data-nome="${esc(nome)}" data-v="1" aria-label="Più">+</button></div>
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
        <label class="campo">Unità<select data-f="unita">${sel(d.unita, [["g", "grammi"], ["pz", L.REGOLE[d.voce] && L.REGOLE[d.voce].etichetta ? "pacchetti" : "pezzi"], ["l", "litri"]])}</select></label>
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
    const righe = m.pasti.map((p) => `<div class="riga"><span class="testo"><span class="nome">${esc(cap(p.pasto))} di ${esc(L.nomeGiorno(p.data, oggi()))}</span><span class="nota">${esc(L.dettaglioPersone(p, m.u, persone()) || "")}</span></span><span class="q">${esc(L.fmtQ(p.manca, m.u))}</span></div>`).join("");
    return `<h2>${esc(m.voce)}</h2>
      <p class="sotto">${m.tipo === "scarso" ? "In casa ce n'è, ma non basta." : "In casa non risulta."} ${inLista ? "È già nella lista della spesa." : "Entra nella lista della spesa."}</p>
      <div class="card" style="background:var(--bg)">${righe}</div>
      <button class="btn largo" data-a="ce-l-ho" data-voce="${esc(m.voce)}">Ce l'ho già: mettilo in casa</button>
      <button class="btn sec largo" data-a="prendo-voce" data-voce="${esc(m.voce)}">Lo prendo io</button>
      <button class="link" data-a="chiudi" style="align-self:center">Chiudi</button>`;
  }

  function foglioPasto() {
    const { k } = S.sheet;
    return `<h2>${esc(k.split("|")[1])} di ${esc(L.nomeGiorno(k.split("|")[0], oggi()))}</h2>
      <p class="sotto">${light() ? "Indica chi ha mangiato il pasto o segnalo come saltato. La registrazione resta nel diario." : "Chi l’ha mangiato? Le dosi escono dalla dispensa solo per chi l’ha fatto."}</p>
      ${persone().length > 1 ? `<div class="due">${persone().map((p) => `<button class="btn sec" data-a="pasto" data-k="${esc(k)}" data-stato="solo:${esc(p.id)}">Solo ${esc(p.nome)}</button>`).join("")}</div>` : ""}
      <button class="btn rosso largo" data-a="pasto" data-k="${esc(k)}" data-stato="saltato">${persone().length > 1 ? "Saltato da tutti" : "Saltato"}</button>
      <button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }

  function foglioChi() {
    return `<h2>Chi usa questo telefono?</h2>
      <p class="sotto">Serve per «Lo prendo io» e per sapere chi ha aggiunto cosa.</p>
      <div class="due">${persone().map((p) => `<button class="btn" data-a="chi" data-v="${esc(p.id)}">${esc(p.nome)}</button>`).join("")}</div>`;
  }

  // primo avvio in tre passi: i nomi, chi usa il telefono, la dieta
  function foglioBenvenuto() {
    const d = S.sheet.d;
    const passi = `<div class="passi" aria-label="Passo ${d.passo} di 3">${[1, 2, 3].map((n) => `<span class="${n <= d.passo ? "on" : ""}"></span>`).join("")}</div>`;
    if (d.passo === 1) {
      return `${passi}<h2>Benvenuto in CheManca?</h2>
        <p class="sotto">Chi seguirà una dieta in casa? Scrivi i nomi: ognuno avrà le sue dosi e il suo colore.</p>
        ${d.nomi.map((n, i) => `<div style="display:flex;gap:8px;align-items:center">
          <span style="width:14px;height:14px;border-radius:50%;background:${COLORI_PERSONE[i % COLORI_PERSONE.length]};flex:none" aria-hidden="true"></span>
          <label class="sr" for="benv-${i}">Nome ${i + 1}</label><input class="input" id="benv-${i}" data-nome-i="${i}" value="${esc(n)}" placeholder="${i === 0 ? "Il tuo nome" : "Nome"}" autocomplete="off" style="flex:1">
          ${d.nomi.length > 1 ? `<button class="icona-btn" data-a="benv-togli" data-i="${i}" aria-label="Togli">${ico("x", 18)}</button>` : ""}</div>`).join("")}
        ${d.nomi.length < 6 ? `<button class="btn sec" data-a="benv-aggiungi">${ico("piu", 18)} Aggiungi una persona</button>` : ""}
        <button class="btn largo" data-a="benv-avanti">Avanti</button>`;
    }
    if (d.passo === 2) {
      return `${passi}<h2>Chi usa questo telefono?</h2>
        <p class="sotto">Ognuno può installare CheManca? sul suo telefono.</p>
        <div class="due">${persone().map((p) => `<button class="btn" data-a="benv-chi" data-v="${esc(p.id)}">${esc(p.nome)}</button>`).join("")}</div>`;
    }
    return `${passi}<h2>Carica la dieta</h2>
      <p class="sotto">Scegli il PDF «Dieta a menu giornaliero» che ti ha dato la dietista${persone().length > 1 ? " (puoi sceglierne uno per ogni persona, tutti insieme)" : ""}. L'app legge da sola giorni, pasti e quantità. Il file non lascia il telefono.</p>
      <label class="btn largo" style="cursor:pointer">${ico("piu", 18)} Scegli il PDF<input type="file" accept="application/pdf,.pdf" multiple data-file="pdf" class="sr"></label>
      <button class="link" data-a="chiudi" style="align-self:center">Lo faccio dopo</button>`;
  }

  function foglioGruppo() {
    const { chat } = S.sheet;
    if (!chat.length) return `<h2>Nessun gruppo trovato</h2><p class="sotto">Aggiungi il bot al gruppo, scrivi un messaggio nel gruppo e riprova. Se il bot era già nel gruppo, scrivigli <code>/start</code>.</p><button class="btn" data-a="chiudi">Ok</button>`;
    return `<h2>Scegli la chat</h2><div class="card" style="background:var(--bg)">` +
      chat.map((c) => `<button class="riga" data-a="tg-scegli" data-id="${esc(c.id)}"><span class="testo"><span class="nome">${esc(c.nome)}</span><span class="nota">${esc(c.tipo)} · ${esc(c.id)}</span></span></button>`).join("") +
      `</div><button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }


  function abbinamentiValidi(ids) {
    const scelti = ids.filter(Boolean);
    return scelti.every((id) => persone().some((p) => p.id === id)) && new Set(scelti).size === scelti.length;
  }
  function documentiPdf(p) {
    const f = p && p.fontiPdf;
    if (!f) return [];
    return f.tipo === "giornaliero" ? f.documenti : ["A", "B"].map((k, i) => ({ intestato: f.quattro.persone[i], file: f.quattro.file, id: f.mappa[k] || "" }));
  }
  function suggerisciAbbinamenti(docs) {
    // Non cambia assegnazioni già valide; propone solo corrispondenze non ambigue.
    const usati = new Set(docs.filter((x) => persone().some((p) => p.id === x.id)).map((x) => x.id));
    return docs.map((x) => {
      if (persone().some((p) => p.id === x.id)) return { ...x };
      const id = window.ImportaPdf.abbinaPdf(x.intestato, x.file, persone().filter((p) => !usati.has(p.id)));
      if (id) usati.add(id);
      return { ...x, id: id || "" };
    });
  }
  function foglioAbbinaPdf() {
    const docs = S.sheet.d.documenti;
    return `<h2>Abbina i PDF alle persone</h2><p class="sotto">Controlla il nome di ogni documento. I suggerimenti diventano effettivi solo quando salvi. Lo storico già archiviato resta invariato.</p>
      ${docs.map((x, i) => `<label class="campo">${esc(x.intestato || "Dieta")}<small>${esc(x.file || "")}</small><select class="input" data-abbina-pdf="${i}">${sel(x.id || "", [["", "Da abbinare in seguito"], ...persone().map((p) => [p.id, p.nome])])}</select></label>`).join("")}
      <button class="btn largo" data-a="pdf-abbina-salva">Salva gli abbinamenti</button><button class="link" data-a="chiudi">Annulla</button>`;
  }
  function ricostruisciPdf(base, documenti) {
    const f = JSON.parse(JSON.stringify(base.fontiPdf));
    let nuovo;
    if (f.tipo === "giornaliero") {
      f.documenti.forEach((x, i) => { x.id = documenti[i].id; });
      nuovo = window.ImportaPdf.unisci(f.documenti.filter((x) => x.id).map((x) => ({ id: x.id, piano: x.piano })), base.inizio, base.fonte);
    } else {
      f.mappa = { A: documenti[0].id, B: documenti[1].id };
      const r = window.ImportaPdf.rimappa(f.quattro, f.mappa);
      nuovo = { settimane: r.settimane, extra: r.extra };
      const alternative = {};
      for (const k of ["A", "B"]) if (base.alternative && base.alternative[base.fontiPdf.mappa[k]] && f.mappa[k]) alternative[f.mappa[k]] = base.alternative[base.fontiPdf.mappa[k]];
      nuovo.alternative = alternative;
      if (Object.keys(alternative).length) window.ImportaPdf.collegaAlternative(nuovo.settimane, alternative);
    }
    return { ...base, ...nuovo, categorie: base.categorie || {}, fontiPdf: f };
  }
  async function salvaAbbinamentiPdf() {
    const docs = S.sheet.d.documenti;
    if (!docs.some((x) => x.id) || !abbinamentiValidi(docs.map((x) => x.id))) return toast("Scegli persone diverse per i PDF, oppure lasciali da abbinare");
    const base = pianoSalvato();
    if (Object.keys(base.cambi || {}).length || Object.keys(base.fissate || {}).length) return toast("Prima ripristina i pasti cambiati e le settimane alternative: così non perderai modifiche durante il nuovo abbinamento");
    // Archivia il vecchio piano prima di aggiornare le assegnazioni, come nel cambio dieta.
    if (S.piano) await storicoArretrato(S.piano, S.piano.inizio);
    const nuovo = ricostruisciPdf(base, docs);
    await A.scrivi("piano", [{ id: "attuale", dati: nuovo, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
    inMemoria("piano", [{ id: "attuale", dati: nuovo }]);
    chiudiFoglio(); dopoModifica(); toast("PDF collegati alle persone; storico precedente conservato");
  }

  /* ---------------- nuova dieta dai PDF ---------------- */
  async function leggiPdfDieta(files) {
    toast("Leggo " + (files.length === 1 ? "il PDF" : "i PDF") + "…");
    try {
      const pdfjs = await import(PDFJS + "pdf.min.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.mjs";
      const letti = [];
      const avvisi = [];
      let quattro = null;
      for (const f of files) {
        const doc = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
        const pagine = [], grezze = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const tc = await (await doc.getPage(i)).getTextContent();
          pagine.push(window.ImportaPdf.righeDaPdfjs(tc.items));
          grezze.push(tc.items.map((x) => ({ s: x.str, x: x.transform[4], y: x.transform[5], w: x.width, h: x.height })));
        }
        // il piano a più settimane: pagine "SETTIMANA 1, 2…" con la tabella giorni × pasti
        if (grezze.some((pg) => pg.some((x) => /^SETTIMANA\s+\d+/i.test(x.s.trim())))) {
          const r = window.ImportaPdf.leggiPianoSettimane(grezze);
          if (r.settimane.length) { quattro = { ...r, file: f.name }; continue; }
        }
        const p = window.ImportaPdf.leggiPersona(pagine);
        if (!p.giorni.some(Boolean)) { avvisi.push(f.name + ": nessuna pagina «Piano alimentare - giorno» trovata"); continue; }
        avvisi.push(...p.avvisi.map((a) => (p.persona || f.name) + ", " + a));
        letti.push({ file: f.name, intestato: p.persona, piano: p, id: window.ImportaPdf.abbinaPdf(p.persona, f.name, persone()) });
      }
      nascondiToast();
      if (quattro) {
        // le tabelle delle alternative: dai PDF della dietista scelti insieme, o dalla dieta già caricata
        const alt = {};
        for (const x of letti) {
          const id = window.ImportaPdf.abbinaPdf(x.intestato, x.file, persone());
          if (id && x.piano.alternative && Object.keys(x.piano.alternative).length) alt[id] = x.piano.alternative;
        }
        const salvato = pianoSalvato();
        const alternative = Object.keys(alt).length ? alt : salvato && salvato.alternative && Object.keys(salvato.alternative).length ? salvato.alternative : null;
        const ids = persone().map((p) => p.id);
        const a = window.ImportaPdf.abbina(quattro.persone[0], persone()) || ids[0] || "";
        const b = window.ImportaPdf.abbina(quattro.persone[1], persone()) || ids.find((x) => x !== a) || "";
        const dd = L.daIso(oggi());
        apriFoglio({ tipo: "importa4", d: { quattro, alternative, mappa: { A: a, B: b === a ? "" : b }, inizio: L.piuGiorni(oggi(), (8 - dd.getDay()) % 7) } });
        return;
      }
      if (!letti.length) return toast("Non ho trovato una dieta nel PDF");
      // Un documento non riconosciuto resta da abbinare: non attribuire dosi al familiare sbagliato.
      const assegnati = new Set();
      for (const x of letti) {
        if (!x.id || assegnati.has(x.id)) x.id = "";
        else assegnati.add(x.id);
      }
      // di solito si parte dal lunedì: il prossimo, o oggi se è lunedì
      const d = L.daIso(oggi());
      const inizio = L.piuGiorni(oggi(), (8 - d.getDay()) % 7);
      apriFoglio({ tipo: "importa", d: { letti, avvisi, inizio } });
    } catch (e) {
      console.error(e);
      toast("Non riesco a leggere il PDF: " + (e.message || e));
    }
  }


  // Anteprima dai dati di ciascun documento: non somma le dosi fra familiari.
  function fontiControlloPdf(d, tipo) {
    if(tipo === "importa") return d.letti.map((x,i)=>({key:"pdf:"+i,nome:x.intestato||x.piano.persona||x.file,file:x.file,persona:x.id||"",settimane:[x.piano.giorni],extra:[],avvisi:x.piano.avvisi||[]}));
    return ["A","B"].map((k,i)=>({key:k,nome:d.quattro.persone[i]||("Colonna "+k),file:d.quattro.file,persona:d.mappa[k]||"",settimane:d.quattro.settimane,extra:d.quattro.extra||[],colonna:k,avvisi:[]}));
  }
  function voceDellaColonnaPdf(v,k) { return !k || !v.q || typeof v.q!=="object" || Object.prototype.hasOwnProperty.call(v.q,k) && v.q[k]!==0; }
  function datiControlloPdf(d,tipo) {
    const fonti=fontiControlloPdf(d,tipo);
    const scelta=d.controlloPdf || {documento:fonti[0] && fonti[0].key,giorno:0,settimana:0};
    const fonte=fonti.find((x)=>x.key===scelta.documento)||fonti[0];
    if(!fonte)return {fonti,fonte:null,pasti:[]};
    const settimana=Math.max(0,Math.min(Number(scelta.settimana)||0,fonte.settimane.length-1));
    const giorno=Math.max(0,Math.min(Number(scelta.giorno)||0,6));
    const originali=fonte.settimane[settimana] && fonte.settimane[settimana][giorno];
    const pasti=(originali||[]).map((p,pi)=>({...p,_pi:pi,voci:(p.voci||[]).map((v,vi)=>({...v,_pdf:{pi,vi,extra:false}})).filter((v)=>voceDellaColonnaPdf(v,fonte.colonna)).map((v)=>({...v,q:fonte.colonna?(v.q||{})[fonte.colonna]:v.q}))}));
    const extra=fonte.extra.map((v,vi)=>({...v,_pdf:{pi:-1,vi,extra:true}})).filter((v)=>voceDellaColonnaPdf(v,fonte.colonna)).map((v)=>({...v,q:fonte.colonna?(v.q||{})[fonte.colonna]:v.q}));
    if(extra.length)pasti.push({pasto:"Fuori pasto",piatti:["Indicazioni quotidiane"],_extra:true,voci:extra});
    const controlli=[];
    if(!originali || !originali.length)controlli.push("Nessun pasto riconosciuto per questo giorno: controlla il PDF originale.");
    for(const p of pasti) {
      if(!p.libero && !p.voci.length)controlli.push(p.pasto+": nessun alimento attribuito a questa persona; verifica il documento.");
      for(const v of p.voci) if(!dosePdfValida(v.q) || !String(v.nome||"").trim() || typeof v.u!=="string" || !v.u.trim())controlli.push(p.pasto+", "+v.nome+": quantità o unità da verificare sul PDF.");
    }
    return {fonti,fonte,settimana,giorno,pasti,controlli};
  }
  function dosePdfValida(q) { return typeof q==="number" && Number.isFinite(q) && q>0; }
  function dosePdfTesto(v) {
    if(!dosePdfValida(v.q))return "Dose da verificare";
    return String(v.q).replace(".",",")+" "+(typeof v.u==="string" && v.u.trim()?v.u:"(unità mancante)");
  }
  function anteprimaCompletaPdf(d,tipo) {
    const a=datiControlloPdf(d,tipo);if(!a.fonte)return '<p class="avviso giallo">Nessun documento da controllare.</p>';
    const giorni=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
    const persona=a.fonte.persona?nomeDi(a.fonte.persona):"Da abbinare in seguito";
    return `<section class="pdf-controllo" aria-label="Anteprima completa del piano"><h3>Controlla il piano prima di salvarlo</h3><p class="sotto">Sfoglia ogni giorno e persona. Le quantità sono quelle lette dal documento o corrette da te, senza conversioni o somme fra familiari.</p>
      <label class="campo">Documento / persona<select id="pdf-anteprima-documento" data-controllo-pdf="documento">${sel(a.fonte.key,a.fonti.map((x)=>[x.key,(x.nome||"Dieta")+" → "+(x.persona?nomeDi(x.persona):"Da abbinare")]))}</select></label>
      <div class="due">${a.fonte.settimane.length>1?`<label class="campo">Settimana<select id="pdf-anteprima-settimana" data-controllo-pdf="settimana">${sel(a.settimana,a.fonte.settimane.map((_,i)=>[i,"Settimana "+(i+1)]))}</select></label>`:""}<label class="campo">Giorno<select id="pdf-anteprima-giorno" data-controllo-pdf="giorno">${sel(a.giorno,giorni.map((n,i)=>[i,n]))}</select></label></div>
      <div class="pdf-identita"><b>${esc(persona)}</b><span>Intestazione PDF: ${esc(a.fonte.nome||"non riconosciuta")}</span><span>${esc(a.fonte.file||"Documento importato")}</span><span>Inizio dieta: ${esc(d.inizio||"da scegliere")} · ${esc(giorni[a.giorno])}${a.fonte.settimane.length>1?" · settimana "+(a.settimana+1):""}</span></div>
      ${!a.fonte.persona?'<p class="avviso giallo">Questo documento non è ancora abbinato. Puoi controllarlo, ma non verrà aggiunto alle dosi di altri familiari.</p>':""}
      ${a.controlli.length?`<div class="avviso giallo"><ul>${a.controlli.map((x)=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:""}
      ${a.pasti.map((p)=>`<section class="pdf-pasto"><h4>${esc(p.pasto)}</h4>${p.piatti && p.piatti.length?`<p class="pdf-piatto">${esc(p.piatti.join(" · "))}</p>`:""}${p.libero?'<p class="pill grigio">Pasto libero</p>':""}${p.voci.length?`<table class="pdf-dosi"><caption class="sr">Alimenti e dosi di ${esc(p.pasto)} per ${esc(persona)}</caption><thead><tr><th scope="col">Alimento</th><th scope="col">Quantità</th></tr></thead><tbody>${p.voci.map((v)=>`<tr><td>${esc(v.nome||"Alimento non riconosciuto")}<button class="pdf-correggi" data-a="pdf-modifica" data-pi="${v._pdf.pi}" data-vi="${v._pdf.vi}" data-extra="${v._pdf.extra?"1":"0"}">Correggi</button></td><td class="${dosePdfValida(v.q)&&v.u?"":"pdf-da-verificare"}">${esc(dosePdfTesto(v))}</td></tr>`).join("")}</tbody></table>`:!p.libero?'<p class="sotto">Nessun alimento riconosciuto per questa persona.</p>':""}${!p._extra?`<button class="link" data-a="pdf-aggiungi" data-pi="${p._pi}">Aggiungi alimento a ${esc(p.pasto.toLowerCase())}</button>`:""}</section>`).join("")}
      <button class="btn sec largo" data-a="pdf-aggiungi" data-pi="-1">Aggiungi un pasto o un alimento mancante</button>
      ${editorCorrezionePdf(d)}
      ${d.correzioniPdf && d.correzioniPdf.length?`<p class="sotto">${d.correzioniPdf.length} ${d.correzioniPdf.length === 1 ? "correzione manuale" : "correzioni manuali"} nell’importazione.</p><button class="link" data-a="pdf-annulla-correzione">Annulla ultima correzione</button>`:""}
      <p class="sotto">L'anteprima non modifica il piano attuale. I dati vengono applicati soltanto con il pulsante di conferma.</p></section>`;
  }

  function contestoModificaPdf(d,tipo,edit) {
    const fonte=fontiControlloPdf(d,tipo).find((x)=>x.key===edit.documento);
    if(!fonte)throw new Error("Documento non disponibile");
    const pasti=fonte.settimane[edit.settimana] && fonte.settimane[edit.settimana][edit.giorno];
    const pasto=edit.pi>=0 && pasti ? pasti[edit.pi] : null;
    const lista=edit.extra?fonte.extra:pasto && pasto.voci;
    return {fonte,pasti,pasto,lista,voce:lista && edit.vi>=0?lista[edit.vi]:null};
  }
  function apriCorrezionePdf(pi,vi,extra=false) {
    const d=S.sheet.d,a=datiControlloPdf(d,S.sheet.tipo);
    const edit={documento:a.fonte.key,settimana:a.settimana,giorno:a.giorno,pi,vi,extra};
    const c=contestoModificaPdf(d,S.sheet.tipo,edit),v=c.voce;
    const qty=v?(c.fonte.colonna?(v.q||{})[c.fonte.colonna]:v.q):"";
    d.modificaPdf={...edit,nome:v?v.nome||"":"",qty:qty==null?"":String(qty).replace(".",","),unita:v?v.u||"":"g",pasto:c.pasto?c.pasto.pasto:"Pranzo"};
    ridisegnaControlloPdf();
    document.getElementById("pdf-correzione-editor")?.scrollIntoView({block:"nearest",behavior:"smooth"});
  }
  function editorCorrezionePdf(d) {
    const e=d.modificaPdf;if(!e)return "";
    return `<section class="pdf-editor" id="pdf-correzione-editor" aria-label="Correggi alimento"><h4>${e.vi<0?"Aggiungi alimento":"Correggi alimento"}</h4><p class="sotto">Riporta ciò che è prescritto nel PDF. Non vengono calcolate sostituzioni o nuove dosi.</p>
      ${e.extra?'<p class="avviso blu">Questa voce appartiene alle indicazioni quotidiane: la correzione vale per tutti i giorni e le settimane di questo piano, solo per la persona selezionata.</p>':""}
      ${e.pi<0 && !e.extra?`<label class="campo">Pasto<select id="pdf-edit-pasto">${sel(e.pasto,L.PASTI.map((p)=>[p,p]))}</select></label>`:""}
      <label class="campo">Alimento<input class="input" id="pdf-edit-nome" value="${esc(e.nome)}" autocomplete="off"></label>
      <div class="due"><label class="campo">Quantità<input class="input" id="pdf-edit-qty" inputmode="decimal" value="${esc(e.qty)}" placeholder="Es. 100"></label><label class="campo">Unità<input class="input" id="pdf-edit-unita" value="${esc(e.unita)}" list="pdf-unita-comuni" autocomplete="off"></label></div>
      <datalist id="pdf-unita-comuni">${["g","ml","n.","vasetto","cucchiaino","cucchiaini","tazzina"].map((u)=>`<option value="${u}"></option>`).join("")}</datalist>
      ${d.erroreCorrezione?`<p class="avviso rosso" role="alert">${esc(d.erroreCorrezione)}</p>`:""}
      <div class="due"><button class="btn piccolo" data-a="pdf-correzione-salva">Applica correzione</button><button class="btn piccolo sec" data-a="pdf-correzione-chiudi">Annulla</button></div>
      ${e.vi>=0?'<button class="link" data-a="pdf-correzione-elimina">Rimuovi questo alimento dalla persona selezionata</button>':""}</section>`;
  }
  function applicaCorrezionePdf(d,tipo,e,elimina=false) {
    const c=contestoModificaPdf(d,tipo,e);
    const nome=String(e.nome||"").trim(),unita=String(e.unita||"").trim();
    const testo=String(e.qty??"").trim();
    const qty=/^\d+(?:[.,]\d+)?$/.test(testo)?Number(testo.replace(",",".")):NaN;
    if(!elimina && (!nome || !unita || !Number.isFinite(qty) || qty<=0))throw new Error("Inserisci un alimento, una quantità positiva e l'unità riportata nel PDF");
    if(elimina && !c.voce)throw new Error("Alimento non trovato");
    if(!c.pasto && !e.extra && !L.PASTI.includes(e.pasto))throw new Error("Scegli il pasto a cui appartiene l'alimento");
    const pastoDestinazione=c.pasto || c.pasti && c.pasti.find((p)=>p.pasto===e.pasto);
    if(!elimina && c.fonte.colonna && pastoDestinazione && pastoDestinazione.libero)throw new Error("Questo pasto risulta libero nel PDF condiviso: controlla il documento prima di aggiungere alimenti prescritti");
    const indice=tipo==="importa"?Number(e.documento.split(":")[1]):-1;
    const fonteRaw=tipo==="importa"?d.letti[indice].piano:d.quattro;
    const prima=c.voce?JSON.parse(JSON.stringify(c.voce)):null;
    const snapshot=JSON.parse(JSON.stringify(fonteRaw));
    const count=(d.correzioniPdf||[]).length;
    let lista=c.lista,pasto=c.pasto;
    if(!lista) {
      const settimana=c.fonte.settimane[e.settimana];
      if(!settimana)throw new Error("Settimana non disponibile");
      if(!settimana[e.giorno])settimana[e.giorno]=[];
      const giorni=settimana[e.giorno];
      pasto=giorni.find((p)=>p.pasto===e.pasto);
      if(!pasto){pasto={pasto:e.pasto,libero:false,piatti:[],voci:[]};giorni.push(pasto);giorni.sort((a,b)=>L.PASTI.indexOf(a.pasto)-L.PASTI.indexOf(b.pasto));}
      lista=pasto.voci;
    }
    if(c.voce && c.fonte.colonna && (!c.voce.q || typeof c.voce.q!=="object"))c.voce.q={A:null,B:null};
    if(elimina) {
      if(c.fonte.colonna){delete c.voce.q[c.fonte.colonna];if(!Object.values(c.voce.q).some((v)=>v!==0))lista.splice(e.vi,1);}
      else lista.splice(e.vi,1);
    } else if(c.voce) {
      if(c.fonte.colonna) {
        const k=c.fonte.colonna,altre=Object.entries(c.voce.q).some(([id,n])=>id!==k && n!==0);
        // Nome e unità possono differire fra le persone: separa la riga senza toccare le altre dosi.
        if(altre && (c.voce.nome!==nome || c.voce.u!==unita)) {
          delete c.voce.q[k];lista.push({nome,u:unita,q:{[k]:qty}});
        } else {c.voce.nome=nome;c.voce.u=unita;c.voce.q[k]=qty;delete c.voce.alt;delete c.voce.altPiatto;}
      } else {c.voce.nome=nome;c.voce.q=qty;c.voce.u=unita;delete c.voce.alt;delete c.voce.altPiatto;}
    } else lista.push({nome,u:unita,q:c.fonte.colonna?{[c.fonte.colonna]:qty}:qty});
    if(!elimina && pasto)pasto.libero=false;
    (d.annullamentiPdf=d.annullamentiPdf||[]).push({indice,prima:snapshot,count});
    (d.correzioniPdf=d.correzioniPdf||[]).push({documento:c.fonte.file,intestato:c.fonte.nome,persona:c.fonte.persona,colonna:c.fonte.colonna||null,settimana:e.settimana+1,giorno:e.giorno,pasto:e.extra?"Indicazioni quotidiane":pasto.pasto,tipo:elimina?"rimozione":prima?"modifica":"aggiunta",prima,dopo:elimina?null:{nome,q:qty,u:unita},quando:new Date().toISOString()});
    d.modificaPdf=null;d.erroreCorrezione="";
  }
  function annullaCorrezionePdf(d,tipo) {
    const u=d.annullamentiPdf && d.annullamentiPdf.pop();if(!u)return;
    if(tipo==="importa")d.letti[u.indice].piano=u.prima;else d.quattro=u.prima;
    d.correzioniPdf=(d.correzioniPdf||[]).slice(0,u.count);d.modificaPdf=null;d.erroreCorrezione="";
  }
  function erroriDosiPdf(d,tipo) {
    const errori=[];
    for(const fonte of fontiControlloPdf(d,tipo)) {
      if(!fonte.persona)continue;
      const verifica=(v,sett,giorno)=>{
        if(fonte.colonna && !voceDellaColonnaPdf(v,fonte.colonna))return;
        const q=fonte.colonna?(v.q||{})[fonte.colonna]:v.q;
        if(!dosePdfValida(q)||!String(v.nome||"").trim()||!String(v.u||"").trim())errori.push({documento:fonte.key,settimana:sett,giorno,nome:fonte.nome});
      };
      fonte.settimane.forEach((w,sett)=>(w||[]).forEach((g,giorno)=>(g||[]).forEach((p)=>(p.voci||[]).forEach((v)=>verifica(v,sett,giorno)))));
      fonte.extra.forEach((v)=>verifica(v,0,0));
    }
    return errori;
  }
  function riepilogoErroriPdf(d,tipo) {
    const n=erroriDosiPdf(d,tipo).length;
    return n?`<div class="avviso giallo"><span>${n} quantità, unità o alimenti da verificare nei documenti abbinati. Correggili prima di applicare il piano.<button class="link" data-a="pdf-primo-errore">Vai al primo valore da verificare</button></span></div>`:"";
  }

  function ridisegnaControlloPdf() {
    const foglio=document.querySelector("#sheet .foglio"),scroll=foglio?foglio.scrollTop:0;
    renderFoglio();const nuovo=document.querySelector("#sheet .foglio");if(nuovo)nuovo.scrollTop=scroll;
  }

  function foglioImporta() {
    const d = S.sheet.d;
    const doppi = persone().filter((p) => d.letti.filter((x) => x.id === p.id).length > 1);
    const abbinamenti = d.letti.map((x, i) => `<div class="riga"><span class="testo"><span class="nome">${esc(x.intestato || "Dieta")}</span><span class="nota">${esc(x.file)}</span></span>
      <label class="sr" for="pdf-chi-${i}">Di chi è</label><select class="input" id="pdf-chi-${i}" data-pdf-i="${i}" style="width:auto;height:44px;font-size:15px">${sel(x.id || "", [["", "Da abbinare in seguito"], ...persone().map((p) => [p.id, p.nome])])}</select></div>`).join("");
    return `<h2>Nuova dieta</h2>
      ${sceltaInizio(d)}
      <p class="sotto">Controlla di chi è ogni PDF. È una settimana che si ripete finché non carichi la prossima.</p>
      <div class="card" style="background:var(--bg)">${abbinamenti}</div>
      ${doppi.length ? `<div class="avviso giallo"><span>Due PDF sono assegnati a ${esc(doppi.map((p) => p.nome).join(", "))}: le dosi si sommerebbero.</span></div>` : ""}
      ${d.avvisi.length ? `<div class="avviso giallo"><span><b>Avvisi della lettura originale:</b><br>${d.avvisi.map(esc).join("<br>")}</span></div>` : ""}
      ${riepilogoErroriPdf(d,"importa")}
      ${anteprimaCompletaPdf(d,"importa")}
      ${d.letti.some((x) => !x.id) ? `<p class="avviso blu">I PDF non abbinati vengono conservati: potrai collegarli dopo aver aggiunto il familiare.</p>` : ""}
      <button class="btn largo" data-a="importa-conferma" ${doppi.length || !d.letti.some((x) => x.id) || d.modificaPdf || erroriDosiPdf(d,"importa").length ? "disabled" : ""}>Usa questa dieta</button>
      <button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }

  // "Da quando segui questa dieta?": tre scorciatoie e il calendario
  function sceltaInizio(d) {
    const lun = L.lunediDi(oggi());
    const scorciatoie = [["Oggi", oggi()], ["Lunedì scorso", lun === oggi() ? L.piuGiorni(lun, -7) : lun], ["Lunedì prossimo", L.piuGiorni(lun, 7)]];
    const passati = d.inizio < oggi() ? L.diffGiorni(d.inizio, oggi()) : 0;
    return `<div class="campo"><span>Da quando segui questa dieta?</span>
        <div class="tre">${scorciatoie.map(([n, v]) => `<button type="button" class="btn piccolo ${d.inizio === v ? "" : "sec"}" data-a="imp-data" data-v="${v}">${n}</button>`).join("")}</div>
        <input type="date" class="input" data-f="inizio" value="${esc(d.inizio)}" aria-label="Data di inizio">
      </div>
      ${passati ? `<div class="avviso blu"><span>I pasti dal <b>${esc(L.etichettaData(d.inizio))}</b> a ieri (${passati} ${passati === 1 ? "giorno" : "giorni"}) entrano nello <b>storico</b> come fatti automaticamente secondo il piano. Potrai modificarli anche in seguito. Frigo e dispensa non vengono toccati.</span></div>` : ""}`;
  }

  /* ---------- il piano a 4 settimane in PDF ---------- */
  function foglioImporta4() {
    const d = S.sheet.d;
    const q = d.quattro;
    const opz = persone().map((p) => [p.id, p.nome]);
    const voci = q.persone.map((nome, i) => `<div class="riga"><span class="testo"><span class="nome">${i === 0 ? "Prima" : "Seconda"} quantità · ${esc(nome)}</span><span class="nota">${i === 0 ? "il valore a sinistra o con la M" : "il valore a destra o con la V"}</span></span>
      <label class="sr" for="q4-${i}">Di chi è</label><select class="input" id="q4-${i}" data-q4="${i === 0 ? "A" : "B"}" style="width:auto;height:44px;font-size:15px">${sel(d.mappa[i === 0 ? "A" : "B"] || "", [["", "Nessuno"], ...opz])}</select></div>`).join("");
    return `<h2>Piano a ${q.settimane.length} settimane</h2>
      ${sceltaInizio(d)}
      <p class="sotto">Letto da ${esc(q.file)}. Le settimane si alternano una dopo l'altra, poi si ricomincia dalla prima.</p>
      <div class="card" style="background:var(--bg)">${voci}</div>
      ${riepilogoErroriPdf(d,"importa4")}
      ${anteprimaCompletaPdf(d,"importa4")}
      ${d.alternative ? `<div class="avviso verde"><span>Collegato alle tabelle delle alternative della dietista: «Cambia pasto» funziona anche su questo piano.</span></div>` : `<div class="avviso giallo"><span>Senza le tabelle delle alternative «Cambia pasto» non compare. Per averlo scegli questo PDF insieme a quelli della dietista.</span></div>`}
      <button class="btn largo" data-a="importa4-conferma" ${(!d.mappa.A && !d.mappa.B) || !abbinamentiValidi([d.mappa.A,d.mappa.B]) || d.modificaPdf || erroriDosiPdf(d,"importa4").length ? "disabled" : ""}>Usa questo piano</button>
      <button class="link" data-a="chiudi" style="align-self:center">Annulla</button>`;
  }

  async function confermaImport4() {
    const d = S.sheet.d;
    if(d.modificaPdf || erroriDosiPdf(d,"importa4").length)return toast("Completa le correzioni dei valori da verificare");
    if (!d.inizio) return toast("Scegli la data di inizio");
    if (!d.mappa.A && !d.mappa.B) return toast("Scegli di chi sono le quantità");
    if (!abbinamentiValidi([d.mappa.A, d.mappa.B])) return toast("Le due colonne devono appartenere a persone diverse");
    const r = window.ImportaPdf.rimappa(d.quattro, d.mappa);
    const p = { inizio: d.inizio, lunedi: true, fonte: d.quattro.file, settimane: r.settimane, extra: r.extra, categorie: S.pianoFile ? S.pianoFile.categorie : {}, alternative: d.alternative || null, fissate: {} };
    p.fontiPdf = { tipo: "settimane", quattro: JSON.parse(JSON.stringify(d.quattro)), mappa: { ...d.mappa }, correzioni:JSON.parse(JSON.stringify(d.correzioniPdf||[])) };
    if (p.alternative) window.ImportaPdf.collegaAlternative(p.settimane, p.alternative);
    if (S.piano && d.inizio > oggi()) p.prima = { ...S.piano, prima: undefined };
    if (S.piano) await storicoArretrato(S.piano, S.piano.inizio);
    await salva("piano", [{ id: "attuale", dati: p, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
    const n = await storicoArretrato(p, d.inizio);
    chiudiFoglio();
    dopoModifica();
    vai("piano");
    toast(`Piano a ${p.settimane.length} settimane dal ${ddmm(d.inizio)}` + (n ? ` · ${n} pasti passati nello storico` : ""));
  }

  async function confermaImport() {
    const d = S.sheet.d;
    if(d.modificaPdf || erroriDosiPdf(d,"importa").length)return toast("Completa le correzioni dei valori da verificare");
    if (!d.inizio) return toast("Scegli la data di inizio");
    if (!d.letti.some((x) => x.id)) return toast("Abbina almeno un PDF a una persona");
    if (!abbinamentiValidi(d.letti.map((x) => x.id))) return toast("Ogni persona può avere un solo PDF: correggi gli abbinamenti");
    const p = window.ImportaPdf.unisci(d.letti.filter((x) => x.id).map((x) => ({ id: x.id, piano: x.piano })), d.inizio, "PDF del " + new Date().toLocaleDateString("it-IT"));
    p.fontiPdf = { tipo: "giornaliero", documenti: JSON.parse(JSON.stringify(d.letti)), correzioni:JSON.parse(JSON.stringify(d.correzioniPdf||[])) };
    if (S.pianoFile) p.categorie = S.pianoFile.categorie;
    // fino al giorno di inizio resta valido il piano di adesso
    if (S.piano && d.inizio > oggi()) p.prima = { ...S.piano, prima: undefined };
    if (S.piano) await storicoArretrato(S.piano, S.piano.inizio);
    await salva("piano", [{ id: "attuale", dati: p, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
    const n = await storicoArretrato(p, d.inizio);
    chiudiFoglio();
    dopoModifica();
    vai("piano");
    toast("Nuova dieta in uso dal " + ddmm(d.inizio) + (n ? ` · ${n} pasti passati nello storico` : ""));
  }

  /* la dieta è cominciata prima di caricarla: i pasti dal giorno di inizio a ieri si
     registrano come fatti automaticamente secondo il piano, per lo storico. Non si scala niente da frigo e dispensa:
     quello che c'è in casa adesso è già il risultato di quei giorni. */
  async function storicoArretrato(piano, da) {
    if (!da || da >= oggi()) return 0;
    const stati = statiPasti();
    let n = 0;
    for (let g = da; g < oggi(); g = L.piuGiorni(g, 1)) {
      const giorno = L.giornoPiano(piano, g);
      if (!giorno) continue;
      for (const p of giorno.pasti) {
        const k = L.chiavePasto(g, p.pasto);
        if (stati[k]) {
          // Completa i vecchi record prima che il piano corrente venga sostituito.
          if (!stati[k].contenuto) await modifica("pasti", k, { contenuto: fotoPasto(p) });
          continue;
        }
        const riga = { id: k, data: g, pasto: p.pasto, stato: "automatico", chi: "", quando: new Date().toISOString(), scalato: [], contenuto: { ...fotoPasto(p), automatico:true } };
        if (await A.nuovo("pasti", riga)) { inMemoria("pasti", [riga]); n++; }
      }
    }
    LS.set("ds_auto_da", oggi());
    return n;
  }

  /* ---------------- azioni ---------------- */
  let codaPasti=Promise.resolve();
  function scriviRigaDb(db,t,r) { const i=db[t].findIndex((x)=>x.id===r.id); if(i<0)db[t].push(r);else db[t][i]={...db[t][i],...r}; }
  function operazionePasti(fn) {
    const lavoro=codaPasti.then(()=>{
      if(!A.transazione) throw new Error("Le nuove operazioni protette sui pasti richiedono l'archivio locale; la versione condivisa verrà configurata con il database");
      const r=A.transazione(fn);S.db=r.db;return r.risultato;
    });
    codaPasti=lavoro.catch(()=>{});return lavoro;
  }
  function movimentiRegistrati(r) {
    const mosse=r && r.scalato || [];
    if(!mosse.length || mosse.every((x)=>x.versione===2))return mosse;
    if(!r.contenuto) throw new Error("Questo vecchio pasto non conserva le dosi: verifica la scorta prima di correggerlo");
    const chi=r.stato.startsWith("solo:")?r.stato.slice(5):["max","vale"].includes(r.stato)?r.stato:null;
    return L.movimentiConsumo(mosse,r.contenuto,chi);
  }
  function registraMovimentiDb(db,k,movimenti,tipo,automatico) {
    if(!movimenti.length)return;
    const r=db.piano.find((x)=>x.id==="movimenti_scorte"),elenco=r && Array.isArray(r.dati)?r.dati:[];
    scriviRigaDb(db,"piano",{id:"movimenti_scorte",dati:[...elenco,{id:uid(),pasto:k,tipo,automatico:!!automatico,quando:new Date().toISOString(),movimenti}]});
  }
  function registraPastoDb(db,k,stato,opzioni={}) {
    const [data,nome]=k.split("|"),r=db.pasti.find((x)=>x.id===k);
    if(r && r.stato===stato)return false;
    const giorno=S.piano && L.giornoPiano(S.piano,data);
    const p=r && r.contenuto || opzioni.pasto || giorno && giorno.pasti.find((x)=>x.pasto===nome);
    if(!p)throw new Error("Non trovo il contenuto di questo pasto");
    const vecchie=movimentiRegistrati(r);
    const conservaConsumi=opzioni.automatico && !opzioni.consuma;
    if(vecchie.length && !conservaConsumi) { db.inventario=L.applicaMovimenti(db.inventario,vecchie,true);registraMovimentiDb(db,k,vecchie,"restituzione",false); }
    let nuove=conservaConsumi?vecchie:[];
    if(opzioni.consuma && stato!=="saltato" && !p.libero) {
      const chi=stato.startsWith("solo:")?stato.slice(5):["max","vale"].includes(stato)?stato:null;
      nuove=L.movimentiConsumo(db.inventario,p,chi);db.inventario=L.applicaMovimenti(db.inventario,nuove);registraMovimentiDb(db,k,nuove,"consumo",opzioni.automatico);
    }
    const contenuto={...fotoPasto(p),automatico:!!opzioni.automatico};
    scriviRigaDb(db,"pasti",{id:k,data,pasto:nome,stato,chi:opzioni.automatico?"":S.chi||"",quando:new Date().toISOString(),scalato:nuove,contenuto});
    return true;
  }
  async function segnaPasto(k,stato) {
    await operazionePasti((db)=>registraPastoDb(db,k,stato,{consuma:!light()}));
    chiudiFoglio();dopoModifica();
    toast(stato==="saltato"?"Segnato come saltato":"Pasto registrato", "Annulla", ()=>annullaPasto(k).catch(erroreArchivio));
  }
  async function annullaPasto(k) {
    await operazionePasti((db)=>{
      const r=db.pasti.find((x)=>x.id===k);if(!r)return;
      const mosse=movimentiRegistrati(r);
      if(mosse.length) {db.inventario=L.applicaMovimenti(db.inventario,mosse,true);registraMovimentiDb(db,k,mosse,"restituzione",false);}
      if(r.data<oggi())scriviRigaDb(db,"pasti",{...r,stato:"da_correggere",scalato:[]});
      else db.pasti=db.pasti.filter((x)=>x.id!==k);
    });
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
    if (S.sheet && S.sheet.tipo === "gruppoTap") renderFoglio();
  }

  // scegliere quale frutta o verdura, senza lasciare la pagina
  function foglioGruppoTap() {
    const d = S.sheet.d;
    const m = (S.calc7 ? S.calc7.mancanze : []).find((x) => x.voce === d.voce);
    const lista = catalogo().filter((c) => c.gruppo === d.gruppo);
    return `<h2>${d.gruppo === "Frutta" ? "Quale frutta hai preso?" : "Quali verdure hai preso?"}</h2>
      ${m ? `<p class="sotto">Serve: <b>${esc(m.voce)}</b> ${esc(L.quantitaSpesa(m))} · ${esc(L.motivo(m, oggi()).toLowerCase())}</p>` : ""}
      <div class="chips">${lista.map((c) => {
        const s = S.scelta.get(c.nome);
        return `<button class="chip ${s ? "scelto" : ""}" data-a="tap" data-nome="${esc(c.nome)}">${esc(c.nome)}${s ? `<span class="conta">${esc(fmtScelta(c, s.qty))}</span>` : ""}</button>`;
      }).join("")}</div>
      <button class="btn largo" data-a="chiudi">Fatto</button>`;
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
    else if (d.conf_unita === "l") riga = { qty: Math.round(d.conf * (confQty || 1) * 1000) / 1000, unita: "l", g_pz: null };
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
        const m = (S.calcSpesa ? S.calcSpesa.mancanze : []).find((x) => x.voce === s.voce);
        S.scelta.set(c.nome, { qty: qtyPerMancanza(c, m), luogo: c.luogo || "frigo" });
      } else senza.push(s.nome);
    }
    await elimina("spesa", presi.map((s) => s.id));
    S.tab = "aggiungi"; S.aggTab = "senza"; LS.set("ds_aggtab", "senza");
    dopoModifica();
    if (S.scelta.size) apriFoglio({ tipo: "rivedi" });
    if (senza.length) toast("Da scansionare: " + senza.join(", "));
  }

  function condividiWhatsapp() {
    if (light()) {
      const p = periodoSpesaLight(), righe = righeListaLight(p).filter((r) => !r.coperto);
      const manuali = p.manuali.filter((r) => !r.fatto);
      if (!righe.length && !manuali.length) return toast("Non c'è altro da comprare per questa lista");
      const testo = "Lista della spesa " + nomePeriodoLight(p) + "\n" + [...righe.map((r) => "• " + r.nome + " " + fmtLight(r.manca,r.u)), ...manuali.map((m) => "• " + m.nome)].join("\n");
      window.open("https://wa.me/?text=" + encodeURIComponent(testo), "_blank"); return;
    }
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
      it("Crackers non salati", ["Crackers non salati"], "dispensa", 10, "pz"),
      it("Mandorle", ["Mandorle"], "dispensa", 200, "g"),
      it("Noci", ["Noci secche"], "dispensa", 150, "g"),
      it("Arachidi tostate", ["Arachidi tostate"], "dispensa", 100, "g"),
      it("Anacardi", ["Anacardi"], "dispensa", 100, "g"),
      it("Miele millefiori", ["Miele millefiori"], "dispensa", 1, "pz"),
      it("Caffè", ["Caffè"], "dispensa", 1, "pz"),
      it("Cioccolato fondente", ["Cioccolato fondente"], "dispensa", 100, "g"),
      it("Olio extravergine", ["Olio extra vergine di oliva"], "dispensa", 0.75, "l"),
      it("Farina di cocco", ["Farina di cocco"], "dispensa", 250, "g"),
      it("Patate", ["Patate"], "dispensa", 1000, "g", { manuale: true }),
    ];
    return inv;
  }

  /* ---------------- gestione dei tocchi ---------------- */
  document.addEventListener("click", eventoSicuro(async (ev) => {
    const b = ev.target.closest("[data-a]");
    if (!b) return;
    const a = b.dataset.a;
    const d = S.sheet && S.sheet.d;
    switch (a) {
      case "piano-apri": {
        S.giornoSel = b.dataset.d || oggi(); vai("piano");
        if (b.dataset.pasto) document.getElementById("pasto-" + L.chiavePasto(S.giornoSel,b.dataset.pasto))?.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      }
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
      case "vai-gruppo": apriFoglio({ tipo: "gruppoTap", d: { gruppo: b.dataset.gruppo, voce: b.dataset.voce } }); break;
      case "manca-tap": {
        const gr = GRUPPO_GENERICO[b.dataset.voce];
        if (gr) {
          if (b.dataset.da === "oggi") { S.aggTab = "senza"; LS.set("ds_aggtab", "senza"); S.cercaCat = ""; vai("aggiungi"); }
          apriFoglio({ tipo: "gruppoTap", d: { gruppo: gr, voce: b.dataset.voce } });
          break;
        }
        const c = scegliPerMancanza(b.dataset.voce);
        if (b.dataset.da === "oggi") {
          // dal badge si va dritti all'elenco senza codice, col prodotto già scelto
          S.aggTab = "senza"; LS.set("ds_aggtab", "senza"); S.cercaCat = "";
          vai("aggiungi");
          if (c) toast(`${c.nome} scelto: tocca gli altri prodotti, poi il bottone verde`);
          else toast("Questo si aggiunge con il codice a barre");
        } else render();
        if (navigator.vibrate) navigator.vibrate(15);
        break;
      }
      case "scorri-liv": {
        const sez = document.getElementById("manca-liv-" + b.dataset.liv);
        if (!sez) { toast("Qui non manca niente"); break; }
        if (b.dataset.liv === "3") { S.tuttiVerdi = true; render(); }
        document.getElementById("manca-liv-" + b.dataset.liv).scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      }
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
      case "light-copri": await copriVoceLight(b.dataset.id, b.dataset.stato); break;
      case "light-manuale-disponibile": await manualeLight("disponibile",b.dataset.id); break;
      case "light-manuale": await manualeLight("spunta", b.dataset.id); break;
      case "light-manuale-togli": await manualeLight("togli", b.dataset.id); break;
      case "whatsapp-lista": condividiWhatsapp(); break;
      case "avvisa-ora": {
        const html = L.testoAvviso(S.calc.mancanze, oggi(), { titolo: "CheManca? · lista aggiornata", link: CFG.APP_URL });
        if (!html) { toast("Non manca niente: nessun messaggio da mandare"); break; }
        try { await inviaAvviso(html); await salva("avvisi", [{ id: "manuale:" + new Date().toISOString(), inviato: new Date().toISOString(), da: S.chi || "" }]); toast("Messaggio inviato"); render(); }
        catch (e) { toast(e.message); }
        break;
      }
      case "home-pasto-fatto": await confermaPastoHome(b.dataset.k); break;
      case "pasto": await segnaPasto(b.dataset.k, b.dataset.stato); break;
      case "pasto-altro": apriFoglio({ tipo: "pasto", k: b.dataset.k }); break;
      case "pasto-annulla": await annullaPasto(b.dataset.k); break;
      case "giorno": S.giornoSel = b.dataset.d; render(); break;
      case "cambia-apri": {
        const [data, pasto] = b.dataset.k.split("|");
        apriFoglio({ tipo: "cambia", d: { k: b.dataset.k, data, pasto, scelte: {} } });
        break;
      }
      case "cambia-scegli": d.scelte[b.dataset.c] = b.dataset.v; renderFoglio(); break;
      case "nota-apri": apriFoglio({ tipo: "nota", d: { k: b.dataset.k } }); setTimeout(() => { const t = $("#nota-testo"); if (t) t.focus(); }, 50); break;
      case "storico-stato": {
        const r = S.db.pasti.find((x) => x.id === b.dataset.k);
        if (!r || r.data >= oggi()) break;
        await operazionePasti((db)=>registraPastoDb(db,r.id,b.dataset.stato === "auto" ? "automatico" : b.dataset.stato,{consuma:!light(),automatico:b.dataset.stato === "auto"}));
        chiudiFoglio(); dopoModifica(); toast(light()?"Storico aggiornato":"Storico e scorte aggiornati");
        break;
      }
      case "nota-salva": {
        const testo = ($("#nota-testo").value || "").trim();
        const [data, pasto] = d.k.split("|");
        if (!testo) { await elimina("note", d.k); }
        else await salva("note", [{ id: d.k, data, pasto, testo, chi: S.chi || "", quando: new Date().toISOString() }]);
        if (testo && data <= oggi() && !S.db.pasti.some((r) => r.id === d.k)) {
          const p = pastoArchiviato(d.k);
          if (p) await salva("pasti", [{ id: d.k, data, pasto, stato: "auto", chi: S.chi || "", quando: new Date().toISOString(), scalato: [], contenuto: fotoPasto(p) }]);
        }
        chiudiFoglio(); render(); toast(testo ? "Nota salvata nello storico" : "Nota tolta");
        break;
      }
      case "nota-togli": await elimina("note", d.k); chiudiFoglio(); render(); toast("Nota tolta"); break;
      case "inverti-apri": {
        const data = b.dataset.d;
        const liberi = PASTI_SCAMBIABILI.filter((ps) => scambiabile(data, ps));
        if (!liberi.length) { toast("In questo giorno non ci sono pasti da spostare"); break; }
        const pastoA = liberi.includes("Pranzo") ? "Pranzo" : liberi[0];
        const pastoB = pastoA === "Pranzo" && liberi.includes("Cena") ? "Cena" : liberi.find((x) => x !== pastoA) || pastoA;
        apriFoglio({ tipo: "inverti", d: { dataA: data, pastoA, dataB: data, pastoB } });
        break;
      }
      case "inv-pasto": d[b.dataset.q] = b.dataset.v; renderFoglio(); break;
      case "inv-giorno": {
        d.dataB = b.dataset.v;
        if (!scambiabile(d.dataB, d.pastoB)) d.pastoB = PASTI_SCAMBIABILI.find((ps) => scambiabile(d.dataB, ps)) || d.pastoB;
        // tra due giorni diversi di solito si scambia lo stesso pasto (cena con cena)
        if (d.dataB !== d.dataA && scambiabile(d.dataB, d.pastoA)) d.pastoB = d.pastoA;
        renderFoglio(); break;
      }
      case "inv-conferma": await confermaInverti(); break;
      case "fitness-apri": {
        const f = b.dataset.id && S.db.fitness.find((x) => x.id === b.dataset.id);
        if (f) { apriFoglio({ tipo: "fitness", d: { ...f, persone: [...(f.persone || [])], dopoManuale: true } }); break; }
        const ora = new Date().getHours();
        const dalle = `${String(Math.min(22, Math.max(6, ora))).padStart(2, "0")}:00`;
        const alle = `${String(Math.min(23, Math.max(7, ora + 1))).padStart(2, "0")}:00`;
        apriFoglio({ tipo: "fitness", d: { data: b.dataset.d, tipo: "Palestra", dalle, alle, dopo: dopoDa(dalle), dopoManuale: false, persone: S.chi ? [S.chi] : persone().slice(0, 1).map((p) => p.id) } });
        break;
      }
      case "fit-tipo": d.tipo = b.dataset.v; renderFoglio(); if (!b.dataset.v) { const t = $("#fit-altro"); if (t) t.focus(); } break;
      case "fit-chi": d.persone = d.persone.includes(b.dataset.v) ? d.persone.filter((x) => x !== b.dataset.v) : [...d.persone, b.dataset.v]; renderFoglio(); break;
      case "fit-salva": await salvaFitness(); break;
      case "fit-togli": await elimina("fitness", d.id); chiudiFoglio(); render(); toast("Attività tolta"); break;
      case "cambia-salva": await salvaCambio(); break;
      case "cambia-ripristina": {
        const p = JSON.parse(JSON.stringify(pianoSalvato()));
        const c = p.cambi && p.cambi[b.dataset.k];
        if (c && c.coppia && p.cambi[c.coppia] && p.cambi[c.coppia].coppia === b.dataset.k) delete p.cambi[c.coppia];
        if (p.cambi) delete p.cambi[b.dataset.k];
        if (S.piano) await storicoArretrato(S.piano, S.piano.inizio);
    await salva("piano", [{ id: "attuale", dati: p, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
        dopoModifica(); toast(c && c.coppia ? "Tutti e due i pasti tornano al loro posto" : "Torna il pasto del piano");
        break;
      }
      case "vai-diario": S.diarioTab = b.dataset.v; S.pesoPersona = S.chi; S.storicoPersona = S.chi || "tutti"; chiudiFoglio(); vai("diario"); break;
      case "diario-tab": S.diarioTab = b.dataset.v; render(); break;
      case "peso-persona": S.pesoPersona = b.dataset.v; render(); break;
      case "peso-togli": {
        const r = S.db.pesi.find((x) => x.id === b.dataset.id);
        await elimina("pesi", b.dataset.id); render();
        toast("Pesata tolta", "Annulla", async () => { await salva("pesi", [r]); render(); });
        break;
      }
      case "storico-giorni": S.storicoGiorni = Number(b.dataset.v); render(); break;
      case "report-stampa": stampaReport(); break;
      case "report-testo": await esportaTesto(); break;
      case "modo":
        LS.set("ds_modo", b.dataset.v);
        fermaScanner();
        if (light()) await assicuraSpesaLight();
        dopoModifica();
        toast(b.dataset.v === "light" ? "Versione Light: Piano e Spesa" : "Versione PRO: tutte le funzioni");
        break;
      case "chi": S.chi = b.dataset.v; LS.set("ds_chi", S.chi); chiudiFoglio(); render(); break;
      case "benv-aggiungi": d.nomi.push(""); renderFoglio(); { const ult = document.getElementById("benv-" + (d.nomi.length - 1)); if (ult) ult.focus(); } break;
      case "benv-togli": d.nomi.splice(Number(b.dataset.i), 1); renderFoglio(); break;
      case "benv-avanti": {
        const nomi = d.nomi.map((n) => n.trim()).filter(Boolean);
        if (!nomi.length) { toast("Scrivi almeno un nome"); break; }
        await salvaPersone(nomi.map((n, i) => ({ id: "p" + (i + 1), nome: n })));
        if (nomi.length === 1) { S.chi = "p1"; LS.set("ds_chi", "p1"); d.passo = 3; } else d.passo = 2;
        renderFoglio(); render();
        break;
      }
      case "benv-chi": S.chi = b.dataset.v; LS.set("ds_chi", S.chi); d.passo = 3; renderFoglio(); render(); break;
      case "persona-aggiungi": {
        const lista = persone();
        let n = lista.length + 1;
        while (lista.some((p) => p.id === "p" + n)) n++;
        await salvaPersone([...lista, { id: "p" + n, nome: "Persona " + n }]);
        render(); break;
      }
      case "persona-togli": {
        const p = persone().find((x) => x.id === b.dataset.id);
        if (!confirm(`Togliere ${p.nome}? Le sue dosi del piano non verranno più contate.`)) break;
        await salvaPersone(persone().filter((x) => x.id !== b.dataset.id));
        if (S.chi === b.dataset.id) { S.chi = persone()[0].id; LS.set("ds_chi", S.chi); }
        dopoModifica(); break;
      }
      case "backup-esporta": await esportaBackup(); break;
      case "backup-conferma": await ripristinaBackup(d.dati); break;
      case "backup-precedente": {
        const raw = localStorage.getItem("ds_db_pre_ripristino");
        if (!raw) { toast("Non c'è una copia precedente al ripristino"); break; }
        anteprimaBackup({ formato: "chemanca-backup", versione: 1, dati: JSON.parse(raw) }, "Dati precedenti all'ultimo ripristino");
        break;
      }
      case "pdf-abbina": apriFoglio({ tipo: "abbinaPdf", d: { documenti: suggerisciAbbinamenti(documentiPdf(pianoSalvato())) } }); break;
      case "pdf-abbina-salva": await salvaAbbinamentiPdf(); break;
      case "persone-salva": {
        const lista = persone().map((p) => { const el = document.querySelector(`[data-persona="${p.id}"]`); return { ...p, nome: (el && el.value.trim()) || p.nome }; });
        await salvaPersone(lista); dopoModifica();
        if (pianoSalvato() && pianoSalvato().fontiPdf) apriFoglio({ tipo: "abbinaPdf", d: { documenti: suggerisciAbbinamenti(documentiPdf(pianoSalvato())) } });
        else toast("Nomi salvati"); break;
      }
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
      case "pdf-modifica": apriCorrezionePdf(Number(b.dataset.pi),Number(b.dataset.vi),b.dataset.extra==="1"); break;
      case "pdf-aggiungi": apriCorrezionePdf(Number(b.dataset.pi),-1,false); break;
      case "pdf-correzione-chiudi": d.modificaPdf=null;d.erroreCorrezione="";ridisegnaControlloPdf();break;
      case "pdf-correzione-salva":
      case "pdf-correzione-elimina": {
        const edit={...d.modificaPdf,nome:$("#pdf-edit-nome").value,qty:$("#pdf-edit-qty").value,unita:$("#pdf-edit-unita").value,pasto:$("#pdf-edit-pasto")?$("#pdf-edit-pasto").value:d.modificaPdf.pasto};
        try{applicaCorrezionePdf(d,S.sheet.tipo,edit,a==="pdf-correzione-elimina");}catch(e){d.modificaPdf=edit;d.erroreCorrezione=e.message;}
        ridisegnaControlloPdf();break;
      }
      case "pdf-annulla-correzione": annullaCorrezionePdf(d,S.sheet.tipo);ridisegnaControlloPdf();break;
      case "pdf-primo-errore": {
        const e=erroriDosiPdf(d,S.sheet.tipo)[0];if(e){d.modificaPdf=null;d.controlloPdf={documento:e.documento,settimana:e.settimana,giorno:e.giorno};ridisegnaControlloPdf();}break;
      }
      case "importa-conferma": await confermaImport(); break;
      case "importa4-conferma": await confermaImport4(); break;
      case "imp-data": d.inizio = b.dataset.v; renderFoglio(); break;
      case "alt-apri": {
        // se oggi comincia una settimana del piano si propone questa, altrimenti la prossima
        const sett = settimaneScelta();
        const dd = { inizioSett: sett[0] === oggi() ? sett[0] : sett[1] };
        generaAlternativa(dd);
        apriFoglio({ tipo: "alternativa", d: dd });
        break;
      }
      case "alt-sett": d.inizioSett = b.dataset.d; generaAlternativa(d); renderFoglio(); break;
      case "alt-rigenera": generaAlternativa(d); renderFoglio(); break;
      case "alt-usa": {
        const p = JSON.parse(JSON.stringify(pianoSalvato()));
        p.fissate = { ...(p.fissate || {}), [d.inizioSett]: d.settimana };
        if (S.piano) await storicoArretrato(S.piano, S.piano.inizio);
    await salva("piano", [{ id: "attuale", dati: p, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
        const quando = nomeSettimana(d.inizioSett);
        chiudiFoglio(); dopoModifica();
        toast("Settimana alternativa " + quando);
        break;
      }
      case "alt-togli": {
        const p = JSON.parse(JSON.stringify(pianoSalvato()));
        if (p.fissate) delete p.fissate[b.dataset.d];
        if (S.piano) await storicoArretrato(S.piano, S.piano.inizio);
    await salva("piano", [{ id: "attuale", dati: p, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
        dopoModifica(); toast("Torna la settimana tipo");
        break;
      }
      case "demo":
        if (!confirm("Sostituire frigo e dispensa con i dati di esempio?")) break;
        await elimina("inventario", S.db.inventario.map((i) => i.id));
        await salva("inventario", caricaDemo());
        dopoModifica(); vai("oggi"); toast("Dati di esempio caricati");
        break;
      case "svuota":
        if (!confirm("Cancellare frigo, dispensa, spesa e pasti segnati" + (condiviso ? " per tutti e due i telefoni" : "") + "?")) break;
        await A.azzera(); S.db = vuoto(); dopoModifica(); toast("Tutto cancellato");
        break;
    }
  }));

  // campi dei fogli e ricerche: aggiornano lo stato mentre si scrive
  document.addEventListener("input", (ev) => {
    const el = ev.target;
    if (el.dataset.nomeI != null && S.sheet && S.sheet.tipo === "benvenuto") { S.sheet.d.nomi[Number(el.dataset.nomeI)] = el.value; return; }
    if (S.sheet && S.sheet.tipo === "fitness" && el.dataset.f) {
      const d = S.sheet.d;
      d[el.dataset.f] = el.value;
      if (el.dataset.f === "dopo") d.dopoManuale = true;
      if (el.dataset.f === "dalle" && !d.dopoManuale) d.dopo = dopoDa(el.value);
      if (el.dataset.f !== "tipo") renderFoglio();
      return;
    }
    if (el.dataset.abbinaPdf != null && S.sheet && S.sheet.tipo === "abbinaPdf") { S.sheet.d.documenti[Number(el.dataset.abbinaPdf)].id = el.value; return; }
    if (S.sheet && S.sheet.d && S.sheet.d.modificaPdf && ["pdf-edit-nome","pdf-edit-qty","pdf-edit-unita","pdf-edit-pasto"].includes(el.id)) {
      const campi={"pdf-edit-nome":"nome","pdf-edit-qty":"qty","pdf-edit-unita":"unita","pdf-edit-pasto":"pasto"};S.sheet.d.modificaPdf[campi[el.id]]=el.value;return;
    }
    if (el.dataset.controlloPdf && S.sheet && ["importa","importa4"].includes(S.sheet.tipo)) {
      if(S.sheet.d.modificaPdf){toast("Applica o annulla la correzione prima di cambiare giorno o persona");ridisegnaControlloPdf();return;}
      const a=datiControlloPdf(S.sheet.d,S.sheet.tipo);
      const c={documento:a.fonte.key,giorno:a.giorno,settimana:a.settimana};
      c[el.dataset.controlloPdf]=el.dataset.controlloPdf==="documento"?el.value:Number(el.value);
      S.sheet.d.controlloPdf=c;ridisegnaControlloPdf();return;
    }
    if (el.dataset.q4 && S.sheet && S.sheet.tipo === "importa4") { S.sheet.d.mappa[el.dataset.q4] = el.value; ridisegnaControlloPdf(); return; }
    if (el.dataset.pdfI != null && S.sheet && S.sheet.tipo === "importa") { S.sheet.d.letti[Number(el.dataset.pdfI)].id = el.value; ridisegnaControlloPdf(); return; }
    if (el.dataset.f && S.sheet && S.sheet.d) {
      S.sheet.d[el.dataset.f] = el.value;
      if (el.dataset.f === "inizio" && (S.sheet.tipo === "importa" || S.sheet.tipo === "importa4") && /^\d{4}-\d{2}-\d{2}$/.test(el.value)) { renderFoglio(); return; }
      if (el.tagName === "SELECT") {
        // cambiando voce del piano, il posto giusto viene suggerito
        if (el.dataset.f === "voce" && S.piano && S.sheet.tipo === "prodotto") {
          const lu = L.luogoDaVoce(S.piano, el.value);
          if (lu) S.sheet.d.luogo = lu;
          preimpostaConfezione(S.sheet.d, null);
        }
        renderFoglio();
      }
    }
    if (el.dataset.in) { S[el.dataset.in] = el.value; render(); }
    if (el.id === "storico-persona") { S.storicoPersona = el.value; render(); }
  });
  document.addEventListener("change", eventoSicuro(async (ev) => {
    const el = ev.target;
    if (el.id === "home-persona") { S.chi = el.value; LS.set("ds_chi",S.chi); render(); return; }
    if (el.id === "home-mostra-peso") { LS.set("ds_home_peso",el.checked); toast("Preferenza della Home salvata"); return; }
    if (el.id === "pro-spesa-giorni") {
      const giorni = Number(el.value);
      if (![1,3,7,14].includes(giorni)) return;
      await salva("piano", [{ id: "spesa_pro", dati: { giorni }, aggiornato: new Date().toISOString() }]);
      ricalcola(); await allineaSpesa(); render(); return;
    }
    if (el.id === "light-liste") { const p = statoSpesaLight().periodi.find((x) => x.id === el.value); if (p) await cambiaPeriodoLight(p.dal,p.giorni); return; }
    if (el.dataset.file === "backup" && el.files[0]) {
      try {
        if (el.files[0].size > 25 * 1024 * 1024) throw new Error("File troppo grande: scegli un backup di CheManca?");
        anteprimaBackup(JSON.parse(await el.files[0].text()), el.files[0].name);
      } catch (e) { toast("Backup non valido: " + e.message); }
      el.value = ""; return;
    }
    if (el.dataset.file === "piano" && el.files[0]) {
      try {
        const p = JSON.parse(await el.files[0].text());
        if (!p.inizio || !Array.isArray(p.settimane)) throw new Error("non sembra un piano.json");
        if (S.piano && p.inizio > oggi()) p.prima = { ...S.piano, prima: undefined };
        if (S.piano) await storicoArretrato(S.piano, S.piano.inizio);
    await salva("piano", [{ id: "attuale", dati: p, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
        dopoModifica(); toast("Nuovo piano in uso dal " + ddmm(p.inizio));
      } catch (e) { toast("Piano non valido: " + e.message); }
      el.value = "";
    }
    if (el.dataset.file === "pdf" && el.files.length) {
      await leggiPdfDieta([...el.files]);
      el.value = "";
    }
  }));
  document.addEventListener("submit", eventoSicuro(async (ev) => {
    ev.preventDefault();
    const f = ev.target.dataset.form;
    if (f === "ean") {
      const v = $("#ean").value.replace(/\D/g, "");
      if (v.length < 8) return toast("Il codice ha almeno 8 cifre");
      fermaScanner(); trovatoCodice(v);
    }
    if (f === "inizio-piano") {
      const nuova = $("#inizio-piano").value;
      const p = JSON.parse(JSON.stringify(pianoSalvato()));
      if (!nuova || nuova === p.inizio) return;
      if (Object.keys(p.fissate || {}).length && !confirm("Le settimane alternative già create vanno ricreate dopo il cambio di data. Continuare?")) return;
      p.inizio = nuova;
      p.fissate = {};
      if (S.piano) await storicoArretrato(S.piano, S.piano.inizio);
    await salva("piano", [{ id: "attuale", dati: p, aggiornato: new Date().toISOString(), da: S.chi || "" }]);
      const n = await storicoArretrato(p, nuova);
      dopoModifica();
      toast("Dieta dal " + ddmm(nuova) + (n ? ` · ${n} pasti passati nello storico` : ""));
      return;
    }
    if (f === "peso") {
      const kg = Number(String($("#peso-kg").value).replace(",", "."));
      const data = $("#peso-data").value || oggi();
      if (!(kg > 20 && kg < 400)) return toast("Scrivi il peso in kg, per esempio 82,4");
      const chi = S.pesoPersona || S.chi;
      const stesso = S.db.pesi.find((x) => x.persona === chi && x.data === data);
      await salva("pesi", [{ id: stesso ? stesso.id : uid(), persona: chi, data, kg: Math.round(kg * 10) / 10, creato: new Date().toISOString() }]);
      render(); toast(`${nomeDi(chi)}: ${L.fmtNum(kg)} kg il ${ddmm(data)}`);
      return;
    }
    if (f === "light-periodo") { await cambiaPeriodoLight($("#light-dal").value, Number($("#light-giorni").value)); return; }
    if (f === "spesa-nuova") {
      const nome = $("#nuova-voce").value.trim();
      if (!nome) return;
      if (light()) { await manualeLight("aggiungi", null, nome); return; }
      await salva("spesa", [{ nome, qty_txt: "", motivo: "", urgenza: "dopo", origine: "mano", fatto: false, creato_da: S.chi || "", creato: new Date().toISOString() }]);
      render(); renderNav();
      $("#nuova-voce") && $("#nuova-voce").focus();
    }
  }));
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && S.sheet && !(S.sheet.tipo === "benvenuto" && S.sheet.d.passo < 3)) chiudiFoglio(); });

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
    // la Light si apre sulla Home di oggi
    if (light()) S.tab = "oggi";
    try { S.pianoFile = await (await fetch("piano.json", { cache: "no-cache" })).json(); }
    catch { S.pianoFile = null; }
    try { S.db = await A.carica(); }
    catch (e) { console.error(e); S.erroreSalvataggio = e.message || String(e); toast(S.erroreSalvataggio); }
    if (S.erroreSalvataggio && A.tipo === "locale") { S.tab = "imp"; render(); return; }
    scegliPiano();
    await chiudiGiorniPassati();
    A.ascolta(ricaricaPresto);
    dopoModifica();
    if (!persone().length) {
      if (S.chi === "max" || S.chi === "vale") {
        // chi usava già la versione per Max e Vale: stesse persone, stesso piano pubblicato
        await salvaPersone([{ id: "max", nome: "Max" }, { id: "vale", nome: "Vale" }]);
        LS.set("ds_usa_pianofile", true);
        dopoModifica();
      } else apriFoglio({ tipo: "benvenuto", d: { passo: 1, nomi: [""] } });
    } else if (!S.chi || !persone().some((p) => p.id === S.chi)) apriFoglio({ tipo: "chi" });
    if (S.tab === "aggiungi" && S.aggTab === "codice") avviaScanner();
    // al ritorno sull'app (dal frigo al telefono) si riallinea: il giorno può essere cambiato
    document.addEventListener("visibilitychange", async () => {
      if (document.hidden) return;
      await ricarica();
      scegliPiano();
      await chiudiGiorniPassati();
      dopoModifica();
    });
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
    setInterval(eventoSicuro(async()=>{
      if(document.hidden)return;
      const r=S.db.piano.find((x)=>x.id==="chiusura_giorni");
      if(S.piano && (!r || r.dati.dal!==oggi())) { await chiudiGiorniPassati();dopoModifica(); }
      aggiornaHomeAutomatica();
    }),30000);
    await apriCondivisi();
  }

  // un PDF condiviso da WhatsApp o dalla mail (Android): il service worker l'ha parcheggiato
  async function apriCondivisi() {
    const q = new URLSearchParams(location.search);
    if (!q.has("condiviso") || !("caches" in window)) return;
    history.replaceState(null, "", location.pathname);
    try {
      const cache = await caches.open("chemanca-condivisi");
      const files = [];
      for (const req of await cache.keys()) {
        const r = await cache.match(req);
        files.push(new File([await r.blob()], decodeURIComponent(r.headers.get("X-Nome") || "dieta.pdf"), { type: "application/pdf" }));
        await cache.delete(req);
      }
      if (!files.length) return;
      if (!persone().length) { toast("Prima scrivi i nomi, poi ricondividi il PDF"); return; }
      chiudiFoglio();
      await leggiPdfDieta(files);
    } catch (e) { console.error(e); toast("Non riesco ad aprire il PDF condiviso"); }
  }
  avvio();
})();
