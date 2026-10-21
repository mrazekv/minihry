export interface PreparationTask {
  id: string
  title: string
  hint: string
  required: string[]
  distractors: string[]
  explanation: string
  level: 1 | 2
}

export const preparationTasks: PreparationTask[] = [
  { id: 'incense', title: 'Připrav věci k okuřování.', hint: 'Potřebuješ nádobu na uhlíky a nádobku s kadidlem.', required: ['thurible', 'boat'], distractors: ['bell', 'cruets', 'aspergillum', 'missal'], explanation: 'Kadidlo se z loďky sype na žhavé uhlíky v kadidelnici.', level: 1 },
  { id: 'sprinkling', title: 'Připrav věci ke kropení svěcenou vodou.', hint: 'Vezmi nádobu s vodou a předmět, kterým kněz kropí.', required: ['holy-water-bucket', 'aspergillum'], distractors: ['thurible', 'boat', 'bell', 'ciborium'], explanation: 'Kropáč se namáčí do přenosné kropenky se svěcenou vodou.', level: 1 },
  { id: 'books', title: 'Nachystej obě knihy pro mši.', hint: 'Jedna obsahuje modlitby, druhá biblická čtení.', required: ['missal', 'lectionary'], distractors: ['pall', 'corporal', 'paten', 'veil'], explanation: 'Misál obsahuje modlitby a pokyny, lekcionář biblická čtení.', level: 1 },
  { id: 'server', title: 'Připrav ministrantské oblečení z našich obrázků.', hint: 'Černou sukni s límcem doplní krátké bílé roucho.', required: ['server-cassock-collar', 'rochet'], distractors: ['chasuble', 'mitre', 'stole', 'dalmatic'], explanation: 'Na našich obrázcích má ministrant černou sukni a límec s bílou rochetou. V některých farnostech se nosí alba.', level: 1 },
  { id: 'lavabo', title: 'Připrav věci k umývání rukou kněze před eucharistickou modlitbou.', hint: 'Na jednom obrázku už je konvička s miskou. Přidej utěrku na ruce.', required: ['lavabo', 'hand-towel'], distractors: ['purificator', 'corporal', 'boat', 'pall'], explanation: 'Po přípravě darů, před eucharistickou modlitbou, si kněz umývá ruce. K lavabu patří voda, miska a ručník na ruce. Purifikatorium slouží k otírání kalicha.', level: 1 },
  { id: 'priest', title: 'Připrav liturgické oblečení pro kněze na běžnou mši.', hint: 'Přes albu patří pruh látky kolem krku a vrchní roucho.', required: ['alb', 'stole', 'chasuble'], distractors: ['dalmatic', 'mitre', 'rochet', 'cope', 'zucchetto'], explanation: 'Kněz si ke mši obléká přes albu štólu a ornát. Cingulum a další doplňky se připravují podle potřeby.', level: 2 },
  { id: 'deacon', title: 'Připrav slavnostní oblečení jáhna včetně vrchního roucha.', hint: 'Jáhen má štólu šikmo a vrchní roucho s rukávy.', required: ['alb', 'stole', 'dalmatic'], distractors: ['chasuble', 'mitre', 'cope', 'rochet', 'zucchetto'], explanation: 'Jáhen nosí přes albu štólu a dalmatiku. Štólu má šikmo z levého ramene k pravému boku.', level: 2 },
  { id: 'bishop', title: 'Přijede biskup. Připrav mu oblečení a další věci, které používá při mši.', hint: 'K oblečení kněze přidej dvě pokrývky hlavy typické pro biskupa a předmět, který drží v ruce.', required: ['alb', 'stole', 'chasuble', 'zucchetto', 'mitre', 'crozier'], distractors: ['rochet', 'server-cassock-collar', 'cope'], explanation: 'Biskup má při mši albu, štólu a ornát, na hlavě fialové solideo a při některých částech mše také mitru. Používá také berlu, kterou drží v ruce. Pokrývky hlavy a berlu v určených chvílích odkládá.', level: 2 },
  { id: 'linens', title: 'Nachystej kalich tak, jak bývá připravený na oltáři.', hint: 'Ke kalichu patří plátno pod nádoby, utěrka na jeho otírání a pevný čtvercový kryt.', required: ['chalice', 'purificator', 'corporal', 'pall'], distractors: ['hand-towel', 'humeral-veil', 'boat', 'stole'], explanation: 'Připravili jsme kalich, purifikatorium, korporál a palu. Kalich stojí na rozloženém korporálu, purifikatorium slouží k jeho otírání a pala k zakrytí. Ručník na ruce má jiný účel.', level: 2 },
]

