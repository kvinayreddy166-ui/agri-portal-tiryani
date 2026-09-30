var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/features/field-diagnosis/data/fieldDiagnosisData.ts
var fieldDiagnosisData_exports = {};
__export(fieldDiagnosisData_exports, {
  FD_CROPS: () => FD_CROPS,
  FD_DISEASES: () => FD_DISEASES,
  FD_NONINFECTIOUS: () => FD_NONINFECTIOUS,
  FD_PLANT_PARTS: () => FD_PLANT_PARTS,
  FD_SYMPTOMS: () => FD_SYMPTOMS,
  FD_TRAIT_QUESTIONS: () => FD_TRAIT_QUESTIONS,
  OBSERVATION_VALUES: () => OBSERVATION_VALUES,
  UNKNOWN_STAGE: () => UNKNOWN_STAGE,
  expandPartSelection: () => expandPartSelection,
  getDiseasesForCrop: () => getDiseasesForCrop,
  getGrowthStages: () => getGrowthStages,
  getPlantParts: () => getPlantParts,
  getSymptoms: () => getSymptoms,
  matchTier: () => matchTier,
  plantPartLabel: () => plantPartLabel,
  scoreDisease: () => scoreDisease,
  toPastTense: () => toPastTense
});
module.exports = __toCommonJS(fieldDiagnosisData_exports);

