import React, { useState, useEffect } from 'react';
import { SettingsPanel } from './components/SettingsPanel';
import { Worksheet } from './components/Worksheet';
import { generateQuestions } from './services/geminiService';
import { GenerationSettings, WorksheetData, ProblemType } from './types';

const INITIAL_SETTINGS: GenerationSettings = {
  mentalCount: 25,
  verticalCount: 6,
  mixedCount: 6,
  fillInBlankCount: 0,
  compareCount: 0,
  wordCount: 1,
  topicFocus: '中等难度三年级混合运算（加减乘除），竖式计算只需要乘除法',
  batchSize: 1,
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<GenerationSettings>(INITIAL_SETTINGS);
  const [worksheetData, setWorksheetData] = useState<WorksheetData[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [history, setHistory] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (!hasInitialLoad) {
      handleGenerate();
      setHasInitialLoad(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const newWorksheets: WorksheetData[] = [];
    const tempHistory = new Set(history);

    try {
      for (let i = 0; i < settings.batchSize; i++) {
        const avoidList = Array.from(tempHistory);
        const data = await generateQuestions(settings, avoidList, i);
        newWorksheets.push(data);
        [
          ...data.mentalMath, 
          ...data.vertical, 
          ...data.mixed, 
          ...data.fillInBlank,
          ...data.compare,
          ...data.word
        ].forEach(p => tempHistory.add(p.question));

        // Add a delay between batch items to avoid Rate Limits (429), 
        // especially important for free tier (15 RPM)
        if (i < settings.batchSize - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      setWorksheetData(newWorksheets);
      setHistory(tempHistory);
    } catch (error) {
      console.error("Failed to generate worksheet", error);
      alert("Failed to generate questions. Please check your API key and try again (you may be hitting rate limits).");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearHistory = () => {
    setHistory(new Set());
  };

  // Switch to native print for robust multi-page support
  const handlePrint = () => {
    window.print();
  };

  const handleUpdateQuestion = (type: ProblemType, id: string, newQuestion: string) => {
    setWorksheetData((prevWorksheets) => {
      return prevWorksheets.map(ws => {
        const updateList = (list: any[]) => 
          list.map(q => q.id === id ? { ...q, question: newQuestion } : q);

        return {
          ...ws,
          mentalMath: updateList(ws.mentalMath),
          vertical: updateList(ws.vertical),
          mixed: updateList(ws.mixed),
          fillInBlank: updateList(ws.fillInBlank),
          compare: updateList(ws.compare),
          word: updateList(ws.word),
        };
      });
    });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-100 print:bg-white">
      <SettingsPanel
        settings={settings}
        setSettings={setSettings}
        onGenerate={handleGenerate}
        onDownload={handlePrint}
        isGenerating={isGenerating}
        isDownloading={false} // No longer using loading state for print
        historyCount={history.size}
        onClearHistory={handleClearHistory}
      />

      <main className="flex-1 overflow-x-hidden relative p-8 print:p-0 print:overflow-visible">
        <div id="print-area">
          <Worksheet 
            data={worksheetData} 
            onUpdateQuestion={handleUpdateQuestion}
          />
        </div>
      </main>
    </div>
  );
};

export default App;