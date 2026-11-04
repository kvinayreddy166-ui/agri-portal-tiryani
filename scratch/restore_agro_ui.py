path = 'project/src/features/agrochemicals/pages/AgrochemicalDatabase.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content_norm = content.replace('\r\n', '\n')

old_header = """        ) : (
          <section className="relative overflow-hidden rounded-2xl border border-emerald-900/40 bg-emerald-900 p-4 sm:p-5 text-white shadow-xs">
            
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                <BackButton onClick={() => navigate('/officer-toolkit')} tone="solid" className="mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm ring-1 ring-white/25 backdrop-blur-xs text-white mt-0.5">
                      <FlaskConical className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" aria-label="Agrochemicals Database" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-emerald-200/90 mb-0.5">
                        {t('Agriculture Portal', 'వ్యవసాయ పోర్టల్')}
                      </p>
                      <h1 className="text-base sm:text-lg md:text-xl font-semibold text-white leading-snug tracking-tight">
                        {t('Agrochemicals Database', 'వ్యవసాయ రసాయనాల భాండాగారం')}
                      </h1>
                      <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/90 leading-snug max-w-3xl">
                        {t(
                          'A–Z technical database of Insecticides, Fungicides, Weedicides and Fertilizers with IRAC/FRAC/HRAC Mode of Action.',
                          'IRAC, FRAC, HRAC వర్గీకరణలతో కూడిన పురుగుమందులు, తెగుళ్ల మందులు, కలుపుమందులు మరియు ఎరువుల సమగ్ర డేటాబేస్.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-start pt-1">
                <LanguageToggle language={language} onClick={toggleLanguage} tone="solid" />
              </div>
            </div>
          </section>
        )}"""

new_header = """        ) : (
          <section className="relative overflow-hidden rounded-2xl border border-teal-300/60 bg-gradient-to-br from-teal-700 via-emerald-700 to-green-800 p-3.5 sm:p-4 text-white shadow-md dark:border-teal-700/60">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-white/30 via-white/70 to-white/30" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                <BackButton onClick={() => navigate('/officer-toolkit')} tone="solid" className="mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white shadow-sm ring-1 ring-white/25 backdrop-blur-xs mt-0.5">
                      <FlaskConical className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" aria-label="Agrochemicals Database" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-teal-100 mb-0.5">
                        {t('Agriculture Portal', 'వ్యవసాయ పోర్టల్')}
                      </p>
                      <h1 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug tracking-tight">
                        {t('Agrochemicals Database', 'వ్యవసాయ రసాయనాల భాండాగారం')}
                      </h1>
                      <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/90 leading-snug max-w-3xl">
                        {t(
                          'CIB&RC approved pesticides, insecticides, fungicides & herbicides with registered crops, target pests, dosages, waiting periods & antidote info.',
                          'సిఐబి&ఆర్‌సి ఆమోదించిన పురుగుమందులు, తెగుళ్ల మందులు, కలుపు మందుల సమగ్ర సమాచారం.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-start pt-1">
                <LanguageToggle language={language} onClick={toggleLanguage} tone="solid" />
              </div>
            </div>
          </section>
        )}"""

assert old_header in content_norm, "old_header not found in AgrochemicalDatabase.tsx"
content_norm = content_norm.replace(old_header, new_header, 1)

# Typography updates in results counter, empty state, and buttons
content_norm = content_norm.replace(
    '<strong className="text-slate-900 dark:text-white font-semibold">{filteredChemicals.length}</strong>',
    '<strong className="text-slate-900 dark:text-white font-black">{filteredChemicals.length}</strong>'
)
content_norm = content_norm.replace(
    '<h3 className="text-base font-semibold text-slate-900 dark:text-white">',
    '<h3 className="text-base font-black text-slate-900 dark:text-white">'
)
content_norm = content_norm.replace(
    'className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"',
    'className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-teal-700 transition"'
)

with open(path, 'wb') as f:
    f.write(content_norm.replace('\n', '\r\n').encode('utf-8'))

print("AgrochemicalDatabase.tsx UI restored successfully!")
