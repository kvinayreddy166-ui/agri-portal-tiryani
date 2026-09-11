import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { BackButton } from '../components/ui/BackButton';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { FileText, ChevronRight, CheckCircle, FileText as FileIcon, ExternalLink, Copy, ArrowLeft, BadgeCheck, MapPin, KeyRound, Landmark, IndianRupee, Info, ReceiptText, Store, ClipboardList, Sprout, ArrowUpRight, X } from 'lucide-react';
import { TELANGANA_DISTRICTS } from '../data/telanganaDistrictMandalData';

// District to Division mapping
const DISTRICT_DIVISION_MAPPING: Record<string, string[]> = {
  'Adilabad': ['Adilabad Rural', 'Boath', 'Ichoda', 'Tamsi', 'Utnoor'],
  'Bhadradri Kothagudem': ['Aswaraopeta', 'Bhadrachalam', 'Kothagudem', 'Manuguru', 'Yellandu'],
  'Hanamkonda': ['Hanamkonda', 'Parkal'],
  'Jagtial': ['Dharmapuri', 'Jagtial', 'Korutla'],
  'Jangaon': ['Ghanpur Station', 'Jangaon', 'Palakurthi'],
  'Jayashankar Bhupalpally': ['Bhupalpally', 'Mahadevpur'],
  'Jogulamba Gadwal': ['Alampur', 'Gadwal', 'Ieeja'],
  'Kamareddy': ['Banswada', 'Bichkunda', 'Kamareddy', 'Yellareddy'],
  'Karimnagar': ['Choppadandi', 'Huzurabad', 'Karimnagar', 'Manakondur'],
  'Khammam': ['Khammam Urban', 'Kusumanchi', 'Madhira', 'Sathupalle', 'Wyra'],
  'Kumrambheem Asifabad': ['Asifabad', 'Kagaznagar', 'Penchikalpet', 'Sirpur U'],
  'Hyderabad': [],
  'Mahabubabad': ['Mahabubabad', 'Maripeda'],
  'Mahabubnagar': ['Devarkadara', 'Jadcherla', 'Mahabubnagar Rural'],
  'Mancherial': ['Bellampalle', 'Bheemini', 'Chennur', 'Mancherial'],
  'Medak': ['Kowdipalle', 'Medak', 'Narsapur', 'Ramayampet'],
  'Medchal–Malkajgiri': ['Malkajgiri', 'Medchal'],
  'Mulugu': ['Eturnagaram', 'Mulugu'],
  'Nagarkurnool': ['Achampet', 'Kalwakurthy', 'Kollapur', 'Nagarkurnool'],
  'Nalgonda': ['Anumula', 'Devarakonda', 'Miryalaguda', 'Munugode', 'Nakrekal', 'Nalgonda'],
  'Narayanpet': ['Kosgi', 'Makthal', 'Narayanpet'],
  'Nirmal': ['Bhainsa', 'Khanapur', 'Mudhole', 'Nirmal'],
  'Nizamabad': ['Armoor', 'Balkonda', 'Bheemgal', 'Bodhan', 'Indalwai', 'Nizamabad Rural', 'Nizamabad South', 'Rudrur'],
  'Peddapalli': ['Manthani', 'Peddapalle', 'Ramagundam'],
  'Rajanna Sircilla': ['Sircilla', 'Vemulawada'],
  'Ranga Reddy': ['Amangal', 'Chevella', 'Ibrahimpatnam', 'Maheshwaram', 'Rajendranagar', 'Shadnagar'],
  'Sangareddy': ['Andole', 'Narayankhed', 'Patancheru', 'Raikode', 'Sangareddy', 'Zahirabad'],
  'Siddipet': ['Cheriyal', 'Dubbak', 'Gajwel', 'Husnabad', 'Mulug', 'Siddipet'],
  'Suryapet': ['Huzurnagar', 'Kodad', 'Suryapet', 'Thungathurthy'],
  'Vikarabad': ['Kodangal', 'Pargi', 'Tandur', 'Vikarabad'],
  'Wanaparthy': ['Kothakota', 'Pangal', 'Wanaparthy'],
  'Warangal': ['Narsampet', 'Wardhannapet'],
  'Yadadri Bhuvanagiri': ['Alair', 'Bhongir', 'Yadagirigutta'],
};

