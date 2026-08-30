import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { BackButton } from '../components/ui/BackButton';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { Phone, Search, User, Building2, MapPin, Filter } from 'lucide-react';
import { TELANGANA_DISTRICTS } from '../data/telanganaDistrictMandalData';
import { supabase } from '../lib/supabase';

type OfficerType = 'AEO' | 'MAO' | 'ADA' | 'DAO';

interface OfficerContact {
  id: string;
  officer_type: OfficerType;
  name: string | null;
  district: string;
  division: string | null;
  mandal: string | null;
  cluster: string | null;
  phone: string;
  email: string | null;
  active: boolean;
}

interface TabConfig {
  id: OfficerType;
  label: string;
  icon: React.ElementType;
  teluguLabel: string;
}

const TABS: TabConfig[] = [
  { id: 'AEO', label: 'AEO', icon: User, teluguLabel: 'ఏఈఓ' },
  { id: 'MAO', label: 'MAO', icon: User, teluguLabel: 'ఎంఏఓ' },
  { id: 'ADA', label: 'ADA', icon: Building2, teluguLabel: 'ఏడీఏ' },
  { id: 'DAO', label: 'DAO', icon: Building2, teluguLabel: 'డీఏఓ' },
];

// District to Division mapping (from LicenseApplicationGenerator)
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

function getDivisionsForDistrict(district: string): string[] {
  return DISTRICT_DIVISION_MAPPING[district] || [];
}