// src/features/field-diagnosis/data/diseaseSymptoms.json
var diseaseSymptoms_default = {
  title: "Crop Disease Symptoms Reference for Agronix",
  version: "1.0",
  language: "en",
  source: {
    name: "Tamil Nadu Agricultural University (TNAU) Agritech Portal",
    url: "https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_diseases_agri.html",
    verification_note: "This file consolidates disease names and symptom summaries previously provided in this conversation. It is a preliminary reference, not a verified exhaustive extraction of every individual TNAU disease page. Validate disease lists and descriptions before using for field diagnosis."
  },
  schema: {
    crop: "Crop name",
    category: "Crop category",
    diseases: [
      {
        disease_name: "Disease name",
        plant_parts_affected: [
          "Plant parts"
        ],
        symptoms: [
          "Observable symptoms"
        ],
        diagnostic_features: [
          "Distinctive features, when stated"
        ]
      }
    ]
  },
  crops: [
    {
      crop_name: "Rice (Paddy)",
      category: "Cereals",
      diseases: [
        {
          disease_name: "Blast",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Small spots enlarge into spindle-shaped lesions with gray or ashy centers and brown margins.",
            "Lesions may merge and cause extensive leaf damage."
          ]
        },
        {
          disease_name: "Neck blast",
          plant_parts_affected: [
            "Panicle neck"
          ],
          symptoms: [
            "Neck turns black and shrivels.",
            "Grain formation is reduced; the panicle may break and hang."
          ]
        },
        {
          disease_name: "Brown spot",
          plant_parts_affected: [
            "Leaves",
            "Grains"
          ],
          symptoms: [
            "Brown spots develop on leaves, sometimes with gray centers and dark margins.",
            "Infected grains may become discolored."
          ]
        },
        {
          disease_name: "Bacterial leaf blight",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Water-soaked lesions develop near leaf tips or margins.",
            "Lesions enlarge and turn yellow to whitish."
          ]
        },
        {
          disease_name: "Sheath blight",
          plant_parts_affected: [
            "Leaf sheaths",
            "Leaves"
          ],
          symptoms: [
            "Oval or irregular greenish-gray lesions develop near the waterline.",
            "Lesions expand, with gray centers and brown margins."
          ]
        },
        {
          disease_name: "Sheath rot",
          plant_parts_affected: [
            "Leaf sheath",
            "Panicle"
          ],
          symptoms: [
            "The uppermost leaf sheath develops brown lesions.",
            "The panicle may remain partially enclosed; grains may be discolored or unfilled."
          ]
        },
        {
          disease_name: "False smut",
          plant_parts_affected: [
            "Grains"
          ],
          symptoms: [
            "Individual grains transform into velvety yellow-orange spore masses that later become greenish-black."
          ]
        },
        {
          disease_name: "Bacterial leaf streak",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Small, dark-green, water-soaked streaks develop between leaf veins.",
            "Streaks may become translucent or yellowish."
          ]
        },
        {
          disease_name: "Bakanae",
          plant_parts_affected: [
            "Seedlings"
          ],
          symptoms: [
            "Seedlings become abnormally elongated, thin, and pale.",
            "Excessive growth may be followed by wilting."
          ]
        },
        {
          disease_name: "Rice tungro",
          plant_parts_affected: [
            "Leaves",
            "Whole plant",
            "Panicles"
          ],
          symptoms: [
            "Plants become stunted and tillering decreases.",
            "Leaves turn yellow or orange-yellow.",
            "Panicles may be small and poorly filled."
          ]
        },
        {
          disease_name: "Rice yellow dwarf",
          plant_parts_affected: [
            "Leaves",
            "Whole plant"
          ],
          symptoms: [
            "Plants become stunted and produce excessive tillers.",
            "Leaves become yellowish."
          ]
        },
        {
          disease_name: "Rice grassy stunt",
          plant_parts_affected: [
            "Leaves",
            "Whole plant"
          ],
          symptoms: [
            "Plants become severely stunted and produce excessive tillers.",
            "Leaves become narrow and yellowish-green."
          ]
        },
        {
          disease_name: "Grain discoloration",
          plant_parts_affected: [
            "Grains"
          ],
          symptoms: [
            "Grains show brown, black, or other discoloration, often affecting the husk and grain surface."
          ]
        }
      ]
    },
    {
      crop_name: "Sorghum (Jowar)",
      category: "Cereals",
      diseases: [
        {
          disease_name: "Head smut",
          plant_parts_affected: [
            "Panicle"
          ],
          symptoms: [
            "The head is partially or completely replaced by a large whitish gall containing dark spores."
          ]
        },
        {
          disease_name: "Covered kernel smut",
          plant_parts_affected: [
            "Grains"
          ],
          symptoms: [
            "Individual grains are replaced by smut sori enclosed in a persistent membrane."
          ]
        },
        {
          disease_name: "Long smut",
          plant_parts_affected: [
            "Grains",
            "Panicle"
          ],
          symptoms: [
            "Long, cylindrical, slightly curved spore sacs develop in place of grains."
          ]
        },
        {
          disease_name: "Grain smut",
          plant_parts_affected: [
            "Grains"
          ],
          symptoms: [
            "Grains are replaced by dark spore masses enclosed in a covering membrane."
          ]
        },
        {
          disease_name: "Downy mildew",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Chlorotic streaks develop along leaves.",
            "White downy growth may appear on the underside."
          ]
        },
        {
          disease_name: "Rust",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Small reddish-brown pustules develop on leaves and may rupture to release spores."
          ]
        },
        {
          disease_name: "Anthracnose and red rot",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "Red or purple lesions develop on leaves.",
            "Stem tissues show red or purple discoloration when split open."
          ]
        },
        {
          disease_name: "Grain mold",
          plant_parts_affected: [
            "Grains"
          ],
          symptoms: [
            "Grains develop mold growth and discoloration, particularly under humid conditions."
          ]
        }
      ]
    },
    {
      crop_name: "Maize",
      category: "Cereals",
      diseases: [
        {
          disease_name: "Maydis leaf blight",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Small diamond-shaped lesions elongate and merge.",
            "Large areas of leaf tissue may appear burned."
          ]
        },
        {
          disease_name: "Sorghum downy mildew",
          plant_parts_affected: [
            "Leaves",
            "Whole plant"
          ],
          symptoms: [
            "Chlorotic areas extend from the leaf base with sharply defined margins.",
            "White downy growth may appear on both leaf surfaces."
          ]
        },
        {
          disease_name: "Turcicum leaf blight",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Long, elliptical, grayish-green lesions develop and become brown as they mature."
          ]
        },
        {
          disease_name: "Common rust",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Small reddish-brown pustules develop on leaf surfaces and release rust-colored spores."
          ]
        },
        {
          disease_name: "Common smut",
          plant_parts_affected: [
            "Ears",
            "Tassels",
            "Stems"
          ],
          symptoms: [
            "Large swollen galls develop on infected parts and eventually rupture, releasing dark spores."
          ]
        }
      ]
    },
    {
      crop_name: "Cumbu (Pearl millet)",
      category: "Millets",
      diseases: [
        {
          disease_name: "Downy mildew",
          plant_parts_affected: [
            "Leaves",
            "Growing point",
            "Panicle"
          ],
          symptoms: [
            "Pale yellow streaks appear on leaves, followed by white downy growth on the lower surface.",
            "Severe infection causes malformed, leafy panicles."
          ]
        },
        {
          disease_name: "Ergot",
          plant_parts_affected: [
            "Flowers",
            "Grains"
          ],
          symptoms: [
            "Honeydew droplets emerge from infected florets.",
            "Hard, dark sclerotia later replace grains."
          ]
        },
        {
          disease_name: "Smut",
          plant_parts_affected: [
            "Grains",
            "Panicle"
          ],
          symptoms: [
            "Individual grains are replaced by dark spore masses enclosed in a membrane."
          ]
        },
        {
          disease_name: "Rust",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Small reddish-brown pustules develop on leaves and release rust-colored spores."
          ]
        },
        {
          disease_name: "Blast",
          plant_parts_affected: [
            "Leaves",
            "Panicle"
          ],
          symptoms: [
            "Spindle-shaped lesions develop on leaves.",
            "Panicle infection causes poor grain formation."
          ]
        }
      ]
    },
    {
      crop_name: "Wheat",
      category: "Cereals",
      diseases: [
        {
          disease_name: "Leaf rust",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Small orange-brown pustules develop on leaf surfaces."
          ]
        },
        {
          disease_name: "Stem rust",
          plant_parts_affected: [
            "Stems",
            "Leaf sheaths"
          ],
          symptoms: [
            "Elongated reddish-brown pustules develop on stems and leaf sheaths."
          ]
        },
        {
          disease_name: "Stripe rust",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Yellow-orange pustules develop in long stripes along the veins."
          ]
        },
        {
          disease_name: "Loose smut",
          plant_parts_affected: [
            "Ear",
            "Grains"
          ],
          symptoms: [
            "The ear is replaced by a black powdery mass of spores, leaving the central rachis exposed."
          ]
        },
        {
          disease_name: "Karnal bunt",
          plant_parts_affected: [
            "Grains"
          ],
          symptoms: [
            "Individual grains are partially replaced by a black powdery mass, often with a fishy odor."
          ]
        },
        {
          disease_name: "Powdery mildew",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "White powdery fungal growth develops on leaves and stems and may later turn gray."
          ]
        },
        {
          disease_name: "Spot blotch",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Brown, oval or elongated lesions develop and may merge into large necrotic areas."
          ]
        },
        {
          disease_name: "Fusarium head blight",
          plant_parts_affected: [
            "Ears",
            "Grains"
          ],
          symptoms: [
            "Infected spikelets become bleached.",
            "Grains may become shriveled or discolored."
          ]
        }
      ]
    },
    {
      crop_name: "Ragi (Finger millet)",
      category: "Millets",
      diseases: [
        {
          disease_name: "Blast",
          plant_parts_affected: [
            "Leaves",
            "Neck",
            "Finger-like spikes"
          ],
          symptoms: [
            "Spindle-shaped lesions develop on leaves.",
            "Neck infection causes the ear to dry; finger infection affects grain formation."
          ]
        },
        {
          disease_name: "Leaf blight",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Brown or reddish-brown lesions develop and may enlarge, causing leaf drying."
          ]
        },
        {
          disease_name: "Foot rot",
          plant_parts_affected: [
            "Stem base",
            "Roots"
          ],
          symptoms: [
            "Plants become weak, yellow, and wilted.",
            "Roots and stem base show rotting."
          ]
        },
        {
          disease_name: "Grain smut",
          plant_parts_affected: [
            "Grains"
          ],
          symptoms: [
            "Individual grains are replaced by dark spore masses."
          ]
        },
        {
          disease_name: "Downy mildew",
          plant_parts_affected: [
            "Leaves",
            "Growing point"
          ],
          symptoms: [
            "Yellowing and white downy growth appear on leaves.",
            "Severe infection causes abnormal growth."
          ]
        }
      ]
    },
    {
      crop_name: "Redgram (Pigeon pea)",
      category: "Pulses",
      diseases: [
        {
          disease_name: "Fusarium wilt",
          plant_parts_affected: [
            "Leaves",
            "Stem",
            "Roots"
          ],
          symptoms: [
            "Leaves turn yellow, droop, and dry.",
            "Vascular tissues show brown discoloration when the stem is split."
          ]
        },
        {
          disease_name: "Sterility mosaic disease",
          plant_parts_affected: [
            "Leaves",
            "Whole plant"
          ],
          symptoms: [
            "Plants become stunted and produce excessive branches.",
            "Leaves become small and pale; flowering is greatly reduced or absent."
          ]
        },
        {
          disease_name: "Phytophthora blight",
          plant_parts_affected: [
            "Leaves",
            "Stem",
            "Branches"
          ],
          symptoms: [
            "Water-soaked lesions develop on stems and branches.",
            "Plants wilt and may collapse during wet weather."
          ]
        },
        {
          disease_name: "Alternaria leaf spot",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Brown circular or irregular spots develop and may merge, causing leaf drying."
          ]
        },
        {
          disease_name: "Powdery mildew",
          plant_parts_affected: [
            "Leaves",
            "Pods"
          ],
          symptoms: [
            "White powdery growth develops on leaves and other green parts.",
            "Severe infection causes yellowing and premature leaf fall."
          ]
        },
        {
          disease_name: "Dry root rot",
          plant_parts_affected: [
            "Roots",
            "Stem base"
          ],
          symptoms: [
            "Roots become dry and brittle; plants wilt and die."
          ]
        },
        {
          disease_name: "Macrophomina stem canker",
          plant_parts_affected: [
            "Stem",
            "Branches"
          ],
          symptoms: [
            "Dark lesions develop near the stem base and may extend upward, causing wilting and drying."
          ]
        }
      ]
    },
    {
      crop_name: "Blackgram (Urad)",
      category: "Pulses",
      diseases: [
        {
          disease_name: "Yellow mosaic virus",
          plant_parts_affected: [
            "Leaves",
            "Whole plant"
          ],
          symptoms: [
            "Yellow patches develop on leaves and gradually spread.",
            "Plants become stunted and produce fewer pods."
          ]
        },
        {
          disease_name: "Leaf crinkle",
          plant_parts_affected: [
            "Leaves",
            "Growing points"
          ],
          symptoms: [
            "Young leaves become crinkled, puckered, thickened, and distorted.",
            "Plant growth is reduced."
          ]
        },
        {
          disease_name: "Powdery mildew",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "White powdery patches develop on leaves and stems.",
            "Severe infection causes yellowing and premature defoliation."
          ]
        },
        {
          disease_name: "Cercospora leaf spot",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Circular to irregular brown spots develop, sometimes with gray centers and darker margins."
          ]
        },
        {
          disease_name: "Anthracnose",
          plant_parts_affected: [
            "Leaves",
            "Stems",
            "Pods"
          ],
          symptoms: [
            "Dark, sunken lesions develop on leaves and pods.",
            "Stem lesions may become elongated."
          ]
        },
        {
          disease_name: "Rust",
          plant_parts_affected: [
            "Leaves",
            "Branches",
            "Pods"
          ],
          symptoms: [
            "Pale-brown spots with reddish-brown margins develop on leaves, branches, and pods.",
            "Severe infection causes defoliation."
          ]
        },
        {
          disease_name: "Root rot and leaf blight",
          plant_parts_affected: [
            "Roots",
            "Stem",
            "Leaves"
          ],
          symptoms: [
            "Leaves yellow and droop.",
            "Dark-brown stem lesions develop, roots rot, and plants may die."
          ]
        },
        {
          disease_name: "Leaf spot",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Brown or dark lesions develop and may merge, causing premature leaf fall."
          ]
        }
      ]
    },
    {
      crop_name: "Greengram (Mungbean)",
      category: "Pulses",
      diseases: [
        {
          disease_name: "Yellow mosaic virus",
          plant_parts_affected: [
            "Leaves",
            "Whole plant"
          ],
          symptoms: [
            "Yellow mottling develops on leaves.",
            "Severe infection causes stunting and reduced flowering and pod formation."
          ]
        },
        {
          disease_name: "Anthracnose",
          plant_parts_affected: [
            "Leaves",
            "Stems",
            "Pods"
          ],
          symptoms: [
            "Circular, dark, sunken lesions develop on leaves and pods, sometimes with reddish margins."
          ]
        },
        {
          disease_name: "Cercospora leaf spot",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Brown to reddish-brown spots develop, often with darker margins.",
            "Severe infection causes defoliation."
          ]
        },
        {
          disease_name: "Powdery mildew",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "White powdery patches develop on leaves and other green parts."
          ]
        },
        {
          disease_name: "Leaf curl",
          plant_parts_affected: [
            "Leaves",
            "Petioles"
          ],
          symptoms: [
            "Young leaves curl downward, become twisted, and develop vein discoloration.",
            "Plants become stunted."
          ]
        },
        {
          disease_name: "Rust",
          plant_parts_affected: [
            "Leaves",
            "Pods"
          ],
          symptoms: [
            "Reddish-brown pustules develop, especially on the lower leaf surface."
          ]
        },
        {
          disease_name: "Root rot",
          plant_parts_affected: [
            "Roots",
            "Stem base"
          ],
          symptoms: [
            "Roots and stem base become dark and rotten.",
            "Plants wilt and may die."
          ]
        },
        {
          disease_name: "Leaf web blight",
          plant_parts_affected: [
            "Leaves",
            "Stem"
          ],
          symptoms: [
            "Brown lesions develop near the stem base and spread upward.",
            "Leaves become mottled, dry, and drop."
          ]
        }
      ]
    },
    {
      crop_name: "Cowpea",
      category: "Pulses",
      diseases: [
        {
          disease_name: "Anthracnose",
          plant_parts_affected: [
            "Leaves",
            "Stems",
            "Pods"
          ],
          symptoms: [
            "Dark, sunken lesions develop on stems and pods.",
            "Infected pods may become malformed."
          ]
        },
        {
          disease_name: "Cercospora leaf spot",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Small brown spots develop and enlarge into irregular lesions.",
            "Severe infection causes leaf drying."
          ]
        },
        {
          disease_name: "Powdery mildew",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "White powdery fungal growth develops on leaves and stems."
          ]
        },
        {
          disease_name: "Rust",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Small reddish-brown pustules develop on leaves and may cause premature defoliation."
          ]
        },
        {
          disease_name: "Mosaic disease",
          plant_parts_affected: [
            "Leaves",
            "Whole plant"
          ],
          symptoms: [
            "Light and dark green mosaic patterns develop on leaves.",
            "Leaves may become distorted and plants stunted."
          ]
        },
        {
          disease_name: "Root rot",
          plant_parts_affected: [
            "Roots",
            "Stem base"
          ],
          symptoms: [
            "Roots become discolored and rotten.",
            "Plants wilt and may die."
          ]
        },
        {
          disease_name: "Bacterial blight",
          plant_parts_affected: [
            "Leaves",
            "Stems",
            "Pods"
          ],
          symptoms: [
            "Water-soaked lesions develop on leaves and may spread to stems and pods."
          ]
        },
        {
          disease_name: "Web blight",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "Brown lesions spread across leaves and stems, sometimes with fungal web-like growth."
          ]
        }
      ]
    },
    {
      crop_name: "Chickpea (Bengal gram)",
      category: "Pulses",
      diseases: [
        {
          disease_name: "Fusarium wilt",
          plant_parts_affected: [
            "Leaves",
            "Stem",
            "Roots"
          ],
          symptoms: [
            "Leaves turn yellow, droop, and dry.",
            "Vascular tissues show brown discoloration."
          ]
        },
        {
          disease_name: "Ascochyta blight",
          plant_parts_affected: [
            "Leaves",
            "Stems",
            "Pods"
          ],
          symptoms: [
            "Water-soaked spots develop and turn brown.",
            "Lesions enlarge and may girdle stems, causing branch drying."
          ]
        },
        {
          disease_name: "Botrytis gray mold",
          plant_parts_affected: [
            "Leaves",
            "Flowers",
            "Stems"
          ],
          symptoms: [
            "Gray fungal growth develops on infected tissues.",
            "Flowers and leaves shed; stems may rot and break."
          ]
        },
        {
          disease_name: "Alternaria leaf blight",
          plant_parts_affected: [
            "Leaves",
            "Pods"
          ],
          symptoms: [
            "Small circular purple or brown lesions develop on leaflets.",
            "Infected pods may become dark or blackish."
          ]
        },
        {
          disease_name: "Collar rot",
          plant_parts_affected: [
            "Collar",
            "Roots"
          ],
          symptoms: [
            "The stem base becomes brown and rotted.",
            "Seedlings wilt and may die."
          ]
        },
        {
          disease_name: "Dry root rot",
          plant_parts_affected: [
            "Roots",
            "Stem base"
          ],
          symptoms: [
            "Roots become dry and brittle; plants wilt and die."
          ]
        },
        {
          disease_name: "Powdery mildew",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "White powdery growth develops on leaves and stems, causing yellowing and premature leaf fall."
          ]
        }
      ]
    },
    {
      crop_name: "Soybean",
      category: "Pulses",
      diseases: [
        {
          disease_name: "Rust",
          plant_parts_affected: [
            "Leaves",
            "Petioles",
            "Pods"
          ],
          symptoms: [
            "Small brown to reddish-brown lesions develop, especially on the lower leaf surface.",
            "Severe infection causes leaf necrosis."
          ]
        },
        {
          disease_name: "Yellow mosaic",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Bright yellow mottling develops on leaves, sometimes along major veins."
          ]
        },
        {
          disease_name: "Soybean mosaic",
          plant_parts_affected: [
            "Leaves",
            "Seeds"
          ],
          symptoms: [
            "Leaves become puckered, crinkled, and distorted.",
            "Seeds may become mottled."
          ]
        },
        {
          disease_name: "Bacterial blight",
          plant_parts_affected: [
            "Leaves",
            "Stems",
            "Petioles"
          ],
          symptoms: [
            "Small, angular, water-soaked spots develop on leaves and enlarge into irregular dead areas."
          ]
        },
        {
          disease_name: "Anthracnose",
          plant_parts_affected: [
            "Leaves",
            "Stems",
            "Pods",
            "Seeds"
          ],
          symptoms: [
            "Brown, sunken lesions develop on leaves, stems, and pods.",
            "Infected seeds may become shriveled and discolored."
          ]
        },
        {
          disease_name: "Cercospora leaf blight",
          plant_parts_affected: [
            "Leaves",
            "Stems",
            "Petioles"
          ],
          symptoms: [
            "Leaves develop reddish-purple discoloration, followed by chlorosis, necrosis, and premature defoliation."
          ]
        },
        {
          disease_name: "Charcoal rot",
          plant_parts_affected: [
            "Roots",
            "Stem base"
          ],
          symptoms: [
            "Lower leaves turn yellow and wilt.",
            "Stems and roots develop gray discoloration and black specks."
          ]
        },
        {
          disease_name: "Rhizoctonia aerial blight",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "Water-soaked lesions turn brown and spread.",
            "Web-like fungal growth may develop under humid conditions."
          ]
        },
        {
          disease_name: "Alternaria leaf spot",
          plant_parts_affected: [
            "Leaves",
            "Seeds"
          ],
          symptoms: [
            "Brown necrotic spots with concentric rings develop on leaves.",
            "Seeds may become small and shriveled."
          ]
        },
        {
          disease_name: "Collar rot",
          plant_parts_affected: [
            "Stem base",
            "Roots"
          ],
          symptoms: [
            "Brown lesions and fungal growth develop near the collar, leading to wilting and plant death."
          ]
        }
      ]
    },
    {
      crop_name: "Sunflower",
      category: "Oilseeds",
      diseases: [
        {
          disease_name: "Alternaria leaf blight",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "Dark-brown spots develop and enlarge into irregular necrotic lesions."
          ]
        },
        {
          disease_name: "Downy mildew",
          plant_parts_affected: [
            "Leaves",
            "Roots",
            "Stem"
          ],
          symptoms: [
            "Seedlings become stunted and leaves develop yellowing and mottling.",
            "White downy growth may appear on the lower leaf surface."
          ]
        },
        {
          disease_name: "Rust",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "Reddish-brown pustules develop on leaves and stems."
          ]
        },
        {
          disease_name: "Powdery mildew",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "White powdery growth develops on leaf surfaces."
          ]
        },
        {
          disease_name: "Necrosis or leaf spot",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Brown to black necrotic spots develop and may merge into large dead areas."
          ]
        },
        {
          disease_name: "Sclerotinia wilt and rot",
          plant_parts_affected: [
            "Stem base",
            "Roots",
            "Head"
          ],
          symptoms: [
            "White fungal growth develops on infected tissues.",
            "Stems and roots rot, and plants wilt."
          ]
        },
        {
          disease_name: "Charcoal rot",
          plant_parts_affected: [
            "Stem base",
            "Roots"
          ],
          symptoms: [
            "Stem tissues become grayish and dry.",
            "Roots and lower stems may develop black specks."
          ]
        },
        {
          disease_name: "Head rot",
          plant_parts_affected: [
            "Flower head"
          ],
          symptoms: [
            "The flower head develops brown, water-soaked lesions and rots.",
            "Seeds may become discolored or fail to develop."
          ]
        }
      ]
    },
    {
      crop_name: "Groundnut",
      category: "Oilseeds",
      diseases: [
        {
          disease_name: "Early leaf spot",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Brown circular spots develop, often surrounded by yellow halos."
          ]
        },
        {
          disease_name: "Late leaf spot",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Dark-brown to black spots develop, often more prominent on the lower leaf surface."
          ]
        },
        {
          disease_name: "Rust",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Small orange-brown pustules develop on leaves and release rust-colored spores."
          ]
        },
        {
          disease_name: "Stem rot",
          plant_parts_affected: [
            "Stem base",
            "Roots"
          ],
          symptoms: [
            "White fungal growth develops near the soil line.",
            "Stems and roots rot, and plants wilt."
          ]
        },
        {
          disease_name: "Collar rot",
          plant_parts_affected: [
            "Collar",
            "Seedlings"
          ],
          symptoms: [
            "The collar region becomes brown and rotted, causing seedlings to wilt and die."
          ]
        },
        {
          disease_name: "Tikka disease",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Leaf spots develop and cause premature defoliation."
          ]
        },
        {
          disease_name: "Kalahasti malady",
          plant_parts_affected: [
            "Roots",
            "Pegs",
            "Pods"
          ],
          symptoms: [
            "Plants become stunted.",
            "Pegs and developing pods develop brown lesions; pod surfaces may become blackened."
          ]
        }
      ]
    },
    {
      crop_name: "Castor",
      category: "Oilseeds",
      diseases: [
        {
          disease_name: "Alternaria leaf spot",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Brown to dark-brown spots develop, often with concentric rings."
          ]
        },
        {
          disease_name: "Gray mold",
          plant_parts_affected: [
            "Inflorescence",
            "Capsules"
          ],
          symptoms: [
            "Gray fungal growth develops on infected flower clusters and capsules, leading to rotting."
          ]
        },
        {
          disease_name: "Root rot",
          plant_parts_affected: [
            "Roots",
            "Stem base"
          ],
          symptoms: [
            "Roots become discolored and rotten; plants wilt and may die."
          ]
        },
        {
          disease_name: "Bacterial leaf spot",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Small, water-soaked spots develop and turn brown or black."
          ]
        },
        {
          disease_name: "Powdery mildew",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "White powdery growth develops on leaf surfaces."
          ]
        },
        {
          disease_name: "Wilt",
          plant_parts_affected: [
            "Leaves",
            "Stems",
            "Roots"
          ],
          symptoms: [
            "Leaves yellow and wilt.",
            "Vascular tissues may show brown discoloration."
          ]
        }
      ]
    },
    {
      crop_name: "Gingelly (Sesame)",
      category: "Oilseeds",
      diseases: [
        {
          disease_name: "Alternaria leaf spot",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "Small, dark-brown, water-soaked spots develop, often with concentric rings."
          ]
        },
        {
          disease_name: "Bacterial blight",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "Water-soaked spots develop on leaves and turn brown.",
            "Severe infection causes drying and defoliation."
          ]
        },
        {
          disease_name: "Phyllody",
          plant_parts_affected: [
            "Flowers",
            "Inflorescence"
          ],
          symptoms: [
            "Floral parts become leafy structures.",
            "Flowers become malformed; abnormal branching may produce a witches'-broom appearance."
          ]
        },
        {
          disease_name: "Stem and root rot",
          plant_parts_affected: [
            "Stem base",
            "Roots",
            "Capsules"
          ],
          symptoms: [
            "The stem base turns black and roots become brittle.",
            "Plants wilt; capsules may turn black and open prematurely."
          ]
        },
        {
          disease_name: "Powdery mildew",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "White powdery growth develops on leaves and may spread across the leaf surface."
          ]
        },
        {
          disease_name: "Cercospora leaf spot",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Brown circular spots develop and may enlarge into irregular lesions."
          ]
        }
      ]
    },
    {
      crop_name: "Rapeseed and Mustard",
      category: "Oilseeds",
      diseases: [
        {
          disease_name: "Alternaria blight",
          plant_parts_affected: [
            "Leaves",
            "Stems",
            "Pods"
          ],
          symptoms: [
            "Dark-brown spots with concentric rings develop on leaves and pods."
          ]
        },
        {
          disease_name: "White rust",
          plant_parts_affected: [
            "Leaves",
            "Stems",
            "Inflorescence"
          ],
          symptoms: [
            "White blister-like pustules develop on leaves and stems.",
            "Severe infection causes abnormal floral structures."
          ]
        },
        {
          disease_name: "Downy mildew",
          plant_parts_affected: [
            "Leaves",
            "Inflorescence"
          ],
          symptoms: [
            "Yellow patches develop on leaves, with downy growth on the lower surface."
          ]
        },
        {
          disease_name: "Powdery mildew",
          plant_parts_affected: [
            "Leaves",
            "Stems",
            "Pods"
          ],
          symptoms: [
            "White powdery patches develop on leaves and other green parts."
          ]
        },
        {
          disease_name: "Sclerotinia stem rot",
          plant_parts_affected: [
            "Stem base",
            "Branches"
          ],
          symptoms: [
            "Water-soaked lesions develop on stems, followed by white fungal growth and stem rot."
          ]
        },
        {
          disease_name: "Black rot",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "V-shaped yellow lesions develop from leaf margins toward the midrib.",
            "Vascular tissues may become discolored."
          ]
        }
      ]
    },
    {
      crop_name: "Safflower",
      category: "Oilseeds",
      diseases: [
        {
          disease_name: "Alternaria leaf spot",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Brown circular spots develop and may merge into large necrotic areas."
          ]
        },
        {
          disease_name: "Rust",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "Reddish-brown pustules develop on leaves and stems."
          ]
        },
        {
          disease_name: "Wilt",
          plant_parts_affected: [
            "Roots",
            "Stem",
            "Leaves"
          ],
          symptoms: [
            "Leaves turn yellow and wilt.",
            "Vascular tissues show brown discoloration."
          ]
        },
        {
          disease_name: "Root rot",
          plant_parts_affected: [
            "Roots",
            "Stem base"
          ],
          symptoms: [
            "Roots become dark and rotten, leading to wilting and plant death."
          ]
        },
        {
          disease_name: "Powdery mildew",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "White powdery growth develops on leaf surfaces."
          ]
        },
        {
          disease_name: "Phytophthora root rot",
          plant_parts_affected: [
            "Roots",
            "Stem base"
          ],
          symptoms: [
            "Roots and lower stem become water-soaked and rotten.",
            "Plants wilt and may collapse under favorable conditions."
          ]
        }
      ]
    },
    {
      crop_name: "Cotton",
      category: "Cash crops",
      diseases: [
        {
          disease_name: "Fusarium wilt",
          plant_parts_affected: [
            "Leaves",
            "Roots",
            "Vascular tissues"
          ],
          symptoms: [
            "Leaves turn yellow, lose turgidity, and eventually become brown and fall.",
            "Roots may be stunted."
          ]
        },
        {
          disease_name: "Verticillium wilt",
          plant_parts_affected: [
            "Leaves",
            "Vascular tissues"
          ],
          symptoms: [
            "Leaves develop yellowing, often between veins, followed by wilting and drying."
          ]
        },
        {
          disease_name: "Root rot",
          plant_parts_affected: [
            "Roots",
            "Stem base"
          ],
          symptoms: [
            "Roots become discolored and rotten.",
            "Plants wilt, become stunted, and may die in patches."
          ]
        },
        {
          disease_name: "Grey or areolate mildew",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Angular, pale, translucent spots develop between veins, often on older leaves."
          ]
        },
        {
          disease_name: "Boll rot",
          plant_parts_affected: [
            "Bolls"
          ],
          symptoms: [
            "Bolls develop water-soaked or discolored lesions, followed by rotting and premature shedding."
          ]
        },
        {
          disease_name: "Alternaria leaf blight",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Small, pale-brown to dark-brown spots develop and enlarge.",
            "Severely affected leaves dry and fall."
          ]
        },
        {
          disease_name: "Anthracnose",
          plant_parts_affected: [
            "Seedlings",
            "Stems",
            "Bolls"
          ],
          symptoms: [
            "Reddish or brown lesions develop on seedlings and bolls.",
            "Infected bolls may rot; lint and seeds become discolored."
          ]
        },
        {
          disease_name: "Bacterial blight",
          plant_parts_affected: [
            "Leaves",
            "Stems",
            "Bolls"
          ],
          symptoms: [
            "Water-soaked lesions develop on leaves, often with angular margins.",
            "Stem lesions and boll infection may also occur."
          ]
        },
        {
          disease_name: "Cercospora leaf spot",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Circular to irregular brown spots develop, sometimes with darker margins."
          ]
        },
        {
          disease_name: "Tobacco streak virus",
          plant_parts_affected: [
            "Leaves",
            "Stems"
          ],
          symptoms: [
            "Necrotic lesions, streaking, and tissue death may develop on affected plant parts."
          ]
        }
      ]
    },
    {
      crop_name: "Sugarcane",
      category: "Cash crops",
      diseases: [
        {
          disease_name: "Red rot",
          plant_parts_affected: [
            "Stalks",
            "Leaves"
          ],
          symptoms: [
            "Leaves wither and droop.",
            "Internal stalk tissues turn red, often with characteristic white patches across the reddened tissue."
          ]
        },
        {
          disease_name: "Smut",
          plant_parts_affected: [
            "Growing point",
            "Leaves"
          ],
          symptoms: [
            "A black, whip-like structure emerges from the growing point.",
            "Plants may become thin and produce excessive tillers."
          ]
        },
        {
          disease_name: "Rust",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Small reddish-brown or brown pustules develop on leaves."
          ]
        },
        {
          disease_name: "Ratoon stunting",
          plant_parts_affected: [
            "Stalks",
            "Whole plant"
          ],
          symptoms: [
            "Plants become stunted, with reduced stalk growth and poor ratoon development."
          ]
        },
        {
          disease_name: "Wilt",
          plant_parts_affected: [
            "Stalks",
            "Leaves"
          ],
          symptoms: [
            "Leaves turn yellow and dry.",
            "Internal pith tissues show discoloration, often with longitudinal streaks."
          ]
        },
        {
          disease_name: "Sett rot",
          plant_parts_affected: [
            "Setts",
            "Shoots"
          ],
          symptoms: [
            "Planted setts rot before germination, or emerging shoots wilt and die.",
            "A pineapple-like odor may be present."
          ]
        },
        {
          disease_name: "Grassy shoot disease",
          plant_parts_affected: [
            "Leaves",
            "Whole plant"
          ],
          symptoms: [
            "Excessive tillering produces a grassy appearance, with narrow, pale leaves and poor stalk development."
          ]
        },
        {
          disease_name: "Pokkah boeng",
          plant_parts_affected: [
            "Leaves",
            "Growing point",
            "Stalk"
          ],
          symptoms: [
            "Leaves become chlorotic, wrinkled, twisted, and shortened.",
            "Severe infection causes top rot and shortened internodes."
          ]
        }
      ]
    },
    {
      crop_name: "Tobacco",
      category: "Cash crops",
      diseases: [
        {
          disease_name: "Damping-off",
          plant_parts_affected: [
            "Seedlings",
            "Stem base"
          ],
          symptoms: [
            "Seedlings rot at the soil surface and collapse.",
            "Some infected seedlings die before emergence."
          ]
        },
        {
          disease_name: "Anthracnose",
          plant_parts_affected: [
            "Leaves",
            "Midrib",
            "Petiole",
            "Stem"
          ],
          symptoms: [
            "Small, pale-brown circular spots develop on leaves.",
            "Dark, sunken lesions may appear on the midrib, petiole, and stem."
          ]
        },
        {
          disease_name: "Black shank",
          plant_parts_affected: [
            "Roots",
            "Stem base",
            "Leaves"
          ],
          symptoms: [
            "The stem base becomes dark and rotted.",
            "Leaves yellow and wilt, and plants may collapse."
          ]
        },
        {
          disease_name: "Brown spot",
          plant_parts_affected: [
            "Leaves",
            "Petioles",
            "Stalks"
          ],
          symptoms: [
            "Brown circular spots develop, often with concentric markings.",
            "Lesions enlarge and merge, causing extensive leaf damage."
          ]
        },
        {
          disease_name: "Blue mold",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "Yellowish lesions develop on leaves, with bluish-gray or purplish downy growth on the lower surface."
          ]
        },
        {
          disease_name: "Powdery mildew",
          plant_parts_affected: [
            "Leaves"
          ],
          symptoms: [
            "White powdery growth develops on leaves and may cause premature leaf drying."
          ]
        },
        {
          disease_name: "Mosaic",
          plant_parts_affected: [
            "Leaves",
            "Whole plant"
          ],
          symptoms: [
            "Light and dark green mosaic patterns develop.",
            "Leaves may become distorted and plants stunted."
          ]
        },
        {
          disease_name: "Root-knot nematode",
          plant_parts_affected: [
            "Roots"
          ],
          symptoms: [
            "Root galls develop, and plants become stunted, yellow, and poorly developed."
          ]
        }
      ]
    }
  ]
};

