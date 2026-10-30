/* Ricettario iniziale: preparazioni locali, senza invio della dieta a servizi AI. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CheMancaRicette=factory();})(typeof self!=='undefined'?self:this,function(){
'use strict';
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const fonti=[{"id": "navigenio", "url": "https://it.amc.info/cdn/shop/files/AMC_Navigenio_Istruzioni_per_l_uso.pdf?v=3607220084406006902", "bytes": 8573154, "sha256": "91133bc0c4590290806b26c1a0501a865d3b2fe4e83659035b608190b7fe81ac", "scaricato": "2026-10-30", "titolo": "AMC Navigenio · italiano pp. 20-28"}, {"id": "easyquick", "url": "https://it.amc.info/cdn/shop/files/AMC_EasyQuick_Istruzioni_per_l_uso.pdf?v=7819815371812950972", "bytes": 9833172, "sha256": "e273dd8f56de3448a54d42a478888c67c667b5130ed3c3b75f51637a5a8fb8e8", "scaricato": "2026-10-30", "titolo": "AMC EasyQuick · italiano pp. 20-28"}, {"id": "secuquick", "url": "https://it.amc.info/cdn/shop/files/AMC_Secuquick_softline_Istruzioni_per_l_uso_1.pdf?v=9962387921087541091", "bytes": 17650921, "sha256": "acaa8f798b1ff57ae1435ab889d12f42dd6e846aaf8337e0d320136ac723ae31", "scaricato": "2026-10-30", "titolo": "AMC Secuquick softline · italiano pp. 40-58"}, {"id": "audiotherm-a0024", "url": "https://it.amc.info/cdn/shop/files/AMC_Visiotherm-Audiotherm_GAL_ML_A0024.pdf?v=7155050978890285354", "bytes": 12537202, "sha256": "dbc17c4df363fe6ac7ae406d2171c1d8e0f6c3517d94a1e87c758d7fb5038ac1", "scaricato": "2026-10-30", "titolo": "AMC Audiotherm A0024 · italiano pp. 29-41"}, {"id": "audiotherm", "url": "https://it.amc.info/cdn/shop/files/AMC_Visiotherm_e_Audiotherm_Istruzioni_per_l_uso.pdf?v=7155050978890285354", "bytes": 12537202, "sha256": "dbc17c4df363fe6ac7ae406d2171c1d8e0f6c3517d94a1e87c758d7fb5038ac1", "scaricato": "2026-10-30", "titolo": "AMC Visiotherm e Audiotherm"}, {"id": "bimby-tm7", "url": "https://support-italia.vorwerk.com/hc/article_attachments/24845243353756", "bytes": 5113772, "sha256": "5793073ab992a4c4425acb0f8e8fbebba9223c6e66d4c68ab9840683664a9641", "scaricato": "2026-10-30", "titolo": "Bimby TM7 · italiano, cottura a vapore cap. 7.15"}, {"id": "temperature", "titolo": "Temperature minime al cuore · FoodSafety.gov", "url": "https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures"}];
function categoria(nome){const n=norm(nome);if(/vellutat|minestron|crema|ripien|impanat|affumicat|scatola|sottolio|surgelat/.test(n))return '';if(/insalata|lattuga|rucola|crackers|pane|formaggio|yogurt|frutta|avocado/.test(n))return '';if(/verdura di stagione|verdure di stagione|misto verdure/.test(n))return 'generica';if(/zucchin|carot|broccol|cavolfior|finocch|melanzan|peperon|zucca|fagiolin|patat/.test(n))return 'verdure';if(/salmone|merluzzo|nasello|orata|branzino|spigola|platessa|sogliola/.test(n))return 'pesce';if(/hamburger|macinat/.test(n))return 'hamburger';if(/petto di pollo|petto di tacchino/.test(n))return 'pollo';if(/pasta|spaghetti|penne|fusilli/.test(n))return 'pasta';if(/riso|risotto/.test(n))return 'riso';return '';}
const fmt=n=>Number(n.toFixed(2)).toLocaleString('it-IT');
function proponi(pasto,persone,ids,sistema,attrezzature,scelte={}){
 if(!pasto||pasto.libero||!ids.length||!['forno','amc','bimby'].includes(sistema))return [];
 if(sistema==='forno'&&attrezzature.forno===false)return [];
 const ingredienti=(pasto.voci||[]).map((v,i)=>{const nome=categoria(v.nome)==='generica'?scelte[i]||'':v.nome;const dosi=ids.map(id=>({id,nome:persone.find(p=>p.id===id)?.nome||id,q:Number(v.q?.[id]||0)})).filter(x=>x.q>0);return {origine:v.nome,nome,u:v.u,dosi,qty:dosi.reduce((a,b)=>a+b.q,0),categoria:categoria(nome),indice:i};}).filter(x=>x.qty>0&&x.categoria&&scelte['escludi'+x.indice]!==true);
 if(ingredienti.some(x=>x.categoria==='generica'))return [];
 const supported=sistema==='forno'?['verdure','pesce','hamburger','pollo','pasta']:['verdure'];
 const usati=ingredienti.filter(x=>supported.includes(x.categoria));if(!usati.length)return [];
 const verdure=usati.filter(x=>x.categoria==='verdure'),secondi=usati.filter(x=>['pesce','hamburger','pollo'].includes(x.categoria)),pasta=usati.filter(x=>x.categoria==='pasta');
 if(sistema!=='forno'&&!verdure.length)return [];
 if(sistema==='forno'&&!verdure.length&&!secondi.length)return [];
 if(sistema==='amc'&&!(attrezzature.easyquick&&attrezzature.navigenio&&attrezzature.inserto))return [];
 if(sistema==='bimby'&&!(attrezzature.tm7&&attrezzature.varoma))return [];
 if(sistema!=='forno'&&(verdure.some(x=>x.u!=='g')||verdure.reduce((n,x)=>n+x.qty,0)>600))return [];
 const passi=[],fontiUsate=[],extra=[];
 const elenco=usati.map(x=>`${x.nome}: ${fmt(x.qty)} ${x.u} (${x.dosi.map(d=>d.nome+' '+fmt(d.q)+' '+x.u).join(' · ')})`).join('\n');
 const acqua=sistema==='amc'?attrezzature.diametro==='20'?'120 ml':'150 ml':'500 g';
 if(sistema==='forno'){
  passi.push('Pesa separatamente le dosi a crudo per ogni persona. Tieni separate le porzioni che dovranno restare riconoscibili dopo la cottura.');
  if(verdure.length){passi.push('Lava e pulisci '+verdure.map(x=>x.nome).join(', ')+'. Taglia le verdure in pezzi uniformi di circa 1-2 cm; affetta finemente patate e carote. Stendile su una teglia, senza sovrapporle.');passi.push('Preriscalda il forno statico a 200 °C. Cuoci le verdure per circa 25-35 minuti, girandole a metà e controllando con una forchetta. I tempi sono indicativi: prolunga finché i pezzi più spessi risultano cotti.');}
  if(secondi.length){for(const x of secondi){const pesce=x.categoria==='pesce',pollo=x.categoria==='pollo';passi.push(pesce?'Sistema i filetti di '+x.nome+' in una teglia separata. Usa pesce scongelato e privato delle lische.':'Forma gli hamburger senza aggiungere pane, uova o formaggio, oppure disponi '+x.nome+' in pezzi di spessore uniforme su una teglia separata.');passi.push('Cuoci a 200 °C statico: '+(pesce?'indicativamente 15-25 minuti per filetti':pollo?'indicativamente 20-30 minuti per pezzi di petto':'indicativamente 15-25 minuti per hamburger')+'. Controlla con un termometro al cuore: almeno '+(pesce?'63':pollo?'74':'71')+' °C. Lo spessore conta più del timer.');}fontiUsate.push('temperature');}
  if(pasta.length){passi.push('Per la pasta serve anche una pentola sul fornello: porta a bollore acqua sufficiente, versa le quantità pesate e segui il tempo indicato sulla confezione. Scola e unisci alle verdure cotte, se presenti. Non versare pasta cruda nella teglia.');}
 }else if(sistema==='amc'){
  passi.push('Pesa le dosi a crudo per persona. Lava le verdure e tagliale in pezzi uniformi. Controlla che pentola, anello EasyQuick e inserto siano compatibili con il diametro selezionato.');
  passi.push('Versa almeno '+acqua+' di acqua nella pentola. Inserisci il cestello forato: l’acqua non deve raggiungere gli alimenti. Distribuisci le verdure senza comprimere e applica EasyQuick.');
  passi.push('Usa Navigenio in modalità manuale: scalda fino alla finestra vapore, poi riduci il calore in modo che l’indicatore rimanga nel settore vapore. Non usare Secuquick per questa preparazione.');
  passi.push('Il tempo dipende dalla verdura e dal taglio: consulta il tempo della preparazione AMC collegata sotto prima di avviare la cottura. Controlla la morbidezza e la presenza di liquido; togli EasyQuick tenendo il vapore lontano dal viso.');
  extra.push('Tempo specifico da verificare nella preparazione AMC: questa scheda guida il montaggio e la preparazione, ma non fornisce ancora un timer validato per ogni verdura.');fontiUsate.push('easyquick','navigenio');
 }else{
  passi.push('Pesa le dosi a crudo per ogni persona. Lava le verdure e tagliale in pezzi uniformi. Sistema il boccale correttamente sulla base.');
  passi.push('Versa almeno 500 g di acqua nel boccale. Applica il coperchio senza tappo e monta il Varoma completo. Disponi le verdure senza comprimerle, lasciando libere alcune fessure.');
  passi.push('Seleziona Cottura a vapore dal menu Modalità e segui il display. Il manuale illustra un’impostazione di base di 30 minuti con almeno 500 g d’acqua: non è il tempo specifico di tutte le verdure.');
  passi.push('Controlla il tempo per la verdura scelta in una ricetta compatibile TM7 su Cookidoo. Verifica la cottura prima di servire e apri il Varoma dirigendo il vapore lontano dal viso.');
  extra.push('Per il timer specifico della verdura usa una ricetta TM7 verificata. L’acqua tecnica non si scala in proporzione alle porzioni.');fontiUsate.push('bimby-tm7');
 }
 passi.push('Usa solo l’olio e i condimenti già previsti nel piano, senza aggiungerli automaticamente. Se sono indicati per tutta la giornata, considera quanto ne hai già utilizzato.');
 passi.push('Servi le porzioni personali preparate separatamente. Per un piatto mescolato, pesa le singole preparazioni prima di unirle: dosi diverse non equivalgono a porzioni uguali.');
 const resto=(pasto.voci||[]).filter((v,i)=>!usati.some(x=>x.indice===i)&&ids.some(id=>Number(v.q?.[id])>0)).map(v=>v.nome);
 const titolo=sistema==='forno'?(pasta.length&&verdure.length?'Pasta con verdure al forno':secondi.length?secondi.map(x=>x.nome).join(' e ')+' al forno'+(verdure.length?' con verdure':''):'Verdure al forno'):sistema==='amc'?'Verdure con EasyQuick':'Verdure al vapore con TM7';
 return [{baseId:sistema+'-base',titolo,ingredienti:elenco,passi,note:extra.join('\n'),resto,fonti:fontiUsate,sistema,personale:false}];
}
return {categoria,proponi,fonti};
});
