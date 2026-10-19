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
  const SALTA = /^(alimento|quantità|alt\.?|\d{3}|\d{5})$/i;
  const CODICE = /^\d{4}$/;   // il codice della tabella "Alternative alimentari" (es. 2133)

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
    if (/^q\.?\s?b\.?$/i.test(a) || /^quantità libera$/i.test(a)) return { q: 0, u: "qb", righe: 1 };
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
      let codiceInSospeso = null;   // codice scritto dopo il titolo di un piatto composto
      let piattoCorrente = null;    // { titolo, alt } per le righe "- ..." che seguono
      let ultima = null;            // l'ultimo alimento letto: il codice che segue è suo
      const chiudiNome = () => {
        if (nomeInSospeso && pasto) {
          if (/^pasto libero$/i.test(nomeInSospeso)) pasto.libero = true;
          else {
            const titolo = nomeInSospeso.replace(/^[-•]\s*/, "");
            pasto.piatti.push(titolo);
            piattoCorrente = { titolo, alt: codiceInSospeso };
          }
        }
        nomeInSospeso = null;
        codiceInSospeso = null;
      };
      for (let i = iTit + 1; i < righe.length; i++) {
        const r = righe[i];
        if (/^elaborato da/i.test(r) || /^profilo nutrizionale/i.test(r)) break;
        if (SALTA.test(r)) continue;
        if (CODICE.test(r)) {
          if (nomeInSospeso) codiceInSospeso = r;
          else if (ultima) ultima.alt = r;
          continue;
        }
        const p = PASTI[r.toLowerCase()];
        if (p) {
          chiudiNome();
          piattoCorrente = null;
          ultima = null;
          pasto = pasti.find((x) => x.pasto === p);
          if (!pasto) { pasto = { pasto: p, libero: false, piatti: [], voci: [] }; pasti.push(pasto); }
          continue;
        }
        if (!pasto) continue;
        if (/^pasto libero$/i.test(r)) { chiudiNome(); pasto.libero = true; continue; }
        const q = quantita(r, righe[i + 1]);
        if (q) {
          if (nomeInSospeso) {
            const sub = /^[-•]\s/.test(nomeInSospeso);
            if (!sub) piattoCorrente = null;
            ultima = null;
            if (q.u !== "qb") {
              const v = { nome: pulisciNome(nomeInSospeso), q: q.q, u: q.u };
              if (sub && piattoCorrente) { v.piatto = piattoCorrente.titolo; if (piattoCorrente.alt) v.altPiatto = piattoCorrente.alt; }
              pasto.voci.push(v);
              ultima = v;
            }
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
        ultima = null;
      }
      chiudiNome();
      pasti.sort((a, b) => ORDINE.indexOf(a.pasto) - ORDINE.indexOf(b.pasto));
      giorni[g] = pasti;
    }
    giorni.forEach((x, i) => { if (!x) avvisi.push(`${GIORNI[i]}: pagina del giorno non trovata`); });
    return { persona, giorni, avvisi, alternative: leggiAlternative(pagine) };
  }

  /* le tabelle "Alternative alimentari": per ogni codice i cibi che possono sostituire quello
     del piano, con le loro quantità (una colonna per ogni grammatura di partenza).
     { "2133": { titolo, colonne, opzioni: [ { piatto: null | "Insalatona…", voci: [{nome, q:[…], u}] } ] } } */
  function leggiAlternative(pagine) {
    const tabelle = {};
    const righe = [];
    let dentro = false;
    for (const pg of pagine) {
      const rr = pg.map((r) => r.replace(/\s+/g, " ").trim()).filter(Boolean);
      if (!dentro && rr.some((r) => /^alternative alimentari$/i.test(r))) dentro = true;
      if (!dentro) continue;
      const fine = rr.findIndex((r) => /^unità di misura$/i.test(r));
      righe.push(...(fine >= 0 ? rr.slice(0, fine) : rr));
      if (fine >= 0) break;
    }
    let tab = null, opz = null, inSospeso = null, ultima = null;
    for (let i = 0; i < righe.length; i++) {
      const r = righe[i];
      if (/^(elaborato da|powered by|alternative alimentari)/i.test(r) || /^\d{1,3}$/.test(r)) continue;
      const m = r.match(/^(\d{4}):\s*(.*)$/);
      if (m) {
        tab = { codice: m[1], titolo: pulisciNome(m[2] || righe[i + 1] || ""), colonne: 1, opzioni: [] };
        tabelle[m[1]] = tab;
        if (!m[2]) i++;
        opz = null; inSospeso = null; ultima = null;
        continue;
      }
      if (!tab || /^alimento$/i.test(r)) continue;
      const mq = r.match(/^quantità\s*(\d+)$/i);
      if (mq) { tab.colonne = Math.max(tab.colonne, Number(mq[1])); continue; }
      const q = quantita(r, righe[i + 1]);
      if (q) {
        i += q.righe - 1;
        if (inSospeso) {
          const sub = /^[-•]\s/.test(inSospeso);
          const v = { nome: pulisciNome(inSospeso), q: [q.q], u: q.u };
          inSospeso = null;
          if (sub && opz) { if (q.u !== "qb") opz.voci.push(v); ultima = q.u !== "qb" ? v : null; }
          else { opz = null; tab.opzioni.push({ piatto: null, voci: [v] }); ultima = v; }
        } else if (ultima && q.u === ultima.u) ultima.q.push(q.q);   // la colonna "Quantità 2"
        continue;
      }
      if (inSospeso && /^[-•]\s/.test(r) && !/^[-•]\s/.test(inSospeso)) {
        // il nome di prima non aveva quantità: era il titolo di un piatto composto
        opz = { piatto: inSospeso, voci: [] };
        tab.opzioni.push(opz);
      } else if (inSospeso && !/^[-•]\s/.test(r)) { inSospeso += " " + r; continue; }
      inSospeso = r;
      ultima = null;
    }
    return tabelle;
  }

  /* ---------- alternative: le "caselle" di un pasto ----------
     Una casella è un alimento (o un piatto composto, come le insalatone) che nel piano ha un
     codice della tabella "Alternative alimentari". Per ogni persona di casa si trova la sua
     tabella e la colonna con la sua grammatura: le sostituzioni usano solo quelle quantità.
     Caffè, miele e olio (tazzine e cucchiaini) restano sempre come sono. */
  const FISSE = new Set(["tazzina", "cucchiaino", "cucchiaini"]);
  const nomeOpzione = (o) => o.piatto || (o.voci[0] && o.voci[0].nome) || "";
  const uguale = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
  const personeDi = (voci) => [...new Set(voci.flatMap((v) => Object.keys(v.q || {}).filter((id) => Number(v.q[id]) > 0)))];
  const qCol = (w, c) => (w.q[c] != null ? w.q[c] : w.q[0]);

  function caselle(p, alternative) {
    if (!p || p.libero || !alternative) return [];
    const out = [];
    const titoli = [...new Set(p.voci.filter((v) => v.piatto && v.altPiatto).map((v) => v.piatto))];
    for (const t of titoli) {
      const sub = p.voci.filter((v) => v.piatto === t);
      const ids = personeDi(sub);
      const per = {};
      for (const id of ids) {
        const codice = sub.map((v) => v.altPiatto && v.altPiatto[id]).find(Boolean);
        const tab = codice && alternative[id] && alternative[id][codice];
        if (!tab) continue;
        const rif = tab.opzioni.find((o) => o.piatto && uguale(o.piatto, t)) || tab.opzioni[0];
        const mie = sub.filter((v) => Number(v.q[id]) > 0);
        let c = -1;
        for (let k = 0; k < tab.colonne && c < 0; k++) {
          if (mie.every((v) => { const w = rif.voci.find((x) => uguale(x.nome, v.nome)); return w && Math.abs(qCol(w, k) - v.q[id]) < 0.01; })) c = k;
        }
        if (c >= 0) per[id] = { tab, c, codice, rif };
      }
      if (Object.keys(per).length) out.push({ chiave: "piatto:" + t, titolo: t, voci: sub, ids, per });
    }
    for (const v of p.voci) {
      if (v.piatto && v.altPiatto) continue;
      if (!v.alt || FISSE.has(v.u)) continue;
      const ids = personeDi([v]);
      const per = {};
      for (const id of ids) {
        const tab = v.alt[id] && alternative[id] && alternative[id][v.alt[id]];
        if (!tab) continue;
        const rif = tab.opzioni.find((o) => !o.piatto && o.voci[0] && uguale(o.voci[0].nome, v.nome)) || tab.opzioni[0];
        const w = rif && rif.voci[0];
        const c = w && w.u === v.u ? w.q.findIndex((x) => Math.abs(x - v.q[id]) < 0.01) : -1;
        if (c >= 0) per[id] = { tab, c, codice: v.alt[id], rif };
      }
      if (Object.keys(per).length) out.push({ chiave: "voce:" + v.nome, titolo: v.nome, voci: [v], ids, per });
    }
    return out;
  }

  /* le scelte possibili di una casella: tutte le alternative delle tabelle di casa, e per
     ogni persona cosa mangerebbe e quanto (null = non è nella sua tabella, resta il suo) */
  function opzioniCasella(cas) {
    const nomi = [];
    for (const x of Object.values(cas.per)) {
      for (const o of x.tab.opzioni) { const n = nomeOpzione(o); if (!nomi.some((y) => uguale(y, n))) nomi.push(n); }
    }
    return nomi.map((n) => ({
      nome: n,
      originale: uguale(n, cas.titolo),
      perPersona: Object.fromEntries(cas.ids.map((id) => {
        const x = cas.per[id];
        const o = x && x.tab.opzioni.find((y) => uguale(nomeOpzione(y), n));
        return [id, o ? o.voci.filter((w) => w.u !== "qb").map((w) => ({ nome: w.nome, q: qCol(w, x.c), u: w.u })) : null];
      })),
    }));
  }

  /* ricompone un pasto con le scelte fatte: scelte = { chiaveCasella: "Agnello" } (uguale
     per tutti) oppure { chiaveCasella: { idPersona: "Agnello" } }. Le caselle senza scelta
     e gli alimenti senza codice restano come nel piano. */
  function applicaScelte(p, alternative, scelte) {
    if (!p || p.libero) return p ? { ...p } : p;
    const cs = caselle(p, alternative);
    const voci = [];
    const piatti = [];
    const aggiungi = (nome, id, q, u, piatto) => {
      let e = voci.find((x) => x.nome === nome && x.u === u && (x.piatto || "") === (piatto || ""));
      if (!e) { e = { nome, q: {}, u }; if (piatto) e.piatto = piatto; voci.push(e); }
      e.q[id] = (e.q[id] || 0) + q;
    };
    // si tengono i codici: anche il pasto cambiato si può cambiare di nuovo
    const copia = (v, id) => {
      aggiungi(v.nome, id, v.q[id], v.u, v.piatto);
      const e = voci.find((x) => x.nome === v.nome && x.u === v.u && (x.piatto || "") === (v.piatto || ""));
      if (v.alt && v.alt[id]) (e.alt = e.alt || {})[id] = v.alt[id];
      if (v.altPiatto && v.altPiatto[id]) (e.altPiatto = e.altPiatto || {})[id] = v.altPiatto[id];
      if (v.piatto && !piatti.includes(v.piatto)) piatti.push(v.piatto);
    };
    const metti = (o, x, id) => {
      for (const w of o.voci) {
        if (w.u === "qb") continue;
        aggiungi(w.nome, id, qCol(w, x.c), w.u, o.piatto || null);
        const e = voci.find((y) => y.nome === w.nome && y.u === w.u && (y.piatto || "") === (o.piatto || ""));
        // il cibo nuovo tiene il codice della sua tabella: si può cambiare ancora
        if (o.piatto) (e.altPiatto = e.altPiatto || {})[id] = x.codice;
        else (e.alt = e.alt || {})[id] = x.codice;
      }
      if (o.piatto && !piatti.includes(o.piatto)) piatti.push(o.piatto);
    };
    const fatte = new Set();
    let cambiato = false;
    for (const v of p.voci) {
      const c = cs.find((x) => x.voci.includes(v));
      if (!c) { for (const id of personeDi([v])) copia(v, id); continue; }
      if (fatte.has(c)) continue;
      fatte.add(c);
      const sc = scelte && scelte[c.chiave];
      for (const id of c.ids) {
        const x = c.per[id];
        const nome = typeof sc === "string" ? sc : sc && sc[id];
        const o = nome && x && x.tab.opzioni.find((y) => uguale(nomeOpzione(y), nome));
        if (!o || uguale(nomeOpzione(o), c.titolo)) { c.voci.forEach((w) => { if (Number(w.q[id]) > 0) copia(w, id); }); continue; }
        metti(o, x, id);
        cambiato = true;
      }
    }
    return { pasto: p.pasto, libero: false, piatti, voci, cambiato };
  }

  /* la settimana alternativa: per ogni casella un'alternativa diversa dal cibo di partenza.
     Nei pasti di casa la stessa per tutti quando c'è in tutte le tabelle, altrimenti
     ognuno la sua; a parità vince quella usata meno nella settimana, così si varia. */
  function creaSettimana(base, alternative, rnd) {
    rnd = rnd || Math.random;
    const usi = {};
    const scegli = (chiave, insiemi, originale) => {
      let comuni = insiemi[0] || [];
      for (const s of insiemi.slice(1)) comuni = comuni.filter((n) => s.some((x) => uguale(x, n)));
      comuni = comuni.filter((n) => !uguale(n, originale));
      if (!comuni.length) return null;
      const u = (usi[chiave] = usi[chiave] || {});
      const minimo = Math.min(...comuni.map((n) => u[n] || 0));
      const pari = comuni.filter((n) => (u[n] || 0) === minimo);
      const scelta = pari[Math.floor(rnd() * pari.length)];
      u[scelta] = (u[scelta] || 0) + 1;
      return scelta;
    };
    return base.map((pasti) => pasti.map((p) => {
      if (p.libero) return { ...p };
      const scelte = {};
      for (const c of caselle(p, alternative)) {
        const lista = Object.values(c.per);
        const codice = lista[0].codice;
        const comune = scegli(codice, lista.map((x) => x.tab.opzioni.map(nomeOpzione)), c.titolo);
        if (comune) { scelte[c.chiave] = comune; continue; }
        const propria = {};
        for (const [id, x] of Object.entries(c.per)) propria[id] = scegli(codice + ":" + id, [x.tab.opzioni.map(nomeOpzione)], c.titolo);
        scelte[c.chiave] = propria;
      }
      const nuovo = applicaScelte(p, alternative, scelte);
      delete nuovo.cambiato;
      return nuovo;
    }));
  }

  /* di chi è il PDF: confronta il nome scritto in testa ("Valeria Pasquetti") con i nomi
     scelti nell'app ("Vale", "Max"). Restituisce l'id della persona o null. */
  function abbina(testo, persone) {
    const parole = String(testo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z]+/).filter((w) => w.length >= 2);
    let meglio = null, punti = 0;
    for (const p of persone || []) {
      const n = String(p.nome || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
      if (n.length < 2) continue;
      for (const w of parole) {
        const s = w === n ? 3 : w.startsWith(n) || n.startsWith(w) ? 2 : n.length >= 3 && w.slice(0, 3) === n.slice(0, 3) ? 1 : 0;
        if (s > punti) { punti = s; meglio = p.id; }
      }
    }
    return meglio;
  }

  /* unisce i piani delle persone di casa, pasto per pasto, nel formato dell'app:
     lista = [{ id, piano }] (piano = risultato di leggiPersona); ogni voce ha q = {id: quantità} */
  function unisci(lista, inizio, fonte) {
    const settimana = [];
    for (let g = 0; g < 7; g++) {
      const pasti = [];
      for (const nomeP of ORDINE) {
        const loro = lista.map((x) => ({ id: x.id, p: x.piano && x.piano.giorni[g] ? x.piano.giorni[g].find((y) => y.pasto === nomeP) : null }));
        if (!loro.some((x) => x.p)) continue;
        const voci = [];
        for (const { id, p } of loro) {
          for (const v of (p ? p.voci : [])) {
            let e = voci.find((x) => x.nome === v.nome && x.u === v.u && (x.piatto || "") === (v.piatto || ""));
            if (!e) { e = { nome: v.nome, q: {}, u: v.u }; if (v.piatto) e.piatto = v.piatto; voci.push(e); }
            e.q[id] = (e.q[id] || 0) + v.q;
            if (v.alt) (e.alt = e.alt || {})[id] = v.alt;
            if (v.altPiatto) (e.altPiatto = e.altPiatto || {})[id] = v.altPiatto;
          }
        }
        const piatti = [...new Set(loro.flatMap((x) => (x.p ? x.p.piatti : [])))];
        // pasto libero solo se lo è per tutti quelli che hanno quel pasto
        const libero = loro.every((x) => !x.p || x.p.libero) && !voci.length;
        pasti.push({ pasto: nomeP, libero, piatti, voci });
      }
      settimana.push(pasti);
    }
    const alternative = {};
    for (const x of lista) if (x.piano && x.piano.alternative && Object.keys(x.piano.alternative).length) alternative[x.id] = x.piano.alternative;
    return { inizio, lunedi: true, fonte, settimane: [settimana], extra: [], categorie: {}, alternative, fissate: {} };
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

  return { leggiPersona, leggiAlternative, creaSettimana, caselle, opzioniCasella, applicaScelte, abbina, unisci, quantita, pulisciNome, righeDaPdfjs };
});
