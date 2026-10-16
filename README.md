# CheManca?

Web app per Max e Vale: frigo e dispensa, piano dieta dei prossimi 3 giorni, lista della spesa condivisa e avvisi su Telegram o WhatsApp quando manca qualcosa.
Funziona su Android, iPhone e computer: si apre nel browser e si installa sulla schermata Home come un'app.

## Provarla subito sul PC

```
cd dispensa-smart
python -m http.server 8765
```
Apri `http://localhost:8765`, poi Impostazioni (l'ingranaggio) › **Carica dati di esempio**.

- Per fingere un'altra data: `http://localhost:8765/?oggi=2026-10-14&ora=9`.
- Senza Supabase i dati restano solo su quel browser (in alto c'è scritto «Solo qui»).

## Metterla online (circa 20 minuti, tutto gratis)

### 1. Supabase, il database condiviso fra i due telefoni
Va bene anche lo stesso account di Fanta Mondiale.
1. Su supabase.com crea un nuovo progetto (**New project**).
2. Apri **SQL Editor**, incolla tutto `schema.sql` e premi **Run**.

### 2. I due valori da copiare
Su Supabase apri **Project Settings › API** e copia il **Project URL** e la chiave **anon public**.
Incollali in `config.js`, oppure nell'app da Impostazioni › Dati condivisi.

### 3. GitHub Pages, l'indirizzo dell'app
1. Crea un repository su GitHub (per esempio `dispensa-smart`) e caricaci **tutti i file della cartella**, compresa `.github/`.
2. Apri **Settings › Pages**, scegli Source = *Deploy from a branch* e Branch = `main` / root.
3. Dopo un minuto l'app è su `https://<tuo-utente>.github.io/dispensa-smart/`. Scrivi questo indirizzo in `APP_URL` dentro `config.js`.

La fotocamera funziona solo in https: su GitHub Pages va, aprendo il file direttamente dal PC no.

### 4. Installarla sui telefoni
- **Android (Chrome):** menu ⋮ › *Aggiungi a schermata Home*.
- **iPhone (Safari):** tasto Condividi › *Aggiungi alla schermata Home*.

Al primo avvio ciascuno sceglie chi è: Max o Vale.

## Avvisi su Telegram: serve un server acceso?

**No.** Gli avvisi partono in due modi, e nessuno dei due richiede un computer sempre acceso:

1. **Dall'app, subito.** Quando un telefono vede che manca qualcosa per oggi o domani, manda il messaggio. Se ci sono due telefoni, lo manda uno solo: la tabella `avvisi` evita i doppioni.
2. **Da GitHub Actions, a orari fissi.** Il file `.github/workflows/avvisi.yml` fa girare `avvisi.mjs` sui computer di GitHub, gratis:
   - verso le **7:15** manda cosa serve per oggi e domani;
   - verso le **17:15** manda il riepilogo dei 3 giorni;
   - nello stesso momento aggiorna la lista della spesa, anche se nessuno apre l'app.

### Come attivarli
1. Su Telegram scrivi a **@BotFather** il comando `/newbot` e copia il **token**. In alternativa usa un tuo bot che hai già.
2. Crea un gruppo con Vale, aggiungi il bot e scrivi un messaggio qualsiasi nel gruppo.
3. Nell'app apri Impostazioni › Avvisi su Telegram, incolla il token e premi **Trova il gruppo**, poi **Messaggio di prova**. Ripeti sul telefono di Vale solo se vuoi che anche il suo telefono possa mandare avvisi.
4. Per gli avvisi a orari fissi, su GitHub apri **Settings › Secrets and variables › Actions** e aggiungi:
   - `SUPABASE_URL` e `SUPABASE_ANON`;
   - `TELEGRAM_TOKEN` e `TELEGRAM_CHAT`, cioè il numero del gruppo che compare nell'app, di solito comincia con `-100`;
   - `APP_URL`, facoltativo.
5. Per provare subito: scheda **Actions › Avvisi dispensa › Run workflow**.

**Attenzione:** GitHub sospende i controlli automatici di un repository che non viene modificato da 60 giorni e manda una mail. Basta premere *Enable* oppure caricare un file nuovo, per esempio il piano del mese.

Il token di Telegram non va mai in `config.js`, perché quel file è pubblico. Sta solo nei telefoni e nei Secrets di GitHub.

## WhatsApp

WhatsApp non ha un bot gratuito come Telegram. Ci sono tre strade:

| Modo | Come funziona | Pro e contro |
|---|---|---|
| **Tasto «Manda su WhatsApp»** (già nell'app, scheda Spesa) | Apre WhatsApp con la lista già scritta, tu scegli a chi mandarla | Gratis e ufficiale, ma va premuto a mano |
| **CallMeBot** (già nell'app e in `avvisi.mjs`) | Servizio gratuito: ognuno manda una volta un messaggio di attivazione e riceve una chiave | Automatico, ma non è un servizio di Meta e a volte va lento |
| WhatsApp Business Cloud API | Il bot ufficiale di Meta | Serve un account business verificato, un numero dedicato e modelli di messaggio approvati: troppo per due persone |

**Consiglio:** Telegram per gli avvisi automatici, il tasto WhatsApp per mandare la lista a qualcun altro.

Per attivare CallMeBot inserisci numeri e chiavi in Impostazioni › Avvisi su WhatsApp. Per gli avvisi a orari fissi aggiungi anche questi Secrets su GitHub: `CALLMEBOT_MAX_TEL`, `CALLMEBOT_MAX_KEY`, `CALLMEBOT_VALE_TEL`, `CALLMEBOT_VALE_KEY`.

## Cambiare dieta

Da Impostazioni › Piano dieta:

- **Nuova dieta dai PDF della dietista.** Scegli insieme i due PDF «Dieta a menu giornaliero» (Progeo):
  - l'app legge le pagine «Piano alimentare - Lunedì … Domenica» e unisce le dosi di Max e Vale pasto per pasto;
  - mostra un'anteprima della settimana e chiede da che giorno parte (di solito il lunedì dopo);
  - fino a quel giorno resta valido il piano vecchio, poi la settimana si ripete.
- **Carica un piano.json (4 settimane).** Serve per la rotazione con le alternative ufficiali, come quella del 2° mese:
  - la generi sul PC con `python esporta_piano.py`, che prende l'ultimo «N° MESE/genera_piano.py»;
  - poi carichi il `piano.json` dall'app, oppure lo carichi su GitHub al posto di quello vecchio.
- **Svuota piano.** L'app smette di calcolare cosa manca finché non carichi una nuova dieta. Frigo, dispensa e spesa restano.
- **Piano pubblicato.** Torna al `piano.json` che sta su GitHub.

Il piano caricato dall'app sta nel database, quindi vale subito su tutti e due i telefoni e per gli avvisi automatici.

## Come si usa

- **Codice a barre:** il tasto verde al centro apre la fotocamera.
  - Il nome del prodotto arriva da Open Food Facts; tu scegli a quale voce del piano corrisponde, per esempio «Ricotta di vacca».
  - L'app se lo ricorda: la volta dopo il prodotto compare in «Già scansionati» e basta un tap.
- **Senza codice** (frutta, verdura, pesce e carne al banco, pane):
  - ogni tap su un prodotto aggiunge un pezzo, oppure un etto;
  - alla fine premi «Rivedi e salva» e per ogni prodotto scegli Frigo o Dispensa;
  - con «+ Nuovo» aggiungi all'elenco nomi tuoi, per esempio «Zucchine romanesche», da contare come «Verdura di stagione»;
  - il punto rosso indica cosa serve al piano.
- **Dopo ogni pasto** premi «Fatto» (o «Altro»: solo Max, solo Vale, saltato). Le dosi del piano escono da frigo e dispensa, e si può annullare.
  Questo passaggio tiene giusto l'inventario: la fotocamera vede cosa entra in casa, non cosa mangiate.
- **Spesa:** le voci dal piano compaiono e spariscono da sole. «Lo prendo io» dice all'altro chi la compra; spunta quello che hai preso e poi premi «Metti in casa».

## I file

| File | Cosa fa |
|---|---|
| `index.html`, `style.css`, `app.js` | L'app |
| `logica.js` | Il calcolo di cosa manca. È lo stesso nell'app e negli avvisi automatici |
| `catalogo.js` | I prodotti senza codice a barre |
| `importa_pdf.js` | La lettura dei PDF della dietista |
| `piano.json` + `esporta_piano.py` | Il piano a 4 settimane generato da `genera_piano.py` |
| `avvisi.mjs` + `.github/workflows/avvisi.yml` | Gli avvisi a orari fissi |
| `schema.sql` | Le tabelle di Supabase |
| `sw.js`, `manifest.webmanifest`, icone | Installazione e uso senza rete |
