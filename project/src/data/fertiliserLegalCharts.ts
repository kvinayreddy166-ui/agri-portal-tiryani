export interface FertiliserLegalChartBranch {
  id: string;
  title: string;
  reference: string;
  details: string[];
  accent: 'cyan' | 'green' | 'blue';
}

export interface FertiliserLegalChart {
  id: string;
  chartNumber: string;
  title: string;
  topNode: string;
  branches: FertiliserLegalChartBranch[];
  footerNote: string;
}

export const fertiliserLegalCharts: FertiliserLegalChart[] = [
  {
    id: 'implementation-of-fco-1985',
    chartNumber: 'Chart 3',
    title: 'Implementation of FCO, 1985',
    topNode: 'Implementation of FCO, 1985',
    footerNote: 'Verify latest Government notification and departmental instructions before legal action.',
    branches: [
      {
        id: 'licensing',
        title: 'Licensing',
        reference: 'Clause 8 & 14',
        accent: 'cyan',
        details: [
          'Clause 8 and Clause 14',
          'C&DA / State Licensing Officer',
          'Manufacturing Licence in Form F',
          'Marketing Licence in Form A2',
        ],
      },
      {
        id: 'notified-authorities',
        title: 'Notified Authorities',
        reference: 'Clause 26A / Clause 8',
        accent: 'cyan',
        details: [
          'DAO: District Licensing Officer',
          'ADA: Division Licensing Officer',
          'Marketing Licence in Form A2',
        ],
      },
      {
        id: 'quality-monitoring-testing',
        title: 'Quality Monitoring / Testing',
        reference: 'Clause 29: Laboratory and Analysts',
        accent: 'green',
        details: [
          '3 FCO Labs',
          '64 labs in country',
          'CFQCTI Faridabad',
        ],
      },
      {
        id: 'enforcement-field-level',
        title: 'Enforcement at Field Level',
        reference: 'Clause 27 and 28',
        accent: 'blue',
        details: [
          'Clause 27',
          'All Agriculture Officers and above rank notified as Fertiliser Inspectors as per G.O.Ms.No.131',
          'Inspects all licensed premises in jurisdiction',
          'Draws samples for testing',
          'Launches prosecution in case of breach of Act/Order',
          'Sends inspection reports to licensing officer',
        ],
      },
    ],
  },
];