export interface OddTask {
  id: string
  question: string
  members: string[]
  odd: string
  explanation: string
  level: 1 | 2
}

export const oddTasks: OddTask[] = [
  { id: 'robes', question: 'Tři věci jsou roucha. Co mezi ně nepatří?', members: ['alb', 'chasuble', 'rochet'], odd: 'bell', explanation: 'Alba, ornát a rocheta se oblékají. Zvonek je předmět ke zvonění.', level: 1 },
  { id: 'vessels', question: 'Tři věci jsou nádoby pro eucharistii. Co mezi ně nepatří?', members: ['chalice', 'ciborium', 'communion-bowl'], odd: 'missal', explanation: 'Kalich, ciborium a miska jsou eucharistické nádoby. Misál je kniha.', level: 1 },
  { id: 'fabric', question: 'Tři věci jsou z látky. Co mezi ně nepatří?', members: ['corporal', 'purificator', 'stole'], odd: 'cruets', explanation: 'Korporál, purifikatorium a štóla jsou z látky. Konvičky jsou nádoby na tekutiny.', level: 1 },
  { id: 'wear', question: 'Tři věci si můžeš obléknout. Kterou si neoblékneš?', members: ['alb', 'rochet', 'server-cassock-collar'], odd: 'aspergillum', explanation: 'Kropáč se drží v ruce a používá ke kropení. Zbylé tři věci patří k oblečení.', level: 1 },
  { id: 'furniture', question: 'Tři věci patří k vybavení kostela jako nábytek. Co mezi ně nepatří?', members: ['altar', 'ambo', 'presiders-chair'], odd: 'paten', explanation: 'Oltář, ambon a sedes patří k zařízení kostela. Patena je malá eucharistická nádoba.', level: 1 },
  { id: 'bishop', question: 'Tři věci si biskup obléká nebo nasazuje. Kterou drží v ruce?', members: ['mitre', 'zucchetto', 'chasuble'], odd: 'crozier', explanation: 'Berlu biskup drží v ruce. Mitru, solideo a ornát má na sobě.', level: 2 },
  { id: 'clothing-fabric', question: 'Všechny čtyři věci jsou z látky. Která se neobléká?', members: ['chasuble', 'stole', 'cope'], odd: 'corporal', explanation: 'Ornát, štóla a pluviál se oblékají. Korporál se rozkládá na oltář pod eucharistické nádoby.', level: 2 },
  { id: 'deacon-dress', question: 'Tři věci patří k oblečení jáhna při slavnostní mši. Co mezi ně nepatří?', members: ['alb', 'stole', 'dalmatic'], odd: 'server-cassock-collar', explanation: 'Jáhen při slavnostní mši nosí albu, štólu a dalmatiku. Komže a límec na našem obrázku patří k ministrantskému oblečení.', level: 2 },
  { id: 'hands', question: 'Tři věci slouží k umytí a utření rukou. Co mezi ně nepatří?', members: ['lavabo', 'hand-towel', 'cruets'], odd: 'thurible', explanation: 'Voda z konvičky, miska a ručník pomáhají při mytí rukou. Kadidelnice slouží k okuřování.', level: 2 },
  { id: 'eucharist', question: 'Tři věci slouží k uchovávání nebo vystavení eucharistie. Co mezi ně nepatří?', members: ['ciborium', 'monstrance', 'tabernacle'], odd: 'holy-water-bucket', explanation: 'Ciborium a svatostánek slouží k uchovávání eucharistie, monstrance k jejímu vystavení. Kropenka obsahuje svěcenou vodu.', level: 2 },
]

// This is one illustrative layout, not a required arrangement for every church.
export const churchPlaces = [
  { id: 'tabernacle', name: 'Svatostánek', x: 50, y: 10, clue: 'Hledej místo uchovávání eucharistie se světlem vedle něj.' },
  { id: 'presiders-chair', name: 'Sedes', x: 77, y: 22, clue: 'Hledej sedadlo kněze, který vede bohoslužbu.' },
  { id: 'altar', name: 'Oltář', x: 50, y: 38, clue: 'Hledej stůl pro slavení eucharistie uprostřed presbytáře.' },
  { id: 'ambo', name: 'Ambon', x: 20, y: 40, clue: 'Hledej místo, ze kterého se čte Boží slovo.' },
  { id: 'credence-table', name: 'Abak', x: 23, y: 19, clue: 'Hledej menší stolek s připravenými konvičkami.' },
  { id: 'baptismal-font', name: 'Křtitelnice', x: 85, y: 51, clue: 'Hledej nádobu s vodou určenou ke křtu.' },
] as const
