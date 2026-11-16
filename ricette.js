/* Ricettario iniziale: preparazioni locali, senza invio della dieta a servizi AI. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CheMancaRicette=factory();})(typeof self!=='undefined'?self:this,function(){
'use strict';
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const fonti=[{"id": "navigenio", "url": "https://it.amc.info/cdn/shop/files/AMC_Navigenio_Istruzioni_per_l_uso.pdf?v=3607220084406006902", "bytes": 8573154, "sha256": "91133bc0c4590290806b26c1a0501a865d3b2fe4e83659035b608190b7fe81ac", "scaricato": "2026-10-30", "titolo": "AMC Navigenio · italiano pp. 20-28"}, {"id": "easyquick", "url": "https://it.amc.info/cdn/shop/files/AMC_EasyQuick_Istruzioni_per_l_uso.pdf?v=7819815371812950972", "bytes": 9833172, "sha256": "e273dd8f56de3448a54d42a478888c67c667b5130ed3c3b75f51637a5a8fb8e8", "scaricato": "2026-10-30", "titolo": "AMC EasyQuick · italiano pp. 20-28"}, {"id": "secuquick", "url": "https://it.amc.info/cdn/shop/files/AMC_Secuquick_softline_Istruzioni_per_l_uso_1.pdf?v=9962387921087541091", "bytes": 17650921, "sha256": "acaa8f798b1ff57ae1435ab889d12f42dd6e846aaf8337e0d320136ac723ae31", "scaricato": "2026-10-30", "titolo": "AMC Secuquick softline · italiano pp. 40-58"}, {"id": "audiotherm-a0024", "url": "https://it.amc.info/cdn/shop/files/AMC_Visiotherm-Audiotherm_GAL_ML_A0024.pdf?v=7155050978890285354", "bytes": 12537202, "sha256": "dbc17c4df363fe6ac7ae406d2171c1d8e0f6c3517d94a1e87c758d7fb5038ac1", "scaricato": "2026-10-30", "titolo": "AMC Audiotherm A0024 · italiano pp. 29-41"}, {"id": "audiotherm", "url": "https://it.amc.info/cdn/shop/files/AMC_Visiotherm_e_Audiotherm_Istruzioni_per_l_uso.pdf?v=7155050978890285354", "bytes": 12537202, "sha256": "dbc17c4df363fe6ac7ae406d2171c1d8e0f6c3517d94a1e87c758d7fb5038ac1", "scaricato": "2026-10-30", "titolo": "AMC Visiotherm e Audiotherm"}, {"id": "bimby-tm7", "url": "https://support-italia.vorwerk.com/hc/article_attachments/24845243353756", "bytes": 5113772, "sha256": "5793073ab992a4c4425acb0f8e8fbebba9223c6e66d4c68ab9840683664a9641", "scaricato": "2026-10-30", "titolo": "Bimby TM7 · italiano, cottura a vapore cap. 7.15"}, {"id": "temperature", "titolo": "Temperature minime al cuore · FoodSafety.gov", "url": "https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures"}];
function categoria(nome){const n=norm(nome);if(/farina di cocco/.test(n))return 'cocco';if(/albume/.test(n))return 'albume';if(/uov[oa] (?:di gallina)?|^uov[oa]$/.test(n))return 'uova';if(/(?:fagiol[oi]|ceci|lenticchie).*(?:scatola|lessat|cott)/.test(n))return 'legumi';if(/ricotta/.test(n))return 'ricotta';if(/parmigiano grattugiato/.test(n))return 'parmigiano';if(/crude|vellutat|minestron|crema|ripien|impanat|affumicat|scatola|sottolio/.test(n))return '';if(/insalata|lattuga|rucola|crackers|pane|formaggio|yogurt|frutta|avocado/.test(n))return '';if(/verdura di stagione|verdure di stagione|misto verdure/.test(n))return 'generica';if(/zucchin|carot|broccol|cavolfior|finocch|melanzan|peperon|zucca|fagiolin|patat/.test(n))return 'verdure';if(/pesce|dentice|gamber|salmone|merluzzo|nasello|orata|branzino|spigola|platessa|sogliola/.test(n))return 'pesce';if(/hamburger|macinat/.test(n))return 'hamburger';if(/petto di pollo|petto di tacchino|bocconcini di pollo/.test(n))return 'pollo';if(/coscia di pollo|coscia di tacchino/.test(n))return 'coscia';if(/manzo magro|maiale magro|maiale bistecca|straccetti di vitello|vitello|agnello/.test(n))return 'carne';if(/pasta|pastina|spaghetti|penne|fusilli/.test(n))return 'pasta';if(/riso|risotto/.test(n))return 'riso';return '';}
const fmt=n=>Number(n.toFixed(2)).toLocaleString('it-IT');
function proponiBase(pasto,persone,ids,sistema,attrezzature,scelte={}){
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

fonti.push({id:'amc-tempi',titolo:'AMC · tecniche e tabelle dei tempi (preparazioni adattate)',url:'https://it.amc.info/pages/download',documento:'Cucinare con AMC, tabella tempi 2023; EasyQuick, tabella pesce; ricetta AMC Petto di pollo',consultato:'2026-10-30'});
fonti.push(
 {id:'gz-orata-padella',titolo:'GialloZafferano · Filetti di orata e patate in padella (riferimento, adattato al piano)',url:'https://ricette.giallozafferano.it/Filetti-di-orata-e-patate-in-padella.html'},
 {id:'misya-melanzane',titolo:'Misya · Melanzane in padella (riferimento, adattato al piano)',url:'https://www.misya.info/ricetta/melanzane-in-padella.htm'},
 {id:'lci-melanzane',titolo:'La Cucina Italiana · Melanzane in padella (riferimento, adattato al piano)',url:'https://www.lacucinaitaliana.it/tutorial/i-consigli/melanzane-padella-ricette-facili-veloci/'},
 {id:'cucchiaio-riso',titolo:'Cucchiaio d’Argento · Riso bollito, ricetta base (riferimento)',url:'https://www.cucchiaio.it/ricetta/ricetta-riso-bollito-ricetta-base/'}
);
fonti.push(
 {id:'gz-pasta-fagioli',titolo:'GialloZafferano · Pasta e fagioli (tecnica di riferimento, ingredienti adattati al piano)',url:'https://ricette.giallozafferano.it/Pasta-e-fagioli.html'},
 {id:'gz-frittata',titolo:'GialloZafferano · Frittata (tecnica di riferimento, dosi e ingredienti del piano)',url:'https://ricette.giallozafferano.it/Frittata.html'},
 {id:'gz-pancake-ricotta',titolo:'The Fit Mediterranean · Pancake alla ricotta (ispirazione, preparazione indipendente con le dosi del piano)',url:'https://blog.giallozafferano.it/thefitmediterranean/pancake-alla-ricotta-senza-carb-senza-glutine/'}
);
fonti.push(
 {id:'amc-pancake',titolo:'AMC · Pancake e cottura con oPan (tecnica, impasto adattato al piano)',url:'https://recipes.cookandgo.amc.info/it-it/pancake'},
 {id:'amc-uova',titolo:'AMC · Uova sode e tecniche con coperchio normale (preparazioni adattate)',url:'https://recipes.cookandgo.amc.info/it-it/uova-sode'},
 {id:'amc-pasta-fagioli',titolo:'AMC · Pasta e fagioli (ispirazione; nella proposta CheManca fagioli già cotti, senza pressione)',url:'https://recipes.cookandgo.amc.info/it-it/pasta-e-fagioli'}
);
const listaNomi=xs=>xs.map(x=>x.nome).join(', ');
function verduraAMC(nome){const n=norm(nome);if(/melanzan/.test(n))return {taglio:'pezzetti di circa 1-2 cm',easy:8,trad:10};if(/zucchin/.test(n))return {taglio:'fette uniformi',easy:4,trad:5};if(/carot/.test(n))return {taglio:'fette di circa 1 cm',easy:12,trad:15,soft:1};if(/broccol/.test(n))return {taglio:'cimette',easy:10,trad:12,soft:0};if(/cavolfior/.test(n))return {taglio:'cimette',easy:12,trad:15,soft:0};if(/finocch/.test(n))return {taglio:'metà',easy:20,trad:25,soft:3};if(/peperon/.test(n))return {taglio:'listarelle',easy:8,trad:10};if(/zucca/.test(n))return {taglio:'cubetti',easy:12,trad:15};if(/fagiolin/.test(n))return {taglio:'pezzetti',easy:16,trad:20,soft:1};if(/patat/.test(n))return {taglio:'cubetti di circa 3 cm',trad:25,soft:3};return null;}
function datiPasto(pasto,persone,ids,scelte){return (pasto.voci||[]).map((v,i)=>{const nome=categoria(v.nome)==='generica'?(scelte[i]||v.nome):v.nome;const dosi=ids.map(id=>({id,nome:persone.find(p=>p.id===id)?.nome||id,q:Number(v.q?.[id]||0)})).filter(x=>x.q>0);return {nome,origine:v.nome,indice:i,u:v.u,qty:dosi.reduce((a,b)=>a+b.q,0),dosi,cat:categoria(nome)};}).filter(x=>x.qty>0&&!scelte['escludi'+x.indice]);}
const quotaPersona=(xs,id)=>xs.reduce((sum,x)=>sum+(x.dosi.find(d=>d.id===id)?.q||0),0);
function preparaPancake({cocco,albumi,usati,ids,persone,passi,note,usa,sistema,a}){
 const quota=quotaPersona;let titolo='';
  if(cocco.length){
   titolo='Pancake al cocco'+(usati.some(x=>x.cat==='ricotta')?' e ricotta':'');
   for(const id of ids){if(!quota(cocco,id))continue;
    const nome=persone.find(p=>p.id===id)?.nome||id,propri=usati.filter(x=>['cocco','albume','ricotta'].includes(x.cat)&&x.dosi.some(d=>d.id===id));
    passi.push('Impasto di '+nome+': prepara in una ciotola separata '+propri.map(x=>x.nome+' '+fmt(quota([x],id))+' '+x.u).join(', ')+'. Mescola gli albumi'+(propri.some(x=>x.cat==='ricotta')?' con la ricotta fino a sciogliere i grumi':' con una frusta')+', poi incorpora la farina di cocco. Lascia idratare 5 minuti. Se il composto è troppo asciutto, aggiungi soltanto acqua un cucchiaino alla volta, fino a ottenere una pastella densa da stendere con il cucchiaio. La farina di cocco e il cocco grattugiato assorbono diversamente.');
   }
   if(sistema==='amc'){
    passi.push(a.opan?'Usa la padella AMC oPan sul fornello o su Navigenio come piano di cottura, senza coperchio. Preriscalda secondo il manuale e verifica la temperatura con poche gocce d’acqua, che devono muoversi sulla superficie; asciuga con cautela prima di versare l’impasto. Con Navigenio puoi preriscaldare a 6 e poi ridurre a 2: regola ulteriormente se i pancake colorano troppo rapidamente.':'Usa la padella AMC HotPan: preriscalda con coperchio normale fino alla finestra carne, quindi riduci il calore e togli il coperchio. Per i pancake mantieni una cottura dolce e gira ogni disco quando si stacca; se tende a bruciare riduci ancora. Non applicare la finestra carne a oPan, che non ha Visiotherm.');
    usa('amc-pancake');
   }
   for(const id of ids){if(!quota(cocco,id))continue;const nome=persone.find(p=>p.id===id)?.nome||id;
    if(sistema==='amc')passi.push('Pancake AMC di '+nome+': versa il suo impasto in piccoli dischi di circa 7-8 cm, non più spessi di 5 mm. Cuoci a calore ridotto e gira con una paletta quando il fondo si stacca e i bordi sono stabili. Completa il secondo lato, indicativamente 2-4 minuti per lato; se scuriscono troppo riduci ancora il calore. L’impasto al cocco ha consistenza diversa dalla ricetta AMC di riferimento: verifica almeno 71 °C al cuore, senza albume liquido al centro. Cuoci in più riprese e servi tutti i dischi della sua ciotola alla stessa persona. Non usare EasyQuick, Secuquick o Navigenio capovolto.');
    else passi.push('Pancake di '+nome+': scalda brevemente una padella antiaderente sul gas a fiamma bassa. Distribuisci tutto il suo impasto in piccoli dischi di circa 7-8 cm e spessore non superiore a 5 mm, in più riprese. Copri e cuoci indicativamente 3-4 minuti sul primo lato; gira solo quando il fondo è stabile e completa per altri 2-3 minuti. Abbassa la fiamma se scuriscono prima di cuocere al centro. Verifica almeno 71 °C al cuore, senza impasto umido o albume liquido. Servi tutti i pancake della sua ciotola alla stessa persona, senza dividere il totale a metà.');
   }
   note.push('Pancake senza aggiunta automatica di zucchero, lievito, latte, burro, miele o altra farina. L’acqua serve solo a regolare la consistenza. Per ungere, se necessario, usa soltanto la quota di olio prevista e ancora disponibile nella giornata. L’eventuale ricotta non selezionata resta nel pasto, da consumare separatamente.');usa('gz-pancake-ricotta','temperature');
  }
 return titolo;
}
function preparaUova({uova,albumi,cocco,patate,usati,ids,persone,passi,usa,sistema,a,scelte,pasto}){
 const quota=quotaPersona;let titolo='';
  if(uova.length || (albumi.length&&!cocco.length)){
   const frittata=scelte.preparazioneUova?scelte.preparazioneUova==='frittata':(pasto.piatti||[]).some(t=>/frittata/.test(norm(t)))||(pasto.voci||[]).some(v=>/frittata/.test(norm(v.piatto)));
   if(!cocco.length)titolo=frittata?'Frittata in padella':uova.length?'Uova sode con contorno':'Albumi in padella';
   for(const id of ids){
    const proprie=uova.filter(x=>x.dosi.some(d=>d.id===id)),bianchi=cocco.length?[]:albumi.filter(x=>x.dosi.some(d=>d.id===id));if(!proprie.length&&!bianchi.length)continue;
    const nome=persone.find(p=>p.id===id)?.nome||id;
    const elenco=[...proprie,...bianchi].map(x=>x.nome+' '+fmt(quota([x],id))+' '+x.u).join(', ');
    const aggiunte=usati.filter(x=>['parmigiano'].includes(x.cat)&&x.dosi.some(d=>d.id===id));
    if(!frittata&&proprie.length&&!bianchi.length){
     if(sistema==='amc')passi.push('Uova sode AMC per '+nome+': prepara '+elenco+' in una pentola AMC con coperchio normale, adatta al numero di uova. Per una piccola pentola e fino a 4 uova versa almeno 3 cucchiai d’acqua; con recipienti più grandi usa la quantità indicata nel relativo manuale. Porta l’indicatore alla finestra verdura, riduci il calore e cuoci indicativamente 10 minuti nel settore verdura. Controlla che il fondo non si asciughi. Raffredda e sguscia: albume e tuorlo devono essere ben rassodati. Le eventuali patate e il parmigiano restano nelle sole dosi della stessa persona, serviti a parte. Non usare tempi per uova barzotte né cottura in pressione.');
     else passi.push('Uova sode per '+nome+': usa '+elenco+'. Disponile integre in un pentolino, copri con acqua e porta al bollore sul gas. Riduci a leggero bollore e cuoci indicativamente 9-12 minuti per uova medie; raffredda in acqua fredda e sguscia. Albume e tuorlo devono essere ben rassodati: prolunga la cottura se necessario. Servi con la sola porzione di contorno della stessa persona.'+(patate.some(x=>x.dosi.some(d=>d.id===id))?' Le sue patate già cotte restano a parte.':'')+(aggiunte.length?' Il parmigiano previsto resta separato: usa solo '+aggiunte.map(x=>fmt(quota([x],id))+' '+x.u+' per '+nome).join(', ')+'.':''));
    }else{
     const patateProprie=patate.filter(x=>x.dosi.some(d=>d.id===id));
     passi.push('Frittata di '+nome+': sbatti in una ciotola '+elenco+'. '+(aggiunte.length?'Unisci soltanto '+aggiunte.map(x=>x.nome+' '+fmt(quota([x],id))+' '+x.u).join(', ')+', senza convertire i cucchiaini in grammi. ':'Non aggiungere automaticamente formaggio o latte. ')+(patateProprie.length?'Incorpora la sua dose di patate già cotte e tagliate, preparate nel passaggio precedente. Non usare le patate di un’altra persona. ':'Le verdure restano un contorno separato. '));
     if(sistema==='amc')passi.push('Cottura AMC della frittata di '+nome+': usa una padella HotPan o una pentola AMC con coperchio normale, adeguata a ottenere uno strato di circa 1 cm. Ungi solo con l’olio della quota ancora disponibile. Scalda brevemente a calore dolce, versa il composto e chiudi con il coperchio normale. Cuoci a calore basso per circa 5-8 minuti, controllando il fondo; gira con un piatto resistente al calore soltanto quando la base è stabile e completa per altri 2-4 minuti. Se non si stacca, non forzare: prosegui coperto a calore molto basso fino a rassodamento. Verifica almeno 71 °C al cuore e assenza di uovo liquido. Questi tempi sono indicativi per il composto adattato: non sono un programma automatico AMC. Non usare EasyQuick o Secuquick e non montare Navigenio capovolto per questa preparazione.');
     else passi.push('Cuoci la frittata di '+nome+' in una padellina antiaderente con coperchio, su gas a fiamma bassa, usando soltanto l’olio della quota disponibile nel piano. Mantieni uno spessore di circa 1 cm; se il composto è troppo abbondante prepara più frittatine. Cuoci indicativamente 5-8 minuti, poi gira con un piatto piano solo se la base è stabile e completa per circa 2-4 minuti. In alternativa completa coperto a calore dolce, verificando che il centro si rassodi. Deve raggiungere almeno 71 °C al cuore e non avere uovo liquido. Non sommare le porzioni personali e poi dividerle in parti uguali.');
    }
   }
   usa(sistema==='amc'?'amc-uova':'gz-frittata','temperature');
  }
 return titolo;
}
function analizza(pasto,persone,ids,sistema,a,scelte={}){
 const no=errore=>({ricette:[],errore});
 if(!pasto||pasto.libero)return no('Scegli un pasto con ingredienti e dosi nel piano.');
 if(!ids.length)return no('Scegli per chi cucinare.');
 const tutti=datiPasto(pasto,persone,ids,scelte);if(tutti.some(x=>x.cat==='generica'))return no('Scegli la verdura prevista per la voce generica. Le patate restano un ingrediente distinto.');
 if(sistema==='bimby'){const r=proponiBase(pasto,persone,ids,sistema,a,scelte);return {ricette:r,errore:r.length?'':'Per il vapore TM7 configura Bimby TM7 e Varoma e seleziona fino a 600 g di verdure supportate.'};}
 if(!['forno','amc','tradizionale'].includes(sistema))return no('Scegli un sistema di cottura supportato.');
 if(sistema==='forno'&&a.forno===false)return no('Attiva il forno nelle attrezzature della tua cucina.');
 const categorieBase=['verdure','pesce','hamburger','pollo','coscia','carne','pasta','riso'];
 const colazione=tutti.filter(x=>x.cat==='cocco'),uovaPasto=tutti.filter(x=>x.cat==='uova');
 const usati=tutti.filter(x=>categorieBase.includes(x.cat)||(['tradizionale','amc'].includes(sistema)&&(['cocco','albume','uova','legumi'].includes(x.cat)||(x.cat==='ricotta'&&colazione.some(c=>c.dosi.some(d=>x.dosi.some(e=>e.id===d.id))))||(x.cat==='parmigiano'&&uovaPasto.some(c=>c.dosi.some(d=>x.dosi.some(e=>e.id===d.id)))))));
 if(!usati.length)return no('Non ci sono ancora preparazioni per gli ingredienti selezionati.');
 const verdure=usati.filter(x=>x.cat==='verdure'&&!/patat/.test(norm(x.nome))),patate=usati.filter(x=>/patat/.test(norm(x.nome))),pesce=usati.filter(x=>x.cat==='pesce'),carne=usati.filter(x=>['pollo','hamburger','coscia','carne'].includes(x.cat)),pasta=usati.filter(x=>x.cat==='pasta'),riso=usati.filter(x=>x.cat==='riso');
 if(sistema==='forno'&&!verdure.length&&!patate.length&&!pesce.length&&!carne.length)return no('Per la sola pasta o il solo riso usa il fornello; aggiungi al pasto un contorno previsto dal piano per una proposta al forno.');
  const cocco=usati.filter(x=>x.cat==='cocco'),albumi=usati.filter(x=>x.cat==='albume'),uova=usati.filter(x=>x.cat==='uova'),legumi=usati.filter(x=>x.cat==='legumi');
  const quota=(xs,id)=>xs.reduce((sum,x)=>sum+(x.dosi.find(d=>d.id===id)?.q||0),0);
  for(const x of cocco)for(const d of x.dosi)if(!quota(albumi,d.id))return no('Per i pancake di '+d.nome+' seleziona anche gli albumi previsti nel suo pasto. Non vengono aggiunte uova o dosi di altre persone.');
  if([...cocco,...albumi,...legumi].some(x=>x.u!=='g'))return no('Questa preparazione richiede cocco, albumi e legumi con quantità espresse in grammi come nel piano.');

 const passi=[],note=[],fontiRicetta=[],usa=(...v)=>fontiRicetta.push(...v);
 const soglia=x=>x.cat==='coscia'||x.cat==='pollo'||/pollo|tacchino/.test(norm(x.nome))?74:x.cat==='hamburger'?71:63;
 const statoPesce=scelte.statoPesce||(pesce.some(x=>/surgelat/.test(norm(x.nome)))?'surgelato':'fresco');
 const preparaPesce=()=>{if(statoPesce==='surgelato')passi.push('Il pesce è surgelato: prima scongelalo completamente in frigorifero secondo la confezione. Questa preparazione non prevede la cottura direttamente da congelato.');else if(scelte.statoPesce==='scongelato')passi.push('Usa il pesce già scongelato, conservato in frigorifero. Tamponalo, controlla le lische e prepara le dosi personali.');else passi.push('Usa il pesce fresco: non deve essere scongelato. Tamponalo, controlla le lische e prepara le dosi personali.');};
 passi.push('Pesa a crudo le dosi di ogni persona e mantienile riconoscibili durante la preparazione. Non aggiungere ingredienti o condimenti non previsti dal piano.');
 let titolo='';
 if(sistema==='forno'){
  const cartoccio=scelte.preparazioneForno==='cartoccio'&&pesce.length>0;
  titolo=pesce.length?listaNomi(pesce)+(cartoccio?' al cartoccio':' in teglia')+(patate.length?' con patate':'')+(verdure.length?' e '+listaNomi(verdure):''):carne.length?listaNomi(carne)+' al forno':pasta.length?'Pasta con contorno al forno':riso.length?'Riso con contorno al forno':'Verdure al forno';
  passi.push('Preriscalda il forno statico a 200 °C. Prepara una teglia per i contorni'+(cartoccio?' e una per i cartocci.':pesce.length||carne.length?' e una separata per il secondo.':'.'));
  if(patate.length)passi.push('Patate: pelale e tagliale a fette di 3-4 mm. Stendile su una teglia per contorni in un solo strato. Avvia la cottura per 15 minuti prima di aggiungere le verdure: non metterle crude insieme al pesce, che cuoce più rapidamente.');
  if(verdure.length){passi.push(listaNomi(verdure)+': lava e taglia in pezzi uniformi di 1-2 cm. '+(patate.length?'Dopo i primi 15 minuti aggiungile nella stessa teglia delle patate, in una zona distinta.':'Stendile nella teglia per contorni, senza sovrapporle.'));passi.push('Cuoci '+listaNomi(verdure)+(patate.length?' insieme alle patate':'')+' per circa 25-35 minuti, girando a metà. Controlla separatamente la morbidezza di ogni ingrediente: le patate non devono rimanere dure al centro. Se uno dei contorni è pronto prima, toglilo e tienilo coperto.');}
  else if(patate.length)passi.push('Prosegui la cottura delle sole patate per altri 20-30 minuti, girandole a metà e verificando che siano morbide al centro.');
  if(pesce.length){preparaPesce();
   if(cartoccio)passi.push('Prepara un cartoccio individuale con carta da forno adatta a 200 °C: appoggia la porzione di '+listaNomi(pesce)+', ripiega i bordi e lascia spazio al vapore. Tieni patate'+(verdure.length?' e '+listaNomi(verdure):'')+' nella teglia dei contorni: non inserirle crude nel cartoccio. Metti i cartocci su una seconda teglia.');
   else passi.push('Sistema '+listaNomi(pesce)+' nella teglia del pesce. I contorni restano nella loro teglia; non mettere il pesce crudo sulle patate.');
   const intero=scelte.formatoPesce==='intero';passi.push((intero?'Per pesce intero già eviscerato considera indicativamente 25-40 minuti':'Per filetti o tranci considera indicativamente 15-25 minuti')+' a 200 °C'+(cartoccio?', nel cartoccio chiuso':'')+'. Inforna il pesce quando ai contorni mancano circa questi minuti. Tempi indicativi: verifica almeno 63 °C al cuore con un termometro. Se il contorno non è pronto, termina la sua cottura separatamente.');
   if(cartoccio)passi.push('Apri ogni cartoccio con cautela, facendo uscire il vapore lontano dal viso. Aggiungi nel piatto le patate'+(verdure.length?' e '+listaNomi(verdure):'')+' già cotte, rispettando le dosi di ciascuno.');usa('temperature');
  }
  for(const x of carne){passi.push('Prepara '+x.nome+(x.cat==='hamburger'?' senza aggiungere pane, uova o formaggio.':' in pezzi di spessore uniforme.')+' Usa una teglia separata dai contorni. Cuoci indicativamente '+(x.cat==='coscia'?'40-55':'20-30')+' minuti a 200 °C e verifica almeno '+soglia(x)+' °C al cuore'+(x.cat==='carne'?', poi lascia riposare almeno 3 minuti':'')+'; se i contorni richiedono più tempo, finiscili separatamente.');usa('temperature');}
  if(pasta.length||riso.length)passi.push('Cuoci '+listaNomi([...pasta,...riso])+' separatamente in una pentola sul fornello, con acqua e tempo indicati sulla confezione. Non mettere cereali crudi in forno. Unisci al contorno cotto solo dopo aver suddiviso le dosi personali.');
 }else if(sistema==='tradizionale'){
  if(pesce.length&&scelte.formatoPesce==='intero')return no('Per la cucina tradizionale questa raccolta prevede filetti e tranci. Per il pesce intero seleziona Forno oppure scegli filetti.');
  titolo=(pesce.length?listaNomi(pesce):carne.length?listaNomi(carne):pasta.length?listaNomi(pasta):riso.length?listaNomi(riso):'Verdure')+' in '+(pasta.length||riso.length?'pentola':'padella')+(patate.length?' con patate':'')+(verdure.length?' e '+listaNomi(verdure):'');
  passi.push('Prepara una pentola con coperchio e una padella antiaderente adatte al gas. Regola la fiamma senza farla uscire dal fondo. Se le dosi non stanno in un solo strato, cuoci in più riprese: non moltiplicare automaticamente i tempi per il numero di persone.');
  if(cocco.length)titolo=preparaPancake({cocco,albumi,usati,ids,persone,passi,note,usa,sistema,a});
  if(patate.length){passi.push('Patate: pela e taglia a cubetti di circa 2 cm. Mettile in pentola, coprile con acqua e porta a bollore a fiamma media. Abbassa e lascia sobbollire circa 12-18 minuti dal bollore, finché una forchetta entra al centro. Scola e tieni coperte; preparale prima del pesce. Non aggiungere patate crude alla sua cottura breve.');if(pesce.some(x=>/orata/.test(norm(x.nome))))usa('gz-orata-padella');}
  for(const v of verdure){
   const n=norm(v.nome);
   let taglio='cubetti di 1-2 cm',tempo='15-20';
   if(/zucchin/.test(n)){taglio='mezze rondelle di circa 5 mm';tempo='10-15';}
   else if(/melanzan/.test(n)){tempo='15-25';usa('misya-melanzane','lci-melanzane');}
   else if(/carot/.test(n)){taglio='rondelle sottili di circa 3 mm';tempo='15-20';}
   else if(/broccol|cavolfior/.test(n)){taglio='cimette piccole di dimensioni simili';tempo=/broccol/.test(n)?'10-15':'15-20';}
   else if(/finocch/.test(n)){taglio='spicchi sottili di circa 1 cm';tempo='20-25';}
   else if(/peperon/.test(n)){taglio='listarelle di circa 1 cm, eliminando semi e filamenti';tempo='15-20';}
   else if(/zucca/.test(n)){tempo='15-20';}
   else if(/fagiolin/.test(n)){passi.push(v.nome+': spunta e lava. Lessa in una pentola con acqua in ebollizione per circa 15-20 minuti, verificando che siano teneri. Scola, conserva le dosi personali e tieni coperti.');continue;}
   passi.push(v.nome+': lava, pulisci e taglia in '+taglio+'. Metti in una padella antiaderente con pochi cucchiai di acqua. Copri e cuoci a fiamma medio-bassa per circa '+tempo+' minuti, mescolando e aggiungendo poca acqua se il fondo si asciuga. Controlla la morbidezza; scopri alla fine per far evaporare l’acqua rimasta. Cuoci separatamente dagli altri contorni per rispettare i diversi tempi.');
  }
  if(uova.length || (albumi.length&&!cocco.length))titolo=preparaUova({uova,albumi,cocco,patate,usati,ids,persone,passi,usa,sistema,a,scelte,pasto});
  for(const x of legumi){
   passi.push(x.nome+': usa il prodotto già cotto in scatola. Scola'+(/sottolio/.test(norm(x.nome))?'':' e risciacqua')+' secondo la confezione e pesa separatamente la dose di ogni persona al netto del liquido. Scalda in un pentolino con pochi cucchiai di acqua, a fiamma bassa, per circa 5-8 minuti, mescolando e aggiungendo acqua se si asciuga. Puoi schiacciare una parte con la forchetta per una crema, senza aggiungere altri ingredienti. Non applicare questo procedimento a legumi secchi crudi.');
  }
  if(pesce.length){preparaPesce();for(const x of pesce){
   const gamberi=/gamber/.test(norm(x.nome));
   passi.push(x.nome+': '+(gamberi?'sguscia e pulisci i gamberi.':'usa filetti o tranci di spessore uniforme e controlla le lische.')+' Scalda brevemente una padella antiaderente a fiamma media senza surriscaldarla vuota; usa soltanto una parte dell’olio già previsto dal piano oppure aggiungi poca acqua e copri. Adagia il pesce in un solo strato e abbassa la fiamma. Cuoci indicativamente '+(gamberi?'4-6 minuti complessivi':'6-12 minuti complessivi per filetti di circa 1-2 cm')+', girando delicatamente a metà. Verifica almeno 63 °C al cuore: lo spessore può richiedere più tempo. Patate e verdure restano già cotte e separate, da aggiungere al piatto alla fine.');if(/orata/.test(norm(x.nome)))usa('gz-orata-padella');usa('temperature');
  }}
  for(const x of carne){
   const coscia=x.cat==='coscia',hamb=x.cat==='hamburger';
   passi.push(x.nome+': '+(hamb?'forma hamburger uniformi di circa 1,5 cm con la sola carne prevista, senza pane, uova o formaggio.':coscia?'mantieni i pezzi di dimensioni simili.':'prepara fette o bocconcini di spessore uniforme, circa 1-2 cm.')+' In una padella antiaderente usa solo l’olio della quota giornaliera, senza impanare né aggiungere burro o vino. '+(coscia?'Rosola a fiamma media girando i pezzi, aggiungi acqua sul fondo, copri e prosegui a fiamma bassa per circa 35-50 minuti per il pollo; il tacchino può richiedere più tempo. Controlla il fondo e aggiungi poca acqua quando serve.':'Cuoci a fiamma media, girando a metà, indicativamente '+(hamb?'10-15':'8-15')+' minuti complessivi; abbassa se la superficie scurisce troppo e aggiungi poca acqua per terminare la cottura senza bruciare.')+' Verifica almeno '+soglia(x)+' °C al cuore'+(coscia?', lontano dall’osso':'')+(x.cat==='carne'?', poi lascia riposare almeno 3 minuti':'')+'. Il tempo è indicativo e va adattato allo spessore.');usa('temperature');
  }
  for(const x of [...pasta,...riso]){
   passi.push(x.nome+': pesa separatamente la dose cruda di ogni persona. Porta una pentola d’acqua a bollore, versa il cereale e regola il gas per mantenere un bollore regolare. Segui acqua e tempo della confezione, assaggia e scola quando pronto. '+(x.cat==='riso'?'Basmati, integrale e riso per risotti hanno cotture diverse: questa proposta usa la lessatura, non il procedimento del risotto. ':'')+'Cuoci le dosi personali in pentole o riprese distinte; unisci solo dopo alle rispettive porzioni di verdure già cotte.');if(x.cat==='riso')usa('cucchiaio-riso');
  }
  if(legumi.length&&(pasta.length||riso.length)){
   passi.push('Componi il primo per ciascuna persona separatamente: unisci la sua pasta o il suo riso già cotto soltanto ai legumi previsti per lei, con poca acqua di cottura, e fai insaporire per 1-2 minuti a fiamma bassa. Se il suo piano non prevede legumi, non aggiungerli. Per una cena diversa tra Max e Vale prepara il secondo dell’altra persona nella sua padella; non distribuire fagioli, pasta o carne tra chi non li ha nel proprio pasto.');
   if(!carne.length&&!pesce.length)titolo=listaNomi([...pasta,...riso])+' con '+listaNomi(legumi)+(verdure.length?' e contorno di '+listaNomi(verdure):'');
   usa('gz-pasta-fagioli');
  }
  if(carne.length&&legumi.length)titolo=listaNomi([...pasta,...riso,...legumi,...carne])+' e contorno, con dosi personali';
  note.push('Cucina tradizionale con pentole e padelle comuni sul gas. Preparazione originale adattata agli ingredienti e alle dosi del piano; i link sono riferimenti di tecnica e ispirazione, non la ricetta originale riprodotta. Gli ingredienti aggiuntivi delle fonti non vengono importati. Tempi indicativi per i tagli descritti; con una sola padella prepara prima i contorni.');
 }else{
  if(cocco.length&&!a.opan&&!a.hotpan)return no('Per i pancake AMC seleziona oPan oppure HotPan nelle attrezzature. In alternativa scegli Cucina tradizionale con una padella antiaderente.');
  let metodo=scelte.metodoAMC||'automatico';
  if(metodo==='automatico')metodo=(a.easyquick&&a.inserto&&a.navigenio&&!patate.length&&!carne.length&&!pasta.length&&!riso.length&&!cocco.length&&!albumi.length&&!uova.length&&!legumi.length&&pesce.every(x=>/merluzzo|salmone|gamber/.test(norm(x.nome))))?'easyquick':'tradizionale';
  if(!a.navigenio&&!a.fornelloAMC)return no('Configura AMC Navigenio oppure «Uso le pentole AMC sul fornello». Non serve EasyQuick per tutte le ricette.');
  if(metodo!=='tradizionale'&&(cocco.length||albumi.length||uova.length||legumi.length))return no('Per pancake, uova, frittate o fagioli già cotti scegli AMC tradizionale. I tempi EasyQuick e Secuquick disponibili riguardano soltanto gli ingredienti supportati.');
  if(metodo==='easyquick'&&(!a.easyquick||!a.inserto))return no('Per il vapore EasyQuick seleziona EasyQuick e inserto forato nelle attrezzature. In alternativa scegli AMC tradizionale.');
  if(metodo==='secuquick'&&!a.secuquick)return no('Per questa tecnica configura Secuquick softline nelle attrezzature.');
  if(scelte.formatoPesce==='intero'&&pesce.length)return no('Per il pesce intero scegli Forno: le tecniche AMC inserite riguardano filetti e tranci.');
  if(metodo==='secuquick'&&(pesce.length||carne.length||pasta.length||riso.length))return no('La prima raccolta Secuquick copre patate e verdure con tempi specifici. Per questo pasto scegli AMC tradizionale o prepara separatamente il contorno.');
  titolo='AMC · '+(pesce.length?listaNomi(pesce):carne.length?listaNomi(carne):pasta.length?listaNomi(pasta):riso.length?listaNomi(riso):'Contorno')+(patate.length?' con patate':'')+(verdure.length?' e '+listaNomi(verdure):'');
  usa('amc-tempi','navigenio');
  if(cocco.length)titolo='AMC · '+preparaPancake({cocco,albumi,usati,ids,persone,passi,note,usa,sistema,a});if(metodo==='easyquick')usa('easyquick');
  for(const v of [...patate,...verdure]){
   const t=verduraAMC(v.nome);if(!t)return no('Manca una tecnica verificata per '+v.nome+'. Deselezionalo per preparare gli altri ingredienti.');
   if(metodo==='easyquick'){
    if(t.easy==null)return no('Non ho ancora un tempo EasyQuick verificato per '+v.nome+'. Scegli AMC tradizionale oppure Secuquick per questo contorno.');
    passi.push(v.nome+': taglia in '+t.taglio+'. Cuoci questo ingrediente separatamente con EasyQuick e inserto: almeno '+(a.diametro==='20'?'120':'150')+' ml di acqua, senza bagnare gli alimenti. Porta alla finestra vapore, riduci il calore e conta '+t.easy+' minuti da quel momento. Con Audiotherm e Navigenio puoi usare A e il simbolo vapore. Verifica la consistenza prima di togliere il coperchio.');
   }else if(metodo==='secuquick'){
    if(t.soft===0&&!a.audiotherm)return no('Il programma P per '+v.nome+' richiede Audiotherm. Configuralo oppure scegli AMC tradizionale.');
    if(t.soft==null)return no('Secuquick non è previsto dalla tabella per '+v.nome+'. Scegli AMC tradizionale.');
    passi.push(v.nome+': prepara '+t.taglio+'. Usa pentola e Secuquick compatibili, 150-200 ml di acqua senza sommergere il fondo forato dell’inserto. Per '+v.nome+' il valore breve della tabella è '+(t.soft===0?'programma P':t.soft+' minuti')+' Soft con raffreddamento naturale. Non mescolare questi tempi con quelli per apertura rapida. Non superare i limiti di riempimento del manuale.');
    passi.push('Spegni e lascia raffreddare naturalmente su una superficie resistente al calore fino a depressurizzazione completa. Apri solo quando il sistema lo consente, senza forzare il coperchio. Verifica la cottura di '+v.nome+'.');usa('secuquick');
   }else{
    passi.push(v.nome+': taglia in '+t.taglio+'. Metti nel recipiente AMC ancora bagnate dal lavaggio'+(/patat/.test(norm(v.nome))?', aggiungendo l’acqua necessaria a non far asciugare il fondo':'')+'. Chiudi con il coperchio normale, scalda fino alla finestra verdura, riduci il calore e cuoci indicativamente '+t.trad+' minuti. Controlla il fondo e la morbidezza. Tieni questo contorno separato dagli altri per rispettare il suo tempo di cottura.');
   }
  }
  if(uova.length || (albumi.length&&!cocco.length))titolo='AMC · '+preparaUova({uova,albumi,cocco,patate,usati,ids,persone,passi,usa,sistema,a,scelte,pasto});
  if(pesce.length){preparaPesce();for(const x of pesce){
   const n=norm(x.nome);if(metodo==='easyquick'){
    const tempo=/merluzzo/.test(n)?3:/salmone/.test(n)?7:/gamber/.test(n)?4:null;
    if(tempo==null)return no('Per '+x.nome+' non ho un tempo EasyQuick verificato per questo taglio. Seleziona AMC tradizionale.');
    passi.push(x.nome+': in una cottura separata, sistema i filetti o tranci nell’inserto EasyQuick, con almeno '+(a.diametro==='20'?'120':'150')+' ml d’acqua sotto. Porta alla finestra vapore e cuoci indicativamente '+tempo+' minuti da quel momento. Verifica almeno 63 °C al cuore; prolunga se necessario. Non applicare questi tempi a pesci interi o congelati.');
   }else{passi.push(x.nome+': usa filetti o tranci, tamponati e privi di lische. In una pentola o padella AMC separata, preriscalda con il coperchio normale fino alla finestra carne. Riduci il calore, adagia il pesce e copri; al punto di girata giralo delicatamente e completa a calore dolce. Per il salmone la ricetta AMC prevede circa 3 minuti di riposo a fuoco spento dopo la girata. Per gli altri filetti prosegui quanto necessario a raggiungere almeno 63 °C al cuore. Non trattare come salmone pesci o tagli diversi.');}
   usa('temperature');}
  }
  for(const x of carne){
   if(x.cat==='coscia')passi.push(x.nome+': cuoci separatamente con il coperchio normale AMC. Rosola e gira i pezzi, aggiungi acqua per una cottura umida senza far asciugare il fondo, chiudi e prosegui a calore dolce indicativamente 40 minuti per la coscia di pollo; la coscia di tacchino può richiedere più tempo. Verifica almeno 74 °C al cuore, lontano dall’osso. Non usare il tempo di riposo del petto.');
   else passi.push(x.nome+': tampona e porziona in pezzi uniformi'+(x.cat==='hamburger'?', senza aggiungere pane o uova':'')+'. Preriscalda una pentola AMC separata fino alla finestra carne. Riduci, inserisci la carne e chiudi con il coperchio normale; gira al punto di girata. '+(/petto di pollo/.test(norm(x.nome))?'Per il petto di pollo, la ricetta AMC prevede circa 10 minuti coperto a fuoco spento dopo la girata. ':'Prosegui a calore dolce e verifica lo spessore dei pezzi. ')+'Controlla almeno '+soglia(x)+' °C al cuore'+(x.cat==='carne'?' e lascia riposare almeno 3 minuti':'')+'. Se necessario prolunga la cottura: non applicare il riposo del petto agli hamburger o ad altri tagli.');usa('temperature');}
  if(pasta.length||riso.length)passi.push('Prepara '+listaNomi([...pasta,...riso])+' nella pentola AMC con il coperchio normale, come cottura non in pressione: usa acqua e tempo della confezione e controlla il fondo. Per riso basmati integrale non usare il programma P del risotto: è un prodotto diverso. Suddividi le quantità prima di aggiungere eventuali contorni.');
  for(const x of legumi)passi.push(x.nome+': usa soltanto legumi già cotti in scatola, scolati e pesati per persona. Scaldali in una pentola AMC con il coperchio normale e poca acqua, a calore basso, per circa 5-8 minuti, mescolando e controllando il fondo. Non usare Secuquick per riscaldare questi legumi e non applicare i tempi dei fagioli secchi.');
  if(legumi.length&&(pasta.length||riso.length)){
   passi.push('Per ogni persona unisci la sua pastina, pasta o riso già cotti soltanto ai suoi fagioli, in una pentola AMC con poca acqua di cottura, e fai insaporire per 1-2 minuti a calore basso con coperchio normale. La preparazione con fagioli in scatola è diversa dalla ricetta AMC per fagioli secchi: non trasferirne tempi, pressione o ingredienti. Chi ha gli straccetti di vitello riceve la propria carne e il contorno, senza la pastina e i fagioli dell’altra persona.');
   titolo='AMC · '+listaNomi([...pasta,...riso,...legumi,...carne])+' con dosi personali';usa('amc-pasta-fagioli');
  }
  note.push('Tempi AMC indicativi per il taglio descritto; ogni ingrediente viene cotto separatamente. Con una sola pentola prepara prima i contorni e tienili coperti. Le dosi del piano sono mantenute, senza importare burro, vino o altri ingredienti dalle ricette originali.');
 }
 passi.push('Usa soltanto l’olio e i condimenti previsti dal piano, considerando la quota già usata nella giornata. Servi la porzione di ogni persona con i suoi contorni: dosi diverse non sono porzioni uguali.');
 const elenco=usati.map(x=>x.nome+': '+fmt(x.qty)+' '+x.u+' ('+x.dosi.map(d=>d.nome+' '+fmt(d.q)+' '+x.u).join(' · ')+')').join('\n');
 const resto=(pasto.voci||[]).filter((v,i)=>!usati.some(x=>x.indice===i)&&ids.some(id=>Number(v.q?.[id])>0)).map(v=>v.nome);
 return {ricette:[{baseId:sistema+'-specifica',titolo:titolo.slice(0,150),ingredienti:elenco,passi,note:note.join('\n'),resto,fonti:[...new Set(fontiRicetta)],sistema,preferenze:{...scelte,statoPesce},personale:false}],errore:''};
}
const cookidoo={ios:'https://apps.apple.com/it/app/thermomix-cookidoo/id714004506',android:'https://play.google.com/store/apps/details?id=com.vorwerk.cookidoo&hl=it',web:'https://cookidoo.it/'};
function storeCookidoo(nav={}){
 if(/iPhone|iPad|iPod/i.test(nav.userAgent||'')||(/Mac/i.test(nav.platform||'')&&Number(nav.maxTouchPoints)>1))return [{nome:'App Store',url:cookidoo.ios}];
 if(/Android/i.test(nav.userAgent||''))return [{nome:'Google Play',url:cookidoo.android}];
 return [{nome:'App Store',url:cookidoo.ios},{nome:'Google Play',url:cookidoo.android}];
}
function nuovaRicettaBimby(pasto,persone,ids,scelte={}){
 if(!pasto||!ids.length)throw Error('Scegli il pasto e le persone per la ricetta Bimby.');
 const dati=datiPasto(pasto,persone,ids,scelte);if(!dati.length)throw Error('Non ci sono dosi per le persone selezionate in questo pasto.');
 return {baseId:'bimby-personale',titolo:'Ricetta Bimby'+(pasto.pasto?' · '+pasto.pasto:''),ingredienti:dati.map(x=>x.nome+': '+fmt(x.qty)+' '+x.u+' ('+x.dosi.map(d=>d.nome+' '+fmt(d.q)+' '+x.u).join(' · ')+')').join('\n'),passi:[],note:'Ricetta personale Bimby. Verifica compatibilità con il modello e le istruzioni ufficiali. Le quantità riportate provengono dal pasto selezionato.',resto:[],fonti:[],sistema:'bimby',personale:true};
}
function proponi(...args){return analizza(...args).ricette;}
function motivo(...args){return analizza(...args).errore;}

function preparabile(pasto){return !!pasto&&!pasto.libero&&(pasto.voci||[]).some(v=>{const c=categoria(v.nome);return !!c&&!['ricotta','parmigiano'].includes(c);});}
return {categoria,preparabile,proponi,motivo,fonti,cookidoo,storeCookidoo,nuovaRicettaBimby};
});
