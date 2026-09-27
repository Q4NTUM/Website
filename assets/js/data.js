/* ==========================================================================
   Site content — edit this file to add events, news and equations.

   EVENTS
     start / end : local Lethbridge time as "YYYY-MM-DD HH:MM" (24-hour).
                   Daylight saving is handled automatically.
     cat         : talk · observing · workshop · social · competition
     fr          : optional French overrides { title, desc, location }
   NEWS
     date        : "YYYY-MM-DD"; art: orbit · wave · lattice · spiral · constellation
     fr          : optional French overrides { title, tag, excerpt, body }

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
      title: "Cosmic Cinema is back — under the stars, sort of",
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
    { html: '<i>e</i><sup><i>iπ</i></sup> + 1 = 0', caption: "Euler's identity — five fundamental constants, three basic operations, one line.", fr: { caption: "L'identité d'Euler — cinq constantes fondamentales, trois opérations, une seule ligne." } },
    { html: '∇ · <b>E</b> = <i>ρ</i> / <i>ε</i><sub>0</sub>', caption: "Gauss's law — electric field lines begin and end on charge.", fr: { caption: "La loi de Gauss — les lignes de champ électrique naissent et meurent sur les charges." } },
    { html: '<i>iħ</i> ∂<sub><i>t</i></sub><i>ψ</i> = <i>Ĥψ</i>', caption: "The Schrödinger equation — how a quantum state evolves in time.", fr: { caption: "L'équation de Schrödinger — comment un état quantique évolue dans le temps." } },
    { html: '<i>G</i><sub><i>μν</i></sub> + Λ<i>g</i><sub><i>μν</i></sub> = <span class="nowrap">8π<i>G</i>/<i>c</i><sup>4</sup></span> <i>T</i><sub><i>μν</i></sub>', caption: "Einstein's field equations — matter tells spacetime how to curve.", fr: { caption: "Les équations d'Einstein — la matière dit à l'espace-temps comment se courber." } },
    { html: '<i>S</i> = <i>k</i><sub>B</sub> ln Ω', caption: "Boltzmann's entropy — engraved on his tombstone in Vienna.", fr: { caption: "L'entropie de Boltzmann — gravée sur sa tombe à Vienne." } },
  ],
};
