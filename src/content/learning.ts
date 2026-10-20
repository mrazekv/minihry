export interface OrderStep {
  id: string
  label: string
  description: string
}
export interface LearningOrder {
  id: string
  title: string
  steps: OrderStep[]
}

/** Základní průběh římské mše; zvláštní dny mohou mít odlišnosti. */
export const massOrders: LearningOrder[] = [
  {
    id: 'mass-basic', title: 'Čtyři hlavní části', steps: [
      { id: 'entrance', label: 'Vstupní obřady', description: 'Společně se připravujeme na slavení.' },
      { id: 'word', label: 'Bohoslužba slova', description: 'Nasloucháme Písmu a odpovídáme modlitbou.' },
      { id: 'eucharist', label: 'Slavení eucharistie', description: 'Přinášíme dary, děkujeme a přijímáme.' },
      { id: 'dismissal', label: 'Závěrečné obřady', description: 'Po požehnání jsme posláni do života.' },
    ],
  },
  {
    id: 'mass-middle', title: 'Osm zastavení', steps: [
      { id: 'entrance', label: 'Vstupní obřady', description: 'Zahajujeme společné slavení.' },
      { id: 'readings', label: 'Čtení a evangelium', description: 'Posloucháme Boží slovo.' },
      { id: 'homily', label: 'Homilie', description: 'Kněz nebo jáhen vysvětluje slyšené slovo.' },
      { id: 'intercessions', label: 'Přímluvy', description: 'Prosíme za církev i svět.' },
      { id: 'gifts', label: 'Příprava darů', description: 'Připravují se chléb a víno.' },
      { id: 'prayer', label: 'Eucharistická modlitba', description: 'Děkujeme; její součástí je proměňování.' },
      { id: 'communion', label: 'Obřady přijímání', description: 'Modlíme se Otčenáš a přijímáme eucharistii.' },
      { id: 'dismissal', label: 'Závěrečné obřady', description: 'Přijímáme požehnání a poslání.' },
    ],
  },
  {
    id: 'mass-detail', title: 'Bohoslužba slova v neděli', steps: [
      { id: 'first-reading', label: 'První čtení', description: 'Nasloucháme prvnímu úryvku z Bible.' },
      { id: 'psalm', label: 'Žalm', description: 'Na čtení odpovídáme zpěvem žalmu.' },
      { id: 'second-reading', label: 'Druhé čtení', description: 'Následuje úryvek z Nového zákona.' },
      { id: 'acclamation', label: 'Zpěv před evangeliem', description: 'Obvykle Aleluja; v postní době jiný zpěv.' },
      { id: 'gospel', label: 'Evangelium', description: 'Čte je jáhen nebo kněz.' },
      { id: 'homily', label: 'Homilie', description: 'Pomáhá porozumět Božímu slovu.' },
      { id: 'creed', label: 'Vyznání víry', description: 'Společně vyznáváme, čemu věříme.' },
      { id: 'intercessions', label: 'Přímluvy', description: 'Prosíme za potřeby ostatních.' },
    ],
  },
]

/** Řadí se od adventu. I a II jsou učební rozlišení dvou úseků mezidobí. */
const yearSteps: OrderStep[] = [
  { id: 'advent', label: 'Advent', description: 'Očekáváme příchod Ježíše.' },
  { id: 'christmas', label: 'Doba vánoční', description: 'Slavíme Ježíšovo narození až do svátku Křtu Páně.' },
  { id: 'ordinary-first', label: 'Mezidobí I', description: 'Od pondělí po Křtu Páně do úterý před Popeleční středou.' },
  { id: 'lent', label: 'Doba postní', description: 'Od Popeleční středy do začátku večerní mše na Zelený čtvrtek.' },
  { id: 'triduum', label: 'Velikonoční triduum', description: 'Od večerní mše na Zelený čtvrtek do večera Neděle zmrtvýchvstání.' },
  { id: 'easter', label: 'Doba velikonoční', description: 'Slavíme vzkříšení až do Seslání Ducha svatého; začíná už velikonoční vigilií během tridua.' },
  { id: 'ordinary-second', label: 'Mezidobí II', description: 'Od pondělí po Seslání Ducha svatého do soboty před adventem.' },
]

export const yearOrders: LearningOrder[] = [
  {
    id: 'year-basic', title: 'Od adventu k adventu',
    steps: yearSteps.filter(step => step.id !== 'triduum').map(step => step.id === 'easter'
      ? { ...step, label: 'Velikonoce a doba velikonoční', description: 'Slavíme Ježíšovu smrt a vzkříšení; doba velikonoční končí Sesláním Ducha svatého.' }
      : step),
  },
  { id: 'year-detail', title: 'Rok s velikonočním triduem', steps: yearSteps },
]

export interface LatinPair {
  id: string
  latin: string
  czech: string
  level: 1 | 2 | 3
}

// Krátké slovníkové významy; u odpovědí používáme české znění mešního řádu.
// Kyrie je řecky, proto patří do případné samostatné sady a zde není.
export const latinPairs: LatinPair[] = [
  { id: 'pax', latin: 'Pax', czech: 'Pokoj', level: 1 },
  { id: 'deus', latin: 'Deus', czech: 'Bůh', level: 1 },
  { id: 'pater', latin: 'Pater', czech: 'Otec', level: 1 },
  { id: 'filius', latin: 'Filius', czech: 'Syn', level: 1 },
  { id: 'sanctus', latin: 'Sanctus', czech: 'Svatý', level: 1 },
  { id: 'dominus', latin: 'Dominus', czech: 'Pán', level: 1 },
  { id: 'agnus-dei', latin: 'Agnus Dei', czech: 'Beránek Boží', level: 2 },
  { id: 'oremus', latin: 'Oremus', czech: 'Modleme se', level: 2 },
  { id: 'deo-gratias', latin: 'Deo gratias', czech: 'Bohu díky', level: 2 },
  { id: 'dominus-vobiscum', latin: 'Dominus vobiscum', czech: 'Pán s vámi', level: 2 },
  { id: 'pater-noster', latin: 'Pater noster', czech: 'Otče náš', level: 2 },
  { id: 'spiritus-sanctus', latin: 'Spiritus Sanctus', czech: 'Duch svatý', level: 2 },
  { id: 'gloria', latin: 'Gloria in excelsis Deo', czech: 'Sláva na výsostech Bohu', level: 3 },
  { id: 'laudamus', latin: 'Laudamus te', czech: 'Chválíme tě', level: 3 },
  { id: 'miserere', latin: 'Miserere nobis', czech: 'Smiluj se nad námi', level: 3 },
]
