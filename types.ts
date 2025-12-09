export interface ParsedQuestion {
  id: string;
  questionText: string;
  options: string[];
  rawOriginal: string;
}

export interface SolvedQuestion extends ParsedQuestion {
  userSelectedOptionIndex?: number;
  correctOptionIndex?: number;
  isCorrect?: boolean;
  isSkipped?: boolean;
  explanation?: string;
  reasoningForIncorrect?: string;
  status: 'idle' | 'validating' | 'validated' | 'error';
}

export interface ValidationResult {
  id?: string;
  isCorrect: boolean;
  correctOptionIndex: number;
  explanation: string;
  reasoningForIncorrect: string;
}

export interface GradeResult {
  grade: string;
  explanation: string;
  color: string;
}

export interface QuizResult {
  score: number; // percentage
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  total: number;
  gradeDetails: GradeResult;
}

export type QuizMode = 'standard' | 'challenge';