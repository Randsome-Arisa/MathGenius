import React, { useMemo } from 'react';
import { MathProblem, ProblemType, WorksheetData } from '../types';

interface WorksheetProps {
  data: WorksheetData[];
  onUpdateQuestion: (type: ProblemType, id: string, newQuestion: string) => void;
}

// Estimates for height calculations (in pixels)
const PAGE_HEIGHT = 1040; // Usable height for A4
const HEADER_HEIGHT = 120; 
const SECTION_TITLE_HEIGHT = 40; 

// Item heights (pixels) - Explicitly reserved space for working out answers
const HEIGHTS = {
  [ProblemType.FILL_IN_BLANK]: 50,
  [ProblemType.COMPARE]: 50,     
  [ProblemType.MENTAL]: 32,       
  [ProblemType.VERTICAL]: 240,    // Reduced from 260
  [ProblemType.MIXED]: 190,       // Reduced from 220
  [ProblemType.WORD]: 220,        // Reduced from 240
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
  
  const pages = useMemo(() => {
    const generatedPages: RenderPage[] = [];

    data.forEach((worksheet, setIndex) => {
      let currentY = 0;
      let currentPageItems: React.ReactNode[] = [];
      let pageNumberInSet = 1;
      let sectionCounter = 1;

      const flushPage = () => {
        if (currentPageItems.length > 0) {
          currentPageItems.push(
            <footer key={`footer-${setIndex}-${pageNumberInSet}`} className="absolute bottom-4 left-0 w-full text-center text-slate-300 text-xs font-handwritten">
               - {pageNumberInSet} -
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

      // Header
      currentPageItems.push(
        <header key={`header-${setIndex}-${pageNumberInSet}`} className="border-b-2 border-slate-800 pb-2 mb-2">
          <h1 className="text-2xl font-bold text-center text-slate-900 tracking-widest font-handwritten mb-4">
            三年级数学练习
          </h1>
          <div className="flex justify-between text-base text-slate-800 font-handwritten px-8">
            <span>日期: __________</span>
            <span>姓名: __________</span>
            <span>打分: __________</span>
          </div>
        </header>
      );
      currentY += HEADER_HEIGHT;

      const processSection = (
        type: ProblemType, 
        questions: MathProblem[], 
        title: string, 
        instruction?: string
      ) => {
        if (questions.length === 0) return;

        const rowHeight = HEIGHTS[type];
        const cols = COLS[type];
        const isMental = type === ProblemType.MENTAL;
        
        // Spacing Logic
        // Mental: Tight spacing (mb-1).
        // Others: Moderate margin bottom (mb-5) to separate rows visually.
        const rowMb = isMental ? 'mb-1' : 'mb-5'; 
        
        // Gap X is for columns separation
        const gapX = 'gap-x-8';

        if (currentY + SECTION_TITLE_HEIGHT + rowHeight > PAGE_HEIGHT) {
          flushPage();
        }

        const sectionNum = sectionCounter++;
        
        // Clean Section Title
        currentPageItems.push(
          <h2 key={`title-${type}-${setIndex}-${pageNumberInSet}`} className="text-lg font-bold text-slate-900 mb-4 mt-4 flex items-baseline gap-2 font-handwritten">
             <span className="text-xl">{sectionNum}.</span>
             {title} 
             {instruction && <span className="text-sm font-normal text-slate-500 ml-1">{instruction}</span>}
          </h2>
        );
        currentY += SECTION_TITLE_HEIGHT;

        for (let i = 0; i < questions.length; i += cols) {
          const rowItems = questions.slice(i, i + cols);
          
          // Check if this row fits on page
          if (currentY + rowHeight + 20 > PAGE_HEIGHT) {
            flushPage();
          }

          const rowContent = (
            <div 
              key={`row-${type}-${i}`} 
              className={`grid ${gapX} ${rowMb}`} 
              style={{ 
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` 
              }}
            >
              {rowItems.map((item, idx) => {
                 const absoluteIdx = i + idx;
                 return (
                  <div 
                    key={item.id} 
                    className="relative"
                    // Force height for non-mental problems to ensure writing space
                    style={{ height: isMental ? 'auto' : `${rowHeight}px` }}
                  >
                    
                    {/* --- 1. MENTAL (Tight, Clean) --- */}
                    {type === ProblemType.MENTAL && (
                       <div className="flex items-center">
                         <input
                          type="text"
                          value={item.question}
                          onChange={(e) => onUpdateQuestion(type, item.id, e.target.value)}
                          className="w-full text-lg font-medium text-slate-800 focus:outline-none bg-transparent font-handwritten py-0 px-1"
                        />
                       </div>
                    )}

                    {/* --- 2. VERTICAL (Updated to match Mixed format) --- */}
                    {type === ProblemType.VERTICAL && (
                      <div className="flex flex-col h-full pt-1">
                        <div className="flex items-start gap-2 pl-4 relative">
                          <span className="absolute left-0 top-1 text-sm text-slate-500 font-handwritten">{absoluteIdx + 1}.</span>
                          <input
                            type="text"
                            value={item.question}
                            onChange={(e) => onUpdateQuestion(type, item.id, e.target.value)}
                            className="w-full text-lg font-medium text-slate-800 focus:outline-none bg-transparent font-handwritten"
                          />
                        </div>
                        {/* Space is guaranteed by parent height + h-full */}
                        <div className="flex-1 w-full"></div>
                      </div>
                    )}

                    {/* --- 3. WORD (Spacious) --- */}
                    {type === ProblemType.WORD && (
                      <div className="flex flex-col h-full pt-1">
                         <div className="flex gap-2 items-start">
                          <span className="text-lg font-bold text-slate-700 font-handwritten shrink-0 mt-0.5">{absoluteIdx + 1}.</span>
                          <textarea
                            value={item.question}
                            onChange={(e) => onUpdateQuestion(type, item.id, e.target.value)}
                            rows={2}
                            className="w-full text-lg font-medium text-slate-800 focus:outline-none bg-transparent font-handwritten resize-none overflow-hidden leading-snug"
                            style={{ height: 'auto' }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = target.scrollHeight + 'px';
                            }}
                          />
                        </div>
                        <div className="flex-1"></div>
                      </div>
                    )}

                    {/* --- 4. MIXED (Spacious) --- */}
                    {type === ProblemType.MIXED && (
                      <div className="flex flex-col h-full pt-1">
                        <div className="flex items-start gap-2 pl-4 relative">
                          <span className="absolute left-0 top-1 text-sm text-slate-500 font-handwritten">{absoluteIdx + 1}.</span>
                          <input
                            type="text"
                            value={item.question}
                            onChange={(e) => onUpdateQuestion(type, item.id, e.target.value)}
                            className="w-full text-lg font-medium text-slate-800 focus:outline-none bg-transparent font-handwritten"
                          />
                        </div>
                         <div className="flex-1"></div>
                      </div>
                    )}

                    {/* --- 5. FILL IN BLANK --- */}
                    {type === ProblemType.FILL_IN_BLANK && (
                      <div className="flex items-center gap-2 pl-4 relative h-full">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-handwritten">{absoluteIdx + 1}.</span>
                        <input
                          type="text"
                          value={item.question}
                          onChange={(e) => onUpdateQuestion(type, item.id, e.target.value)}
                          className="w-full text-lg font-medium text-slate-800 focus:outline-none bg-transparent font-handwritten"
                        />
                      </div>
                    )}

                    {/* --- 6. COMPARE --- */}
                    {type === ProblemType.COMPARE && (
                      <div className="pl-4 relative h-full flex items-center">
                         <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-handwritten">{absoluteIdx + 1}.</span>
                         <input
                          type="text"
                          value={item.question}
                          onChange={(e) => onUpdateQuestion(type, item.id, e.target.value)}
                          className="w-full text-lg font-medium text-slate-800 focus:outline-none bg-transparent font-handwritten text-center"
                        />
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

      processSection(ProblemType.FILL_IN_BLANK, worksheet.fillInBlank, "填空题");
      processSection(ProblemType.COMPARE, worksheet.compare, "比大小", "(在括号里填上“>”、“<”或“=”)" );
      processSection(ProblemType.MENTAL, worksheet.mentalMath, "口算题");
      processSection(ProblemType.VERTICAL, worksheet.vertical, "竖式计算");
      processSection(ProblemType.MIXED, worksheet.mixed, "脱式计算");
      processSection(ProblemType.WORD, worksheet.word, "应用题");

      flushPage(); 
    });

    return generatedPages;
  }, [data, onUpdateQuestion]);

  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-col items-center pb-12 w-full">
      <div className="flex flex-col gap-8 w-full items-center">
        {pages.map((page, idx) => (
          <div 
            key={`page-${idx}`}
            className="a4-page bg-white shadow-xl w-[210mm] h-[297mm] p-[20mm] relative flex flex-col overflow-hidden"
          >
            {page?.items}
          </div>
        ))}
      </div>
    </div>
  );
};
