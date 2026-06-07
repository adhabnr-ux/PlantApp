import { Zap } from 'lucide-react';
import { SectionHeader } from '@/components/ui';
import { CaptureComposer } from './CaptureComposer';
import { RecentCaptures } from './RecentCaptures';

export function CaptureScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Capture</h1>
        <p className="mt-1 text-sm text-slate-400">
          Dump a thought — AI tags it and files it into Notion.
        </p>
      </div>

      <CaptureComposer />

      <section>
        <SectionHeader
          icon={<Zap className="h-4 w-4" />}
          title="Recent"
          accent="text-amber-400"
        />
        <RecentCaptures />
      </section>
    </div>
  );
}
