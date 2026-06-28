import type { LegalCategory, VerificationStatus } from './legalReadyReckonerData';

export interface StopSaleSeizureMapping {
  id: string;
  group: 'Fertiliser cases under FCO 1985' | 'Fertiliser Movement Control Order cases' | 'Insecticide cases under Insecticides Act, 1968' | 'Seed cases under Seeds Act, 1966';
  situation: string;
  category: LegalCategory;
  applicableLaw: string;
  exactReference: string;
  officerPower: string;
  procedure: string[];
  penalProvision: string;
  requiredFormNoticeReport: string;
  caution: string;
  verificationStatus: VerificationStatus;
}

export interface OfficerWorkflow {
  id: string;
  title: string;
  steps: string[];
}

const verify = 'Verify exact current section/sub-section/clause/sub-clause/rule/sub-rule from official source before coercive action.';

export const stopSaleSeizureMappings: StopSaleSeizureMapping[] = [
  {
    id: 'fco-no-valid-authorization',
    group: 'Fertiliser cases under FCO 1985',
    situation: 'No valid licence/authorization or sale from unauthorized premises',
    category: 'Fertiliser',
    applicableLaw: 'Fertiliser (Control) Order, 1985',
    exactReference: 'Clauses 8 to 11; exact sub-clause official source required',
    officerPower: 'Verify authorization, inspect premises, propose stop sale/administrative action where legally supported.',
    procedure: ['Verify licence validity and premises endorsement', 'Record sale point details', 'Issue memo/show cause with exact verified clause', 'Report to competent authority'],
    penalProvision: 'Essential Commodities Act, 1955 Section 7 - verify latest',
    requiredFormNoticeReport: 'Inspection report, show cause notice, licence verification note',
    caution: verify,
    verificationStatus: 'official source required',
  },
  {
    id: 'fco-non-standard-adulterated',
    group: 'Fertiliser cases under FCO 1985',
    situation: 'Non-standard, suspected adulterated, misbranded or improperly packed fertiliser',
    category: 'Stop Sale / Seizure / Sampling',
    applicableLaw: 'Fertiliser (Control) Order, 1985',
    exactReference: 'Clause 19 with Clause 28 powers; Clause 29 and 30 for lab analysis',
    officerPower: 'Draw samples, detain/seize stock and proceed after lab report where exact sub-clause supports.',
    procedure: ['Record reason to believe', 'Capture batch, manufacturer, quantity and invoice', 'Draw sample as prescribed', 'Seal stock/sample and send to notified lab', 'Communicate result and proceed'],
    penalProvision: 'Essential Commodities Act, 1955 Section 7; Sections 8 and 10 if facts support',
    requiredFormNoticeReport: 'Sample memo, stop sale/seizure memo, lab dispatch register, inspection report',
    caution: 'Sampling defects can weaken prosecution. Follow exact sampling procedure and timeline.',
    verificationStatus: 'official source required',
  },
  {
    id: 'fco-no-bill-stock-mismatch',
    group: 'Fertiliser cases under FCO 1985',
    situation: 'No bill/cash memo, stock mismatch, display board violation or refusal to produce records',
    category: 'Fertiliser',
    applicableLaw: 'Fertiliser (Control) Order, 1985',
    exactReference: 'Clause 4, Clause 5, Clause 28 and record-related clause to be verified',
    officerPower: 'Require records, verify stock, document mismatch and issue show cause/administrative proposal.',
    procedure: ['Compare physical stock with registers', 'Collect sale bills/invoices', 'Record display board status', 'Take dealer acknowledgement', 'Escalate with evidence'],
    penalProvision: 'Essential Commodities Act, 1955 Section 7 - verify latest',
    requiredFormNoticeReport: 'Inspection memo, show cause notice, stock verification statement',
    caution: verify,
    verificationStatus: 'official source required',
  },
  {
    id: 'fmco-unauthorized-movement',
    group: 'Fertiliser Movement Control Order cases',
    situation: 'Unauthorized inter-State movement, diversion, transport without valid documents or suspected black marketing',
    category: 'Fertiliser Movement',
    applicableLaw: 'Fertiliser Movement Control Order, 1973',
    exactReference: 'Exact FMCO clause/sub-clause official source required',
    officerPower: 'Check vehicle, stock and transport documents; detention/seizure only where exact provision and authority support.',
    procedure: ['Record vehicle and consignment details', 'Verify invoice, e-way bill, allocation and destination', 'Record reason for suspected diversion', 'Inform higher authority', 'Proceed under verified clause'],
    penalProvision: 'Essential Commodities Act, 1955 Section 7 - verify latest',
    requiredFormNoticeReport: 'Vehicle checking memo, stock detention/seizure memo where applicable, report to DAO/ADA/JDA',
    caution: 'Do not detain stock or vehicle without recording legal basis and reason to believe.',
    verificationStatus: 'official source required',
  },
  {
    id: 'ia-unregistered-misbranded',
    group: 'Insecticide cases under Insecticides Act, 1968',
    situation: 'Sale of unregistered, misbranded, expired, banned/restricted or suspected spurious insecticide',
    category: 'Insecticides',
    applicableLaw: 'Insecticides Act, 1968 and Insecticides Rules, 1971',
    exactReference: 'Sections 17, 18, 21 to 24, 29; exact sub-sections and rules verify latest',
    officerPower: 'Inspect, stop sale/use, seize stock and take samples where exact provision permits.',
    procedure: ['Verify registration/licence and label', 'Record batch, expiry, manufacturer and quantity', 'Issue stop sale/seizure memo if supported', 'Draw sample and send to lab', 'Proceed after analyst report'],
    penalProvision: 'Insecticides Act, 1968 Section 29 - verify latest',
    requiredFormNoticeReport: 'Inspection report, seizure memo, sample documents, analyst report',
    caution: verify,
    verificationStatus: 'verify latest',
  },
  {
    id: 'ia-records-label-storage',
    group: 'Insecticide cases under Insecticides Act, 1968',
    situation: 'Licence/display/register/label/leaflet/storage violations or refusal to produce records',
    category: 'Insecticides',
    applicableLaw: 'Insecticides Act, 1968 and Insecticides Rules, 1971',
    exactReference: 'Section 21 plus applicable Rules/Form references; official source required for exact rule',
    officerPower: 'Inspect records and premises, document defects and initiate show cause/administrative action.',
    procedure: ['Inspect licence and display', 'Check Form/register maintenance', 'Verify label/leaflet and storage safety', 'Record observations and acknowledgement'],
    penalProvision: 'Insecticides Act, 1968 Section 29 - verify latest',
    requiredFormNoticeReport: 'Inspection checklist, show cause notice, photo evidence, record extract',
    caution: 'Use current Rules text before citing Rule 10, 14, 15, 33 or 35.',
    verificationStatus: 'official source required',
  },
  {
    id: 'seeds-quality-label',
    group: 'Seed cases under Seeds Act, 1966',
    situation: 'Notified seed below prescribed germination/purity, improper label, expired validity or missing lot number',
    category: 'Seeds',
    applicableLaw: 'Seeds Act, 1966 and Seeds Rules, 1968',
    exactReference: 'Sections 6, 7, 14 to 16, 19 and Rules 7 to 13; verify latest',
    officerPower: 'Inspect, draw samples, examine records and seize stock where contravention is suspected and exact provision permits.',
    procedure: ['Verify notified variety and label', 'Record lot number, validity and quantity', 'Draw sample as prescribed', 'Send to Seed Analyst', 'Proceed after report'],
    penalProvision: 'Seeds Act, 1966 Section 19 - verify latest',
    requiredFormNoticeReport: 'Seed sample memo, inspection report, analyst report, show cause notice',
    caution: 'Seed sampling and label details must match the lot exactly.',
    verificationStatus: 'verify latest',
  },
  {
    id: 'seeds-licence-records',
    group: 'Seed cases under Seeds Act, 1966',
    situation: 'Sale without licence where State rules require licence, refusal of records or suspected spurious seed',
    category: 'Seeds',
    applicableLaw: 'Seeds Act, 1966, Seeds Rules, 1968 and applicable State instructions',
    exactReference: 'Sections 13 to 15, 19; State licence rule/order exact source required',
    officerPower: 'Examine records, verify licence and stock, and report for administrative/prosecution action where supported.',
    procedure: ['Verify dealer licence/source certificate', 'Check purchase and sale registers', 'Record physical stock', 'Issue show cause or report to authority'],
    penalProvision: 'Seeds Act, 1966 Section 19 - verify latest',
    requiredFormNoticeReport: 'Inspection checklist, stock statement, show cause notice, report to DAO/ADA/JDA',
    caution: 'State seed dealer licensing source must be verified before citing licence violation.',
    verificationStatus: 'official source required',
  },
];

