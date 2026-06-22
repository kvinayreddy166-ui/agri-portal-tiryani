import type { LanguageCode } from './cropProtectionService';

export const teLabels: Record<string, string> = {
  'Crop Protection Guidance': 'పంట రక్షణ మార్గదర్శిని',
  'Select Crop': 'పంటను ఎంచుకోండి',
  Weeds: 'కలుపు మొక్కలు',
  Pests: 'పురుగులు',
  Diseases: 'తెగుళ్లు',
  Symptoms: 'లక్షణాలు',
  Damage: 'నష్టం లక్షణాలు',
  'Control Measures': 'నియంత్రణ చర్యలు',
  'Chemical Control': 'రసాయన నియంత్రణ',
  'Biological Control': 'జీవ నియంత్రణ',
  'Cultural Control': 'సాంస్కృతిక పద్ధతులు',
  'Mechanical Control': 'యాంత్రిక నియంత్రణ',
  'General IPM': 'సాధారణ ఐపీఎం',
  'Copy Advisory': 'సలహా కాపీ చేయండి',
  'Download PDF': 'PDF డౌన్‌లోడ్ చేయండి',
  'Spray Calculator': 'స్ప్రే కాలిక్యులేటర్',
  'Admin Data Editor': 'అడ్మిన్ డేటా ఎడిటర్',
  'Search guidance': 'మార్గదర్శకాన్ని వెతకండి',
  'Crop filter': 'పంట ఫిల్టర్',
  'Category filter': 'వర్గం ఫిల్టర్',
  'Severity filter': 'తీవ్రత ఫిల్టర్',
  'Stage filter': 'దశ ఫిల్టర్',
  'Official recommendation will be updated soon. Please follow local PJTSAU/Department advisory.':
    'అధికారిక సిఫారసు త్వరలో నవీకరించబడుతుంది. స్థానిక PJTSAU/శాఖ సలహాను అనుసరించండి.',
  'Telugu information will be updated soon': 'తెలుగు సమాచారం త్వరలో నవీకరించబడుతుంది',
};

export function label(text: string, language: LanguageCode) {
  return language === 'te' ? teLabels[text] || text : text;
}