// DDO Code mapping for Districts and Divisions
const DISTRICT_DDO_CODES: Record<string, string> = {
  'Adilabad': '01010102001',
  'Bhadradri Kothagudem': '09010102006',
  'Jagtial': '06010102005',
  'Jangaon': '19010102017',
  'Jayashankar Bhupalpally': '08010102001',
  'Jogulamba Gadwal': '26010102003',
  'Kamareddy': '15010102003',
  'Karimnagar': '13010102001',
  'Khammam': '31010102002',
  'Kumrambheem Asifabad': '02010102003',
  'Mahabubabad': '10010102001',
  'Mahabubnagar': '22010102001',
  'Mancherial': '3010102004',
  'Medak': '17010102002',
  'Medchal–Malkajgiri': '21010102003',
  'Mulugu': '35010102002',
  'Nagarkurnool': '28010102003',
  'Nalgonda': '29010102004',
  'Narayanpet': '34010102001',
  'Nirmal': '04010102002',
  'Nizamabad': '05010102001',
  'Peddapalli': '07010102002',
  'Rajanna Sircilla': '14010102003',
  'Ranga Reddy': '23010102004',
  'Sangareddy': '16010102002',
  'Siddipet': '18010102003',
  'Suryapet': '30010102002',
  'Vikarabad': '24010102005',
  'Wanaparthy': '27010102003',
  'Warangal': '11010102001',
  'Yadadri Bhuvanagiri': '20010102004',
};

const DIVISION_DDO_CODES: Record<string, Record<string, string>> = {
  'Mahabubnagar': {
    'Mahabubnagar Rural': '22010102002',
  },
  'Jayashankar Bhupalpally': {
    'Mahadevpur': '08030102001',
    'Bhupalpally': '08010102020',
  },
  'Kumrambheem Asifabad': {
    'Asifabad': '02010102001',
    'Kagaznagar': '02020102001',
    'Sirpur U': '02010102002',
  },
  'Mancherial': {
    'Mancherial': '03010102001',
    'Chennur': '03030102001',
  },
};

function getDivisionsForDistrict(district: string): string[] {
  return DISTRICT_DIVISION_MAPPING[district] || [];
}

type LicenseType = 'fertilizer' | 'seed' | 'insecticide';
type ApplicationType = 'fresh' | 'renewal' | 'renewal_grace_period' | 'amendment' | 'duplicate' | 'pc_inclusion';
type DealerType = 'wholesaler' | 'retailer' | 'coop_societies' | 'manufacturing_license';
type AreaType = 'municipal' | 'rural' | 'manufacturing_license';

type FertilizerAmendmentType =
  | 'change_of_address'
  | 'change_of_name'
  | 'addition_of_godown'
  | 'deletion_of_godown'
  | 'addition_of_person'
  | 'deletion_of_person'
  | 'inclusion_of_form_o';

type SeedAmendmentType =
  | 'change_in_address'
  | 'change_in_name'
  | 'inclusion_of_storage'
  | 'deletion_of_storage'
  | 'change_of_salepoint'
  | 'change_of_person'
  | 'inclusion_of_certificate'
  | 'deletion_of_certificate';

type InsecticideAmendmentType =
  | 'change_of_firm_name'
  | 'change_in_address_salepoint'
  | 'transfer_of_license'
  | 'inclusion_of_storage'
  | 'deletion_of_storage'
  | 'change_of_expert_staff'
  | 'deletion_of_expert_staff'
  | 'change_of_person_responsible'
  | 'inclusion_of_insecticides'
  | 'extension_of_lease';

const FERTILIZER_AMENDMENT_TYPES: Record<FertilizerAmendmentType, string> = {
  change_of_address: 'Change of Address of the Sale Point',
  change_of_name: 'Change in Name of the Office / Salepoint',
  addition_of_godown: 'Addition of Godown',
  deletion_of_godown: 'Deletion of Godown',
  addition_of_person: 'Addition of Person Responsible',
  deletion_of_person: 'Deletion of Person Responsible',
  inclusion_of_form_o: 'Inclusion of Form-O',
};

const SEED_AMENDMENT_TYPES: Record<SeedAmendmentType, string> = {
  change_in_address: 'Change in Address of the Office',
  change_in_name: 'Change in Name of Office',
  inclusion_of_storage: 'Inclusion of Storage',
  deletion_of_storage: 'Deletion of Storage',
  change_of_salepoint: 'Change of Salepoint',
  change_of_person: 'Change of Person Responsible',
  inclusion_of_certificate: 'Inclusion of Certificate of Source of Seeds / Principal Certificate',
  deletion_of_certificate: 'Deletion of Certificate of Source of Seeds / Principal Certificate',
};

