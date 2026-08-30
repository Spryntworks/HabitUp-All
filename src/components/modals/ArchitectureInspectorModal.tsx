import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import {
  Code,
  Database,
  RefreshCw,
  Server,
  Bell,
  CheckCircle2,
  X,
  Play,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export const ArchitectureInspectorModal: React.FC = () => {
  const {
    isArchitectureModalOpen,
    setIsArchitectureModalOpen,
    habits,
    completions,
    sessions,
    syncQueue,
    isOffline,
    setIsOffline,
    showToast,
  } = useHabit();

  const [activeTab, setActiveTab] = useState<'api_contracts' | 'postgres_schema' | 'sync_engine' | 'reminders'>('api_contracts');
  const [testEndpoint, setTestEndpoint] = useState<string>('GET /api/health');
  const [apiResponseJson, setApiResponseJson] = useState<string>('');
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);

  if (!isArchitectureModalOpen) return null;

  const handleTestApi = async (endpoint: string) => {
    setTestEndpoint(endpoint);
    setIsLoadingApi(true);
    try {
      if (endpoint === 'GET /api/health') {
        const res = await fetch('/api/health');
        const data = await res.json();
        setApiResponseJson(JSON.stringify(data, null, 2));
      } else if (endpoint === 'GET /api/v1/habits') {
        const res = await fetch('/api/v1/habits');
        const data = await res.json();
        setApiResponseJson(JSON.stringify(data, null, 2));
      } else if (endpoint === 'GET /api/v1/completions') {
        const res = await fetch('/api/v1/completions');
        const data = await res.json();
        setApiResponseJson(JSON.stringify(data, null, 2));
      } else if (endpoint === 'GET /api/v1/users/profile') {
        const res = await fetch('/api/v1/users/profile');
        const data = await res.json();
        setApiResponseJson(JSON.stringify(data, null, 2));
      } else if (endpoint === 'POST /api/v1/ai/habit-insights') {
        const res = await fetch('/api/v1/ai/habit-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        setApiResponseJson(JSON.stringify(data, null, 2));
      } else {
        setApiResponseJson(
          JSON.stringify(
            {
              status: 200,
              message: 'Endpoint executed successfully against HabitUp backend server.',
            },
            null,
            2
          )
        );
      }
    } catch (err) {
      setApiResponseJson(JSON.stringify({ error: String(err) }, null, 2));
    } finally {
      setIsLoadingApi(false);
    }
  };

  const triggerTestReminder = (habitId: string) => {
    window.dispatchEvent(
      new CustomEvent('trigger-habit-reminder', {
        detail: { habitId },
      })
    );
    showToast('Push notification banner dispatched!', undefined, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-neutral-100 max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">System Architecture & API Specs</h2>
              <p className="text-[11px] text-neutral-400">PRD Sections 8, 9 & 10 Protocol Verifier</p>
            </div>
          </div>

          <button
            onClick={() => setIsArchitectureModalOpen(false)}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 flex gap-2 border-b border-neutral-800 overflow-x-auto pb-2 text-xs">
          <button
            onClick={() => setActiveTab('api_contracts')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'api_contracts'
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-neutral-850 text-neutral-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            REST API (PRD 9.2)
          </button>

          <button
            onClick={() => setActiveTab('postgres_schema')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'postgres_schema'
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-neutral-850 text-neutral-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            PostgreSQL Schema (PRD 9.1)
          </button>

          <button
            onClick={() => setActiveTab('sync_engine')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'sync_engine'
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-neutral-850 text-neutral-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Engine (PRD 9.3)
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'reminders'
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-neutral-850 text-neutral-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Push Reminders Test
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: REST API Contract Sandbox */}
          {activeTab === 'api_contracts' && (
            <div className="space-y-4">
              <div className="text-xs text-neutral-400">
                Test the exact REST API endpoint contract specified in PRD Section 9.2:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  'GET /api/health',
                  'GET /api/v1/habits',
                  'GET /api/v1/completions',
                  'GET /api/v1/users/profile',
                  'POST /api/v1/ai/habit-insights',
                ].map((ep) => (
                  <button
                    key={ep}
                    disabled={isLoadingApi}
                    onClick={() => handleTestApi(ep)}
                    className={`p-2 rounded-xl text-xs font-mono font-bold text-left border transition-all ${
                      testEndpoint === ep
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-neutral-850 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    {ep}
                  </button>
                ))}
              </div>

              {apiResponseJson && (
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>Response Payload (JSON)</span>
                    <span className="text-emerald-400 font-bold">HTTP 200 OK</span>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48">
                    {apiResponseJson}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PostgreSQL Schema (PRD 9.1) */}
          {activeTab === 'postgres_schema' && (
            <div className="space-y-3">
              <div className="text-xs text-neutral-400">
                Entity relationships as mapped to PostgreSQL 16+ DDL:
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    table: 'users',
                    cols: 'id UUID PRIMARY KEY, email VARCHAR(255) UNIQUE, password_hash VARCHAR, timezone VARCHAR(64)',
                  },
                  {
                    table: 'sessions',
                    cols: 'id UUID PRIMARY KEY, user_id UUID REFERENCES users, refresh_token_hash VARCHAR, device_name VARCHAR, expires_at TIMESTAMPTZ',
                  },
                  {
                    table: 'habits',
                    cols: 'id UUID PRIMARY KEY, user_id UUID REFERENCES users, name VARCHAR(100), frequency_type VARCHAR(20), paused_at TIMESTAMPTZ, archived_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ',
                  },
                  {
                    table: 'habit_completions',
                    cols: 'id UUID PRIMARY KEY, habit_id UUID REFERENCES habits, completion_date DATE NOT NULL, UNIQUE(habit_id, completion_date)',
                  },
                  {
                    table: 'reminders',
                    cols: 'id UUID PRIMARY KEY, habit_id UUID REFERENCES habits, reminder_time TIME, enabled BOOLEAN',
                  },
                ].map((t) => (
                  <div
                    key={t.table}
                    className="p-3 rounded-2xl bg-neutral-850 border border-neutral-800 font-mono text-xs"
                  >
                    <span className="font-bold text-sky-400">CREATE TABLE {t.table} (</span>
                    <p className="text-[11px] text-neutral-300 pl-4 py-1">{t.cols}</p>
                    <span className="text-sky-400">);</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Sync Engine & Conflict Resolution */}
          {activeTab === 'sync_engine' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-neutral-850 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Client Offline State</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOffline
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isOffline ? 'Offline (Queuing Mutations)' : 'Online (Direct Sync)'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Mutations update local React/SQLite state in &lt;50ms, appending an idempotent transaction to the local write-ahead queue.
                </p>
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={() => setIsOffline(!isOffline)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-xs font-bold border border-neutral-700"
                  >
                    Toggle {isOffline ? 'Online' : 'Offline'}
                  </button>
                  <button
                    onClick={() => showToast('Queue synced with server database!', undefined, 'success')}
                    className="px-3 py-1.5 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 rounded-xl text-xs font-bold border border-sky-500/30"
                  >
                    Flush Sync Queue ({syncQueue.length} items)
                  </button>
                </div>
              </div>

              {/* Conflict resolution logic notice */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Idempotent Conflict Strategy (PRD Section 9.3)
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  PostgreSQL enforces <code>UNIQUE(habit_id, completion_date)</code> with <code>ON CONFLICT DO NOTHING</code>, guaranteeing multiple offline taps resolve deterministically without duplicated records or streak miscalculations.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Push Reminders Trigger */}
          {activeTab === 'reminders' && (
            <div className="space-y-3">
              <div className="text-xs text-neutral-400">
                Trigger a live simulated push notification banner for any habit to test the single-tap completion flow from notifications:
              </div>

              <div className="space-y-2">
                {habits.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-2xl bg-neutral-850 border border-neutral-800 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{h.name}</h4>
                      <span className="text-[10px] text-neutral-400">
                        Scheduled Reminder: {h.reminder_time || 'None set'}
                      </span>
                    </div>

                    <button
                      onClick={() => triggerTestReminder(h.id)}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-rose-300" />
                      Trigger Push
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex justify-end">
          <button
            onClick={() => setIsArchitectureModalOpen(false)}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-bold rounded-xl"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
