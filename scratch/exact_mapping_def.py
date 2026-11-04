# Complete, rigorous 1-to-1 mapping from PDF #1..#112 to (cropPestData metadata key, agrochemicalsData id)
EXACT_MAPPING = {
    # 1. Abamectin 1.8% EC (in CIB-RC: Abamectin 1.9% EC)
    1: (None, 'abamectin-1-9-ec'),
    # 2. Acephate 75% SP
    2: ('acephate-75-sp', 'acephate-75-sp'),
    # 3. Acephate 95% SG
    3: ('acephate-95-sg', 'acephate-95-sg'),
    # 4. Acetamiprid 20% SP
    4: ('acetamiprid-20-sp', 'acetamiprid-20-sp'),
    # 5. Alpha-Cypermethrin 10% WP
    5: (None, None),
    # 6. Alphamethrin 10% EC (Alphacypermethrin 10% EC)
    6: ('alphacypermethrin-10-ec', 'alphacypermethrin-10-ec'),
    # 7. Bifenthrin 10% EC
    7: ('bifenthrin-10-ec', 'bifenthrin-10-ec'),
    # 8. Bifenthrin 2.5% EC
    8: (None, 'bifenthrin-2-5-ec'),
    # 9. Buprofezin 25% SC
    9: ('buprofezin-25-sc', 'buprofezin-25-sc'),
    # 10. Carbaryl 50% WP
    10: ('carbaryl-50-wp', None),
    # 11. Carbofuran 3% GR (Carbofuran 3% CG)
    11: ('carbofuran-3-cg', 'carbofuran-3-cg'),
    # 12. Carbosulfan 25% EC
    12: ('carbosulfan-25-ec', 'carbosulfan-25-ec'),
    # 13. Cartap Hydrochloride 4% GR (Cartap Hydrochloride 4% G)
    13: ('cartap-hydrochloride-4-g', 'cartap-hydrochloride-4-gr'),
    # 14. Cartap Hydrochloride 50% SP
    14: ('cartap-hydrochloride-50-sp', 'cartap-hydrochloride-50-sp'),
    # 15. Chlorantraniliprole 0.4% GR
    15: ('chlorantraniliprole-0-4-gr', 'chlorantraniliprole-0-4-gr'),
    # 16. Chlorantraniliprole 18.5% SC
    16: ('chlorantraniliprole-18-5-sc', 'chlorantraniliprole-18-5-sc'),
    # 17. Chlorfenapyr 10% SC
    17: ('chlorfenapyr-10-sc', 'chlorfenapyr-10-sc'),
    # 18. Chlorpyrifos 1.5% DP
    18: ('chlorpyrifos-1-5-dp', 'chlorpyrifos-1-5-dp'),
    # 19. Chlorpyrifos 10% GR (Chlorpyrifos 10% G)
    19: ('chlorpyrifos-10-g', 'chlorpyrifos-10-granules'),
    # 20. Chlorpyrifos 20% EC
    20: ('chlorpyrifos-20-ec', 'chlorpyrifos-20-ec'),
    # 21. Chlorpyrifos 50% EC
    21: ('chlorpyrifos-50-ec', 'chlorpyrifos-50-ec'),
    # 22. Chromafenozide 80% WP
    22: ('chromafenozide-80-wp', 'chromafenozide-80-wp'),
    # 23. Clothianidin 50% WDG
    23: ('clothianidin-50-wdg', 'clothianidin-50-wdg'),
    # 24. Cypermethrin 10% EC
    24: ('cypermethrin-10-ec', 'cypermethrin-10-ec'),
    # 25. Cypermethrin 25% EC
    25: ('cypermethrin-25-ec', 'cypermethrin-25-ec'),
    # 26. Cypermethrin 5% EC
    26: (None, None),
    # 27. Deltamethrin 11% EC (Deltamethrin 11% w/w EC)
    27: ('deltamethrin-11-w-w-ec', 'deltamethrin-11-w-w-ec'),
    # 28. Deltamethrin 2.8% EC
    28: ('deltamethrin-2-8-ec', 'deltamethrin-2-8-ec'),
    # 29. Diafenthiuron 50% SP (Diafenthiuron 50% WP)
    29: ('diafenthiuron-50wp', 'diafenthiuron-50-wp'),
    # 30. Dichlorovos (DDVP) 76% EC (Dichlorvos 76% EC)
    30: ('dichlorvos-76-ec', None),
    # 31. Dicofol 18.5% EC
    31: ('dicofol-18-5-ec', None),
    # 32. Diflubenzuron 2% GR
    32: (None, None),
    # 33. Diflubenzuron 2% TB
    33: (None, None),
    # 34. Dimethoate 30% EC
    34: ('dimethoate-30-ec', 'dimethoate-30-ec'),
    # 35. Dinotefuran 20% SG
    35: ('dinotefuran-20-sg', 'dinotefuran-20-sg'),
    # 36. Emamectin Benzoate 5% SG
    36: ('emamectin-benzoate-5-sg', 'emamectin-benzoate-5-sg'),
    # 37. Endosulfan 35% EC
    37: (None, None),
    # 38. Endosulfan 4% DP
    38: (None, None),
    # 39. Ethion 50% EC
    39: ('ethion-50-ec', 'ethion-50-ec'),
    # 40. Etofenprox 10% EC
    40: ('ethofenoprox-10ec', 'ethofenoprox-10-ec'),
    # 41. Etofenprox 30% EC
    41: (None, None),
    # 42. Fenobucarb (BPMC) 50% EC
    42: ('fenobucarb-bpmc-50-ec', 'fenobucarb-50-ec'),
    # 43. Fenpropathrin 10% EC
    43: ('fenpropathrin-10-ec', 'fenpropathrin-10-ec'),
    # 44. Fenpropathrin 30% EC
    44: ('fenpropathrin-30-ec', 'fenpropathrin-30-ec'),
    # 45. Fenpyroximate 5% EC
    45: ('fenpyroximate-5-ec', 'fenpyroximate-5-ec'),
    # 46. Fenvalerate 0.4% DP
    46: ('fenvalerate-0-4-dp', 'fenvalerate-00-40-dp'),
    # 47. Fenvalerate 20% EC
    47: ('fenvalerate-20-ec', 'fenvalerate-20-ec'),
    # 48. Fipronil 0.3% GR
    48: ('fipronil-0-3-gr', 'fipronil-0-3-gr'),
    # 49. Fipronil 2.92% EC
    49: (None, 'fipronil-2-92-ec'),
    # 50. Fipronil 5% SC
    50: ('fipronil-5-sc', 'fipronil-5-sc'),
    # 51. Fipronil 80% WG
    51: ('fipronil-80wg', 'fipronil-80-wg'),
    # 52. Flubendiamide 20% WG
    52: ('flubendiamide-20-wg', 'flubendiamide-20-wg'),
    # 53. Flubendiamide 39.35% SC (Flubendiamide 39.35% m/m SC)
    53: ('flubendiamide-39-35-m-m-sc', 'flubendiamide-39-35-sc'),
    # 54. Hexythiazox 5.45% EC (Hexythiazox 5.45% w/w EC)
    54: ('hexythiazox-5-45-w-w-ec', 'hexythiazox-5-45-ec'),
    # 55. Imidacloprid 17.8% SL
    55: ('imidacloprid-17-8-sl', 'imidacloprid-17-8-sl'),
    # 56. Imidacloprid 30.5% SC (Imidacloprid 30.5% m/m SC)
    56: ('imidacloprid-30-5-m-m-sc', None),
    # 57. Imidacloprid 48% FS
    57: ('imidacloprid-48-fs-per-100-kg-seed', 'imidacloprid-48-fs'),
    # 58. Imidacloprid 70% WG / WS
    58: ('imidaclopride-70-wg', 'imidacloprid-70-wg'),
    # 59. Indoxacarb 14.5% SC
    59: ('indoxacarb-14-5-sc', 'indoxacarb-14-5-sc'),
    # 60. Lambda Cyhalothrin 2.5% EC
    60: ('lambda-cyhalothrin-2-5-ec', None),
    # 61. Lambda Cyhalothrin 10% WP
    61: (None, 'lambda-cyhalothrin-10-wp'),
    # 62. Lambda Cyhalothrin 4.9% CS
    62: ('lambda-cyhalothrin-4-9-cs', 'lambda-cyhalothrin-4-9-cs'),
    # 63. Lambda Cyhalothrin 5% EC
    63: ('lambda-cyhalothrin-5-ec', 'lambda-cyhalothrin-5-ec'),
    # 64. Malathion 5% DP
    64: ('malathion-5-dp', 'malathion-05-dp'),
    # 65. Malathion 50% EC
    65: ('malathion-50-ec', 'malathion-50-ec'),
    # 66. Metaflumizone 22% SC
    66: ('metaflumizone-22-sc', 'metaflumizone-22-sc'),
    # 67. Metaldehyde 2.5% DP
    67: (None, 'metaldehyde-2-5-dp'),
    # 68. Methomil 40% SP (Methomyl 40% SP)
    68: ('methomyl-40-sp', None),
    # 69. Methyl Parathion 2% DP
    69: ('methyl-parathion-2-dp', None),
    # 70. Methyl Parathion 50% EC
    70: ('methyl-parathion-50-ec', None),
    # 71. Monocrotophos 36% SL
    71: ('monocrotophos-36-sl', 'monocrotophos-15-sg'),
    # 72. Niclosamide 70% WP
    72: (None, None),
    # 73. Novaluron 10% EC
    73: ('novaluron-10-ec', 'novaluron-10-ec'),
    # 74. Permethrin 25% EC
    74: ('permethrin-25-ec', None),
    # 75. Phenthoate 50% EC
    75: ('phenthoate-50-ec', 'phenthoate-50-ec'),
    # 76. Phorate 10% CG (Phorate 10% SG/CG)
    76: ('phorate-10-cg', None),
    # 77. Phosphamidon 40% SL
    77: ('phosphamidon-40-sl', None),
    # 78. Profenophos 50% EC (Profenofos 50% EC)
    78: ('profenofos-50-ec', 'profenofos-50-ec'),
    # 79. Propergite 57% EC (Propargite 57% EC)
    79: ('propargite-57-ec', 'propargite-57-ec'),
    # 80. Pymetrozine 50% WG
    80: ('pymetrozine-50-wg', 'pymetrozine-50-wg'),
    # 81. Quinalphos 1.5% DP
    81: ('quinalphos-1-5-dp', 'quinalphos-01-50-dp'),
    # 82. Quinalphos 25% EC
    82: ('quinalphos-25-ec', 'quinalphos-25-ec'),
    # 83. Spinosad 2.5% EC (Spinosad 2.5% SC)
    83: ('spinosad-2-5-sc', 'spinosad-2-50-sc'),
    # 84. Spinosad 45% SC
    84: ('spinosad-45-0-sc', 'spinosad-45-sc'),
    # 85. Spiromesifen 22.9% SC
    85: ('spiromesifen-22-9-sc', 'spiromesifen-22-9-sc'),
    # 86. Temephos 50% EC
    86: (None, 'temephos-50-ec'),
    # 87. Thiachloprid 21.7% SC (Thiacloprid 21.7% SC)
    87: ('thiacloprid-21-7-sc', 'thiacloprid-21-7-sc'),
    # 88. Thiodicarb 75% WP
    88: ('thiodicarb-75-wp', 'thiodicarb-75-wp'),
    # 89. Thiamethoxam 25% WG
    89: ('thiamethoxam-25-wg', 'thiamethoxam-25-wg'),
    # 90. Thiamethoxam 30% FS
    90: ('thiamethoxam-30-fs', 'thiamethoxam-30-fs'),
    # 91. Thiamethoxam 70% WS
    91: ('thiamethoxam-70-ws', 'thiamethoxam-70-ws'),
    # 92. Thiamethoxam 75% SG
    92: (None, None),
    # 93. Triazophos 20% EC
    93: ('triazophos-20-ec', None),
    # 94. Triazophos 40% EC
    94: ('triazophos-40-ec', None),
    # 95. Acephate 50% + Imidachloprid 1.8% SP
    95: (None, 'acephate-50-imidacloprid-1-8-sp'),
    # 96. Chlorantraniliprole 9.3% + Lambda Cyhalothrin 4.6% ZC
    96: (None, 'chlorantraniliprole-9-3-lambda-cyhalothrin-4-6-zc'),
    # 97. Chlorpyrifos 16% + Alphamethrin 1% EC
    97: (None, 'chlorpyrifos-16-alphacypermethrin-1-ec'),
    # 98. Chlorpyrifos 21% + Fenobucarb 10.5% EC
    98: (None, None),
    # 99. Chlorpyrifos 50% + Cypermethrin 5% EC
    99: (None, 'chlorpyrifos-50-cypermethrin-5-ec'),
    # 100. Cypermethrin 3% + Quinalphos 20% EC
    100: (None, 'cypermethrin-3-quinalphos-20-ec'),
    # 101. Deltamethrin 0.27% + Buprofezin 5.65% EC
    101: (None, 'deltamethrin-0-72-buprofezin-5-65-ec'),
    # 102. Deltamethrin 1% + Triazophos 35% EC
    102: (None, None),
    # 103. Ethion 40% + Cypermethrin 5% EC
    103: (None, 'ethion-40-cypermethrin-5-ec'),
    # 104. Imidacloprid 19.81% + Beta-cyfluthrin 8.49% OD
    104: (None, 'beta-cyfluthrin-8-49-imidacloprid-19-81-od'),
    # 105. Imidacloprid 40% + Ethiprole 40% WG
    105: (None, 'ethiprole-40-imidacloprid-40-wg'),
    # 106. Imidacloprid 40% + Fipronil 40% WG
    106: (None, 'fipronil-40-imidacloprid-40-wg'),
    # 107. Flubendiamide 19.92% + Thiachloprid 19.92% SC
    107: (None, 'flubendiamide-19-92-thiacloprid-19-92-sc'),
    # 108. Indoxacarb 14.5% + Acetamiprid 7.7% SC
    108: (None, 'indoxacarb-14-5-acetamiprid-7-7-sc'),
    # 109. Profenophos 40% + Cypermethrin 4% EC
    109: (None, 'profenofos-40-cypermethrin-4-ec'),
    # 110. Thiamethoxam 1% + Chlorantraniliprole 0.5% GR
    110: (None, 'chlorantraniliprole-0-5-thiamethoxam-1-gr'),
    # 111. Thiamethoxam 12.6% + Lambda Cyhalothrin 9.5% ZC
    111: (None, 'thiamethoxam-12-6-lambda-cyhalothrin-9-5-zc'),
    # 112. Thiamethoxam 17.5% + Chlorantraniliprole 8.8% GR
    112: (None, 'chlorantraniliprole-8-8-thiamethoxam-17-5-sc'),
}
