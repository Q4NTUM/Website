/* ==========================================================================
   Site content — edit this file to add events, news and equations.

   EVENTS
     start / end : local Lethbridge time as "YYYY-MM-DD HH:MM" (24-hour).
                   Daylight saving is handled automatically.
     cat         : talk · observing · workshop · social · competition
     fr          : optional French overrides { title, desc, location, bring, details }
     bring       : optional list of things to bring (otherwise a default per category)
     details     : optional list of extra paragraphs for the event's own page
     Every event gets its own shareable page: event.html?id=THE-ID
   NEWS
     date        : "YYYY-MM-DD"; art: orbit · wave · lattice · spiral · constellation
     fr          : optional French overrides { title, tag, excerpt, body }
   EQUATIONS     html is inserted as-is (trusted markup)
   VENUES · PROBLEMS · GALLERY — see the notes above each list further down

   Everything below is PLACEHOLDER content for the draft site.
   ========================================================================== */

window.PAMA_DATA = {
  events: [
    // ---- Past (kept for the archive) ----
    {
      id: "clubs-fair-2026", cat: "social",
      title: "Clubs Week Booth",
      start: "2026-09-10 10:00", end: "2026-09-10 15:00",
      location: "Students' Union Building",
      desc: "Our first public appearance as PAMA. Spectroscopes, a pocket-sized cloud chamber and a lot of conversations about black holes.",
      fr: { title: "Kiosque de la semaine des clubs", location: "Édifice de l'Association étudiante", desc: "Notre première apparition publique sous le nom de PAMA : spectroscopes, chambre à brouillard de poche et beaucoup de discussions sur les trous noirs." },
    },
    {
      id: "welcome-mixer-2026", cat: "social",
      title: "Welcome Mixer",
      start: "2026-09-17 17:30", end: "2026-09-17 19:30",
      location: "Science Commons, Atrium",
      desc: "Pizza, introductions and a very competitive round of physics Pictionary. Bring a friend from any program.",
      fr: { title: "Soirée d'accueil", location: "Science Commons, atrium", desc: "Pizza, présentations et une partie très disputée de Pictionary de physique. Amenez un ami, peu importe son programme." },
    },
    {
      id: "cosmic-cinema-contact", cat: "social",
      title: "Cosmic Cinema: Contact",
      start: "2026-09-24 19:00", end: "2026-09-24 21:45",
      location: "Science Commons, Lecture Theatre",
      desc: "The season opener of our film series, followed by a short discussion on SETI and the Drake equation.",
      fr: { title: "Cinéma cosmique : Contact", location: "Science Commons, amphithéâtre", desc: "L'ouverture de notre série de films, suivie d'une courte discussion sur SETI et l'équation de Drake." },
    },

    // ---- Upcoming ----
    {
      id: "cosmic-cinema-interstellar", cat: "social",
      title: "Cosmic Cinema: Interstellar",
      start: "2026-10-01 19:00", end: "2026-10-01 22:00",
      location: "Science Commons, Lecture Theatre",
      desc: "Time dilation, tidal forces and a tesseract. A graduate student walks through the real physics behind Gargantua before the lights go down.",
      fr: { title: "Cinéma cosmique : Interstellar", location: "Science Commons, amphithéâtre", desc: "Dilatation du temps, forces de marée et tesseract. Un étudiant aux cycles supérieurs explique la vraie physique de Gargantua avant la projection." },
    },
    {
      id: "problem-night-fermi", cat: "workshop",
      title: "Problem Night: Fermi Estimation",
      start: "2026-10-08 18:00", end: "2026-10-08 20:00",
      location: "Science Commons, Room TBA",
      desc: "How many piano tuners are in Lethbridge? How much does the atmosphere weigh? Learn to reason your way to answers within an order of magnitude.",
      fr: { title: "Soirée casse-tête : estimations de Fermi", location: "Science Commons, salle à confirmer", desc: "Combien y a-t-il d'accordeurs de piano à Lethbridge? Combien pèse l'atmosphère? Apprenez à raisonner jusqu'à une réponse juste à un ordre de grandeur près." },
    },
    {
      id: "stargazing-october", cat: "observing",
      title: "Coulee Stargazing Night",
      start: "2026-10-10 20:30", end: "2026-10-10 23:00",
      location: "Dark-sky site — carpool from campus",
      desc: "New moon weekend. We'll tour the Andromeda Galaxy, the Double Cluster and Saturn's rings through club telescopes. Dress warmly; weather permitting.",
      fr: { title: "Observation dans les coulées", location: "Site de ciel noir — covoiturage depuis le campus", desc: "Fin de semaine de nouvelle lune : la galaxie d'Andromède, le double amas de Persée et les anneaux de Saturne aux télescopes du club. Habillez-vous chaudement; selon la météo." },
    },
    {
      id: "colloquium-gw", cat: "talk",
      title: "Listening to Black Holes",
      start: "2026-10-15 17:00", end: "2026-10-15 18:15",
      location: "Science Commons, Lecture Theatre",
      desc: "An accessible introduction to gravitational-wave astronomy: how LIGO measures a change smaller than a proton, and what the signals are telling us. Speaker TBA.",
      fr: { title: "À l'écoute des trous noirs", location: "Science Commons, amphithéâtre", desc: "Une introduction accessible à l'astronomie des ondes gravitationnelles : comment LIGO mesure un déplacement plus petit qu'un proton, et ce que les signaux nous apprennent. Conférencier à confirmer." },
    },
    {
      id: "python-1", cat: "workshop",
      title: "Python for Physicists I",
      start: "2026-10-22 18:00", end: "2026-10-22 20:00",
      location: "Science Commons, Computer Lab",
      desc: "From zero to your first simulation: NumPy arrays, a projectile with drag and a plot you'd be proud to put in a lab report. Laptops welcome, not required.",
      fr: { title: "Python pour physiciens I", location: "Science Commons, laboratoire informatique", desc: "De zéro à votre première simulation : tableaux NumPy, un projectile avec frottement et un graphique digne d'un rapport de labo. Portables bienvenus, mais pas obligatoires." },
    },
    {
      id: "halloween-2026", cat: "social",
      title: "Spooky Action at a Distance",
      start: "2026-10-29 19:00", end: "2026-10-29 22:00",
      location: "Location TBA",
      desc: "Our Halloween social. Costume prize for the best dressed physicist, mathematician or celestial object. Entanglement optional.",
      fr: { title: "Action fantôme à distance", location: "Lieu à confirmer", desc: "Notre soirée d'Halloween. Prix du meilleur costume de physicien, de mathématicienne ou d'objet céleste. Intrication facultative." },
    },
    {
      id: "grad-panel", cat: "talk",
      title: "Grad School & Careers Panel",
      start: "2026-11-05 17:00", end: "2026-11-05 18:30",
      location: "Science Commons, Room TBA",
      desc: "Graduate students, alumni and faculty on research, applications, NSERC awards and careers beyond academia. Bring your questions.",
      fr: { title: "Table ronde : études supérieures et carrières", location: "Science Commons, salle à confirmer", desc: "Étudiants aux cycles supérieurs, diplômés et professeurs parlent de recherche, de demandes d'admission, de bourses du CRSNG et de carrières hors du milieu universitaire. Apportez vos questions." },
    },
    {
      id: "stargazing-november", cat: "observing",
      title: "Winter Sky Preview",
      start: "2026-11-07 19:30", end: "2026-11-07 22:00",
      location: "Dark-sky site — carpool from campus",
      desc: "Orion rises. A guided look at the Pleiades, the Orion Nebula and Jupiter, plus a beginner's session on reading a star chart.",
      fr: { title: "Avant-goût du ciel d'hiver", location: "Site de ciel noir — covoiturage depuis le campus", desc: "Orion se lève. Visite guidée des Pléiades, de la nébuleuse d'Orion et de Jupiter, avec une initiation à la lecture d'une carte du ciel." },
    },
    {
      id: "integration-bee", cat: "competition",
      title: "The Integration Bee",
      start: "2026-11-12 18:00", end: "2026-11-12 20:30",
      location: "Science Commons, Lecture Theatre",
      desc: "Single-elimination calculus on the big screen. Spectators welcome, competitors celebrated. Prizes for the top three.",
      fr: { title: "Le tournoi d'intégrales", location: "Science Commons, amphithéâtre", desc: "Du calcul intégral à élimination directe sur grand écran. Spectateurs bienvenus, concurrents acclamés. Prix pour les trois premiers." },
    },
    {
      id: "python-2", cat: "workshop",
      title: "Python for Physicists II",
      start: "2026-11-19 18:00", end: "2026-11-19 20:00",
      location: "Science Commons, Computer Lab",
      desc: "Fitting real data: uncertainties, least squares and honest error bars, using a pendulum dataset we'll take in the room.",
      fr: { title: "Python pour physiciens II", location: "Science Commons, laboratoire informatique", desc: "Ajuster de vraies données : incertitudes, moindres carrés et barres d'erreur honnêtes, à partir de mesures de pendule prises sur place." },
    },
    {
      id: "colloquium-math", cat: "talk",
      title: "The Unreasonable Effectiveness of Mathematics",
      start: "2026-11-26 17:00", end: "2026-11-26 18:15",
      location: "Science Commons, Lecture Theatre",
      desc: "Why does abstract mathematics describe the physical world so well? A conversation between a mathematician and a physicist. Speakers TBA.",
      fr: { title: "La déraisonnable efficacité des mathématiques", location: "Science Commons, amphithéâtre", desc: "Pourquoi les mathématiques abstraites décrivent-elles si bien le monde physique? Une conversation entre une mathématicienne et un physicien. Conférenciers à confirmer." },
    },
    {
      id: "study-jam-fall", cat: "workshop",
      title: "End-of-Term Study Jam",
      start: "2026-12-03 12:00", end: "2026-12-03 18:00",
      location: "Science Commons, Atrium",
      desc: "Drop-in study hall with upper-year and graduate volunteers for first- and second-year physics, astronomy and math courses. Coffee provided.",
      fr: { title: "Marathon d'étude de fin de session", location: "Science Commons, atrium", desc: "Séance d'étude libre avec des bénévoles des années supérieures et des cycles supérieurs, pour les cours de physique, d'astronomie et de mathématiques de première et deuxième année. Café offert." },
    },
    {
      id: "winter-welcome", cat: "social",
      title: "Winter Term Welcome Back",
      start: "2027-01-14 17:30", end: "2027-01-14 19:30",
      location: "Science Commons, Atrium",
      desc: "Hot chocolate, new-semester planning and a first look at the winter lineup.",
      fr: { title: "Retrouvailles de la session d'hiver", location: "Science Commons, atrium", desc: "Chocolat chaud, planification de la session et premier aperçu de la programmation d'hiver." },
    },
    {
      id: "pi-day-2027", cat: "competition",
      title: "Pi Day",
      start: "2027-03-12 11:00", end: "2027-03-12 14:00",
      location: "Students' Union Building",
      desc: "Pie, a digit-recitation challenge and a Buffon's-needle experiment to estimate π live. (Celebrated on the Friday before 3.14.)",
      fr: { title: "Journée de π", location: "Édifice de l'Association étudiante", desc: "Tartes, défi de récitation de décimales et expérience de l'aiguille de Buffon pour estimer π en direct. (Soulignée le vendredi précédant le 14 mars.)" },
    },
  ],

  news: [
    {
      id: "cosmic-cinema-returns", date: "2026-09-20", tag: "Events", art: "orbit",
      title: "Cosmic Cinema is back — under the stars, sort of",
      excerpt: "Our film series returns for Fall 2026, with a short talk before every screening.",
      body: [
        "Cosmic Cinema, the most popular tradition inherited from the old Physics Club, returns this term with a new format: every screening opens with a ten-minute talk by a student or graduate volunteer on the real science behind the film.",
        "We opened with Contact on September 24 and continue with Interstellar on October 1. Screenings are free and open to everyone. Popcorn is on us; suggestions for next term's lineup are welcome on Instagram.",
      ],
      fr: {
        tag: "Événements",
        title: "Le Cinéma cosmique est de retour — sous les étoiles, ou presque",
        excerpt: "Notre série de films revient à l'automne 2026, avec une courte présentation avant chaque projection.",
        body: [
          "Le Cinéma cosmique, la tradition la plus populaire héritée de l'ancien Club de physique, revient cette session avec une nouvelle formule : chaque projection commence par une présentation de dix minutes, donnée par un étudiant ou une étudiante bénévole, sur la vraie science derrière le film.",
          "Nous avons ouvert la saison avec Contact le 24 septembre, et nous poursuivons avec Interstellar le 1er octobre. Les projections sont gratuites et ouvertes à tous. Le maïs soufflé est offert; vos suggestions pour la prochaine session sont les bienvenues sur Instagram.",
        ],
      },
    },
    {
      id: "meet-the-exec", date: "2026-09-12", tag: "Community", art: "constellation",
      title: "Meet the 2026–27 executive team",
      excerpt: "Six undergraduates and four graduate advisors are steering PAMA through its first full year.",
      body: [
        "PAMA's first elected executive brings together students from physics, astronomy, mathematics and beyond. Their priorities for the year: a regular events calendar, peer study support for first-year courses, and stronger connections to research on campus.",
        "You can find the full team, and what each role does, on our Team page. Executive meetings are open to members; if you'd like to help out, we're always looking for volunteers.",
      ],
      fr: {
        tag: "Communauté",
        title: "Découvrez l'exécutif 2026-2027",
        excerpt: "Six étudiants de premier cycle et quatre conseillers des cycles supérieurs guident PAMA pendant sa première année complète.",
        body: [
          "Le premier exécutif élu de PAMA réunit des étudiants en physique, en astronomie, en mathématiques et d'ailleurs. Leurs priorités pour l'année : un calendrier d'activités régulier, du soutien par les pairs pour les cours de première année et des liens plus forts avec la recherche sur le campus.",
          "Vous trouverez toute l'équipe, et le rôle de chacun, sur notre page Équipe. Les réunions de l'exécutif sont ouvertes aux membres; si vous souhaitez donner un coup de main, nous cherchons toujours des bénévoles.",
        ],
      },
    },
    {
      id: "ratified", date: "2026-09-05", tag: "Announcement", art: "lattice",
      title: "PAMA is officially a ratified student club",
      excerpt: "We're now a recognised club under the Students' Union, which means funding, room bookings and a lot more events.",
      body: [
        "After a summer of paperwork, PAMA has been ratified as an official student club. Ratification lets us book rooms on campus, apply for club funding and partner with academic departments on events.",
        "Thank you to everyone who signed on as a founding member. Membership is free and open to every student, whatever your program.",
      ],
      fr: {
        tag: "Annonce",
        title: "PAMA est officiellement un club étudiant reconnu",
        excerpt: "Nous sommes maintenant un club reconnu par l'Association étudiante : du financement, des réservations de salles et beaucoup plus d'activités.",
        body: [
          "Après un été de paperasse, PAMA a été reconnu comme club étudiant officiel. Cette reconnaissance nous permet de réserver des salles sur le campus, de demander du financement et de collaborer avec les départements pour nos activités.",
          "Merci à tous ceux et celles qui se sont inscrits comme membres fondateurs. L'adhésion est gratuite et ouverte à tous les étudiants, peu importe leur programme.",
        ],
      },
    },
    {
      id: "physics-club-to-pama", date: "2026-08-28", tag: "Story", art: "wave",
      title: "From Physics Club to PAMA: why we changed our name",
      excerpt: "Same curiosity, a wider sky. Why astronomy and mathematics now share top billing.",
      body: [
        "For years the Physics Club was a small, dedicated group of majors. As interest in astronomy and mathematics grew among its members, the name no longer fit the people in the room.",
        "The Physics, Astronomy & Mathematics Association keeps everything that made the club work — informal talks, problem nights, film screenings — and opens the door wider to anyone who finds these subjects beautiful, whatever their major.",
      ],
      fr: {
        tag: "Histoire",
        title: "Du Club de physique à PAMA : pourquoi nous avons changé de nom",
        excerpt: "La même curiosité, un ciel plus vaste. Pourquoi l'astronomie et les mathématiques partagent désormais l'affiche.",
        body: [
          "Pendant des années, le Club de physique a été un petit groupe dévoué d'étudiants en physique. À mesure que l'intérêt pour l'astronomie et les mathématiques grandissait parmi ses membres, le nom ne correspondait plus aux gens présents.",
          "L'Association de physique, d'astronomie et de mathématiques conserve tout ce qui faisait le succès du club — présentations informelles, soirées casse-tête, projections de films — et ouvre plus grand la porte à quiconque trouve ces disciplines belles, peu importe son programme.",
        ],
      },
    },
    {
      id: "call-for-speakers", date: "2026-08-15", tag: "Opportunity", art: "spiral",
      title: "Call for speakers: share your research",
      excerpt: "Doing an honours project, a summer USRA or a grad thesis? We'd love to hear about it.",
      body: [
        "Our lightning-talk evenings give students a relaxed place to present their research in 10 minutes or less. It's excellent practice for conferences like CUPC, and the audience is friendly.",
        "Undergraduate and graduate speakers from any discipline are welcome. Reach out on Instagram or speak to any member of the executive to claim a slot.",
      ],
      fr: {
        tag: "Occasion",
        title: "Appel de conférenciers : présentez votre recherche",
        excerpt: "Un projet de spécialisation, un stage de recherche d'été ou une thèse en cours? Nous voulons en entendre parler.",
        body: [
          "Nos soirées de présentations éclair offrent aux étudiants un cadre détendu pour présenter leur recherche en 10 minutes ou moins. C'est une excellente pratique pour des conférences comme la CUPC, devant un public bienveillant.",
          "Les conférenciers de premier cycle et des cycles supérieurs de toutes les disciplines sont les bienvenus. Écrivez-nous sur Instagram ou parlez à un membre de l'exécutif pour réserver votre place.",
        ],
      },
    },
  ],

  equations: [
    /* Wrap each symbol worth explaining in <span data-t="n">; terms[n] labels it */
    {
      html: '<span data-t="0"><i>e</i></span><sup><span data-t="1"><i>i</i></span><span data-t="2"><i>π</i></span></sup> + <span data-t="3">1</span> = <span data-t="4">0</span>',
      field: "Complex analysis", year: 1748,
      terms: ["Euler's number", "imaginary unit", "circle constant", "unity", "zero"],
      caption: "Euler's identity — five fundamental constants, three basic operations, one line.",
      fr: { field: "Analyse complexe", terms: ["nombre d'Euler", "unité imaginaire", "constante du cercle", "unité", "zéro"], caption: "L'identité d'Euler — cinq constantes fondamentales, trois opérations, une seule ligne." },
    },
    {
      html: '<span data-t="0">∇ ·</span> <span data-t="1"><b>E</b></span> = <span data-t="2"><i>ρ</i></span> / <span data-t="3"><i>ε</i><sub>0</sub></span>',
      field: "Electromagnetism", year: 1835,
      terms: ["divergence", "electric field", "charge density", "vacuum permittivity"],
      caption: "Gauss's law — electric field lines begin and end on charge.",
      fr: { field: "Électromagnétisme", terms: ["divergence", "champ électrique", "densité de charge", "permittivité du vide"], caption: "La loi de Gauss — les lignes de champ électrique naissent et meurent sur les charges." },
    },
    {
      html: '<span data-t="0"><i>iħ</i></span> <span data-t="1">∂<sub><i>t</i></sub><i>ψ</i></span> = <span data-t="2"><i>Ĥ</i></span><i>ψ</i>',
      field: "Quantum mechanics", year: 1926,
      terms: ["reduced Planck constant", "how the state changes", "Hamiltonian · energy"],
      caption: "The Schrödinger equation — how a quantum state evolves in time.",
      fr: { field: "Mécanique quantique", terms: ["constante de Planck réduite", "évolution de l'état", "hamiltonien · énergie"], caption: "L'équation de Schrödinger — comment un état quantique évolue dans le temps." },
    },
    {
      html: '<span data-t="0"><i>G</i><sub><i>μν</i></sub></span> + <span data-t="1">Λ</span><span data-t="2"><i>g</i><sub><i>μν</i></sub></span> = <span class="nowrap" data-t="3">8π<i>G</i>/<i>c</i><sup>4</sup></span> <span data-t="4"><i>T</i><sub><i>μν</i></sub></span>',
      field: "General relativity", year: 1915,
      terms: ["curvature", "cosmological constant", "metric", "coupling", "matter & energy"],
      caption: "Einstein's field equations — matter tells spacetime how to curve.",
      fr: { field: "Relativité générale", terms: ["courbure", "constante cosmologique", "métrique", "couplage", "matière et énergie"], caption: "Les équations d'Einstein — la matière dit à l'espace-temps comment se courber." },
    },
    {
      html: '<span data-t="0"><i>S</i></span> = <span data-t="1"><i>k</i><sub>B</sub></span> ln <span data-t="2">Ω</span>',
      field: "Statistical mechanics", year: 1877,
      terms: ["entropy", "Boltzmann constant", "number of microstates"],
      caption: "Boltzmann's entropy — engraved on his tombstone in Vienna.",
      fr: { field: "Physique statistique", terms: ["entropie", "constante de Boltzmann", "nombre de micro-états"], caption: "L'entropie de Boltzmann — gravée sur sa tombe à Vienne." },
    },
  ],

  /* Where events happen. An event's location is matched to the first venue
     whose key it starts with. Coordinates are approximate — confirm them. */
  venues: {
    "Science Commons": { name: "Science Commons, University of Lethbridge", address: "4401 University Dr W, Lethbridge, AB T1K 3M4", lat: 49.6788, lon: -112.8626 },
    "Students' Union Building": { name: "Students' Union Building, University of Lethbridge", address: "4401 University Dr W, Lethbridge, AB T1K 3M4", lat: 49.6797, lon: -112.8594 },
    "Dark-sky site": {
      name: "Meet at the Science Commons", address: "4401 University Dr W, Lethbridge, AB T1K 3M4", lat: 49.6788, lon: -112.8626,
      note: "We carpool from campus to a dark site outside the city. The exact spot is shared on Instagram the afternoon of the event, depending on the forecast.",
      fr: { name: "Rendez-vous au Science Commons", note: "Nous faisons du covoiturage depuis le campus vers un site sombre hors de la ville. L'endroit exact est annoncé sur Instagram l'après-midi même, selon la météo." },
    },
  },

  /* Problem of the week — rotates every Monday, like the equations.
     Last week's solution is shown under the current problem. */
  problems: [
    {
      title: "Falling through the Earth",
      fig: "tunnel",
      q: "Drill a straight, frictionless tunnel through the centre of the Earth and jump in. Ignoring air, how long until you pop out on the other side?",
      hint: "Inside a uniform sphere, gravity grows linearly with your distance from the centre. What else pulls back in proportion to how far you are from home?",
      answer: "It's a spring: simple harmonic motion with ω = √(g/R). Half a period is π√(R/g) ≈ 42 minutes — and, surprisingly, any straight tunnel between two points on the surface takes the same 42 minutes.",
      fr: { title: "Tomber à travers la Terre", q: "Creusez un tunnel droit et sans frottement qui traverse le centre de la Terre, puis sautez. Sans l'air, combien de temps avant de ressortir de l'autre côté?", hint: "À l'intérieur d'une sphère uniforme, la gravité croît linéairement avec la distance au centre. Qu'est-ce qui d'autre vous ramène proportionnellement à votre écart?", answer: "C'est un ressort : un mouvement harmonique simple avec ω = √(g/R). Une demi-période vaut π√(R/g) ≈ 42 minutes — et, étonnamment, tout tunnel droit entre deux points de la surface prend les mêmes 42 minutes." },
    },
    {
      title: "A rope around the equator",
      fig: "rope",
      q: "A rope hugs the Earth's equator. Add one metre to its length and lift it evenly all the way round. How big is the gap underneath — enough for a sheet of paper, or a cat?",
      hint: "Circumference is 2πr. If the circumference grows by 1 m, how much does r grow?",
      answer: "Δr = 1 m / 2π ≈ 16 cm — a cat walks under easily. The answer doesn't depend on the size of the sphere at all: it's the same for a basketball.",
      fr: { title: "Une corde autour de l'équateur", q: "Une corde épouse l'équateur terrestre. Ajoutez-lui un mètre et soulevez-la uniformément tout autour. Quelle hauteur a l'espace dessous — une feuille de papier, ou un chat?", hint: "La circonférence vaut 2πr. Si elle augmente de 1 m, de combien r augmente-t-il?", answer: "Δr = 1 m / 2π ≈ 16 cm — un chat passe sans peine. La réponse ne dépend pas du tout de la taille de la sphère : c'est pareil pour un ballon de basket." },
    },
    {
      title: "How far is the horizon?",
      fig: "horizon",
      q: "Standing on the flat prairie with your eyes 1.7 m above the ground, how far away is the horizon?",
      hint: "Draw the right triangle: Earth's radius R, your line of sight, and R + h from the centre to your eyes.",
      answer: "d = √((R + h)² − R²) ≈ √(2Rh) = √(2 × 6.37 × 10⁶ m × 1.7 m) ≈ 4.7 km. From the top of the High Level Bridge (about 96 m) it grows to roughly 35 km.",
      fr: { title: "À quelle distance est l'horizon?", q: "Debout dans la prairie, les yeux à 1,7 m du sol, à quelle distance se trouve l'horizon?", hint: "Tracez le triangle rectangle : le rayon terrestre R, votre ligne de visée, et R + h du centre jusqu'à vos yeux.", answer: "d = √((R + h)² − R²) ≈ √(2Rh) = √(2 × 6,37 × 10⁶ m × 1,7 m) ≈ 4,7 km. Du haut du pont High Level (environ 96 m), elle passe à environ 35 km." },
    },
    {
      title: "Twenty-three strangers",
      fig: "birthday",
      q: "How many people need to be in a room before it's more likely than not that two of them share a birthday?",
      hint: "It's much easier to compute the probability that nobody shares a birthday, then subtract from one.",
      answer: "Just 23. The chance that all 23 birthdays differ is 365/365 × 364/365 × … × 343/365 ≈ 0.49 — because there are 253 different pairs, not 23.",
      fr: { title: "Vingt-trois inconnus", q: "Combien de personnes faut-il dans une pièce pour qu'il soit plus probable qu'improbable que deux d'entre elles partagent un anniversaire?", hint: "Il est bien plus simple de calculer la probabilité que personne ne partage d'anniversaire, puis de la soustraire de un.", answer: "Seulement 23. La probabilité que les 23 anniversaires diffèrent vaut 365/365 × 364/365 × … × 343/365 ≈ 0,49 — parce qu'il y a 253 paires différentes, pas 23." },
    },
    {
      title: "The snail on the rubber band",
      fig: "snail",
      q: "A snail crawls at 1 cm/s along a 1 m rubber band. Every second, the band is stretched by another metre (uniformly, carrying the snail with it). Does the snail ever reach the end?",
      hint: "Track the fraction of the band the snail has covered, not the distance. Stretching doesn't change that fraction.",
      answer: "Yes! In second n it covers 1/(100n) of the band, so after N seconds it has covered (1/100)(1 + 1/2 + … + 1/N). The harmonic series diverges, so it gets there — after about e¹⁰⁰ ≈ 10⁴³ seconds.",
      fr: { title: "L'escargot sur l'élastique", q: "Un escargot avance à 1 cm/s sur un élastique de 1 m. Chaque seconde, l'élastique est étiré d'un mètre de plus (uniformément, en entraînant l'escargot). L'escargot atteint-il un jour le bout?", hint: "Suivez la fraction de l'élastique parcourue, pas la distance. L'étirement ne change pas cette fraction.", answer: "Oui! À la seconde n, il parcourt 1/(100n) de l'élastique; après N secondes, il en a parcouru (1/100)(1 + 1/2 + … + 1/N). La série harmonique diverge, donc il arrive — après environ e¹⁰⁰ ≈ 10⁴³ secondes." },
    },
  ],

  /* Logbook — photos from club nights. Files live in assets/img/logbook/ as
     NAME-800.jpg (grid) and NAME-1600.jpg (full screen); w/h are the 800 size.
     PLACEHOLDERS: NASA public-domain images standing in until the club's own
     photos are added. */
  gallery: [
    { src: "perseids", w: 800, h: 425, date: "2026-08-12", title: "Perseids over the coulees", place: "Dark-sky site", credit: "NASA / Bill Ingalls", caption: "A long exposure on the peak night of the Perseid meteor shower.", fr: { title: "Les Perséides au-dessus des coulées", place: "Site sombre", caption: "Une longue pose pendant la nuit de pointe des Perséides." } },
    { src: "eclipse-table", w: 800, h: 533, date: "2026-04-08", title: "Eclipse-viewing table", place: "Campus", credit: "NASA", caption: "Solar glasses, pinhole projectors and a lot of people looking up.", fr: { title: "Table d'observation de l'éclipse", place: "Campus", caption: "Lunettes solaires, projecteurs à sténopé et beaucoup de monde le nez en l'air." } },
    { src: "orion", w: 800, h: 800, date: "2026-02-19", title: "The Orion Nebula, M42", place: "Club telescope", credit: "NASA, ESA / Hubble", caption: "The first deep-sky target most of us ever find. Stacked from many short exposures.", fr: { title: "La nébuleuse d'Orion, M42", place: "Télescope du club", caption: "La première cible du ciel profond que la plupart d'entre nous trouvons. Empilement de nombreuses poses courtes." } },
    { src: "aurora", w: 800, h: 533, date: "2026-05-10", title: "Aurora, seen from above", place: "Space Station", credit: "NASA / ISS Expedition 72", caption: "The night the aurora reached southern Alberta — this is what it looked like from orbit.", fr: { title: "L'aurore vue d'en haut", place: "Station spatiale", caption: "La nuit où l'aurore a atteint le sud de l'Alberta — voici ce que ça donnait vu de l'orbite." } },
    { src: "blue-moon", w: 800, h: 533, date: "2026-08-19", title: "Blue moon rising", place: "Oldman River valley", credit: "NASA", caption: "The second full moon of the month, low and orange through the haze.", fr: { title: "Lever de la lune bleue", place: "Vallée de la rivière Oldman", caption: "La deuxième pleine lune du mois, basse et orangée à travers la brume." } },
    { src: "andromeda", w: 800, h: 800, date: "2026-10-10", title: "Andromeda, M31", place: "Club telescope", credit: "NASA / JPL-Caltech", caption: "Two and a half million light-years away, and still visible to the naked eye from a dark site.", fr: { title: "Andromède, M31", place: "Télescope du club", caption: "À deux millions et demi d'années-lumière, et pourtant visible à l'œil nu depuis un site sombre." } },
    { src: "neowise", w: 800, h: 645, date: "2026-07-14", title: "A comet at dusk", place: "West of the city", credit: "NASA / Bill Ingalls", caption: "Look low in the northwest just after twilight — binoculars help.", fr: { title: "Une comète au crépuscule", place: "À l'ouest de la ville", caption: "Regardez bas au nord-ouest juste après le crépuscule — des jumelles aident." } },
    { src: "trails", w: 800, h: 532, date: "2026-09-26", title: "Star trails", place: "Long exposure", credit: "NASA / Don Pettit", caption: "Stack enough exposures and the sky turns into streaks of light.", fr: { title: "Filés d'étoiles", place: "Longue pose", caption: "Empilez assez de poses et le ciel devient une pluie de traits de lumière." } },
  ],
};
