with open("project/src/features/calculators/pages/SoilHealthMeter.tsx", "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "        {/* Visual Speedometer & Soil Health Score Gauge */}"
end_marker = "        </section>\n\n        {/* Tab Selector: Mode 1 vs Mode 2 vs Advisory */}"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Error: Could not locate result card markers!")
    print("start_idx:", start_idx, "end_idx:", end_idx)
    exit(1)

# Extract result card section
result_card_section = text[start_idx : end_idx + len("        </section>")]

# Add a header inside result card if not present
if "Soil Health Diagnostic Result & Meter" not in result_card_section:
    header_to_insert = """
          <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {t('Soil Health Diagnostic Result & Meter', 'మట్టి ఆరోగ్య ఫలితం & స్కోర్ మీటర్')}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('Instant Assessment', 'తక్షణ మూల్యాంకనం')}
            </span>
          </div>"""
    # Insert right after <section className={`rounded-2xl border ${healthTier.border} bg-gradient-to-br ${healthTier.cardBg} bg-white dark:bg-slate-900 p-5 shadow-sm`}>
    tag = "<section className={`rounded-2xl border ${healthTier.border} bg-gradient-to-br ${healthTier.cardBg} bg-white dark:bg-slate-900 p-5 shadow-sm`}>"
    result_card_section = result_card_section.replace(tag, tag + header_to_insert)

# Remove result card from top position
text_without_result_card = text[:start_idx] + text[end_idx + len("        </section>\n\n") :]

# Find the insertion point: right before {/* Printable Footer Notice */}
footer_marker = "        {/* Printable Footer Notice */}"
footer_idx = text_without_result_card.find(footer_marker)

if footer_idx == -1:
    print("Error: Could not locate footer marker!")
    exit(1)

# Insert result card below selection cards (before printable footer)
new_text = (
    text_without_result_card[:footer_idx]
    + result_card_section
    + "\n\n"
    + text_without_result_card[footer_idx:]
)

with open("project/src/features/calculators/pages/SoilHealthMeter.tsx", "w", encoding="utf-8") as f:
    f.write(new_text)

print("Successfully moved Result Card below selection cards in SoilHealthMeter.tsx!")
