# Piano: Barber App — Landing Page (fase iniziale)

Data: 2026-05-10

## Analisi rapida del codicebase (stato attuale)

## Scopo del documento
Pianificazione in modalità "plan": definire il piano per la sola Landing Page pubblica del progetto "Barber App".

---

## Blocco A — Obiettivi e contenuti della Landing Page
Breve presentazione: Sono un senior software architect e UI/UX consultant con esperienza in web app per beauty & wellness.

Obiettivo: definire le sezioni principali della landing page (hero, servizi, galleria, prezzi, contatti, call-to-action) e il tone-of-voice visivo del brand.

Chiedo all'utente di fornire: nome del salone, stile visivo desiderato, target clienti, riferimenti visivi (es. link a Instagram/ Pinterest) o, se preferisce, scegliere uno dei profili tipo proposti sotto.

Se non fornisci dettagli, scegli uno dei profili seguenti:

**[Barber Classico]**
- ✅ Pro: estetica tradizionale e rassicurante; facilità di comunicare professionalità; appeal per clientela matura.
- ❌ Contro: può sembrare datata, meno differenziante; palette e layout più formali.
- 💡 Ideale se: il salone punta su servizi tradizionali e clientela locale consolidata.

**[Barber Moderno]**
- ✅ Pro: look contemporaneo, accattivante per audience giovane; ottimo per mobile-first.
- ❌ Contro: richiede immagini e copy curati; rischio di sembrare impersonale senza elementi locali.
- 💡 Ideale se: target 18–35, forte presenza social e voglia di distinguersi.

**[Barber Lifestyle / Premium]**
- ✅ Pro: posizionamento premium, ottimo per prezzi più alti; design fotografico e tipografico curato.
- ❌ Contro: costo fotografico/produttivo più alto; richiede coerenza di brand.
- 💡 Ideale se: target alla ricerca di esperienza e brand identity distintiva.

👉 **Raccomandazione:** scegliere il profilo in base al target cliente e al budget di produzione; per un lancio rapido, "Barber Moderno" è spesso il migliore per conversione mobile.

---

### Riepilogo parziale (dopo Blocco A)
| Blocco | Scelta |
|--------|--------|
| A      | Fullart — Barber Moderno (target: giovani/adulti benestanti; servizi: trattamenti benessere, vendita prodotti premium) |

---

## Blocco B — Stack tecnologico frontend
Per il front-end della landing page, ecco almeno 3 opzioni distinte.

**[Next.js (React) — Static Export / Jamstack]**
- ✅ Pro: eccellente ecosistema React, ottimo per SEO e performance con export statico; facilità di integrazione con CMS headless.
- ❌ Contro: maggiore complessità iniziale rispetto a un sito statico semplice; build più pesanti se non ottimizzato.
- 💡 Ideale se: futuro ampliamento verso funzionalità dinamiche (prenotazioni) e team già familiare con React.

**[SvelteKit — Static/Pre-rendering]**
- ✅ Pro: bundle piccoli e runtime leggero; ottime prestazioni su mobile; sviluppo veloce con meno boilerplate.
- ❌ Contro: minore adozione rispetto a React, meno component library mature.
- 💡 Ideale se: priorità massima su performance e bundle leggero, e team aperto a Svelte.

**[Static HTML/CSS/JS con template (es. Eleventy o plain) + hosting statico]**
- ✅ Pro: avvio molto rapido, costi minimi e massima semplicità; ottimo per SEO e prestazioni base.
- ❌ Contro: meno flessibile per evoluzioni complesse; integrazione con CMS richiede soluzioni esterne.
- 💡 Ideale se: budget molto limitato e obiettivo lanciare una vetrina semplice velocemente.

👉 **Raccomandazione:** Next.js (Static/Jamstack) se si prevede di estendere la piattaforma verso prenotazioni e pannello admin; SvelteKit se la priorità è performance estrema e semplicità del bundle.

---

### Riepilogo aggiornato
| Blocco | Scelta |
|--------|--------|
| A      | Fullart — Barber Moderno |
| B      | Next.js (React) — Static/Jamstack |

---

## Blocco C — Styling e UI Framework
Per il styling e la libreria UI propongo almeno 3 opzioni.

**[Tailwind CSS (utility-first)]**
- ✅ Pro: sviluppo rapido, ottimo per mobile-first e design responsivo; ampia community e plugin (forms, typography).
- ❌ Contro: classe HTML verbose; richiede disciplina per mantenere consistenza visiva.
- 💡 Ideale se: si vuole sviluppare velocemente con ottime performance e controllo dettagliato sul layout.

