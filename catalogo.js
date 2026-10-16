/* I prodotti senza codice a barre, da mettere in casa con un tap.
   voci  = a quali voci del piano contano (la prima è quella "propria")
   unita = "pz" (si contano) o "g" (si pesano); g_pz = peso indicativo di un pezzo
   passo = quanto aggiunge ogni tap
   Dall'app si possono aggiungere altri prodotti: finiscono nella tabella "catalogo". */
(function (root) {
  const FRUTTA = ["Frutta di stagione"];
  const VERDURA = ["Verdura di stagione", "Misto verdure crude"];
  const p = (gruppo, luogo, nome, voci, unita, passo, g_pz) => ({ gruppo, luogo, nome, voci, unita, passo, g_pz: g_pz || null });

  root.CATALOGO_BASE = [
    // ---- frutta: di solito nel cesto, quindi dispensa; i frutti delicati in frigo
    p("Frutta", "dispensa", "Mele", FRUTTA, "pz", 1, 180),
    p("Frutta", "dispensa", "Pere", FRUTTA, "pz", 1, 170),
    p("Frutta", "dispensa", "Banane", FRUTTA, "pz", 1, 120),
    p("Frutta", "dispensa", "Arance", FRUTTA, "pz", 1, 200),
    p("Frutta", "dispensa", "Mandarini", FRUTTA, "pz", 1, 80),
    p("Frutta", "dispensa", "Cachi", FRUTTA, "pz", 1, 200),
    p("Frutta", "frigo", "Kiwi", FRUTTA, "pz", 1, 80),
    p("Frutta", "frigo", "Uva", FRUTTA, "g", 250),
    p("Frutta", "frigo", "Fragole", FRUTTA, "g", 250),
    p("Frutta", "dispensa", "Melograno", FRUTTA, "pz", 1, 250),
    p("Frutta", "frigo", "Mirtilli", ["Mirtilli", ...FRUTTA], "g", 125),
    p("Frutta", "dispensa", "Avocado", ["Avocado"], "pz", 1, 200),

    // ---- verdura
    p("Verdura", "frigo", "Zucchine", ["Zucchine", ...VERDURA], "pz", 1, 200),
    p("Verdura", "frigo", "Lattuga", ["Lattuga", ...VERDURA], "pz", 1, 300),
    p("Verdura", "frigo", "Pomodori", ["Pomodori", ...VERDURA], "pz", 1, 120),
    p("Verdura", "frigo", "Carote", VERDURA, "pz", 1, 80),
    p("Verdura", "frigo", "Finocchi", VERDURA, "pz", 1, 300),
    p("Verdura", "frigo", "Cetrioli", VERDURA, "pz", 1, 250),
    p("Verdura", "frigo", "Peperoni", VERDURA, "pz", 1, 200),
    p("Verdura", "frigo", "Broccoli", ["Verdura di stagione"], "pz", 1, 400),
    p("Verdura", "frigo", "Cavolfiore", ["Verdura di stagione"], "pz", 1, 800),
    p("Verdura", "frigo", "Melanzane", ["Verdura di stagione"], "pz", 1, 300),
    p("Verdura", "frigo", "Spinaci", ["Verdura di stagione"], "g", 250),
    p("Verdura", "frigo", "Fagiolini", ["Verdura di stagione"], "g", 250),
    p("Verdura", "frigo", "Cavolo nero", ["Verdura di stagione"], "g", 250),
    p("Verdura", "frigo", "Zucca", ["Verdura di stagione"], "g", 500),
    p("Verdura", "dispensa", "Patate", ["Patate"], "g", 500),

    // ---- pesce (al banco, si pesa)
    p("Pesce", "frigo", "Spigola", ["Spigola"], "g", 100),
    p("Pesce", "frigo", "Orata", ["Orata"], "g", 100),
    p("Pesce", "frigo", "Dentice", ["Dentice"], "g", 100),
    p("Pesce", "frigo", "Merluzzo o nasello", ["Merluzzo o nasello"], "g", 100),
    p("Pesce", "frigo", "Pesce spada", ["Pesce spada"], "g", 100),
    p("Pesce", "frigo", "Gamberi", ["Gamberi"], "g", 100),
    p("Pesce", "frigo", "Platessa", ["Platessa"], "g", 100),
    p("Pesce", "frigo", "Sogliola", ["Sogliola"], "g", 100),
    p("Pesce", "frigo", "Polpo", ["Polpo"], "g", 100),

    // ---- carne (al banco)
    p("Carne", "frigo", "Petto di pollo", ["Petto di pollo"], "g", 100),
    p("Carne", "frigo", "Bocconcini di pollo", ["Bocconcini di pollo"], "g", 100),
    p("Carne", "frigo", "Coscia di pollo", ["Coscia di pollo"], "g", 100),
    p("Carne", "frigo", "Hamburger di pollo", ["Hamburger di pollo"], "g", 100),
    p("Carne", "frigo", "Hamburger di tacchino", ["Hamburger di tacchino"], "g", 100),
    p("Carne", "frigo", "Petto di tacchino", ["Petto di tacchino"], "g", 100),
    p("Carne", "frigo", "Coscia di tacchino", ["Coscia di tacchino"], "g", 100),
    p("Carne", "frigo", "Manzo magro", ["Manzo magro"], "g", 100),
    p("Carne", "frigo", "Maiale magro", ["Maiale magro"], "g", 100),

    // ---- salumi e formaggi al banco
    p("Banco", "frigo", "Prosciutto crudo magro", ["Prosciutto crudo magro"], "g", 50),
    p("Banco", "frigo", "Bresaola", ["Bresaola"], "g", 50),
    p("Banco", "frigo", "Fesa di pollo arrosto", ["Fesa di pollo arrosto"], "g", 50),
    p("Banco", "frigo", "Fesa di tacchino arrosto", ["Fesa di tacchino arrosto"], "g", 50),
    p("Banco", "frigo", "Parmigiano", ["Parmigiano", "Parmigiano grattugiato"], "g", 100),
    p("Banco", "frigo", "Ricotta di vacca", ["Ricotta di vacca"], "g", 250),
    p("Banco", "frigo", "Ricotta di pecora", ["Ricotta di pecora"], "g", 250),
    p("Banco", "frigo", "Mozzarella", ["Mozzarella"], "pz", 1, 125),
    p("Banco", "frigo", "Uova sfuse", ["Uovo di gallina"], "pz", 1, 60),

    // ---- pane (forno)
    p("Pane", "dispensa", "Pane integrale di segale", ["Pane integrale di segale"], "g", 250),
    p("Pane", "dispensa", "Pane integrale", ["Pane integrale"], "g", 250),
    p("Pane", "dispensa", "Pane bianco", ["Pane bianco"], "g", 250),
  ];
  root.GRUPPI_CATALOGO = ["Frutta", "Verdura", "Pesce", "Carne", "Banco", "Pane", "Altro"];
})(typeof self !== "undefined" ? self : this);
