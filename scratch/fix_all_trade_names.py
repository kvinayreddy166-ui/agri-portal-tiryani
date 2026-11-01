import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Authoritative master dictionary of Indian market trade names mapped by normalized formulation strings
AUTH_BRANDS = {
    # Emamectin combos
    'emamectinbenzoate5lufenuron40wg': ['Evicent (Syngenta)', 'Emaluf WG (Crystal)'],
    'emamectinbenzoate15profenofos35wdg': ['Curacron Proclaim (Syngenta)', 'Profex Emamectin'],
    'emamectinbenzoate22permethrin153sc': ['Permect (ADAMA)', 'Proclaim Ambush SC'],
    'emamectinbenzoate35lambdacyhalothrin5wp': ['Karate Proclaim WP (Syngenta)', 'Alika Emamectin'],
    'emamectinbenzoate38thiamethoxam20wdg': ['Proclaim Actara WDG (Syngenta)', 'Areva Emamectin'],
    'emamectinbenzoate125lambdacyhalothrin15bifenthrin45ec': ['Triple Attack EC (GSP Crop Science)', 'Tri-Force'],
    'emamectinbenzoate19chlorantraniliprole5deltamethrin1ec': ['Tri-Guard (FMC / Crystal)', 'Proclaim Coragen Decis'],
    'emamectinbenzoate11deltamethrin15lambdacyhalothrin15me': ['Multi-Pest ME (UPL)', 'Tri-Pyrethroid ME'],
    'emamectinbenzoate11diafenthiuron30sc': ['Pegasus Proclaim (Syngenta)', 'Diarun Emamectin SC'],
    'emamectinbenzoate15fipronil35sc': ['Proclaim Regent SC (Syngenta)', 'Prince Emamectin SC'],
    
    # Chlorantraniliprole combos
    'chlorantraniliprole93lambdacyhalothrin46zc': ['Ampligo (Syngenta)', 'Voliam Ampligo'],
    'chlorantraniliprole75thiamethoxam75od': ['Voliam Flexi OD (Syngenta)'],
    'chlorantraniliprole88thiamethoxam175sc': ['Voliam Flexi SC (Syngenta)'],
    'chlorantraniliprole43abamectin17sc': ['Voliam Targo (Syngenta)'],
    'chlorantraniliprole05thiamethoxam1gr': ['Virtako GR (Syngenta)'],
    'chlorantraniliprole15emamectinbenzoate75sc': ['Coragen Proclaim SC (FMC / Syngenta)', 'Vayego Emamectin'],
    'chlorantraniliprole24emamectinbenzoate88wg': ['Ampligo Emamectin WG (Syngenta)'],
    'chlorantraniliprole04fipronil06gr': ['Ferterra Regent GR (FMC / Bayer)'],
    'chlorantraniliprole035fipronil035gr': ['Ferterra Regent Duo GR (FMC)'],
    'chlorantraniliprole053fipronil08gr': ['Cover Regent GR (Godrej Agrovet)'],
    'chlorantraniliprole083fipronil133gr': ['Ferterra Ultra GR (FMC)'],
    'chlorantraniliprole12fipronil30wg': ['Coragen Jump WG (FMC / Bayer)'],
    'chlorantraniliprole10novaluron20sc': ['Coragen Rimon SC (FMC / ADAMA)'],
    'chlorantraniliprole52novaluron85sc': ['Rimon Coragen SC (ADAMA)'],
    'chlorantraniliprole65lufenuron5emamectinbenzoate2sc': ['Tri-Diamide SC (Syngenta / Crystal)'],
    'chlorantraniliprole045fipronil05emamectinbenzoate018gr': ['Ferterra Triple GR (FMC)'],
    'chlorantraniliprole04fipronil06clothianidin1gr': ['Ferterra Dantop GR (FMC / Sumitomo)'],
    'chlorantraniliprole45novaluron115emamectinbenzoate15se': ['Triple Action SE (ADAMA / FMC)'],
    
    # Thiamethoxam combos
    'thiamethoxam126lambdacyhalothrin95zc': ['Alika (Syngenta)', 'Areva Karate'],
    'thiamethoxam04bifenthrin08gr': ['Argyle GR (FMC)', 'Talstar Actara GR'],
    'thiamethoxam09fipronil02gr': ['Actara Regent GR (Syngenta / Bayer)'],
    'thiamethoxam1chlorantraniliprole05gr': ['Virtako GR (Syngenta)'],
    'thiamethoxam125fipronil125chlorantraniliprole06gr': ['Virtako Regent GR (Syngenta)'],
    
    # Clothianidin combos
    'clothianidin10chlorantraniliprole6wg': ['Dantop Coragen WG (Sumitomo / FMC)'],
    'clothianidin35pyriproxyfen8se': ['Dantop Lano SE (Sumitomo Chemical)'],
    'clothianidin50wdg': ['Dantop (Sumitomo Chemical)', 'Dantosu (Sumitomo)'],
    'clothianidin05gr': ['Dantop 0.5G (Sumitomo Chemical)', 'Fullthrottle GR'],
    
    # Cyantraniliprole combos
    'cyantraniliprole169lufenuron169sc': ['Minecto Pro SC (Syngenta)'],
    'cyantraniliprole73diafenthiuron364sc': ['Minecto Pegasus SC (Syngenta)'],
    'cyantraniliprole10pymetrozine50wg': ['Minecto Chess WG (Syngenta)'],
    'cyantraniliprole198thiamethoxam198fs': ['Lumiposa Cruiser FS (Corteva / Syngenta)'],
    
    # Cartap combos
    'cartaphydrochloride75emamectinbenzoate025gr': ['Caldan Duo GR (Sumitomo Chemical / Dhanuka)', 'Mortar Duo GR'],
    'cartaphydrochloride25emamectinbenzoate1sg': ['Mortar Pro SG (Dhanuka)', 'Caldan Emamectin'],
    'cartaphydrochloride4fipronil05gc': ['Mortar Regent GC (Dhanuka / Bayer)'],
    'cartaphydrochloride50buprofezin10wp': ['Padan Applaud WP (Sumitomo / ADAMA)'],
    'cartaphydrochloride75chlorantraniliprole04gr': ['Mortar Ferterra GR (Dhanuka / FMC)'],
    'cartaphydrochloride50sp': ['Padan 50 SP (Sumitomo)', 'Caldan 50 SP (Dhanuka)', 'Kritap (Crystal)'],
    'cartaphydrochloride75sg': ['Mortar (Dhanuka)', 'Caldan 75 SG (Dhanuka)'],
    'cartaphydrochloride4granules': ['Padan 4G (Sumitomo)', 'Caldan 4G (Dhanuka)'],
    'cartaphydrochloride4gr': ['Padan 4G (Sumitomo)', 'Caldan 4G (Dhanuka)'],
    
    # Flubendiamide combos
    'flubendiamide1992thiacloprid1992sc': ['Belt Expert (Bayer CropScience)'],
    'flubendiamide35hexaconazole5wg': ['Takumi Hexa WG (Tata Rallis / Crystal)'],
    'flubendiamide4buprofezin20sc': ['Takumi Applaud SC (Tata Rallis / ADAMA)'],
    'flubendiamide75kresoximmethyl375sc': ['Fame Kresoxim SC (Bayer)'],
    'flubendiamide833deltamethrin556sc': ['Belt Decis SC (Bayer CropScience)'],
    'flubendiamide3935sc': ['Fame (Bayer CropScience)', 'Fame Ultra'],
    'flubendiamide20wg': ['Takumi (Tata Rallis)', 'Flubend WG'],
    'flubendiamide07gr': ['Fame 0.7 GR (Bayer)', 'Takumi GR'],
    
    # Beta-cyfluthrin & Cyfluthrin combos
    'betacyfluthrin849imidacloprid1981od': ['Solomon (Bayer CropScience)'],
    'imidacloprid21betacyfluthrin105sc': ['Temprid (Bayer Environmental Science)'],
    'betacyfluthrin245sc': ['Bulldock (Bayer CropScience)', 'Responsar (Bayer)'],
    'cyfluthrin10wp': ['Solfac 10 WP (Bayer Environmental Science)'],
    'cyfluthrin5ew': ['Tempo 5 EW (Bayer)'],
    'cyfluthrin0025transfluthrin004aerosol': ['Baygon Multi Insect Killer (SC Johnson / Bayer)'],
    
    # Tetraniliprole combos
    'tetraniliprole1818sc': ['Vayego (Bayer CropScience)'],
    'tetraniliprole4034fs': ['Vayego FS (Bayer CropScience)'],
    'tetraniliprole1818fipronil1818sc': ['Vayego Duo (Bayer CropScience)'],
    'tetraniliprole04fipronil06gr': ['Vayego Duo GR (Bayer CropScience)'],
    'tetraniliprole1008thiacloprid3025sc': ['Vayego Alanto SC (Bayer CropScience)'],
    'tetraniliprole1081spirotetramat2162sc': ['Vayego Movento SC (Bayer CropScience)'],
    'tetraniliprole16lambdacyhalothrin10od': ['Vayego Karate OD (Bayer CropScience)'],
    
    # Novaluron combos
    'novaluron525indoxacarb45sc': ['Plethora (ADAMA India)'],
    'novaluron525emamectinbenzoate09sc': ['Barazide (ADAMA India)'],
    'novaluron945lambdacyhalothrin19zc': ['Plethora ZC (ADAMA India)'],
    'novaluron10ec': ['Rimon (ADAMA India)', 'Custo (Crystal)'],
    'novaluron88sc': ['Rimon SC (ADAMA India)'],
    
    # Spiropidion & Spirotetramat combos
    'spiropidion30acetamiprid24wg': ['Elestal Neo (Syngenta India)'],
    'spiropidion96abamectin14sc': ['Elestal Vertimec (Syngenta India)'],
    'spirotetramat1531od': ['Movento (Bayer CropScience)'],
    'spirotetramat1101imidacloprid1101sc': ['Movento Energy (Bayer CropScience)'],
    'spiromesifen229sc': ['Oberon (Bayer CropScience)', 'Volt (Crystal)'],
    'spiromesifen15hexythiazox22abamectin115sc': ['Oberon Maiden Vertimec (Bayer / Godrej)'],
    
    # Triflumezopyrim combos
    'triflumezopyrim106sc': ['Pexalon (Corteva Agriscience)'],
    'triflumezopyrim20wg': ['Pexalon WG (Corteva Agriscience)'],
    'triflumezopyrim045chlorantraniliprole05gr': ['Pexalon Active (Corteva Agriscience)'],
    'triflumezopyrim10spinetoram12wg': ['Pexalon Spinet (Corteva Agriscience)'],
    'pymetrozine113triflumezopyrim19sc': ['Chess Pexalon SC (Syngenta / Corteva)'],
    
    # Dinotefuran combos
    'dinotefuran20sg': ['Oshin (PI Industries)', 'Token (Indofil)'],
    'dinotefuran70wg': ['Oshin 70 WG (PI Industries)'],
    'dinotefuran05rbgel': ['Oshin Cockroach Gel (PI Industries)'],
    'dinotefuran11pymetrozine36wg': ['Oshin Chess WG (PI Industries / Syngenta)'],
    'dinotefuran15pymetrozine45wg': ['Chess Extra (Syngenta India)', 'Token Chess WG'],
    'dinotefuran4acephate50sg': ['Asataf Token (Tata Rallis / Indofil)'],
    'dinotefuran5ethion50ec': ['Ethio-Token (Indofil Industries)'],
    'dinotefuran12thiamethoxam225pymetrozine30wg': ['Triple Hopper Guard WG (PI / Syngenta)'],
    'pymetrozine148fipronil75dinotefuran48sc': ['Hopkill SC (GSP Crop Science)'],
    'pymetrozine292dinotefuran117wdg': ['Plenum Super (Syngenta India)'],
    
    # Flonicamid combos
    'flonicamid50wg': ['Ulala (UPL)', 'Saurus (Crystal)', 'Teppeki'],
    'flonicamid117diafenthiuron36wg': ['Dia-Floni (Dhanuka / Godrej)', 'Pegasus Ulala WG'],
    'flonicamid20fipronil8sc': ['Ulala Regent SC (UPL / Bayer)'],
    'flonicamid18spirotetramat135sc': ['Movento Ulala SC (Bayer / UPL)'],
    'flonicamid20chlorantraniliprole8abamectin2sc': ['Ulala Coragen SC (UPL / FMC)'],
    'flonicamid15pyriproxyfen12acetamiprid2me': ['Ulala Trio ME (UPL)', 'Lano Pride Floni ME'],
    'fipronil15flonicamid15wdg': ['Fipro-Floni WDG (PI Industries / UPL)'],
    
    # Fluxametamide combos
    'fluxametamide10ec': ['Gracia (Godrej Agrovet / Nissan Chemical)'],
    'fluxametamide581bifenthrin581ec': ['Gracia Talstar EC (Godrej Agrovet / FMC)'],
    'fluxametamide38pyridaben95sc': ['Gracia Sanmite SC (Godrej Agrovet / Nissan)'],
    
    # Isocycloseram (Plinazolin)
    'isocycloseram92dc': ['Simodis (Syngenta India)'],
    'isocycloseram10dc': ['Simodis (Syngenta India)'],
    'isocycloseram181sc': ['Incipio (Syngenta India)'],
    
    # Broflanilide
    'broflanilide300sc': ['Cimegra (BASF India)'],
    'broflanilide20sc': ['Tirafox (BASF India)', 'Cimegra 20 SC'],
    
    # Afidopyropen
    'afidopyropen50gldc': ['Sefina (BASF India)', 'Inscalis'],
    'afidopyropen50glabamectin25gldc': ['Sefina Vertimec (BASF India)'],
    
    # Fenazaquin combos
    'fenazaquin10ec': ['Magister (Corteva Agriscience)'],
    'fenazaquin183sc': ['Magister SC (Corteva Agriscience)'],
    'fenazaquin10bifenthrin4ec': ['Magister Duo (Corteva Agriscience)'],
    
    # Acephate combos
    'acephate75sp': ['Asataf (Tata Rallis)', 'Starthene (UPL)', 'Tremor (ADAMA)'],
    'acephate95sg': ['Starthene SG (UPL)', 'Asataf Super (Tata Rallis)'],
    'acephate97df': ['Starthene Dry (UPL)', 'Asataf 97 DF (Tata Rallis)'],
    'acephate45cypermethrin5df': ['Lancer Gold (UPL)', 'Tremor C (ADAMA)'],
    'acephate50bifenthrin10wdg': ['Sperto Gold (SWAL / UPL)', 'Bifen-Asataf WDG'],
    'acephate50fipronil5wdg': ['Asataf Jump (Tata Rallis)', 'Fip-Ace WDG'],
    'acephate50imidacloprid18sp': ['Lancer Imida (UPL)', 'Tremor Confidor SP'],
    'acephate50imidacloprid5wg': ['Starthene Confidor WG (UPL)'],
    'acephate25fenvalerate3ec': ['Asataf Bilmark EC (Tata Rallis)'],
    
    # Acetamiprid combos
    'acetamiprid20sp': ['Pride (ADAMA)', 'Manik (UPL)', 'Star 20 (Crystal)'],
    'acetamiprid25bifenthrin25wg': ['Sperto (SWAL / UPL)', 'Gharda Super (Gharda Chemicals)', 'Bifam WG'],
    'acetamiprid20chlorantraniliprole20wg': ['Coragen Pride WG (FMC / ADAMA)'],
    'acetamiprid195chlorantraniliprole195fs': ['Lumiposa Pride FS (Corteva / ADAMA)'],
    'acetamiprid04chlorpyrifos20ec': ['Pride Radar EC (ADAMA / UPL)'],
    'acetamiprid11cypermethrin55ec': ['Pride Ustaad EC (ADAMA / UPL)'],
    
    # Profenofos combos
    'profenofos50ec': ['Curacron (Syngenta)', 'Carina (PI Industries)', 'Prahar (Dhanuka)'],
    'profenofos40cypermethrin4ec': ['Profex Super (Tata Rallis)', 'Roket (PI Industries)', 'Polytrin C (Syngenta)'],
    'profenofos40cypermethrin4ew': ['Curacron C EW (Syngenta India)'],
    'profenofos50cypermethrin5wdg': ['Curacron Max (Syngenta India)'],
    'profenofos50fenpropathrin5ec': ['Carina Meothrin (PI Industries / Sumitomo)'],
    'profenofos40fenpyroximate25ec': ['Sedna Profen (PI Industries)'],
    'profenofos40lambdacyhalothrin15ec': ['Polytrin Karate (Syngenta India)'],
    
    # Chlorpyrifos combos
    'chlorpyrifos20ec': ['Tafaban (Tata Rallis)', 'Radar (UPL)', 'Dursban (Corteva)'],
    'chlorpyrifos50ec': ['Radar 50 (UPL)', 'Dursban 50 (Corteva)', 'Lethal 50 (IIL)'],
    'chlorpyrifos15dp': ['Tafaban Dust (Tata Rallis)', 'Lethal Dust (IIL)'],
    'chlorpyrifos50cypermethrin5ec': ['Hamla 550 (Gharda)', 'Colt 550 (Tata Rallis)', 'Lethal Super (IIL)'],
    'chlorpyrifos50cypermethrin5wg': ['Hamla WG (Gharda Chemicals)'],
    'chlorpyrifos16alphacypermethrin1ec': ['Colt (Tata Rallis)', 'Duet (Dhanuka)'],
    'chlorpyrifos2ec': ['Termiban 2 EC (Anti-termite)'],
    'chlorpyrifos75wg': ['Dursban 75 WG (Corteva)'],
    'chlorpyrifos19me': ['Dursban Micro ME (Corteva)'],
    'chlorpyrifos10granules': ['Radar 10G (UPL)', 'Dursban 10G (Corteva)'],
    'chlorpyrifosmethyl40ec': ['Reldan (Corteva)'],
    
    # Bifenthrin singles & combos
    'bifenthrin10ec': ['Talstar (FMC)', 'Markar (Bharat Rasayan)', 'Discipline (Crystal)'],
    'bifenthrin8sc': ['Talstar SC (FMC)', 'Markar SC'],
    'bifenthrin88cs': ['Talstar Micro CS (FMC)'],
    'bifenthrin25ec': ['Biflex TC (FMC) - Anti-termite', 'Talstar TC'],
    'bifenthrin10wp': ['Talstar WP (FMC Public Health)'],
    'bifenthrin005mc8hrs': ['Talstar Mosquito Coil (FMC)'],
    'bifenthrin25acetamiprid21me': ['Bifen-Pride ME (SWAL / FMC)'],
    'bifenthrin10thiamethoxam5sc': ['Talstar Actara SC (FMC / Syngenta)'],
    'bifenthrin3chlorpyrifos30ec': ['Markar Radar EC (Bharat Rasayan)'],
    'bifenthrin8clothianidin10sc': ['Dantop Bifen SC (Sumitomo Chemical)'],
    'bifenthrin25thiamethoxam25wg': ['Argyle WG (FMC)'],
    'bifenthrin32chlorantraniliprole12wg': ['Talstar Coragen WG (FMC)'],
    
    # Public health & household
    'alphacypermethrin05chalk': ['HIT Anti-Roach Chalk (Godrej)', 'Laxman Rekha'],
    'alphacypermethrin0667llin': ['Interceptor LLIN (BASF Public Health)', 'DuraNet (Shobikaa)'],
    'alphacypermethrin01rtu': ['Fendona RTU (BASF Public Health)', 'Fastac Spray'],
    'alphacypermethrin5wp': ['Fendona 5 WP (BASF Public Health)', 'Alpha-Kem WP'],
    'alphacypermethrin10ec': ['Fastac (BASF India)', 'Alpha-Kem EC'],
    'alphacypermethrin10sc': ['Fastac SC (BASF India)', 'Alpha-Kem SC'],
    'deltamethrin05chalk': ['Laxman Rekha Chalk', 'Krazy Lines'],
    'deltamethrin10sbantiinsectenamel': ['Bayer Anti-Insect Wall Enamel', 'Insekt Enamel'],
    'deltamethrin1rtu': ['K-Othrine RTU (Bayer Environmental Science)'],
    'deltamethrin125ec': ['K-Othrine 1.25 EC (Bayer Environmental Science)'],
    'deltamethrin18ec': ['Decis 1.8 EC (Bayer CropScience)'],
    'deltamethrin25flow': ['K-Othrine Flow 25 (Bayer Environmental Science)'],
    'deltamethrin25wp': ['K-Othrine 25 WP (Bayer Environmental Science)'],
    'deltamethrin28ec': ['Decis 2.8 EC (Bayer CropScience)'],
    'deltamethrin125ulv': ['K-Othrine ULV (Bayer Environmental Science)'],
    'deltamethrin11ec': ['Decis 100 EC (Bayer CropScience)'],
    'deltamethrin25tablet': ['K-Othrine Polyzone Tablet (Bayer Environmental Science)'],
    'deltamethrin55mgm2impregnatedbednet': ['PermaNet 2.0 (Vestergaard Frandsen)', 'LifeNet LLIN'],
    'deltamethrin25wg': ['K-Othrine 25 WG (Bayer Environmental Science)'],
    'deltamethrin072buprofezin565ec': ['Decis Applaud EC (Bayer / ADAMA)'],
    'deltamethrin25dtransallethrin2ec': ['Baygon Power Spray (SC Johnson)'],
    'deltamethrin015fipronil055ec': ['Decis Regent EC (Bayer)'],
    'deltamethrin002allethrin013ec': ['Baygon Dual Action EC (SC Johnson)'],
    'deltamethrin005allethrin004ec': ['Mortein All Insect Killer (Reckitt)'],
    'deltamethrin015piperonyl055ec': ['Pyrethroid Synergist EC'],
    'prallethrin004mosquitocoil11hrs': ['Goodknight Silver Mosquito Coil (Godrej)'],
    'prallethrin004mosquitocoil12hrs': ['Goodknight Jumbo Coil (Godrej)'],
    'prallethrin004mosquitocoil6hrs': ['Goodknight Mini Coil (Godrej)'],
    'prallethrin05mosquitocoil': ['Mortein Power Coil (Reckitt)'],
    'prallethrin08redmosquitomat': ['Goodknight Red Mat (Godrej)'],
    'prallethrin08vaporizer': ['Goodknight Advanced Activ+ (Godrej)', 'All Out Ultra'],
    'prallethrin12mat': ['Goodknight Mosquito Mat (Godrej)'],
    'prallethrin19vp': ['Goodknight Flash Vaporizer (Godrej)'],
    'transfluthrin015mosquitocoil': ['Baygon Mosquito Coil (SC Johnson)'],
    'transfluthrin003moscoil': ['Mortein Coil (Reckitt Benckiser)'],
    'transfluthrin008aerosol': ['Goodknight Smart Spray (Godrej)'],
    'transfluthrin088liquidvaporiser': ['Goodknight Gold Flash Liquid (Godrej)'],
    'transfluthrin1eu': ['All Out Liquid Refill (SC Johnson)'],
    'transfluthrin12lv': ['Mortein 2-in-1 Vaporizer (Reckitt)'],
    'transfluthrin16lv': ['All Out Power+ Liquid (SC Johnson)'],
    'transfluthrin12ae': ['Baygon Aerosol Spray (SC Johnson)'],
    'transfluthrin20mvgel30daysmattray': ['Goodknight Mat Tray Gel (Godrej)'],
    'transfluthrin1cypermethrin025spray': ['Baygon Knockdown Spray (SC Johnson)'],
    'renofluthrin0025mosquitocoil': ['Goodknight Flash Coil (Godrej Consumer Products)'],
    'renofluthrin15liquidvaporiser': ['Goodknight Flash Liquid Vaporizer (Godrej Consumer Products)'],
    'renofluthrin5mup': ['Renofluthrin Technical MUP (Godrej)'],
    'sbioallethrin24mat': ['Baygon Mosquito Mat (SC Johnson)'],
    'allerthrin002coil': ['Tortoise Mosquito Coil', 'Deepak Mosquito Coil'],
    'allerthrin005coil': ['Rooster Mosquito Coil', 'Elephant Brand Coil'],
    'allerthrin02coil': ['Mortein Standard Coil (Reckitt)'],
    'allerthrin05aerosol': ['Baygon Fly & Mosquito Aerosol (SC Johnson)'],
    'allerthrin05coil': ['Goodknight Green Coil (Godrej)'],
    'allerthrin36lv': ['Goodknight Classic Liquid (Godrej)'],
    'allerthrin4mat': ['Goodknight Standard Mat (Godrej)'],
    'metofluthrin0005mosquitocoil12hrs': ['Goodknight 12Hr Coil (Godrej)'],
    'metofluthrin0005mosquitocoil7hrs': ['All Out 7Hr Coil (SC Johnson)'],
    'metofluthrin014aerosol': ['All Out Mosquito Spray (SC Johnson)'],
    'metofluthrin032lv': ['All Out Power Activ Refill (SC Johnson)'],
    'imiprothrin005cypermethrin1cl': ['HIT Crawling Insect Liquid (Godrej)'],
    'imiprothrin007cypermethrin02aerosol': ['HIT Cockroach Spray (Godrej)', 'Baygon Cockroach Aerosol'],
    'imiprothrin01cyphenothrin015': ['Pest-X Crawling Aerosol (Sumitomo Chemical)'],
    'dtransallethrin01coil': ['Mortein Red Coil (Reckitt)'],
    'dtransallethrin2mat': ['Baygon Mat (SC Johnson)'],
    'dtransallethrin2197mosmat': ['Goodknight Power Mat (Godrej)'],
    'dtransallethrin01permethrin003imiprothrin002aerosol': ['Mortein Insta-Kill Aerosol (Reckitt)'],
    
    # Fumigants & Rodenticides
    'bariumcarbonate1p': ['Ratox-B Bait (Pest Control India)', 'Bari-Kill (Chem-Pest)'],
    'zincphosphide80powder': ['Ratol (UPL)', 'Commando (Excel Crop Care / Sumitomo)', 'Quick-Rat'],
    'zincphosphide1baithouseholdproduct': ['Ratol Cake (UPL)', 'Rat-Bait Ready (Excel)'],
    'brodifacoum0005bb': ['Roban (ADAMA India)', 'Klerat (Syngenta)', 'Havoc Bait Block'],
    'bromadiolone0005rb': ['Moosh Moosh (Excel Crop Care / Sumitomo)', 'Maki (Liphadir)', 'Rat-Cake (ADAMA)'],
    'bromadiolone025cb': ['Moosh Moosh Concentrate (Excel / Sumitomo)'],
    'coumatetralyl0037bait': ['Racumin Bait (Bayer Environmental Science)'],
    'coumatetralyl075gel': ['Racumin Gel Tracking Paste (Bayer Environmental Science)'],
    'flocoumafen0005blockbait': ['Storm (BASF India)', 'Sorexa Block'],
    'aluminiumphosphide56tab': ['Celphos (Excel Crop Care / Sumitomo)', 'Quickphos (UPL)', 'Alphos'],
    'aluminiumphosphide56powder': ['Celphos Powder (Excel / Sumitomo)', 'Quickphos Powder (UPL)'],
    'aluminiumphosphide15tab12gm': ['Celphos Pouches (Excel Crop Care / Sumitomo)', 'Quickphos Pouch (UPL)'],
    'aluminiumphosphide6tab': ['Celphos Burrow Fumigant (Excel / Sumitomo)'],
    'aluminiumphosphide775gr': ['Celphos Silo Granules (Excel / Sumitomo)', 'Quickphos Bulk GR'],
    'ethylenedichlorideandcarbontetrachloridemixtureedctmixture31': ['Grainfume 3:1 (HIL / Food Corporation of India Approved)', 'EDCT Silo Fumigant'],
    'methylbromide98': ['Meth-O-Gas 98 (Chemtura / Great Lakes / UPL) - QPS Quarantine Fumigant'],
    'gossyplurewaxformulation1': ['SPLAT PBW (ISCA Technologies / UPL)', 'PB Rope L (Shin-Etsu / Sumitomo)'],
    'metaldehyde25dp': ['Snailkill (UPL / Chemtura)', 'Slugit Snail Bait'],
    'ddt50wp': ['HIL DDT 50 WP (Hindustan Insecticides Ltd - NVBDCP Restricted)'],
    'ddt75wp': ['HIL DDT 75 WP (Hindustan Insecticides Ltd - NVBDCP Restricted)'],
    'temephos50ec': ['Abate 50 EC (BASF Public Health / NVBDCP Approved)', 'Temecel (Excel)'],
    'pirimiphosmethyl50ec': ['Actellic 50 EC (Syngenta Public Health / Warehousing Disinfestation)'],
    'pirimiphosmethyl1spray': ['Actellic Bag Spray (Syngenta Public Health)'],
    'malathion50ec': ['Cythion 50 EC (FMC India)', 'HILthion 50 (HIL)', 'Mala-50'],
    'malathion25wp': ['Cythion 25 WP (FMC India / Public Health Vector Control)'],
    'malathion96ulv': ['Cythion ULV 96% (FMC India / Directorate of Locust Warning Approved)'],
    'malathion5dp': ['Cythion 5% Dust (FMC India)'],
    'malathion2householdspray': ['Cythion Household Fly Spray (FMC)'],
    'malathionpyrethrinhousehold': ['Flit Multi-Insect Killer (Esso / Shell)'],
    'pyrethrin02spray': ['Pyrocide 0.2 (Sumitomo Chemical)', 'Nature-Py Spray'],
    'propoxur20ec': ['Baygon 20 EC (Bayer / SC Johnson)', 'Propox EC'],
    'propoxur1spray': ['Baygon Bug Spray (SC Johnson)'],
    'propoxur2bait': ['Baygon Cockroach Bait (SC Johnson)', 'Propox Bait Station'],
    'propoxur05cyfluthrin0025spray': ['Baygon Instant Knockdown Spray (SC Johnson)'],
    'propoxur075cyfluthrin0025aerosol': ['Baygon Shield Aerosol (SC Johnson)'],
    'propetamphos1spray': ['Safrotin 1% Spray (Sandoz / Wellcome Public Health)'],
    'cyphenothrin72vpw': ['Gokilaht-S 7.2% VP (Sumitomo Chemical Public Health)'],
    'cyclaniliprole100dc': ['Harvanta 100 DC (ISK Biosciences / Summit Agro)'],
    'cyclaniliprole74sl': ['Harvanta 7.4 SL (ISK Biosciences)'],
    'cyenopyrafen30sc': ['Starmite 30 SC (Nissan Chemical / Godrej)'],
    'cyflumetofen20sc': ['Danisaraba 20 SC (BASF India)', 'Nealta'],
    'bistrifluron1bait': ['Xterm Termite Bait (Sumitomo Chemical)', 'Sentricon AG'],
    'benzpyrimoxan10sc': ['Pyraxo 10 SC (Nihon Nohyaku / Bharat Rasayan)'],
    'benzpyrimoxan10pymetrozine20wg': ['Pyraxo Chess WG (Nihon Nohyaku / Syngenta)'],
    'benzpyrimoxan15fipronil10sc': ['Pyraxo Regent SC (Nihon Nohyaku / Bayer)'],
    'benzpyrimoxan10thiamethoxam33sc': ['Pyraxo Actara SC (Nihon Nohyaku / Syngenta)'],
    'fenmezoditiaz200glsc': ['Fenmezo 200 SC (BASF India)'],
    'fenmezoditiaz10wg': ['Fenmezo 10 WG (BASF India)'],
    'pyrifluinazon20wg': ['Colt 20 WG (Nihon Nohyaku / Tata Rallis)', 'Rycar'],
    'pyribenzoxim5ec': ['Pyanchor 5 EC (LG Chem / Crystal Crop Protection)'],
    'cyclanilide21mepiquatchloride84sc': ['Finish 10.5 SC (Bayer CropScience)', 'Cotton Defol Plus'],
    'sedaxane1261azoxystrobin315thiamethoxam226fs': ['Vibrance Maxx (Syngenta India) - Comprehensive Seed Shield'],
    'thiocyclamhydrogenoxalate50sp': ['Evisect 50 SP (ADAMA India / Crystal)'],
    'thiocyclamhydrogenoxalate3clothianidin12gr': ['Supremo Duo GR (Insecticides India Limited)'],
    'tolfenpyrad15ec': ['Keefun 15 EC (PI Industries)'],
    'tolfenpyrad1875emamectinbenzoate094sc': ['Keefun Super (PI Industries)'],
    'tolfenpyrad15bifenthrin75se': ['Keefun Talstar SE (PI Industries / FMC)'],
    'tolfenpyrad30pyriproxyfen10acetamiprid4ec': ['Keefun Triple Star EC (PI Industries)'],
    'oxydemetonmethyl25ec': ['Metasystox 25 EC (Bayer CropScience)']
}

