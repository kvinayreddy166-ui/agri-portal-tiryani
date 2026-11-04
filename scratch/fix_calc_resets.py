import os

files_updates = {
    'PlantPopulationCalculator.tsx': (
        """            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >""",
        """            <button
              type="button"
              onClick={reset}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 self-start sm:self-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >"""
    ),
    'SeedRateCalculator.tsx': (
        """            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >""",
        """            <button
              type="button"
              onClick={reset}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 self-start sm:self-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >"""
    ),
    'PesticideCalculator.tsx': (
        """            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >""",
        """            <button
              type="button"
              onClick={reset}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 self-start sm:self-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >"""
    ),
    'IrrigationCalculator.tsx': (
        """            <button
              type="button"
              onClick={mode === 'drip' ? resetDrip : resetSprinkler}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 self-start sm:self-auto"
            >""",
        """            <button
              type="button"
              onClick={mode === 'drip' ? resetDrip : resetSprinkler}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 self-start sm:self-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >"""
    ),
    'AcreageCalculator.tsx': (
        """            <button
              type="button"
              onClick={resetCalculator}
              disabled={!hasInput}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >""",
        """            <button
              type="button"
              onClick={resetCalculator}
              disabled={!hasInput}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 self-start sm:self-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >"""
    ),
    'ProfitabilityCalculator.tsx': (
        """            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >""",
        """            <div className="flex items-center gap-2 self-start sm:self-auto w-fit">
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >"""
    ),
    'FertilizerCalculator.tsx': (
        """            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetCalculator}
                disabled={isResetting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >""",
        """            <div className="flex items-center gap-2 self-start sm:self-auto w-fit">
              <button
                type="button"
                onClick={resetCalculator}
                disabled={isResetting}
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >"""
    ),
}

for fname, (old_t, new_t) in files_updates.items():
    path = f'project/src/features/calculators/pages/{fname}'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content_norm = content.replace('\r\n', '\n')
    assert old_t in content_norm, f"Failed to find target in {fname}!"
    content_norm = content_norm.replace(old_t, new_t, 1)
    with open(path, 'wb') as f:
        f.write(content_norm.replace('\n', '\r\n').encode('utf-8'))
    print(f"Successfully updated {fname}")

print("All 7 calculator reset buttons updated!")
