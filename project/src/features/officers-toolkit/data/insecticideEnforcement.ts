import type { EnforcementDeadline, MindMapNode } from './fcoEnforcementMindMap';
import type { FcoOffenceEntry } from './fcoOffencesData';

export const insecticideDeadlines: EnforcementDeadline[] = [
  { limit: '20 days', action: 'Maximum stop-sale period — Sec. 21(1)(d), Rule 30' },
  { limit: '30 days', action: 'Laboratory analysis / report workflow — departmental procedure' },
  { limit: '28 days', action: 'Re-analysis application window after analytical report — Sec. 24(3)' },
  { limit: '30 days', action: 'CIL re-analysis report timeline — departmental procedure' },
  { limit: '3 / year', action: 'Dealer premises inspections — Rule 27' },
  { limit: '2 / year', action: 'Manufacturing premises inspections — Rule 28' },
  { limit: '15 days', action: 'Show-cause explanation — departmental enforcement workflow' },
  { limit: 'Case-based', action: 'Prosecution filing — after authorisation and charge sheet' },
];

export const insecticideMindMap: MindMapNode[] = [
  {
    id: 'ia-authorities',
    label: 'Enforcement Authorities',
    detail: 'Insecticide enforcement is carried out by notified Licensing Officers, Insecticide Inspectors and other authorised officers within their prescribed jurisdiction.',
    children: [
      {
        id: 'ia-state-la',
        label: 'State Licensing Authority',
        children: [
          { id: 'ia-state-cda', label: 'Commissioner & Director of Agriculture' },
          { id: 'ia-state-mfr', label: 'Manufacturing licences — Rule 9' },
          { id: 'ia-state-pco', label: 'Restricted PCO licences — Rule 10(3A)' },
        ],
      },
      {
        id: 'ia-district-la',
        label: 'District Licensing Authority',
        children: [
          { id: 'ia-dist-dao', label: 'District Agriculture Officer' },
          { id: 'ia-dist-licence', label: 'Sale / stock / exhibition / distribution licences — Rule 10' },
        ],
      },
      {
        id: 'ia-inspectors',
        label: 'Insecticide Inspectors',
        children: [
          { id: 'ia-insp-go', label: 'Agriculture Officers and above — G.O. Ms. No. 130' },
          { id: 'ia-insp-scope', label: 'Inspection, sampling, stop sale, seizure, enforcement and prosecution' },
        ],
      },
    ],
  },
  {
    id: 'ia-inspector',
    label: 'Insecticide Inspector',
    detail: 'Powers, duties and field responsibilities of the Insecticide Inspector.',
    children: [
      {
        id: 'ia-powers',
        label: 'Powers — Section 21',
        children: [
          { id: 'ia-power-enter', label: 'Enter and search premises' },
          { id: 'ia-power-records', label: 'Inspect records / registers / books' },
          { id: 'ia-power-copies', label: 'Take copies / extracts' },
          { id: 'ia-power-seize-records', label: 'Seize relevant records' },
          { id: 'ia-power-inquire', label: 'Examine / inquire into compliance' },
          { id: 'ia-power-vehicle', label: 'Stop vehicle where necessary' },
          { id: 'ia-power-stop-sale', label: 'Stop distribution / sale / use — Sec. 21(1)(d)' },
          { id: 'ia-power-seize-stock', label: 'Seize stock where legally applicable' },
          { id: 'ia-power-sample', label: 'Draw samples — Sec. 22' },
          { id: 'ia-power-analysis', label: 'Send samples for analysis — Sec. 22 / Rule 34' },
        ],
      },
      {
        id: 'ia-duties',
        label: 'Duties — Rule 27',
        children: [
          { id: 'ia-duty-inspect', label: 'Inspect all dealer premises three times a year' },
          { id: 'ia-duty-licence', label: 'Verify licence conditions are complied with' },
          { id: 'ia-duty-sample', label: 'Draw and send samples for analysis' },
          { id: 'ia-duty-complaint', label: 'Investigate written complaints' },
          { id: 'ia-duty-prosecute', label: 'Institute prosecution' },
          { id: 'ia-duty-records', label: 'Maintain inspection / action / sample / seizure records' },
          { id: 'ia-duty-enquiry', label: 'Conduct necessary enquiries and inspections' },
        ],
      },
    ],
  },
  {
    id: 'ia-sampling',
    label: 'Inspection & Sample Drawal',
    detail: 'Dealer / manufacturer inspection, sample collection and laboratory submission.',
    children: [
      {
        id: 'ia-dealer-insp',
        label: 'Dealer Inspection',
        children: [
          { id: 'ia-di-licence', label: 'Licence' },
          { id: 'ia-di-stock', label: 'Stock' },
          { id: 'ia-di-records', label: 'Records' },
          { id: 'ia-di-labels', label: 'Labels' },
          { id: 'ia-di-pc', label: 'Principal Certificate' },
          { id: 'ia-di-invoice', label: 'Purchase invoices' },
          { id: 'ia-di-expired', label: 'Expired stock — Rule 10-A' },
          { id: 'ia-di-display', label: 'Price / stock display — Rule 10-D' },
        ],
      },
      {
        id: 'ia-mfr-insp',
        label: 'Manufacturer Inspection',
        children: [
          { id: 'ia-mi-licence', label: 'Licence' },
          { id: 'ia-mi-premises', label: 'Manufacturing premises' },
          { id: 'ia-mi-batch', label: 'Batch records' },
          { id: 'ia-mi-stock', label: 'Stock' },
          { id: 'ia-mi-invoice', label: 'Invoices' },
          { id: 'ia-mi-pc', label: 'Principal documents' },
          { id: 'ia-mi-sample', label: 'Sample drawal' },
        ],
      },
      {
        id: 'ia-sample-steps',
        label: 'Sample Drawal',
        children: [
          { id: 'ia-sd-select', label: 'Select product' },
          { id: 'ia-sd-batch', label: 'Enter batch details' },
          { id: 'ia-sd-id', label: 'Generate Sample ID' },
          { id: 'ia-sd-panch', label: 'Panchanama' },
          { id: 'ia-sd-vc', label: 'Form V(C) — intimation of taking sample' },
          { id: 'ia-sd-vd', label: 'Form V(D) — kept with sealed sample' },
          { id: 'ia-sd-ve', label: 'Form V(E) — memorandum to Analyst' },
          { id: 'ia-sd-docket', label: 'Docket sheet' },
          { id: 'ia-sd-seal', label: 'Seal & dispatch — registered post / by hand' },
          { id: 'ia-sd-track', label: 'Laboratory tracking' },
        ],
      },
    ],
  },
  {
    id: 'ia-stop-seizure',
    label: 'Stop Sale & Seizure',
    detail: 'Prevent sale/distribution of suspected non-compliant insecticides and manage seizure proceedings.',
    children: [
      {
        id: 'ia-stop-sale',
        label: 'Stop Sale — Form V(A)',
        children: [
          { id: 'ia-ss-inspection', label: 'Select inspection' },
          { id: 'ia-ss-product', label: 'Select product' },
          { id: 'ia-ss-batch', label: 'Select batch' },
          { id: 'ia-ss-qty', label: 'Enter quantity' },
          { id: 'ia-ss-reason', label: 'Reason' },
          { id: 'ia-ss-legal', label: 'Legal provision', detail: 'Section 21(1)(d) permits stopping distribution, sale or use for a specified period not exceeding 30 days, subject to statutory conditions.' },
          { id: 'ia-ss-rule31', label: 'No sale of stock under stop-sale — Rule 31' },
        ],
      },
      {
        id: 'ia-seizure',
        label: 'Seizure — Form V(B)',
        children: [
          { id: 'ia-sz-id', label: 'Stock identification' },
          { id: 'ia-sz-qty', label: 'Quantity' },
          { id: 'ia-sz-batch', label: 'Batch' },
          { id: 'ia-sz-invoice', label: 'Invoice' },
          { id: 'ia-sz-records', label: 'Records' },
          { id: 'ia-sz-witness', label: 'Witnesses' },
          { id: 'ia-sz-receipt', label: 'Seizure receipt' },
          { id: 'ia-sz-custody', label: 'Custody' },
          { id: 'ia-sz-court', label: 'Court submission' },
        ],
      },
    ],
  },
  {
    id: 'ia-analytical',
    label: 'Analytical Report & Misbranded Cases',
    detail: 'Track samples from laboratory submission to analytical result and enforcement action.',
    children: [
      {
        id: 'ia-analysis-flow',
        label: 'Sample → Report workflow',
        children: [
          { id: 'ia-af-1', label: '1. Sample drawn' },
          { id: 'ia-af-2', label: '2. Form V(D) + V(E) + docket' },
          { id: 'ia-af-3', label: '3. Coding centre' },
          { id: 'ia-af-4', label: '4. PTL / BPTL' },
          { id: 'ia-af-5', label: '5. Analysis' },
          { id: 'ia-af-6', label: '6. Form IV — report' },
          { id: 'ia-af-7', label: '7. Back to Inspector' },
          { id: 'ia-af-8', label: '8. Result: Conforming / Misbranded' },
        ],
      },
    ],
  },
  {
    id: 'ia-followup',
    label: 'Follow-Up Actions Against Offenders',
    detail: 'Administrative enforcement, stock control, re-analysis and prosecution workflow.',
    children: [
      {
        id: 'ia-fu-chain',
        label: 'Report → Prosecution chain',
        children: [
          { id: 'ia-fu-1', label: '1. Analytical report' },
          { id: 'ia-fu-2', label: '2. Serve report' },
          { id: 'ia-fu-3', label: '3. Panchnama' },
          { id: 'ia-fu-4', label: '4. Stop sale / stock control' },
          { id: 'ia-fu-5', label: '5. Seizure where applicable' },
          { id: 'ia-fu-6', label: '6. Court custody' },
          { id: 'ia-fu-7', label: '7. Re-analysis opportunity — Sec. 24(3)' },
          { id: 'ia-fu-8', label: '8. CIL report' },
          { id: 'ia-fu-9', label: '9. Prosecution decision' },
          { id: 'ia-fu-10', label: '10. Authorisation' },
          { id: 'ia-fu-11', label: '11. Charge sheet' },
          { id: 'ia-fu-12', label: '12. Court / CC No.' },
        ],
      },
    ],
  },
  {
    id: 'ia-forms',
    label: 'Enforcement Forms',
    detail: 'Forms and records used during inspection, sampling, stop-sale, seizure and analysis.',
    children: [
      { id: 'ia-f-iv', label: 'Form IV — Insecticide Analyst report', detail: 'Rule 24(3).' },
      { id: 'ia-f-vc', label: 'Form V(C) — sample-taking intimation', detail: 'Rule 33.' },
      { id: 'ia-f-vd', label: 'Form V(D) — sealed sample document', detail: 'Rule 34(1).' },
      { id: 'ia-f-ve', label: 'Form V(E) — memorandum to Analyst', detail: 'Rule 34(3).' },
      { id: 'ia-f-va', label: 'Form V(A) — stop-sale / non-disposal order', detail: 'Rule 30.' },
      { id: 'ia-f-vb', label: 'Form V(B) — seizure receipt', detail: 'Rule 32.' },
      { id: 'ia-f-docket', label: 'Docket sheet' },
      { id: 'ia-f-inspection', label: 'Inspection report' },
      { id: 'ia-f-panch', label: 'Panchanama' },
    ],
  },
];

