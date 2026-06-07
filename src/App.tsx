import { useState } from 'react';
import {
  Compass,
  Home,
  Moon,
  PlusCircle,
  Settings as SettingsIcon,
  WifiOff,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BriefingScreen } from './features/briefing/BriefingScreen';
import { CaptureScreen } from './features/capture/CaptureScreen';
import { CaptureSheet } from './features/capture/CaptureSheet';
import { ReviewScreen } from './features/review/ReviewScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { useCaptureSync } from './lib/captureSync';
import { useShareTarget } from './lib/useShareTarget';

type Tab = 'today' | 'capture' | 'review' | 'settings';

const NAV: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'capture', label: 'Capture', icon: PlusCircle },
  { id: 'review', label: 'Review', icon: Moon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shareText, setShareText] = useState('');
  const { online } = useCaptureSync();

  // Inbound shares from the OS share sheet open the capture composer prefilled.
  useShareTarget((text) => {
    setShareText(text);
    setSheetOpen(true);
  });

  const openCapture = () => {
    setShareText('');
    setSheetOpen(true);
  };

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col">
      {/* Header */}
      <header className="safe-top sticky top-0 z-30 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
        <div className="flex items-center gap-2 px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white">
            <Compass className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-100">Cockpit</span>
        </div>
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-amber-500/15 py-1.5 text-xs font-medium text-amber-300">
            <WifiOff className="h-3.5 w-3.5" /> Offline — captures are queued and will sync
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-5 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'today' && <BriefingScreen onCapture={openCapture} />}
            {tab === 'capture' && <CaptureScreen />}
            {tab === 'review' && <ReviewScreen />}
            {tab === 'settings' && <SettingsScreen />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-800/70 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-stretch justify-around px-2">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className={`h-6 w-6 ${active ? 'scale-110' : ''} transition-transform`} />
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      <CaptureSheet
        open={sheetOpen}
        initialText={shareText}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