const INSECTICIDE_AMENDMENT_TYPES: Record<InsecticideAmendmentType, string> = {
  change_of_firm_name: 'Change of Firm Name',
  change_in_address_salepoint: 'Change in Address of the Salepoint',
  transfer_of_license: 'Transfer Of License',
  inclusion_of_storage: 'Inclusion of Storage premises',
  deletion_of_storage: 'Deletion of Storage premises',
  change_of_expert_staff: 'Change of Expert Staff',
  deletion_of_expert_staff: 'Deletion of Expert Staff',
  change_of_person_responsible: 'Change of Person Responsible For Legal Correspondence',
  inclusion_of_insecticides: 'Inclusion of Insecticides',
  extension_of_lease: 'Extension of Lease Agreement',
};

const FERTILIZER_AMENDMENT_DOCUMENTS = [
  'Request Letter',
  'Godown Rental Agreement',
  'Sale Point Rental Agreement',
  'Details of Person Responsible',
  'Details of Samples Drawn Particulars in the Last 3 Years Along with the Results',
  'Product-wise Sale Particulars for the Last 3 Years',
  'Self Declaration of Non-Conviction',
  'Self Declaration / Proprietorship Declaration',
];

export function LicenseApplicationGenerator() {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [licenseType, setLicenseType] = useState<LicenseType | ''>('');
  const [applicationType, setApplicationType] = useState<ApplicationType | ''>('');
  const [dealerType, setDealerType] = useState<DealerType | ''>('');
  const [areaType, setAreaType] = useState<AreaType | ''>('');
  const [numberOfProducts, setNumberOfProducts] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [division, setDivision] = useState<string>('');
  const [ddoCode, setDdoCode] = useState<string>('');
  const [fertilizerAmendmentType, setFertilizerAmendmentType] = useState<FertilizerAmendmentType | ''>('');
  const [seedAmendmentType, setSeedAmendmentType] = useState<SeedAmendmentType | ''>('');
  const [insecticideAmendmentType, setInsecticideAmendmentType] = useState<InsecticideAmendmentType | ''>('');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Reset application type when license type changes
  React.useEffect(() => {
    setApplicationType('');
    setDealerType('');
    setAreaType('');
    setNumberOfProducts('');
    setDistrict('');
    setDivision('');
    setDdoCode('');
    setFertilizerAmendmentType('');
    setSeedAmendmentType('');
    setInsecticideAmendmentType('');
  }, [licenseType]);

  // Reset amendment type when application type changes
  React.useEffect(() => {
    setFertilizerAmendmentType('');
    setSeedAmendmentType('');
    setInsecticideAmendmentType('');
  }, [applicationType]);

  // Reset division when district changes
  React.useEffect(() => {
    setDivision('');
  }, [district]);

  // Auto-fill DDO code based on district and division
  React.useEffect(() => {
    if (division && district) {
      const divisionDdoCode = DIVISION_DDO_CODES[district]?.[division];
      if (divisionDdoCode) {
        setDdoCode(divisionDdoCode);
      } else {
        const districtDdoCode = DISTRICT_DDO_CODES[district];
        if (districtDdoCode) {
          setDdoCode(districtDdoCode);
        } else {
          setDdoCode(''); // Clear if no code found
        }
      }
    } else if (district) {
      const districtDdoCode = DISTRICT_DDO_CODES[district];
      if (districtDdoCode) {
        setDdoCode(districtDdoCode);
      } else {
        setDdoCode(''); // Clear if no code found
      }
    } else {
      setDdoCode(''); // Clear when district is cleared
    }
  }, [district, division]);

  const showFertilizerAmendmentType = licenseType === 'fertilizer' && applicationType === 'amendment';
  const showSeedAmendmentType = licenseType === 'seed' && applicationType === 'amendment';
  const showInsecticideAmendmentType = licenseType === 'insecticide' && applicationType === 'amendment';
  const showDealerType = licenseType === 'fertilizer';
  const showAreaType = licenseType === 'insecticide';
  const showNumberOfProducts = licenseType === 'insecticide' && areaType !== '' && 
    (applicationType === 'pc_inclusion' || areaType === 'manufacturing_license');
  const showDivision = licenseType === 'fertilizer' && (dealerType === 'retailer' || dealerType === 'coop_societies');
  const showChallanDetails = applicationType !== '' && district !== '' &&
    (showDivision ? division !== '' : true) &&
    (licenseType === 'fertilizer' ? dealerType !== '' : true) &&
    (licenseType === 'insecticide' && (applicationType === 'pc_inclusion' || areaType === 'manufacturing_license') ? areaType !== '' && numberOfProducts !== '' : true) &&
    (licenseType === 'insecticide' && applicationType !== 'pc_inclusion' && areaType !== 'manufacturing_license' ? areaType !== '' : true);
  const showDocuments = false; // Amendment types hidden for now

  const getAmount = () => {
    const isFertilizerWholesaler = licenseType === 'fertilizer' && dealerType === 'wholesaler';
    const isFertilizerCoopSocieties = licenseType === 'fertilizer' && dealerType === 'coop_societies';
    const isFertilizerManufacturingLicense = licenseType === 'fertilizer' && dealerType === 'manufacturing_license';
    
    if (licenseType === 'seed') {
      if (applicationType === 'fresh') return 1000;
      if (applicationType === 'renewal') return 500;
      if (applicationType === 'renewal_grace_period') return 1000;
      if (applicationType === 'amendment') return 50;
      if (applicationType === 'duplicate') return 50;
    }
    
    if (licenseType === 'insecticide') {
      const isMunicipal = areaType === 'municipal';
      const isManufacturingLicense = areaType === 'manufacturing_license';
      
      // Manufacturing License fee structure
      if (isManufacturingLicense) {
        const productCount = numberOfProducts === '10+' ? 10 : parseInt(numberOfProducts) || 0;
        const calculatedAmount = Math.min(productCount * 2000, 20000); // ₹2,000 per product, max ₹20,000
        
        if (applicationType === 'fresh') return calculatedAmount;
        if (applicationType === 'pc_inclusion') return calculatedAmount;
      }
      
      // Existing Urban/Rural fee structure
      const productCount = numberOfProducts === '15+' ? 15 : parseInt(numberOfProducts) || 0;
      
      // Rural areas: 100 per product, 15+ = 1500
      // Municipal areas: 500 per product, 15+ = 7500
      const baseRate = isMunicipal ? 500 : 100;
      const thresholdAmount = isMunicipal ? 7500 : 1500;
      
      if (productCount >= 15) {
        return thresholdAmount;
      }
      
      const calculatedAmount = productCount * baseRate;
      
      if (applicationType === 'fresh') return isMunicipal ? 7500 : 1500;
      if (applicationType === 'renewal') return isMunicipal ? 7500 : 1500;
      if (applicationType === 'amendment') {
        if (insecticideAmendmentType === 'inclusion_of_insecticides') return 1500;
        return 1500;
      }
      if (applicationType === 'pc_inclusion') return calculatedAmount;
      if (applicationType === 'duplicate') return 100;
    }
    
    if (licenseType === 'fertilizer') {
      // Coop. Societies fee structure
      if (isFertilizerCoopSocieties) {
        if (applicationType === 'fresh') return 500;
        if (applicationType === 'renewal') return 500;
        if (applicationType === 'renewal_grace_period') return 1500;
        if (applicationType === 'amendment') return 500;
        if (applicationType === 'duplicate') return 250;
      }
      
      // Manufacturing License fee structure
      if (isFertilizerManufacturingLicense) {
        if (applicationType === 'fresh') return 5000;
        if (applicationType === 'renewal') return 5000;
        if (applicationType === 'renewal_grace_period') return 6000;
        if (applicationType === 'amendment') return 1000;
        if (applicationType === 'duplicate') return 500;
      }
      
      // Existing Wholesaler and Retailer fee structure
      if (applicationType === 'fresh') return isFertilizerWholesaler ? 4500 : 2500;
      if (applicationType === 'renewal') return isFertilizerWholesaler ? 4500 : 2500;
      if (applicationType === 'renewal_grace_period') return isFertilizerWholesaler ? 5500 : 3500;
      if (applicationType === 'amendment') return isFertilizerWholesaler ? 1000 : 500;
      if (applicationType === 'duplicate') return isFertilizerWholesaler ? 500 : 250;
    }
    
    return 0;
  };

  const getChallanHeads = () => {
    if (licenseType === 'insecticide') {
      return {
        majorHead: '0401 (Crop Husbandry)',
        subMajorHead: '00 (Not Applicable)',
        minorHead: '107 (Receipts from Plant Protection Services)',
        groupSubHead: '00 (Not Applicable)',
        subHead: '01 (Receipts from Plant Protection Services)',
      };
    }
    return {
      majorHead: '0401 (Crop Husbandry)',
      subMajorHead: '00',
      minorHead: '800 (Other Receipts)',
      groupSubHead: '00',
      subHead: '81 (Other Receipts)',
    };
  };

  const getChallanCode = () => {
    if (licenseType === 'insecticide') {
      return '0401001070001000000NVN - Receipts from Plant Protection Services';
    }
    return '0401008000081000000NVN - Other Receipts';
  };

  const getChallanCodeOnly = () => {
    const fullCode = getChallanCode();
    return fullCode.split(' - ')[0];
  };

  const handleLicenseTypeChange = (type: LicenseType) => {
    setLicenseType(type);
  };

  const handleApplicationTypeChange = (type: ApplicationType) => {
    setApplicationType(type);
  };

  const handleDealerTypeChange = (type: DealerType) => {
    setDealerType(type);
    if (type !== 'retailer') {
      setDivision(''); // Reset division when not retailer
    }
  };

  const handleAreaTypeChange = (type: AreaType) => {
    setAreaType(type);
    setNumberOfProducts(''); // Reset number of products when area type changes
  };

  const handleNumberOfProductsChange = (value: string) => {
    setNumberOfProducts(value);
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value);
  };

  const handleDivisionChange = (value: string) => {
    setDivision(value);
  };

  const handleFertilizerAmendmentTypeChange = (type: FertilizerAmendmentType) => {
    setFertilizerAmendmentType(type);
  };

  const handleSeedAmendmentTypeChange = (type: SeedAmendmentType) => {
    setSeedAmendmentType(type);
  };

  const handleInsecticideAmendmentTypeChange = (type: InsecticideAmendmentType) => {
    setInsecticideAmendmentType(type);
  };

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`${fieldName} copied successfully`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProceedToChallan = () => {
    setShowModal(true);
  };

  const handleConfirmProceed = () => {
    setShowModal(false);
    // Open external portal - preserve existing functionality
    window.open('https://ifmis.telangana.gov.in/echallan', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-4 pb-28 sm:p-6 sm:pb-24">
      <div className="mx-auto w-full max-w-5xl">
        {/* Hero / Title Card */}
        <div className="mb-6">
          <div className="rounded-2xl p-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #4F6FBF 0%, #5B6FC7 45%, #7B61C9 100%)', boxShadow: '0 4px 12px rgba(70, 80, 150, 0.15)' }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/20 shadow-sm ring-1 ring-white/30">
                  <ReceiptText className="h-6 w-6 text-white" aria-label="License Services" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">
                    {t('Officer Toolkit', 'ఆఫీసర్ టూల్‌కిట్')}
                  </p>
                  <h1 className="text-xl font-black text-white">
                    {t('License Services', 'లైసెన్స్ సేవలు')}
                  </h1>
                  <p className="text-sm font-semibold text-white/90">
                    {t('Challan Details', 'చలాన్ వివరాలు')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/officer-toolkit')}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm font-black text-white shadow-sm transition hover:bg-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('Back', 'వెనుకకు')}
              </button>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
            <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg dark:bg-white dark:text-slate-900">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              {toast.message}
            </div>
          </div>
        )}

        {/* License Details Card */}
        <div className="mb-6 rounded-2xl border border-slate-200/50 bg-white/95 p-5 shadow-xl dark:border-slate-800/50 dark:bg-slate-900/95">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                License Details
              </h2>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Select license type, dealer type, application type and district
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* License Type */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                License Type
              </label>
              <div className="relative">
                <select
                  value={licenseType}
                  onChange={(e) => handleLicenseTypeChange(e.target.value as LicenseType)}
                  className="w-full appearance-none rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 pl-11 text-sm font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-900/30"
                >
                  <option value="">Select License Type</option>
                  <option value="fertilizer">Fertilizer</option>
                  <option value="seed">Seed</option>
                  <option value="insecticide">Pesticide</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Sprout className="h-5 w-5" />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* Dealer Type - Segmented Control */}
            {showDealerType && (
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Dealer Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'retailer', label: 'Retailer' },
                    { value: 'wholesaler', label: 'Wholesaler' },
                    { value: 'coop_societies', label: 'Coop. Societies' },
                    { value: 'manufacturing_license', label: 'Manufacturing License' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleDealerTypeChange(option.value as DealerType)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        dealerType === option.value
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Store className="h-4 w-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Application Type - Segmented Control */}
            {licenseType && (
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Application Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'fresh', label: 'Fresh' },
                    { value: 'renewal', label: 'Renewal' },
                    { value: 'renewal_grace_period', label: 'Renewal (Grace Period)' },
                    { value: 'amendment', label: 'Amendment' },
                    { value: 'duplicate', label: 'Duplicate' },
                    { value: 'pc_inclusion', label: 'PC Inclusion' }
                  ].filter(option => {
                    // Filter options based on license type
                    if (licenseType === 'insecticide') {
                      return ['fresh', 'renewal', 'renewal_grace_period', 'amendment', 'duplicate', 'pc_inclusion'].includes(option.value);
                    }
                    return ['fresh', 'renewal', 'renewal_grace_period', 'amendment', 'duplicate'].includes(option.value);
                  }).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleApplicationTypeChange(option.value as ApplicationType)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        applicationType === option.value
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                      }`}
                    >
                      <ClipboardList className="h-4 w-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Area Type - Segmented Control for Insecticide */}
            {showAreaType && (
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Area Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'municipal', label: 'Urban Areas' },
                    { value: 'rural', label: 'Rural Areas' },
                    { value: 'manufacturing_license', label: 'Manufacturing License' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAreaTypeChange(option.value as AreaType)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        areaType === option.value
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* District */}
            {licenseType && (
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  District
                </label>
                <div className="relative">
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 pl-11 text-sm font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-900/30"
                  >
                    <option value="">Select District</option>
                    {TELANGANA_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>
              </div>
            )}

            {/* Division */}
            {showDivision && (
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Division
                </label>
                <div className="relative">
                  <select
                    value={division}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 pl-11 text-sm font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-900/30"
                  >
                    <option value="">Select Division</option>
                    {getDivisionsForDistrict(district).map((div) => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>
              </div>
            )}

            {/* Number of Products for Insecticide */}
            {showNumberOfProducts && (
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Number of Products
                </label>
                <input
                  type="number"
                  value={numberOfProducts}
                  onChange={(e) => handleNumberOfProductsChange(e.target.value)}
                  min="1"
                  className="w-full rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-900/30"
                  placeholder="Enter number of products"
                />
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {!showChallanDetails && (
          <div className="mb-6 rounded-2xl border border-slate-200/50 bg-white/95 p-8 text-center shadow-xl dark:border-slate-800/50 dark:bg-slate-900/95">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <ClipboardList className="h-8 w-8 text-slate-400 dark:text-slate-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
              Select License Details
            </h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Choose the required license details to view the applicable challan information.
            </p>
          </div>
        )}

        {/* Challan Details Section */}
        {showChallanDetails && (
          <div className="mb-6 rounded-2xl border border-slate-200/50 bg-white/95 p-5 shadow-xl dark:border-slate-800/50 dark:bg-slate-900/95">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #5B7DBF 0%, #6879C4 50%, #806BC4 100%)' }}>
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Challan Details
                  </h2>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Use the following details for challan entry in the treasury portal
                  </p>
                </div>
              </div>
            </div>

            {/* Challan Code Card */}
            <div className="mb-4 rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-800/50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <div className="mb-2 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Challan Code
                </h3>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {getChallanCode()}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(getChallanCodeOnly(), 'Challan Code')}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200/50 bg-white/80 px-3 py-2 text-sm font-semibold text-blue-600 shadow-sm transition-all hover:bg-blue-50 dark:border-blue-800/50 dark:bg-slate-800/80 dark:text-blue-400 dark:hover:bg-blue-900/30"
                >
                  {copiedField === 'Challan Code' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* DDO Code Card */}
            <div className="mb-6 rounded-xl border border-slate-200/50 bg-white p-4 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
              <div className="mb-2 flex items-center gap-2">
                <Landmark className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  DDO Code
                </h3>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                    {ddoCode}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(ddoCode, 'DDO Code')}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200/50 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-200 dark:border-slate-800/50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  {copiedField === 'DDO Code' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Accounting Details */}
            <div className="mb-4">
              <div className="mb-3 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Accounting Details
                </h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Major Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {getChallanHeads().majorHead.split(' ')[0]}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {getChallanHeads().majorHead.split(' ').slice(1).join(' ')}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Sub Major Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {getChallanHeads().subMajorHead}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Minor Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {getChallanHeads().minorHead.split(' ')[0]}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {getChallanHeads().minorHead.split(' ').slice(1).join(' ')}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Group Sub Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {getChallanHeads().groupSubHead}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Sub Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {getChallanHeads().subHead.split(' ')[0]}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {getChallanHeads().subHead.split(' ').slice(1).join(' ')}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Detailed Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    000
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Sub Detailed Head</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    000
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Non-Plan/Plan</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    N
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Voted/Charged</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    V
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/50 bg-white p-2.5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 dark:bg-blue-950/30">
                      <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Non-Contingency/Contingency</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    N
                  </p>
                </div>
              </div>
            </div>

            {/* Applicable Fee Section */}
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Applicable Fee
                </h3>
              </div>
              <p className="mb-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                Fee automatically calculated based on your selection
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-green-50 p-5 shadow-sm dark:border-emerald-800/50 dark:from-emerald-950/30 dark:to-green-950/30">
                  <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    Amount (₹)
                  </p>
                  <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                    ₹ {getAmount().toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/50 bg-white p-5 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
                  <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    Fee Details
                  </p>
                  <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">
                    {licenseType === 'fertilizer' ? 'Fertilizer' : licenseType === 'seed' ? 'Seed' : 'Pesticide'}
                    {showDealerType && dealerType && ` • ${dealerType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                    {applicationType && ` • ${applicationType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    The above fee is applicable for your selected license type, dealer type and application type.
                  </p>
                </div>
              </div>
            </div>

            {/* Proceed Button */}
            <button
              onClick={handleProceedToChallan}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
              style={{ minHeight: '52px' }}
            >
              <ExternalLink className="h-5 w-5" />
              <span>Proceed to Challan Entry</span>
            </button>

            {/* Info Message */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-200/50 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/30">
              <Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                You will be redirected to the external Challan Entry Portal. Please use the challan details displayed above while entering the information.
              </p>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200/50 bg-white p-6 shadow-2xl dark:border-slate-800/50 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <ExternalLink className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Proceed to Challan Entry?
                </h3>
              </div>
              <p className="mb-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                You will be redirected to the external portal. Please use the challan details displayed above while entering the information.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-slate-200/50 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 dark:border-slate-800/50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmProceed}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Proceed</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Amendment Type Selections - Hidden for now */}
        {showFertilizerAmendmentType && (
          <div className={`mb-4 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="mb-2">
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Fertilizer Amendment Type
              </h3>
            </div>
            <div className="w-full max-w-md">
              <select
                value={fertilizerAmendmentType}
                onChange={(e) => handleFertilizerAmendmentTypeChange(e.target.value as FertilizerAmendmentType)}
                className="w-full rounded-2xl border border-teal-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:border-teal-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-teal-900/30"
              >
                <option value="">Amendment Type</option>
                {Object.entries(FERTILIZER_AMENDMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Seed Amendment Type Selection - Hidden for now */}
        {showSeedAmendmentType && (
          <div className={`mb-4 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="mb-2">
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Seed Amendment Type
              </h3>
            </div>
            <div className="w-full max-w-md">
              <select
                value={seedAmendmentType}
                onChange={(e) => handleSeedAmendmentTypeChange(e.target.value as SeedAmendmentType)}
                className="w-full rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-900/30"
              >
                <option value="">Amendment Type</option>
                {Object.entries(SEED_AMENDMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Insecticide Amendment Type Selection - Hidden for now */}
        {showInsecticideAmendmentType && (
          <div className={`mb-4 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="mb-2">
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Insecticide Amendment Type
              </h3>
            </div>
            <div className="w-full max-w-md">
              <select
                value={insecticideAmendmentType}
                onChange={(e) => handleInsecticideAmendmentTypeChange(e.target.value as InsecticideAmendmentType)}
                className="w-full rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-900/30"
              >
                <option value="">Amendment Type</option>
                {Object.entries(INSECTICIDE_AMENDMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
