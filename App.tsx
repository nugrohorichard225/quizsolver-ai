import React, { useState, useEffect, useRef } from 'react';
import FileUpload from './components/FileUpload';
import QuizCard from './components/QuizCard';
import QuizSummary from './components/QuizSummary';
import { parseQuizText } from './utils/parser';
import { validateAnswer, validateBatch } from './services/geminiService';
import { calculateGrade } from './utils/grading';
import { SolvedQuestion, QuizResult, QuizMode } from './types';
import { BrainCircuit, RotateCcw, CheckSquare, AlertTriangle, Loader2, Timer, Sword, FileBarChart } from 'lucide-react';

const CHALLENGE_TIME_SECONDS = 7200; // 120 minutes = 2 hours
const CHALLENGE_QUESTION_COUNT = 50;

const App: React.FC = () => {
  const [questions, setQuestions] = useState<SolvedQuestion[]>([]);
  const [showUnansweredAlert, setShowUnansweredAlert] = useState(false);
  const [unansweredIndices, setUnansweredIndices] = useState<number[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizMode, setQuizMode] = useState<QuizMode>('standard');
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_TIME_SECONDS);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Store the result persistently so we can re-open the summary
  const persistentResultRef = useRef<QuizResult | null>(null);

  // Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    // Stop timer if submitted, or if finishing (grading in progress)
    const isTimerActive = quizMode === 'challenge' && 
                          questions.length > 0 && 
                          timeLeft > 0 && 
                          !hasSubmitted && 
                          !isFinishing;

    if (isTimerActive) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsTimeExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizMode, questions.length, timeLeft, hasSubmitted, isFinishing]);

  const handleTextLoaded = (text: string, mode: QuizMode) => {
    setQuizMode(mode);
    let parsed = parseQuizText(text);
    
    // In challenge mode, take only random 50 (parsed is already shuffled)
    if (mode === 'challenge') {
        parsed = parsed.slice(0, CHALLENGE_QUESTION_COUNT);
        setTimeLeft(CHALLENGE_TIME_SECONDS);
        setIsTimeExpired(false);
    }

    const initialQuestions: SolvedQuestion[] = parsed.map(p => ({
      ...p,
      status: 'idle'
    }));
    setQuestions(initialQuestions);
    setQuizResult(null);
    persistentResultRef.current = null;
    setHasSubmitted(false);
  };

  const handleReset = () => {
    setQuestions([]);
    setQuizResult(null);
    persistentResultRef.current = null;
    setIsFinishing(false);
    setIsTimeExpired(false);
    setHasSubmitted(false);
    setTimeLeft(CHALLENGE_TIME_SECONDS);
  };

  const handleRestart = () => {
      setQuestions(prev => prev.map(q => ({
          ...q,
          status: 'idle',
          isCorrect: undefined,
          correctOptionIndex: undefined,
          explanation: undefined,
          reasoningForIncorrect: undefined,
          isSkipped: undefined,
          userSelectedOptionIndex: undefined
      })));
      setQuizResult(null);
      persistentResultRef.current = null;
      setIsFinishing(false);
      setHasSubmitted(false);
      
      // Reset timer if challenge
      if (quizMode === 'challenge') {
          setTimeLeft(CHALLENGE_TIME_SECONDS);
          setIsTimeExpired(false);
      }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isTimeExpired || hasSubmitted || isFinishing) return;
    setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, userSelectedOptionIndex: optionIndex } : q
    ));
  };

  const handleCheckAnswer = async (questionId: string) => {
    if (isTimeExpired || hasSubmitted || isFinishing) return;
    const question = questions.find(q => q.id === questionId);
    if (!question || question.userSelectedOptionIndex === undefined) return;

    setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, status: 'validating' } : q
    ));

    try {
        const result = await validateAnswer(question, question.userSelectedOptionIndex);
        
        setQuestions(prev => prev.map(q => 
            q.id === questionId ? {
                ...q,
                status: 'validated',
                isCorrect: result.isCorrect,
                correctOptionIndex: result.correctOptionIndex,
                explanation: result.explanation,
                reasoningForIncorrect: result.reasoningForIncorrect
            } : q
        ));

    } catch (error) {
        setQuestions(prev => prev.map(q => 
            q.id === questionId ? { ...q, status: 'error' } : q
        ));
    }
  };

  const handleFinishClick = () => {
    const indices = questions
      .map((q, idx) => (q.userSelectedOptionIndex === undefined ? idx : -1))
      .filter(idx => idx !== -1);
    
    // If time is expired, force finish immediately (skip back option)
    if (isTimeExpired) {
        setUnansweredIndices(indices); 
        setShowUnansweredAlert(true); 
    } else if (indices.length > 0) {
        setUnansweredIndices(indices);
        setShowUnansweredAlert(true);
    } else {
        processFinish();
    }
  };

  const handleGoBackToUnanswered = () => {
    setShowUnansweredAlert(false);
    if (unansweredIndices.length > 0) {
      const firstUnanswered = unansweredIndices[0];
      const element = document.getElementById(`question-${firstUnanswered}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleContinueAnyway = () => {
    setShowUnansweredAlert(false);
    processFinish();
  };

  const processFinish = async () => {
    setIsFinishing(true);

    // 1. Identify ALL questions that are not yet validated
    const unvalidated = questions.filter(q => q.status !== 'validated');
    
    // 2. Separate into "Answered" (needs API) and "Skipped" (local only)
    const answeredToValidate = unvalidated.filter(q => q.userSelectedOptionIndex !== undefined);
    const skippedQuestions = unvalidated.filter(q => q.userSelectedOptionIndex === undefined);
    const skippedIds = new Set(skippedQuestions.map(q => q.id));

    // 3. Mark all as 'validating' for UI feedback
    setQuestions(prev => prev.map(q => 
        unvalidated.some(u => u.id === q.id) ? { ...q, status: 'validating' } : q
    ));

    try {
        // 4. Batch grade ONLY the answered questions
        const resultsMap = new Map();
        
        if (answeredToValidate.length > 0) {
            const chunkSize = 5;
            for (let i = 0; i < answeredToValidate.length; i += chunkSize) {
                const chunk = answeredToValidate.slice(i, i + chunkSize);
                // We know userSelectedOptionIndex is defined here
                const chunkPayload = chunk.map(q => ({
                    question: q,
                    selectedOptionIndex: q.userSelectedOptionIndex! 
                }));

                try {
                    const results = await validateBatch(chunkPayload);
                    results.forEach(r => {
                        if (r.id) resultsMap.set(r.id, r);
                    });
                } catch (e) {
                    console.error("Batch error", e);
                }
            }
        }

        // 5. Update all questions with results
        setQuestions(prev => {
            const nextQuestions = prev.map(q => {
                // Case A: Answered and we got a result from AI
                if (resultsMap.has(q.id)) {
                    const res = resultsMap.get(q.id);
                    return {
                        ...q,
                        status: 'validated' as const,
                        isCorrect: res.isCorrect,
                        isSkipped: false,
                        correctOptionIndex: res.correctOptionIndex,
                        explanation: res.explanation,
                        reasoningForIncorrect: res.reasoningForIncorrect
                    };
                }
                // Case B: Skipped (User did not answer) - No API call made
                else if (skippedIds.has(q.id)) {
                    return {
                        ...q,
                        status: 'validated' as const,
                        isCorrect: false, // Skipped is effectively not correct, but we distinguish with isSkipped
                        isSkipped: true,
                        // No explanation or correctOptionIndex available since we optimized the API call
                    };
                }
                // Case C: Already validated previously
                return q;
            });

            // 6. Calculate Score
            const total = nextQuestions.length;
            const correct = nextQuestions.filter(q => q.isCorrect && !q.isSkipped).length;
            const skipped = nextQuestions.filter(q => q.isSkipped).length;
            // Incorrect are answered questions that were wrong
            const incorrect = total - correct - skipped;
            
            const score = total > 0 ? (correct / total) * 100 : 0;

            const gradeDetails = calculateGrade(score);

            const result = {
                score,
                correctCount: correct,
                incorrectCount: incorrect,
                skippedCount: skipped,
                total,
                gradeDetails
            };

            setQuizResult(result);
            persistentResultRef.current = result;
            
            setHasSubmitted(true);
            return nextQuestions;
        });

    } catch (error) {
        console.error("Finish process failed", error);
    } finally {
        setIsFinishing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className={`p-1.5 md:p-2 rounded-lg shadow-sm ${quizMode === 'challenge' ? 'bg-rose-600' : 'bg-indigo-600'}`}>
                {quizMode === 'challenge' ? <Sword className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <BrainCircuit className="w-4 h-4 md:w-5 md:h-5 text-white" />}
            </div>
            <div>
                <h1 className="text-base md:text-lg font-bold text-slate-800 tracking-tight leading-none">QuizSolver AI</h1>
                {quizMode === 'challenge' && <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block md:inline">Challenge Mode</span>}
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
             {quizMode === 'challenge' && questions.length > 0 && (
                 <div className={`flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-md font-mono font-bold text-sm md:text-lg transition-colors duration-300
                    ${(isTimeExpired || hasSubmitted || isFinishing)
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : (timeLeft < 300 ? 'text-red-600 bg-red-50 animate-pulse' : 'text-slate-700 bg-slate-100')
                    }
                 `}>
                     {(hasSubmitted || isFinishing) && !isTimeExpired ? (
                        <CheckSquare className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-emerald-400" />
                     ) : (
                        <Timer className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                     )}
                     {formatTime(timeLeft)}
                 </div>
             )}

             {questions.length > 0 && (
                <button 
                  onClick={handleReset}
                  className="text-slate-500 hover:text-red-600 font-medium text-xs md:text-sm flex items-center px-2 py-1.5 md:px-3 rounded-md hover:bg-slate-50 transition-colors"
                  title="Start Over"
                >
                    <RotateCcw className="w-4 h-4 md:mr-2" /> 
                    <span className="hidden md:inline">Start Over</span>
                </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6 md:py-8 max-w-3xl">
        {questions.length === 0 ? (
          <div className="mt-6 md:mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FileUpload onTextLoaded={handleTextLoaded} />
            <div className="mt-8 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
        ) : (
          <div className={`space-y-6 md:space-y-8 pb-32 transition-opacity duration-500 ${(isTimeExpired || hasSubmitted) ? 'opacity-95' : ''}`}>
             <div className="flex justify-between items-center mb-4 md:mb-6">
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-slate-800">Your Quiz</h2>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">
                        {(hasSubmitted && !isFinishing) 
                           ? "Review your answers below" 
                           : "Answer questions and click Finish"
                        }
                    </p>
                </div>
                <span className={`px-2 py-1 md:px-3 rounded-full text-[10px] md:text-xs font-semibold ${quizMode === 'challenge' ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'}`}>
                    {questions.length} Questions
                </span>
             </div>

             <div className="grid gap-6 md:gap-8">
              {questions.map((q, index) => (
                <QuizCard 
                    key={q.id} 
                    question={q} 
                    index={index} 
                    onSelectOption={(optIdx) => handleSelectOption(q.id, optIdx)}
                    onCheckAnswer={() => handleCheckAnswer(q.id)}
                    disabled={isTimeExpired || hasSubmitted || isFinishing}
                    quizMode={quizMode}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button for Finish / View Results */}
      {questions.length > 0 && !quizResult && (
        <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-30 animate-in zoom-in duration-300">
             {!hasSubmitted && (
                <button
                    onClick={handleFinishClick}
                    disabled={isFinishing}
                    className={`px-6 py-3 md:px-8 md:py-4 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 font-bold flex items-center space-x-2 md:space-x-3 text-base md:text-lg
                        ${isTimeExpired 
                            ? 'bg-white text-red-600 border-2 border-red-500 shadow-red-200 animate-pulse ring-4 ring-red-100' 
                            : 'bg-slate-900 hover:bg-black text-white'}
                        ${isFinishing ? 'cursor-not-allowed opacity-90' : ''}
                    `}
                >
                    {isFinishing ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> <span>Grading...</span></>
                    ) : (
                        <><CheckSquare className="w-5 h-5" /> <span>Finish Quiz</span></>
                    )}
                </button>
             )}
             
             {hasSubmitted && persistentResultRef.current && (
                 <button
                    onClick={() => {
                        setQuizResult(persistentResultRef.current);
                    }}
                    className="px-6 py-3 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center space-x-2 transition-all hover:scale-105"
                 >
                    <FileBarChart className="w-5 h-5" /> <span>Review Score</span>
                 </button>
             )}
        </div>
      )}

      {/* Unanswered / Time Expired Alert Modal */}
      {showUnansweredAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                  <div className={`flex items-center space-x-3 mb-4 ${isTimeExpired ? 'text-red-600' : 'text-orange-600'}`}>
                      <AlertTriangle className="w-8 h-8" />
                      <h3 className="text-xl font-bold text-slate-800">
                          {isTimeExpired ? 'Time Expired!' : 'Unanswered Questions'}
                      </h3>
                  </div>
                  
                  {isTimeExpired ? (
                      <div className="mb-6">
                          <p className="text-slate-600 mb-2">
                              Your time is up! You can no longer submit answers.
                          </p>
                          <p className="text-sm text-red-500 font-medium">
                              All {unansweredIndices.length} unanswered questions will be marked as incorrect.
                          </p>
                      </div>
                  ) : (
                      <>
                        <p className="text-slate-600 mb-2">
                            You have skipped <strong>{unansweredIndices.length}</strong> questions:
                        </p>
                        <div className="text-sm text-slate-500 mb-6 bg-slate-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                            {unansweredIndices.map(i => `#${i+1}`).join(', ')}
                        </div>
                        <p className="text-sm text-slate-500 mb-6">
                            If you continue, these will be marked as <strong>incorrect</strong>.
                        </p>
                      </>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3">
                      {!isTimeExpired && (
                          <button 
                            onClick={handleGoBackToUnanswered}
                            className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                          >
                              Go Back
                          </button>
                      )}
                      <button 
                        onClick={handleContinueAnyway}
                        className={`flex-1 py-2.5 px-4 text-white rounded-lg font-semibold transition-colors shadow-md
                            ${isTimeExpired 
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                                : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200'}
                        `}
                      >
                          {isTimeExpired ? 'Submit & Grade' : 'Continue Anyway'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Result Summary Modal */}
      {quizResult && (
          <QuizSummary 
            result={quizResult} 
            onClose={() => setQuizResult(null)} 
            onRestart={handleRestart}
          />
      )}
    </div>
  );
};

export default App;