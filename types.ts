export enum ProblemType {
  MENTAL = 'MENTAL',
  VERTICAL = 'VERTICAL',
  MIXED = 'MIXED',
  FILL_IN_BLANK = 'FILL_IN_BLANK', // 填空题
  COMPARE = 'COMPARE',             // 比大小
  WORD = 'WORD',                   // 应用题
}

export interface MathProblem {
  id: string;
  type: ProblemType;
  question: string;
}

export interface WorksheetData {
  id: string; // Unique ID for the worksheet itself
  mentalMath: MathProblem[];
  vertical: MathProblem[];
  mixed: MathProblem[];
  fillInBlank: MathProblem[];
  compare: MathProblem[];
  word: MathProblem[];
}

export interface GenerationSettings {
  mentalCount: number;
  verticalCount: number;
  mixedCount: number;
  fillInBlankCount: number;
  compareCount: number;
  wordCount: number;
  topicFocus: string; // e.g., "Multiplication", "Addition", "Mixed"
  batchSize: number;  // Number of sets to generate
}
