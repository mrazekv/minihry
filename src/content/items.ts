export interface LiturgicalItem {
  id: string
  name: string
  description: string
  note?: string
  level: 1 | 2 | 3
}

export const items: LiturgicalItem[] = [
  {
    "id": "chalice",
    "name": "Kalich",
    "description": "Nádoba pro víno, které se při mši stává Kristovou krví.",
    "note": "Při přípravě darů se do vína v kalichu přidává také trocha vody.",
    "level": 1
  },
  {
    "id": "paten",
    "name": "Patena",
    "description": "Plochá miska nebo talířek pro hostii při slavení mše.",
    "level": 1
  },
  {
    "id": "chasuble",
    "name": "Ornát",
    "description": "Vrchní liturgické roucho kněze při mši.",
    "note": "Barva ornátu napovídá, jaké období nebo svátek slavíme: v adventu bývá fialový, o Vánocích bílý.",
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
    "note": "Barevné záložky pomáhají rychle najít správnou modlitbu. Před mší je dobré připravit je s knězem.",
    "level": 1
  },
  {
    "id": "veil",
    "name": "Kalichové velum",
    "description": "Látková pokrývka kalicha.",
    "note": "Kalichové velum může být vždy bílé, i když má ornát jinou liturgickou barvu.",
    "level": 2
  },
  {
    "id": "thurible",
    "name": "Kadidelnice",
    "description": "Nádoba na žhavé uhlíky a kadidlo.",
    "note": "Stoupající dým kadidla je znamením modlitby, která se obrací k Bohu.",
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
    "note": "Při přípravě darů podává ministrant nejprve konvičku s vínem a potom s vodou.",
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
    "note": "V průvodu může ministrant nést kříž na dlouhé tyči. Tehdy mu říkáme procesní kříž.",
    "level": 1
  },
  {
    "id": "alb",
    "name": "Alba",
    "description": "Dlouhé bílé liturgické roucho.",
    "note": "Albu mohou při bohoslužbě nosit kněží, jáhni i ministranti.",
    "level": 1
  },
  {
    "id": "stole",
    "name": "Štóla",
    "description": "Pruh látky, znamení služby kněze nebo jáhna.",
    "note": "Kněz ji nosí kolem krku, jáhen šikmo z levého ramene k pravému boku.",
    "level": 2
  },
  {
    "id": "cincture",
    "name": "Cingulum",
    "description": "Provazový pás k přepásání alby.",
    "note": "Pokud alba dobře přiléhá sama o sobě, cingulum není potřeba.",
    "level": 2
  },
  {
    "id": "boat",
    "name": "Loďka",
    "description": "Nádobka na kadidlo se lžičkou.",
    "note": "Loďka se knězi podává otevřená, aby mohl pohodlně nabrat kadidlo.",
    "level": 2
  },
  {
    "id": "lavabo",
    "name": "Lavabo",
    "description": "Konvička a miska k umytí rukou kněze.",
    "note": "K lavabu patří také ručník. Jeden ministrant lije vodu na ruce kněze a druhý nabídne ručník.",
    "level": 2
  },
  {
    "id": "purificator",
    "name": "Purifikatorium",
    "description": "Bílá plátěná utěrka k otírání a čištění kalicha po přijímání.",
    "note": "Purifikatoriem se po přijímání obvykle otírá také patena.",
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
    "note": "Pluviál se používá také při liturgických průvodech.",
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
    "note": "Světlo u svatostánku připomíná, že je v něm přítomný Kristus v eucharistii.",
    "level": 2
  },
  {
    "id": "lectionary",
    "name": "Lekcionář",
    "description": "Kniha biblických čtení pro bohoslužbu.",
    "note": "Evangeliář je jiná kniha: obsahuje jen evangelia, kdežto lekcionář i ostatní biblická čtení.",
    "level": 2
  },
  {
    "id": "ambo",
    "name": "Ambon",
    "description": "Místo, odkud při bohoslužbě zaznívají biblická čtení a evangelium.",
    "note": "Z ambonu se přednáší také žalm. Patří k bohoslužbě slova stejně jako čtení.",
    "level": 1
  },
  {
    "id": "altar",
    "name": "Oltář",
    "description": "Stůl, na kterém se při mši slaví eucharistie.",
    "note": "Kněz na začátku a na konci mše uctívá oltář políbením.",
    "level": 1
  },
  {
    "id": "communion-bowl",
    "name": "Miska",
    "description": "Hlubší miska na hostie, které se při mši proměňují a podávají při přijímání.",
    "level": 2
  },
  {
    "id": "cassock",
    "name": "Klerika",
    "description": "Dlouhý oděv duchovních s rukávy a knoflíky vpředu, obvykle černý.",
    "level": 2
  },
  {
    "id": "zucchetto",
    "name": "Solideo",
    "description": "Malá kulatá čepička. Biskupské solideo na obrázku je fialové.",
    "note": "Barva napoví, kdo solideo nosí: biskup fialové, kardinál červené a papež bílé.",
    "level": 3
  },
  {
    "id": "mitre",
    "name": "Mitra",
    "description": "Slavnostní pokrývka hlavy biskupa se dvěma špičkami a dvěma stuhami vzadu.",
    "note": "Když se biskup modlí, mitru odkládá.",
    "level": 2
  },
  {
    "id": "crozier",
    "name": "Berla",
    "description": "Biskupská hůl se zahnutým koncem. Připomíná, že biskup pečuje o věřící jako pastýř o své stádo.",
    "level": 2
  },
  {
    "id": "rochet",
    "name": "Rocheta",
    "description": "Krátké bílé roucho s rukávy, které se obléká přes spodní oděv.",
    "note": "Na obrázcích si všimni délky: rocheta je krátká, zatímco alba sahá až ke kotníkům.",
    "level": 2
  },
  {
    "id": "server-cassock-collar",
    "name": "Komže a límec",
    "description": "Černá ministrantská sukně a černý límec. Spolu s bílou rochetou tvoří ministrantské oblečení.",
    "level": 1
  },
  {
    "id": "paschal-candle",
    "name": "Paškál",
    "description": "Velká velikonoční svíce s křížem, letopočtem a písmeny Α a Ω. Připomíná vzkříšeného Ježíše, světlo světa.",
    "note": "Α (alfa) a Ω (omega) jsou první a poslední písmeno řecké abecedy. Připomínají, že Kristus je začátek i konec.",
    "level": 2
  },
  {
    "id": "dalmatic",
    "name": "Dalmatika",
    "description": "Vrchní liturgické roucho jáhna. Od ornátu ji poznáš podle výrazných rukávů.",
    "note": "Jáhen si dalmatiku obléká přes albu a štólu.",
    "level": 3
  },
  {
    "id": "baptismal-font",
    "name": "Křtitelnice",
    "description": "Nádoba s vodou určená ke křtu. Křtem začíná křesťanský život.",
    "note": "Některé křtitelnice mají tekoucí vodu jako pramen. Připomíná nový život, který člověk dostává ve křtu.",
    "level": 1
  },
  {
    "id": "presiders-chair",
    "name": "Sedes",
    "description": "Sedadlo kněze, který předsedá bohoslužbě a vede společnou modlitbu.",
    "level": 2
  },
  {
    "id": "credence-table",
    "name": "Abak (abakus)",
    "description": "Přípravný stolek poblíž oltáře. Ministranti na něm mají nachystané nádoby a další věci potřebné ke mši.",
    "note": "Před mší si na abaku zkontroluj, že jsou konvičky i další potřebné věci připravené. Při službě je pak snadno najdeš.",
    "level": 2
  },
  {
    "id": "sanctuary-lamp",
    "name": "Věčné světlo",
    "description": "Lampička u svatostánku, která připomíná Kristovu přítomnost v eucharistii.",
    "note": "Když je ve svatostánku uchovávána eucharistie, svítí u něj světlo. Na našem obrázku má lampička červené sklo.",
    "level": 1
  },
  {
    "id": "clapper",
    "name": "Klepačka",
    "description": "Dřevěný nástroj, kterým ministrant vydává klapavý zvuk místo zvonění.",
    "note": "Používá se zejména o velikonočním triduu, když zvony a zvonky od Sláva na výsostech Bohu na Zelený čtvrtek až do stejného zpěvu při velikonoční vigilii mlčí.",
    "level": 2
  },
  {
    "id": "hand-towel",
    "name": "Ručník na ruce",
    "description": "Ručník, do kterého si kněz utírá ruce při jejich umývání po přípravě darů.",
    "note": "Ručník patří k lavabu. K otírání kalicha slouží jiná utěrka: purifikatorium.",
    "level": 1
  }
]