**[Chakra UI (component library React)]**
- ✅ Pro: componenti accessibili pronti all'uso, tema centralizzato, integrazione semplice con React/Next.js.
- ❌ Contro: look predefinito che può richiedere customizzazione per differenziarsi; bundle maggiore.
- 💡 Ideale se: si desidera velocità di sviluppo con componenti accessibili e coerenza UI out-of-the-box.

**[Styled Components / CSS Modules (CSS-in-JS)]**
- ✅ Pro: isolamento dei componenti, teming dinamico, grande controllo stilistico; ottimo per design custom.
- ❌ Contro: curva leggermente più alta e possibili implicazioni di bundle/runtime.
- 💡 Ideale se: si punta a una brand identity fortemente personalizzata e si preferisce stile a livello di componente.

👉 **Raccomandazione:** per Fullart (Barber Moderno, esigenza mobile-first e futura estensione) consiglierei Tailwind CSS + componenti React custom; Chakra UI se si preferisce accelerare la consegna tramite componenti pronti.

---

### Riepilogo aggiornato
| Blocco | Scelta |
|--------|--------|
| A      | Fullart — Barber Moderno |
| B      | Next.js (React) — Static/Jamstack |
| C      | Tailwind CSS (utility-first) — Consigliato |

---

## Blocco D — Animazioni e microinterazioni
Tre opzioni per motion design e scroll animations:

**[Framer Motion (React)]**
- ✅ Pro: API React-friendly per microinterazioni e animazioni complesse; buona integrazione con Next.js.
- ❌ Contro: non è pensato per animazioni scroll-driven molto complesse; apprendimento per pattern avanzati.
- 💡 Ideale se: si vogliono microinterazioni fluide e controllate a livello di componente.

**[GSAP + ScrollTrigger]**
- ✅ Pro: potenza e controllo assoluto per animazioni complesse e sincronizzate allo scroll; performance ottimizzabili.
- ❌ Contro: aggiunge dipendenza esterna e curva di apprendimento; bundle può crescere.
- 💡 Ideale se: si desiderano hero animati e scroll narrative con timeline complesse.

**[AOS / CSS Transitions (leggero)]**
- ✅ Pro: setup minimal, dimensione ridotta, facile da mantenere; ottimo per animazioni di entrata semplice.
- ❌ Contro: meno controllabile e meno fluido per microinterazioni avanzate.
- 💡 Ideale se: priorità è velocità di implementazione e leggerezza per mobile.

👉 **Raccomandazione:** per una landing moderna con molte microinterazioni leggere, Framer Motion è la scelta equilibrata; per esperienze scroll-driven molto scenografiche, considerare GSAP.

---

### Riepilogo aggiornato
| Blocco | Scelta |
|--------|--------|
| A      | Fullart — Barber Moderno |
| B      | Next.js (React) — Static/Jamstack |
| C      | Tailwind CSS (utility-first) — Consigliato |
| D      | Framer Motion (React) — Microinterazioni (Consigliato) |

---

---

### Riepilogo aggiornato
| Blocco | Scelta |
|--------|--------|
| A      | Fullart — Barber Moderno |
| B      | Next.js (React) — Static/Jamstack |
| C      | Tailwind CSS (utility-first) — Consigliato |
| D      | Framer Motion (React) — Microinterazioni (Consigliato) |
| E      | Admin page integrata nell'app (Custom Admin UI) — contenuti: prodotti (gallery), servizi & prezzi, orari & disponibilità, gestione personale |

---

## Blocco E — Implementazione pagina admin (opzioni)
Per l'admin integrato, ecco 3 opzioni di implementazione.

**[Custom Admin + Headless DB (Strapi o Sanity self-hosted)]**
- ✅ Pro: controllo completo sui dati, UI admin personalizzata, gestione media integrata.
- ❌ Contro: richiede backend e hosting aggiuntivo, maggiore manutenzione.
- 💡 Ideale se: si vuole pieno controllo e possibilità di estendere API per futuri servizi (prenotazioni).

**[Admin SPA + Backend Serverless (Neon / Firebase)]**
- ✅ Pro: rapido da mettere in piedi, auth e storage integrati, costi iniziali bassi, realtime opzionale.
- ❌ Contro: dipendenza da vendor, limiti del piano gratuito su scala.
- 💡 Ideale se: si desidera velocità di sviluppo e meno operazioni di infrastruttura; ottimo per MVP con gestione prodotti e personale.

**[Admin UI che committa contenuti sul repo (Tina/Netlify CMS)]**
- ✅ Pro: semplicità di versione e backup, nessun DB esterno necessario; buona per contenuti testuali e gallerie semplici.
- ❌ Contro: esperienza utente meno fluida per non-tecnici e gestione media più complessa.
- 💡 Ideale se: si preferisce mantenere contenuti versionati nel codice e minimizzare costi operativi.

👉 **Raccomandazione:** per Fullart, raccomando Admin SPA + Backend Serverless (Supabase o Firebase) per rapidità, auth integrata e gestione media semplice.

