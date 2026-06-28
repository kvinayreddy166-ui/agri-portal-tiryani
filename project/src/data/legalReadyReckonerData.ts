export type LegalCategory =
  | 'Fertiliser'
  | 'Fertiliser Movement'
  | 'Insecticides'
  | 'Seeds'
  | 'Essential Commodities Act'
  | 'Stop Sale / Seizure / Sampling'
  | 'Penal Provisions'
  | 'Show Cause Notice';

export type LegalReferenceType =
  | 'section'
  | 'sub-section'
  | 'clause'
  | 'sub-clause'
  | 'rule'
  | 'sub-rule'
  | 'form'
  | 'schedule'
  | 'annexure'
  | 'proviso'
  | 'workflow';

export type VerificationStatus = 'verified' | 'verify latest' | 'official source required';

export interface NestedLegalReference {
  actOrOrder: string;
  partOrChapter?: string;
  section?: string;
  subSection?: string;
  clause?: string;
  subClause?: string;
  rule?: string;
  subRule?: string;
  proviso?: string;
  explanation?: string;
  form?: string;
  schedule?: string;
  annexure?: string;
  parentReference?: string;
  linkedPenalProvision?: string;
}

export interface LegalReadyReckonerEntry {
  id: string;
  category: LegalCategory;
  lawName: string;
  referenceNumber: string;
  referenceType: LegalReferenceType;
  nestedReference: NestedLegalReference;
  parentProvision?: string;
  title: string;
  officerExplanation: string;
  exactViolationCovered: string;
  officerPower?: string;
  fieldUse: string;
  stopSaleSeizureSamplingRelevance?: string;
  linkedPenalProvision?: string;
  sourceReferenceLink?: string;
  verificationStatus: VerificationStatus;
  tags: string[];
  exactText?: string;
}

const officialSourceRequired = 'Official source text is required before using exact wording in prosecution, seizure or court filing.';