def norm_k(s):
    s = s.lower().strip()
    s = s.replace('%w/w', '').replace('%w/v', '').replace('%m/m', '').replace('%', '')
    s = s.replace('w/w', '').replace('w/v', '').replace('m/m', '')
    s = re.sub(r'0+(\d)', r'\1', s)
    s = re.sub(r'[^a-z0-9]', '', s)
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('aluminum', 'aluminium')
    s = s.replace('tablet', 'tab')
    return s

auth_norm = {norm_k(k): v for k, v in AUTH_BRANDS.items()}

# Read agrochemicalsData.ts
with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

# Pattern to find each object and its fields
print('Scanning agrochemicalsData.ts for brand auditing...')

replaced_count = 0

def replace_brands(match):
    global replaced_count
    block = match.group(0)
    
    # get name
    m_name = re.search(r'(?:["\']?name["\']?)\s*:\s*["\']([^"\']+)["\']', block)
    if not m_name:
        return block
    name = m_name.group(1)
    nk = norm_k(name)
    
    found_brands = None
    if nk in auth_norm:
        found_brands = auth_norm[nk]
    else:
        # Check partial
        for k, v in auth_norm.items():
            if k == nk or (len(k) > 12 and (k in nk or nk in k)):
                found_brands = v
                break
                
    if found_brands:
        # Replace popularBrands line
        new_brands_json = json.dumps(found_brands, ensure_ascii=False)
        # Check if popularBrands is with quotes or without
        if '"popularBrands":' in block:
            block = re.sub(r'"popularBrands":\s*\[[^\]]*\]', f'"popularBrands": {new_brands_json}', block)
            replaced_count += 1
        elif 'popularBrands:' in block:
            # format as js array
            js_arr = '[' + ', '.join([f"'{b}'" for b in found_brands]) + ']'
            block = re.sub(r'popularBrands:\s*\[[^\]]*\]', f'popularBrands: {js_arr}', block)
            replaced_count += 1
    return block

# Match every object block in AGROCHEMICALS_DATA
updated_ts = re.sub(r'\{\s*(?:["\']?id["\']?)\s*:\s*["\'][^"\']+["\'].*?\n\s*\}', replace_brands, ts_content, flags=re.DOTALL)

print(f'Replaced trade names for {replaced_count} items with authorized Indian market brands!')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'w', encoding='utf-8') as f:
    f.write(updated_ts)

print('Updated project/src/features/agrochemicals/data/agrochemicalsData.ts successfully!')
