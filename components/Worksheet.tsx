import React, { useMemo } from 'react';
import { MathProblem, ProblemType, WorksheetData } from '../types';

interface WorksheetProps {
  data: WorksheetData[];
  onUpdateQuestion: (type: ProblemType, id: string, newQuestion: string) => void;
}

// Estimates for height calculations (in pixels)
// A4 @ 96dpi is approx 1123px high. We use a safe content height.
const PAGE_HEIGHT = 900; 
const HEADER_HEIGHT = 160;
const SECTION_TITLE_HEIGHT = 60;
// Footer height is reserved visually, but added via absolute positioning now
const FOOTER_BUFFER = 20; 

// Item heights (pixels) - adjusted for blank space without boxes
const HEIGHTS = {
  [ProblemType.FILL_IN_BLANK]: 50,
  [ProblemType.COMPARE]: 50,     
  [ProblemType.MENTAL]: 32,       // Significantly reduced for tight packing
  [ProblemType.VERTICAL]: 180,    
  [ProblemType.MIXED]: 160,       
  [ProblemType.WORD]: 160,        
};

// Grid columns
const COLS = {
  [ProblemType.FILL_IN_BLANK]: 2,
  [ProblemType.COMPARE]: 3,
  [ProblemType.MENTAL]: 4,
  [ProblemType.VERTICAL]: 3,
  [ProblemType.MIXED]: 2,
  [ProblemType.WORD]: 1,
};

interface RenderPage {
  setIndex: number;
  pageNumberInSet: number;
  items: React.ReactNode[];
}

