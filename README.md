# miniHry

Malé hry pro ministranty. Responzivní aplikace v češtině pro mobil, tablet i počítač, bez účtů, reklam, analytiky a backendu. Původní schválený vizuální podklad zůstává ve složce `navrh/`.

## Lokální spuštění

Potřebuješ Node.js 22.12 nebo novější (doporučeno Node 22 LTS) a npm.

```sh
npm ci
npm run dev
```

Otevři adresu vypsanou Vite, obvykle http://127.0.0.1:5173/. Pro kontrolu skutečného offline režimu použij produkční sestavení:

```sh
npm run build
npm run preview
```

## Hry

- Pexeso: 4, 6 nebo 10 dvojic; dva obrázky, nebo obrázek a název.
- Poznávačka: 10 otázek, tři obtížnosti, obrázek → název i název → obrázek. Chybná odpověď umožní nový pokus.
- Řazení mše: čtyři hlavní části, osm zastavení nebo podrobná bohoslužba slova v neděli. Kartičky lze přesouvat myší i dotykem za úchyt nebo dostupnými šipkami; Escape přetahování zruší.
- Liturgický rok: tři úrovně — základní přehled, rok s velikonočním triduem a 16 významných dnů od první adventní neděle po Krista Krále. Nejvyšší úroveň obsahuje např. Zjevení a Křest Páně, Popeleční středu, Květnou neděli, Nanebevstoupení, Letnice, Nejsvětější Trojici, Boží tělo, Nanebevzetí Panny Marie a Všechny svaté. Dvě části mezidobí jsou rozlišeny. Karty používají základní liturgické barvy s textovým názvem; triduum má vícebarevné označení, protože jeho obřady nemají jednu společnou barvu.
- Latina: 4, 6 nebo 8 dvojic podle obtížnosti.
- Cesta ke kostelu: skákání přes kaluže, dvě rychlosti, pauza, tři pokusy. Ovládání tlačítkem, klepnutím na plátno, mezerníkem nebo šipkou nahoru. P/Escape pozastaví hru; při skrytí stránky se hra automaticky pozastaví.

Slovníček obsahuje 26 předmětů se společnými SVG kresbami. Vyhledávání nerozlišuje diakritiku a velikost písmen. Naučné hry nemají časový limit ani omezení počtu opakování. Obtížnost a herní režim se vybírají přímo tlačítky, bez rozbalovacích nabídek.

## Architektura

Vue 3 + TypeScript + Vite; Vue Router používá hashové adresy (`/#/pexeso`), takže hosting nepotřebuje přesměrování.

```text
src/
  components/        společné prvky her a obrázky
  views/             nabídka, slovníček, informace a nastavení
  games/             samostatné minihry a fyzika běžce
  content/           předměty, latinské výrazy, pořadí a zdroje
  assets/            vlastní SVG sprity
  lib/               čistá herní pravidla, fokus a offline podpora
  storage/           lokální nastavení
  styles/            společný vzhled a responzivita
public/              logo, instalační ikony a PWA manifest
scripts/             vytvoření offline cache při sestavení
tests/               testy pravidel, obsahu, funkčnosti a validity
```

Pro přidání předmětu přidej záznam do `src/content/items.ts` a stejnojmenný symbol do `src/assets/items.svg`. Obrázky používají souřadnice `0 0 160 160`. Hry i slovníček čerpají ze stejného obsahu. Zdroje liturgického obsahu jsou v `src/content/sources.ts` a na stránce O aplikaci.

## Ověření

```sh
npm test
npm run typecheck
npm run build
```

Browser testy potřebují běžící `npm run preview` a lokální Google Chrome. Nepotřebují instalaci Playwrightu ani další služby.

```sh
npm run test:browser
npm run test:validity
npm run test:pwa
```

`CHROME_BIN` může určit jinou cestu k Chrome/Chromiu (výchozí `/usr/bin/google-chrome`). `TEST_BASE_URL` nastavuje adresu produkčního serveru; výchozí je http://127.0.0.1:4173/. Testy ověřují dokončení a restart všech her, chybné odpovědi, mobilní varianty, slovníček, offline načtení, klávesnicovou navigaci, dostupná jména ovladačů a rozložení při šířkách 320–1280 px. Browser testy běží s izolovaným dočasným profilem, který po dokončení smažou. `test:pwa` si sám spustí dočasný server s kopií `dist/`; ověřuje první instalaci, skutečný přechod mezi verzemi, ochranu rozehrané hry a offline načtení pod `/minihry/`.

## GitHub Pages

Připravený workflow `.github/workflows/pages.yml` po pushi do `main` spustí testy, vytvoří aplikaci a publikuje **pouze `dist/`**. V repozitáři nastav **Settings → Pages → Source → GitHub Actions**. Workflow používá cestu `/<název-repozitáře>/`; pro repozitář typu `uzivatel.github.io` uprav `VITE_BASE_PATH` na `/`.

Pro samostatné ruční sestavení s pevnou cestou:

```sh
VITE_BASE_PATH=/minihry/ npm run build
```

Na vlastní hosting stačí nahrát obsah `dist/`. Bez nastavení `VITE_BASE_PATH` se používají relativní cesty a sestavení lze umístit do podadresáře. Pro offline režim a instalaci PWA musí být web na HTTPS (nebo localhost při vývoji).

## Offline a aktualizace

Produkční sestavení generuje `sw.js` s verzovaným seznamem všech místních souborů. První návštěva potřebuje připojení; připravenost potvrzuje text „Připraveno na hraní offline“ v patičce. Potom fungují offline všechny hry, slovníček i obrázky. Odkazy na zdroje na stránce O aplikaci připojení potřebují. Kořenová adresa aplikace a `index.html` používají stejnou položku cache, i při běžném požadavku `fetch`. Chybějící položky se za připojení obnovují; při výpadku sítě a neúplné cache se vrací chybová odpověď 503 s instrukcí pro opětovné načtení, nikoliv odmítnutý FetchEvent.

Nová verze čeká na potvrzení tlačítkem „Aktualizovat“, dostupným mimo hry, aby se nepřerušilo rozehrané kolo. Mazání starých cache se omezuje na cache této aplikace v jejím rozsahu URL. Při lokálním vývoji se service worker neregistruje; po předchozím testování produkční verze na stejném portu může být nutné starou registraci odstranit přes DevTools → Application → Service Workers.

## Soukromí a další rozvoj

V `localStorage` je pouze nastavení obtížnosti poznávačky a omezení animací, nikoliv odpovědi nebo historie her. Nedostupné úložiště neblokuje hraní. Veškeré fonty, kresby a logo se načítají lokálně. Web nepotřebuje API klíče ani proměnné s tajnými údaji.

Android balíček zatím není součástí projektu. Později lze produkční web přidat do projektu Capacitoru a využít stejné herní moduly. Současné soubory nejsou nikam publikovány samotným lokálním sestavením.
