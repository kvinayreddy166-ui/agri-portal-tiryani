export interface CropRisk {
  type: 'Pest' | 'Disease' | 'Nutrition';
  name: string;
  symptoms: string;
  action: string;
  image: string;
}

export interface CropIntelligence {
  id: string;
  label: string;
  scientificName: string;
  image: string;
  soil: string;
  duration: string;
  varieties: string[];
  management: {
    nursery: string;
    fertilizer: string;
    weed: string;
    irrigation: string;
  };
  risks: CropRisk[];
}

export const cropIntelligence: Record<string, CropIntelligence> = {
  paddy: {
    id: 'paddy',
    label: 'Paddy / Rice',
    scientificName: 'Oryza sativa',
    image: '/images/paddy.jpg',
    soil: 'Suitable in most soils except saline or alkaline problem blocks. Water-retentive loams are preferred.',
    duration: '120-150 days for short to medium duration varieties.',
    varieties: ['Telangana Sona (RNR 15048)', 'Bathukamma (JGL 18047)', 'MTU group varieties as locally advised'],
    management: {
      nursery: 'Raise healthy nursery beds and transplant young seedlings at the right stage.',
      fertilizer: 'Use balanced NPK and split nitrogen at basal, tillering, and panicle initiation stages.',
      weed: 'Use pre-emergence weed control within 3-5 days where recommended, followed by timely hand weeding.',
      irrigation: 'Maintain a thin water film after transplanting and avoid continuous deep standing water.',
    },
    risks: [
      {
        type: 'Pest',
        name: 'Brown Planthopper',
        symptoms: 'Insects cluster at plant base; severe attack causes hopper-burn drying patches.',
        action: 'Avoid excess urea, monitor base of plants, and spray only above threshold as per local advisory.',
        image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=600',
      },
      {
        type: 'Disease',
        name: 'Blast',
        symptoms: 'Diamond or spindle-shaped leaf lesions with grey centers and brown margins.',
        action: 'Use resistant varieties, balanced nitrogen, and recommended fungicide at the right stage.',
        image: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&q=80&w=600',
      },
    ],
  },
  cotton: {
    id: 'cotton',
    label: 'Cotton',
    scientificName: 'Gossypium hirsutum',
    image: '/images/cotton.jpg',
    soil: 'Deep black cotton soils with good moisture retention are highly preferred.',
    duration: '150-180 days depending on variety and management.',
    varieties: ['Narasimha (NA 1325)', 'Srirama (NDLH 1938)', 'Locally recommended Bt hybrids'],
    management: {
      nursery: 'Direct sowing is preferred; keep proper row spacing and plant population.',
      fertilizer: 'Apply NPK in splits based on soil test, with top dressing around 30, 60, and 90 days.',
      weed: 'Use early weed control and hand weeding/interculture around 30 days.',
      irrigation: 'Protect flowering and boll formation stages from severe moisture stress.',
    },
    risks: [
      {
        type: 'Pest',
        name: 'Pink Bollworm',
        symptoms: 'Rosette flowers, damaged squares, and bored bolls with lint damage.',
        action: 'Use pheromone traps, destroy damaged bolls, and follow IPM-based spray decisions.',
        image: 'https://images.unsplash.com/photo-1595666944516-b28b88b8dc72?auto=format&fit=crop&q=80&w=600',
      },
      {
        type: 'Pest',
        name: 'Whitefly',
        symptoms: 'Yellowing, honeydew, sooty mould, and leaf curl symptoms in severe cases.',
        action: 'Conserve natural enemies, avoid repeated same-chemistry sprays, and follow threshold-based control.',
        image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&q=80&w=600',
      },
    ],
  },
  maize: {
    id: 'maize',
    label: 'Maize',
    scientificName: 'Zea mays',
    image: '/images/maize.jpg',
    soil: 'Well-drained fertile soils, including red sandy loams and alluvial soils.',
    duration: '85-120 days depending on hybrid and season.',
    varieties: ['DHM 111', 'Suitable private hybrids', 'Locally recommended short-duration hybrids'],
    management: {
      nursery: 'Direct line sowing with seed drill or planter is preferred.',
      fertilizer: 'Apply basal phosphorus and potash, then split nitrogen at knee-high and tasseling stages.',
      weed: 'Keep the crop weed-free during early establishment.',
      irrigation: 'Avoid stress at tasseling, silking, and grain filling stages.',
    },
    risks: [
      {
        type: 'Pest',
        name: 'Fall Armyworm',
        symptoms: 'Windowing on leaves, whorl feeding, and frass inside the central whorl.',
        action: 'Scout early, destroy egg masses, and use recommended biological or chemical control when needed.',
        image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=600',
      },
    ],
  },
  pulses: {
    id: 'pulses',
    label: 'Pulses',
    scientificName: 'Cajanus cajan / Vigna radiata',
    image: '/images/pulses.jpg',
    soil: 'Well-drained red sandy loams and black soils; avoid waterlogging.',
    duration: 'Greengram 60-75 days; redgram commonly 130-180 days depending on season.',
    varieties: ['PRG 176 redgram', 'WGG 37 greengram', 'Season-specific local varieties'],
    management: {
      nursery: 'Direct sowing is preferred; treat seed before sowing.',
      fertilizer: 'Apply phosphorus at sowing and use Rhizobium seed treatment where advised.',
      weed: 'Keep fields weed-free during early growth.',
      irrigation: 'Provide drainage and avoid standing water.',
    },
    risks: [
      {
        type: 'Pest',
        name: 'Pod Borer',
        symptoms: 'Bored pods, flower shedding, and larvae feeding on developing grains.',
        action: 'Use pheromone traps, bird perches, and need-based sprays as per local advisory.',
        image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=600',
      },
      {
        type: 'Disease',
        name: 'Wilt / Yellow Mosaic',
        symptoms: 'Plant wilting, yellow mosaic patches, and poor pod setting.',
        action: 'Use resistant varieties, remove infected plants early, and control vectors.',
        image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=600',
      },
    ],
  },
  oilseeds: {
    id: 'oilseeds',
    label: 'Oilseeds',
    scientificName: 'Groundnut / Sesame / Soybean group',
    image: '/images/oilseeds.jpg',
    soil: 'Light to medium well-drained soils are suitable; avoid waterlogged blocks.',
    duration: 'Usually 90-120 days depending on crop and variety.',
    varieties: ['Groundnut and sesame varieties as locally notified', 'Short-duration oilseed varieties'],
    management: {
      nursery: 'Direct sowing with healthy seed and proper spacing.',
      fertilizer: 'Use soil-test-based fertilizer; apply gypsum/calcium where recommended for groundnut.',
      weed: 'Early weed control is important before canopy closure.',
      irrigation: 'Avoid moisture stress at flowering and peg/pod development.',
    },
    risks: [
      {
        type: 'Pest',
        name: 'Leaf Miner / Aphids',
        symptoms: 'Mined leaves, curling, sticky honeydew, and yellowing.',
        action: 'Monitor early, conserve natural enemies, and use need-based control.',
        image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
      },
      {
        type: 'Nutrition',
        name: 'Calcium Deficiency',
        symptoms: 'Poor pod filling and weak peg development in groundnut.',
        action: 'Apply gypsum/calcium as recommended for the soil and crop stage.',
        image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&q=80&w=600',
      },
    ],
  },
};

cropIntelligence.rice = cropIntelligence.paddy;
cropIntelligence.redgram = {
  ...cropIntelligence.pulses,
  id: 'redgram',
  label: 'Redgram / Pigeonpea',
  scientificName: 'Cajanus cajan',
  varieties: ['PRG 176', 'LRG 41', 'Locally recommended redgram varieties'],
};
cropIntelligence.greengram = {
  ...cropIntelligence.pulses,
  id: 'greengram',
  label: 'Greengram / Mungbean',
  scientificName: 'Vigna radiata',
  image: '/images/greengram.webp',
  varieties: ['WGG 37 (Ekasila)', 'MGG 295', 'Locally recommended greengram varieties'],
};

export function getCropIntelligence(cropType: string): CropIntelligence | undefined {
  return cropIntelligence[cropType];
}