---

## Blocco F — Hosting e deployment
Tre opzioni per hosting e CI/CD.

**[Vercel (consigliato per Next.js)]**
- ✅ Pro: integrazione seamless con Next.js, deployment automatico da Git, CDN, preview deploys.
- ❌ Contro: costi per piani enterprise o funzioni serverless avanzate.
- 💡 Ideale se: uso Next.js e si desidera flusso di deploy semplificato.

**[Netlify]**
- ✅ Pro: ottimo per Jamstack statico, deploy da Git, funzioni serverless e forms integrate.
- ❌ Contro: limiti per funzioni a consumo e budget su piani avanzati.
- 💡 Ideale se: si vuole alternativa a Vercel con feature per CMS e forms.

**[Cloud provider + CDN (AWS S3 + CloudFront o Azure Static Web Apps)]**
- ✅ Pro: massimo controllo e scalabilità, adatto per esigenze personalizzate.
- ❌ Contro: complessità di setup e gestione, costi operativi.
- 💡 Ideale se: requisiti enterprise o necessità di integrazione profonda con servizi cloud.

👉 **Raccomandazione:** Vercel è la scelta più rapida ed efficace per Next.js statico.

---

### Riepilogo aggiornato
| Blocco | Scelta |
|--------|--------|
| A      | Fullart — Barber Moderno |
| B      | Next.js (React) — Static/Jamstack |
| C      | Tailwind CSS (utility-first) — Consigliato |
| D      | Framer Motion (React) — Microinterazioni (Consigliato) |
| E      | Admin page integrata nell'app (Custom Admin UI) — preferenza: Serverless (Supabase/Firebase); autenticazione: Clerk (gestisce tutti gli utenti; ruolo ADMIN per accesso sezione admin) |
| F      | Vercel (Consigliato per Next.js) |

---

## Blocco G — Struttura del progetto
Tre opzioni per l'organizzazione delle cartelle e convenzioni di naming.

**[Struttura per componenti + feature (consigliata)]**
- ✅ Pro: bilanciata tra modularità e facilità di navigazione; facile scalare con nuove feature.
- ❌ Contro: può richiedere disciplina per evitare duplicazioni tra feature.
- 💡 Ideale se: team piccolo/medio che svilupperà funzionalità nuove (admin, prenotazioni).

**[Atomic Design (atoms/molecules/organisms/templates)]**
- ✅ Pro: ottima riusabilità dei componenti e coerenza visiva; facilita testing UI.
- ❌ Contro: struttura verbosa e curva iniziale per mappare i componenti.
- 💡 Ideale se: si punta a un design system solido e componenti altamente riutilizzabili.

**[Domain-driven / feature folders (services/products/staff)]**
- ✅ Pro: chiaro mapping alle entità del dominio (prodotti, servizi, personale); facilita ownership.
- ❌ Contro: meno immediato per componenti UI condivisi; possibile duplicazione.
- 💡 Ideale se: sviluppo guidato da dominio e se più team lavorano su feature separate.

👉 **Raccomandazione:** iniziare con struttura per componenti + feature (src/features, src/components, src/lib) e adottare elementi di Atomic Design quando utile.

---

### Riepilogo aggiornato
| Blocco | Scelta |
|--------|--------|
| A      | Fullart — Barber Moderno |
| B      | Next.js (React) — Static/Jamstack |
| C      | Tailwind CSS (utility-first) — Consigliato |
| D      | Framer Motion (React) — Microinterazioni (Consigliato) |
| E      | Admin page integrata nell'app (Custom Admin UI) — preferenza: Serverless (Supabase/Firebase); autenticazione: Clerk |
| F      | Vercel (Consigliato per Next.js) |
| G      | Struttura per componenti + feature (Consigliata) |

---

## Blocco H — Performance e SEO
Tre opzioni per priorità di ottimizzazione e SEO.

**[Ottimizzazione immagini + responsive (Next/Image, WebP, lazy load)]**
- ✅ Pro: grande impatto su Core Web Vitals e tempi di caricamento, fondamentale per mobile.
- ❌ Contro: richiede pipeline di ottimizzazione immagini e gestione formati.
- 💡 Ideale se: priorità è performance mobile e velocità percepita.

**[Preload critico, font strategy e critical CSS]**
- ✅ Pro: migliora LCP e stabilità visiva; controllo fine su rendering prioritario.
- ❌ Contro: richiede lavoro di tuning e test cross-browser.
- 💡 Ideale se: si vogliono ottimizzare metriche LCP/CLS in modo dettagliato.

**[SEO tecnico + structured data + CDN/edge caching]**
- ✅ Pro: migliora visibilità organica, rich results e caching globale; ottimo per scalabilità.
- ❌ Contro: richiede configurazione server/CDN e produzione di markup strutturato accurato.
- 💡 Ideale se: obiettivo è cercabilità locale e presenza nelle SERP con rich snippets.