export const Worksheet: React.FC<WorksheetProps> = ({ 
  data, 
  onUpdateQuestion,
}) => {
  
  // Logic to split data into A4 pages
  const pages = useMemo(() => {
    const generatedPages: RenderPage[] = [];

    data.forEach((worksheet, setIndex) => {
      let currentY = 0;
      let currentPageItems: React.ReactNode[] = [];
      let pageNumberInSet = 1;
      let sectionCounter = 1;

      // Helper to finalize the current page and start a new one
      const flushPage = () => {
        if (currentPageItems.length > 0) {
          // Add Footer to every page here using absolute positioning
          currentPageItems.push(
            <footer key={`footer-${setIndex}-${pageNumberInSet}`} className="absolute bottom-6 left-0 w-full text-center text-slate-300 text-xs font-handwritten">
               第 {pageNumberInSet} 页
            </footer>
          );

          generatedPages.push({
            setIndex,
            pageNumberInSet,
            items: currentPageItems
          });
          currentPageItems = [];
          pageNumberInSet++;
          currentY = 0;
        }
      };

      // 1. Add Header (Only on the first page of a set)
      currentPageItems.push(
        <header key={`header-${setIndex}-${pageNumberInSet}`} className="border-b-2 border-slate-800 pb-2 mb-6">
          <h1 className="text-2xl font-bold text-center text-slate-900 tracking-wide font-handwritten mb-4">
            小学三年级数学练习题 {data.length > 1 ? `(第 ${setIndex + 1} 套)` : ''}
          </h1>
          <div className="flex justify-between text-base text-slate-600 font-handwritten">
            <span>班级: __________</span>
            <span>姓名: __________</span>
            <span>用时: __________</span>
            <span>得分: __________</span>
          </div>
        </header>
      );
      currentY += HEADER_HEIGHT;

      // Processing Logic for each section type
      const processSection = (
        type: ProblemType, 
        questions: MathProblem[], 
        title: string, 
        pointsPerQ: number,
        instruction?: string
      ) => {
        if (questions.length === 0) return;

        const rowHeight = HEIGHTS[type];
        const cols = COLS[type];

        // ORPHAN CHECK:
        // Ensure Title + At least 1 row fits on the current page.
        // If not, push everything to next page.
        if (currentY + SECTION_TITLE_HEIGHT + rowHeight > PAGE_HEIGHT) {
          flushPage();
        }

        const sectionNum = sectionCounter++;
        // Reduced mb-4 to mb-2 for Unified spacing between title and questions
        currentPageItems.push(
          <h2 key={`title-${type}-${setIndex}-${pageNumberInSet}`} className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
             <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{sectionNum}</span>
             {title} <span className="text-sm font-normal text-slate-500 ml-1">{instruction || `(共${questions.length}题)`}</span>
          </h2>
        );
        currentY += SECTION_TITLE_HEIGHT;

        // Determine spacing based on type
        const isMental = type === ProblemType.MENTAL;
        const rowGap = isMental ? 'gap-y-1' : 'gap-y-2';
        const rowMb = isMental ? 'mb-1' : 'mb-2';

        // Process grid rows
        for (let i = 0; i < questions.length; i += cols) {
          const rowItems = questions.slice(i, i + cols);
          
          // Check if this row fits
          if (currentY + rowHeight > PAGE_HEIGHT) {
            flushPage();
            // No continuation text needed
          }

          // Render Row
          const rowContent = (
            <div key={`row-${type}-${i}`} className={`grid gap-x-8 ${rowGap} ${rowMb}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {rowItems.map((item, idx) => {
                 const absoluteIdx = i + idx;
                 return (
                  <div key={item.id} className="relative group">
                    {/* --- FILL IN BLANK --- */}
                    {type === ProblemType.FILL_IN_BLANK && (
                      <div className="flex items-center gap-2">
                        <span className="font-handwritten text-slate-500 w-5 text-right shrink-0 text-sm">{absoluteIdx + 1}.</span>
                        <input
                          type="text"
                          value={item.question}
                          onChange={(e) => onUpdateQuestion(type, item.id, e.target.value)}
                          className="w-full text-lg font-medium text-slate-800 border-b border-transparent hover:border-indigo-300 focus:outline-none bg-transparent font-handwritten"
                        />
                      </div>
                    )}

                    {/* --- COMPARE --- */}
                    {type === ProblemType.COMPARE && (
                       <input
                        type="text"
                        value={item.question}
                        onChange={(e) => onUpdateQuestion(type, item.id, e.target.value)}
                        className="w-full text-lg font-medium text-slate-800 border-b border-transparent hover:border-indigo-300 focus:outline-none bg-transparent font-handwritten text-center"
                      />
                    )}

                    {/* --- MENTAL --- */}
                    {type === ProblemType.MENTAL && (
                       <input
                        type="text"
                        value={item.question}
                        onChange={(e) => onUpdateQuestion(type, item.id, e.target.value)}
                        className="w-full text-lg font-medium text-slate-800 border-b border-transparent hover:border-indigo-300 focus:outline-none bg-transparent font-handwritten"
                      />
                    )}

                    {/* --- VERTICAL --- */}
                    {type === ProblemType.VERTICAL && (
                      <div className="flex flex-col h-full">
                        <input
                          type="text"
                          value={item.question}
                          onChange={(e) => onUpdateQuestion(type, item.id, e.target.value)}
                          className="w-full text-lg font-medium text-slate-800 mb-2 border-b border-transparent hover:border-indigo-300 focus:outline-none bg-transparent font-handwritten"
                        />
                        {/* Blank space for calculation - No border */}
                        <div className="flex-1 w-full"></div>
                      </div>
                    )}

                    {/* --- MIXED --- */}
                    {type === ProblemType.MIXED && (
                      <div className="flex flex-col h-full">
                        <div className="flex items-start gap-2">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                          <input
                            type="text"
                            value={item.question}
                            onChange={(e) => onUpdateQuestion(type, item.id, e.target.value)}
                            className="w-full text-lg font-medium text-slate-800 border-b border-transparent hover:border-indigo-300 focus:outline-none bg-transparent font-handwritten"
                          />
                        </div>
                         {/* Blank space for calculation - No border */}
                        <div className="flex-1 w-full"></div>
                      </div>
                    )}

                    {/* --- WORD --- */}
                    {type === ProblemType.WORD && (
                      <div className="flex flex-col h-full">
                         <div className="flex gap-2">
                          <span className="text-lg font-bold text-slate-700 font-handwritten shrink-0">{absoluteIdx + 1}.</span>
                          <textarea
                            value={item.question}
                            onChange={(e) => onUpdateQuestion(type, item.id, e.target.value)}
                            rows={2}
                            className="w-full text-lg font-medium text-slate-800 border-transparent hover:border-indigo-300 focus:outline-none bg-transparent font-handwritten resize-none overflow-hidden"
                            style={{ height: 'auto', minHeight: '3rem' }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = target.scrollHeight + 'px';
                            }}
                          />
                        </div>
                        {/* Blank space for answer - No border */}
                        <div className="flex-1 w-full min-h-[4rem]"></div>
                      </div>
                    )}
                  </div>
                 )
              })}
            </div>
          );
          
          currentPageItems.push(rowContent);
          currentY += rowHeight;
        }
      };

      // Execute Order
      processSection(ProblemType.FILL_IN_BLANK, worksheet.fillInBlank, "填空题", 2);
      processSection(ProblemType.COMPARE, worksheet.compare, "比大小", 1, "(在括号里填上“>”、“<”或“=”)" );
      processSection(ProblemType.MENTAL, worksheet.mentalMath, "口算题", 1);
      processSection(ProblemType.VERTICAL, worksheet.vertical, "竖式计算", 3);
      processSection(ProblemType.MIXED, worksheet.mixed, "脱式计算", 3);
      processSection(ProblemType.WORD, worksheet.word, "应用题", 5);

      // Footer is now handled automatically in flushPage for ALL pages.
      // We just ensure the last page is flushed.
      flushPage(); 
    });

    return generatedPages;
  }, [data, onUpdateQuestion]);

  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-col items-center pb-12 w-full">
      {/* Pages Container - Just list them vertically */}
      <div className="flex flex-col gap-8 w-full items-center">
        {pages.map((page, idx) => (
          <div 
            key={`page-${idx}`}
            className="a4-page bg-white shadow-xl w-[210mm] h-[297mm] p-[20mm] relative flex flex-col justify-between overflow-hidden transition-all duration-300"
          >
            {page?.items}
          </div>
        ))}
      </div>
    </div>
  );
};