// src/features/field-diagnosis/data/fieldDiagnosisData.ts
var UNKNOWN_STAGE = "UNKNOWN";
var FD_CROPS = [
  { id: "paddy", name: "Paddy (Rice)", category: "Cereals & Millets", image: "/images/paddy.webp" },
  { id: "maize", name: "Maize", category: "Cereals & Millets", image: "/images/maize.webp" },
  { id: "sorghum", name: "Sorghum", category: "Cereals & Millets" },
  { id: "pearl-millet", name: "Pearl Millet", category: "Cereals & Millets" },
  { id: "wheat", name: "Wheat", category: "Cereals & Millets" },
  { id: "ragi", name: "Ragi", category: "Cereals & Millets" },
  { id: "redgram", name: "Redgram", category: "Pulses", image: "/images/pulses.webp" },
  { id: "greengram", name: "Greengram", category: "Pulses", image: "/images/greengram.webp" },
  { id: "blackgram", name: "Blackgram", category: "Pulses", image: "/images/pulses.webp" },
  { id: "cowpea", name: "Cowpea", category: "Pulses", image: "/images/pulses.webp" },
  { id: "chickpea", name: "Chickpea", category: "Pulses", image: "/images/pulses.webp" },
  { id: "soybean", name: "Soybean", category: "Pulses", image: "/images/pulses.webp" },
  { id: "groundnut", name: "Groundnut", category: "Oilseeds", image: "/images/groundnut.webp" },
  { id: "sunflower", name: "Sunflower", category: "Oilseeds", image: "/images/oilseeds.webp" },
  { id: "castor", name: "Castor", category: "Oilseeds", image: "/images/oilseeds.webp" },
  { id: "sesame", name: "Sesame", category: "Oilseeds", image: "/images/sesamum.webp" },
  { id: "rapeseed-mustard", name: "Rapeseed & Mustard", category: "Oilseeds", image: "/images/oilseeds.webp" },
  { id: "safflower", name: "Safflower", category: "Oilseeds", image: "/images/oilseeds.webp" },
  { id: "cotton", name: "Cotton", category: "Cash Crops", image: "/images/cotton.webp" },
  { id: "sugarcane", name: "Sugarcane", category: "Cash Crops" },
  { id: "tobacco", name: "Tobacco", category: "Cash Crops" }
];
var PADDY_STAGES = [
  { code: "GERMINATION", label: "Seed Germination" },
  { code: "NURSERY", label: "Nursery" },
  { code: "SEEDLING", label: "Seedling" },
  { code: "EARLY_TILLERING", label: "Early Tillering" },
  { code: "ACTIVE_TILLERING", label: "Active Tillering" },
  { code: "MAX_TILLERING", label: "Maximum Tillering" },
  { code: "PANICLE_INITIATION", label: "Panicle Initiation" },
  { code: "BOOTING", label: "Booting" },
  { code: "HEADING", label: "Heading" },
  { code: "FLOWERING", label: "Flowering" },
  { code: "GRAIN_FILLING", label: "Grain Filling" },
  { code: "MATURITY", label: "Maturity" }
];
var COTTON_STAGES = [
  { code: "SEEDLING", label: "Seedling" },
  { code: "VEGETATIVE", label: "Vegetative" },
  { code: "SQUARING", label: "Squaring" },
  { code: "FLOWERING", label: "Flowering" },
  { code: "BOLL_FORMATION", label: "Boll Formation" },
  { code: "BOLL_DEVELOPMENT", label: "Boll Development" },
  { code: "BOLL_OPENING", label: "Boll Opening" },
  { code: "HARVEST_MATURITY", label: "Harvest Maturity" }
];
var GENERIC_STAGES = [
  { code: "GERMINATION", label: "Germination" },
  { code: "SEEDLING", label: "Seedling" },
  { code: "VEGETATIVE", label: "Vegetative Growth" },
  { code: "FLOWERING", label: "Flowering" },
  { code: "POD_FRUIT_FORMATION", label: "Pod / Fruit Formation" },
  { code: "MATURITY", label: "Maturity" }
];
var MAIZE_STAGES = [
  { code: "SEEDLING", label: "Seedling" },
  { code: "VEGETATIVE", label: "Vegetative Growth" },
  { code: "TASSELING", label: "Tasseling" },
  { code: "SILKING", label: "Silking" },
  { code: "GRAIN_FILLING", label: "Grain Filling" },
  { code: "MATURITY", label: "Maturity" }
];
function getGrowthStages(cropId) {
  switch (cropId) {
    case "paddy":
      return PADDY_STAGES;
    case "cotton":
      return COTTON_STAGES;
    case "maize":
    case "sorghum":
    case "pearl-millet":
    case "wheat":
    case "ragi":
      return MAIZE_STAGES;
    default:
      return GENERIC_STAGES;
  }
}
var FD_PLANT_PARTS = [
  { code: "ROOT", label: "Root" },
  { code: "COLLAR", label: "Collar Region" },
  { code: "HYPOCOTYL", label: "Hypocotyl" },
  { code: "STEM_BASE", label: "Stem Base" },
  { code: "STEM", label: "Stem" },
  { code: "BRANCH", label: "Branches" },
  { code: "VASCULAR", label: "Vascular Tissue" },
  { code: "NODE", label: "Node" },
  { code: "PETIOLE", label: "Petiole" },
  { code: "LEAF", label: "Leaf" },
  { code: "LEAF_BLADE", label: "Leaf Blade" },
  { code: "LEAF_TIP", label: "Leaf Tip" },
  { code: "LEAF_MARGIN", label: "Leaf Margin" },
  { code: "LEAF_VEIN", label: "Leaf Veins" },
  { code: "LEAF_SHEATH", label: "Leaf Sheath" },
  { code: "LOWER_SHEATH", label: "Lower Leaf Sheath" },
  { code: "UPPER_SHEATH", label: "Upper Leaf Sheath" },
  { code: "FLAG_LEAF", label: "Flag Leaf" },
  { code: "GROWING_POINT", label: "Growing Point" },
  { code: "FLOWER", label: "Flower" },
  { code: "SQUARE", label: "Squares / Flower Buds" },
  { code: "BUD", label: "Bud" },
  { code: "FRUIT", label: "Fruit" },
  { code: "BOLL", label: "Boll" },
  { code: "YOUNG_BOLL", label: "Young Bolls" },
  { code: "MATURE_BOLL", label: "Mature Bolls" },
  { code: "BOLL_SURFACE", label: "Boll Surface" },
  { code: "BOLL_LINT", label: "Boll Interior / Lint" },
  { code: "POD", label: "Pod" },
  { code: "PANICLE", label: "Panicle" },
  { code: "SPIKELET", label: "Spikelets" },
  { code: "NECK", label: "Panicle Neck" },
  { code: "GRAIN", label: "Grain" },
  { code: "SEED", label: "Seed" },
  { code: "SEEDLING", label: "Seedling" },
  { code: "WHOLE_PLANT", label: "Whole Plant" }
];
var PART_BY_CODE = new Map(FD_PLANT_PARTS.map((p) => [p.code, p]));
var PADDY_PART_CODES = ["ROOT", "SEED", "SEEDLING", "STEM_BASE", "NODE", "LOWER_SHEATH", "UPPER_SHEATH", "LEAF_BLADE", "LEAF_TIP", "LEAF_MARGIN", "FLAG_LEAF", "NECK", "PANICLE", "SPIKELET", "GRAIN", "WHOLE_PLANT"];
var COTTON_PART_CODES = ["ROOT", "SEED", "SEEDLING", "COLLAR", "HYPOCOTYL", "STEM", "BRANCH", "VASCULAR", "LEAF", "LEAF_MARGIN", "LEAF_VEIN", "PETIOLE", "GROWING_POINT", "SQUARE", "FLOWER", "YOUNG_BOLL", "MATURE_BOLL", "BOLL_SURFACE", "BOLL_LINT", "WHOLE_PLANT"];
var GENERIC_PART_CODES = ["ROOT", "COLLAR", "STEM_BASE", "STEM", "NODE", "PETIOLE", "LEAF", "LEAF_TIP", "LEAF_MARGIN", "LEAF_VEIN", "LEAF_SHEATH", "GROWING_POINT", "FLOWER", "BUD", "FRUIT", "BOLL", "POD", "PANICLE", "NECK", "GRAIN", "SEED", "SEEDLING", "WHOLE_PLANT"];
function getPlantParts(cropId) {
  const codes = cropId === "paddy" ? PADDY_PART_CODES : cropId === "cotton" ? COTTON_PART_CODES : GENERIC_PART_CODES;
  return codes.map((c) => PART_BY_CODE.get(c)).filter(Boolean);
}
var PART_FAMILY = {
  ROOT: ["ROOT"],
  COLLAR: ["COLLAR", "STEM_BASE", "HYPOCOTYL"],
  HYPOCOTYL: ["COLLAR", "STEM_BASE", "HYPOCOTYL"],
  STEM_BASE: ["COLLAR", "STEM_BASE", "HYPOCOTYL"],
  STEM: ["STEM", "STEM_BASE", "NODE", "BRANCH", "VASCULAR"],
  BRANCH: ["STEM", "BRANCH"],
  VASCULAR: ["STEM", "VASCULAR"],
  NODE: ["STEM", "NODE"],
  PETIOLE: ["PETIOLE", "LEAF"],
  LEAF: ["LEAF", "LEAF_BLADE", "FLAG_LEAF", "LEAF_TIP", "LEAF_MARGIN", "LEAF_VEIN", "PETIOLE"],
  LEAF_BLADE: ["LEAF", "LEAF_BLADE", "FLAG_LEAF"],
  LEAF_TIP: ["LEAF", "LEAF_TIP"],
  LEAF_MARGIN: ["LEAF", "LEAF_MARGIN"],
  LEAF_VEIN: ["LEAF", "LEAF_VEIN"],
  LEAF_SHEATH: ["LEAF_SHEATH", "LOWER_SHEATH", "UPPER_SHEATH"],
  LOWER_SHEATH: ["LEAF_SHEATH", "LOWER_SHEATH"],
  UPPER_SHEATH: ["LEAF_SHEATH", "UPPER_SHEATH"],
  FLAG_LEAF: ["LEAF", "LEAF_BLADE", "FLAG_LEAF"],
  GROWING_POINT: ["GROWING_POINT", "WHOLE_PLANT"],
  FLOWER: ["FLOWER", "BUD", "SQUARE"],
  SQUARE: ["FLOWER", "BUD", "SQUARE"],
  BUD: ["FLOWER", "BUD", "SQUARE"],
  FRUIT: ["FRUIT"],
  BOLL: ["BOLL", "YOUNG_BOLL", "MATURE_BOLL", "BOLL_SURFACE", "BOLL_LINT"],
  YOUNG_BOLL: ["BOLL", "YOUNG_BOLL", "BOLL_SURFACE"],
  MATURE_BOLL: ["BOLL", "MATURE_BOLL", "BOLL_SURFACE"],
  BOLL_SURFACE: ["BOLL", "BOLL_SURFACE"],
  BOLL_LINT: ["BOLL", "BOLL_LINT"],
  POD: ["POD"],
  PANICLE: ["PANICLE", "NECK", "SPIKELET"],
  SPIKELET: ["PANICLE", "SPIKELET", "GRAIN"],
  NECK: ["PANICLE", "NECK"],
  GRAIN: ["GRAIN", "SPIKELET", "SEED"],
  SEED: ["SEED", "GRAIN"],
  SEEDLING: ["SEEDLING", "WHOLE_PLANT"],
  WHOLE_PLANT: ["WHOLE_PLANT"]
};
function expandPartSelection(selected) {
  const out = new Set(selected);
  for (const code of selected) {
    for (const p of PART_FAMILY[code] || [code]) out.add(p);
  }
  if (selected.length > 0) out.add("WHOLE_PLANT");
  return out;
}
function plantPartLabel(code) {
  return FD_PLANT_PARTS.find((p) => p.code === code)?.label || code;
}
var FD_TRAIT_QUESTIONS = [
  { key: "lesionShape", label: "Lesion shape", options: ["Spindle-shaped", "Diamond-shaped", "Circular", "Oval", "Elliptical", "Linear / streak", "Irregular", "Elongated", "No distinct lesion", "Unknown"] },
  { key: "lesionCentre", label: "Lesion colour", options: ["Pale green", "Yellow", "Straw-yellow", "Brown", "Dark brown", "Reddish-brown", "Grey / Ashy", "Whitish-grey", "Black", "Translucent", "Unknown"] },
  { key: "lesionMargin", label: "Lesion margin", options: ["Dark brown margin", "Reddish-brown margin", "Yellow halo", "Wavy margin", "Diffuse margin", "Distinct margin", "No distinct margin", "Unknown"] },
  { key: "distribution", label: "Distribution in field", options: ["Single plant", "Scattered plants", "Localized patches", "Multiple patches", "Widespread across field"] },
  { key: "severity", label: "Severity", options: ["Absent", "Mild", "Moderate", "Severe", "Very severe"] }
];
var TRAIT_WEIGHT = 3;
var TRAIT_EXCLUDED_ANSWERS = /* @__PURE__ */ new Set(["Unknown", "Absent", "No distinct lesion", "No distinct margin"]);
var TNAU_PORTAL = "https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_diseases_agri.html";
var CROP_NAME_TO_ID = {
  "rice (paddy)": "paddy",
  "sorghum (jowar)": "sorghum",
  maize: "maize",
  "cumbu (pearl millet)": "pearl-millet",
  wheat: "wheat",
  "ragi (finger millet)": "ragi",
  "redgram (pigeon pea)": "redgram",
  "blackgram (urad)": "blackgram",
  "greengram (mungbean)": "greengram",
  cowpea: "cowpea",
  "chickpea (bengal gram)": "chickpea",
  soybean: "soybean",
  sunflower: "sunflower",
  groundnut: "groundnut",
  castor: "castor",
  "gingelly (sesame)": "sesame",
  "rapeseed and mustard": "rapeseed-mustard",
  safflower: "safflower",
  cotton: "cotton",
  sugarcane: "sugarcane",
  tobacco: "tobacco"
};
var PART_NAME_MAP = {
  leaves: "LEAF",
  leaf: "LEAF",
  midrib: "LEAF",
  "leaf sheaths": "LEAF_SHEATH",
  "leaf sheath": "LEAF_SHEATH",
  "panicle neck": "NECK",
  neck: "NECK",
  panicle: "PANICLE",
  panicles: "PANICLE",
  "finger-like spikes": "PANICLE",
  ear: "PANICLE",
  ears: "PANICLE",
  grains: "GRAIN",
  grain: "GRAIN",
  seeds: "SEED",
  seed: "SEED",
  setts: "SEED",
  "whole plant": "WHOLE_PLANT",
  seedlings: "SEEDLING",
  seedling: "SEEDLING",
  shoots: "SEEDLING",
  stem: "STEM",
  stems: "STEM",
  stalks: "STEM",
  stalk: "STEM",
  branches: "BRANCH",
  branch: "BRANCH",
  "vascular tissues": "VASCULAR",
  "vascular tissue": "VASCULAR",
  "main stem vascular tissue": "VASCULAR",
  "stem base": "STEM_BASE",
  "basal stem": "STEM_BASE",
  "stem nodes": "NODE",
  nodes: "NODE",
  hypocotyl: "HYPOCOTYL",
  "root collar": "COLLAR",
  collar: "COLLAR",
  roots: "ROOT",
  root: "ROOT",
  pegs: "ROOT",
  pods: "POD",
  pod: "POD",
  capsules: "FRUIT",
  bolls: "BOLL",
  flowers: "FLOWER",
  flower: "FLOWER",
  "flower head": "FLOWER",
  head: "FLOWER",
  inflorescence: "FLOWER",
  tassels: "FLOWER",
  petioles: "PETIOLE",
  petiole: "PETIOLE",
  "leaf petiole": "PETIOLE",
  "growing point": "GROWING_POINT",
  "growing points": "GROWING_POINT",
  "leaf blade": "LEAF_BLADE",
  "leaf blades": "LEAF_BLADE",
  "leaf tip": "LEAF_TIP",
  "leaf margin": "LEAF_MARGIN",
  "leaf margins": "LEAF_MARGIN",
  "leaf veins": "LEAF_VEIN",
  veins: "LEAF_VEIN",
  "lower leaf sheath": "LOWER_SHEATH",
  "upper leaf sheath": "UPPER_SHEATH",
  "flag leaf": "FLAG_LEAF",
  spikelets: "SPIKELET",
  spikelet: "SPIKELET",
  "flower buds": "SQUARE",
  "flower buds / squares": "SQUARE",
  squares: "SQUARE",
  buds: "BUD",
  "young bolls": "YOUNG_BOLL",
  "mature bolls": "MATURE_BOLL",
  "boll surface": "BOLL_SURFACE",
  "boll interior": "BOLL_LINT",
  "boll interior / lint": "BOLL_LINT",
  lint: "BOLL_LINT",
  "young leaves": "LEAF",
  "lower stem": "STEM_BASE",
  "root system": "ROOT"
};
function mapPart(name) {
  return PART_NAME_MAP[name.trim().toLowerCase()] || "WHOLE_PLANT";
}
var SYMPTOM_PART_PATTERNS = [
  [/\broot[s]?\b|\brhizosphere\b/i, "ROOT"],
  [/\broot collar\b|\bcollar\b/i, "COLLAR"],
  [/\bhypocotyl\b/i, "HYPOCOTYL"],
  [/\bstem base\b|\bbasal stem\b/i, "STEM_BASE"],
  [/\bstem node[s]?\b|\bnode[s]?\b/i, "NODE"],
  [/\bbranch(?:es)?\b/i, "BRANCH"],
  [/\bvascular\b/i, "VASCULAR"],
  [/\bstem[s]?\b|\bstalk[s]?\b/i, "STEM"],
  [/\bflag leaf\b|\bflag leaves\b/i, "FLAG_LEAF"],
  [/\bleaf tip[s]?\b|\bleaf apex\b/i, "LEAF_TIP"],
  [/\bleaf margin[s]?\b/i, "LEAF_MARGIN"],
  [/\bleaf vein[s]?\b|\bvein[s]?\b|\bveinlet[s]?\b|\bmidrib[s]?\b/i, "LEAF_VEIN"],
  [/\bleaf sheath\b|\bsheath\b|\bsheaths\b/i, "LEAF_SHEATH"],
  [/\bleaf blade[s]?\b|\bleaf\b|\bleaves\b|\bleaflet[s]?\b|\bfoliage\b/i, "LEAF"],
  [/\bpetiole[s]?\b/i, "PETIOLE"],
  [/\bgrowing point[s]?\b|\bshoot tip[s]?\b/i, "GROWING_POINT"],
  [/\bseedling[s]?\b|\bshoot[s]?\b/i, "SEEDLING"],
  [/\bflower[s]?\b|\bblossom[s]?\b|\binflorescence\b|\btassel[s]?\b|\bflower head\b/i, "FLOWER"],
  [/\bsquare[s]?\b|\bflower bud[s]?\b/i, "SQUARE"],
  [/\bbud[s]?\b/i, "BUD"],
  [/\bfruit[s]?\b|\bcapsule[s]?\b|\bberr(?:y|ies)\b/i, "FRUIT"],
  [/\byoung boll[s]?\b/i, "YOUNG_BOLL"],
  [/\bmature boll[s]?\b/i, "MATURE_BOLL"],
  [/\bboll surface\b/i, "BOLL_SURFACE"],
  [/\blint\b|\bboll interior\b/i, "BOLL_LINT"],
  [/\bboll[s]?\b/i, "BOLL"],
  [/\bpod[s]?\b/i, "POD"],
  [/\bpanicle neck\b|\bneck\b/i, "NECK"],
  [/\bpanicle[s]?\b|\bear[s]?\b|\bearhead[s]?\b|\bspike[s]?\b/i, "PANICLE"],
  [/\bspikelet[s]?\b|\bfloret[s]?\b/i, "SPIKELET"],
  [/\bgrain[s]?\b|\bkernel[s]?\b|\bglume[s]?\b/i, "GRAIN"],
  [/\bseed[s]?\b|\bsett[s]?\b/i, "SEED"]
];
function detectSymptomParts(text) {
  const found = /* @__PURE__ */ new Set();
  for (const [re, code] of SYMPTOM_PART_PATTERNS) {
    if (re.test(text)) found.add(code);
  }
  return found;
}
var AUX_PARTICIPLE = {
  be: "been",
  become: "become",
  break: "broken",
  cause: "caused",
  collapse: "collapsed",
  cover: "covered",
  crack: "cracked",
  develop: "developed",
  die: "died",
  drop: "dropped",
  dry: "dried",
  enlarge: "enlarged",
  fall: "fallen",
  form: "formed",
  girdle: "girdled",
  hang: "hung",
  merge: "merged",
  occur: "occurred",
  produce: "produced",
  remain: "remained",
  result: "resulted",
  rot: "rotted",
  shrivel: "shriveled",
  split: "split",
  spread: "spread",
  stunt: "stunted",
  turn: "turned",
  wilt: "wilted",
  appear: "appeared",
  show: "shown"
};
var SIMPLE_PAST = {
  develop: "developed",
  develops: "developed",
  become: "became",
  becomes: "became",
  wilt: "wilted",
  wilts: "wilted",
  turn: "turned",
  turns: "turned",
  cause: "caused",
  causes: "caused",
  die: "died",
  dies: "died",
  enlarge: "enlarged",
  enlarges: "enlarged",
  dry: "dried",
  dries: "dried",
  rot: "rotted",
  rots: "rotted",
  merge: "merged",
  merges: "merged",
  show: "showed",
  shows: "showed",
  appear: "appeared",
  appears: "appeared",
  produce: "produced",
  produces: "produced",
  spread: "spread",
  spreads: "spread",
  fall: "fell",
  falls: "fell",
  drop: "dropped",
  drops: "dropped",
  collapse: "collapsed",
  collapses: "collapsed",
  split: "split",
  splits: "split",
  shrivel: "shriveled",
  shrivels: "shriveled",
  crack: "cracked",
  cracks: "cracked",
  ooze: "oozed",
  oozes: "oozed",
  exude: "exuded",
  exudes: "exuded",
  girdle: "girdled",
  girdles: "girdled",
  stunt: "stunted",
  stunts: "stunted",
  dwarf: "dwarfed",
  dwarfs: "dwarfed",
  cover: "covered",
  covers: "covered",
  result: "resulted",
  results: "resulted",
  remain: "remained",
  remains: "remained",
  occur: "occurred",
  occurs: "occurred",
  discolor: "discolored",
  discolors: "discolored",
  form: "formed",
  forms: "formed",
  break: "broke",
  breaks: "broke",
  hang: "hung",
  hangs: "hung",
  extend: "extended",
  extends: "extended",
  swell: "swelled",
  swells: "swelled",
  burst: "burst",
  bursts: "burst",
  bend: "bent",
  bends: "bent",
  kill: "killed",
  kills: "killed",
  expand: "expanded",
  expands: "expanded",
  lose: "lost",
  loses: "lost"
};
function toPastTense(text) {
  const protectedSpans = [];
  let out = text.replace(/\b(may|can|could|might)\s+([a-z]+)\b/gi, (_m, aux, verb) => {
    const pp = AUX_PARTICIPLE[verb.toLowerCase()] || `${verb}ed`;
    const placeholder = `__FDPH${protectedSpans.length}__`;
    protectedSpans.push(`${aux.toLowerCase()} have ${pp}`);
    return placeholder;
  });
  out = out.replace(/\bis\b/g, "was").replace(/\bare\b/g, "were");
  for (const [present, past] of Object.entries(SIMPLE_PAST)) {
    out = out.replace(new RegExp(`\\b${present}\\b`, "g"), past);
  }
  return out.replace(/__FDPH(\d+)__/g, (_m, i) => protectedSpans[Number(i)]);
}
function symptomId(cropId, index) {
  return `${cropId}-s${index}`;
}
function diseaseId(cropId, name) {
  return `${cropId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
var ALL = "__ALL__";
var DISEASE_META = {
  // ---------------- Paddy ----------------
  "paddy::blast": {
    scientificName: "Magnaporthe oryzae",
    type: "Fungal",
    differentials: ["Brown spot", "Sheath blight"],
    distinguishing: ["Spindle-shaped lesions with grey or ashy centres", "Dark brown lesion margins"],
    traits: { lesionShape: ["Spindle-shaped", "Diamond-shaped", "Elliptical"], lesionCentre: ["Grey / Ashy", "Whitish-grey"], lesionMargin: ["Dark brown margin", "Reddish-brown margin"] }
  },
  "paddy::neck blast": {
    scientificName: "Magnaporthe oryzae",
    type: "Fungal",
    differentials: ["False smut"],
    distinguishing: ["Blackened, shriveled panicle neck"],
    traits: { lesionCentre: ["Black", "Dark brown"] },
    stages: [ALL]
  },
  "paddy::brown spot": {
    scientificName: "Bipolaris oryzae",
    type: "Fungal",
    differentials: ["Blast", "Narrow brown leaf spot"],
    distinguishing: ["Oval or circular brown spots"],
    traits: { lesionShape: ["Oval", "Circular"], lesionCentre: ["Brown"], lesionMargin: ["Yellow halo"] }
  },
  "paddy::bacterial leaf blight": {
    scientificName: "Xanthomonas oryzae pv. oryzae",
    type: "Bacterial",
    differentials: ["Bacterial leaf streak", "Nutrient deficiency"],
    distinguishing: ["Broad yellowing starting at leaf margins", "Wavy lesion edge toward the leaf interior"],
    traits: { lesionMargin: ["Wavy margin", "Yellow halo"], lesionCentre: ["Straw-yellow", "Yellow"] }
  },
  "paddy::sheath blight": {
    scientificName: "Rhizoctonia solani",
    type: "Fungal",
    differentials: ["Sheath rot", "Stem rot", "Blast"],
    distinguishing: ["Lesions on the lower leaf sheath spreading upward"],
    traits: { lesionShape: ["Irregular", "Elliptical"], lesionCentre: ["Grey / Ashy", "Whitish-grey"], lesionMargin: ["Dark brown margin", "Diffuse margin"] }
  },
  "paddy::sheath rot": {
    scientificName: "Sarocladium oryzae",
    type: "Fungal",
    differentials: ["Sheath blight"],
    distinguishing: ["Lesions on the uppermost leaf sheath enclosing the panicle"],
    traits: { lesionShape: ["Irregular"], lesionCentre: ["Grey / Ashy"], lesionMargin: ["Reddish-brown margin", "Dark brown margin"] }
  },
  "paddy::stem rot": {
    scientificName: "Nakataea oryzae",
    type: "Fungal",
    differentials: ["Sheath blight"],
    distinguishing: ["Internal stem rot with black sclerotia"]
  },
  "paddy::false smut": {
    scientificName: "Ustilaginoidea virens",
    type: "Fungal",
    differentials: ["Neck blast"],
    distinguishing: ["Greenish spore balls replacing individual grains"],
    traits: { lesionCentre: ["Yellow", "Pale green"] }
  },
  "paddy::narrow brown leaf spot": {
    scientificName: "Cercospora janseana",
    type: "Fungal",
    differentials: ["Brown spot"],
    distinguishing: ["Narrow, linear brown lesions"],
    traits: { lesionShape: ["Linear / streak"], lesionCentre: ["Brown"] }
  },
  "paddy::bakanae": {
    scientificName: "Fusarium fujikuroi",
    type: "Fungal",
    differentials: ["Rice tungro"],
    distinguishing: ["Abnormally tall, thin, pale-green seedlings"]
  },
  "paddy::bacterial leaf streak": {
    scientificName: "Xanthomonas oryzae pv. oryzicola",
    type: "Bacterial",
    differentials: ["Bacterial leaf blight"],
    distinguishing: ["Narrow translucent streaks restricted between veins"],
    traits: { lesionShape: ["Linear / streak"], lesionCentre: ["Translucent", "Dark brown"] }
  },
  "paddy::rice tungro": {
    scientificName: "RTBV + RTSV (tungro virus complex)",
    type: "Viral",
    differentials: ["Nutrient deficiency", "Rice grassy stunt", "Rice yellow dwarf"],
    distinguishing: ["Yellow-orange leaf discoloration with stunting"],
    traits: { distribution: ["Multiple patches", "Widespread across field", "Scattered plants"] }
  },
  "paddy::rice yellow dwarf": {
    scientificName: "Rice yellow dwarf phytoplasma",
    type: "Phytoplasma",
    differentials: ["Rice tungro", "Nutrient deficiency"]
  },
  "paddy::rice grassy stunt": {
    scientificName: "Rice grassy stunt virus (RGSV)",
    type: "Viral",
    differentials: ["Rice tungro"]
  },
  "paddy::grain discoloration": {
    scientificName: "Fungal complex (multiple pathogens)",
    type: "Fungal",
    distinguishing: ["Discoloration of glumes or grain surface"]
  },
  "paddy::root-knot disease": {
    scientificName: "Meloidogyne graminicola",
    type: "Nematode",
    differentials: ["Root rot", "Nutrient deficiency"],
    distinguishing: ["Root galls or knots", "Poor root development"]
  },
  // ---------------- Cotton ----------------
  "cotton::fusarium wilt": {
    scientificName: "Fusarium oxysporum f. sp. vasinfectum",
    type: "Fungal",
    differentials: ["Verticillium wilt", "Root rot", "Water stress"],
    distinguishing: ["Brown vascular discoloration in the stem", "Progressive wilt starting on lower leaves"],
    traits: { distribution: ["Localized patches", "Scattered plants"] },
    stages: [ALL]
  },
  "cotton::verticillium wilt": {
    scientificName: "Verticillium dahliae",
    type: "Fungal",
    differentials: ["Fusarium wilt", "Nutrient deficiency", "Root rot"],
    distinguishing: ["Interveinal yellowing and necrosis", "Vascular discoloration"]
  },
  "cotton::root rot": {
    scientificName: "Macrophomina phaseolina",
    type: "Fungal",
    differentials: ["Fusarium wilt", "Verticillium wilt", "Waterlogging injury"],
    distinguishing: ["Darkened root collar and dry brittle roots", "Plant collapse under heat or moisture stress"]
  },
  "cotton::alternaria leaf blight": {
    scientificName: "Alternaria macrospora",
    type: "Fungal",
    differentials: ["Cercospora leaf spot", "Helminthosporium leaf spot", "Bacterial blight"],
    distinguishing: ["Concentric rings or target-like markings", "Darker outer lesion margin"],
    traits: { lesionShape: ["Circular", "Irregular"], lesionCentre: ["Brown"], lesionMargin: ["Dark brown margin", "Distinct margin"] }
  },
  "cotton::cercospora leaf spot": {
    scientificName: "Cercospora gossypina",
    type: "Fungal",
    differentials: ["Alternaria leaf blight", "Helminthosporium leaf spot"],
    distinguishing: ["Brown or reddish-brown margins with greyish or tan centres"],
    traits: { lesionShape: ["Circular", "Irregular"], lesionCentre: ["Grey / Ashy", "Whitish-grey"], lesionMargin: ["Reddish-brown margin", "Dark brown margin"] }
  },
  "cotton::helminthosporium leaf spot": {
    scientificName: "Helminthosporium spp.",
    type: "Fungal",
    provisional: true,
    differentials: ["Alternaria leaf blight", "Cercospora leaf spot"],
    distinguishing: ["Elongated or irregular brown lesions"],
    traits: { lesionShape: ["Elongated", "Irregular"], lesionCentre: ["Brown", "Dark brown"] }
  },
  "cotton::grey or areolate mildew": {
    scientificName: "Ramularia areola",
    type: "Fungal",
    differentials: ["Other leaf spots", "Bacterial blight", "Nutrient deficiency"],
    distinguishing: ["Angular lesions bounded by leaf veins", "Greyish-white growth on the leaf underside"]
  },
  "cotton::anthracnose": {
    scientificName: "Colletotrichum spp.",
    type: "Fungal",
    differentials: ["Bacterial boll rot", "Mechanical injury"],
    distinguishing: ["Dark, sunken lesions on stems, petioles, or bolls"],
    traits: { lesionCentre: ["Black", "Dark brown"] },
    stages: ["SEEDLING", "BOLL_FORMATION", "BOLL_DEVELOPMENT"]
  },
  "cotton::cotton rust": {
    scientificName: "Phakopsora gossypii",
    type: "Fungal",
    differentials: ["Other leaf spots", "Insect feeding damage"],
    distinguishing: ["Orange or rust-coloured pustules on the leaf underside"]
  },
  "cotton::damping-off": {
    scientificName: "Rhizoctonia solani / Pythium spp.",
    type: "Fungal",
    differentials: ["Seed quality problems", "Waterlogging"],
    distinguishing: ["Seedling collapse near the soil line", "Patchy seedling mortality"],
    traits: { distribution: ["Localized patches", "Multiple patches"] },
    stages: ["SEEDLING"]
  },
  "cotton::boll rot": {
    scientificName: "Fungal complex (Fusarium, Colletotrichum, others)",
    type: "Fungal",
    differentials: ["Bacterial boll rot", "Insect injury", "Weather damage"],
    distinguishing: ["Softening and decay of boll tissues with discoloured lint"],
    stages: ["BOLL_FORMATION", "BOLL_DEVELOPMENT", "BOLL_OPENING"]
  },
  "cotton::seedling blight": {
    scientificName: "Rhizoctonia / Fusarium / Pythium complex",
    type: "Fungal",
    differentials: ["Damping-off", "Seed damage", "Water stress"],
    distinguishing: ["Root and collar lesions with seedling mortality"],
    stages: ["SEEDLING"]
  },
  "cotton::bacterial blight": {
    scientificName: "Xanthomonas citri pv. malvacearum",
    type: "Bacterial",
    differentials: ["Fungal leaf spots", "Mechanical injury"],
    distinguishing: ["Angular water-soaked lesions limited by veins", 'Blackened veins and "black arm" stem lesions'],
    traits: { lesionShape: ["Irregular"], lesionMargin: ["Distinct margin"] }
  },
  "cotton::bacterial boll rot": {
    scientificName: "Bacterial boll rot complex",
    type: "Bacterial",
    differentials: ["Boll rot", "Insect damage"],
    distinguishing: ["Water-soaked soft decay of bolls, sometimes with foul odour"],
    stages: ["BOLL_FORMATION", "BOLL_DEVELOPMENT"]
  },
  "cotton::tobacco streak virus": {
    scientificName: "Tobacco streak virus (TSV)",
    type: "Viral",
    differentials: ["Leaf curl", "Herbicide injury"]
  },
  "cotton::cotton leaf curl disease": {
    scientificName: "Cotton leaf curl begomovirus complex",
    type: "Viral",
    differentials: ["Herbicide injury", "Physiological leaf curling", "Insect damage"],
    distinguishing: ["Leaf curling with vein thickening and enations", "Shortened internodes"]
  },
  "cotton::cotton mosaic": {
    scientificName: "Viral \u2014 requires regional verification",
    type: "Viral",
    provisional: true,
    differentials: ["Herbicide injury", "Nutrient disorders"],
    distinguishing: ["Persistent light- and dark-green mosaic mottling on new leaves"]
  },
  "cotton::leaf crumple / deformation": {
    scientificName: "Provisional \u2014 cause unverified",
    type: "Symptom-based category",
    provisional: true,
    differentials: ["Viral infection", "Herbicide injury", "Insect feeding", "Physiological stress"],
    distinguishing: ["Crumpled or distorted new leaves"]
  },
  "cotton::root-knot disease": {
    scientificName: "Meloidogyne spp.",
    type: "Nematode",
    differentials: ["Root rot", "Nutrient deficiency"],
    distinguishing: ["Root galls or knots", "Poor root development"]
  }
};
var SUPPLEMENTAL_DISEASES = {
  paddy: [
    {
      name: "Stem rot",
      parts: ["stem", "leaf sheaths", "stem base"],
      symptoms: [
        "Small black lesions develop on the leaf sheath near the waterline",
        "Lesions extend into the inner sheath and stem tissues",
        "Stem tissues disintegrate and show dark discoloration",
        "Numerous black sclerotia form inside the affected stem",
        "Plants may lodge or dry prematurely"
      ]
    },
    {
      name: "Narrow brown leaf spot",
      parts: ["leaf blade"],
      symptoms: [
        "Short, narrow brown linear lesions appear on the leaf blades",
        "Lesions develop between the leaf veins",
        "Lesions may unite and cause leaf drying",
        "Heavier infection appears on older leaves"
      ]
    },
    {
      name: "Root-knot disease",
      parts: ["roots", "whole plant"],
      symptoms: [
        "Root galls or knots form on the roots",
        "Root development is reduced",
        "Plants show yellowing and stunted growth",
        "Plants may wilt during warm periods"
      ]
    }
  ],
  cotton: [
    {
      name: "Helminthosporium leaf spot",
      parts: ["leaves"],
      symptoms: [
        "Brown to dark-brown leaf lesions develop",
        "Spots are elongated, oval, or irregular in shape",
        "Lesions may develop lighter-coloured centres with dark margins",
        "Lesions enlarge and merge",
        "Severe infection leads to leaf drying and defoliation"
      ]
    },
    {
      name: "Cotton rust",
      parts: ["leaves"],
      symptoms: [
        "Small yellowish spots appear on the leaves",
        "Orange or rust-coloured pustules develop, mainly on the leaf underside",
        "Powdery spore masses may be visible on the pustules",
        "Affected leaves turn yellow and dry",
        "Severe infection causes premature defoliation"
      ]
    },
    {
      name: "Damping-off",
      parts: ["seeds", "roots", "hypocotyl", "root collar"],
      symptoms: [
        "Poor seedling emergence is observed",
        "Seeds or roots show decay",
        "The stem base becomes water-soaked or darkened",
        "Seedlings collapse near the soil surface",
        "Young plants die in patches"
      ]
    },
    {
      name: "Seedling blight",
      parts: ["roots", "hypocotyl", "root collar", "leaves"],
      symptoms: [
        "Seedlings show poor vigour",
        "Roots show discoloration",
        "Lesions develop at the stem base",
        "Seedlings wilt and growth is stunted",
        "Seedling death occurs in severe cases"
      ]
    },
    {
      name: "Bacterial boll rot",
      parts: ["young bolls", "mature bolls", "boll surface", "boll interior / lint"],
      symptoms: [
        "Water-soaked lesions appear on bolls",
        "Bolls show brown or black discoloration",
        "Boll tissues soften and decay",
        "Lint becomes discoloured",
        "A foul odour may occur in affected bolls",
        "Boll opening is impaired"
      ]
    },
    {
      name: "Cotton leaf curl disease",
      parts: ["leaves", "petioles", "growing point", "whole plant"],
      symptoms: [
        "Leaves curl upward or downward",
        "Leaves become thickened",
        "Veins swell and become darkened or enlarged",
        "Leaf-like outgrowths (enations) may develop on the underside of leaves",
        "Internodes become shortened and plants are stunted",
        "Boll formation is reduced in severe cases"
      ]
    },
    {
      name: "Cotton mosaic",
      parts: ["leaves", "growing point"],
      symptoms: [
        "Irregular light-green and dark-green mottling appears on leaves",
        "A mosaic pattern develops on newly emerging leaves",
        "Leaves become distorted",
        "Plant vigour is reduced and stunting may occur"
      ]
    },
    {
      name: "Leaf crumple / deformation",
      parts: ["leaves", "growing point"],
      symptoms: [
        "Leaves become crumpled or distorted",
        "Leaf expansion is irregular",
        "New growth shows deformation",
        "Plant growth is stunted"
      ]
    },
    {
      name: "Root-knot disease",
      parts: ["roots", "whole plant"],
      symptoms: [
        "Root galls or knots form on the roots",
        "Root development is reduced",
        "Plants show yellowing and stunted growth",
        "Plants wilt during warm periods",
        "Plant vigour is reduced"
      ]
    }
  ]
};
function buildCropData(source) {
  const cropId = CROP_NAME_TO_ID[source.crop_name.trim().toLowerCase()];
  if (!cropId) return null;
  const selectableParts = expandPartSelection(getPlantParts(cropId).map((p) => p.code));
  const supplemental = (SUPPLEMENTAL_DISEASES[cropId] || []).map((d) => ({
    disease_name: d.name,
    plant_parts_affected: d.parts,
    symptoms: d.symptoms
  }));
  const allDiseases = [...source.diseases, ...supplemental];
  const symptomIndex = /* @__PURE__ */ new Map();
  const diseaseSymptomIds = /* @__PURE__ */ new Map();
  for (const disease of allDiseases) {
    const ids = [];
    const diseaseParts = new Set((disease.plant_parts_affected || []).map(mapPart));
    for (const symptom of disease.symptoms || []) {
      const key = symptom.trim().toLowerCase();
      const detected = detectSymptomParts(symptom);
      const narrowed = new Set([...detected].filter((p) => diseaseParts.has(p)));
      const reachable = new Set([...detected].filter((p) => selectableParts.has(p)));
      const parts = narrowed.size > 0 ? narrowed : reachable.size > 0 ? reachable : diseaseParts.size > 0 ? diseaseParts : /* @__PURE__ */ new Set(["WHOLE_PLANT"]);
      const existing = symptomIndex.get(key);
      if (existing) {
        parts.forEach((p) => existing.parts.add(p));
        existing.diseaseCount += 1;
        ids.push(existing.id);
      } else {
        const id = symptomId(cropId, symptomIndex.size);
        symptomIndex.set(key, { id, label: toPastTense(symptom.trim()), parts: new Set(parts), diseaseCount: 1 });
        ids.push(id);
      }
    }
    diseaseSymptomIds.set(disease.disease_name, ids);
  }
  const symptoms = Array.from(symptomIndex.values()).map((s) => ({
    id: s.id,
    label: s.label,
    parts: Array.from(s.parts)
  }));
  const diseases = allDiseases.map((disease) => {
    const ids = diseaseSymptomIds.get(disease.disease_name) || [];
    const weights = {};
    ids.forEach((id) => {
      const entry = Array.from(symptomIndex.values()).find((s) => s.id === id);
      const count = entry?.diseaseCount || 1;
      weights[id] = count === 1 ? 5 : count === 2 ? 4 : count === 3 ? 3 : 2;
    });
    const meta = DISEASE_META[`${cropId}::${disease.disease_name.trim().toLowerCase()}`] || {};
    const metaStages = meta.stages || [];
    const stages = metaStages.includes(ALL) ? getGrowthStages(cropId).map((s) => s.code) : metaStages.length > 0 ? metaStages : [UNKNOWN_STAGE];
    return {
      id: diseaseId(cropId, disease.disease_name),
      cropId,
      name: disease.disease_name,
      scientificName: meta.scientificName || "",
      type: meta.type || "",
      parts: Array.from(new Set((disease.plant_parts_affected || []).map(mapPart))),
      stages,
      overview: (disease.symptoms || []).join(" "),
      differentials: meta.differentials || [],
      distinguishing: meta.distinguishing || [],
      provisional: meta.provisional || false,
      references: [{ label: "TNAU Agritech Crop Protection Portal", url: TNAU_PORTAL }],
      symptomWeights: weights,
      traits: meta.traits || {}
    };
  });
  return { symptoms, diseases };
}
var BUILT = (() => {
  const symptoms = {};
  const diseases = [];
  for (const crop of diseaseSymptoms_default.crops) {
    const built = buildCropData(crop);
    if (!built) continue;
    const cropId = CROP_NAME_TO_ID[crop.crop_name.trim().toLowerCase()];
    symptoms[cropId] = built.symptoms;
    diseases.push(...built.diseases);
  }
  return { symptoms, diseases };
})();
var FD_SYMPTOMS = BUILT.symptoms;
var FD_DISEASES = BUILT.diseases;
function getSymptoms(cropId) {
  return FD_SYMPTOMS[cropId] || [];
}
function getDiseasesForCrop(cropId) {
  return FD_DISEASES.filter((d) => d.cropId === cropId);
}
var OBSERVATION_VALUE = {
  present: 1,
  partial: 0.5,
  contradictory: -1,
  unknown: null,
  // excluded
  unchecked: null
  // excluded
};
var CONTRA_WEIGHT = 3;
var PART_WEIGHT = 5;
var STAGE_WEIGHT = 3;
function scoreDisease(disease, symptomDefs, input) {
  const defById = new Map(symptomDefs.map((s) => [s.id, s]));
  const partial = new Set(input.partialSymptomIds || []);
  const contradicted = new Set(input.contradictedSymptomIds || []);
  const expandedParts = input.selectedParts && input.selectedParts.length > 0 ? expandPartSelection(input.selectedParts) : null;
  const selectedStages = input.selectedStages || [];
  let raw = 0;
  let max = 0;
  const matched = [];
  const missing = [];
  const missingIds = [];
  const ruledOut = [];
  const adjustments = [];
  for (const [symId, weight] of Object.entries(disease.symptomWeights)) {
    if (expandedParts) {
      const def = defById.get(symId);
      if (def && !def.parts.some((p) => expandedParts.has(p))) continue;
    }
    max += weight;
    if (input.selectedSymptomIds.includes(symId)) {
      const v = partial.has(symId) ? 0.5 : 1;
      raw += weight * v;
      matched.push(defById.get(symId)?.label || symId);
    } else if (contradicted.has(symId)) {
      raw -= CONTRA_WEIGHT;
      ruledOut.push(defById.get(symId)?.label || symId);
    } else {
      missing.push(defById.get(symId)?.label || symId);
      missingIds.push(symId);
    }
  }
  if (expandedParts) {
    const diseaseExpanded = expandPartSelection(disease.parts);
    const overlap = [...expandedParts].some((p) => diseaseExpanded.has(p));
    max += PART_WEIGHT;
    if (overlap) {
      raw += PART_WEIGHT;
    } else {
      raw -= PART_WEIGHT;
      adjustments.push("Selected plant part is not typical for this disease");
    }
  }
  if (selectedStages.length > 0 && !disease.stages.includes(UNKNOWN_STAGE) && disease.stages.length > 0) {
    max += STAGE_WEIGHT;
    if (disease.stages.some((s) => selectedStages.includes(s))) {
      raw += STAGE_WEIGHT;
    } else {
      raw -= STAGE_WEIGHT;
      adjustments.push("Symptoms uncommon at the selected growth stage");
    }
  }
  const contradictoryTraits = [];
  for (const question of FD_TRAIT_QUESTIONS) {
    const answer = input.traitAnswers[question.key];
    if (!answer || TRAIT_EXCLUDED_ANSWERS.has(answer)) continue;
    const expected = disease.traits[question.key];
    if (!expected || expected.length === 0) continue;
    max += TRAIT_WEIGHT;
    if (expected.includes(answer)) {
      raw += TRAIT_WEIGHT;
    } else {
      raw -= TRAIT_WEIGHT;
      contradictoryTraits.push(`${question.label}: observed "${answer}"`);
    }
  }
  const hasData = Object.keys(disease.symptomWeights).length > 0;
  const score = max > 0 ? Math.max(0, Math.min(100, Math.round(raw / max * 100))) : 0;
  return {
    disease,
    score,
    rawScore: raw,
    maxScore: max,
    matchedSymptoms: matched,
    missingSymptoms: missing,
    missingSymptomIds: missingIds,
    ruledOutSymptoms: ruledOut,
    contradictoryTraits,
    adjustments,
    hasData
  };
}
function matchTier(score) {
  if (score >= 70) return { label: "High Match", badge: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" };
  if (score >= 40) return { label: "Possible", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" };
  return { label: "Low Match", badge: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300" };
}
var OBSERVATION_VALUES = OBSERVATION_VALUE;
var FD_NONINFECTIOUS = [
  { label: "Nutrient deficiency", hint: "General or interveinal chlorosis, leaf-margin scorch, stunting \u2014 check fertilizer history before blaming a pathogen." },
  { label: "Abiotic stress", hint: "Drought, waterlogging, heat, cold, salinity, or soil compaction can mimic disease symptoms." },
  { label: "Herbicide injury", hint: "Leaf cupping, twisting, strapping, or distorted new growth after recent spray." },
  { label: "Insect / mite damage", hint: "Leaf curling, stippling, honeydew, sooty mould, feeding punctures, or damaged squares and bolls." }
];
