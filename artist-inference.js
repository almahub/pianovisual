function key(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.json$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const EXPLICIT_ARTISTS = [
  ["Fabrizio De André", ["fabrizio de andre", "fabrizio de andr", "de andre", "deandre"]],
  ["Vasco Rossi", ["vasco rossi"]],
  ["Lucio Dalla", ["lucio dalla"]],
  ["Lucio Battisti", ["lucio battisti", "mogol battisti"]],
  ["Vinicio Capossela", ["vinicio capossela", "capossela", "caposella"]],
  ["Franco Battiato", ["franco battiato", "battiato"]],
  ["Mia Martini", ["mia martini"]],
  ["Andrea Bocelli", ["andrea bocelli", "bocelli"]],
  ["Eduardo De Crescenzo", ["de crescenzo eduardo", "eduardo de crescenzo"]],
  ["Riccardo Cocciante", ["riccardo cocciante"]],
  ["Claudio Baglioni", ["claudio baglioni"]],
  ["Antonello Venditti", ["antonello venditti"]],
  ["Pino Donaggio", ["pino donaggio"]],
  ["Ornella Vanoni", ["ornella vanoni"]],
  ["Rosa Balistreri", ["rosa balistreri"]],
  ["Gianna Nannini", ["gianna nannini"]],
  ["Massimo Ranieri", ["massimo ranieri"]],
  ["Luigi Tenco", ["luigi tenco"]],
  ["Adriano Celentano", ["celentano"]],
  ["Matia Bazar", ["matia bazar"]],
  ["Achille Lauro", ["achille lauro"]],
  ["John Lennon", ["john lennon"]],
  ["Bob Marley", ["bob marley"]],
  ["Simon & Garfunkel", ["simon garfunkel"]],
  ["Ed Sheeran", ["ed sheeran"]],
  ["Elton John", ["elton john"]],
  ["Richard Clayderman", ["richard clayderman"]],
  ["Ernesto Cortazar", ["ernesto cortazar"]],
  ["Yann Tiersen", ["yann tiersen"]],
  ["Ennio Morricone", ["ennio morricone"]],
  ["Nino Rota", ["nino rota"]],
  ["Mikael Tariverdiev", ["mtariverdiev"]],
  ["Frédéric Chopin", ["chopin"]],
  ["Ludwig van Beethoven", ["beethoven"]],
  ["Wolfgang Amadeus Mozart", ["mozart"]],
  ["Johann Sebastian Bach", ["bach"]],
  ["Claude Debussy", ["debussy"]],
  ["Erik Satie", ["satie"]],
  ["Muzio Clementi", ["clementi"]],
  ["Pyotr Ilyich Tchaikovsky", ["tchaikovsky"]],
  ["George Frideric Handel", ["handel"]],
  ["Felix Mendelssohn", ["mendelssohn"]],
  ["Edward Elgar", ["edward elgar"]],
  ["Scott Joplin", ["scott joplin"]],
  ["Johann Pachelbel", ["pachelbel"]],
  ["Franz Schubert", ["schubert"]],
  ["Franz Liszt", ["liszt", "lizst"]],
];

const KNOWN_TITLES = new Map(Object.entries({
  "adesso tu": "Eros Ramazzotti",
  agnese: "Ivan Graziani",
  "air on the g": "Johann Sebastian Bach",
  albachiara: "Vasco Rossi",
  "almeno tu nelluniverso": "Mia Martini",
  "almeno tu nell universo": "Mia Martini",
  "amore che vieni amore che vai": "Fabrizio De André",
  ancora: "Eduardo De Crescenzo",
  andrea: "Fabrizio De André",
  angeli: "Vasco Rossi",
  "gli angeli": "Vasco Rossi",
  "anima fragile": "Vasco Rossi",
  "brucia la terra": "Nino Rota",
  bwv772: "Johann Sebastian Bach",
  "canon in d": "Johann Pachelbel",
  caruso: "Lucio Dalla",
  "cinque giorni": "Michele Zarrillo",
  "comunque bella": "Lucio Battisti",
  "cu ti lu dissi": "Rosa Balistreri",
  disamistade: "Fabrizio De André",
  "domenica bestiale": "Fabio Concato",
  "e dimmi che non vuoi morire": "Patty Pravo",
  emozioni: "Lucio Battisti",
  generale: "Francesco De Gregori",
  "gli uomini non cambiano": "Mia Martini",
  "gran valzer il gattopardo": "Nino Rota",
  "in te": "Nek",
  "jenny e pazza": "Vasco Rossi",
  habanera: "Georges Bizet",
  "ho visto nina volare": "Fabrizio De André",
  "i giardini di marzo": "Lucio Battisti",
  "il mio canto libero": "Lucio Battisti",
  "il piccolo principe": "Mikael Tariverdiev",
  imagine: "John Lennon",
  "io vorrei non vorrei": "Lucio Battisti",
  "l appuntamento": "Ornella Vanoni",
  "l arcobaleno": "Adriano Celentano",
  "la canzone di marinella": "Fabrizio De André",
  "la guerra di piero": "Fabrizio De André",
  "la valse damelie": "Yann Tiersen",
  "la voce del silenzio": "Andrea Bocelli",
  "le vent le cri": "Ennio Morricone",
  "beethovens silence": "Ernesto Cortazar",
  "gocce di memoria": "Giorgia",
  "gnossienne no 1": "Erik Satie",
  "io vorrei non vorrei": "Lucio Battisti",
  "la prima cosa bella": "Nicola Di Bari",
  "la cura": "Franco Battiato",
  "la vita e adesso": "Claudio Baglioni",
  "love of my life": "Queen",
  "lugano addio": "Ivan Graziani",
  "marcha nupcial": "Felix Mendelssohn",
  "maledetta primavera": "Loretta Goggi",
  margherita: "Riccardo Cocciante",
  "married life from up": "Michael Giacchino",
  "mazurka op67 no4": "Frédéric Chopin",
  "mi ritorna in mente": "Lucio Battisti",
  "mille giorni di te e di me": "Claudio Baglioni",
  "minuet in g minor": "Johann Sebastian Bach",
  minuetto: "Mia Martini",
  morna: "Vinicio Capossela",
  "no woman no cry": "Bob Marley",
  "non e francesca": "Lucio Battisti",
  "non e l amore che va via": "Vinicio Capossela",
  "notte prima degli esami": "Antonello Venditti",
  "october autumn song": "Pyotr Ilyich Tchaikovsky",
  "ovunque proteggi": "Vinicio Capossela",
  "ovunque sarai": "Irama",
  passacaglia: "George Frideric Handel",
  "pena del alma": "Vinicio Capossela",
  "pensieri e parole": "Lucio Battisti",
  perfect: "Ed Sheeran",
  "piano man": "Billy Joel",
  rimmel: "Francesco De Gregori",
  "river flows in you": "Yiruma",
  sally: "Vasco Rossi",
  "sally accompagnamento": "Vasco Rossi",
  "sally melodia accompagnamento": "Vasco Rossi",
  "salut d amour": "Edward Elgar",
  "scivola vai via": "Vinicio Capossela",
  "serenade standchen": "Franz Schubert",
  "si e spento il sole": "Adriano Celentano",
  "solo tu": "Matia Bazar",
  "sonate no 8": "Ludwig van Beethoven",
  "stupido hotel": "Vasco Rossi",
  "the entertainer": "Scott Joplin",
  "the feather theme": "Alan Silvestri",
  "moonlight sonata i": "Ludwig van Beethoven",
  "nocturne in c sharp minor": "Frédéric Chopin",
  "nocturne in f minor op 55 no 1": "Frédéric Chopin",
  "nocturne no 20 in c minor": "Frédéric Chopin",
  "opus 27 no 2 moonlight sonata 1st movement": "Ludwig van Beethoven",
  "moonlight sonata piano sonata 14": "Ludwig van Beethoven",
  "op69 no2": "Frédéric Chopin",
  roberta: "Peppino Di Capri",
  "se telefonando": "Mina",
  "the sound of silence": "Simon & Garfunkel",
  "the godfather": "Nino Rota",
  "un estate italiana": "Gianna Nannini",
  "vedrai vedrai": "Luigi Tenco",
  ventanni: "Massimo Ranieri",
  "viennese sonatina no 5 in f major adagio": "Wolfgang Amadeus Mozart",
  "waltz in a minore": "Frédéric Chopin",
  "waltz opus 69 no 1 in a major": "Frédéric Chopin",
  "wedding march": "Felix Mendelssohn",
  "waltz of the flowers": "Pyotr Ilyich Tchaikovsky",
}));

const VARIANT_WORDS = new Set(["filtered", "piano", "easy", "version", "short", "solo", "v2", "v3"]);

export function inferArtist({ title = "", fileName = "" } = {}) {
  for (const value of [title, fileName]) {
    const normalized = ` ${key(value)} `;
    let best = null;
    for (const [artist, aliases] of EXPLICIT_ARTISTS) {
      for (const alias of aliases) {
        const at = normalized.lastIndexOf(` ${alias} `);
        if (at >= 0 && (!best || at > best.at || (at === best.at && alias.length > best.length))) {
          best = { artist, at, length: alias.length };
        }
      }
    }
    if (best) return best.artist;
  }

  for (const value of [title, fileName]) {
    const words = key(value).split(" ").filter(Boolean);
    while (words.length && VARIANT_WORDS.has(words.at(-1))) words.pop();
    const artist = KNOWN_TITLES.get(words.join(" "));
    if (artist) return artist;
  }
  return "";
}
