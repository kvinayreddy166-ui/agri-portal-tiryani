import type { LanguageCode } from './cropProtectionService';

export const teLabels: Record<string, string> = {
  'Crop Protection Guidance': 'పంట రక్షణ మార్గదర్శిని',
  'Crop Doctor Pro': 'క్రాప్ డాక్టర్ ప్రో',
  'Officer Toolkit': 'అధికారుల టూల్‌కిట్',
  'Search crop, pest, disease, weed or symptom': 'పంట, పురుగు, తెగులు, కలుపు లేదా లక్షణం వెతకండి',
  'Crop, pest, disease, weed and nutrient deficiency guidance for field officers.': 'క్షేత్ర అధికారుల కోసం పంట, పురుగు, తెగులు, కలుపు మరియు పోషక లోపాల మార్గదర్శిని.',
  'Select Crop': 'పంటను ఎంచుకోండి',
  'Quick Crop Selection': 'త్వరిత పంట ఎంపిక',
  'No information available currently': 'ప్రస్తుతం సమాచారం అందుబాటులో లేదు',
  Weeds: 'కలుపు మొక్కలు',
  Pests: 'పురుగులు',
  Diseases: 'తెగుళ్లు',
  'Nutrient Deficiencies': 'పోషక లోపాలు',
  'Identify weed flora and control options.': 'కలుపు మొక్కలు మరియు నియంత్రణ పద్ధతులను గుర్తించండి.',
  'Identify insects, symptoms and ETL.': 'పురుగులు, లక్షణాలు మరియు ETL గుర్తించండి.',
  'Identify diseases and field symptoms.': 'తెగుళ్లు మరియు క్షేత్ర లక్షణాలను గుర్తించండి.',
  'Identify nutrient deficiency symptoms.': 'పోషక లోపాల లక్షణాలను గుర్తించండి.',
  Symptoms: 'లక్షణాలు',
  Damage: 'నష్టం లక్షణాలు',
  'Control Measures': 'నియంత్రణ చర్యలు',
  'Chemical Control': 'రసాయన నియంత్రణ',
  'Biological Control': 'జీవ నియంత్రణ',
  'Cultural Control': 'సాంస్కృతిక పద్ధతులు',
  'Mechanical Control': 'యాంత్రిక నియంత్రణ',
  'General IPM': 'సాధారణ ఐపీఎం',
  'Copy Advisory': 'సలహా కాపీ చేయండి',
  'WhatsApp': 'వాట్సాప్',
  'Download PDF': 'PDF డౌన్‌లోడ్ చేయండి',
  'Spray Calculator': 'స్ప్రే కాలిక్యులేటర్',
  'Admin Data Editor': 'అడ్మిన్ డేటా ఎడిటర్',
  'Search guidance': 'మార్గదర్శకాన్ని వెతకండి',
  'All severity': 'అన్ని తీవ్రతలు',
  'All stages': 'అన్ని దశలు',
  Guidance: 'మార్గదర్శిని',
  Refresh: 'రిఫ్రెష్',
  English: 'English',
  Telugu: 'తెలుగు',
  'AI photo diagnosis coming soon': 'AI ఫోటో గుర్తింపు త్వరలో వస్తుంది',
  'Identify from Photo': 'ఫోటోతో గుర్తించండి',
  'Official recommendation will be updated soon. Please follow local PJTSAU/Department advisory.':
    'అధికారిక సిఫారసు త్వరలో నవీకరించబడుతుంది. స్థానిక PJTSAU/శాఖ సలహాను అనుసరించండి.',
  'Telugu information will be updated soon': 'తెలుగు సమాచారం త్వరలో నవీకరించబడుతుంది',
};

export function label(text: string, language: LanguageCode) {
  return language === 'te' ? teLabels[text] || text : text;
}
