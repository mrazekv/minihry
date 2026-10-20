export interface SeasonColor {
  className: string
  label: string
  explanation: string
}
/** Základní barvy období (IGMR 346); jednotlivé svátky mohou mít jinou barvu. */
export const seasonColors: Record<string, SeasonColor> = {
  advent: { className: 'season-violet', label: 'Fialová', explanation: 'Základní barvou adventu je fialová.' },
  christmas: { className: 'season-white', label: 'Bílá', explanation: 'Vánoční doba má bílou liturgickou barvu.' },
  'ordinary-first': { className: 'season-green', label: 'Zelená', explanation: 'Základní barvou mezidobí je zelená.' },
  lent: { className: 'season-violet', label: 'Fialová', explanation: 'Základní barvou postní doby je fialová.' },
  triduum: { className: 'season-triduum', label: 'Barva podle dne', explanation: 'Večerní mše na Zelený čtvrtek a velikonoční vigilie mají bílou barvu, velkopáteční obřady červenou. Triduum nemá jednu společnou barvu.' },
  easter: { className: 'season-white', label: 'Bílá', explanation: 'Základní barvou velikonoční doby je bílá; na Seslání Ducha svatého je červená.' },
  'ordinary-second': { className: 'season-green', label: 'Zelená', explanation: 'Základní barvou mezidobí je zelená.' },
}
