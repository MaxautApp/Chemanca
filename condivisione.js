/* CheManca? - archivio familiare: identità anonima autorizzata, revisioni e RPC. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CheMancaCloud=factory();})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const copia=x=>JSON.parse(JSON.stringify(x));
  const uguali=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
  function crea(o){
    const sb=o.client,storage=o.storage, uuid=o.uuid, online=o.online||(()=>true);
    let user=null,famiglia=null,rev=-1,db=null,channel=null,coda=Promise.resolve(),generazione=0,aggiorna=null;
    let stato={fase:'iniziale',messaggio:'Collegamento in corso',online:online()};
    const notifica=()=>o.onStato?.({...stato,userId:user?.id||null,famigliaId:famiglia});
    const fase=(f,m='')=>{stato={...stato,fase:f,messaggio:m,online:online()};notifica();};
    const accoda=fn=>{const r=coda.then(fn);coda=r.catch(()=>{});return r;};
    const chiave=()=>`cm_pendente:${o.progetto}:${user.id}:${famiglia}`;
    function connesso(){if(!online())throw Error('Serve la connessione per aggiornare i dati condivisi. Nessuna modifica salvata offline.');if(!user||!famiglia||!db)throw Error('Collega prima questo telefono alla famiglia');}
    function controllo(g){if(g!==generazione)throw Error('Accesso cambiato: riapri la famiglia');}
    function convalida(d){return o.valida(copia(d));}
    function pubblica(r){
      if(!r||!Number.isSafeInteger(Number(r.revisione))||Number(r.revisione)<0)throw Error('Revisione archivio non valida');
      const dati=convalida(r.dati);
      if(Number(r.revisione)>=rev){rev=Number(r.revisione);db=dati;}
      stato={...stato,online:true,ultimoSalvataggio:new Date().toISOString()};notifica();
    }
    async function leggi(){
      const g=generazione;
      const {data,error}=await sb.from('cm_famiglie').select('id,dati,revisione,nome').eq('id',famiglia).maybeSingle();controllo(g);
      if(error)throw error;
      if(!data){revoca('Questo telefono non è più autorizzato. Richiedi un nuovo collegamento.');throw Error('Accesso alla famiglia non disponibile');}
      pubblica(data);return copia(db);
    }
    function revoca(msg){
      generazione++;db=null;rev=-1;famiglia=null;
      if(channel){sb.removeChannel(channel);channel=null;}
      fase('non_collegato',msg);o.onRevoca?.();
    }
    async function invia(p){
      const g=generazione;
      const {data,error}=await sb.rpc('cm_salva_archivio',p);controllo(g);
      if(error){
        if(error.code==='40001'||error.code==='22023'){storage.removeItem(chiave());await leggi();o.onConflitto?.();const e=Error(error.code==='40001'?'Dati aggiornati dall’altro telefono. Controlla e ripeti la modifica.':'Richiesta non valida: controlla i dati e riprova.');e.code=error.code;throw e;}
        if(error.code==='42501'){storage.removeItem(chiave());revoca('Collegamento non più autorizzato');}
        throw error;
      }
      const r=Array.isArray(data)?data[0]:data;if(!r||!['salvato','gia_applicata'].includes(r.esito))throw Error('Risposta del salvataggio non valida');
      pubblica(r);storage.removeItem(chiave());return r;
    }
    async function risolviPendente(){
      const raw=storage.getItem(chiave());if(!raw)return;
      let p;try{p=JSON.parse(raw);}catch{throw Error('Richiesta in sospeso non leggibile: conserva un backup prima di intervenire');}
      if(p.p_famiglia_id!==famiglia)throw Error('La richiesta in sospeso appartiene a un’altra famiglia');
      await invia(p);o.onRecupero?.();return true;
    }
    async function transazioneInterna(fn){
      connesso();if(await risolviPendente())throw Error('Salvataggio precedente verificato. Riapri la funzione per una nuova modifica.');const attesa=rev,prima=await leggi();if(rev!==attesa){o.onConflitto?.();throw Error('La famiglia è stata aggiornata. Riapri la funzione e ripeti la modifica.');}const nuovo=copia(prima),risultato=fn(nuovo);
      if(risultato&&typeof risultato.then==='function')throw Error('La modifica deve essere sincrona');
      if(uguali(prima,nuovo))return {db:copia(db),risultato};
      convalida(nuovo);
      const p={p_famiglia_id:famiglia,p_revisione:rev,p_dati:nuovo,p_operazione_id:uuid()};
      // La stessa richiesta viene ritentata con lo stesso UUID dopo una risposta persa.
      storage.setItem(chiave(),JSON.stringify(p));
      try{await invia(p);}catch(e){stato={...stato,online:online(),messaggio:e.message||'Salvataggio da verificare'};notifica();throw e;}
      return {db:copia(db),risultato};
    }
    function guardia(t,ids,base,nuovo,campi){
      for(const id of ids){const a=base[t].find(x=>x.id===id),b=nuovo[t].find(x=>x.id===id);
        const stesso=campi?campi.every(k=>uguali(a?.[k],b?.[k])):uguali(a,b);
        if(!stesso){o.onConflitto?.();throw Error('Questa voce è stata modificata dall’altro telefono. Aggiorna la schermata e riprova.');}
      }
    }
    const api={
      tipo:'supabase',
      stato:()=>({...stato,userId:user?.id||null,famigliaId:famiglia,revisione:rev}),
      istantanea:()=>db?copia(db):null,
      async inizializza(){
        return accoda(async()=>{
          fase('iniziale','Controllo del collegamento');
          try{
            if(!online())throw Error('Collegati a Internet per aprire la famiglia');
            const {data,error}=await sb.auth.getSession();if(error)throw error;
            user=data.session?.user||null;
            if(!user){fase('senza_sessione');return false;}
            const g=generazione;
            const m=await sb.from('cm_membri').select('famiglia_id').eq('user_id',user.id).maybeSingle();controllo(g);
            if(m.error)throw m.error;
            if(!m.data){fase('non_collegato','Telefono in attesa di autorizzazione');return false;}
            famiglia=m.data.famiglia_id;
            try{await risolviPendente();}catch(e){if(!['40001','22023'].includes(e.code))throw e;}
            await leggi();fase('pronto');return true;
          }catch(e){fase('errore',e.message||'Collegamento non riuscito');return false;}
        });
      },
      async identifica(){
        // Verifica prima che la sessione possa essere conservata nel browser.
        storage.setItem('cm_verifica_storage','1');storage.removeItem('cm_verifica_storage');
        const {data:esistente}=await sb.auth.getSession();
        if(!esistente.session){const {error}=await sb.auth.signInAnonymously();if(error)throw Error('Non riesco a collegare il telefono. Verifica che Anonymous Sign-Ins sia attivo in Supabase. '+error.message);}
        return api.inizializza();
      },
      carica(){return accoda(async()=>{connesso();await risolviPendente();return leggi();});},
      transazione(fn){return accoda(()=>transazioneInterna(fn));},
      scrivi(t,righe){const base=copia(db);return api.transazione(n=>{guardia(t,righe.map(x=>x.id),base,n);for(const r of righe){const i=n[t].findIndex(x=>x.id===r.id);if(i<0)n[t].push(copia(r));else n[t][i]={...n[t][i],...copia(r)};}});},
      modifica(t,id,patch){const base=copia(db);return api.transazione(n=>{guardia(t,[id],base,n,Object.keys(patch));const r=n[t].find(x=>x.id===id);if(!r)throw Error('Voce non più presente');Object.assign(r,copia(patch));});},
      elimina(t,ids){const base=copia(db);return api.transazione(n=>{guardia(t,ids,base,n);n[t]=n[t].filter(x=>!ids.includes(x.id));});},
      async nuovo(t,r){const esito=await api.transazione(n=>{if(n[t].some(x=>x.id===r.id))return false;n[t].push(copia(r));return true;});return esito.risultato;},
      ripristina(dati){const base=copia(db);return api.transazione(n=>{if(!uguali(base,n))throw Error('La famiglia è stata aggiornata: ricontrolla prima del ripristino');const nuovo=convalida(dati);for(const t of o.tabelle)n[t]=nuovo[t];});},
      azzera(){const base=copia(db);return api.transazione(n=>{if(!uguali(base,n))throw Error('La famiglia è stata aggiornata: verifica prima di cancellare');for(const t of o.tabelle)n[t]=[];});},
      ascolta(cb){
        aggiorna=cb;if(channel||!famiglia)return;
        channel=sb.channel('cm-famiglia-'+famiglia).on('postgres_changes',{event:'UPDATE',schema:'public',table:'cm_famiglie',filter:'id=eq.'+famiglia},()=>{if(stato.fase==='pronto')cb();}).subscribe(s=>{stato={...stato,online:s==='SUBSCRIBED'};notifica();});
      },
      async esci(){
        await coda;const k=user&&famiglia?chiave():null;
        if(k&&storage.getItem(k))throw Error('Prima verifica il salvataggio in sospeso: usa Aggiorna famiglia');
        const {error}=await sb.auth.signOut({scope:'local'});if(error)throw error;
        user=null;revoca('Telefono scollegato. Al prossimo accesso occorrerà una nuova autorizzazione.');fase('senza_sessione');
      },
      notificaRete(){stato={...stato,online:online()};notifica();if(online()&&aggiorna)aggiorna();},
    };
    sb.auth.onAuthStateChange((evento,sessione)=>{
      if(evento==='SIGNED_OUT'||(user&&sessione?.user?.id&&sessione.user.id!==user.id)){
        const k=user&&famiglia?chiave():null;
        // Nessuna copia di consultazione è conservata; il ds_db locale non viene letto.
        if(k&&evento==='SIGNED_OUT')storage.removeItem(k);
        user=null;revoca('Sessione terminata: collega di nuovo il telefono');
      }
    });
    return api;
  }
  return {crea};
});
