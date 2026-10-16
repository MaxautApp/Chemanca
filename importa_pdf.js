/* Lettura del PDF "Dieta a menu giornaliero" (Progeo Medical) della dietista.
   Si lavora sulle righe di testo delle pagine "Piano alimentare - Lunedì" ... "Domenica":
   pasto, alimento, quantità (g 50 · n° 2 · 1 tazzina), codice alternativa da ignorare.
   Funzione pura: le righe arrivano da pdf.js nel browser (o da qualunque estrattore). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ImportaPdf = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const GIORNI = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];
  const PASTI = {
    "colazione": "Colazione", "metà mattina": "Metà mattina", "spuntino di metà mattina": "Metà mattina",
    "pranzo": "Pranzo", "merenda": "Merenda", "spuntino pomeridiano": "Merenda", "cena": "Cena",
    "spuntino serale": "Fuori pasto", "dopo cena": "Fuori pasto", "arco della giornata": "Fuori pasto",
  };
  const ORDINE = ["Colazione", "Metà mattina", "Pranzo", "Merenda", "Cena", "Fuori pasto"];
  // i nomi della dietista diventano quelli già usati dall'app e dal catalogo
  const ALIAS = {
    "albume d'uovo di gallina": "Albume d'uovo",
    "misto di verdure crude": "Misto verdure crude",
    "merluzzo o nasello": "Merluzzo o nasello",
    "riso basmati integrale": "Riso Basmati integrale",
  };
  const SALTA = /^(alimento|quantità|alt\.?|\d{3,5})$/i;

  function pulisciNome(s) {
    let n = s.replace(/^[-•]\s*/, "").replace(/\s+/g, " ").trim();
    const a = ALIAS[n.toLowerCase()];
    if (a) return a;
    // "Yogurt greco 2% di grassi (150 g)" -> "Yogurt greco 2%"
    n = n.replace(/\s*\([^)]*\)\s*$/, "").replace(/ di grassi$/i, "").trim();
    return ALIAS[n.toLowerCase()] || n;
  }

  // riconosce una quantità che occupa una o due righe; restituisce {q, u, righe} o null
  function quantita(r0, r1) {
    const a = (r0 || "").trim(), b = (r1 || "").trim();
    const num = (x) => Number(String(x).replace(/\./g, "").replace(",", "."));
    let m;
    if (/^(g|ml)$/i.test(a) && /^[\d.,]+$/.test(b)) return { q: num(b), u: "g", righe: 2 };
    if ((m = a.match(/^(?:g|ml)\s+([\d.,]+)$/i))) return { q: num(m[1]), u: "g", righe: 1 };
    if ((m = a.match(/^n°\s*([\d.,]+)$/i))) return { q: num(m[1]), u: "n.", righe: 1 };
    if (/^n°$/i.test(a) && /^[\d.,]+$/.test(b)) return { q: num(b), u: "n.", righe: 2 };
    if ((m = a.match(/^([\d.,]+)\s+(tazzin[ae]|cucchiain[oi]|cucchia[io]?|vasett[oi]|fett[ae]|bicchier[ei]|pezz[oi]|confezion[ei])$/i))) {
      const w = m[2].toLowerCase();
      const u = w.startsWith("tazzin") ? "tazzina" : w.startsWith("cucchiain") ? (num(m[1]) === 1 ? "cucchiaino" : "cucchiaini")
        : w.startsWith("vasett") ? "vasetto" : w.startsWith("fett") || w.startsWith("pezz") || w.startsWith("confez") ? "n." : "tazzina";
      return { q: num(m[1]), u, righe: 1 };
    }
    if (/^q\.?\s?b\.?$/i.test(a)) return { q: 0, u: "qb", righe: 1 };
    return null;
  }

  /* pagine: array di array di righe. Restituisce
     { persona, giorni: [ [ {pasto, libero, piatti, voci:[{nome,q,u}]} ] x7 ], avvisi: [] } */
  function leggiPersona(pagine) {
    const giorni = Array(7).fill(null);
    const avvisi = [];
    let persona = "";
    for (const righe0 of pagine) {
      const righe = righe0.map((r) => r.replace(/\s+/g, " ").trim()).filter(Boolean);
      const iTit = righe.findIndex((r) => /^piano alimentare\s*-\s*/i.test(r));
      if (iTit < 0) continue;
      const nomeGiorno = righe[iTit].replace(/^piano alimentare\s*-\s*/i, "").toLowerCase();
      const g = GIORNI.indexOf(nomeGiorno);
      if (g < 0) continue;
      if (!persona && iTit > 0) persona = righe[iTit - 1];
      const pasti = [];
      let pasto = null;
      let nomeInSospeso = null;
      const chiudiNome = () => {
        if (nomeInSospeso && pasto) {
          if (/^pasto libero$/i.test(nomeInSospeso)) pasto.libero = true;
          else pasto.piatti.push(nomeInSospeso.replace(/^[-•]\s*/, ""));
        }
        nomeInSospeso = null;
      };
      for (let i = iTit + 1; i < righe.length; i++) {
        const r = righe[i];
        if (/^elaborato da/i.test(r) || /^profilo nutrizionale/i.test(r)) break;
        if (SALTA.test(r)) continue;
        const p = PASTI[r.toLowerCase()];
        if (p) {
          chiudiNome();
          pasto = pasti.find((x) => x.pasto === p);
          if (!pasto) { pasto = { pasto: p, libero: false, piatti: [], voci: [] }; pasti.push(pasto); }
          continue;
        }
        if (!pasto) continue;
        if (/^pasto libero$/i.test(r)) { chiudiNome(); pasto.libero = true; continue; }
        const q = quantita(r, righe[i + 1]);
        if (q) {
          if (nomeInSospeso) {
            if (q.u !== "qb") pasto.voci.push({ nome: pulisciNome(nomeInSospeso), q: q.q, u: q.u });
            nomeInSospeso = null;
          } else avvisi.push(`${GIORNI[g]}: quantità «${r}» senza alimento`);
          i += q.righe - 1;
          continue;
        }
        if (nomeInSospeso) {
          // un nome senza quantità seguito da "- ...": era il titolo di un piatto composto
          if (/^[-•]\s/.test(r)) chiudiNome();
          else { nomeInSospeso += " " + r; continue; }  // nome andato a capo
        }
        nomeInSospeso = r;
      }
      chiudiNome();
      pasti.sort((a, b) => ORDINE.indexOf(a.pasto) - ORDINE.indexOf(b.pasto));
      giorni[g] = pasti;
    }
    giorni.forEach((x, i) => { if (!x) avvisi.push(`${GIORNI[i]}: pagina del giorno non trovata`); });
    return { persona, giorni, avvisi };
  }

  // capisce di chi è il PDF dal nome scritto in testa
  function chiDalNome(nome) {
    const n = (nome || "").toLowerCase();
    if (/valeria|vale\b|pasquetti/.test(n)) return "vale";
    if (/massimo|max\b|autiero/.test(n)) return "max";
    return null;
  }

  /* unisce i piani di Max e Vale (uno dei due può mancare) nel formato di piano.json */
  function unisci(pMax, pVale, inizio, fonte) {
    const settimana = [];
    for (let g = 0; g < 7; g++) {
      const pasti = [];
      for (const nomeP of ORDINE) {
        const a = pMax && pMax.giorni[g] ? pMax.giorni[g].find((x) => x.pasto === nomeP) : null;
        const b = pVale && pVale.giorni[g] ? pVale.giorni[g].find((x) => x.pasto === nomeP) : null;
        if (!a && !b) continue;
        const voci = [];
        const trova = (nome, u) => voci.find((v) => v.nome === nome && v.u === u);
        for (const v of (a ? a.voci : [])) {
          const e = trova(v.nome, v.u);
          if (e) e.max = (e.max || 0) + v.q; else voci.push({ nome: v.nome, max: v.q, vale: null, u: v.u });
        }
        for (const v of (b ? b.voci : [])) {
          const e = trova(v.nome, v.u);
          if (e) e.vale = (e.vale || 0) + v.q; else voci.push({ nome: v.nome, max: null, vale: v.q, u: v.u });
        }
        const piatti = [...new Set([...(a ? a.piatti : []), ...(b ? b.piatti : [])])];
        // pasto libero solo se lo è per tutti e due (o per l'unico presente)
        const libero = (!a || a.libero) && (!b || b.libero) && !voci.length;
        pasti.push({ pasto: nomeP, libero, piatti, voci });
      }
      settimana.push(pasti);
    }
    return { inizio, fonte, settimane: [settimana], extra: [], categorie: {} };
  }

  /* dagli elementi di testo di pdf.js (getTextContent().items) alle righe.
     Nella tabella del giorno alimento, quantità e codice stanno sulla stessa altezza ma in
     colonne diverse: ogni elemento diventa una riga, come le celle della tabella.
     Si uniscono solo i pezzi attaccati (stessa riga, nessuno spazio fra l'uno e l'altro). */
  function righeDaPdfjs(items) {
    const righe = [];
    let cur = "", fine = null, y = null;
    for (const it of items) {
      if (!it.str || !it.str.trim()) { if (it.hasEOL && cur) { righe.push(cur); cur = ""; } continue; }
      const x = it.transform ? it.transform[4] : null;
      const yy = it.transform ? it.transform[5] : null;
      const attaccato = cur && x !== null && fine !== null && Math.abs(yy - y) < 2 && x - fine < 1.5;
      if (cur && !attaccato) { righe.push(cur); cur = ""; }
      cur += it.str;
      fine = x !== null ? x + (it.width || 0) : null;
      y = yy;
      if (it.hasEOL) { righe.push(cur); cur = ""; }
    }
    if (cur) righe.push(cur);
    return righe.map((r) => r.trim()).filter(Boolean);
  }

  return { leggiPersona, chiDalNome, unisci, quantita, pulisciNome, righeDaPdfjs };
});
