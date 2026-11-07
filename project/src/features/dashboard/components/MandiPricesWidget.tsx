import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { useAuth } from '../../../shared/context/AuthContext';
import {
  ALL_ANDHRA_PRADESH_DISTRICTS,
  ALL_INDIAN_STATES,
  ALL_TELANGANA_DISTRICTS,
  buildMandiWhatsAppText,
  deleteCustomMandiPrice,
  fetchMandiPrices,
  getCommodityMSP,
  invalidateMandiPricesCache,
  MandiPriceRecord,
  saveCustomMandiPrice,
} from '../services/mandiPrices';
import { detectUserLocation, resolveUserLocation, UserLocation } from '../services/userLocation';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export function MandiPricesWidget() {
  const { t } = useLanguage();
  const { isAdminUser } = useAuth();

  const [selectedState, setSelectedState] = useState<string>('Telangana');
  const [records, setRecords] = useState<MandiPriceRecord[]>([]);
  const [source, setSource] = useState<'ogd-live' | 'agmarknet-verified'>('agmarknet-verified');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<UserLocation>(() => resolveUserLocation());
  const locationRef = useRef(location);
  locationRef.current = location;

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [commodityFilter, setCommodityFilter] = useState('');
  const [localOnly, setLocalOnly] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100);

  // Officer Update Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [modalForm, setModalForm] = useState({
    district: 'Kumram Bheem Asifabad',
    market: 'Asifabad AMC',
    commodity: 'Cotton',
    variety: 'Long Staple',
    min_price: '',
    max_price: '',
    modal_price: '',
    arrival_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  });

  const loadPrices = useCallback(async (isManual = false, stateOverride?: string) => {
    if (isManual) {
      setRefreshing(true);
      invalidateMandiPricesCache();
    }
    const stateToFetch = stateOverride ?? selectedState;
    try {
      const result = await fetchMandiPrices({
        state: stateToFetch,
        limit: 250,
        bypass_cache: isManual,
      });
      setRecords(result?.records ?? []);
      setSource(result?.source ?? 'agmarknet-verified');
    } catch (err) {
      console.error('Error fetching mandi prices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedState]);

  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    setDistrictFilter('');
    setCommodityFilter('');
    setLocalOnly(false);
    setLiveOnly(false);
    setLoading(true);
    loadPrices(false, newState);
  };

  useEffect(() => {
    loadPrices();
    detectUserLocation().then((loc) => {
      setLocation(loc);
    });
    const interval = setInterval(() => loadPrices(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadPrices]);

  // Comprehensive District List for selected State
  const districts = useMemo(() => {
    let officialList: string[] = [];
    if (selectedState === 'Telangana') {
      officialList = ALL_TELANGANA_DISTRICTS;
    } else if (selectedState === 'Andhra Pradesh') {
      officialList = ALL_ANDHRA_PRADESH_DISTRICTS;
    }

    const fromRecords = records
      .filter((r) => r.state.toLowerCase() === selectedState.toLowerCase())
      .map((r) => r.district)
      .filter(Boolean);

    // Merge official state districts and any active district names from live records
    const combined = [...new Set([...officialList, ...fromRecords])].sort((a, b) =>
      a.localeCompare(b)
    );
    return combined;
  }, [selectedState, records]);

  const commodities = useMemo(() => {
    const list = [...new Set(records.map((r) => r.commodity).filter(Boolean))].sort();
    return list;
  }, [records]);

  // Latest arrival date formatted
  const latestDate = useMemo(() => {
    let latest = '';
    for (const r of records) {
      const iso = arrivalToIso(r.arrival_date);
      if (iso > latest) latest = iso;
    }
    return latest;
  }, [records]);

  // Top highlight cards data (Cotton, Paddy, Red Gram, Soya Bean)
  const highlights = useMemo(() => {
    const findTopModal = (cropName: string) => {
      const matches = records.filter((r) =>
        r.commodity.toLowerCase().includes(cropName.toLowerCase())
      );
      if (!matches.length) return null;
      // Prefer:
      // 1. Local live arrival
      // 2. Any live arrival in the state (e.g. Bhadrachalam Cotton today)
      // 3. Local indicative benchmark (e.g. Asifabad Cotton)
      // 4. Any match
      const localLive = matches.find((m) => m.isLocal && !m.isIndicative && m.arrival_date);
      const anyLive = matches.find((m) => !m.isIndicative && m.arrival_date);
      const local = matches.find((m) => m.isLocal);
      const chosen = localLive || anyLive || local || matches[0];
      const mspInfo = getCommodityMSP(chosen.commodity);
      return {
        ...chosen,
        msp: mspInfo?.msp,
        bonus: mspInfo?.bonus,
      };
    };

    const cards = [
      { key: 'cotton', title: t('Cotton (Kapas)', 'పత్తి (కపాస్)'), data: findTopModal('Cotton'), emoji: '🌱' },
      { key: 'paddy', title: t('Paddy (Grade A)', 'వరి (గ్రేడ్-ఎ)'), data: findTopModal('Paddy'), emoji: '🌾' },
      { key: 'jowar', title: t('Jowar (Sorghum)', 'జొన్నలు'), data: findTopModal('Jowar'), emoji: '🌾' },
      { key: 'redgram', title: t('Red Gram (Tur)', 'కంది (తూర్)'), data: findTopModal('Red Gram'), emoji: '🫘' },
      { key: 'soyabean', title: t('Soya Bean', 'సోయాబీన్'), data: findTopModal('Soya'), emoji: '🟡' },
      { key: 'maize', title: t('Maize', 'మక్కజొన్న'), data: findTopModal('Maize'), emoji: '🌽' },
    ];
    return cards.filter((c) => c.data !== null);
  }, [records, t]);

  const liveCount = useMemo(() => records.filter((r) => !r.isIndicative && !!r.arrival_date).length, [records]);

  // Filtered and searched records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (liveOnly && (r.isIndicative || !r.arrival_date)) return false;
      if (localOnly && !r.isLocal) return false;
      if (districtFilter) {
        const q = districtFilter.toLowerCase();
        const d = r.district.toLowerCase();
        const matchesDistrict =
          d.includes(q) ||
          q.includes(d) ||
          (q.includes('asifabad') && d.includes('asifabad')) ||
          (q.includes('kadapa') && (d.includes('kadapa') || d.includes('cuddapah'))) ||
          (q.includes('nellore') && d.includes('nellore')) ||
          (q.includes('ananthapur') && d.includes('ananthapur')) ||
          (q.includes('konaseema') && (d.includes('konaseema') || d.includes('ambajipeta') || d.includes('amalapuram'))) ||
          (q.includes('kothagudem') && d.includes('kothagudem')) ||
          (q.includes('warangal') && (d.includes('warangal') || d.includes('hanumakonda') || d.includes('hanamkonda')));
        if (!matchesDistrict) return false;
      }
      if (commodityFilter) {
        const cf = commodityFilter.toLowerCase();
        const rc = r.commodity.toLowerCase();
        if (
          cf.includes('bengal gram') ||
          cf.includes('chana') ||
          (cf.includes('gram') && !cf.includes('red gram') && !cf.includes('green gram') && !cf.includes('black gram'))
        ) {
          const isChana =
            rc.includes('bengal gram') ||
            rc.includes('chana') ||
            (rc.includes('gram') && !rc.includes('red gram') && !rc.includes('green gram') && !rc.includes('black gram'));
          if (!isChana) return false;
        } else if (cf.includes('red gram')) {
          const isRedGram = rc.includes('red gram') || rc.includes('tur') || rc.includes('arhar');
          if (!isRedGram) return false;
        } else {
          if (!rc.includes(cf)) return false;
        }
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesCommodity = r.commodity.toLowerCase().includes(q);
        const matchesMarket = r.market.toLowerCase().includes(q);
        const matchesVariety = r.variety.toLowerCase().includes(q);
        const matchesDistrict = r.district.toLowerCase().includes(q);
        if (!matchesCommodity && !matchesMarket && !matchesVariety && !matchesDistrict) {
          return false;
        }
      }
      return true;
    });
  }, [records, liveOnly, localOnly, districtFilter, commodityFilter, searchQuery]);

  const visibleRecords = useMemo(() => {
    return filteredRecords.slice(0, visibleCount);
  }, [filteredRecords, visibleCount]);

  const isPillActive = (pillFilter: string) => {
    if (!commodityFilter) return false;
    const cf = commodityFilter.toLowerCase();
    const pf = pillFilter.toLowerCase();
    if (pf === 'bengal gram' || pf === 'chana' || pf === 'gram') {
      return (
        cf.includes('bengal gram') ||
        cf.includes('chana') ||
        (cf.includes('gram') && !cf.includes('red gram') && !cf.includes('green gram') && !cf.includes('black gram'))
      );
    }
    if (pf === 'red gram') return cf.includes('red gram') || cf.includes('tur') || cf.includes('arhar');
    if (pf === 'paddy') return cf.includes('paddy') || cf.includes('dhan');
    if (pf === 'soya') return cf.includes('soya') || cf.includes('soybean');
    return cf.includes(pf);
  };

  const handlePillClick = (filterKey: string) => {
    setLiveOnly(false);
    if (isPillActive(filterKey)) {
      setCommodityFilter('');
      return;
    }
    const exactMatch = commodities.find((c) => {
      const cl = c.toLowerCase();
      const fl = filterKey.toLowerCase();
      if (fl === 'bengal gram' || fl === 'chana' || fl === 'gram') {
        return (
          cl.includes('bengal gram') ||
          cl.includes('chana') ||
          (cl.includes('gram') && !cl.includes('red gram') && !cl.includes('green gram'))
        );
      }
      return cl.includes(fl);
    });
    setCommodityFilter(exactMatch || filterKey);
  };

  // WhatsApp Share handler
  const handleShareWhatsApp = () => {
    const text = buildMandiWhatsAppText(filteredRecords.length > 0 ? filteredRecords : records, t, selectedState);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Officer Save Price handler
  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    const min = Number(modalForm.min_price);
    const max = Number(modalForm.max_price);
    const modal = Number(modalForm.modal_price);

    if (!modalForm.market || !modalForm.commodity || isNaN(modal) || modal <= 0) {
      alert(t('Please enter valid market, commodity, and modal price.', 'దయచేసి సరైన మార్కెట్, పంట మరియు మోడల్ ధరను నమోదు చేయండి.'));
      return;
    }

    saveCustomMandiPrice({
      state: selectedState,
      district: modalForm.district,
      market: modalForm.market,
      commodity: modalForm.commodity,
      variety: modalForm.variety || 'Local',
      arrival_date: modalForm.arrival_date || new Date().toLocaleDateString('en-GB'),
      min_price: isNaN(min) || min <= 0 ? modal : min,
      max_price: isNaN(max) || max <= 0 ? modal : max,
      modal_price: modal,
    });

    setUpdateSuccess(true);
    setTimeout(() => {
      setUpdateSuccess(false);
      setIsUpdateModalOpen(false);
      loadPrices(true);
    }, 800);
  };

  const handleDeletePrice = (id?: string) => {
    if (!id) return;
    if (confirm(t('Remove this logged price record?', 'ఈ ధర రికార్డును తొలగించాలా?'))) {
      deleteCustomMandiPrice(id);
      loadPrices(true);
    }
  };

  if (loading) {
    return (
      <div className="portal-card flex h-56 items-center justify-center rounded-2xl p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-emerald-200 border-t-emerald-600" />
          <p className="text-xs font-semibold text-slate-500">
            {selectedState === 'Telangana'
              ? t('Loading Telangana Mandi Prices...', 'తెలంగాణ మండి ధరలు లోడ్ అవుతున్నాయి...')
              : selectedState === 'Andhra Pradesh'
                ? t('Loading Andhra Pradesh Mandi Prices...', 'ఆంధ్రప్రదేశ్ మండి ధరలు లోడ్ అవుతున్నాయి...')
                : t(`Loading ${selectedState} Mandi Prices...`, `${selectedState} మండి ధరలు లోడ్ అవుతున్నాయి...`)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-card overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm dark:border-slate-800">
      {/* Header Banner */}
      <div className="relative rounded-t-2xl bg-gradient-to-br from-emerald-900 via-teal-900 to-green-800 px-5 py-4 text-white">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold-400/80 to-transparent" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-2.5 ring-1 ring-white/15 backdrop-blur-sm">
              <Store className="h-5 w-5 text-gold-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight sm:text-lg">
                {selectedState === 'Telangana'
                  ? t('Mandi Prices — Telangana & Local Markets', 'మండి ధరలు — తెలంగాణ & స్థానిక మార్కెట్లు')
                  : selectedState === 'Andhra Pradesh'
                    ? t('Mandi Prices — Andhra Pradesh Markets', 'మండి ధరలు — ఆంధ్రప్రదేశ్ మార్కెట్లు')
                    : t(`Mandi Prices — ${selectedState} Markets`, `మండి ధరలు — ${selectedState} మార్కెట్లు`)}
              </h3>
              <p className="text-xs text-emerald-100/90">
                {t(
                  'Daily wholesale prices (₹/quintal)',
                  'రోజువారీ టోకు ధరలు (₹/క్వింటాల్)'
                )}
              </p>
              {selectedState === 'Telangana' && location.source === 'gps' && location.name && (
                <p className="mt-0.5 text-[11px] font-semibold text-gold-200/90">
                  {t('Near', 'దగ్గర')}: {location.name}
                </p>
              )}
            </div>
          </div>

          {/* Header Badges & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold backdrop-blur-sm shadow-sm ${
                source === 'ogd-live'
                  ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                  : 'border-gold-400/40 bg-gold-500/20 text-gold-200'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${source === 'ogd-live' ? 'bg-emerald-400 animate-pulse' : 'bg-gold-400'}`} />
              {source === 'ogd-live' ? t('Agmarknet Live', 'అగ్మార్క్‌నెట్ లైవ్') : t('Indicative Rates', 'సూచిక ధరలు')}
            </span>

            {/* Refresh Button */}
            <button
              onClick={() => loadPrices(true)}
              disabled={refreshing}
              title={t('Refresh mandi prices', 'మండి ధరలను రీఫ్రెష్ చేయండి')}
              aria-label={t('Refresh prices', 'ధరలు రీఫ్రెష్')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              title={t('Share Mandi Rates on WhatsApp', 'వాట్సాప్‌లో మండి ధరలు షేర్ చేయండి')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/80 px-2.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95 ring-1 ring-emerald-400/40"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('WhatsApp', 'వాట్సాప్')}</span>
            </button>

            {/* Officer / Admin Update Button */}
            {isAdminUser && (
              <button
                onClick={() => setIsUpdateModalOpen(true)}
                title={t('Add today\'s local mandi price', 'ఈరోజు స్థానిక మండి ధరను నమోదు చేయండి')}
                className="inline-flex items-center gap-1 rounded-lg bg-gold-500/20 px-2.5 py-1 text-xs font-bold text-gold-200 transition hover:bg-gold-500/30 ring-1 ring-gold-400/50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t('Log Rate', 'ధర నమోదు')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Commodity Highlights Cards */}
      <div className="grid grid-cols-2 gap-2.5 border-b border-slate-100 bg-slate-50/70 p-3.5 sm:grid-cols-3 lg:grid-cols-6 dark:border-slate-800 dark:bg-slate-900/50">
        {highlights.map((h) => {
          if (!h.data) return null;
          const isAboveMsp = h.data.msp && h.data.modal_price >= h.data.msp;
          const diff = h.data.msp ? h.data.modal_price - h.data.msp : null;
          const isLive = !h.data.isIndicative && !!h.data.arrival_date;

          return (
            <div
              key={h.key}
              onClick={() => setCommodityFilter(h.data?.commodity || '')}
              className="cursor-pointer rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs transition hover:border-emerald-500/50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/80"
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                  {h.emoji} {h.title}
                </span>
                {isLive && (
                  <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-black text-emerald-700 dark:text-emerald-300">
                    Live
                  </span>
                )}
                {diff !== null && diff !== 0 && !isLive && (
                  <span
                    className={`inline-flex items-center text-[10px] font-black ${
                      isAboveMsp ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {isAboveMsp ? <TrendingUp className="mr-0.5 h-3 w-3" /> : <TrendingDown className="mr-0.5 h-3 w-3" />}
                    {isAboveMsp ? `+₹${diff}` : `-₹${Math.abs(diff)}`}
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900 sm:text-xl dark:text-white">
                  ₹{h.data.modal_price.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400">/ qtl</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="truncate max-w-[90px]">{h.data.market}</span>
                {h.data.msp && (
                  <span className="font-semibold text-slate-400 text-[10px]">
                    MSP ₹{h.data.msp.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4">
        {/* Quick Crop Pills */}
        <div className="mb-3.5 flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setCommodityFilter('');
              setLiveOnly(false);
            }}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              commodityFilter === '' && !liveOnly
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'border border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {t('All Crops', 'అన్ని పంటలు')} ({records.length})
          </button>

          {liveCount > 0 && (
            <button
              onClick={() => {
                setLiveOnly(!liveOnly);
                setCommodityFilter('');
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                liveOnly
                  ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                  : 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('Live Today', 'ఈరోజు లైవ్')} ({liveCount})</span>
            </button>
          )}

          {[
            { label: t('🌱 Cotton', '🌱 పత్తి'), filter: 'Cotton' },
            { label: t('🌾 Paddy', '🌾 వరి'), filter: 'Paddy' },
            { label: t('Jowar', 'జొన్నలు'), filter: 'Jowar' },
            { label: t('🫘 Red Gram', '🫘 కంది'), filter: 'Red Gram' },
            { label: t('🟡 Soya Bean', '🟡 సోయాబీన్'), filter: 'Soya' },
            { label: t('🌽 Maize', '🌽 మక్కజొన్న'), filter: 'Maize' },
            { label: t('🌰 Chana (Gram)', '🌰 శనగలు (చనా)'), filter: 'Bengal Gram' },
            { label: t('🌶️ Chilli', '🌶️ మిర్చి'), filter: 'Chilli' },
            { label: t('Turmeric', 'పసుపు'), filter: 'Turmeric' },
          ].map((pill) => {
            const active = isPillActive(pill.filter);
            return (
              <button
                key={pill.filter}
                onClick={() => handlePillClick(pill.filter)}
                className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                  active
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Filter Bar (Search, State, District, Local Toggle, Date) */}
        <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[140px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search commodity or market...', 'వస్తువు లేదా మార్కెట్‌ను శోధించండి...')}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 shadow-xs focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* State Selector Dropdown (beside All Districts) in alphabetical order */}
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            aria-label={t('Select State', 'రాష్ట్రం ఎంచుకోండి')}
            className="filter-select max-w-[13rem] rounded-xl text-xs font-bold border-emerald-300 dark:border-emerald-700"
          >
            {ALL_INDIAN_STATES.slice().sort((a, b) => a.localeCompare(b)).map((st) => (
              <option key={st} value={st}>
                {st === 'Telangana'
                  ? t('Telangana (తెలంగాణ)', 'తెలంగాణ (Telangana)')
                  : st === 'Andhra Pradesh'
                    ? t('Andhra Pradesh (ఆంధ్రప్రదేశ్)', 'ఆంధ్రప్రదేశ్ (Andhra Pradesh)')
                    : st}
              </option>
            ))}
          </select>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="filter-select max-w-[12rem] rounded-xl text-xs"
          >
            <option value="">{t('All Districts', 'అన్ని జిల్లాలు')}</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={commodityFilter}
            onChange={(e) => setCommodityFilter(e.target.value)}
            className="filter-select max-w-[12rem] rounded-xl text-xs"
          >
            <option value="">{t('All Commodities', 'అన్ని పంటలు')}</option>
            {commodities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setLocalOnly(!localOnly)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
              localOnly
                ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400 dark:bg-emerald-950 dark:text-emerald-300'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            <span>{t('Local Mandis', 'స్థానిక మార్కెట్లు')}</span>
          </button>

          {latestDate && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800">
              <Calendar className="h-3 w-3" />
              {t('Latest Arrival', 'తాజా రాక')}: {formatDateLabel(latestDate)}
            </span>
          )}
        </div>

        {/* Mandi Price Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50/50 shadow-xs dark:border-slate-800 dark:bg-slate-900/40">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                <th className="py-2.5 pl-3 pr-3">{t('Commodity & Variety', 'పంట & రకం')}</th>
                <th className="py-2.5 pr-3">{t('Market & District', 'మార్కెట్ & జిల్లా')}</th>
                <th className="py-2.5 pr-3 text-right">{t('Min (₹)', 'కనిష్ట')}</th>
                <th className="py-2.5 pr-3 text-right">{t('Max (₹)', 'గరిష్ట')}</th>
                <th className="py-2.5 pr-3 text-right">{t('Modal (₹/qtl)', 'మోడల్ ధర')}</th>
                <th className="py-2.5 pr-3 text-center">{t('MSP Status', 'MSP పోలిక')}</th>
                <th className="py-2.5 pr-3 text-right">{t('Date', 'తేదీ')}</th>
                {isAdminUser && <th className="py-2.5 pr-3 text-center">{t('Action', 'చర్య')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleRecords.map((r, i) => {
                const mspInfo = getCommodityMSP(r.commodity);
                const effectiveMsp = r.msp ?? (mspInfo?.msp && mspInfo.msp > 0 ? mspInfo.msp : undefined);
                const diff =
                  r.mspDifference !== undefined
                    ? r.mspDifference
                    : effectiveMsp && r.modal_price > 0
                      ? r.modal_price - effectiveMsp
                      : undefined;
                const isAbove = diff !== undefined && diff >= 0;

                return (
                  <tr
                    key={r.id || `${r.market}-${r.commodity}-${i}`}
                    className={`transition hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 ${
                      r.isCustom ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    {/* Commodity */}
                    <td className="py-3 pl-3 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {r.commodity}
                        </span>
                        {r.isCustom && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-800 dark:text-amber-300">
                            {t('Officer Verified', 'అధికారి ధర')}
                          </span>
                        )}
                        {!r.isCustom && !r.isIndicative && r.arrival_date && (
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300">
                            {t('Live', 'లైవ్')}
                          </span>
                        )}
                        {r.isIndicative && (
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            {t('Indicative', 'సూచిక')}
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        {r.variety || '—'}
                      </span>
                    </td>

                    {/* Market & District */}
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {r.market}
                        </span>
                        {r.isLocal && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-black text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                            {t('Local', 'స్థానిక')}
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] font-medium text-slate-400">
                        {r.district}
                      </span>
                    </td>

                    {/* Min Price */}
                    <td className="py-3 pr-3 text-right font-medium text-slate-600 dark:text-slate-300">
                      ₹{r.min_price.toLocaleString('en-IN')}
                    </td>

                    {/* Max Price */}
                    <td className="py-3 pr-3 text-right font-medium text-slate-600 dark:text-slate-300">
                      ₹{r.max_price.toLocaleString('en-IN')}
                    </td>

                    {/* Modal Price */}
                    <td className="py-3 pr-3 text-right">
                      <span className="inline-flex items-center gap-0.5 text-sm font-black text-emerald-700 dark:text-emerald-300">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {r.modal_price.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* MSP Comparison Status */}
                    <td className="py-3 pr-3 text-center">
                      {effectiveMsp ? (
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-black ${
                              isAbove
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {isAbove ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                            {diff !== undefined
                              ? isAbove
                                ? `+₹${diff.toLocaleString('en-IN')}`
                                : `-₹${Math.abs(diff).toLocaleString('en-IN')}`
                              : 'MSP Active'}
                          </span>
                          <span className="text-[10px] text-slate-400">MSP: ₹{effectiveMsp.toLocaleString('en-IN')}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 pr-3 text-right text-[11px] text-slate-500 dark:text-slate-400">
                      {formatDateLabel(arrivalToIso(r.arrival_date))}
                    </td>

                    {/* Officer delete action */}
                    {isAdminUser && (
                      <td className="py-3 pr-3 text-center">
                        {r.isCustom && (
                          <button
                            onClick={() => handleDeletePrice(r.id)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                            title={t('Delete record', 'రికార్డు తొలగించు')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}

              {visibleRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center font-semibold text-slate-500">
                    <p>
                      {districtFilter
                        ? t(
                            `No mandi prices reported for ${districtFilter} yet.`,
                            `${districtFilter} జిల్లాకు సంబంధించి ఇంకా మండి ధరలు అందలేదు.`
                          )
                        : t('No mandi prices found for this filter.', 'ఈ ఫిల్టర్‌కు సంబంధించిన మండి ధరలు లభించలేదు.')}
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setDistrictFilter('');
                        setCommodityFilter('');
                        setLocalOnly(false);
                      }}
                      className="mt-2 text-xs font-bold text-emerald-600 underline hover:text-emerald-700"
                    >
                      {t('Reset filters', 'ఫిల్టర్లను రీసెట్ చేయండి')}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Show More / Show Less Button */}
        {filteredRecords.length > 15 && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              {t('Showing', 'చూపిస్తున్నాం')} {visibleRecords.length} {t('of', 'మొత్తం')} {filteredRecords.length} {t('records', 'రికార్డులు')}
            </span>
            <button
              onClick={() => setVisibleCount(visibleCount >= filteredRecords.length ? 15 : 100)}
              className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
            >
              {visibleCount >= filteredRecords.length ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span>{t('Show Top 15', 'టాప్ 15 చూపించు')}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>{t('Show All Markets', 'అన్ని మార్కెట్లు చూపించు')}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Officer Add Price Modal */}
      {isUpdateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Plus className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('Log Local Mandi Price', 'స్థానిక మండి ధర నమోదు')}
                </h4>
              </div>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {t(
                'Agriculture Officers can record verified arrival rates from Asifabad, Kagaznagar, or local yards for farmers.',
                'వ్యవసాయ అధికారులు రైతుల కోసం ఆసిఫాబాద్, కాగజ్‌నగర్ లేదా స్థానిక యార్డుల రాక ధరలను నమోదు చేయవచ్చు.'
              )}
            </p>

            <form onSubmit={handleSavePrice} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {t('District', 'జిల్లా')}
                  </label>
                  <input
                    type="text"
                    value={modalForm.district}
                    onChange={(e) => setModalForm({ ...modalForm, district: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {t('Market / AMC Name', 'మార్కెట్ / యార్డ్ పేరు')}
                  </label>
                  <input
                    type="text"
                    value={modalForm.market}
                    onChange={(e) => setModalForm({ ...modalForm, market: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {t('Commodity', 'పంట')}
                  </label>
                  <select
                    value={modalForm.commodity}
                    onChange={(e) => setModalForm({ ...modalForm, commodity: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Cotton">Cotton / పత్తి</option>
                    <option value="Paddy(Dhan)(Grade A)">Paddy (Grade A) / వరి (గ్రేడ్-ఎ)</option>
                    <option value="Paddy(Dhan)(Common)">Paddy (Common) / వరి (సాధారణ)</option>
                    <option value="Jowar(Sorghum)">Jowar (Sorghum) / జొన్నలు</option>
                    <option value="Red Gram">Red Gram / కంది</option>
                    <option value="Soya Bean">Soya Bean / సోయాబీన్</option>
                    <option value="Maize">Maize / మక్కజొన్న</option>
                    <option value="Bengal Gram(Gram)">Bengal Gram / శనగలు</option>
                    <option value="Chilli (Dry)">Chilli (Dry) / మిర్చి</option>
                    <option value="Turmeric">Turmeric / పసుపు</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {t('Variety', 'రకం')}
                  </label>
                  <input
                    type="text"
                    value={modalForm.variety}
                    onChange={(e) => setModalForm({ ...modalForm, variety: e.target.value })}
                    placeholder="e.g. Bunny, BPT 5204, JS 335"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {t('Min (₹)', 'కనిష్ట (₹)')}
                  </label>
                  <input
                    type="number"
                    value={modalForm.min_price}
                    onChange={(e) => setModalForm({ ...modalForm, min_price: e.target.value })}
                    placeholder="7100"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {t('Max (₹)', 'గరిష్ట (₹)')}
                  </label>
                  <input
                    type="number"
                    value={modalForm.max_price}
                    onChange={(e) => setModalForm({ ...modalForm, max_price: e.target.value })}
                    placeholder="7900"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-emerald-800 dark:text-emerald-400">
                    {t('Modal (₹)*', 'మోడల్ (₹)*')}
                  </label>
                  <input
                    type="number"
                    value={modalForm.modal_price}
                    onChange={(e) => setModalForm({ ...modalForm, modal_price: e.target.value })}
                    placeholder="7650"
                    className="mt-1 w-full rounded-xl border border-emerald-400 px-3 py-2 text-xs font-black text-emerald-800 dark:border-emerald-600 dark:bg-slate-800 dark:text-emerald-300"
                    required
                  />
                </div>
              </div>

              {updateSuccess && (
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 p-2.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>{t('Price record added successfully!', 'ధర రికార్డు విజయవంతంగా జోడించబడింది!')}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {t('Cancel', 'రద్దు')}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white shadow-sm hover:bg-emerald-800 active:scale-95"
                >
                  <Check className="h-4 w-4" />
                  {t('Save Price Record', 'ధరను భద్రపరచండి')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/** OGD dates arrive as "DD/MM/YYYY" (occasionally "YYYY-MM-DD"). */
function arrivalToIso(date: string): string {
  if (!date) return '';
  const dmy = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return date;
}

function formatDateLabel(iso: string): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime())
    ? iso
    : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
