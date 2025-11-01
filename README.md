
# Guida rapida

## Come caricare sul tuo host
1. Scarica lo ZIP e scompattalo.
2. Carica l'intera cartella sul tuo hosting (public_html o simile).
3. Assicurati che `index.html` sia nella root del dominio o sottodominio.

## Aggiungere capitoli
- Vai nella cartella della storia, per esempio `fandom/bts/the-deal/`.
- Duplica `chapter-1.html` rinominandolo `chapter-2.html`, `chapter-3.html`, ecc.
- Dentro ogni file, aggiorna:
  - il titolo `<h2 class="chapter-title">`,
  - i link di navigazione `Precedente/Successivo`,
  - il breadcrumb e i metadati.
- Facoltativo: crea un `index.html` con l'elenco capitoli aggiornato.

## Tema giorno/notte e dimensione testo
- Il toggle giorno/notte e i pulsanti A−/A+ memorizzano le preferenze in `localStorage`.
- La dimensione agisce principalmente sulla sezione `.reader` per non alterare la UI.

## Pubblicità su un sito nuovo
Per iniziare senza violare privacy o normative:
- Usa gli slot come *house ads* (esempi già presenti) o banner affiliati con link tracciati.
- Quando il traffico cresce, valuta Google AdSense, Ezoic, o Mediavine (richiedono metriche minime).
- In UE serve attenzione a consenso cookie e tracciamento. Con AdSense, integra un CMP conforme a IAB TCF (es. CookieYes, OneTrust).
- Mantieni gli slot visibili ma non invasivi: header, sidebar, e un inserto *inline* dopo il primo paragrafo del capitolo.
- Evita pop-up, interstitial, o autoplay.

## Dove sostituire gli annunci
- File: `js/ads.js`.
- Sostituisci l'array `creatives` con tuoi HTML o snippet rete.
- Per AdSense, inserisci lo script ufficiale e l'`<ins class="adsbygoogle">` dentro gli slot desiderati.

## Performance e SEO
- Sito minimalista, senza dipendenze. Ottimo per velocità.
- Aggiungi `meta description` per ogni pagina storia.
- Usa titoli coerenti con fandom e storia.

---

Realizzato per un layout minimale, con sidebar a sinistra e comandi di lettura in alto.
