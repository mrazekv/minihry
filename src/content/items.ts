export interface LiturgicalItem {
  id: string
  name: string
  description: string
  level: 1 | 2 | 3
}

export const items: LiturgicalItem[] = [
  {
    "id": "chalice",
    "name": "Kalich",
    "description": "Nádoba pro víno, které se při mši stává Kristovou krví.",
    "level": 1
  },
  {
    "id": "paten",
    "name": "Patena",
    "description": "Miska pro hostii při slavení mše.",
    "level": 1
  },
  {
    "id": "chasuble",
    "name": "Ornát",
    "description": "Vrchní liturgické roucho kněze při mši.",
    "level": 1
  },
  {
    "id": "corporal",
    "name": "Korporál",
    "description": "Čtvercové plátno pod eucharistickými nádobami na oltáři.",
    "level": 2
  },
  {
    "id": "bell",
    "name": "Zvonek",
    "description": "Zvoněním upozorňuje na důležité chvíle mše.",
    "level": 1
  },
  {
    "id": "missal",
    "name": "Misál",
    "description": "Kniha modliteb a pokynů pro slavení mše.",
    "level": 1
  },
  {
    "id": "veil",
    "name": "Kalichové velum",
    "description": "Látková pokrývka kalicha.",
    "level": 2
  },
  {
    "id": "thurible",
    "name": "Kadidelnice",
    "description": "Nádoba na žhavé uhlíky a kadidlo.",
    "level": 2
  },
  {
    "id": "ciborium",
    "name": "Ciborium",
    "description": "Nádoba s víčkem pro uchovávání a podávání eucharistie.",
    "level": 2
  },
  {
    "id": "monstrance",
    "name": "Monstrance",
    "description": "Slouží k vystavení eucharistie při adoraci.",
    "level": 2
  },
  {
    "id": "cruets",
    "name": "Konvičky",
    "description": "Přináší se v nich víno a voda.",
    "level": 1
  },
  {
    "id": "candle",
    "name": "Svíce",
    "description": "Její světlo doprovází modlitbu a bohoslužbu.",
    "level": 1
  },
  {
    "id": "cross",
    "name": "Kříž",
    "description": "Připomíná Ježíšovu smrt a jeho lásku k nám.",
    "level": 1
  },
  {
    "id": "alb",
    "name": "Alba",
    "description": "Dlouhé bílé liturgické roucho.",
    "level": 1
  },
  {
    "id": "stole",
    "name": "Štóla",
    "description": "Pruh látky, znamení služby kněze nebo jáhna.",
    "level": 2
  },
  {
    "id": "cincture",
    "name": "Cingulum",
    "description": "Provazový pás k přepásání alby.",
    "level": 2
  },
  {
    "id": "boat",
    "name": "Loďka",
    "description": "Nádobka na kadidlo se lžičkou.",
    "level": 2
  },
  {
    "id": "lavabo",
    "name": "Lavabo",
    "description": "Konvička a miska k umytí rukou kněze.",
    "level": 2
  },
  {
    "id": "purificator",
    "name": "Purifikatorium",
    "description": "Plátěná utěrka k otírání kalicha.",
    "level": 3
  },
  {
    "id": "pall",
    "name": "Pala",
    "description": "Vyztužená čtvercová pokrývka kalicha.",
    "level": 3
  },
  {
    "id": "cope",
    "name": "Pluviál",
    "description": "Slavnostní liturgický plášť.",
    "level": 3
  },
  {
    "id": "humeral-veil",
    "name": "Náramenní velum",
    "description": "Pokrývá ramena při nesení eucharistie a požehnání monstrancí.",
    "level": 3
  },
  {
    "id": "aspergillum",
    "name": "Kropáč",
    "description": "Slouží ke kropení svěcenou vodou.",
    "level": 2
  },
  {
    "id": "holy-water-bucket",
    "name": "Kropenka",
    "description": "Přenosná nádoba se svěcenou vodou pro kropení.",
    "level": 3
  },
  {
    "id": "tabernacle",
    "name": "Svatostánek",
    "description": "Místo, kde se uchovává eucharistie.",
    "level": 2
  },
  {
    "id": "lectionary",
    "name": "Lekcionář",
    "description": "Kniha biblických čtení pro bohoslužbu.",
    "level": 2
  }
]
