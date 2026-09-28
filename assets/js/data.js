/* ==========================================================================
   Site content — edit this file to add events, news and equations.

   EVENTS
     start / end : local Lethbridge time as "YYYY-MM-DD HH:MM" (24-hour).
                   Daylight saving is handled automatically.
     cat         : talk · observing · workshop · social · competition
     bring       : optional list of things to bring (otherwise a default per category)
     details     : optional list of extra paragraphs for the event's own page
     Every event gets its own shareable page: event.html?id=THE-ID
   NEWS
     date        : "YYYY-MM-DD"; art: orbit · wave · lattice · spiral · constellation
   EQUATIONS     html is inserted as-is (trusted markup)
   VENUES · PROBLEMS · GALLERY — see the notes above each list further down

   ========================================================================== */

window.PAMA_DATA = {
  events: [
    // ---- Past (kept for the archive) ----
    {
      id: "clubs-rush-2026", cat: "social",
      title: "Club Rush Booth",
      start: "2026-09-14 10:00", end: "2026-09-14 15:00",
      location: "University Hall",
      desc: "Our first public appearance as PAMA. Hosted a club signup, where over 30 new members joined the club!",
    },
    {
      id: "cosmic-cinema-sept", cat: "social",
      title: "Cosmic Cinema: Project Hail Mary",
      start: "2026-09-18 17:30", end: "2026-09-18 19:30",
      location: "Science Commons, SA8005",
      desc: "PAMA's first Cosmic Cinema event. Meet the members of PAMA, and come to watch Project Hail Mary. Bring a friend from any program.",
    },
    {
      id: "jamboree-2026-volunteering", cat: "social",
      title: "Volunteering for Jamboree music festival",
      start: "2026-09-13 11:00", end: "2026-09-13 15:00",
      location: "Helper Hall",
      desc: "Club volunteering opportunity for the Jamboree music festival. Free pizza is available for everyone, and don't forget to mention your involvement with PAMA!",
    },
     
    // ---- Upcoming ----
    {
      id: "cosmic-cinema-planned", cat: "social",
      title: "Cosmic Cinema: Planned",
      start: "2027-10-01 19:00", end: "2027-10-01 22:00",
      location: "Science Commons, SA8005",
      desc: "Our next Cosmic Cinema event is currently being planned. Stay on the lookout!",
    },
   /*
    {
      id: "problem-night-fermi", cat: "workshop",
      title: "Problem Night: Fermi Estimation",
      start: "2026-10-08 18:00", end: "2026-10-08 20:00",
      location: "Science Commons, Room TBA",
      desc: "How many piano tuners are in Lethbridge? How much does the atmosphere weigh? Learn to reason your way to answers within an order of magnitude.",
    },
    {
      id: "stargazing-october", cat: "observing",
      title: "Coulee Stargazing Night",
      start: "2026-10-10 20:30", end: "2026-10-10 23:00",
      location: "Dark-sky site — carpool from campus",
      desc: "New moon weekend. We'll tour the Andromeda Galaxy, the Double Cluster and Saturn's rings through club telescopes. Dress warmly; weather permitting.",
    },
    {
      id: "colloquium-gw", cat: "talk",
      title: "Listening to Black Holes",
      start: "2026-10-15 17:00", end: "2026-10-15 18:15",
      location: "Science Commons, Lecture Theatre",
      desc: "An accessible introduction to gravitational-wave astronomy: how LIGO measures a change smaller than a proton, and what the signals are telling us. Speaker TBA.",
    },
    {
      id: "python-1", cat: "workshop",
      title: "Python for Physicists I",
      start: "2026-10-22 18:00", end: "2026-10-22 20:00",
      location: "Science Commons, Computer Lab",
      desc: "From zero to your first simulation: NumPy arrays, a projectile with drag and a plot you'd be proud to put in a lab report. Laptops welcome, not required.",
    },
    {
      id: "halloween-2026", cat: "social",
      title: "Spooky Action at a Distance",
      start: "2026-10-29 19:00", end: "2026-10-29 22:00",
      location: "Location TBA",
      desc: "Our Halloween social. Costume prize for the best dressed physicist, mathematician or celestial object. Entanglement optional.",
    },
    {
      id: "grad-panel", cat: "talk",
      title: "Grad School & Careers Panel",
      start: "2026-11-05 17:00", end: "2026-11-05 18:30",
      location: "Science Commons, Room TBA",
      desc: "Graduate students, alumni and faculty on research, applications, NSERC awards and careers beyond academia. Bring your questions.",
    },
    {
      id: "stargazing-november", cat: "observing",
      title: "Winter Sky Preview",
      start: "2026-11-07 19:30", end: "2026-11-07 22:00",
      location: "Dark-sky site — carpool from campus",
      desc: "Orion rises. A guided look at the Pleiades, the Orion Nebula and Jupiter, plus a beginner's session on reading a star chart.",
    },
    {
      id: "integration-bee", cat: "competition",
      title: "The Integration Bee",
      start: "2026-11-12 18:00", end: "2026-11-12 20:30",
      location: "Science Commons, Lecture Theatre",
      desc: "Single-elimination calculus on the big screen. Spectators welcome, competitors celebrated. Prizes for the top three.",
    },
    {
      id: "python-2", cat: "workshop",
      title: "Python for Physicists II",
      start: "2026-11-19 18:00", end: "2026-11-19 20:00",
      location: "Science Commons, Computer Lab",
      desc: "Fitting real data: uncertainties, least squares and honest error bars, using a pendulum dataset we'll take in the room.",
    },
    {
      id: "colloquium-math", cat: "talk",
      title: "The Unreasonable Effectiveness of Mathematics",
      start: "2026-11-26 17:00", end: "2026-11-26 18:15",
      location: "Science Commons, Lecture Theatre",
      desc: "Why does abstract mathematics describe the physical world so well? A conversation between a mathematician and a physicist. Speakers TBA.",
    },
    {
      id: "study-jam-fall", cat: "workshop",
      title: "End-of-Term Study Jam",
      start: "2026-12-03 12:00", end: "2026-12-03 18:00",
      location: "Science Commons, Atrium",
      desc: "Drop-in study hall with upper-year and graduate volunteers for first- and second-year physics, astronomy and math courses. Coffee provided.",
    },
    {
      id: "winter-welcome", cat: "social",
      title: "Winter Term Welcome Back",
      start: "2027-01-14 17:30", end: "2027-01-14 19:30",
      location: "Science Commons, Atrium",
      desc: "Hot chocolate, new-semester planning and a first look at the winter lineup.",
    },
    {
      id: "pi-day-2027", cat: "competition",
      title: "Pi Day",
      start: "2027-03-12 11:00", end: "2027-03-12 14:00",
      location: "Students' Union Building",
      desc: "Pie, a digit-recitation challenge and a Buffon's-needle experiment to estimate π live. (Celebrated on the Friday before 3.14.)",
    },
    */
  ],

  news: [
    {
      id: "cosmic-cinema-returns", date: "2026-09-10", tag: "Events", art: "orbit",
      title: "Official launch of Cosmic Cinema",
      excerpt: "Our film event series, an opportunity to meet members of PAMA and enjoy a good movie!",
      body: [
        "Our Cosmic Cinema series is open to all students. Meet us for our first event on September 18, 2026 to watch Project Hail Mary and meet the fellow members of PAMA. Feel free to bring a friend and popcorn.",
        "If you have suggestions for future Cosmic Cinema events, please feel free to let us know!",
      ],
    },
    /*
    {
      id: "meet-the-exec", date: "2026-09-12", tag: "Community", art: "constellation",
      title: "Meet the 2026–27 executive team",
      excerpt: "Six undergraduates and four graduate advisors are steering PAMA through its first full year.",
      body: [
        "PAMA's first elected executive brings together students from physics, astronomy, mathematics and beyond. Their priorities for the year: a regular events calendar, peer study support for first-year courses, and stronger connections to research on campus.",
        "You can find the full team, and what each role does, on our Team page. Executive meetings are open to members; if you'd like to help out, we're always looking for volunteers.",
      ],
    },
    */
    {
      id: "ratified", date: "2026-09-27", tag: "Announcement", art: "lattice",
      title: "PAMA is officially a ratified student club",
      excerpt: "We're now a recognised club under the Students' Union, which means funding, room bookings and a lot more events.",
      body: [
        "After a few weeks of paperwork, PAMA has been ratified as an official student club. Ratification lets us book rooms on campus, apply for club funding and partner with academic departments on events.",
        "Thank you to everyone who signed on as a founding member. Membership is free and open to every student, whatever your program.",
      ],
    },
    {
      id: "physics-club-to-pama", date: "2026-08-15", tag: "Story", art: "wave",
      title: "From Physics Club to PAMA: why we changed our name",
      excerpt: "Same curiosity, a wider sky. Why astronomy and mathematics now share top billing.",
      body: [
        "For years the Physics Club was a small, dedicated group of majors. As interest in astronomy and mathematics grew among its members, the name no longer fit the people in the room.",
        "The Physics, Astronomy & Mathematics Association keeps everything that made the club work — informal talks, problem nights, film screenings — and opens the door wider to anyone who finds these subjects beautiful, whatever their major.",
      ],
    },
    {
      id: "call-for-speakers", date: "2026-08-15", tag: "Opportunity", art: "spiral",
      title: "Call for speakers: share your research",
      excerpt: "Doing an honours project, a summer USRA or a grad thesis? We'd love to hear about it.",
      body: [
        "Our lightning-talk evenings give students a relaxed place to present their research in 10 minutes or less. It's excellent practice for conferences like CUPC, and the audience is friendly.",
        "Undergraduate and graduate speakers from any discipline are welcome. Reach out on Instagram or speak to any member of the executive to claim a slot.",
      ],
    },
  ],

  equations: [
    /* Wrap each symbol worth explaining in <span data-t="n">; terms[n] labels it */
    {
      html: '<span data-t="0"><i>e</i></span><sup><span data-t="1"><i>i</i></span><span data-t="2"><i>π</i></span></sup> + <span data-t="3">1</span> = <span data-t="4">0</span>',
      field: "Complex analysis", year: 1748,
      terms: ["Euler's number", "imaginary unit", "circle constant", "unity", "zero"],
      caption: "Euler's identity — five fundamental constants, three basic operations, one line.",
    },
    {
      html: '<span data-t="0">∇ ·</span> <span data-t="1"><b>E</b></span> = <span data-t="2"><i>ρ</i></span> / <span data-t="3"><i>ε</i><sub>0</sub></span>',
      field: "Electromagnetism", year: 1835,
      terms: ["divergence", "electric field", "charge density", "vacuum permittivity"],
      caption: "Gauss's law — electric field lines begin and end on charge.",
    },
    {
      html: '<span data-t="0"><i>iħ</i></span> <span data-t="1">∂<sub><i>t</i></sub><i>ψ</i></span> = <span data-t="2"><i>Ĥ</i></span><i>ψ</i>',
      field: "Quantum mechanics", year: 1926,
      terms: ["reduced Planck constant", "how the state changes", "Hamiltonian · energy"],
      caption: "The Schrödinger equation — how a quantum state evolves in time.",
    },
    {
      html: '<span data-t="0"><i>G</i><sub><i>μν</i></sub></span> + <span data-t="1">Λ</span><span data-t="2"><i>g</i><sub><i>μν</i></sub></span> = <span class="nowrap" data-t="3">8π<i>G</i>/<i>c</i><sup>4</sup></span> <span data-t="4"><i>T</i><sub><i>μν</i></sub></span>',
      field: "General relativity", year: 1915,
      terms: ["curvature", "cosmological constant", "metric", "coupling", "matter & energy"],
      caption: "Einstein's field equations — matter tells spacetime how to curve.",
    },
    {
      html: '<span data-t="0"><i>S</i></span> = <span data-t="1"><i>k</i><sub>B</sub></span> ln <span data-t="2">Ω</span>',
      field: "Statistical mechanics", year: 1877,
      terms: ["entropy", "Boltzmann constant", "number of microstates"],
      caption: "Boltzmann's entropy — engraved on his tombstone in Vienna.",
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
    },
    {
      title: "A rope around the equator",
      fig: "rope",
      q: "A rope hugs the Earth's equator. Add one metre to its length and lift it evenly all the way round. How big is the gap underneath — enough for a sheet of paper, or a cat?",
      hint: "Circumference is 2πr. If the circumference grows by 1 m, how much does r grow?",
      answer: "Δr = 1 m / 2π ≈ 16 cm — a cat walks under easily. The answer doesn't depend on the size of the sphere at all: it's the same for a basketball.",
    },
    {
      title: "How far is the horizon?",
      fig: "horizon",
      q: "Standing on the flat prairie with your eyes 1.7 m above the ground, how far away is the horizon?",
      hint: "Draw the right triangle: Earth's radius R, your line of sight, and R + h from the centre to your eyes.",
      answer: "d = √((R + h)² − R²) ≈ √(2Rh) = √(2 × 6.37 × 10⁶ m × 1.7 m) ≈ 4.7 km. From the top of the High Level Bridge (about 96 m) it grows to roughly 35 km.",
    },
    {
      title: "Twenty-three strangers",
      fig: "birthday",
      q: "How many people need to be in a room before it's more likely than not that two of them share a birthday?",
      hint: "It's much easier to compute the probability that nobody shares a birthday, then subtract from one.",
      answer: "Just 23. The chance that all 23 birthdays differ is 365/365 × 364/365 × … × 343/365 ≈ 0.49 — because there are 253 different pairs, not 23.",
    },
    {
      title: "The snail on the rubber band",
      fig: "snail",
      q: "A snail crawls at 1 cm/s along a 1 m rubber band. Every second, the band is stretched by another metre (uniformly, carrying the snail with it). Does the snail ever reach the end?",
      hint: "Track the fraction of the band the snail has covered, not the distance. Stretching doesn't change that fraction.",
      answer: "Yes! In second n it covers 1/(100n) of the band, so after N seconds it has covered (1/100)(1 + 1/2 + … + 1/N). The harmonic series diverges, so it gets there — after about e¹⁰⁰ ≈ 10⁴³ seconds.",
    },
  ],

  /* Logbook — photos from club nights. Files live in assets/img/logbook/ as
     NAME-800.jpg (grid) and NAME-1600.jpg (full screen); w/h are the 800 size.
     PLACEHOLDERS: NASA public-domain images standing in until the club's own
     photos are added. */
  gallery: [
    { src: "perseids", w: 800, h: 425, date: "2026-08-12", title: "Perseids over the coulees", place: "Dark-sky site", credit: "NASA / Bill Ingalls", caption: "A long exposure on the peak night of the Perseid meteor shower." },
    { src: "eclipse-table", w: 800, h: 533, date: "2026-04-08", title: "Eclipse-viewing table", place: "Campus", credit: "NASA", caption: "Solar glasses, pinhole projectors and a lot of people looking up." },
    { src: "orion", w: 800, h: 800, date: "2026-02-19", title: "The Orion Nebula, M42", place: "Club telescope", credit: "NASA, ESA / Hubble", caption: "The first deep-sky target most of us ever find. Stacked from many short exposures." },
    { src: "aurora", w: 800, h: 533, date: "2026-05-10", title: "Aurora, seen from above", place: "Space Station", credit: "NASA / ISS Expedition 72", caption: "The night the aurora reached southern Alberta — this is what it looked like from orbit." },
    { src: "blue-moon", w: 800, h: 533, date: "2026-08-19", title: "Blue moon rising", place: "Oldman River valley", credit: "NASA", caption: "The second full moon of the month, low and orange through the haze." },
    { src: "andromeda", w: 800, h: 800, date: "2026-10-10", title: "Andromeda, M31", place: "Club telescope", credit: "NASA / JPL-Caltech", caption: "Two and a half million light-years away, and still visible to the naked eye from a dark site." },
    { src: "neowise", w: 800, h: 645, date: "2026-07-14", title: "A comet at dusk", place: "West of the city", credit: "NASA / Bill Ingalls", caption: "Look low in the northwest just after twilight — binoculars help." },
    { src: "trails", w: 800, h: 532, date: "2026-09-26", title: "Star trails", place: "Long exposure", credit: "NASA / Don Pettit", caption: "Stack enough exposures and the sky turns into streaks of light." },
  ],
};
