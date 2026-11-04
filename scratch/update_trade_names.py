import sys

def main():
    path = 'project/src/features/agrochemicals/data/agrochemicalsData.ts'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find and update acephate-25-fenvalerate-3-ec
    target_acephate = '''    "id": "acephate-25-fenvalerate-3-ec",
    "name": "Acephate 25%+ Fenvalerate 3% EC",
    "nameTe": "ఫెన్‌వాలరేట్ + ఎసిఫేట్",
    "category": "insecticide",
    "categoryTe": "పురుగుమందు",
    "popularBrands": [
          "Koranda (Rallis)",
          "Finance (Senso Agrotech)",
          "Contra (Sai Ram)"
    ],'''

    replacement_acephate = '''    "id": "acephate-25-fenvalerate-3-ec",
    "name": "Acephate 25%+ Fenvalerate 3% EC",
    "nameTe": "ఫెన్‌వాలరేట్ + ఎసిఫేట్",
    "category": "insecticide",
    "categoryTe": "పురుగుమందు",
    "popularBrands": [
      "Contra (Sai Ram)",
      "Finance (Senso Agrotech)"
    ],'''

    # Find and update chlorpyrifos-50-cypermethrin-5-ec
    target_chlor = '''    "id": "chlorpyrifos-50-cypermethrin-5-ec",
    "name": "Chlorpyrifos 50% + Cypermethrin 5% EC",
    "nameTe": "క్లోర్‌పైరిఫాస్ 50% + సైపర్‌మెథ్రిన్ 5% EC",
    "category": "insecticide",
    "categoryTe": "పురుగుమందు",
    "popularBrands": [
          "Cannon (NACL)"
    ],'''

    replacement_chlor = '''    "id": "chlorpyrifos-50-cypermethrin-5-ec",
    "name": "Chlorpyrifos 50% + Cypermethrin 5% EC",
    "nameTe": "క్లోర్‌పైరిఫాస్ 50% + సైపర్‌మెథ్రిన్ 5% EC",
    "category": "insecticide",
    "categoryTe": "పురుగుమందు",
    "popularBrands": [
      "Cannon (NACL)",
      "Koranda 505 (Rallis)",
      "Hamla 550 (Gharda)"
    ],'''

    # Normalize CRLF for matching if necessary
    content_norm = content.replace('\r\n', '\n')
    
    if target_acephate not in content_norm:
        print("ERROR: target_acephate not found in content!")
        sys.exit(1)
        
    if target_chlor not in content_norm:
        print("ERROR: target_chlor not found in content!")
        sys.exit(1)

    content_norm = content_norm.replace(target_acephate, replacement_acephate, 1)
    content_norm = content_norm.replace(target_chlor, replacement_chlor, 1)

    # Restore CRLF
    content_final = content_norm.replace('\n', '\r\n')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content_final)

    print("SUCCESS: Successfully updated agrochemicalsData.ts!")

if __name__ == '__main__':
    main()