👉 **Raccomandazione:** partire da Ottimizzazione immagini + responsive e aggiungere in seconda fase Preload/Font e Structured Data.

---

### Riepilogo aggiornato
| Blocco | Scelta |
|--------|--------|
| A      | Fullart — Barber Moderno |
| B      | Next.js (React) — Static/Jamstack |
| C      | Tailwind CSS (utility-first) — Consigliato |
| D      | Framer Motion (React) — Microinterazioni (Consigliato) |
| E      | Admin page integrata nell'app (Custom Admin UI) — preferenza: Serverless (Supabase/Firebase); autenticazione: Clerk (gestisce tutti gli utenti; ruolo ADMIN per accesso sezione admin) |
| F      | Vercel (Consigliato per Next.js) |
| G      | Struttura per componenti + feature (Consigliata) |
| H      | Ottimizzazione immagini + responsive (Consigliato) |
| I      | Google Analytics + Google Tag Manager (Consigliato) |

---

## Blocco I — Analytics e tracking
Tre opzioni per monitorare visite, conversioni e comportamento.

**[Google Analytics 4 + Google Tag Manager]**
- ✅ Pro: standard de facto, integrazione con Google Ads e numerosi strumenti; GTM facilita tag management.
- ❌ Contro: preoccupazioni privacy in alcune giurisdizioni; setup iniziale di eventi richiesto.
- 💡 Ideale se: si vuole dato ricco e integrazione marketing avanzata.

**[Plausible / Fathom (privacy-friendly)]**
- ✅ Pro: semplice da configurare, rispetto privacy, leggerezza prestazionale.
- ❌ Contro: dati meno granulari e funzionalità analitiche limitate.
- 💡 Ideale se: priorità privacy e semplicità.

**[Mixpanel / Amplitude (event-based)]**
- ✅ Pro: analisi event-driven avanzata e funnel dettagliati.
- ❌ Contro: curva di apprendimento e costi per volumi elevati.
- 💡 Ideale se: obiettivo misurare funnel complessi e retention.

👉 **Raccomandazione:** Google Analytics + GTM per iniziare, eventualmente affiancato da strumenti privacy-friendly per report semplificati.

---

### Riepilogo aggiornato
| Blocco | Scelta |
|--------|--------|
| A      | Fullart — Barber Moderno |
| B      | Next.js (React) — Static/Jamstack |
| C      | Tailwind CSS (utility-first) — Consigliato |
| D      | Framer Motion (React) — Microinterazioni (Consigliato) |
| E      | Admin page integrata nell'app (Custom Admin UI) — preferenza: Serverless (Supabase/Firebase); autenticazione: Clerk (gestisce tutti gli utenti; ruolo ADMIN per accesso sezione admin) |
| F      | Vercel (Consigliato per Next.js) |
| G      | Struttura per componenti + feature (Consigliata) |
| H      | Ottimizzazione immagini + responsive (Consigliato) |
| I      | Google Analytics + Google Tag Manager (Consigliato) |
| J      | Prenotazioni online (Consigliato) |

---

### Prossimi passi dopo scelta del Blocco I
- Confermare analytics/strumenti di tracking.
- Definire il Blocco J (Roadmap futura — integrazione prenotazioni, auth utente, admin avanzato, ecc.).

## Blocco J — Roadmap futura (cenni)
Tre opzioni per le priorità post-lancio.

**[Prenotazioni online — integrazione rapida (SaaS) (Consigliato)]**
- ✅ Pro: rollout rapido, gestione calendario pronta, integrazione pagamenti opzionale.
- ❌ Contro: dipendenza da servizio esterno e costi ricorrenti.
- 💡 Ideale se: si vuole velocizzare l'arrivo del booking online.

**[Sistema personalizzato di prenotazione + DB (Neon) e admin avanzato]**
- ✅ Pro: totale controllo, integrazione diretta con pannello admin e gestione operatori.
- ❌ Contro: più tempo di sviluppo e costi iniziali maggiori.
- 💡 Ideale se: necessità di regole di prenotazione complesse e integrazioni personalizzate.

**[Integrazione progressiva: booking semplice + miglioramenti incrementali]**
- ✅ Pro: bilancia velocità e controllo, permette testare UX e aggiungere funzionalità.
- ❌ Contro: richiede buona pianificazione delle fasi.
- 💡 Ideale se: si vuole validare domanda e scalare gradualmente.

👉 **Raccomandazione:** iniziare con Prenotazioni online tramite SaaS per validare il flusso, poi valutare migrazione a soluzione custom se necessario.

(Il piano verrà aggiornato progressivamente.)

