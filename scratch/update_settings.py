path = 'project/src/features/settings/pages/Settings.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Normalize CRLF
content_norm = content.replace('\r\n', '\n')

old_header = '''import { AGRONIX_INTRO_DISABLED_KEY, playIntroVideo } from '../../../shared/components/ui/appIntroState';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { Settings as SettingsType } from '../../../shared/types/database';

export function Settings() {
  const { isAdminUser, user } = useAuth();
  const [settings, setSettings] = useState<SettingsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [introEnabled, setIntroEnabled] = useState(() => {
    try {
      return localStorage.getItem(AGRONIX_INTRO_DISABLED_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const handleIntroToggle = (enabled: boolean) => {
    setIntroEnabled(enabled);
    try {
      if (enabled) {
        localStorage.removeItem(AGRONIX_INTRO_DISABLED_KEY);
      } else {
        localStorage.setItem(AGRONIX_INTRO_DISABLED_KEY, 'true');
      }
    } catch {
      // Storage unavailable fallback
    }
  };'''

new_header = '''import { playIntroVideo } from '../../../shared/components/ui/appIntroState';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { Settings as SettingsType } from '../../../shared/types/database';

export function Settings() {
  const { isAdminUser, user } = useAuth();
  const [settings, setSettings] = useState<SettingsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);'''

old_card = '''      {/* App Intro Video Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Film className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">App Opening Intro Video</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
          Control the startup video that plays when AGRONIX is opened as an app or PWA.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="intro-video-toggle"
              checked={introEnabled}
              onChange={(e) => handleIntroToggle(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="intro-video-toggle" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer select-none">
              Play intro video when launching AGRONIX
            </label>
          </div>
          <button
            type="button"
            onClick={() => playIntroVideo()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-sm active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            Watch Intro Video
          </button>
        </div>
      </div>'''

new_card = '''      {/* AGRONIX Intro Video */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Film className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AGRONIX Intro Video</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
          Watch the introductory video about AGRONIX platform features and digital tools.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60">
          <span className="text-sm text-gray-600 dark:text-slate-300">
            Available on demand anytime
          </span>
          <button
            type="button"
            onClick={() => playIntroVideo()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-sm active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            Watch Intro Video
          </button>
        </div>
      </div>'''

assert old_header in content_norm, "old_header not found!"
assert old_card in content_norm, "old_card not found!"

content_norm = content_norm.replace(old_header, new_header, 1)
content_norm = content_norm.replace(old_card, new_card, 1)

content_crlf = content_norm.replace('\n', '\r\n')
with open(path, 'wb') as f:
    f.write(content_crlf.encode('utf-8'))

print("Settings.tsx updated successfully!")
