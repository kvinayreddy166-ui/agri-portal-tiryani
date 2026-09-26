export interface MindMapNode {
  id: string;
  label: string;
  detail?: string;
  children?: MindMapNode[];
}

export interface EnforcementDeadline {
  action: string;
  limit: string;
}

export const enforcementMindMap: MindMapNode[] = [
  {
    id: 'authorities',
    label: 'Enforcement Authorities',
    detail: 'FCO 1985 is enforced mainly by State Governments through notified officers with defined jurisdiction.',
    children: [
      {
        id: 'controller',
        label: 'Controller — Clause 2(e)',
        detail: 'Appointed by Central Government (JS-INM, DA&FW). State Directors of Agriculture are Controllers for Clause 35 functions.',
        children: [
          { id: 'controller-orders', label: 'Issues orders & notifications', detail: 'Under Section 3 of ECA 1955 regarding FCO.' },
          { id: 'controller-industrial', label: 'Industrial Dealer certificates', detail: 'Grants, suspends or cancels Registration Certificates; approves fees up to the Central Government maximum.' },
          { id: 'controller-advisory', label: 'Advises Central Fertilizer Committee', detail: 'On technical and other matters.' },
          { id: 'controller-records', label: 'Directs record keeping', detail: 'Can order dealers, manufacturers, importers and pool handling agencies to maintain books in Form N and submit returns.' },
        ],
      },
      {
        id: 'appellate',
        label: 'Appellate Authority — Clause 32 / 32A',
        detail: 'Specified by State Government notification. Industrial Dealers cannot appeal to this authority.',
        children: [
          { id: 'appellate-window', label: 'Appeal within 30 days', detail: 'From receipt of order of Registering or Notified Authority.' },
          {
            id: 'appellate-grounds',
            label: 'Appealable orders',
            children: [
              { id: 'appellate-grounds-1', label: 'Refusal to grant, amend or renew Authorization Letter' },
              { id: 'appellate-grounds-2', label: 'Refusal to grant Certificate of Manufacture (mixture / special mixture)' },
              { id: 'appellate-grounds-3', label: 'Suspension, cancellation or debarment from business' },
              { id: 'appellate-grounds-4', label: 'Non-issuance of Certificate of Manufacture in stipulated period' },
              { id: 'appellate-grounds-5', label: 'Non-issuance of amendment in Authorization Letter in stipulated period' },
            ],
          },
        ],
      },
      {
        id: 'registering',
        label: 'Registering Authority — Clause 26',
        detail: 'Appointed by State Government gazette notification with defined jurisdiction.',
        children: [
          { id: 'registering-grant', label: 'Grants Certificate of Manufacture', detail: 'Clause 15(2); renewal under Clause 18(2).' },
          { id: 'registering-duplicate', label: 'Duplicates & amendments', detail: 'Duplicate Certificate of Manufacture — Clause 33; amendment — Clause 34.' },
          { id: 'registering-refuse', label: 'May refuse grant / renewal', detail: 'By giving reasons in writing.' },
          { id: 'registering-suspend', label: 'Suspend / cancel Certificate of Manufacture', detail: 'After opportunity of being heard; must record reasons and give a copy to the holder.' },
        ],
      },
      {
        id: 'designated',
        label: 'Designated Authority — Clause 28A',
        detail: 'Not below the rank of Joint Director.',
        children: [
          { id: 'designated-second', label: 'Second sample analysis', detail: 'Sent to NTH for re-analysis.' },
          { id: 'designated-third', label: 'Third sample analysis', detail: 'Sent to CFQCTI Faridabad.' },
        ],
      },
      {
        id: 'notified',
        label: 'Notified Authority — Clause 26A',
        detail: 'Appointed by State Government with defined jurisdiction.',
        children: [
          { id: 'notified-moi', label: 'Acknowledges Memorandum of Intimation', detail: 'Wholesale/retail dealer — Clause 8(3); renewal — Clause 11(2).' },
          { id: 'notified-al', label: 'Grants Certificate of Authorization', detail: 'Clause 23(1)(b), Form-I; duplicates Clause 33; amendments Clause 34.' },
          { id: 'notified-suspend', label: 'Suspend / cancel / debar', detail: 'Authorization Letter or debarment from business; may suspend/cancel industrial dealer certificates subject to Controller’s final decision.' },
        ],
      },
      {
        id: 'inspector-authority',
        label: 'Fertiliser Inspector — Clause 27',
        detail: 'Notified by State / Central Government; the main functionary of FCO enforcement.',
      },
    ],
  },
  {
    id: 'inspector',
    label: 'Fertiliser Inspector',
    detail: 'Ensures farmers get the right quality of fertilizer at the right place, fair price and right time.',
    children: [
      {
        id: 'fi-qualifications',
        label: 'Qualifications — Clause 27',
        children: [
          { id: 'fi-qual-1', label: 'Graduate in Agriculture or Science with Chemistry', detail: 'From a recognized university.' },
          { id: 'fi-qual-2', label: 'Training or experience in fertilizer quality control', detail: 'Working in State or Central Government Department of Agriculture.' },
        ],
      },
      {
        id: 'fi-powers',
        label: 'Powers — Clause 28',
        children: [
          { id: 'fi-power-info', label: 'Seek information', detail: 'From any manufacturer, importer, marketer, dealer or pool handling agency.' },
          { id: 'fi-power-sample', label: 'Draw samples', detail: 'Per Schedule II Part A procedure.' },
          { id: 'fi-power-search', label: 'Enter & search premises', detail: 'Where fertilizer is manufactured, stored or exhibited for sale, on reason to believe contravention.' },
          { id: 'fi-power-seize', label: 'Seize / detain fertilizer stock', detail: 'Where contravention has been, is being, or is about to be committed.' },
          { id: 'fi-power-docs', label: 'Seize books & documents', detail: 'Accounts and documents relating to manufacture, storage or sale.' },
          { id: 'fi-power-servant', label: 'Public servant — Section 2(28) BNS', detail: 'Every person is bound to provide facilities needed for official duties.' },
        ],
      },
      {
        id: 'fi-fmco',
        label: 'FMCO 1973 Powers',
        detail: 'Fertiliser (Movement Control) Order — Inspector is also Inspector under FMCO.',
        children: [
          { id: 'fi-fmco-stop', label: 'Stop & search', detail: 'Any person, boat, motor or vehicle carrying urea/mixtures out of State without authority.' },
          { id: 'fi-fmco-enter', label: 'Enter & search any place' },
          { id: 'fi-fmco-seize', label: 'Seize fertilizer + conveyance', detail: 'Including packages, receptacles, animals, vehicles, vessels or boats used in the contravention.' },
        ],
      },
      {
        id: 'fi-duties',
        label: 'Duties & Responsibilities',
        children: [
          { id: 'fi-duty-al', label: 'Verify Authorization Letter / CoR / CoM', detail: 'Separate certificates for mixtures & special mixtures; separate AL for each sale depot; non-standard fertilizer only to specified agencies.' },
          { id: 'fi-duty-conditions', label: 'Check AL / CoR condition compliance', detail: 'Original AL displayed conspicuously; changes to premises reported; only one bag per type open for retail; agri & industrial depots separate.' },
          { id: 'fi-duty-com', label: 'Check Certificate of Manufacture compliance', detail: 'Both CoM + AL held; qualified supervision; specified equipment; only authorized grades produced.' },
          { id: 'fi-duty-price', label: 'Check stock position & price', detail: 'Daily stock display & price (Clause 4); cash/credit memo in Form M; MRP not exceeded; stock register Form N & returns filed.' },
          { id: 'fi-duty-bags', label: 'Check packing & marking', detail: 'Batch No. on SSP/mixtures/micronutrients; MRP on decontrolled bags; month & year of manufacture/import; no false or misleading markings.' },
          { id: 'fi-duty-movement', label: 'Check illegal interstate movement', detail: 'Urea & mixtures cannot move State-to-State without competent authority orders (FMCO).' },
          { id: 'fi-duty-sampling', label: 'Draw samples periodically', detail: 'Representative of the whole lot; send to notified lab with Form K within 3 working days.' },
          { id: 'fi-duty-seizure', label: 'Detain / seize doubtful stock', detail: 'Act per FCO / ECA / BNSS procedure.' },
          { id: 'fi-duty-prosecution', label: 'Launch prosecution', detail: 'FIR with police or direct complaint in designated court after competent authority approval.' },
          { id: 'fi-duty-cancel', label: 'Recommend suspension / cancellation / debarment', detail: 'Report violations to Notified / Registering Authority under Clause 31.' },
          { id: 'fi-duty-industrial', label: 'Check industrial dealers', detail: 'Non-agricultural sale only by industrial dealers; depots not mixed; CoR conditions complied.' },
        ],
      },
    ],
  },
  {
    id: 'sampling',
    label: 'Sampling — Schedule II Part A',
    detail: 'Procedure for drawal of fertilizer samples.',
    children: [
      {
        id: 'sampling-general',
        label: 'General requirements',
        children: [
          { id: 'sampling-gen-1', label: 'No rain / sun exposure; clean & dry instruments' },
          { id: 'sampling-gen-2', label: 'Mix contents of each selected bag thoroughly' },
          { id: 'sampling-gen-3', label: 'Airtight ~400 g glass / polythene container in cloth bag', detail: 'Sealed with Inspector’s seal; sample + Form P inside a second sealed cloth bag with identifying code.' },
        ],
      },
      {
        id: 'sampling-lot',
        label: 'Lot definition',
        children: [
          { id: 'sampling-lot-mfr', label: 'Manufacturer / importer', detail: 'Single consignment, same grade & type, single batch. Continuous process: 2000 bags or 100 tonnes = one lot.' },
          { id: 'sampling-lot-dealer', label: 'Dealer', detail: 'Identifiable quantity of same grade & type at one place; maximum 100 tonnes.' },
        ],
      },
      {
        id: 'sampling-scale',
        label: 'Bags to select (N → n)',
        detail: 'Every r-th bag counted, where r = N/n.',
        children: [
          { id: 'scale-1', label: 'Up to 10 → 1' },
          { id: 'scale-2', label: '11 – 100 → 2' },
          { id: 'scale-3', label: '101 – 200 → 3' },
          { id: 'scale-4', label: '201 – 400 → 4' },
          { id: 'scale-5', label: '401 – 600 → 5' },
          { id: 'scale-6', label: '601 – 800 → 6' },
          { id: 'scale-7', label: '801 – 1000 → 7' },
          { id: 'scale-8', label: '1001 – 1300 → 8' },
          { id: 'scale-9', label: '1301 – 1600 → 9' },
          { id: 'scale-10', label: '1601 – 2000 → 10' },
        ],
      },
      {
        id: 'sampling-special',
        label: 'Special situations',
        children: [
          { id: 'sampling-big', label: 'Big godowns / high stacking', detail: 'Random bags from different layers, top and all open sides, zig-zag fashion.' },
          { id: 'sampling-small', label: 'Small godowns', detail: 'Same grade & type of one manufacturer may form one lot regardless of receipt dates.' },
          { id: 'sampling-damaged', label: 'Damaged / lumpy stock', detail: 'Arrange in identifiable lots; probe if possible, else open bags, break lumps and draw by quartering.' },
        ],
      },
      {
        id: 'sampling-probe',
        label: 'Sampling probe',
        detail: 'Slotted single tube, solid cone tip, stainless steel or brass; ~60–65 cm long, ~1.5 cm diameter, slot 1.2–1.3 cm.',
        children: [
          { id: 'probe-use', label: 'Insert diagonally corner to corner', detail: 'Empty into container / polythene sheet / clean surface to form composite sample.' },
          { id: 'probe-alt', label: 'If probe unusable (HDPE, non-free-flowing)', detail: 'Open bags, spread on clean surface, draw with SS/brass cup or by quartering.' },
          { id: 'probe-chelated', label: 'Chelated / mixed micronutrients', detail: 'Three identical containers of same batch, grade, type and manufacturer form the composite sample.' },
        ],
      },
      {
        id: 'sampling-weight',
        label: 'Weight of one sample',
        children: [
          { id: 'weight-micro', label: 'Straight micronutrient fertilizers — 100 g' },
          { id: 'weight-chelated', label: 'Chelated / mixtures of micronutrients — 50 g or pack size' },
          { id: 'weight-other', label: 'Other fertilizers — 400 g' },
          { id: 'weight-bio', label: 'Bio-fertilizers / Bio-stimulants / Nano — original packing' },
          { id: 'weight-wsf', label: '100% water soluble complexes / mixtures — as prescribed' },
        ],
      },
      {
        id: 'sampling-composite',
        label: 'Composite → 3 test samples',
        detail: 'Reduce by quartering to required weight; divide into three equal portions.',
        children: [
          { id: 'composite-1', label: 'Sample 1 — to dealer', detail: 'Acknowledgement on Form J.' },
          { id: 'composite-2', label: 'Sample 2 — to laboratory', detail: 'Sent with Form K within 3 working days.' },
          { id: 'composite-3', label: 'Sample 3 — reference', detail: 'Retained / deposited with Designated Authority.' },
        ],
      },
      {
        id: 'sampling-bulk',
        label: 'Bulk sampling (ships / carriers / containers)',
        children: [
          { id: 'bulk-conveyor', label: 'Conveyor belt', detail: 'Minimum 10 equally timed stream cuts through the full stream.' },
          { id: 'bulk-ship', label: 'Ship discharge', detail: 'Every 5 hours on first & last day; every 3 hours on intermediate days; day-wise composite.' },
          { id: 'bulk-truck', label: 'Bulk carriers / trucks', detail: '10 vertical cuts per AOAC probing pattern.' },
          { id: 'bulk-container', label: 'Containers', detail: 'Min 5 bags per container; up to 3 containers — sample each; 3–10 → 3 containers; more than 10 → 5 containers.' },
        ],
      },
      {
        id: 'sampling-ammonia',
        label: 'Anhydrous ammonia',
        detail: 'Duplicate samples per tank; 200 ml heat-resistant glass tubes; rubber/steel sampling line; gloves, goggles or gas mask mandatory.',
      },
    ],
  },
  {
    id: 'actions',
    label: 'Follow-Up Actions Against Offenders',
    detail: 'Administrative action under FCO plus legal action under ECA 1955 / BNSS 2023.',
    children: [
      {
        id: 'action-admin',
        label: 'Administrative — FCO / ECA',
        children: [
          { id: 'admin-stop-sale', label: 'Stop Sale Notice — Clause 28(2)', detail: 'Valid 21 days; deemed revoked if no action within that period.' },
          { id: 'admin-seizure', label: 'Detention / seizure of stock — Clause 28(1)(d)' },
          { id: 'admin-suspension', label: 'Interim suspension — Clause 31(2)', detail: 'Without notice as interim measure; final order within 15 days after hearing, else deemed revoked.' },
          { id: 'admin-cancellation', label: 'Cancellation — Clause 31(1)', detail: 'Holder may be allowed 30 days to dispose of balance stock.' },
          { id: 'admin-conveyance', label: 'Seizure of conveyance — Section 6A ECA' },
          { id: 'admin-confiscation', label: 'Confiscation of stock — Section 6A ECA' },
        ],
      },
      {
        id: 'action-seizure-steps',
        label: 'Seizure steps — Clause 28(1)(d)',
        children: [
          { id: 'seizure-1', label: '1. Identify stock', detail: 'Specific type, brand, batch and manufacturer.' },
          { id: 'seizure-2', label: '2. Segregate bags', detail: 'Separate from whole stock, keep in separate place.' },
          { id: 'seizure-3', label: '3. Draw representative sample first' },
          { id: 'seizure-4', label: '4. Secure custody', detail: 'Safest place or custody bond; seal room/lock with cloth covering.' },
          { id: 'seizure-5', label: '5. Seizure notice', detail: 'Issued before two independent witnesses; dealer’s receipt obtained.' },
          { id: 'seizure-6', label: '6. Prepare Mahazar / Panchnama on the spot' },
          { id: 'seizure-7', label: '7. Inform District Collector', detail: 'Within shortest possible time — usually 24 hours (Clause 28(3), Section 6A ECA).' },
        ],
      },
      {
        id: 'action-legal',
        label: 'Legal action',
        children: [
          { id: 'legal-court', label: 'Direct prosecution', detail: '1st Class Magistrate Court under Section 223 BNSS 2023, with competent authority consent.' },
          { id: 'legal-fir', label: 'File FIR in police station' },
          { id: 'legal-trial', label: 'Summary trial', detail: 'Sections 12 & 12A ECA; all FCO offences cognizable and non-bailable.' },
        ],
      },
      {
        id: 'action-documents',
        label: 'Prosecution documents checklist',
        children: [
          { id: 'doc-1', label: 'Gazette notification of FI appointment' },
          { id: 'doc-2', label: 'CoR / Authorization Letter / CoM' },
          { id: 'doc-3', label: 'Dealer purchase invoice' },
          { id: 'doc-4', label: 'Form J — original, dealer-signed' },
          { id: 'doc-5', label: 'Copy of Form K' },
          { id: 'doc-6', label: 'Copy of seizure notice' },
          { id: 'doc-7', label: 'Custody bond' },
          { id: 'doc-8', label: 'Mahazar / Panchnama' },
          { id: 'doc-9', label: 'Collector intimation — Section 6A ECA' },
          { id: 'doc-10', label: 'Copy of Form L' },
          { id: 'doc-11', label: 'Show cause notice to dealer + reply' },
          { id: 'doc-12', label: 'Suspension / cancellation order' },
          { id: 'doc-13', label: 'Show cause to manufacturer + reply' },
          { id: 'doc-14', label: 'Competent authority consent order' },
          { id: 'doc-15', label: 'Stock register + Form N & Form M' },
          { id: 'doc-16', label: 'Responsible person name — Clause 24' },
        ],
      },
      {
        id: 'action-penal',
        label: 'Penal provisions — ECA 1955',
        children: [
          { id: 'penal-7a', label: 'Section 7(a)(i)(ii)', detail: '3 months to 7 years imprisonment, with or without fine.' },
          { id: 'penal-9', label: 'Section 9 — false information', detail: 'Up to 5 years imprisonment.' },
          { id: 'penal-7bc', label: 'Section 7(b)(c)', detail: 'Stock and conveyance can be forfeited.' },
          { id: 'penal-10a', label: 'Section 10A', detail: 'Offences cognizable and non-bailable.' },
          { id: 'penal-habitual', label: 'Repeat offences', detail: 'Minimum 6 months imprisonment (habitual offender).' },
          { id: 'penal-8', label: 'Section 8', detail: 'Attempt or abetment of contravention is punishable.' },
        ],
      },
      {
        id: 'action-bns',
        label: 'BNS / BNSS support provisions',
        children: [
          { id: 'bns-2-28', label: 'BNS 2(28) — public servant', detail: 'Officers preventing offences / protecting public health are public servants.' },
          { id: 'bns-2-29', label: 'BNS 2(29) — reason to believe', detail: 'Sufficient cause to believe, not otherwise.' },
          { id: 'bns-3-3', label: 'BNS 3(3) — possession', detail: 'Property held by wife, clerk or servant counts as the person’s possession.' },
          { id: 'bns-221', label: 'BNS 221 — obstructing public servant', detail: 'Up to 3 months and/or ₹500 fine; cognizable if physical assault.' },
          { id: 'bns-222', label: 'BNS 222 — omitting to assist', detail: 'Up to 1 month / ₹200; up to 6 months for court process or offence prevention.' },
          { id: 'bns-224', label: 'BNS 224 — threatening public servant', detail: 'Up to 2 years and/or fine.' },
          { id: 'bnss-106', label: 'BNSS 106 — police seizure of property' },
          { id: 'bnss-223', label: 'BNSS 223 — examination of complainant', detail: 'Not needed for written complaints by public servants on duty.' },
          { id: 'bnss-503-504', label: 'BNSS 503–504 — disposal of seized property', detail: 'Magistrate orders; unclaimed property to State after 6-month proclamation.' },
          { id: 'bnss-514', label: 'BNSS 514–519 — limitation', detail: '6 months (fine only) / 1 year (≤1 yr) / 3 years (>1–3 yrs); exclusions and court extension allowed.' },
        ],
      },
    ],
  },
];

export const enforcementDeadlines: EnforcementDeadline[] = [
  { action: 'Appeal to Appellate Authority (Cl. 32/32A)', limit: '30 days from order' },
  { action: 'Send sample to lab with Form K', limit: '3 working days' },
  { action: 'Stop Sale Notice validity (Cl. 28(2))', limit: '21 days' },
  { action: 'Final order after interim suspension (Cl. 31(2))', limit: '15 days' },
  { action: 'Inform District Collector of seizure (Cl. 28(3) / Sec 6A)', limit: '24 hours' },
  { action: 'Dealer to produce documents after notice (Cl. 30(3))', limit: '10 days' },
  { action: 'Dispose balance stock after cancellation (Cl. 31(1))', limit: '30 days' },
  { action: 'Prosecution limitation (BNSS 514)', limit: '6 mo / 1 yr / 3 yr by punishment' },
];