export const legalReadyReckonerEntries: LegalReadyReckonerEntry[] = [
  {
    id: 'fco-clause-4',
    category: 'Fertiliser',
    lawName: 'Fertiliser (Control) Order, 1985',
    referenceNumber: 'Clause 4',
    referenceType: 'clause',
    nestedReference: { actOrOrder: 'FCO 1985', clause: '4' },
    title: 'Display of stock position and price list',
    officerExplanation: 'Use this when the dealer does not prominently display current fertiliser stock and price information.',
    exactViolationCovered: 'Failure to display stock position or price list as required under FCO.',
    officerPower: 'Inspection and record verification through Fertiliser Inspector powers where applicable.',
    fieldUse: 'Check display board, compare with physical stock and stock register, and record photographs/observations.',
    stopSaleSeizureSamplingRelevance: 'Supports show cause and administrative action; seizure depends on facts and linked powers.',
    linkedPenalProvision: 'Essential Commodities Act, 1955 Section 7 - verify latest text and sub-section.',
    sourceReferenceLink: 'Official Gazette / India Code verification required',
    verificationStatus: 'official source required',
    tags: ['display board', 'stock position', 'price list', 'show cause', 'fertiliser'],
    exactText: officialSourceRequired,
  },
  {
    id: 'fco-clause-5',
    category: 'Fertiliser',
    lawName: 'Fertiliser (Control) Order, 1985',
    referenceNumber: 'Clause 5',
    referenceType: 'clause',
    nestedReference: { actOrOrder: 'FCO 1985', clause: '5' },
    title: 'Issue of cash or credit memorandum',
    officerExplanation: 'Use this when fertiliser is sold without proper bill, cash memo or credit memo.',
    exactViolationCovered: 'Sale without issuing required sale memo to purchaser.',
    officerPower: 'Inspect sale records, bills and dealer registers.',
    fieldUse: 'Verify farmer bills, dealer bill book, stock movement and daily sale entries.',
    stopSaleSeizureSamplingRelevance: 'Relevant for show cause and record-based enforcement.',
    linkedPenalProvision: 'Essential Commodities Act, 1955 Section 7 - verify latest text and sub-section.',
    sourceReferenceLink: 'Official Gazette / India Code verification required',
    verificationStatus: 'official source required',
    tags: ['cash memo', 'bill', 'credit memo', 'sale record'],
    exactText: officialSourceRequired,
  },
  {
    id: 'fco-clauses-8-11',
    category: 'Fertiliser',
    lawName: 'Fertiliser (Control) Order, 1985',
    referenceNumber: 'Clauses 8 to 11',
    referenceType: 'clause',
    nestedReference: { actOrOrder: 'FCO 1985', clause: '8-11' },
    title: 'Authorization, registration and renewal',
    officerExplanation: 'Use this group for cases involving invalid authorization, expired registration or sale from unauthorized premises.',
    exactViolationCovered: 'Authorization, registration, renewal or premises-related contraventions.',
    officerPower: 'Verify licence/authorization, premises endorsement and validity.',
    fieldUse: 'Compare displayed licence with online/office records and physical sale point.',
    stopSaleSeizureSamplingRelevance: 'Can support stop sale or administrative proposal after verifying exact clause.',
    linkedPenalProvision: 'Essential Commodities Act, 1955 Section 7 - verify latest text and sub-section.',
    sourceReferenceLink: 'Official Gazette / India Code verification required',
    verificationStatus: 'official source required',
    tags: ['authorization', 'registration', 'renewal', 'licence', 'unauthorized premises'],
    exactText: officialSourceRequired,
  },
  {
    id: 'fco-clause-19',
    category: 'Fertiliser',
    lawName: 'Fertiliser (Control) Order, 1985',
    referenceNumber: 'Clause 19',
    referenceType: 'clause',
    nestedReference: { actOrOrder: 'FCO 1985', clause: '19' },
    title: 'Restriction on manufacture, import, sale and distribution of non-compliant fertiliser',
    officerExplanation: 'Use this for non-standard, adulterated, misbranded, imitation or otherwise non-compliant fertiliser cases.',
    exactViolationCovered: 'Manufacture/import/sale/distribution of fertiliser not meeting prescribed requirements.',
    officerPower: 'Inspect stock, draw sample and detain/seize where legally supported by Clause 28 and facts.',
    fieldUse: 'Record product, batch, manufacturer, quantity, label, invoice and reason for suspicion before action.',
    stopSaleSeizureSamplingRelevance: 'High relevance for stop sale, sampling and seizure decisions.',
    linkedPenalProvision: 'Essential Commodities Act, 1955 Section 7; Sections 8 and 10 may apply where facts support.',
    sourceReferenceLink: 'Official Gazette / India Code verification required',
    verificationStatus: 'official source required',
    tags: ['non-standard', 'adulterated', 'misbranded', 'sampling', 'seizure', 'fertiliser'],
    exactText: officialSourceRequired,
  },
  {
    id: 'fco-clause-27',
    category: 'Fertiliser',
    lawName: 'Fertiliser (Control) Order, 1985',
    referenceNumber: 'Clause 27',
    referenceType: 'clause',
    nestedReference: { actOrOrder: 'FCO 1985', clause: '27' },
    title: 'Appointment of Fertiliser Inspectors',
    officerExplanation: 'Use this to verify the legal authority of an appointed Fertiliser Inspector.',
    exactViolationCovered: 'Authority provision, not a dealer violation by itself.',
    officerPower: 'Confirms appointment basis for inspection powers.',
    fieldUse: 'Keep appointment notification/authorization available during inspection and prosecution file preparation.',
    stopSaleSeizureSamplingRelevance: 'Foundational reference for use of Clause 28 powers.',
    sourceReferenceLink: 'Official Gazette / appointment notification verification required',
    verificationStatus: 'official source required',
    tags: ['fertiliser inspector', 'appointment', 'authority'],
    exactText: officialSourceRequired,
  },
  {
    id: 'fco-clause-28',
    category: 'Stop Sale / Seizure / Sampling',
    lawName: 'Fertiliser (Control) Order, 1985',
    referenceNumber: 'Clause 28',
    referenceType: 'clause',
    nestedReference: { actOrOrder: 'FCO 1985', clause: '28' },
    title: 'Powers of Fertiliser Inspectors',
    officerExplanation: 'Use this for requiring records, drawing samples, entering/searching premises, and seizing or detaining stock where legally applicable.',
    exactViolationCovered: 'Inspection powers connected with suspected FCO contraventions.',
    officerPower: 'Require information/records, draw samples, enter/search, and seize/detain as supported by exact sub-clause.',
    fieldUse: 'Mention the exact sub-clause after verification and record reason to believe before detention or seizure.',
    stopSaleSeizureSamplingRelevance: 'Core fertiliser stop sale, seizure and sampling power reference.',
    linkedPenalProvision: 'Essential Commodities Act, 1955 Section 7 - verify latest text and sub-section.',
    sourceReferenceLink: 'Official Gazette / India Code verification required',
    verificationStatus: 'official source required',
    tags: ['powers', 'records', 'sample', 'search', 'seizure', 'detention', 'fertiliser'],
    exactText: officialSourceRequired,
  },
  {
    id: 'fco-clause-29',
    category: 'Fertiliser',
    lawName: 'Fertiliser (Control) Order, 1985',
    referenceNumber: 'Clause 29',
    referenceType: 'clause',
    nestedReference: { actOrOrder: 'FCO 1985', clause: '29' },
    title: 'Laboratory for analysis',
    officerExplanation: 'Use this when sending fertiliser samples to the notified laboratory.',
    exactViolationCovered: 'Laboratory notification and sample analysis linkage.',
    officerPower: 'Send samples to appropriate notified laboratory.',
    fieldUse: 'Verify lab notification and dispatch details before sending samples.',
    stopSaleSeizureSamplingRelevance: 'Sampling workflow and report validity reference.',
    sourceReferenceLink: 'Official Gazette / lab notification verification required',
    verificationStatus: 'official source required',
    tags: ['laboratory', 'analysis', 'sample dispatch'],
    exactText: officialSourceRequired,
  },
  {
    id: 'fco-clause-30',
    category: 'Fertiliser',
    lawName: 'Fertiliser (Control) Order, 1985',
    referenceNumber: 'Clause 30',
    referenceType: 'clause',
    nestedReference: { actOrOrder: 'FCO 1985', clause: '30' },
    title: 'Time limit for analysis and communication of result',
    officerExplanation: 'Use this to track analysis timeline and communication of sample result.',
    exactViolationCovered: 'Procedure/timeline provision for fertiliser sample analysis.',
    officerPower: 'Follow up with laboratory and communicate result within legally required timeline.',
    fieldUse: 'Enter sample dispatch date, lab receipt date, result date and communication date.',
    stopSaleSeizureSamplingRelevance: 'Important for sample-based enforcement validity.',
    sourceReferenceLink: 'Official Gazette / India Code verification required',
    verificationStatus: 'official source required',
    tags: ['analysis time limit', 'communication', 'lab report'],
    exactText: officialSourceRequired,
  },
  {
    id: 'fco-clause-31',
    category: 'Fertiliser',
    lawName: 'Fertiliser (Control) Order, 1985',
    referenceNumber: 'Clause 31',
    referenceType: 'clause',
    nestedReference: { actOrOrder: 'FCO 1985', clause: '31' },
    title: 'Suspension, cancellation or debarment',
    officerExplanation: 'Use this for administrative action after contravention is noticed and procedure is followed.',
    exactViolationCovered: 'Suspension, cancellation and debarment proceedings.',
    officerPower: 'Issue/propose administrative action as per competent authority and exact clause/proviso.',
    fieldUse: 'Attach inspection report, show cause notice, acknowledgement, reply and evidence.',
    stopSaleSeizureSamplingRelevance: 'Administrative action linkage after inspection or lab report.',
    linkedPenalProvision: 'Separate from prosecution under Essential Commodities Act Section 7; verify before combining actions.',
    sourceReferenceLink: 'Official Gazette / India Code verification required',
    verificationStatus: 'official source required',
    tags: ['suspension', 'cancellation', 'debarment', 'proviso', 'show cause'],
    exactText: officialSourceRequired,
  },

  {
    id: 'eca-section-7',
    category: 'Penal Provisions',
    lawName: 'Essential Commodities Act, 1955',
    referenceNumber: 'Section 7',
    referenceType: 'section',
    nestedReference: { actOrOrder: 'Essential Commodities Act, 1955', section: '7' },
    title: 'Penalties for contravention of orders',
    officerExplanation: 'Use as penal linkage for FCO/FMCO contraventions only after verifying exact current text and facts.',
    exactViolationCovered: 'Contravention of orders made under the Essential Commodities Act.',
    officerPower: 'Penal reference for prosecution file; not a substitute for exact order violation.',
    fieldUse: 'Mention exact FCO/FMCO clause first, then penal linkage after legal verification.',
    stopSaleSeizureSamplingRelevance: 'Penalty linkage for fertiliser and movement cases.',
    sourceReferenceLink: 'India Code / latest official amendment verification required',
    verificationStatus: 'verify latest',
    tags: ['penalty', 'ECA', 'FCO', 'FMCO', 'prosecution'],
    exactText: 'Verify latest official text before use.',
  },
  {
    id: 'eca-section-8',
    category: 'Penal Provisions',
    lawName: 'Essential Commodities Act, 1955',
    referenceNumber: 'Section 8',
    referenceType: 'section',
    nestedReference: { actOrOrder: 'Essential Commodities Act, 1955', section: '8' },
    title: 'Attempts and abetment',
    officerExplanation: 'Use only if facts support attempt or abetment and current text is verified.',
    exactViolationCovered: 'Attempting or abetting contravention where legally applicable.',
    fieldUse: 'Record role of each person and supporting evidence before citing.',
    sourceReferenceLink: 'India Code / latest official amendment verification required',
    verificationStatus: 'verify latest',
    tags: ['attempt', 'abetment', 'penalty', 'ECA'],
    exactText: 'Verify latest official text before use.',
  },
  {
    id: 'eca-section-10',
    category: 'Penal Provisions',
    lawName: 'Essential Commodities Act, 1955',
    referenceNumber: 'Section 10',
    referenceType: 'section',
    nestedReference: { actOrOrder: 'Essential Commodities Act, 1955', section: '10' },
    title: 'Offences by companies',
    officerExplanation: 'Use where dealer, manufacturer, company or firm responsibility has to be examined.',
    exactViolationCovered: 'Company/firm liability where applicable.',
    fieldUse: 'Collect firm constitution, responsible persons, licence holder details and role evidence.',
    sourceReferenceLink: 'India Code / latest official amendment verification required',
    verificationStatus: 'verify latest',
    tags: ['company offence', 'firm', 'responsible person', 'ECA'],
    exactText: 'Verify latest official text before use.',
  },
  {
    id: 'fmco-movement-starter',
    category: 'Fertiliser Movement',
    lawName: 'Fertiliser Movement Control Order, 1973',
    referenceNumber: 'Movement control clauses',
    referenceType: 'clause',
    nestedReference: { actOrOrder: 'FMCO 1973' },
    title: 'Unauthorized movement, diversion and transport document checks',
    officerExplanation: 'Starter entry for inter-State movement, diversion, subsidized stock movement and transport document verification.',
    exactViolationCovered: 'Unauthorized movement or diversion of fertiliser stock; exact clause mapping requires official source.',
    officerPower: 'Vehicle/stock checking and detention/seizure only where exact clause and officer authority support it.',
    fieldUse: 'Verify invoice, e-way bill, allocation, destination, stock source and vehicle details.',
    stopSaleSeizureSamplingRelevance: 'Important for movement checking and suspected black marketing cases.',
    linkedPenalProvision: 'Essential Commodities Act, 1955 Section 7 - verify latest text and sub-section.',
    sourceReferenceLink: 'Official FMCO source required',
    verificationStatus: 'official source required',
    tags: ['movement', 'transport', 'diversion', 'black marketing', 'vehicle checking'],
    exactText: officialSourceRequired,
  },
  {
    id: 'ia-section-21',
    category: 'Stop Sale / Seizure / Sampling',
    lawName: 'Insecticides Act, 1968',
    referenceNumber: 'Section 21',
    referenceType: 'section',
    nestedReference: { actOrOrder: 'Insecticides Act, 1968', section: '21' },
    title: 'Powers of Insecticide Inspectors',
    officerExplanation: 'Use for inspection, record examination, stop-sale/use, seizure and sample drawal after verifying exact sub-section.',
    exactViolationCovered: 'Inspector powers for insecticide contraventions.',
    officerPower: 'Enter/search, inspect records, stop sale/use, seize stock and take samples where exact provision permits.',
    fieldUse: 'Mention the exact sub-section/clauses and record reason to believe before coercive action.',
    stopSaleSeizureSamplingRelevance: 'Core pesticide stop sale, seizure and sampling reference.',
    linkedPenalProvision: 'Insecticides Act, 1968 Section 29 - verify latest text and sub-section.',
    sourceReferenceLink: 'India Code / official Act verification required',
    verificationStatus: 'verify latest',
    tags: ['insecticide inspector', 'stop sale', 'seizure', 'sample', 'records'],
    exactText: 'Verify latest official text before use.',
  },
  {
    id: 'ia-section-29',
    category: 'Penal Provisions',
    lawName: 'Insecticides Act, 1968',
    referenceNumber: 'Section 29',
    referenceType: 'section',
    nestedReference: { actOrOrder: 'Insecticides Act, 1968', section: '29' },
    title: 'Offences and punishment',
    officerExplanation: 'Use as penal linkage for insecticide offences after verifying current text and selected violation.',
    exactViolationCovered: 'Punishment provisions under the Insecticides Act.',
    fieldUse: 'Link exact Section 17/18/21/Rules violation with verified penal sub-section.',
    sourceReferenceLink: 'India Code / official Act verification required',
    verificationStatus: 'verify latest',
    tags: ['penalty', 'offence', 'pesticide', 'insecticide'],
    exactText: 'Verify latest official text before use.',
  },
  {
    id: 'ir-1971-starter',
    category: 'Insecticides',
    lawName: 'Insecticides Rules, 1971',
    referenceNumber: 'Rules and Forms starter',
    referenceType: 'rule',
    nestedReference: { actOrOrder: 'Insecticides Rules, 1971' },
    title: 'Licensing, records, labels, samples, forms and storage procedure',
    officerExplanation: 'Starter entry for rules connected to licence, stock/sale records, label/leaflet, packing, sampling and storage.',
    exactViolationCovered: 'Rule-level violations require exact official rule/sub-rule verification.',
    officerPower: 'Use with Act Sections 21 to 24 and verified rule/form references.',
    fieldUse: 'Check licence display, Form/register maintenance, label/leaflet and storage safety.',
    stopSaleSeizureSamplingRelevance: 'Procedure support for pesticide stop sale, seizure and sampling.',
    sourceReferenceLink: 'Official Rules source required',
    verificationStatus: 'official source required',
    tags: ['rules', 'forms', 'labels', 'stock register', 'storage', 'sampling'],
    exactText: officialSourceRequired,
  },
  {
    id: 'seeds-act-section-14',
    category: 'Stop Sale / Seizure / Sampling',
    lawName: 'Seeds Act, 1966',
    referenceNumber: 'Section 14',
    referenceType: 'section',
    nestedReference: { actOrOrder: 'Seeds Act, 1966', section: '14' },
    title: 'Powers of Seed Inspector',
    officerExplanation: 'Use for seed sample drawal, premises inspection, record examination and seizure where contravention is suspected.',
    exactViolationCovered: 'Seed Inspector powers; exact clauses/sub-sections require source verification.',
    officerPower: 'Take samples, enter/search premises, examine records and seize stock where legally supported.',
    fieldUse: 'Record seed kind/variety, lot number, label details, quantity and reason before action.',
    stopSaleSeizureSamplingRelevance: 'Core seed stop sale, seizure and sampling reference.',
    linkedPenalProvision: 'Seeds Act, 1966 Section 19 - verify latest text and sub-section.',
    sourceReferenceLink: 'India Code / official Act verification required',
    verificationStatus: 'verify latest',
    tags: ['seed inspector', 'sample', 'seizure', 'records', 'lot number'],
    exactText: 'Verify latest official text before use.',
  },
  {
    id: 'seeds-act-section-19',
    category: 'Penal Provisions',
    lawName: 'Seeds Act, 1966',
    referenceNumber: 'Section 19',
    referenceType: 'section',
    nestedReference: { actOrOrder: 'Seeds Act, 1966', section: '19' },
    title: 'Penalty',
    officerExplanation: 'Use as penal linkage for seed offences after verifying current text and exact contravention.',
    exactViolationCovered: 'Penalty for contraventions under Seeds Act provisions.',
    fieldUse: 'Link exact Section/Rule violation with verified penalty before prosecution note.',
    sourceReferenceLink: 'India Code / official Act verification required',
    verificationStatus: 'verify latest',
    tags: ['penalty', 'seed', 'prosecution'],
    exactText: 'Verify latest official text before use.',
  },
  {
    id: 'seeds-rules-7-13',
    category: 'Seeds',
    lawName: 'Seeds Rules, 1968',
    referenceNumber: 'Rules 7 to 13',
    referenceType: 'rule',
    nestedReference: { actOrOrder: 'Seeds Rules, 1968', rule: '7-13' },
    title: 'Marking, labelling and sale requirements',
    officerExplanation: 'Starter entry for marking, labelling, false/misleading label, records and sale requirements.',
    exactViolationCovered: 'Rule-level seed labelling and sale violations require exact official text verification.',
    officerPower: 'Use with Seeds Act inspection powers after checking official rule/sub-rule.',
    fieldUse: 'Verify label, germination/purity declaration, validity, lot number, treated seed warning and records.',
    stopSaleSeizureSamplingRelevance: 'Important for seed quality and label-based action.',
    sourceReferenceLink: 'Official Rules source required',
    verificationStatus: 'official source required',
    tags: ['seed rules', 'label', 'germination', 'purity', 'records'],
    exactText: officialSourceRequired,
  },
  {
    id: 'forms-schedules-starter',
    category: 'Show Cause Notice',
    lawName: 'FCO / Insecticides Rules / Seeds Rules',
    referenceNumber: 'Forms and Schedules',
    referenceType: 'form',
    nestedReference: { actOrOrder: 'Multiple input laws' },
    title: 'Forms, schedules and annexures placeholder',
    officerExplanation: 'Editable placeholder for exact forms, schedules and annexures once official source documents are added.',
    exactViolationCovered: 'Procedural form/schedule references are pending official source extraction.',
    fieldUse: 'Add exact form names, schedules and annexures from official PDFs/Gazette before field use.',
    sourceReferenceLink: 'Official source required',
    verificationStatus: 'official source required',
    tags: ['form', 'schedule', 'annexure', 'procedure'],
    exactText: officialSourceRequired,
  },
];
