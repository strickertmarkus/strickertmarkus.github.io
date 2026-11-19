/* All content for the portfolio lives here: projects, experience and competence areas.
   The views in app.js and the network in scene.js both read from this file. */
(function () {
  'use strict';

  var COLOR = { research: '#FDBA74', engineering: '#38BDF8', side: '#86EFAC' };
  var CATNAME = { research: 'Research', engineering: 'Engineering', side: 'Side project' };

  var SKILLS = ['TestStand', 'LabVIEW', 'DOORS NG', 'C++', 'Bash', 'Python', 'Fortran', '3D MHD', 'HPC', 'Tecplot', 'Monte Carlo', 'JavaScript'];
  var AREAS = [
    { id: 'd:engineering', cat: 'engineering', label: 'Engineering' },
    { id: 'd:research', cat: 'research', label: 'Research' },
    { id: 'd:side', cat: 'side', label: 'Side projects' }
  ];

  var PROJECTS = [
    {
      id: 'ta', cat: 'engineering', motif: 'matrix',
      short: 'Test automation',
      title: 'Automating circuit-board production tests',
      kind: 'Test engineer', where: 'Sigma Technology Tech House', period: '2026 – now',
      desc: 'One NI TestStand sequence routes the signals, controls the instruments and tests a production board in about ten minutes.',
      lead: 'I combined instrument control, signal routing and measurements into one NI TestStand sequence for production. Each run records the measured values and a pass or fail against the specification. A board takes about ten minutes.',
      skills: ['TestStand', 'LabVIEW'],
      stats: [['~10 min', 'per board, automated'], ['Hundreds', 'of boards expected in production']],
      facts: [['Tools', 'NI TestStand, LabVIEW, NI Switch Executive, NI MAX'], ['Scope', 'PCB production test, signal routing, measurement']],
      blocks: [
        { type: 'flow', title: 'How a test runs', steps: [['Requirement', 'What the board must do'], ['Sequence', 'NI TestStand'], ['Instruments', 'LabVIEW drivers'], ['Switch matrix', 'NI Switch Executive'], ['Board under test', 'Measured pin by pin'], ['Report', 'Pass, fail and values']], result: 'Pass' },
        { type: 'list', title: 'What the tests cover', items: [
          'MUX switch routing.',
          'Circuit specification analysis.',
          'Electrical measurements and filtering.',
          'Ethernet connectivity and protocol validation.'
        ] },
        { type: 'list', title: 'What I deliver', items: [
          'I wrote the NI TestStand sequences used to test each board.',
          'Test specification, user manual and software design descriptions.',
          'Contributions to the interface design descriptions.',
          'Plans for demonstrating the product to colleagues, the customer and the technical writers who produce the formal manuals.'
        ] }
      ],
      links: []
    },
    {
      id: 'sv', cat: 'engineering', motif: 'vmodel',
      short: 'System verification',
      title: 'System verification',
      kind: 'System verification engineer', where: 'Saab Dynamics, via BerDiz', period: '2023–2026',
      desc: 'Test and verification of defence products across hardware, firmware and software, from requirements to customer delivery.',
      lead: 'I wrote reusable test templates for our C++ framework so other engineers could automate hardware checks. I ran regression tests across hardware, firmware and software, traced the results to requirements and presented them to the customer.',
      skills: ['C++', 'Python', 'Bash', 'DOORS NG'],
      stats: [['3 years', 'test and verification of defence products'], ['HW · FW · SW', 'tested together in the lab'], ['Top score', 'in the consultant evaluation, 2024']],
      facts: [['Role', 'System test lead'], ['Domain', 'Defence, security-classified products'], ['Standards', 'IEC 61010-1, CE marking, military standards']],
      blocks: [
        { type: 'flow', title: 'From requirement to delivery', steps: [['Requirements', 'Traced and reviewed'], ['Design review', 'Testable from the start'], ['Test specification', 'Traced to each requirement'], ['Lab tests', 'Hardware, firmware, software'], ['Verification report', 'Formal documents'], ['Customer delivery', 'Demonstrated and signed off']], result: 'Signed off' },
        { type: 'list', title: 'Test and automation', items: [
          'Test automation templates that made the in-house C++ test framework easier for other test engineers to use.',
          'Complex sequences automating hardware tests, driven by test code and firmware-manipulating code.',
          'Worked in and reviewed simulated environments, wrote the user manuals for the simulators and the lab, and tailored the simulator development.',
          'Regression testing, fault handling and design changes through formal change processes.',
          'Took down and rebuilt test equipment and military products in the lab.'
        ] },
        { type: 'list', title: 'Requirements and compliance', items: [
          'Requirement documents, software requirements and traceability, with compliance matrices.',
          'Reviewed requirement documents and system-level and environmental test specifications.',
          'CE marking, IEC 61010-1 and risk-mitigation documents.',
          'Took part in environmental and EMC testing.'
        ] },
        { type: 'list', title: 'Responsibility', items: [
          'I led system testing and presented results to the customer.',
          'Coordinated test activities and lab spaces; handled security-classified material and helped plan its transport.',
          'Team-lead duties, Scrum and retrospectives.',
          'Overviews of complex systems that many colleagues adopted as their daily reference.'
        ] },
        { type: 'table', title: 'Working environment', rows: [['Requirements and test specifications', 'DOORS NG'], ['Programming and automation', 'C++, Python, Bash, CLI'], ['Version control and tracking', 'Git, DevOps, Jira'], ['Data analysis', 'Python'], ['Method', 'Scrum']] }
      ],
      links: []
    },
    {
      id: 'cme', cat: 'research', motif: 'loops',
      short: 'CMEs on AB Doradus',
      title: 'Coronal mass ejections on AB Doradus',
      kind: 'Doctoral research', where: 'Leiden Observatory', period: '2022–2023',
      desc: 'When does a strong magnetic field hold a stellar eruption back? 21 3D MHD simulations of a young Sun-like star.',
      lead: 'In my simulations, eruptions escaped more readily where the magnetic field was open. AB Dor is a young Sun-like star, about 120 million years old, with a surface magnetic field 100 to 1,000 times stronger than the Sun\'s. Theory says a field that strong should hold eruptions back. Yet dimming seen in EUV and X-ray data points to coronal mass ejections at high latitudes. I ran a parametric 3D MHD study to find out when an eruption escapes and when it stays confined.',
      skills: ['Fortran', '3D MHD', 'HPC', 'Tecplot', 'Python', 'Bash'],
      stats: [['21', 'simulated eruptions'], ['11 / 10', 'erupted / stayed confined'], ['4×', 'higher field needed in closed regions'], ['3,700 km/s', 'fastest eruption after one hour']],
      facts: [['Method', '3D MHD, BATS-R-US'], ['Compute', 'Snellius supercomputer'], ['Published', 'MNRAS 533, 2024']],
      blocks: [
        { type: 'text', title: 'Why this star', body: [
          'Observations of AB Dor point to an eruption near the star\'s pole, where theory says its strong field should hold eruptions back.',
          'I was selected for one of 13 doctoral projects at Leiden Observatory from more than 500 applicants, and this study became the first paper from that work.'
        ] },
        { type: 'bars', title: 'Field strength needed to erupt', unit: 'G', max: 1000, rows: [['Open field region', 200, 'research'], ['Closed field region', 800, 'engineering']],
          note: 'The fourfold difference is the extra magnetic tension a flux rope has to overcome under closed field lines. Field geometry is the main control on whether an eruption gets out.' },
        { type: 'dots', title: 'Outcome of the 21 runs', groups: [[11, 'erupted', 'research'], [10, 'confined', 'engineering']] },
        { type: 'list', title: 'Results', items: [
          'Eruptions in open field regions are much more likely to escape.',
          'In closed field regions an eruption needs a free magnetic energy of at least 3×10³⁵ erg.',
          'Erupting CMEs moved at 220 to 3,700 km/s after one hour, up to five times the background wind speed.'
        ] },
        { type: 'story', title: 'From the simulations',
          rows: [
            ['cme-field', 'Magnetic field lines and stellar wind around AB Dor', 'video', 'The star and its wind', 'Every run starts from a steady 3D model of the corona and stellar wind, built from a map of the star\'s surface magnetic field.'],
            ['cme-magnetogram', 'Surface magnetic map with the eruption sites', 'webp', 'Where and how they start', 'Two sites at high latitudes, where the observed dimming points: one in a closed field region, one in an open region near the pole. At each, a twisted magnetic flux rope is placed in the surface field, its mass and field strength varied from run to run.', null, ['cme-fluxrope', 'The flux rope placed in the star\'s surface field', 'webp']],
            ['cme-erupt', 'A flux rope erupting through the corona of AB Dor', 'webp', 'An eruption breaking out', 'The flux rope rises from the surface and pushes out through the corona. In other runs the overlying field holds it back.'],
            ['cme-speed', 'CME speed against the flux rope\'s free energy', 'webp', 'What decides the outcome', 'Speed after one hour against the free magnetic energy and field strength of each flux rope. In closed regions an eruption needs about four times the field to escape.'],
            ['cme-radio', 'Speed, density and plasma frequency along the eruption', 'video', 'Could it be heard in radio?', 'Along the eruption\'s path, the dense front has a plasma frequency inside the LOFAR radio telescope\'s range, a possible way to detect such events.', 'plot'],
            ['cme-emission', 'Synthetic 170–180 nm emission from an eruption', '', 'What a telescope would see', 'Synthetic emission from the erupting plasma, so the models can be held up against the dimming seen in EUV and X-ray data.']
          ],
          more: [
            ['cme-grid', 'Fifteen eruptions, by flux rope mass and field strength'],
            ['cme-euv', 'Synthetic extreme-ultraviolet and X-ray views of an eruption', 'video']
          ] },
        { type: 'list', title: 'Presented at', items: ['BCool Exospace Weather Workshop, Max Planck Institute, Göttingen, 2023: talk on how strong overlying magnetic fields suppress CMEs on AB Dor.'] }
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
          'Automated analysis pipelines in Python and Bash that searched terabytes of simulation output, and code that compared the models with observed clusters.',
          'COCOA code for automated cluster projection and property extraction.'
        ] },
        { type: 'list', title: 'Findings', items: [
          'Mass segregation is strongly enhanced in clusters with short relaxation times that host an intermediate-mass black hole.',
          'Blue straggler formation follows the cluster\'s relaxation time and central surface brightness.',
          'Clusters with an IMBH keep core binary fractions of about 12%, falling off as (r/r_hl)^−0.132; clusters with a black hole subsystem show a shallower decline.'
        ] },
        { type: 'story', title: 'From the thesis',
          rows: [
            ['bh-cmd', 'Colour–magnitude diagram of a model cluster, split into luminosity populations', 'webp', 'Sorting the stars', 'The stars in each model cluster are split into luminosity populations. How differently those populations are spread out measures the cluster\'s mass segregation.'],
            ['bh-surface', 'Central surface brightness against mass segregation, models and observed clusters', 'webp', 'Reading black holes from the stars', 'Black holes change how bright a cluster\'s centre is and how its stars sort by mass. Placing observed clusters among the models shows what each one is likely to hide.'],
            ['bh-number', 'Predicted number of stellar-mass black holes in Milky Way clusters', 'webp', 'A prediction for each cluster', 'The comparison gives an estimated number of stellar-mass black holes for each Milky Way cluster, such as 64 in NGC 3201.'],
            ['bh-imbh', 'Estimated intermediate-mass black hole masses per cluster', 'webp', 'Room for a bigger one?', 'The same comparison puts a mass on a possible intermediate-mass black hole at the centre of each cluster.']
          ] },
        { type: 'list', title: 'Talks and courses', items: ['Astroflow Workshop, Leiden Observatory, 2022: presented the thesis research.', 'Presentations to research groups in Germany and Poland.', 'Course: Direct N-body Simulations, Heidelberg (online), 2021: Nbody6++GPU and supercomputer use on Kepler.', 'Course: TRENDY3, Evanston, 2021: triple and multiple star evolution and dynamics.'] },
        { type: 'quote', title: 'From my supervisor', body: '“Markus was an exceptional master\'s student and I would rank him as the best student that I have supervised so far.”', by: 'Master\'s thesis supervisor, Lund Observatory, in a reference letter (2023)' }
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
          'Abiogenesis and the rise of civilisations drawn from probability distributions, with a steepness parameter N.'
        ] },
        { type: 'list', title: 'Findings', items: [
          'The first technological civilisation appears after 270 million to 4.8 billion years, depending on N.',
          'Colonisation grows exponentially, then levels off as free planets run out.',
          'With 1,000 stars and N = 3, a single spreading civilisation reaches 89% of all planets within 12 billion years.'
        ] }
      ],
      cite: 'Markus Strickert (2020). Galactic Dynamics and the Spread of Galactic Civilisations. Bachelor\'s thesis, Lund Observatory, Lund University.',
      links: [['Lund University publication', 'https://lup.lub.lu.se/student-papers/search/publication/9018128'], ['PDF', '../Galactic_Dynamics_and_the_Spread_of_Galactic_Civilisations.pdf']]
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
          'Visualised the results with matplotlib.'
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
          'Magnetic field topology in 3D.'
        ] }
      ],
      links: []
    },
    {
      id: 'fam', cat: 'side', motif: 'grid',
      short: 'Family app',
      title: 'Family app',
      kind: 'Side project', where: 'Built at home', period: 'ongoing',
      desc: 'Budget, shared calendar, lists and notes for the family, synced live between phones.',
      lead: 'Budget, calendar and lists for the family, synced live between phones. The demo and the screens run the real app on invented data.',
      demo: { src: 'demo/app/home.html', poster: 'hem', tip: 'Open Budget, then Analys (Analysis), to compare planned and actual spending.' },
      gallery: [
        { title: 'Calendar and lists', shots: [['hem', 'Shared month calendar'], ['handelser', 'Upcoming events'], ['inkop', 'Shopping list by store'], ['att-gora', 'To-dos with owner and due date']] },
        { title: 'Budget', shots: [['budget', 'Posts against what was spent'], ['analys', 'Six months against budget'], ['analys-pengar', 'Where the money goes']] }
      ],
      skills: ['JavaScript'],
      stats: [],
      facts: [['Stack', 'Vanilla JavaScript, Firebase'], ['Runs as', 'Home-screen web app']],
      blocks: [
        { type: 'list', title: 'Budget', items: [
          'Monthly budget per person: posts, budget against actual, status per post.',
          'New months created automatically, with budgets carried over.',
          'Shared household: transfers split by income, house loan and amortisation, shared card.',
          'Analysis over 3, 6 or 12 months: trend against budget, where the money goes, posts that run over.',
          'Purchases from Apple Pay sorted into posts, learning each shop.'
        ] },
        { type: 'list', title: 'Calendar and lists', items: [
          'Shared month calendar with colour per person, multi-day events, reminders and holidays.',
          'Shopping lists sorted in the order of the shop, packing lists and to-dos with owner and due date.',
          'Notes with headings, checklists, links and formatting.'
        ] },
        { type: 'list', title: 'Platform', items: [
          'Live sync between phones through Firebase, with login.',
          'Installed on the home screen, with app-like navigation and transitions.'
        ] }
      ],
      links: []
    },
    {
      id: 'pulse', cat: 'side', motif: 'pulse',
      short: 'Training app',
      title: 'Training app',
      kind: 'Side project', where: 'Built at home', period: 'ongoing',
      desc: 'Workout log, exercise explorer with an animated 3D figure, workout builder, session mode, stretch and meditation.',
      lead: 'Plan, run and log workouts, with stretch and meditation next to it. The demo and the screens run the real app on invented data.',
      demo: { src: 'demo/app/exercise.html', poster: 'traning', tip: 'Switch between Träning, Stretch and Meditation at the top, and open the log, the charts and the exercise explorer.' },
      gallery: [
        { title: 'Exercise explorer', shots: [['figur', '3D figure performing the exercise', 'video'], ['utforskare', 'Muscle map'], ['ovningar', '80 exercises by muscle group']] },
        { title: 'Training', shots: [['traning', 'Training overview'], ['utveckling', 'Rhythm and log over time'], ['passbyggare', 'Workout builder']] },
        { title: 'In the session', shots: [['exercise-mode', 'Exercise mode, next exercise ahead'], ['vila', 'Rest timer between sets']] },
        { title: 'Stretch and meditation', shots: [['stretch', 'Stretch sessions'], ['stretch-pass', 'Guided stretch with timer'], ['meditation', 'Meditation start'], ['med-pass', 'Guided breathing']] }
      ],
      skills: ['JavaScript'],
      stats: [],
      facts: [['Stack', 'Vanilla JavaScript, Three.js, Firebase'], ['Shares', 'Login and sync with the family app']],
      blocks: [
        { type: 'list', title: 'Training', items: [
          'Log with weekly rhythm, volume, heart rate and fitness charts.',
          'Runs with distance, pace and VO2 max, and goals for sessions, distance and VO2 max.',
          'Workout builder with templates, sets, reps, weights and rest between sets.',
          'Session mode: set timer, glowing rest timer, next exercise shown ahead, countdown sounds and an automatic mode.',
          'Cardio with countdown or stopwatch, and distance and pace logged at the end.'
        ] },
        { type: 'list', title: 'Exercise explorer', items: [
          '80 exercises, found by muscle map, search or filter.',
          'An animated 3D figure performing each exercise, with the working muscles highlighted.',
          'Gym profiles that filter exercises and programmes by available equipment.',
          'Selected exercises sent straight into the day\'s workout.'
        ] },
        { type: 'list', title: 'Stretch and meditation', items: [
          'Guided stretch sessions with an animated figure, timer per movement and time to change position.',
          'Meditation with guided breathing.',
          'Own routines, feelings after each session, milestones and weekly, monthly and yearly statistics.'
        ] }
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

  /* Competence keywords: [label, project id where it was used]; the first six of an area are shown before "more". */
  /* Everything from the old "Detailed Competence Profile", with the competence split per role. */
  var GROUPS = [['current', 'Current and recent'], ['academic', 'Academic and research'], ['projects', 'Projects and other work'], ['lead', 'Leadership and volunteering'], ['edu', 'Education']];
  var EXPERIENCE = [
    { g: 'current', y: '2026 – now', title: 'Test engineer', org: 'Sigma Technology Tech House',
      text: 'Developed and automated PCB production test sequences in NI TestStand, LabVIEW and NI Switch Executive, integrating measurement instruments, hardware control and signal routing. Responsible for hardware and software verification, requirements, technical documentation and test reporting. Delivered an automated test solution demonstrated to the customer, with positive feedback for its intuitive design, clear structure and reproducibility.',
      project: 'ta' },
    { g: 'current', y: '2023 – 2026', title: 'System verification engineer', org: 'Saab Dynamics, as a consultant at BerDiz AB',
      text: 'Verified systems from early development to customer delivery. Led test automation through scripting, managed the customisation of simulators and coordinated lab spaces. Formal verification documents, and testing across hardware, firmware and software.',
      project: 'sv' },
    { g: 'academic', y: '2022 – 2023', title: 'Doctoral researcher', org: 'Leiden Observatory',
      text: 'Modelled stellar winds and coronal mass ejections with 3D MHD simulations to see how quiet wind conditions change under episodic mass ejections. Post-processed the data with (Py)Tecplot and compared it with Hubble and EUVE observations. Python and Linux/AWK for filtering and visualisation, on the Snellius supercomputer. I left the programme before the defence to move home to Sweden with my family.',
      project: 'cme' },
    { g: 'academic', y: '2023', title: 'Teaching assistant', org: 'Leiden Observatory',
      text: 'Lab sessions in an exoplanet course. Co-developed course material built around the MESA code for atmospheric escape modelling.',
    },
    { g: 'academic', y: '2021 – 2022', title: 'Master\'s thesis', org: 'Lund Observatory',
      text: 'The production of single and binary black holes in globular cluster models simulated with the MOCCA code. Monte Carlo methods for population synthesis (SSE and BSE) and N-body dynamics. Extensive Python code with Bash and AWK scripts for the analysis.',
      project: 'bh' },
    { g: 'academic', y: '2020', title: 'Bachelor\'s thesis', org: 'Lund University',
      text: 'Modelled epicyclic motion of stars in the Milky Way and simulated planetary abiogenesis with Monte Carlo methods, in a self-consistent Python model of how civilisations develop and spread across the galaxy.',
      project: 'gal' },
    { g: 'projects', y: '2021', title: 'Summer research project', org: 'Lund University',
      text: 'Smoothed particle hydrodynamics for 576 stellar collisions. Delaunay triangulation for post-processing and matplotlib for visualisation, on the Aurora and SNIC supercomputers.',
      project: 'sph' },
    { g: 'projects', y: '2013 – 2021', title: 'Personal assistant', org: 'Hammarstrands, Alminia Assistans and ASD, Motala and Linköping',
      text: 'Care work, mostly in the summers, alongside school and studies. Responsibility for medication and for people living with paralysis and epilepsy, including tracheostomy and respiratory equipment.',
    },
    { g: 'lead', y: '2021 – 2022', title: 'ALVA, board member', org: 'Lund University',
      text: 'Student-run association for astronomy events and news. Lectures, planetarium shows and observation nights.',
    },
    { g: 'lead', y: '2019 – 2020', title: 'Associates, board member', org: 'Lund University',
      text: 'Head of the mentor committee in the science department, introducing new students to the university. Also showed physics experiments to the public at Kulturnatten in Lund.',
    },
    { g: 'lead', y: '2011 – 2017', title: 'Motala Frisksportklubb and youth leadership', org: 'Motala',
      text: 'Board member 2013–2014 and instructor in trampoline, circus, freerunning and gymnastics. Helped design the freerunning park that opened in Motala in 2014. Young leader with Östergötlands Idrottsförbund and leadership training in 2015. Stipend from Bängt Bodèns Fond for leadership and commitment.',
    },
    { g: 'edu', y: '2020 – 2022', title: 'MSc Astrophysics', org: 'Lund University', text: 'Thesis: Black hole dynamics in stellar clusters.', project: 'bh' },
    { g: 'edu', y: '2017 – 2020', title: 'BSc Physics', org: 'Lund University', text: 'Thesis: Galactic dynamics and the spread of galactic civilisations.', project: 'gal' },
    { g: 'edu', y: '2015 – 2017', title: 'Upper secondary school, natural sciences', org: 'Platengymnasiet, Motala', text: '',
    }
  ];

  /* Practice areas and the projects illustrating each one. */
  var COMPETENCE = [
    { name: 'System verification and testing', color: '#38BDF8', items: [['Requirements traceability', 'sv'], ['Lab testing, HW · FW · SW', 'sv'], ['Production test automation', 'ta'], ['Environmental and EMC testing', 'sv'], ['CE marking, IEC 61010-1', 'sv'], ['NI TestStand', 'ta'], ['Compliance matrices', 'sv'], ['Regression testing', 'sv'], ['Formal change processes', 'sv'], ['Design reviews', 'sv'], ['Electrical measurements', 'ta'], ['Full lifecycle to delivery', 'sv']] },
    { name: 'Technical skills', color: '#FDBA74', items: [['Python', 'viz'], ['C++', 'sv'], ['LabVIEW', 'ta'], ['Git, DevOps, Jira'], ['Bash and Linux CLI', 'sv'], ['Fortran', 'cme'], ['JavaScript', 'fam'], ['MATLAB, VBA, AWK'], ['Jupyter, LaTeX'], ['AI-assisted development']] },
    { name: 'Research and scientific computing', color: '#86EFAC', items: [['HPC simulations', 'cme'], ['3D MHD', 'cme'], ['Monte Carlo models', 'bh'], ['Statistical analysis', 'gal'], ['Data visualisation', 'viz'], ['Peer-reviewed paper', 'cme'], ['Supercomputer code optimisation', 'sph'], ['Stellar dynamics', 'bh']] },
    { name: 'Communication and documentation', color: '#F9A8B8', items: [['Presenting to customers'], ['Conference talks', 'cme'], ['Test specifications', 'ta'], ['User manuals', 'ta'], ['Design descriptions', 'ta'], ['Academic writing', 'cme'], ['Cross-functional work'], ['Swedish, English, German']] },
    { name: 'Problem solving', color: '#C4B5FD', items: [['Quick to learn new tools'], ['System overviews'], ['Breaking systems into parts'], ['Prototyping'], ['Automation frameworks', 'sv'], ['Debugging and optimisation'], ['Checking assumptions']] },
    { name: 'Leadership', color: '#5EEAD4', items: [['Team lead', 'sv'], ['Scrum retrospectives', 'sv'], ['Customer contact', 'sv'], ['Security-classified work', 'sv'], ['Mentoring'], ['Coaching since my teens']] }
  ];

  window.SITE = { COLOR: COLOR, CATNAME: CATNAME, SKILLS: SKILLS, AREAS: AREAS, PROJECTS: PROJECTS, GROUPS: GROUPS, EXPERIENCE: EXPERIENCE, COMPETENCE: COMPETENCE };
})();