export const officerWorkflows: OfficerWorkflow[] = [
  {
    id: 'stop-sale-workflow',
    title: 'Stop Sale Workflow',
    steps: [
      'Identify violation',
      'Verify licence, invoice, label, stock register and physical stock',
      'Record product details: name, batch/lot number, quantity, manufacturer, expiry and invoice',
      'Issue stop sale order/notice as per applicable Act/Rule/Order',
      'Mention exact verified section/sub-section/clause/sub-clause/rule/sub-rule',
      'Take acknowledgement from dealer',
      'Inform higher authority',
      'Draw sample if quality/spurious/non-standard issue',
      'Follow up after lab report',
    ],
  },
  {
    id: 'seizure-workflow',
    title: 'Seizure Workflow',
    steps: [
      'Record reason to believe contravention',
      'Mention exact verified section/sub-section/clause/sub-clause/rule/sub-rule',
      'Prepare seizure memo/panchanama as per law',
      'List product name, batch/lot, quantity, packing and location',
      'Seal stock/sample properly',
      'Give copy to dealer or person in charge',
      'Inform court/higher authority as required',
      'Maintain chain of custody',
      'Follow prosecution/suspension procedure after report',
    ],
  },
  {
    id: 'sampling-workflow',
    title: 'Sampling Workflow',
    steps: [
      'Select product/lot/batch',
      'Draw sample as per prescribed procedure',
      'Mention exact verified rule/schedule/form for sampling',
      'Divide sample into required parts',
      'Seal, sign and label samples',
      'Give one sample/copy to dealer where required',
      'Send sample to notified lab within prescribed time',
      'Maintain sample dispatch register',
      'Communicate lab result within prescribed time',
    ],
  },
];
