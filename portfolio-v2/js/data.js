/* All content for the portfolio lives here: projects, experience and competence areas.
   The views in app.js and the network in scene.js both read from this file. */
(function () {
  'use strict';

  var COLOR = { research: '#FDBA74', engineering: '#38BDF8', side: '#86EFAC' };
  var CATNAME = { research: 'Research', engineering: 'Engineering', side: 'Side project' };

  var SKILLS = ['Fortran', '3D MHD', 'HPC', 'Tecplot', 'Monte Carlo', 'Python', 'Bash', 'C++', 'DOORS NG', 'TestStand', 'LabVIEW', 'JavaScript'];
  /* The ticker on Home. The dot takes the colour of the area a tool belongs to in the network; shared tools stay white. */
  var TICKER = [['NI TestStand', 'engineering'], ['LabVIEW', 'engineering'], ['Python'], ['C++', 'engineering'], ['DOORS NG', 'engineering'], ['Bash'], ['Fortran', 'research'], ['3D MHD', 'research'], ['Monte Carlo', 'research'], ['HPC', 'research'], ['Tecplot', 'research'], ['JIRA', 'engineering'], ['Git']];
  var AREAS = [
    { id: 'd:research', cat: 'research', label: 'Research' },
    { id: 'd:engineering', cat: 'engineering', label: 'Engineering' },
    { id: 'd:side', cat: 'side', label: 'Side projects' }
  ];

  var PROJECTS = [
    {
      id: 'cme', cat: 'research', motif: 'loops',
      short: 'CMEs on AB Doradus',
      title: 'Coronal mass ejections on AB Doradus',
      kind: 'Doctoral research', where: 'Leiden Observatory', period: '2022–2023',
      desc: 'When does a strong magnetic field hold a stellar eruption back? 21 3D MHD simulations of a young Sun-like star.',
      lead: 'AB Dor is a young Sun-like star, about 120 million years old, with a surface magnetic field 100 to 1,000 times stronger than the Sun\'s. Theory says a field that strong should hold eruptions back. Yet dimming seen in EUV and X-ray data points to coronal mass ejections at high latitudes. I ran a parametric 3D MHD study to find out when an eruption escapes and when it stays confined.',
      skills: ['Fortran', '3D MHD', 'HPC', 'Tecplot', 'Python', 'Bash'],
      stats: [['21', 'simulated eruptions'], ['11 / 10', 'erupted / stayed confined'], ['4×', 'higher field needed in closed regions'], ['3,700 km/s', 'fastest eruption after one hour']],
      facts: [['Method', '3D MHD, BATS-R-US'], ['Compute', 'Snellius supercomputer'], ['Published', 'MNRAS 533, 2024']],
      blocks: [
        { type: 'text', title: 'Why this star', body: [
          'A 1994 EUVE observation of AB Dor showed dimming that lasted 13.3 hours, about as long as the star\'s rotation period of 0.51 days. A source that stays in view through a whole rotation has to sit near a pole, so the eruption came from high latitude (Veronig et al. 2021).',
          'I was selected for one of 13 doctoral projects at Leiden Observatory from more than 500 applicants, and this study became the first paper from that work.'
        ] },
        { type: 'table', title: 'AB Doradus', rows: [['Spectral type', 'K0V'], ['Age', 'about 120 Myr'], ['Mass', '0.86 M☉'], ['Radius', '0.96 R☉'], ['Rotation period', '0.514 days'], ['Surface magnetic field', 'kG strength, 100–1,000 × the Sun']] },
        { type: 'list', title: 'Method', items: [
          'Stellar wind from the Alfvén Wave Solar Model (AWSOM) in the 3D MHD code BATS-R-US, with Alfvén wave heating.',
          'Surface field from Zeeman-Doppler imaging of spectropolarimetric observations, December 2002 (Hussain et al. 2007).',
          'Eruptions injected as Titov & Démoulin (1999) flux ropes with footpoints anchored to the stellar surface.',
          'Flux ropes placed at about 60° latitude, in both open and closed magnetic field regions.',
          '21 runs varying location, flux rope mass and field strength, analysed one hour after injection: morphology, eruption or confinement, velocity, mass and kinetic energy.',
          'Post-processing in Python and (Py)Tecplot, compared with Hubble and EUVE observations.'
        ] },
        { type: 'table', title: 'Flux rope parameters', rows: [['Mass', '3.5×10¹⁴ to 3.5×10¹⁸ g'], ['Central field strength', '100 to 1,000 G'], ['Location', 'Open or closed field regions at about 60° latitude'], ['Geometry (fixed)', 'Major radius 128 Mm, minor radius 20 Mm, depth 1 Mm'], ['Wind solution', 'Domain to about 8 R☉, polar wind up to about 1,000 km/s']] },
        { type: 'bars', title: 'Field strength needed to erupt', unit: 'G', max: 1000, rows: [['Open field region', 200, 'research'], ['Closed field region', 800, 'engineering']],
          note: 'The fourfold difference is the extra magnetic tension a flux rope has to overcome under closed field lines. Field geometry is the main control on whether an eruption gets out.' },
        { type: 'dots', title: 'Outcome of the 21 runs', groups: [[11, 'erupted', 'research'], [10, 'confined', 'engineering']] },
        { type: 'list', title: 'Results', items: [
          'Eruptions in open field regions are much more likely to escape.',
          'In closed field regions an eruption needs a free magnetic energy of at least 3×10³⁵ erg.',
          'Erupting CMEs moved at 220 to 3,700 km/s after one hour, up to five times the background wind speed.',
          'The most energetic model carried 4.1×10¹⁸ g and a kinetic energy of 2.9×10³⁵ erg.',
          'For identical flux ropes, closed-region CMEs were systematically slower: magnetic tension limits their kinetic energy.',
          'Mass, velocity and kinetic energy all rise with poloidal magnetic flux, with separate power-law fits for open and closed regions and energy differences of up to six orders of magnitude.'
        ] },
        { type: 'quote', title: 'What it means', body: 'High-latitude active regions in open field are the natural place for energetic eruptions on AB Dor. That fits the 1994 EUVE dimming and the star\'s known polar spots.' },
        { type: 'list', title: 'Presented at', items: ['BCool Exospace Weather Workshop, Max Planck Institute, Göttingen, 2023: talk on how strong overlying magnetic fields suppress CMEs on AB Dor.', 'KISS workshop and think tank, Caltech, 2023: selected as one of a few early-career candidates to shape future space missions for extrasolar space weather.'] }
      ],
      cite: 'K. M. Strickert, D. Evensberget, A. A. Vidotto (2024). High-latitude coronal mass ejections on the young solar-like star AB Dor. Monthly Notices of the Royal Astronomical Society 533, 1156–1165.',
      links: [['Read on MNRAS', 'https://academic.oup.com/mnras/article/533/1/1156/7729277'], ['DOI 10.1093/mnras/stae1884', 'https://doi.org/10.1093/mnras/stae1884'], ['arXiv:2408.00637', 'https://arxiv.org/abs/2408.00637'], ['PDF', '../Paper_PhD.pdf']]
    },
    {
      id: 'bh', cat: 'research', motif: 'cluster',
      short: 'Black holes in star clusters',
      title: 'Black holes in star clusters',
      kind: 'MSc thesis, 60 credits', where: 'Lund Observatory', period: '2021–2022',
      desc: 'Observable signs of black holes in globular clusters, drawn from more than 1,500 Monte Carlo cluster models.',
      lead: 'Do globular clusters hide black holes, and can we tell from the stars we see? My Master\'s thesis follows how subsystems of stellar-mass black holes and intermediate-mass black holes change the way a cluster evolves, and turns that into signatures an observer can look for.',
      skills: ['Monte Carlo', 'Python', 'Bash'],
      stats: [['1,500+', 'cluster models'], ['64', 'stellar-mass black holes predicted in NGC 3201'], ['~1,000 M☉', 'black hole that best explains 47 Tucanae'], ['~12%', 'core binary fraction with an IMBH']],
      facts: [['Method', 'Monte Carlo N-body, MOCCA'], ['Compared with', 'Milky Way cluster observations']],
      blocks: [
        { type: 'list', title: 'Approach', items: [
          'More than 1,500 globular cluster models run with the MOCCA code for Monte Carlo N-body dynamics, with population synthesis from the SSE and BSE codes.',
          'MOCCA-Survey Database II used to widen the range of initial conditions.',
          'COCOA code for automated cluster projection and property extraction.',
          'Mass segregation measured two ways: r₅₀ for relative distributions and A⁺ for population separation.',
          'Main-sequence stars, blue stragglers, giants, binaries and compact objects analysed at different radii.',
          'Simulated clusters matched against Milky Way data from the Harris catalogue and recent surveys.',
          'Analysis written in Python with Bash and AWK scripts around it.'
        ] },
        { type: 'list', title: 'Findings', items: [
          'Mass segregation is strongly enhanced in clusters with short relaxation times that host an intermediate-mass black hole.',
          'Blue straggler formation follows the cluster\'s relaxation time and central surface brightness.',
          'Clusters with an IMBH keep core binary fractions of about 12%, falling off as (r/r_hl)^−0.132; clusters with a black hole subsystem show a shallower decline.',
          '64 (+158, −45) stellar-mass black holes predicted to remain in NGC 3201.',
          '47 Tucanae is best explained by an intermediate-mass black hole of about 1,000 M☉.',
          'Low binary fraction, bright centre and strong segregation together identify clusters that host an IMBH.'
        ] },
        { type: 'list', title: 'Presented at and workshops', items: ['Astroflow Workshop, Leiden Observatory, 2022: presented the thesis research.', 'Direct N-body Simulations Workshop, Heidelberg (online), 2021: Nbody6++GPU and supercomputer use on Kepler.', 'TRENDY3, Evanston, 2021: conference on triple and multiple star evolution and dynamics.'] }
      ],
      cite: 'Markus Strickert (2022). Black Hole Dynamics in Stellar Clusters. Master\'s thesis, Lund Observatory, Lund University.',
      links: [['Lund University publication', 'https://lup.lub.lu.se/luur/download?func=downloadFile&recordOId=9095211&fileOId=9095212'], ['PDF', '../2022-EXA196_Strickert-Markus.pdf']]
    },
    {
      id: 'gal', cat: 'research', motif: 'spread',
      short: 'Galactic civilisations',
      title: 'Galactic civilisations',
      kind: 'BSc thesis, 15 credits', where: 'Lund Observatory', period: '2020',
      desc: 'Can one spreading civilisation colonise a region of the galaxy before others appear? A stellar-dynamics and probability model.',
      lead: 'A take on the Fermi paradox: can a single interstellar civilisation colonise the galaxy faster than new civilisations develop? The model lets civilisations hop to nearby planets during close encounters between star systems and counts who gets there first.',
      skills: ['Monte Carlo', 'Python'],
      stats: [['200–1,000', 'Sun-like stars tracked'], ['0.27–4.8 Gyr', 'until the first civilisation'], ['89%', 'of planets colonised by one spreading civilisation'], ['36–82 pc', 'mean distance to the nearest neighbour']],
      facts: [['Model', 'Epicyclic motion of 200–1,000 stars'], ['Time span', '12 billion years']],
      blocks: [
        { type: 'list', title: 'Approach', items: [
          'Epicyclic motion of 200 to 1,000 stars in the solar neighbourhood from galactic dynamics.',
          'Close encounters between stars tracked with stochastic simulations.',
          'Abiogenesis and the rise of civilisations drawn from probability distributions, with a steepness parameter N.',
          'Scenarios with one spreading civilisation compared with many stationary ones.',
          'Stellar dynamics followed for more than 12 billion years, in a self-contained Python model.'
        ] },
        { type: 'list', title: 'Findings', items: [
          'The first technological civilisation appears after 270 million to 4.8 billion years, depending on N.',
          'Colonisation grows exponentially, then levels off as free planets run out.',
          'With 1,000 stars and N = 3, a single spreading civilisation reaches 89% of all planets within 12 billion years.',
          'With N = 0, stationary civilisations dominate and end up on 99 to 99.7% of planets.',
          'Higher star density favours the spreading civilisation.',
          'Fast colonisation needs both high star density and favourable evolution parameters.'
        ] }
      ],
      cite: 'Markus Strickert (2020). Galactic Dynamics and the Spread of Galactic Civilisations. Bachelor\'s thesis, Lund Observatory, Lund University.',
      links: [['Lund University publication', 'https://lup.lub.lu.se/luur/download?func=downloadFile&recordOId=8975819&fileOId=8975820'], ['PDF', '../Galactic_Dynamics_and_the_Spread_of_Galactic_Civilisations.pdf']]
    },
    {
      id: 'sph', cat: 'research', motif: 'collide',
      short: 'Stellar collisions',
      title: 'Stellar collisions',
      kind: 'Summer research project', where: 'Lund University', period: '2021',
      desc: '576 stellar collisions simulated with smoothed particle hydrodynamics and analysed with Delaunay triangulation.',
      lead: 'A summer of smoothed particle hydrodynamics: 576 collisions between stars, run on the Aurora and SNIC supercomputers, with a Delaunay triangulation method for the analysis afterwards.',
      skills: ['HPC', 'Python'],
      stats: [['576', 'collisions simulated'], ['2', 'supercomputers, Aurora and SNIC']],
      facts: [['Method', 'Smoothed particle hydrodynamics'], ['Compute', 'Aurora and SNIC supercomputers']],
      blocks: [
        { type: 'list', title: 'What I did', items: [
          'Set up and ran 576 stellar collisions with smoothed particle hydrodynamics.',
          'Implemented Delaunay triangulation for post-processing.',
          'Visualised the results with matplotlib.',
          'The results went into a paper that was in preparation at the time.'
        ] }
      ],
      links: []
    },
    {
      id: 'viz', cat: 'research', motif: 'field',
      short: 'Scientific visualisation',
      title: 'Scientific visualisation and analysis',
      kind: 'Tools and methods', where: 'Lund and Leiden', period: '2020–2023',
      desc: 'Pipelines that turn multi-dimensional simulation output into figures, animations and numbers.',
      lead: 'Every simulation above ended in the same place: terabytes of output that had to become a figure someone can read. Over the research years I built the processing and visualisation pipelines for that.',
      skills: ['Python', 'Tecplot', 'Bash'],
      stats: [],
      facts: [['Tools', 'Python, Tecplot, PyTecplot'], ['Output', 'Figures, animations, video']],
      blocks: [
        { type: 'list', title: 'Tools', items: [
          'Python with Matplotlib, NumPy and SciPy.',
          'Tecplot for 3D rendering and animations, scripted through PyTecplot.',
          'Custom animation pipelines in Python and Bash, with AWK for filtering.',
          'LaTeX for papers and structured documentation, Git for versions.'
        ] },
        { type: 'list', title: 'What it produces', items: [
          '2D and 3D plots and heatmaps.',
          'Particle trajectory animations.',
          'Magnetic field topology in 3D.',
          'Time series analysis and rendering.',
          'Multi-panel figures at publication quality, and video for talks.'
        ] }
      ],
      links: []
    },
    {
      id: 'sv', cat: 'engineering', motif: 'vmodel',
      short: 'System verification',
      title: 'System verification',
      kind: 'System verification engineer', where: 'Saab Dynamics, via BerDiz', period: '2023–2026',
      desc: 'Verification from early development to customer delivery, across hardware, firmware and software.',
      lead: 'Three years of system verification across software and hardware. I started, wrote and verified products from early development to customer delivery, with hands-on integration and commissioning along the way.',
      skills: ['C++', 'Python', 'Bash', 'DOORS NG'],
      stats: [['3 years', 'system-level verification'], ['HW · FW · SW', 'tested together in the lab'], ['Top score', 'in the consultant evaluation, 2024']],
      facts: [['Role', 'System test responsible'], ['Requirements', 'DOORS NG'], ['Way of working', 'Agile, JIRA']],
      split: [['Test writing and execution', 30], ['Requirement management', 20], ['Simulator development', 20], ['Test automation', 20], ['Firmware and software processing', 10]],
      blocks: [
        { type: 'list', title: 'Responsibilities', items: [
          'System test responsible in customer interactions, formal system analyses and customer demonstrations.',
          'Coordinated test activities and lab spaces, and handled security-classified equipment.',
          'Team-lead duties and agile retrospectives.',
          'Technical and formal verification documents used across several teams.',
          'Requirements and test specifications in DOORS NG.',
          'Test automation and simulator improvements in C++ and Python.',
          'Quality assurance and structured handling of secure information.'
        ] },
        { type: 'table', title: 'Working environment', rows: [['Requirements and test specifications', 'DOORS NG'], ['Programming and automation', 'C++, Python, Bash, CLI'], ['Data analysis and post-processing', 'Python'], ['Method', 'Agile workflows in JIRA'], ['Documents and information', 'IFS'], ['Standards', 'Military standards'], ['Test and verification', 'Hardware and firmware in the lab, software against hardware']] }
      ],
      links: []
    },
    {
      id: 'ta', cat: 'engineering', motif: 'matrix',
      short: 'Test automation',
      title: 'Test automation',
      kind: 'Test and verification engineer', where: 'Sigma Technology Tech House', period: '2026 – now',
      desc: 'Automated production tests for circuit boards: instruments, hardware control and signal routing in one sequence.',
      lead: 'I develop and automate PCB production test sequences in NI TestStand, LabVIEW and NI Switch Executive, bringing measurement instruments, hardware control and signal routing together. I am also responsible for verification, requirements, documentation and test reports. The first solution was demonstrated to the customer and praised for its intuitive design, clear structure and reproducibility.',
      skills: ['TestStand', 'LabVIEW'],
      stats: [],
      facts: [['Tools', 'NI TestStand, LabVIEW, NI Switch Executive'], ['Scope', 'PCB production test, signal routing, measurement']],
      split: [['Test sequences in TestStand', 35], ['Instruments and hardware control', 25], ['Signal routing', 20], ['Verification and documentation', 20]],
      blocks: [
        { type: 'list', title: 'What the tests cover', items: [
          'MUX switch routing.',
          'Circuit specification analysis.',
          'Electrical measurements and filtering.',
          'Ethernet connectivity and protocol validation.'
        ] },
        { type: 'table', title: 'Stack', rows: [['Sequencing', 'NI TestStand'], ['Instrument code', 'LabVIEW'], ['Signal routing', 'NI Switch Executive'], ['Configuration and debugging', 'NI MAX and NI debugging tools']] },
        { type: 'quote', title: 'Outcome', body: 'An automated test solution demonstrated to the customer, who singled out its intuitive design, clear structure and reproducibility.' }
      ],
      links: []
    },
    {
      id: 'fam', cat: 'side', motif: 'grid',
      short: 'Family app',
      title: 'Family app',
      kind: 'Side project', where: 'Built at home', period: 'ongoing',
      desc: 'A private web app my family uses every day: budget, shared calendar, lists and training, synced live between phones.',
      lead: 'The app my family runs on. It started as a budget and grew into a shared calendar, shopping lists and notes, and a training section. It is private, so the demo and the screens below run the real app with invented names and numbers.',
      demo: 'demo/app/home.html',
      gallery: [
        { title: 'Calendar and lists', shots: [['hem', 'Shared month calendar'], ['handelser', 'Upcoming events'], ['inkop', 'Shopping list by store'], ['att-gora', 'To-dos with owner and due date']] },
        { title: 'Budget', shots: [['budget', 'Posts against what was spent'], ['analys', 'Six months against budget'], ['analys-pengar', 'Where the money goes']] },
        { title: 'Training', shots: [['traning', 'Training overview'], ['utveckling', 'Rhythm and log over time'], ['utforskare', 'Exercise explorer'], ['ovningar', '80 exercises by muscle group'], ['passbyggare', 'Workout builder'], ['exercise-mode', 'Exercise mode, next exercise ahead'], ['vila', 'Rest timer between sets']] },
        { title: 'Stretch and meditation', shots: [['stretch', 'Stretch sessions'], ['meditation', 'Breathing and meditation']] }
      ],
      skills: ['JavaScript'],
      stats: [],
      facts: [['Stack', 'Vanilla JavaScript, Firebase'], ['Installed as', 'Home-screen web app']],
      blocks: [
        { type: 'list', title: 'What is in it', items: [
          'Budget with monthly views, shared costs and savings goals, and an analysis of the last months against budget.',
          'A family calendar, lists and notes.',
          'Training with a log, progress charts, an exercise explorer with 80 exercises, a workout builder and a session mode with rest timers.',
          'Stretch and meditation sessions with guided breathing.',
          'Live sync between phones through Firebase.',
          'Installed on the home screen as a web app, with app-like navigation and transitions.'
        ] },
        { type: 'text', title: 'Why it is here', body: ['This portfolio borrows its look and its navigation from that app. The dot that travels between the tabs is the same code.'] }
      ],
      links: []
    },
    {
      id: 'manim', cat: 'side', motif: 'geometry',
      short: 'Math animations',
      title: 'Math animations',
      kind: 'Side project', where: 'Built at home', period: '',
      desc: 'Short animated explanations of maths problems, built with the Manim animation engine.',
      lead: 'Short animations that explain a maths problem step by step, written in Python with the Manim animation engine.',
      skills: ['Python'],
      stats: [],
      facts: [['Tool', 'Manim']],
      video: { src: '../portfolio_media/Pythagoras.mp4', poster: '../portfolio_media/pythagoras.png', label: 'Pythagoras, animated with Manim' },
      blocks: [],
      links: []
    }
  ];

  /* Everything from the old "Detailed Competence Profile", with the competence split per role. */
  var GROUPS = [['current', 'Current and recent'], ['academic', 'Academic and research'], ['projects', 'Projects and other work'], ['lead', 'Leadership and volunteering'], ['edu', 'Education']];
  var EXPERIENCE = [
    { g: 'current', y: '2026 – now', title: 'Test and verification engineer', org: 'Sigma Technology Tech House',
      text: 'Developed and automated PCB production test sequences in NI TestStand, LabVIEW and NI Switch Executive, integrating measurement instruments, hardware control and signal routing. Responsible for hardware and software verification, requirements, technical documentation and test reporting. Delivered an automated test solution demonstrated to the customer, with positive feedback for its intuitive design, clear structure and reproducibility.',
      split: [['Test sequences in TestStand', 35], ['Instruments and hardware control', 25], ['Signal routing', 20], ['Verification and documentation', 20]], project: 'ta' },
    { g: 'current', y: '2023 – 2026', title: 'System verification engineer', org: 'Saab Dynamics, as a consultant at BerDiz AB',
      text: 'Started, wrote and verified products from early development to customer delivery. Led test automation through scripting, managed the customisation of simulators and coordinated lab spaces. Formal verification documents, and testing across hardware, firmware and software.',
      split: [['Test writing and execution', 30], ['Requirement management', 20], ['Simulator development', 20], ['Test automation', 20], ['Firmware and software processing', 10]], project: 'sv' },
    { g: 'academic', y: '2022 – 2023', title: 'Doctoral researcher', org: 'Leiden Observatory',
      text: 'Modelled stellar winds and coronal mass ejections with 3D MHD simulations to see how quiet wind conditions change under episodic mass ejections. Post-processed the data with (Py)Tecplot and compared it with Hubble and EUVE observations. Python and Linux/AWK for filtering and visualisation, on the Snellius supercomputer. I left the programme before the defence to move home to Sweden with my family.',
      split: [['3D MHD simulations', 35], ['Data analysis and visualisation', 35], ['Scientific computing', 20], ['Documentation and publications', 10]], project: 'cme' },
    { g: 'academic', y: '2023', title: 'Teaching assistant', org: 'Leiden Observatory',
      text: 'Lab sessions in an exoplanet course. Co-developed course material built around the MESA code for atmospheric escape modelling.',
      split: [['MESA code development', 40], ['Course material', 35], ['Student mentoring', 25]] },
    { g: 'academic', y: '2021 – 2022', title: 'Master\'s thesis', org: 'Lund Observatory',
      text: 'The production of single and binary black holes in globular cluster models simulated with the MOCCA code. Monte Carlo methods for population synthesis (SSE and BSE) and N-body dynamics. Extensive Python code with Bash and AWK scripts for the analysis.',
      split: [['N-body simulations', 35], ['Monte Carlo methods', 30], ['Data analysis', 20], ['Python development', 15]], project: 'bh' },
    { g: 'academic', y: '2020', title: 'Bachelor\'s thesis', org: 'Lund University',
      text: 'Modelled epicyclic motion of stars in the Milky Way and simulated planetary abiogenesis with Monte Carlo methods, in a self-consistent Python model of how civilisations develop and spread across the galaxy.',
      split: [['Python development', 40], ['Astrophysical modelling', 35], ['Simulation and analysis', 25]], project: 'gal' },
    { g: 'projects', y: '2021', title: 'Summer research project', org: 'Lund University',
      text: 'Smoothed particle hydrodynamics for 576 stellar collisions. Delaunay triangulation for post-processing and matplotlib for visualisation, on the Aurora and SNIC supercomputers.',
      split: [['SPH simulations', 40], ['Data analysis and visualisation', 35], ['Supercomputer resources', 25]], project: 'sph' },
    { g: 'projects', y: '2013 – 2021', title: 'Personal assistant', org: 'Hammarstrands, Alminia Assistans and ASD, Motala and Linköping',
      text: 'Care work, mostly in the summers, alongside school and studies. Responsibility for medication and for people living with paralysis and epilepsy, including tracheostomy and respiratory equipment.',
      split: [['Care and support', 55], ['Medical procedures', 30], ['Social support', 15]] },
    { g: 'lead', y: '2021 – 2022', title: 'ALVA, board member', org: 'Lund University',
      text: 'Student-run association for astronomy events and news. Lectures, planetarium shows and observation nights.',
      split: [['Event organisation', 45], ['Student engagement', 35], ['Astronomy outreach', 20]] },
    { g: 'lead', y: '2019 – 2020', title: 'Associates, board member', org: 'Lund University',
      text: 'Head of the mentor committee in the science department, introducing new students to the university. Also showed physics experiments to the public at Kulturnatten in Lund.',
      split: [['Mentoring and guidance', 60], ['Student integration', 30], ['Organisation', 10]] },
    { g: 'lead', y: '2011 – 2017', title: 'Motala Frisksportklubb and youth leadership', org: 'Motala',
      text: 'Board member 2013–2014 and instructor in trampoline, circus, freerunning and gymnastics. Helped design the freerunning park that opened in Motala in 2014. Young leader with Östergötlands Idrottsförbund and leadership training in 2015. Stipend from Bängt Bodèns Fond for leadership and commitment.',
      split: [['Coaching', 40], ['Board work', 25], ['Facility design', 20], ['Leadership training', 15]] },
    { g: 'edu', y: '2020 – 2022', title: 'MSc Astrophysics', org: 'Lund University', text: 'Thesis: Black hole dynamics in stellar clusters.', project: 'bh' },
    { g: 'edu', y: '2017 – 2020', title: 'BSc Physics', org: 'Lund University', text: 'Thesis: Galactic dynamics and the spread of galactic civilisations.', project: 'gal' },
    { g: 'edu', y: '2015 – 2017', title: 'Upper secondary school, natural sciences', org: 'Platengymnasiet, Motala', text: '',
      split: [['Natural sciences', 50], ['Academic foundation', 50]] }
  ];

  /* The six areas of the old competence wheel; weight is the old segment size in degrees. */
  var COMPETENCE = [
    { name: 'System verification and testing', weight: 75, color: '#38BDF8', items: ['Requirements in DOORS NG, with traceability', 'Reviewing design documents', 'Tests automated from requirement and design specifications', 'Test automation for product software', 'Hardware, firmware and software verified together', 'Basic electrical testing and hands-on lab work', 'NI TestStand', 'Full lifecycle, from early development through commissioning to delivery'] },
    { name: 'Technical skills', weight: 75, color: '#FDBA74', items: ['Python for scientific computing and automation', 'C++ for systems programming', 'Fortran, Bash, AWK, VBA and MATLAB scripting', 'Git', 'Linux command line', 'VS Code, Jupyter notebooks and LaTeX', 'AI-assisted development with Claude, GPT and Cursor', 'Web design basics'] },
    { name: 'Research and scientific computing', weight: 50, color: '#86EFAC', items: ['HPC simulations and computational modelling', '3D magnetohydrodynamic simulations', 'Star–planet magnetic interaction and coronal mass ejections', 'Stellar dynamics and black holes in clusters', 'Fortran code optimisation on supercomputers', 'Statistical analysis and visualisation', 'Peer-reviewed publication'] },
    { name: 'Communication and documentation', weight: 55, color: '#F9A8B8', items: ['Technical talks at conferences and workshops', 'Academic writing', 'Agile documentation', 'Work across functions and disciplines', 'Swedish, English and basic German', 'Explaining complex things plainly'] },
    { name: 'Problem solving', weight: 60, color: '#C4B5FD', items: ['Breaking complex systems into parts', 'Method development and prototyping', 'Automation framework design', 'Requirements engineering', 'Debugging and optimisation', 'A physicist\'s habit of checking assumptions'] },
    { name: 'Leadership', weight: 45, color: '#5EEAD4', items: ['Team-lead duties and coordination', 'Agile retrospectives and process improvement', 'Mentoring and knowledge transfer', 'Customer and stakeholder contact', 'Security-classified project work', 'Coaching and board work since my teens'] }
  ];

  window.SITE = { COLOR: COLOR, CATNAME: CATNAME, SKILLS: SKILLS, TICKER: TICKER, AREAS: AREAS, PROJECTS: PROJECTS, GROUPS: GROUPS, EXPERIENCE: EXPERIENCE, COMPETENCE: COMPETENCE };
})();
