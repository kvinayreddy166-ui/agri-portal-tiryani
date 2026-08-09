import type { VerificationStatus } from './legalReadyReckonerData';

export interface LegalChecklistItem {
  id: string;
  label: string;
  reference: string;
  verificationStatus: VerificationStatus;
}

export interface LegalInspectionChecklist {
  id: string;
  title: string;
  items: LegalChecklistItem[];
}

const commonFertiliserReference = 'FCO 1985 Clause mapping official source required';
const commonSeedReference = 'Seeds Act 1966 / Seeds Rules 1968 exact reference verify latest';
const commonPesticideReference = 'Insecticides Act 1968 / Rules 1971 exact reference verify latest';

export const legalInspectionChecklists: LegalInspectionChecklist[] = [
  {
    id: 'fertilizer-dealer',
    title: 'Fertilizer dealer inspection',
    items: [
      { id: 'licence', label: 'Licence/authorization validity and premises endorsement', reference: 'FCO Clauses 8 to 11', verificationStatus: 'official source required' },
      { id: 'source', label: 'Source certificate/authorization and purchase invoices', reference: commonFertiliserReference, verificationStatus: 'official source required' },
      { id: 'stock-register', label: 'Stock register and sale register', reference: 'FCO Clause 28 inspection powers; exact record clause required', verificationStatus: 'official source required' },
      { id: 'bills', label: 'Farmer/dealer bills and cash/credit memo', reference: 'FCO Clause 5', verificationStatus: 'official source required' },
      { id: 'physical-stock', label: 'Physical stock verification against records', reference: 'FCO Clause 28', verificationStatus: 'official source required' },
      { id: 'label-packing', label: 'Label, bag marking and packing verification', reference: 'FCO Clause 21 / Clause 19 where applicable', verificationStatus: 'official source required' },
      { id: 'batch', label: 'Batch/lot number, manufacturer and quantity', reference: 'FCO sampling and analysis provisions verify exact clause', verificationStatus: 'official source required' },
      { id: 'price', label: 'Price/MRP compliance', reference: 'FCO price provision and Clause 4 display requirement', verificationStatus: 'official source required' },
      { id: 'display', label: 'Display board compliance for stock and price list', reference: 'FCO Clause 4', verificationStatus: 'official source required' },
      { id: 'sample', label: 'Sample drawal requirement for quality/spurious/non-standard issue', reference: 'FCO Clause 28, 29 and 30', verificationStatus: 'official source required' },
      { id: 'stop-sale', label: 'Stop sale/seizure decision point', reference: 'FCO Clause 28 exact sub-clause required', verificationStatus: 'official source required' },
      { id: 'reporting', label: 'Higher authority reporting requirement', reference: 'State departmental instructions verify latest', verificationStatus: 'verify latest' },
    ],
  },
  {
    id: 'pesticide-dealer',
    title: 'Pesticide dealer inspection',
    items: [
      { id: 'licence', label: 'Licence validity and prominent display', reference: commonPesticideReference, verificationStatus: 'verify latest' },
      { id: 'registration', label: 'Product registration and banned/restricted status', reference: 'Insecticides Act Sections 9, 17 and 18', verificationStatus: 'verify latest' },
      { id: 'stock-sale', label: 'Stock register and sale records', reference: 'Insecticides Rules record/form reference official source required', verificationStatus: 'official source required' },
      { id: 'invoice', label: 'Purchase invoices and dealer bills', reference: commonPesticideReference, verificationStatus: 'official source required' },
      { id: 'physical-stock', label: 'Physical stock verification', reference: 'Insecticides Act Section 21 powers verify latest', verificationStatus: 'verify latest' },
      { id: 'label', label: 'Label, leaflet, batch number, manufacturing date and expiry date', reference: 'Insecticides Act Section 18 and Rules label provisions verify latest', verificationStatus: 'verify latest' },
      { id: 'storage', label: 'Storage away from food/fodder and safety compliance', reference: 'Insecticides Rules exact rule official source required', verificationStatus: 'official source required' },
      { id: 'sample', label: 'Sample drawal requirement', reference: 'Insecticides Act Sections 21 to 24', verificationStatus: 'verify latest' },
      { id: 'stop-sale', label: 'Stop sale/seizure decision point', reference: 'Insecticides Act Section 21 exact sub-section verify latest', verificationStatus: 'verify latest' },
      { id: 'reporting', label: 'Higher authority reporting requirement', reference: 'State departmental instructions verify latest', verificationStatus: 'verify latest' },
    ],
  },
  {
    id: 'seed-dealer',
    title: 'Seed dealer inspection',
    items: [
      { id: 'licence', label: 'Dealer licence validity where State rules require licence', reference: 'State seed licensing source required', verificationStatus: 'official source required' },
      { id: 'source', label: 'Source certificate, certification tag and purchase invoices', reference: commonSeedReference, verificationStatus: 'verify latest' },
      { id: 'stock-sale', label: 'Stock register and sale register', reference: 'Seeds Rules exact record rule official source required', verificationStatus: 'official source required' },
      { id: 'bills', label: 'Farmer/dealer bills', reference: commonSeedReference, verificationStatus: 'official source required' },
      { id: 'physical-stock', label: 'Physical stock verification', reference: 'Seeds Act Section 14', verificationStatus: 'verify latest' },
      { id: 'label', label: 'Label, variety, lot number, germination and purity declaration', reference: 'Seeds Act Sections 6 and 7; Seeds Rules 7 to 13', verificationStatus: 'verify latest' },
      { id: 'validity', label: 'Expiry/best before/germination validity', reference: commonSeedReference, verificationStatus: 'verify latest' },
      { id: 'treated', label: 'Treated seed warning label where applicable', reference: 'Seeds Rules exact rule official source required', verificationStatus: 'official source required' },
      { id: 'sample', label: 'Sample drawal requirement', reference: 'Seeds Act Sections 14 to 16', verificationStatus: 'verify latest' },
      { id: 'stop-sale', label: 'Stop sale/seizure decision point', reference: 'Seeds Act Section 14 exact clause verify latest', verificationStatus: 'verify latest' },
      { id: 'reporting', label: 'Higher authority reporting requirement', reference: 'State departmental instructions verify latest', verificationStatus: 'verify latest' },
    ],
  },
  {
    id: 'fertiliser-movement',
    title: 'Fertiliser movement/transport checking',
    items: [
      { id: 'vehicle', label: 'Vehicle number, driver/person in charge and route details', reference: 'FMCO 1973 exact clause official source required', verificationStatus: 'official source required' },
      { id: 'documents', label: 'Invoice, e-way bill, allocation and destination documents', reference: 'FMCO 1973 exact clause official source required', verificationStatus: 'official source required' },
      { id: 'quantity', label: 'Quantity and physical stock verification', reference: 'FMCO/FCO exact clause official source required', verificationStatus: 'official source required' },
      { id: 'diversion', label: 'Diversion/black marketing suspicion and reason to believe', reference: 'FMCO 1973 exact clause official source required', verificationStatus: 'official source required' },
      { id: 'seizure', label: 'Detention/seizure decision point', reference: 'FMCO/FCO/ECA exact power official source required', verificationStatus: 'official source required' },
      { id: 'report', label: 'Report to higher authority with documents and acknowledgement', reference: 'State departmental instructions verify latest', verificationStatus: 'verify latest' },
    ],
  },
];
