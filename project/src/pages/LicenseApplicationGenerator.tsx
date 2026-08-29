import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { BackButton } from '../components/ui/BackButton';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { FileText, ChevronRight, CheckCircle, FileText as FileIcon } from 'lucide-react';
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
  'Medchal-Malkajgiri': ['Malkajgiri', 'Medchal'],
  'Mulugu': ['Eturnagaram', 'Mulugu'],
  'Nagarkurnool': ['Achampet', 'Kalwakurthy', 'Kollapur', 'Nagarkurnool'],
  'Nalgonda': ['Anumula', 'Devarakonda', 'Miryalaguda', 'Munugode', 'Nakrekal', 'Nalgonda'],
  'Narayanpet': ['Kosgi', 'Makthal', 'Narayanpet'],
  'Nirmal': ['Bhainsa', 'Khanapur', 'Mudhole', 'Nirmal'],
  'Nizamabad': ['Armoor', 'Balkonda', 'Bheemgal', 'Bodhan', 'Indalwai', 'Nizamabad Rural', 'Nizamabad South', 'Rudrur'],
  'Peddapalli': ['Manthani', 'Peddapalle', 'Ramagundam'],
  'Rajanna Sircilla': ['Sircilla', 'Vemulawada'],
  'Rangareddy': ['Amangal', 'Chevella', 'Ibrahimpatnam', 'Maheshwaram', 'Rajendranagar', 'Shadnagar'],
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
  'Mahabubnagar': '22010102001',
};

const DIVISION_DDO_CODES: Record<string, Record<string, string>> = {
  'Mahabubnagar': {
    'Mahabubnagar Rural': '22010102002',
  },
};

function getDivisionsForDistrict(district: string): string[] {
  return DISTRICT_DIVISION_MAPPING[district] || [];
}

