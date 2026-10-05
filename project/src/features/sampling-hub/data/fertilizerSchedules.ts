export interface FertilizerSchedulePart {
  id: string;
  label: string;
}

export interface FertilizerScheduleEntry {
  id: string;
  scheduleNo: string;
  title: string;
  subtitle: string;
  parts: FertilizerSchedulePart[];
  keywords: string[];
}

export const fertilizerSchedules: FertilizerScheduleEntry[] = [
  {
    id: 'schedule-i',
    scheduleNo: 'Schedule - I',
    title: 'Fertiliser specifications and tolerance limits',
    subtitle: 'Specifications of fertilisers and nutrient/physical tolerance limits.',
    parts: [
      { id: 'schedule-i-a', label: 'Part A - Specifications of Fertilisers' },
      { id: 'schedule-i-b', label: 'Part B - Tolerance Limit in Plant Nutrient and Physical Parameters for Various Fertilisers' },
    ],
    keywords: ['schedule 1', 'schedule i', 'specifications', 'fertilisers', 'tolerance limit', 'plant nutrient', 'physical parameters'],
  },
  {
    id: 'schedule-ii',
    scheduleNo: 'Schedule - II',
    title: 'Fertiliser sampling and analysis',
    subtitle: 'Procedure for drawal of samples and methods of analysis of fertilisers.',
    parts: [
      { id: 'schedule-ii-a', label: 'Part A - Procedure for Drawal of Samples of Fertilisers' },
      { id: 'schedule-ii-b', label: 'Part B - Methods of Analysis of Fertilisers' },
    ],
    keywords: ['schedule 2', 'schedule ii', 'sampling', 'drawal', 'samples', 'analysis', 'fertilisers'],
  },
  {
    id: 'schedule-iii',
    scheduleNo: 'Schedule - III',
    title: 'Biofertilisers',
    subtitle: 'Specifications, tolerance limits, sampling and analysis of biofertilisers.',
    parts: [
      { id: 'schedule-iii-a', label: 'Part A - Specifications of Biofertilisers' },
      { id: 'schedule-iii-b', label: 'Part B - Tolerance Limit of Biofertilisers' },
      { id: 'schedule-iii-c', label: 'Part C - Procedure for Drawal of Sample of Biofertilisers' },
      { id: 'schedule-iii-d', label: 'Part D - Methods of Analysis of Biofertilisers' },
    ],
    keywords: ['schedule 3', 'schedule iii', 'biofertilisers', 'tolerance', 'sampling', 'analysis'],
  },
  {
    id: 'schedule-iv',
    scheduleNo: 'Schedule - IV',
    title: 'Organic fertilisers',
    subtitle: 'Specifications, tolerance limits, sampling and analysis of organic fertilisers.',
    parts: [
      { id: 'schedule-iv-a', label: 'Part A - Specifications of Organic Fertilisers' },
      { id: 'schedule-iv-b', label: 'Part B - Tolerance Limit of Organic Fertilisers' },
      { id: 'schedule-iv-c', label: 'Part C - Procedure for Drawal of Sample of Organic Fertilisers' },
      { id: 'schedule-iv-d', label: 'Part D - Methods of Analysis of Organic Fertilisers' },
    ],
    keywords: ['schedule 4', 'schedule iv', 'organic fertilisers', 'tolerance', 'sampling', 'analysis'],
  },
  {
    id: 'schedule-v',
    scheduleNo: 'Schedule - V',
    title: 'Non-edible de-oiled cake fertilisers',
    subtitle: 'Specifications, tolerance limits, sampling and analysis for non-edible de-oiled cake fertilisers.',
    parts: [
      { id: 'schedule-v-a', label: 'Part A - Specifications of Non-Edible De-Oiled Cake Fertilisers' },
      { id: 'schedule-v-b', label: 'Part B - Tolerance Limit of Non-edible De-Oiled Cake Fertilisers' },
      { id: 'schedule-v-c', label: 'Part C - Procedure for Drawal of Sample of Non-edible De-Oiled Cake Fertilisers' },
      { id: 'schedule-v-d', label: 'Part D - Methods of Analysis for Non-Edible De-oiled Cake Fertilisers' },
    ],
    keywords: ['schedule 5', 'schedule v', 'non-edible', 'de-oiled cake', 'tolerance', 'sampling', 'analysis'],
  },
  {
    id: 'schedule-vi',
    scheduleNo: 'Schedule - VI',
    title: 'Biostimulants',
    subtitle: 'Specifications, tolerance limits, sample drawal and testing methodology for biostimulants.',
    parts: [
      { id: 'schedule-vi-a', label: 'Part A - Specifications of Biostimulants' },
      { id: 'schedule-vi-b', label: 'Part B - Tolerance Limit' },
      { id: 'schedule-vi-c', label: 'Part C - Procedure for Drawal of Samples of Biostimulants' },
      { id: 'schedule-vi-d', label: 'Part D - Methodology of Testing' },
    ],
    keywords: ['schedule 6', 'schedule vi', 'biostimulants', 'tolerance', 'sample drawal', 'testing'],
  },
  {
    id: 'schedule-vii',
    scheduleNo: 'Schedule - VII',
    title: 'Nano fertiliser',
    subtitle: 'General specifications of nano fertiliser.',
    parts: [
      { id: 'schedule-vii-general', label: 'General Specifications of Nano Fertiliser' },
    ],
    keywords: ['schedule 7', 'schedule vii', 'nano fertiliser', 'general specifications'],
  },
  {
    id: 'schedule-viii',
    scheduleNo: 'Schedule - VIII',
    title: 'Organic carbon enhancer',
    subtitle: 'Organic carbon enhancer from compressed bio gas plants and soil carbon enhancer references.',
    parts: [
      { id: 'schedule-viii-oce', label: 'Organic Carbon Enhancer from Compressed Bio Gas Plants' },
      { id: 'schedule-viii-a', label: 'Part A - General Specifications of Soil Carbon Enhancer' },
      { id: 'schedule-viii-b', label: 'Part B - Procedure for Drawal of Sample of Soil Carbon Enhancer' },
      { id: 'schedule-viii-c', label: 'Part C - Method of Analysis of Fermented Organic Manure' },
      { id: 'schedule-viii-liquid', label: 'Methods of Analysis of Liquid Fermented Organic Manure' },
    ],
    keywords: ['schedule 8', 'schedule viii', 'organic carbon enhancer', 'compressed bio gas', 'soil carbon enhancer', 'fermented organic manure'],
  },
];