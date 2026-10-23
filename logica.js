/* CheManca? — la logica pura, senza interfaccia.
   La usano sia l'app nel browser sia avvisi.mjs (GitHub Actions), così il calcolo
   di cosa manca è uno solo. Nessuna dipendenza. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Logica = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const PASTI = ["Colazione", "Metà mattina", "Pranzo", "Merenda", "Cena", "Fuori pasto"];
  // ora indicativa di ogni pasto: serve a ordinare e a capire cosa è già passato
  const ORA = { "Colazione": 8, "Metà mattina": 10.5, "Pranzo": 13, "Merenda": 16.5, "Cena": 20, "Fuori pasto": 22 };
  const GENERICHE = new Set(["Frutta di stagione", "Verdura di stagione", "Misto verdure crude"]);
  // unità che non si pesano: basta averne in casa (una tazzina di caffè, un cucchiaino di miele)
  const PRESENZA = new Set(["tazzina", "cucchiaino", "cucchiaini"]);
  const G_VASETTO = 150;   // yogurt greco: un vasetto = 150 g
  const G_UOVO = 60;
  // un cucchiaino d'olio: la dietista conta 4 g (28 cucchiaini = 112 g), cioè circa 4,4 ml
  const L_CUCCHIAINO = 0.0044;
  const CUCCHIAI = new Set(["cucchiaino", "cucchiaini"]);
  /* come si contano in casa alcune voci del piano, invece dei grammi del piano:
     i crackers a pacchetti (uno scalato per pasto), l'olio a litri */
  const REGOLE = {
    "Crackers non salati": { unita: "pz", etichetta: ["pacchetto", "pacchetti"], g_pz: 30, intero: true, conf: 10 },
    "Olio extra vergine di oliva": { unita: "l", conf: 1 },
    // un avocado si divide a metà fra due persone: 50 g a testa = mezzo avocado
    "Avocado": { unita: "pz", etichetta: ["avocado", "avocado"], g_pz: 100 },
  };
  function regola(item) { return REGOLE[(Array.isArray(item.voci) && item.voci[0]) || item.nome] || null; }
  const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  const GIORNI_BREVI = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];

  /* ---------------- date (sempre ISO AAAA-MM-GG, ora locale) ---------------- */
  function iso(d) {
    const z = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }
  function daIso(s) { const [a, m, g] = s.split("-").map(Number); return new Date(a, m - 1, g); }
  function piuGiorni(s, n) { const d = daIso(s); d.setDate(d.getDate() + n); return iso(d); }
  function diffGiorni(a, b) { return Math.round((daIso(b) - daIso(a)) / 86400000); }
  function nomeGiorno(s, oggi) {
    const k = diffGiorni(oggi, s);
    if (k === -1) return "ieri";
    if (k === 0) return "oggi";
    if (k === 1) return "domani";
    if (k === 2) return "dopodomani";
    return GIORNI[daIso(s).getDay()] + " " + daIso(s).getDate();
  }
  function etichettaData(s) {
    const d = daIso(s);
    return GIORNI_BREVI[d.getDay()] + " " + d.getDate();
  }

  /* ---------------- piano ---------------- */
  /* il giorno del piano, con i pasti cambiati a mano ("Cambia pasto") al posto di quelli
     del piano: piano.cambi = { "2026-10-20|Pranzo": pasto } */
  function giornoPiano(piano, data) {
    const g = giornoBase(piano, data);
    if (!g || !piano.cambi) return g;
    g.pasti = g.pasti.map((p) => {
      const c = piano.cambi[chiavePasto(data, p.pasto)];
      return c ? { ...c, pasto: p.pasto, cambiato: true } : p;
    });
    return g;
  }
  // il lunedì della settimana di una data
  function lunediDi(data) { return piuGiorni(data, -((daIso(data).getDay() + 6) % 7)); }
  // da dove si contano le settimane: per i piani dal PDF (lunedì…domenica) il lunedì della
  // settimana in cui si comincia, così il menu del lunedì cade sempre di lunedì
  function inizioSettimane(piano) { return piano.lunedi ? lunediDi(piano.inizio) : piano.inizio; }

  function giornoBase(piano, data) {
    // prima che parta la nuova dieta vale ancora quella vecchia
    if (diffGiorni(piano.inizio, data) < 0) return piano.prima ? giornoBase(piano.prima, data) : null;
    const k = diffGiorni(inizioSettimane(piano), data);
    const nSett = piano.settimane.length;
    const sett = Math.floor(k / 7) % nSett;
    // una settimana alternativa creata nell'app vale per la sua settimana di calendario
    const inizioSett = piuGiorni(inizioSettimane(piano), Math.floor(k / 7) * 7);
    const fissata = piano.fissate && piano.fissate[inizioSett];
    const pasti = (fissata || piano.settimane[sett])[k % 7].map((p) => ({ ...p }));
    if (piano.extra && piano.extra.length) {
      pasti.push({ pasto: "Fuori pasto", libero: false, piatti: ["Cioccolato e olio del giorno"], voci: piano.extra });
    }
    return { settimana: sett + 1, alternativa: !!fissata, inizioSett, oltre: nSett > 1 && k >= nSett * 7, pasti, alternative: piano.alternative || null };
  }

  function chiavePasto(data, pasto) { return data + "|" + pasto; }

  /* pasti ancora da mangiare da adesso per `giorni` giorni (oggi compreso).
     stati: { "2026-10-14|Pranzo": {stato:"fatto"} } — un pasto confermato non conta più.
     ora: l'ora attuale. I pasti di oggi già passati (più di un'ora fa) si danno per mangiati:
     consumano la scorta simulata ma non generano allarmi, ormai è tardi per comprare. */
  function istanteLocale(data, ora = 0) {
    const d = daIso(data), minuti = Math.round(ora * 60);
    d.setHours(Math.floor(minuti / 60), minuti % 60, 0, 0); return d.getTime();
  }
  function nelle24Ore(data, pasto, dal, ora) {
    const inizio = istanteLocale(dal, ora), quando = istanteLocale(data, ORA[pasto] ?? 12);
    return quando >= inizio && quando < inizio + 86400000;
  }
  function pastiFinestra(piano, oggi, giorni, stati, ora, oreFinestra) {
    const out = [];
    for (let i = 0; i < (oreFinestra === 24 ? 3 : giorni); i++) {
      const data = piuGiorni(oggi, i);
      const g = giornoPiano(piano, data);
      if (!g) continue;
      for (const p of g.pasti) {
        if (oreFinestra === 24 && !nelle24Ore(data, p.pasto, oggi, ora || 0)) continue;
        const k = chiavePasto(data, p.pasto);
        if (stati && stati[k]) continue;
        const passato = oreFinestra !== 24 && i === 0 && ora != null && ORA[p.pasto] + 1 < ora;
        out.push({ data, chiave: k, ...p, passato, settimana: g.settimana, ord: i * 100 + ORA[p.pasto] });
      }
    }
    return out.sort((a, b) => a.ord - b.ord);
  }

  /* le dosi di una voce, persona per persona: { "p1": 200, "p2": 150 }.
     Legge anche il formato vecchio del piano a 4 settimane ({max, vale}). */
  function dosi(voce) {
    if (voce.q) return voce.q;
    const o = {};
    if (voce.max != null) o.max = voce.max;
    if (voce.vale != null) o.vale = voce.vale;
    return o;
  }
  // chi = id di una persona (solo lei ha mangiato) oppure niente (tutti)
  function quantoServe(voce, chi) {
    const d = dosi(voce);
    if (chi) return Number(d[chi]) || 0;
    return Object.values(d).reduce((s, x) => s + (Number(x) || 0), 0);
  }

  /* ---------------- quantità in casa ---------------- */
  // quanto di `item` vale nell'unità del piano `u`; Infinity = basta che ci sia
  function disponibile(item, u) {
    const q = Math.max(0, Number(item.qty) || 0);
    if (q <= 0) return 0;
    if (item.unita === "l") {
      if (CUCCHIAI.has(u)) return q / L_CUCCHIAINO;
      if (u === "g") return q * 920;           // olio: 0,92 kg al litro
      return Infinity;
    }
    if (PRESENZA.has(u)) return Infinity;
    const gpz = (regola(item) || {}).g_pz || Number(item.g_pz) || 0;
    if (u === "g") {
      if (item.unita === "g") return q;
      return gpz ? q * gpz : Infinity;
    }
    if (u === "n.") return item.unita === "pz" ? q : q / G_UOVO;
    if (u === "vasetto") {
      if (item.unita === "g") return q / G_VASETTO;
      return gpz ? (q * gpz) / G_VASETTO : q;
    }
    return Infinity;
  }

  // toglie `quanto` (nell'unità del piano u) da item.qty; restituisce la nuova qty
  function scala(item, quanto, u) {
    const q = Number(item.qty) || 0;
    if (item.unita === "l") {
      const togliL = CUCCHIAI.has(u) ? quanto * L_CUCCHIAINO : u === "g" ? quanto / 920 : 0;
      return Math.max(0, Math.round((q - togliL) * 10000) / 10000);
    }
    if (PRESENZA.has(u)) return q;
    const r = regola(item);
    const gpz = (r || {}).g_pz || Number(item.g_pz) || 0;
    let togli;
    if (u === "g") togli = item.unita === "g" ? quanto : gpz ? quanto / gpz : 1;
    else if (u === "n.") togli = item.unita === "pz" ? quanto : quanto * G_UOVO;
    else if (u === "vasetto") togli = item.unita === "g" ? quanto * G_VASETTO : gpz ? (quanto * G_VASETTO) / gpz : quanto;
    else togli = 0;
    // i pacchetti si aprono interi: un pasto ne toglie almeno uno
    if (r && r.intero && item.unita === "pz" && togli > 0) togli = Math.ceil(togli - 1e-9);
    return Math.max(0, Math.round((q - togli) * 10000) / 10000);
  }

  function vociDi(item) {
    if (Array.isArray(item.voci) && item.voci.length) return item.voci;
    return [item.nome];
  }

  // i prodotti in casa che possono coprire una voce del piano: prima quelli che sono
  // proprio quella voce, poi quelli generici; a parità prima chi scade prima
  function candidati(stock, voce) {
    return stock
      .filter((it) => it.qty > 0 && vociDi(it).includes(voce))
      .sort((a, b) => {
        const pa = vociDi(a)[0] === voce ? 0 : 1;
        const pb = vociDi(b)[0] === voce ? 0 : 1;
        if (pa !== pb) return pa - pb;
        return (a.scadenza || "9999") < (b.scadenza || "9999") ? -1 : 1;
      });
  }

  // preleva `serve` dalla scorta (simulata o vera); restituisce quanto resta scoperto
  // e l'elenco dei prelievi {id, qty nuova}
  function preleva(stock, voce, serve, u) {
    let resta = serve;
    const mosse = [];
    for (const it of candidati(stock, voce)) {
      if (resta <= 1e-9) break;
      const disp = disponibile(it, u);
      if (disp === Infinity) {
        it.qty = scala(it, resta, u);
        mosse.push({ id: it.id, qty: it.qty });
        resta = 0;
        break;
      }
      const prendi = Math.min(disp, resta);
      it.qty = scala(it, prendi, u);
      mosse.push({ id: it.id, qty: it.qty });
      resta -= prendi;
    }
    return { resta: resta > 1e-6 ? resta : 0, mosse };
  }

  function ordinaVoci(voci) {
    // prima le voci precise (zucchine), poi le generiche (verdura di stagione)
    return [...voci].sort((a, b) => (GENERICHE.has(a.nome) ? 1 : 0) - (GENERICHE.has(b.nome) ? 1 : 0));
  }

  /* ---------------- il calcolo: cosa manca nei prossimi giorni ----------------
     Scorre i pasti in ordine di tempo e "mangia" la scorta simulata: così sa non solo
     cosa manca ma per quale pasto, e se le uova bastano per giovedì ma non per venerdì. */
  function calcolaMancanze(piano, inventario, stati, oggi, giorni, ora, oreFinestra) {
    giorni = giorni || 3;
    const stock = inventario.map((it) => ({ ...it, qty: Number(it.qty) || 0 }));
    const pasti = pastiFinestra(piano, oggi, giorni, stati, ora, oreFinestra);
    const perVoce = new Map();
    const tutteVoci = new Set();
    for (const p of pasti) {
      if (p.libero) continue;
      for (const v of ordinaVoci(p.voci)) {
        const serve = quantoServe(v);
        if (serve <= 0) continue;
        const { resta } = preleva(stock, v.nome, serve, v.u);
        if (p.passato) continue;
        tutteVoci.add(v.nome);
        if (resta <= 0) continue;
        let m = perVoce.get(v.nome);
        if (!m) {
          m = { voce: v.nome, u: v.u, manca: 0, pasti: [], presenza: PRESENZA.has(v.u) };
          perVoce.set(v.nome, m);
        }
        m.manca += resta;
        m.pasti.push({ data: p.data, pasto: p.pasto, serve, manca: resta, q: dosi(v) });
      }
    }
    const domani = piuGiorni(oggi, 1);
    const inCasa = (voce) => inventario.some((it) => Number(it.qty) > 0 && vociDi(it).includes(voce));
    const mancanze = [...perVoce.values()].map((m) => {
      const primo = m.pasti[0];
      return {
        ...m,
        manca: Math.round(m.manca * 100) / 100,
        data: primo.data,
        pasto: primo.pasto,
        urgente: primo.data <= domani,
        tipo: inCasa(m.voce) ? "scarso" : "manca",
      };
    });
    mancanze.sort((a, b) => a.data.localeCompare(b.data) || ORA[a.pasto] - ORA[b.pasto]);
    return {
      mancanze,
      totaleVoci: tutteVoci.size,
      pronte: tutteVoci.size - mancanze.length,
      pasti,
    };
  }

  /* quando un pasto è fatto: cosa togliere dall'inventario */
  function consumaPasto(inventario, pasto, chi) {
    const stock = inventario.map((it) => ({ ...it, qty: Number(it.qty) || 0 }));
    const ultime = new Map();
    for (const v of ordinaVoci(pasto.voci || [])) {
      const serve = quantoServe(v, chi);
      if (serve <= 0) continue;
      const { mosse } = preleva(stock, v.nome, serve, v.u);
      for (const m of mosse) ultime.set(m.id, m.qty);
    }
    return [...ultime.entries()].map(([id, qty]) => ({ id, qty }));
  }

  /* ---------------- testi ---------------- */
  function fmtNum(n) {
    const r = Math.round(n * 10) / 10;
    return String(r).replace(".", ",");
  }
  function fmtQ(n, u) {
    if (PRESENZA.has(u)) return "";
    if (u === "g") {
      const r = Math.ceil(n / 10) * 10;
      return r >= 1000 ? fmtNum(r / 1000) + " kg" : r + " g";
    }
    if (u === "n.") return Math.ceil(n) + " pz";
    if (u === "vasetto") { const k = Math.ceil(n); return k + (k === 1 ? " vasetto" : " vasetti"); }
    return fmtNum(n) + " " + u;
  }
  function fmtLitri(q) { return String(Math.round(q * 100) / 100).replace(".", ",") + " l"; }
  function fmtScorta(item) {
    const q = Number(item.qty) || 0;
    if (item.unita === "g") return q >= 1000 ? fmtNum(q / 1000) + " kg" : Math.round(q) + " g";
    if (item.unita === "l") return fmtLitri(q);
    const r = regola(item);
    if (r && r.etichetta) return fmtNum(q) + " " + r.etichetta[q === 1 ? 0 : 1];
    return fmtNum(q) + (item.etichetta_pz ? " " + item.etichetta_pz : " pz");
  }
  // "Max 200 g · Vale 150 g" oppure "per Vale"; persone = [{id, nome}]
  function dettaglioPersone(p, u, persone) {
    if (PRESENZA.has(u)) return "";
    const d = p.q || dosi(p);
    const ids = Object.keys(d).filter((k) => Number(d[k]) > 0);
    const nome = (id) => { const x = (persone || []).find((y) => y.id === id); return x ? x.nome : id.charAt(0).toUpperCase() + id.slice(1); };
    if (ids.length > 1) return ids.map((id) => `${nome(id)} ${fmtQ(d[id], u)}`).join(" · ");
    if (ids.length === 1) return "per " + nome(ids[0]);
    return "";
  }

  // il testo della voce in lista spesa
  function quantitaSpesa(m) {
    const r = REGOLE[m.voce];
    if (r && r.unita === "l") return "1 bottiglia";
    if (r && r.g_pz && m.u === "g") { const k = Math.ceil(m.manca / r.g_pz - 1e-9); return k + " " + r.etichetta[k === 1 ? 0 : 1]; }
    if (m.presenza) return "";
    if (m.tipo === "scarso" && m.u === "n.") return "+" + Math.ceil(m.manca);
    return fmtQ(m.manca, m.u);
  }

  function motivo(m, oggi) {
    const p = m.pasti[0];
    const quando = `${p.pasto.toLowerCase()} di ${nomeGiorno(p.data, oggi)}`;
    const n = m.pasti.length - 1;
    const altri = n > 0 ? ` (+${n} ${n === 1 ? "pasto" : "pasti"})` : "";
    return quando.charAt(0).toUpperCase() + quando.slice(1) + altri;
  }

  // HTML di Telegram (b, i, a)
  function testoAvviso(mancanze, oggi, opz) {
    opz = opz || {};
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const urg = mancanze.filter((m) => m.urgente);
    const dopo = mancanze.filter((m) => !m.urgente);
    if (!urg.length && (!dopo.length || opz.soloUrgenti)) return null;
    const righe = [];
    righe.push(opz.titolo ? `<b>${esc(opz.titolo)}</b>` : "<b>CheManca?</b>");
    if (urg.length) {
      righe.push("", "<b>Manca per oggi e domani</b>");
      for (const m of urg) {
        const q = quantitaSpesa(m);
        righe.push(`• <b>${esc(m.voce)}</b>${q ? " " + esc(q) : ""} — ${esc(motivo(m, oggi).toLowerCase())}`);
      }
    }
    if (dopo.length && !opz.soloUrgenti) {
      righe.push("", "<b>Nei prossimi giorni</b>");
      for (const m of dopo) {
        const q = quantitaSpesa(m);
        righe.push(`• ${esc(m.voce)}${q ? " " + esc(q) : ""} — ${esc(motivo(m, oggi).toLowerCase())}`);
      }
    }
    righe.push("", "Già nella lista della spesa.");
    if (opz.link) righe.push(`<a href="${esc(opz.link)}">Apri CheManca?</a>`);
    return righe.join("\n");
  }

  function testoSemplice(html) {
    return html.replace(/<a [^>]*>([^<]*)<\/a>/g, "$1").replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  }

  /* ---------------- lista della spesa ----------------
     Le voci "dal piano" si tengono allineate da sole: compaiono quando manca qualcosa,
     cambiano quantità, spariscono se poi lo compri. Quelle spuntate o scritte a mano
     non si toccano. */
  function allineaSpesa(spesa, mancanze, oggi) {
    const ops = { inserisci: [], aggiorna: [], elimina: [] };
    const auto = new Map(spesa.filter((s) => s.origine === "piano").map((s) => [s.voce, s]));
    for (const m of mancanze) {
      const riga = {
        nome: m.voce, voce: m.voce, qty_txt: quantitaSpesa(m), motivo: motivo(m, oggi),
        urgenza: m.urgente ? "urgente" : "entro", data_serve: m.data,
      };
      const s = auto.get(m.voce);
      if (!s) ops.inserisci.push({ ...riga, origine: "piano", fatto: false });
      else {
        auto.delete(m.voce);
        if (s.fatto) continue;
        const cambia = ["qty_txt", "motivo", "urgenza", "data_serve"].some((k) => s[k] !== riga[k]);
        if (cambia) ops.aggiorna.push({ id: s.id, ...riga });
      }
    }
    for (const s of auto.values()) if (!s.fatto) ops.elimina.push(s.id);
    return ops;
  }

  /* ---------------- riconoscere un prodotto scansionato ---------------- */
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !["con", "del", "della", "allo", "alla", "per"].includes(w));
  }
  // la voce del piano più simile al nome letto (ricotta vaccina -> Ricotta di vacca)
  function indovinaVoce(nome, voci) {
    const t = norm(nome);
    let best = null, bestScore = 0;
    for (const v of voci) {
      const tv = norm(v);
      if (!tv.length) continue;
      let hit = 0;
      for (const w of tv) if (t.some((x) => x.slice(0, 4) === w.slice(0, 4))) hit++;
      // copre le parole della voce, e a parità preferisce chi lascia meno parole del nome scoperte
      const score = hit / tv.length - 0.01 * Math.max(0, t.length - hit);
      if (score > bestScore) { bestScore = score; best = v; }
    }
    return bestScore >= 0.5 ? best : null;
  }

  const FRIGO_CAT = ["dair", "chees", "yogurt", "meat", "fish", "seafood", "egg", "fresh", "ham", "sausage",
    "mozzarella", "ricotta", "butter", "milk", "cream", "chilled", "refrigerat"];
  function luogoDaCategorie(tags) {
    const s = (tags || []).join(" ");
    return FRIGO_CAT.some((k) => s.includes(k)) ? "frigo" : "dispensa";
  }
  const FRIGO_PIANO = ["CARNE E SALUMI", "PESCE", "UOVA E LATTICINI", "VERDURA"];
  function luogoDaVoce(piano, voce) {
    for (const [cat, nomi] of Object.entries(piano.categorie || {})) {
      if (nomi.includes(voce)) return FRIGO_PIANO.includes(cat) ? "frigo" : "dispensa";
    }
    return null;
  }

  function tutteLeVoci(piano) {
    const s = new Set();
    for (const sett of piano.settimane) for (const g of sett) for (const p of g) for (const v of p.voci) s.add(v.nome);
    for (const v of piano.extra || []) s.add(v.nome);
    return [...s].sort((a, b) => a.localeCompare(b, "it"));
  }


  // Lista Light per un periodo fisso: nessun inventario, consumo o equivalenza implicita.
  function fabbisognoLight(piano, dal, giorni, persone, oraInizio = 0) {
    if (!piano) return [];
    const ids = persone ? new Set(persone.map((p) => p.id)) : null;
    const righe = new Map();
    for (let i = 0; i < (giorni === 1 ? 3 : giorni); i++) {
      const data = piuGiorni(dal, i), giorno = giornoPiano(piano, data);
      if (!giorno) continue;
      for (const p of giorno.pasti) {
        if (p.libero || (giorni === 1 && !nelle24Ore(data, p.pasto, dal, oraInizio))) continue;
        for (const v of p.voci) {
          const q = Object.fromEntries(Object.entries(dosi(v)).filter(([id, n]) => (!ids || ids.has(id)) && Number(n) > 0).map(([id, n]) => [id, Number(n)]));
          const totale = Object.values(q).reduce((a, b) => a + b, 0);
          if (!totale) continue;
          const id = JSON.stringify([v.nome, v.u]);
          let r = righe.get(id);
          if (!r) { r = { id, nome: v.nome, u: v.u, qty: 0, q: {}, prima: data }; righe.set(id, r); }
          r.qty += totale;
          for (const [persona, n] of Object.entries(q)) r.q[persona] = (r.q[persona] || 0) + n;
        }
      }
    }
    return [...righe.values()].map((r) => ({ ...r, qty: Math.round(r.qty * 10000) / 10000 })).sort((a, b) => a.nome.localeCompare(b.nome, "it") || a.u.localeCompare(b.u, "it"));
  }
  function righeLight(fabbisogno, coperture) {
    const righe = new Map(fabbisogno.map((r) => [r.id, { ...r }]));
    for (const [id, c] of Object.entries(coperture || {})) {
      if (!righe.has(id) && (c.comprato > 0 || c.disponibile > 0)) righe.set(id, { id, nome: c.nome, u: c.u, qty: 0, q: {}, rimosso: true });
    }
    return [...righe.values()].map((r) => {
      const c = (coperture || {})[r.id] || {};
      const comprato = Math.max(0, Number(c.comprato) || 0), disponibile = Math.max(0, Number(c.disponibile) || 0);
      const manca = Math.max(0, Math.round((r.qty - comprato - disponibile) * 10000) / 10000);
      return { ...r, comprato, disponibile, manca, coperto: manca <= 0, aggiunta: manca > 0 && comprato + disponibile > 0 };
    }).sort((a, b) => Number(a.coperto) - Number(b.coperto) || a.nome.localeCompare(b.nome, "it"));
  }

  return {
    fabbisognoLight, righeLight, istanteLocale,
    PASTI, ORA, PRESENZA, GENERICHE, REGOLE, regola, fmtLitri,
    iso, daIso, piuGiorni, diffGiorni, nomeGiorno, etichettaData, GIORNI,
    giornoPiano, chiavePasto, lunediDi, inizioSettimane, pastiFinestra, quantoServe, dosi,
    disponibile, scala, calcolaMancanze, consumaPasto,
    fmtQ, fmtScorta, fmtNum, dettaglioPersone, quantitaSpesa, motivo, testoAvviso, testoSemplice,
    allineaSpesa, indovinaVoce, luogoDaCategorie, luogoDaVoce, tutteLeVoci,
  };
});
