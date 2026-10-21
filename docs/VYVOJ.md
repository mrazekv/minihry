# Vývoj a nasazení miniHer

[Zpět na přehled aplikace](../README.md)

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
npm run test:practice
npm run test:text
npm run test:year
npm run test:procession
npm run test:validity
npm run test:pwa
```

`test:practice` projde obě obtížnosti tří obrázkových her: přípravu sakristie, hledání vetřelce a plánek kostela. Ověřuje opravy odpovědí, dokončení, restart, ovládání klávesnicí, přetahování myší i dotykem včetně zrušení a spuštění offline.

`test:text` kontroluje obě velikosti písma na všech stránkách a v rozehraných hrách při šířkách 320–1280 px, ukládání volby, načtení starších předvoleb a obnovení výchozího nastavení.

`test:year` projde kruh liturgického roku a režim „Co následuje?“ na všech třech úrovních. Ověřuje oba úseky mezidobí, návrat od posledního kroku k adventu, opravy odpovědí, myš, dotyk, klávesnici, restart a offline načtení. Kruh vyjadřuje pořadí, nikoliv skutečnou délku období; třetí úroveň obsahuje vybrané svátky a slavnosti.

Kruh se doplňuje postupně od adventu: aktivní je vždy jen následující místo. Hráč pro něj vybírá kartičku z nabídky klepnutím nebo přetažením, neodhaduje číselnou pozici náhodně zadané slavnosti.

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

Hra „Drž krok!“ (`/pruvod`) spojuje sestavení řad vstupního průvodu s vedením celé skupiny k oltáři. Lehká úroveň má tři řady, těžší přidává kadidlo a úzké místo. Pořadí vychází z jednoduchého průvodu bez jáhna a dalších kněží; kříž a dvě svíce tvoří jednu řadu. Akční část podporuje dotyk, tlačítka a klávesnici, dvě zastavení a pokračování po chybě. Při přepnutí okna se pozastaví.

`npm run test:procession` ověřuje přetahování myší i dotykem, opravy pořadí, celý průchod oběma cestami, zpomalení, zastavení, pozastavení, restart a offline načtení. Čas animace je v testu řízený přes `requestAnimationFrame`; produkční hra nemá testovací rozhraní. Pravidla pohybu a dosažitelnost cíle ověřují také jednotkové testy.