type LicenseType = 'fertilizer' | 'seed' | 'insecticide';
type ApplicationType = 'fresh' | 'renewal' | 'renewal_grace_period' | 'amendment' | 'duplicate' | 'pc_inclusion';
type DealerType = 'wholesaler' | 'retailer';
type AreaType = 'municipal' | 'rural';

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

  const [licenseType, setLicenseType] = useState<LicenseType | ''>('');
  const [applicationType, setApplicationType] = useState<ApplicationType | ''>('');
  const [dealerType, setDealerType] = useState<DealerType | ''>('');
  const [areaType, setAreaType] = useState<AreaType | ''>('');
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
        }
      }
    } else if (district) {
      const districtDdoCode = DISTRICT_DDO_CODES[district];
      if (districtDdoCode) {
        setDdoCode(districtDdoCode);
      }
    }
  }, [district, division]);

  const showFertilizerAmendmentType = licenseType === 'fertilizer' && applicationType === 'amendment';
  const showSeedAmendmentType = licenseType === 'seed' && applicationType === 'amendment';
  const showInsecticideAmendmentType = licenseType === 'insecticide' && applicationType === 'amendment';
  const showDealerType = licenseType === 'fertilizer';
  const showAreaType = licenseType === 'insecticide';
  const showDivision = licenseType === 'fertilizer' && dealerType === 'retailer';
  const showChallanDetails = applicationType !== '' && district !== '' && 
    (showDivision ? division !== '' : true) &&
    (licenseType === 'fertilizer' ? dealerType !== '' : true) && 
    (licenseType === 'insecticide' ? areaType !== '' : true);
  const showDocuments = false; // Amendment types hidden for now

  const getAmount = () => {
    const isFertilizerWholesaler = licenseType === 'fertilizer' && dealerType === 'wholesaler';
    
    if (licenseType === 'seed') {
      if (applicationType === 'fresh') return 1000;
      if (applicationType === 'renewal') return 1000;
      if (applicationType === 'renewal_grace_period') return 1000;
      if (applicationType === 'amendment') return 500;
    }
    
    if (licenseType === 'insecticide') {
      const isMunicipal = areaType === 'municipal';
      
      if (applicationType === 'fresh') return isMunicipal ? 7500 : 1500;
      if (applicationType === 'renewal') return isMunicipal ? 7500 : 1500;
      if (applicationType === 'amendment') {
        if (insecticideAmendmentType === 'inclusion_of_insecticides') return isMunicipal ? 7500 : 1500;
        return isMunicipal ? 7500 : 1500;
      }
      if (applicationType === 'pc_inclusion') return isMunicipal ? 7500 : 1500;
    }
    
    if (licenseType === 'fertilizer') {
      if (applicationType === 'fresh') return isFertilizerWholesaler ? 4500 : 2500;
      if (applicationType === 'renewal') return 2500;
      if (applicationType === 'renewal_grace_period') return isFertilizerWholesaler ? 5500 : 3500;
      if (applicationType === 'amendment') return isFertilizerWholesaler ? 1000 : 500;
      if (applicationType === 'duplicate') return 500;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-slate-950 dark:via-violet-950 dark:to-purple-950">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-violet-400/10 blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 h-96 w-96 rounded-full bg-purple-400/10 blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/3 h-80 w-80 rounded-full bg-fuchsia-400/10 blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="rounded-3xl border border-violet-200/50 bg-white/80 backdrop-blur-sm p-6 shadow-xl dark:border-violet-800/50 dark:bg-slate-900/80">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                    License Application & Form Generator
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Fertilizer • Seed • Insecticide
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <LanguageToggle language={language} onClick={toggleLanguage} />
                <BackButton onClick={() => navigate('/officer-toolkit')}>
                  <span>Back</span>
                </BackButton>
              </div>
            </div>
          </div>
        </div>

        {/* License Type Selection */}
        <div className={`mb-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Select License Type
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { type: 'fertilizer' as LicenseType, label: 'Fertilizer', gradient: 'from-emerald-500 to-green-600', bgGradient: 'from-emerald-50 to-green-50', border: 'emerald', checkColor: 'emerald' },
              { type: 'seed' as LicenseType, label: 'Seed', gradient: 'from-amber-500 to-orange-600', bgGradient: 'from-amber-50 to-orange-50', border: 'amber', checkColor: 'amber' },
              { type: 'insecticide' as LicenseType, label: 'Insecticide / Pesticide', gradient: 'from-red-500 to-rose-600', bgGradient: 'from-red-50 to-rose-50', border: 'red', checkColor: 'red' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => handleLicenseTypeChange(item.type)}
                className={`relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300 hover:scale-105 ${
                  licenseType === item.type
                    ? `border-${item.border}-500 bg-gradient-to-br ${item.bgGradient} shadow-xl dark:border-${item.border}-400 dark:from-${item.border}-950/30 dark:to-${item.border}-950/30`
                    : `border-${item.border}-200/50 bg-white/80 backdrop-blur-sm hover:border-${item.border}-400 hover:shadow-lg dark:border-${item.border}-800/50 dark:bg-slate-900/80`
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900 dark:text-white">{item.label}</span>
                  {licenseType === item.type && (
                    <CheckCircle className={`h-5 w-5 text-${item.checkColor}-600 dark:text-${item.checkColor}-400`} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selection Fields Container */}
        {(showDealerType || showAreaType || showDivision || licenseType) && (
          <div className={`mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            
            {/* Dealer Type Selection */}
            {showDealerType && (
              <div>
                <div className="mb-2">
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                    Dealer Type
                  </h3>
                </div>
                <select
                  value={dealerType}
                  onChange={(e) => handleDealerTypeChange(e.target.value as DealerType)}
                  className="w-full rounded-2xl border border-violet-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-violet-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-violet-900/30"
                >
                  <option value="">Dealer Type</option>
                  <option value="wholesaler">Wholesaler</option>
                  <option value="retailer">Retailer</option>
                </select>
              </div>
            )}

            {/* Area Type Selection */}
            {showAreaType && (
              <div>
                <div className="mb-2">
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                    Area Type
                  </h3>
                </div>
                <select
                  value={areaType}
                  onChange={(e) => handleAreaTypeChange(e.target.value as AreaType)}
                  className="w-full rounded-2xl border border-violet-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-violet-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-violet-900/30"
                >
                  <option value="">Area Type</option>
                  <option value="municipal">Municipal Areas</option>
                  <option value="rural">Rural Areas</option>
                </select>
              </div>
            )}

            {/* Application Type Selection */}
            {licenseType && (
              <div>
                <div className="mb-2">
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                    Application Type
                  </h3>
                </div>
                <select
                  value={applicationType}
                  onChange={(e) => handleApplicationTypeChange(e.target.value as ApplicationType)}
                  className="w-full rounded-2xl border border-violet-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-violet-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-violet-900/30"
                >
                  <option value="">Application Type</option>
                  <option value="fresh">Fresh</option>
                  {licenseType !== 'insecticide' && <option value="renewal">Renewal</option>}
                  {licenseType !== 'insecticide' && <option value="renewal_grace_period">Renewal within Grace Period</option>}
                  <option value="amendment">Amendment</option>
                  {licenseType === 'fertilizer' && <option value="duplicate">Duplicate Copy</option>}
                  {licenseType === 'insecticide' && <option value="pc_inclusion">PC Inclusion</option>}
                </select>
              </div>
            )}

            {/* District Selection */}
            {licenseType && (
              <div>
                <div className="mb-2">
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                    District
                  </h3>
                </div>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full rounded-2xl border border-violet-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-violet-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-violet-900/30"
                >
                  <option value="">District</option>
                  {TELANGANA_DISTRICTS.map((districtName) => (
                    <option key={districtName} value={districtName}>{districtName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Division Selection */}
            {showDivision && (
              <div>
                <div className="mb-2">
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                    Division
                  </h3>
                </div>
                <select
                  value={division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full rounded-2xl border border-violet-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-violet-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-violet-900/30"
                >
                  <option value="">Division</option>
                  {getDivisionsForDistrict(district).map((divisionName) => (
                    <option key={divisionName} value={divisionName}>{divisionName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Challan Details Section */}
        {showChallanDetails && (
          <div className={`mb-8 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Challan Details
              </h2>
            </div>
            <div className="rounded-2xl border border-violet-200/50 bg-white/80 backdrop-blur-sm p-6 shadow-xl dark:border-violet-800/50 dark:bg-slate-900/80">
              <div className="mb-4 flex justify-between items-start">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">DDO CODE</label>
                  <input
                    type="text"
                    value={ddoCode}
                    onChange={(e) => setDdoCode(e.target.value)}
                    placeholder="Enter DDO Code"
                    className="w-full rounded-xl border border-violet-200/50 bg-white/80 px-4 py-3 text-base font-bold text-slate-900 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-violet-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-violet-900/30"
                  />
                </div>
                <div className="ml-4 text-right">
                  <div className="text-xs font-bold text-green-600 dark:text-green-400 mb-1">Challan Code</div>
                  <div className="text-sm font-mono font-bold text-red-600 dark:text-red-400 bg-violet-50/50 dark:bg-violet-950/30 px-3 py-2 rounded-lg border border-violet-200/50 dark:border-violet-800/50">
                    {getChallanCode()}
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Major Head</label>
                  <div className="rounded-xl border border-violet-200/50 bg-violet-50/50 px-4 py-2 text-sm font-bold text-slate-900 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-white">
                    {getChallanHeads().majorHead}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Sub Major Head</label>
                  <div className="rounded-xl border border-violet-200/50 bg-violet-50/50 px-4 py-2 text-sm font-bold text-slate-900 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-white">
                    {getChallanHeads().subMajorHead}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Minor Head</label>
                  <div className="rounded-xl border border-violet-200/50 bg-violet-50/50 px-4 py-2 text-sm font-bold text-slate-900 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-white">
                    {getChallanHeads().minorHead}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Group Sub Head</label>
                  <div className="rounded-xl border border-violet-200/50 bg-violet-50/50 px-4 py-2 text-sm font-bold text-slate-900 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-white">
                    {getChallanHeads().groupSubHead}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Sub Head</label>
                  <div className="rounded-xl border border-violet-200/50 bg-violet-50/50 px-4 py-2 text-sm font-bold text-slate-900 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-white">
                    {getChallanHeads().subHead}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Detailed Head</label>
                  <div className="rounded-xl border border-violet-200/50 bg-violet-50/50 px-4 py-2 text-sm font-bold text-slate-900 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-white">
                    000
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Sub Detailed Head</label>
                  <div className="rounded-xl border border-violet-200/50 bg-violet-50/50 px-4 py-2 text-sm font-bold text-slate-900 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-white">
                    000
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Non-Plan/Plan</label>
                  <div className="rounded-xl border border-violet-200/50 bg-violet-50/50 px-4 py-2 text-sm font-bold text-slate-900 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-white">
                    N
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Voted/Charged</label>
                  <div className="rounded-xl border border-violet-200/50 bg-violet-50/50 px-4 py-2 text-sm font-bold text-slate-900 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-white">
                    V
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Non-Contingency/Contingency</label>
                  <div className="rounded-xl border border-violet-200/50 bg-violet-50/50 px-4 py-2 text-sm font-bold text-slate-900 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-white">
                    N
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Amount (₹)</label>
                  <div className="rounded-xl border border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50 px-4 py-2 text-lg font-black text-violet-700 dark:border-violet-400 dark:from-violet-950/30 dark:to-purple-950/30 dark:text-violet-300">
                    {getAmount()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fertilizer Amendment Type Selection - Hidden for now */}
        {/* {showFertilizerAmendmentType && (
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
                className="w-full rounded-2xl border border-violet-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-violet-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-violet-900/30"
              >
                <option value="">Amendment Type</option>
                {Object.entries(FERTILIZER_AMENDMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )} */}

        {/* Seed Amendment Type Selection - Hidden for now */}
        {/* {showSeedAmendmentType && (
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
                className="w-full rounded-2xl border border-violet-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-violet-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-violet-900/30"
              >
                <option value="">Amendment Type</option>
                {Object.entries(SEED_AMENDMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )} */}

        {/* Insecticide Amendment Type Selection - Hidden for now */}
        {/* {showInsecticideAmendmentType && (
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
                className="w-full rounded-2xl border border-violet-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-violet-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-violet-900/30"
              >
                <option value="">Amendment Type</option>
                {Object.entries(INSECTICIDE_AMENDMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )} */}

        {/* Required Documents Section - Hidden for now */}
        {/* {showDocuments && (
          <div className={`transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <FileIcon className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Required Documents
              </h2>
            </div>
            <div className="rounded-2xl border border-violet-200/50 bg-white/80 backdrop-blur-sm p-6 shadow-xl dark:border-violet-800/50 dark:bg-slate-900/80">
              <ul className="space-y-3">
                {FERTILIZER_AMENDMENT_DOCUMENTS.map((doc, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <ChevronRight className="h-5 w-5 shrink-0 mt-0.5 text-violet-600 dark:text-violet-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
