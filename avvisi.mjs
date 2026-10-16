// Controllo automatico di CheManca?: gira su GitHub Actions due volte al giorno,
// senza nessun server acceso. Legge frigo, dispensa e piano da Supabase, allinea la lista
// della spesa e manda il riepilogo su Telegram (e WhatsApp via CallMeBot, se configurato).
//
//   node avvisi.mjs                    -> controlla e, se è l'ora giusta, spedisce
//   node avvisi.mjs --forza sera       -> spedisce subito il riepilogo serale
//   node avvisi.mjs --prova backup.json -> legge una copia scaricata dall'app e stampa il messaggio
//
// Variabili d'ambiente (su GitHub: Settings > Secrets and variables > Actions):
//   SUPABASE_URL, SUPABASE_ANON, TELEGRAM_TOKEN, TELEGRAM_CHAT, APP_URL (facoltativo)
//   CALLMEBOT_MAX_TEL, CALLMEBOT_MAX_KEY, CALLMEBOT_VALE_TEL, CALLMEBOT_VALE_KEY (facoltativi)
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const L = require("./logica.js");
const env = process.env;
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] || true : null; };

// ora e data italiane, qualunque sia il fuso del server
function adessoRoma() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false,
  }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { oggi: `${p.year}-${p.month}-${p.day}`, ora: Number(p.hour) };
}

/* ---------- Supabase via REST (niente librerie) ---------- */
const rest = (t, q = "") => `${env.SUPABASE_URL}/rest/v1/${t}${q}`;
const testate = () => ({ apikey: env.SUPABASE_ANON, Authorization: `Bearer ${env.SUPABASE_ANON}`, "Content-Type": "application/json" });
async function leggi(t) {
  const r = await fetch(rest(t, "?select=*"), { headers: testate() });
  if (!r.ok) throw new Error(`${t}: ${r.status} ${await r.text()}`);
  return r.json();
}
async function scrivi(t, righe, metodo = "POST", q = "") {
  const r = await fetch(rest(t, q), {
    method: metodo, headers: { ...testate(), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(righe),
  });
  if (!r.ok) throw new Error(`${t}: ${r.status} ${await r.text()}`);
}
// inserisce solo se non c'è: false se l'avviso l'aveva già mandato qualcun altro
async function prenota(id) {
  const r = await fetch(rest("avvisi"), {
    method: "POST", headers: { ...testate(), Prefer: "return=minimal" },
    body: JSON.stringify({ id, inviato: new Date().toISOString(), da: "automatico" }),
  });
  if (r.status === 409) return false;
  if (!r.ok) throw new Error(`avvisi: ${r.status} ${await r.text()}`);
  return true;
}

/* ---------- invio ---------- */
async function telegram(html) {
  if (!env.TELEGRAM_TOKEN || !env.TELEGRAM_CHAT) return console.log("Telegram non configurato");
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT, text: html, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  const j = await r.json();
  if (!j.ok) throw new Error("Telegram: " + j.description);
  console.log("Telegram: inviato");
}
async function whatsapp(testo) {
  for (const chi of ["MAX", "VALE"]) {
    const tel = env[`CALLMEBOT_${chi}_TEL`], key = env[`CALLMEBOT_${chi}_KEY`];
    if (!tel || !key) continue;
    const r = await fetch(`https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(tel)}&text=${encodeURIComponent(testo)}&apikey=${encodeURIComponent(key)}`);
    console.log(`WhatsApp ${chi}: ${r.status}`);
  }
}

async function main() {
  const { oggi, ora } = adessoRoma();
  const prova = arg("--prova");
  const forza = arg("--forza");
  let db, pianoFile;
  try { pianoFile = JSON.parse(readFileSync(new URL("./piano.json", import.meta.url), "utf8")); } catch { pianoFile = null; }

  if (prova) db = JSON.parse(readFileSync(prova, "utf8"));
  else {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON) throw new Error("Mancano SUPABASE_URL e SUPABASE_ANON");
    db = {};
    for (const t of ["inventario", "spesa", "pasti", "avvisi", "piano"]) db[t] = await leggi(t);
  }

  // stesso piano dell'app: quello caricato nel database vince su piano.json
  const riga = (db.piano || []).find((x) => x.id === "attuale");
  const piano = riga ? riga.dati : pianoFile;
  if (!piano) return console.log("Nessun piano in uso: niente da controllare.");
  if (!Object.keys(piano.categorie || {}).length && pianoFile) piano.categorie = pianoFile.categorie;

  const stati = Object.fromEntries((db.pasti || []).map((p) => [p.id, p]));
  const calc = L.calcolaMancanze(piano, db.inventario || [], stati, oggi, 3, ora);
  console.log(`${oggi} ore ${ora}: ${calc.pronte}/${calc.totaleVoci} pronti, ${calc.mancanze.length} da comprare`);

  // la lista della spesa si aggiorna anche se nessuno apre l'app
  if (!prova) {
    const ops = L.allineaSpesa(db.spesa || [], calc.mancanze, oggi);
    const nuove = ops.inserisci.map((r) => ({ ...r, id: "piano:" + r.voce, creato: new Date().toISOString() }));
    if (nuove.length) await scrivi("spesa", nuove);
    for (const r of ops.aggiorna) await scrivi("spesa", r, "PATCH", `?id=eq.${encodeURIComponent(r.id)}`);
    for (const id of ops.elimina) await scrivi("spesa", null, "DELETE", `?id=eq.${encodeURIComponent(id)}`);
    console.log(`Spesa: +${nuove.length} ~${ops.aggiorna.length} -${ops.elimina.length}`);
  }

  // mattina 7-11: solo ciò che serve oggi e domani · sera 17-23: il riepilogo dei 3 giorni
  const turno = forza === "mattina" || forza === "sera" ? forza : ora >= 7 && ora < 11 ? "mattina" : ora >= 17 && ora < 23 ? "sera" : null;
  if (!turno) return console.log("Fuori dagli orari degli avvisi.");
  const html = L.testoAvviso(calc.mancanze, oggi, {
    titolo: turno === "mattina" ? "Buongiorno · da prendere oggi" : "CheManca? · prossimi 3 giorni",
    soloUrgenti: turno === "mattina", link: env.APP_URL,
  });
  if (!html) return console.log("Non manca niente: nessun messaggio.");
  if (prova) return console.log("\n--- messaggio ---\n" + L.testoSemplice(html));
  if (!forza && !(await prenota(`${turno}:${oggi}`))) return console.log(`Riepilogo di ${turno} già inviato.`);
  await telegram(html);
  await whatsapp(L.testoSemplice(html));
}

main().catch((e) => { console.error(e); process.exit(1); });