export function OfficerContacts() {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<OfficerType>('AEO');
  const [contacts, setContacts] = useState<OfficerContact[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadContacts();
  }, [activeTab]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('officer_contacts')
        .select('*')
        .eq('officer_type', activeTab)
        .eq('active', true);

      const { data, error } = await query;
      
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredContacts = () => {
    return contacts.filter(contact => {
      const matchesSearch = searchQuery === '' || 
        contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery) ||
        contact.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.division?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.mandal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.cluster?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDistrict = selectedDistrict === '' || contact.district.toLowerCase() === selectedDistrict.toLowerCase();
      const matchesDivision = selectedDivision === '' || contact.division?.toLowerCase() === selectedDivision.toLowerCase();
      const matchesMandal = selectedMandal === '' || contact.mandal?.toLowerCase() === selectedMandal.toLowerCase();
      const matchesCluster = selectedCluster === '' || contact.cluster?.toLowerCase() === selectedCluster.toLowerCase();

      return matchesSearch && matchesDistrict && matchesDivision && matchesMandal && matchesCluster;
    });
  };

  const filteredContacts = getFilteredContacts();
  const uniqueDistricts = Array.from(new Set(contacts.map(c => c.district))).sort();
  const uniqueDivisions = selectedDistrict ? Array.from(new Set(contacts.filter(c => c.district === selectedDistrict).map(c => c.division).filter(Boolean))).sort() : [];
  const uniqueMandals = selectedDistrict ? Array.from(new Set(contacts.filter(c => c.district === selectedDistrict).map(c => c.mandal).filter(Boolean))).sort() : [];
  const uniqueClusters = selectedMandal ? Array.from(new Set(contacts.filter(c => c.mandal === selectedMandal).map(c => c.cluster).filter(Boolean))).sort() : [];

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('');
    setSelectedDivision('');
    setSelectedMandal('');
    setSelectedCluster('');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const renderContactCard = (contact: OfficerContact) => {
    const TabIcon = TABS.find(tab => tab.id === activeTab)?.icon || User;
    
    return (
      <div key={ contact.id } className="rounded-2xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-5 shadow-lg dark:border-emerald-800/50 dark:bg-slate-900/80">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <TabIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            {contact.name && (
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {contact.name}
              </h3>
            )}
            {!contact.name && activeTab === 'ADA' && (
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Assistant Director of Agriculture
              </h3>
            )}
            {!contact.name && activeTab === 'DAO' && (
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                District Agriculture Officer
              </h3>
            )}
            
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <MapPin className="h-3.5 w-3.5" />
                <span className="font-medium">{contact.district}</span>
              </div>
              {contact.division && (
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Division: {contact.division}
                </div>
              )}
              {contact.mandal && (
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Mandal: {contact.mandal}
                </div>
              )}
              {contact.cluster && (
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Cluster: {contact.cluster}
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                <Phone className="h-4 w-4" />
                <span>{contact.phone}</span>
              </div>
              <button
                onClick={() => handleCall(contact.phone)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                <Phone className="h-4 w-4" />
                <span>Call</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFilters = () => {
    const showDivision = activeTab === 'MAO' || activeTab === 'ADA';
    const showMandal = activeTab === 'AEO' || activeTab === 'MAO';
    const showCluster = activeTab === 'AEO';

    return (
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-emerald-200/50 bg-white/80 pl-12 pr-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-emerald-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-emerald-900/30"
          />
        </div>

        {/* Filter Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* District Filter */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedDivision('');
                setSelectedMandal('');
                setSelectedCluster('');
              }}
              className="w-full rounded-2xl border border-emerald-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-emerald-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-emerald-900/30"
            >
              <option value="">Select District</option>
              {uniqueDistricts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          {/* Division Filter */}
          {showDivision && (
            <div>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                disabled={!selectedDistrict}
                className="w-full rounded-2xl border border-emerald-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:opacity-50 dark:border-emerald-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-emerald-900/30"
              >
                <option value="">Select Division</option>
                {uniqueDivisions.map(division => (
                  <option key={division} value={division}>{division}</option>
                ))}
              </select>
            </div>
          )}

          {/* Mandal Filter */}
          {showMandal && (
            <div>
              <select
                value={selectedMandal}
                onChange={(e) => {
                  setSelectedMandal(e.target.value);
                  setSelectedCluster('');
                }}
                disabled={!selectedDistrict}
                className="w-full rounded-2xl border border-emerald-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:opacity-50 dark:border-emerald-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-emerald-900/30"
              >
                <option value="">Select Mandal</option>
                {uniqueMandals.map(mandal => (
                  <option key={mandal} value={mandal}>{mandal}</option>
                ))}
              </select>
            </div>
          )}

          {/* Cluster Filter */}
          {showCluster && (
            <div>
              <select
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
                disabled={!selectedMandal}
                className="w-full rounded-2xl border border-emerald-200/50 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:opacity-50 dark:border-emerald-800/50 dark:bg-slate-900/80 dark:text-white dark:focus:ring-emerald-900/30"
              >
                <option value="">Select Cluster</option>
                {uniqueClusters.map(cluster => (
                  <option key={cluster} value={cluster}>{cluster}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Reset Filters */}
        {(selectedDistrict || selectedDivision || selectedMandal || selectedCluster || searchQuery) && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            <Filter className="h-4 w-4" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950 dark:to-teal-950">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="rounded-3xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-6 shadow-xl dark:border-emerald-800/50 dark:bg-slate-900/80">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                  <User className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                    Officer Contacts
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Telangana Agriculture Department
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

        {/* Tabs */}
        <div className={`mb-6 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    resetFilters();
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl border px-5 py-3 text-base font-bold transition-all ${
                    activeTab === tab.id
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg dark:border-emerald-400'
                      : 'border-emerald-200/50 bg-white/80 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-800/50 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  <TabIcon className="h-5 w-5" />
                  <span>{language === 'te' ? tab.teluguLabel : tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        {renderFilters()}

        {/* Results Count */}
        <div className={`mb-4 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {loading ? 'Loading...' : `Showing ${filteredContacts.length} ${activeTab} contact${filteredContacts.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Contact Cards */}
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {loading ? (
            <div className="col-span-full py-12 text-center">
              <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">
                Loading contacts...
              </div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Search className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No contacts found
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                Try changing your filters or search.
              </p>
            </div>
          ) : (
            filteredContacts.map(renderContactCard)
          )}
        </div>
      </div>
    </div>
  );
}