export const insecticideOffenceEntries: FcoOffenceEntry[] = [
  { serialNumber: 1, offenceType: 'Selling of misbranded pesticides', contraventionProvision: 'Sec. 3(k), 17, 18, 21(1)(d)', punishmentProvision: 'Sec. 29(1)(a) 1st instance: fine ₹10,000-₹50,000, or imprisonment up to 2 years, or both', useInField: 'Sec. 3(k) misbranded; Sec. 17 import/manufacture prohibition; Sec. 18 sale/stock prohibition; Sec. 21(1)(d) stop-sale & seizure. Use with analytical report (Form IV).', sourceStatus: 'verify latest' },
  { serialNumber: 2, offenceType: 'Selling of pesticide without licence / unauthorized', contraventionProvision: 'Sec. 13 & Sec. 29(1)(c)', punishmentProvision: 'Sec. 29(1) 1st instance: fine ₹10,000-₹50,000, or imprisonment up to 2 years, or both', useInField: 'Use when dealer manufactures, sells, stocks, exhibits for sale or distributes without a valid licence.', sourceStatus: 'verify latest' },
  { serialNumber: 3, offenceType: 'Selling of pesticide with improper labelling', contraventionProvision: 'Sec. 3(k) r/w Rule 20', punishmentProvision: 'Sec. 29(1); Rule 20 violation also attracts Sec. 29(3)', useInField: 'Use when labels/wrappers/containers carry altered inscriptions or lack prescribed particulars.', sourceStatus: 'verify latest' },
  { serialNumber: 4, offenceType: 'Misrepresentation / misleading statement on label', contraventionProvision: 'Sec. 3(k) — misbranded', punishmentProvision: 'Sec. 29(1)', useInField: 'Use when efficacy or safety claims on the label are false or misleading.', sourceStatus: 'verify latest' },
  { serialNumber: 5, offenceType: 'Selling of duplicate pesticides', contraventionProvision: 'Sec. 3(k) — misbranded', punishmentProvision: 'Sec. 29(1)', useInField: 'Use for counterfeit/spurious packing, fictitious manufacturer or unverifiable batch.', sourceStatus: 'verify latest' },
  { serialNumber: 6, offenceType: 'Selling of date-expired pesticides', contraventionProvision: 'Rule 10-A — segregation & disposal of date-expired pesticides', punishmentProvision: 'Sec. 29(3) — contravention of Act/Rules provisions', useInField: 'Use when expired stock is not segregated, stamped NOT FOR SALE/USE/MANUFACTURE or kept undeclared.', sourceStatus: 'verify latest' },
  { serialNumber: 7, offenceType: 'Non-issuing of cash memo & non-maintenance of records / monthly returns', contraventionProvision: 'Rule 15(1) & 15(2)', punishmentProvision: 'Sec. 29(3) — first offence: imprisonment up to 1 year, or fine ₹5,000-₹25,000, or both', useInField: 'Use when cash/credit memos are not issued, stock registers absent or monthly returns not submitted to Licensing Authority.', sourceStatus: 'verify latest' },
  { serialNumber: 8, offenceType: 'Manufacturer non-compliance on packing & labelling', contraventionProvision: 'Rules 16, 17 & 19', punishmentProvision: 'Sec. 29(3) — first offence: imprisonment up to 1 year, or fine ₹5,000-₹25,000, or both', useInField: 'Rule 16 — no sale/distribution unless packed & labelled; Rule 17 — packing as approved; Rule 19 — manner of labelling.', sourceStatus: 'verify latest' },
  { serialNumber: 9, offenceType: 'Sale of stock under stop-sale order', contraventionProvision: 'Rule 31 r/w Sec. 21(1)(d)', punishmentProvision: 'Sec. 29(3)', useInField: 'Use when dealer sells stock covered by a Form V(A) order not to dispose.', sourceStatus: 'verify latest' },
  { serialNumber: 10, offenceType: 'Obstruction of Inspector in duties', contraventionProvision: 'Sec. 24', punishmentProvision: 'Sec. 29 — imprisonment / fine', useInField: 'Use when entry, search, records inspection or sampling is obstructed.', sourceStatus: 'verify latest' },
  { serialNumber: 11, offenceType: 'Storage / sale of insecticide with food articles', contraventionProvision: 'Rule 10-C r/w Rule 36', punishmentProvision: 'Sec. 29(3)', useInField: 'Use when insecticides are stored or sold from premises storing consumable articles.', sourceStatus: 'verify latest' },
  { serialNumber: 12, offenceType: 'Non-display of stock position & price list', contraventionProvision: 'Rule 10-D', punishmentProvision: 'Sec. 29(3) / licence action', useInField: 'Use in inspection note where stock/price display boards are absent.', sourceStatus: 'verify latest' },
  { serialNumber: 13, offenceType: 'PCO operating restricted chemicals without licence / training', contraventionProvision: 'Rule 10(3A)', punishmentProvision: 'Sec. 29 — imprisonment / fine', useInField: 'Use for Al-phosphide / methyl bromide / EDB fumigation without licence, 15-day training or PPA permission.', sourceStatus: 'verify latest' },
  { serialNumber: 14, offenceType: 'Import / sale of unregistered insecticide', contraventionProvision: 'Sec. 9 r/w Sec. 3(e)', punishmentProvision: 'Sec. 29 — imprisonment / fine', useInField: 'Use when the product is not registered with the Registration Committee (CIB&RC).', sourceStatus: 'verify latest' },
];
