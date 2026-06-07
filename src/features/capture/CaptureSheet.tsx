import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CaptureComposer } from './CaptureComposer';

export function CaptureSheet({
  open,
  initialText = '',
  onClose,
}: {
  open: boolean;
  initialText?: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="safe-bottom w-full max-w-xl p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
                Quick capture
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CaptureComposer autoFocus initialText={initialText} onDone={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
