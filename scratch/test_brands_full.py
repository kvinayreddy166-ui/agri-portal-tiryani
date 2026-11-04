import json, re

BRAND_FALLBACKS = {
    "abamectin": ["Vertimec (Syngenta)", "Abacin (Crystal)"],
    "acephate": ["Asataf (Rallis)", "Starthene (UPL)", "Tremor (ADAMA)"],
    "acetamiprid": ["Pride (ADAMA)", "Manik (UPL)", "Star 20 (Crystal)"],
    "alphacypermethrin": ["Fastac (BASF)", "Alpha-Kem"],
    "azadirachtin": ["Neemazal (Parry)", "Econeem (Biostadt)", "Nimbecidine (Stanes)"],
    "bacillus": ["Dipel (Valent)", "Biobit", "Halt (Wockhardt)", "Delfin (Certis)"],
    "beauveria": ["Biorin", "Beverin", "Daman (Multiplex)", "Bio-Magic"],
    "benfuracarb": ["Oncol 3G (PI Industries)"],
    "beta cyfluthrin": ["Bulldock 025 SC (Bayer)"],
    "bifenazate": ["Floramite (UPL)"],
    "bifenthrin": ["Talstar (FMC)", "Markar (Dhanuka)", "Brigade"],
    "buprofezin": ["Applaud (Rallis)", "Phelix", "Zoom"],
    "carbaryl": ["Sevin 50 WP (Bayer)", "Hexavin", "Tafvin"],
    "carbofuran": ["Furadan 3G (FMC)", "Diafuran"],
    "carbosulfan": ["Marshal 25 EC (FMC)"],
    "cartap": ["Padan 4G (Sumitomo)", "Caldan 50 SP (Dhanuka)", "Kritap"],
    "chlorantraniliprole": ["Coragen (FMC)", "Cover (ADAMA)", "Cosko", "Ferterra (FMC)"],
    "chlorfenapyr": ["Intrepid (BASF)"],
    "chlorfluazuron": ["Atabron (Ishihara)"],
    "chlorpyrifos": ["Dursban (Corteva)", "Radar (Rallis)", "Classic (ADAMA)", "Tafaban"],
    "chromafenozide": ["Matric (PI Industries)"],
    "clothianidin": ["Dantop (Sumitomo)", "Dantotsu"],
    "cyantraniliprole": ["Benevia (FMC)", "Minecto Star (Syngenta)"],
    "cypermethrin": ["Ustaad (UPL)", "Cymbush (Syngenta)", "Ripcord", "Cyperhit"],
    "deltamethrin": ["Decis 2.8 EC (Bayer)", "Decis Tablet"],
    "diafenthiuron": ["Pegasus (Syngenta)", "Polo (ADAMA)"],
    "dichlorvos": ["Nuvan (Syngenta)", "Vapona", "Doom"],
    "dicofol": ["Kelthane (Dow)", "Colonizer", "Dicomite"],
    "diflubenzuron": ["Dimilin (Chemtura/UPL)"],
    "dimethoate": ["Rogor (FMC)", "Tafgor (Rallis)"],
    "dinotefuran": ["Token (Indofil)", "Oshin (PI Industries)"],
    "emamectin": ["Proclaim 5 SG (Syngenta)", "EM-1 (Dhanuka)", "Kingstar (ADAMA)"],
    "ethion": ["Fosmite (PI Industries)", "Tafethion (Rallis)"],
    "ethofenoprox": ["Trebon (Mitsui)"],
    "etoxazole": ["Baroque (Sumitomo)"],
    "fenazaquin": ["Magister (Corteva)"],
    "fenobucarb": ["BPMC (Bayer)", "Hopcin"],
    "fenpropathrin": ["Danitol (Sumitomo)"],
    "fenpyroximate": ["Sedna (Sumitomo)", "Mitigate"],
    "fenvalerate": ["Fenval 20 EC", "Tatafen (Rallis)", "Belmark"],
    "fipronil": ["Regent 5 SC (Bayer)", "Regent Ultra 0.3 GR", "Mortar (Dhanuka)"],
    "flonicamid": ["Ulala (UPL)", "Beleaf"],
    "flubendiamide": ["Fame (Bayer)", "Takumi (Tata Rallis)"],
    "flufenoxuron": ["Cascade (BASF)"],
    "flumite": ["Flumite 20 SC"],
    "flufenzine": ["Flumite (Cheminova)"],
    "fluvalinate": ["Mavrik (ADAMA)"],
    "hexythiazox": ["Maiden (Biostadt)"],
    "imidacloprid": ["Confidor (Bayer)", "Tata Mida (Rallis)", "Victor (UPL)", "Gaucho (Bayer)"],
    "indoxacarb": ["Avaunt (FMC)", "Kingdoxa (ADAMA)"],
    "lambda": ["Karate (Syngenta)", "Kung Fu (ADAMA)", "Silencer"],
    "lufenuron": ["Match (Syngenta)"],
    "malathion": ["Cythion (Cheminova)", "Mala-Taf (Rallis)"],
    "metaflumizone": ["Verismo (BASF)"],
    "methomyl": ["Lannate (Corteva)", "Dunet (Dhanuka)"],
    "methyl parathion": ["Metacid (Bayer)", "Folidol Dust"],
    "milbemectin": ["Milbeknock (Sumitomo)"],
    "monocrotophos": ["Monocil (NOCIL)", "Nuvacron (Syngenta)", "Phoskill (UPL)"],
    "npv": ["Helicide", "Spodocide", "Biovirus-H"],
    "novaluron": ["Rimon (ADAMA)"],
    "oxydemeton": ["Metasystox (Bayer)"],
    "permethrin": ["Ambush (Syngenta)"],
    "phenthoate": ["Elsan (Nissan)", "Phendal (Sumitomo)"],
    "phorate": ["Thimet 10G (UPL)", "Foratox (Rallis)", "Granutox"],
    "phosalone": ["Zolone (Coromandel)"],
    "phosphamidon": ["Dimecron (Syngenta)", "Sumidon"],
    "profenofos": ["Curacron (Syngenta)", "Carina (PI Industries)"],
    "propargite": ["Omite (Dhanuka)", "Simba"],
    "pymetrozine": ["Chess (Syngenta)", "Fulcrum (ADAMA)"],
    "pyridalyl": ["Pleora (Sumitomo)"],
    "pyriproxyfen": ["Lano (Sumitomo)", "Tiger"],
    "quinalphos": ["Ekalux (Syngenta)", "Flash (Tata Rallis)", "Quinaltaf"],
    "spinosad": ["Tracer 45 SC (Corteva)", "Success"],
    "spiromesifen": ["Oberon 22.9 SC (Bayer)", "Voliam Targo"],
    "thiacloprid": ["Alanto (Bayer)"],
    "thiamethoxam": ["Actara (Syngenta)", "Areva (ADAMA)", "Cruiser (Syngenta)"],
    "thiodicarb": ["Larvin 75 WP (Bayer)"],
    "thiometon": ["Ekatin (Syngenta)"],
    "tolfenpyrad": ["Keira (PI Industries)"],
    "triazophos": ["Hostathion (Bayer)", "Trizocel", "Spark"],
    "verticillium": ["Verticel", "Mealy-Kill", "Bio-Catch"]
}

with open('scratch/unique_pdf_insecticides.txt', 'r', encoding='utf-8') as f:
    pdf_insects = [line.strip() for line in f if line.strip()]

missing = []
for ins in pdf_insects:
    ins_lower = ins.lower()
    found = False
    for k, brands in BRAND_FALLBACKS.items():
        if k in ins_lower:
            found = True
            break
    if not found:
        missing.append(ins)

print("Unique insecticides:", len(pdf_insects))
print("Matched with brands:", len(pdf_insects) - len(missing))
print("Missing:", missing)
