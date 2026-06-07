import { useState } from 'react';
import { Search, X, Zap } from 'lucide-react';
import { SectionHeader } from '@/components/ui';
import { CaptureComposer } from './CaptureComposer';
import { RecentCaptures } from './RecentCaptures';

export function CaptureScreen() {
  const [query, setQuery] = useState('');

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
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-36 rounded-full border border-slate-800 bg-slate-900 py-1.5 pr-7 pl-8 text-sm text-slate-200 placeholder:text-slate-500 focus:w-44 focus:border-indigo-500 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          }
        />
        <RecentCaptures query={query} />
      </section>
    </div>
  );
}
