/* CONFIGURAZIONE — i due valori di Supabase (vedi README, passo 2).
   Lasciati vuoti l'app funziona lo stesso, ma i dati restano solo sul telefono
   che li ha inseriti (modalità prova). Si possono anche incollare da Impostazioni.
   La chiave "anon" è pubblica per natura: NON mettere qui il token di Telegram. */
window.CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON: "",
  // indirizzo dell'app su GitHub Pages: va nei messaggi come link
  APP_URL: "",
  // per ora l'app lavora da sola: dati sul telefono, avvisi solo dentro l'app.
  // Mettere true quando si attivano Supabase (dati condivisi) e Telegram/WhatsApp.
  CONDIVISIONE: false,
  AVVISI_ESTERNI: false,
};
