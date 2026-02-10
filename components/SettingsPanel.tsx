import React from 'react';
import { GenerationSettings } from '../types';
import { Settings, Sparkles, FileText, Copy, Trash2, Download } from 'lucide-react';

interface SettingsPanelProps {
  settings: GenerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  onGenerate: () => void;
  onDownload: () => void;
  isGenerating: boolean;
  isDownloading: boolean;
  historyCount: number;
  onClearHistory: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  setSettings,
  onGenerate,
  onDownload,
  isGenerating,
  isDownloading,
  historyCount,
  onClearHistory,
}) => {
  const handleChange = (key: keyof GenerationSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-full lg:w-80 bg-white border-r border-slate-200 h-screen overflow-y-auto sticky top-0 no-print flex flex-col shadow-lg z-10">
      <div className="p-6 bg-indigo-600 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-6 h-6" />
          <h1 className="text-xl font-bold">MathGenius</h1>
        </div>
        <p className="text-indigo-100 text-sm">Grade 3 Worksheet Generator</p>
      </div>

      <div className="p-6 flex-1 space-y-8">
        
        {/* Batch Settings */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Copy className="w-4 h-4" /> Batch Generation
          </h2>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Number of Worksheets (Sets)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="20"
                value={settings.batchSize}
                onChange={(e) => handleChange('batchSize', Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <span className="text-sm text-slate-500 whitespace-nowrap">Sets</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Generates multiple unique sets at once.
            </p>
          </div>
          
          {/* History Management */}
          <div className="pt-2 border-t border-slate-100">
             <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">History: {historyCount} Qs</span>
                <button 
                  type="button"
                  onClick={onClearHistory}
                  className="text-xs text-red-500 flex items-center gap-1 hover:text-red-700 cursor-pointer px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  title="Clear duplicate prevention history"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
             </div>
          </div>
        </div>

        {/* Quantity Settings */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" /> Questions Per Set
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mental (口算)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.mentalCount}
                onChange={(e) => handleChange('mentalCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Vertical (竖式)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={settings.verticalCount}
                onChange={(e) => handleChange('verticalCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mixed (脱式)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={settings.mixedCount}
                onChange={(e) => handleChange('mixedCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Fill Blank (填空)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={settings.fillInBlankCount}
                onChange={(e) => handleChange('fillInBlankCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

             <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Compare (比大小)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={settings.compareCount}
                onChange={(e) => handleChange('compareCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Word (应用题)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={settings.wordCount}
                onChange={(e) => handleChange('wordCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">Set count to 0 to disable a type.</p>
        </div>

        {/* Topic Focus */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Difficulty & Topic
          </h2>
          <textarea
            value={settings.topicFocus}
            onChange={(e) => handleChange('topicFocus', e.target.value)}
            rows={3}
            placeholder="e.g., Multiplication within 100, 3-digit addition..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
        <button
          onClick={onGenerate}
          disabled={isGenerating || isDownloading}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white transition-all ${
            isGenerating 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate {settings.batchSize > 1 ? `${settings.batchSize} Sets` : 'Worksheet'}
            </>
          )}
        </button>

        <button
          onClick={onDownload}
          disabled={isDownloading || isGenerating}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all shadow-sm ${
            isDownloading ? 'cursor-not-allowed opacity-70' : ''
          }`}
        >
          {isDownloading ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
              Saving PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Save as PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
};