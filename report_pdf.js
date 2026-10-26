/* CheManca? - report locale: griglia settimanale e PDF condivisibile. Nessun dato inviato a servizi PDF. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CheMancaReport=factory();})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const date=s=>new Date(Number(s.slice(0,4)),Number(s.slice(5,7))-1,Number(s.slice(8,10)));
  const piu=(s,n)=>{const d=date(s);d.setDate(d.getDate()+n);return iso(d);};
  const lunedi=s=>{const d=date(s);return piu(s,-((d.getDay()+6)%7));};
  const breve=s=>s.slice(8,10)+'/'+s.slice(5,7);
  const giorni=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
  const ordine=['Colazione','Metà mattina','Pranzo','Merenda','Cena','Fuori pasto'];
  const pulisci=s=>String(s??'').replace(/[–—−]/g,'-').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/…/g,'...').replace(/[^\x09\x0A\x0D\x20-\xFF]/g,'?');
  function righePasto(p){
    const out=[];
    if(p.stato==='saltato')out.push('Saltato');
    if(p.libero)out.push('Pasto libero');
    if(p.piatti?.length)out.push(p.piatti.join(', '));
    if(!p.libero && p.stato!=='saltato')out.push(...(p.cibi||[]));
    if(p.nota)out.push('Nota: '+p.nota);
    return out.length?out:['Nessun alimento registrato'];
  }
  function settimane(rep){
    const map=new Map();
    for(const g of rep.giorni||[]){
      const pasti=g.pasti.filter(p=>!p.fitness);if(!pasti.length)continue;
      const dal=lunedi(g.data);
      if(!map.has(dal))map.set(dal,{dal,giorni:Array.from({length:7},(_,i)=>{const data=piu(dal,i);return{data,nome:giorni[i],fuori:data<rep.da||data>rep.a,pasti:[]};})});
      map.get(dal).giorni.find(d=>d.data===g.data).pasti.push(...pasti);
    }
    return [...map.values()].sort((a,b)=>a.dal.localeCompare(b.dal)).map(s=>{
      const nomi=[...new Set(s.giorni.flatMap(g=>g.pasti.map(p=>p.pasto)))];
      s.righe=nomi.sort((a,b)=>{const ia=ordine.indexOf(a),ib=ordine.indexOf(b);return(ia<0?99:ia)-(ib<0?99:ib);}).map(pasto=>({pasto,titolo:pasto==='Fuori pasto'?'Condimenti / Fuori pasto':pasto,celle:s.giorni.map(g=>g.fuori?['Fuori periodo']:g.pasti.filter(p=>p.pasto===pasto).flatMap(righePasto))}));
      return s;
    });
  }
  async function crea(rep,persone,op={}){
    const lib=op.pdfLib||(typeof window!=='undefined'?window.PDFLib:null);
    if(!lib)throw Error('Modulo PDF non disponibile. Aggiorna l’app oppure usa Stampa o salva PDF.');
    const {PDFDocument,StandardFonts,rgb}=lib,doc=await PDFDocument.create();
    const font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
    const W=841.89,H=595.28,M=30,verde=rgb(.12,.38,.27),ink=rgb(.10,.14,.12),muted=rgb(.34,.39,.36),line=rgb(.79,.83,.80);
    let pagina,y;
    const nome=id=>persone.find(p=>p.id===id)?.nome||id;
    const numero=n=>Number(n).toLocaleString('it-IT',{maximumFractionDigits:2});
    const titolo='Diario alimentare - '+(rep.persona==='tutti'?persone.map(p=>p.nome).join(', '):nome(rep.persona));
    const testo=(t,x,yy,size=10,grassetto=false,colore=ink)=>pagina.drawText(pulisci(t),{x,y:yy,size,font:grassetto?bold:font,color:colore});
    function righe(t,width,size=10,grassetto=false){
      const f=grassetto?bold:font,out=[];
      for(const par of pulisci(t).split('\n')){
        let r='';for(const parola of par.split(/\s+/)){
          const n=r?r+' '+parola:parola;
          if(f.widthOfTextAtSize(n,size)<=width){r=n;continue;}
          if(r){out.push(r);r='';}
          if(f.widthOfTextAtSize(parola,size)<=width){r=parola;continue;}
          for(const ch of parola){if(f.widthOfTextAtSize(r+ch,size)>width){out.push(r);r='';}r+=ch;}
        }out.push(r);
      }return out;
    }
    function nuova(t=titolo){pagina=doc.addPage([W,H]);y=H-M;testo('CheManca?',M,y,10,true,verde);y-=25;for(const r of righe(t,W-2*M,19,true)){testo(r,M,y,19,true);y-=22;}testo('Periodo '+breve(rep.da)+'/'+rep.da.slice(0,4)+' - '+breve(rep.a)+'/'+rep.a.slice(0,4),M,y,10,false,muted);y-=24;}
    function spazio(h){if(y-h<M+18)nuova();}
    function par(t,size=10,grassetto=false,colore=ink){for(const r of righe(t,W-2*M,size,grassetto)){spazio(size+5);testo(r,M,y,size,grassetto,colore);y-=size+5;}y-=4;}
    function sezione(t){spazio(40);y-=10;par(t,14,true,verde);}
    nuova();sezione('Peso e andamento');
    const ids=rep.persona==='tutti'?persone.map(p=>p.id):[rep.persona];
    for(const id of ids){const p=rep.pesi.find(p=>p.id===id);sezione(nome(id));
      if(!p?.pesate.length){par('Nessuna pesata nel periodo.'+(p?.prima?' Ultima disponibile: '+numero(p.prima.kg)+' kg del '+breve(p.prima.data)+'.':''),10,false,muted);continue;}
      par(p.pesate.map(x=>numero(x.kg)+' kg del '+breve(x.data)).join(' · '));
      const ultimo=p.pesate[p.pesate.length-1],base=p.prima||p.pesate[0];
      par(base!==ultimo?'Variazione: '+numero(ultimo.kg-base.kg)+' kg dal '+breve(base.data)+' al '+breve(ultimo.data):'Serve una seconda pesata per mostrare la variazione.',10,false,muted);
      const punti=[...(p.prima?[p.prima]:[]),...p.pesate];
      if(punti.length>1){spazio(140);const left=M+30,top=y-5,cw=330,ch=90,vals=punti.map(x=>Number(x.kg)),lo=Math.min(...vals)-.5,hi=Math.max(...vals)+.5,t0=date(punti[0].data).getTime(),t1=date(punti[punti.length-1].data).getTime();const X=x=>left+(t1===t0?cw/2:(date(x.data).getTime()-t0)/(t1-t0)*cw),Y=x=>top-ch+(Number(x.kg)-lo)/(hi-lo)*ch;
        for(let i=0;i<3;i++){const v=lo+(hi-lo)*i/2,yy=top-ch+ch*i/2;pagina.drawLine({start:{x:left,y:yy},end:{x:left+cw,y:yy},color:line,thickness:.5});testo(numero(v),M,yy-3,8,false,muted);}
        const fineRighe=[];for(let i=0;i<punti.length;i++){const p=punti[i],x=X(p),yy=Y(p);if(i)pagina.drawLine({start:{x:X(punti[i-1]),y:Y(punti[i-1])},end:{x,y:yy},color:verde,thickness:1.6});pagina.drawCircle({x,y:yy,size:2.5,color:verde});let r=fineRighe.findIndex(a=>x-a>=30);if(r<0)r=fineRighe.length;fineRighe[r]=x;testo(breve(p.data),Math.max(M,x-10),top-ch-15-r*11,7,false,muted);}
        y=top-ch-28-Math.max(0,fineRighe.length-1)*11;
      }
    }
    sezione('Pasti liberi, modifiche e note');const speciali=rep.giorni.flatMap(g=>g.pasti.filter(p=>!p.fitness&&(p.libero||p.nota||p.cambiato)).map(p=>({...p,data:g.data})));
    if(!speciali.length)par('Nessun pasto libero, cambio o nota registrato nel periodo.',10,false,muted);
    for(const p of speciali){par(breve(p.data)+' - '+p.pasto,11,true);par((p.libero?'Pasto libero':p.piatti.join(', ')||p.cibi.join(' · '))+(p.nota?'\n'+p.nota:''));}
    sezione('Attività fisica');par(rep.attivita+' attività - durata complessiva: '+Math.floor(rep.minuti/60)+' h '+(rep.minuti%60)+' min');const att=rep.giorni.flatMap(g=>g.pasti.filter(p=>p.fitness).map(p=>({...p,data:g.data})));
    if(!att.length)par('Nessuna attività registrata nel periodo.',10,false,muted);
    for(const f of att){par(breve(f.data)+' - '+f.stato,11,true);par(f.cibi.join(' · '));}
    const weeks=settimane(rep),lw=66,cw=(W-2*M-lw)/7,fs=7.3,leading=9.3,pad=5;
    if(!weeks.length){sezione('Pasti registrati');par('Nessun pasto registrato nel periodo.');}
    for(const week of weeks){
      let continua=false;
      const testa=()=>{nuova('Settimana '+breve(week.dal)+' - '+breve(piu(week.dal,6))+(continua?' (segue)':''));par(titolo,10,true);for(let i=0;i<8;i++){const x=M+(i?lw+(i-1)*cw:0),w=i?cw:lw;pagina.drawRectangle({x,y:y-29,width:w,height:29,color:verde});if(!i)testo('PASTO',x+5,y-18,8,true,rgb(1,1,1));else{testo(week.giorni[i-1].nome,x+5,y-11,8,true,rgb(1,1,1));testo(breve(week.giorni[i-1].data),x+5,y-22,8,false,rgb(1,1,1));}}y-=29;};
      testa();
      for(const row of week.righe){const celle=row.celle.map(c=>righe(c.length?c.join('\n'):'-',cw-2*pad,fs));const label=righe(row.titolo,lw-2*pad,8,true);const n=Math.max(...celle.map(c=>c.length),label.length);let offset=0;
        while(offset<n){let cap=Math.floor((y-M-20-2*pad)/leading);if(cap<Math.min(n-offset,4)){continua=true;testa();cap=Math.floor((y-M-20-2*pad)/leading);}const take=Math.min(n-offset,cap),h=Math.max(take*leading+2*pad,30);for(let i=0;i<8;i++){const x=M+(i?lw+(i-1)*cw:0),w=i?cw:lw,fuori=i&&week.giorni[i-1].fuori;pagina.drawRectangle({x,y:y-h,width:w,height:h,borderColor:line,borderWidth:.5,color:i?(fuori?rgb(.94,.94,.94):rgb(1,1,1)):rgb(.92,.95,.93)});const lines=i?celle[i-1].slice(offset,offset+take):offset?righe(row.titolo+' (segue)',lw-2*pad,8,true):label;for(let j=0;j<lines.length;j++)testo(lines[j],x+pad,y-pad-(j+1)*leading,i?fs:8,!i,fuori?muted:ink);}y-=h;offset+=take;if(offset<n){continua=true;testa();}}
      }
      y-=15;par('Sono riportati solo i pasti registrati nel periodo. Celle con "-": nessun pasto registrato.',8,false,muted);
    }
    const pages=doc.getPages();for(let i=0;i<pages.length;i++){pagina=pages[i];testo('CheManca? - Generato il '+new Date().toLocaleDateString('it-IT'),M,16,8,false,muted);testo((i+1)+' / '+pages.length,W-M-40,16,8,false,muted);}
    doc.setTitle(titolo);doc.setAuthor('CheManca?');return doc.save();
  }
  return {settimane,righePasto,crea};
});
