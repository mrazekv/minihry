export interface SeasonColor {
  className: string
  label: string
  explanation: string
}
/** Barvy období a vybraných slavení (IGMR 346 a český liturgický kalendář). */
export const seasonColors: Record<string, SeasonColor> = {
  advent: { className: 'season-violet', label: 'Fialová', explanation: 'Základní barvou adventu je fialová.' },
  christmas: { className: 'season-white', label: 'Bílá', explanation: 'Vánoční doba má bílou liturgickou barvu.' },
  'ordinary-first': { className: 'season-green', label: 'Zelená', explanation: 'Základní barvou mezidobí je zelená.' },
  lent: { className: 'season-violet', label: 'Fialová', explanation: 'Základní barvou postní doby je fialová.' },
  triduum: { className: 'season-triduum', label: 'Barva podle dne', explanation: 'Večerní mše na Zelený čtvrtek a velikonoční vigilie mají bílou barvu, velkopáteční obřady červenou. Triduum nemá jednu společnou barvu.' },
  easter: { className: 'season-white', label: 'Bílá', explanation: 'Základní barvou velikonoční doby je bílá; na Seslání Ducha svatého je červená.' },
  'advent-sunday': { className: 'season-violet', label: 'Fialová', explanation: 'První adventní neděle má fialovou barvu.' },
  'christmas-day': { className: 'season-white', label: 'Bílá', explanation: 'Narození Páně slavíme v bílé barvě.' },
  epiphany: { className: 'season-white', label: 'Bílá', explanation: 'Slavnost Zjevení Páně má bílou barvu.' },
  baptism: { className: 'season-white', label: 'Bílá', explanation: 'Svátek Křtu Páně má bílou barvu.' },
  'ash-wednesday': { className: 'season-violet', label: 'Fialová', explanation: 'Popeleční středa má fialovou barvu.' },
  'palm-sunday': { className: 'season-red', label: 'Červená', explanation: 'Na Květnou neděli je barva červená, i když probíhá postní doba.' },
  'maundy-thursday': { className: 'season-white', label: 'Bílá', explanation: 'Večerní mše na památku Večeře Páně má bílou barvu.' },
  'good-friday': { className: 'season-red', label: 'Červená', explanation: 'Obřady Velkého pátku mají červenou barvu.' },
  'easter-sunday': { className: 'season-white', label: 'Bílá', explanation: 'Slavnost Zmrtvýchvstání Páně má bílou barvu.' },
  ascension: { className: 'season-white', label: 'Bílá', explanation: 'Slavnost Nanebevstoupení Páně má bílou barvu.' },
  pentecost: { className: 'season-red', label: 'Červená', explanation: 'Na Seslání Ducha svatého je barva červená, na rozdíl od základní bílé velikonoční barvy.' },
  trinity: { className: 'season-white', label: 'Bílá', explanation: 'Slavnost Nejsvětější Trojice má bílou barvu.' },
  'corpus-christi': { className: 'season-white', label: 'Bílá', explanation: 'Slavnost Těla a krve Páně má bílou barvu.' },
  assumption: { className: 'season-white', label: 'Bílá', explanation: 'Slavnost Nanebevzetí Panny Marie má bílou barvu.' },
  'all-saints': { className: 'season-white', label: 'Bílá', explanation: 'Slavnost Všech svatých má bílou barvu.' },
  'christ-king': { className: 'season-white', label: 'Bílá', explanation: 'Slavnost Ježíše Krista Krále má bílou barvu.' },
  'ordinary-second': { className: 'season-green', label: 'Zelená', explanation: 'Základní barvou mezidobí je zelená.' },
}
