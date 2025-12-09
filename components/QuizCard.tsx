import React from 'react';
import { SolvedQuestion, QuizMode } from '../types';
import { CheckCircle, XCircle, HelpCircle, Loader2, PlayCircle, AlertCircle } from 'lucide-react';

interface QuizCardProps {
  question: SolvedQuestion;
  index: number;
  onSelectOption: (optionIndex: number) => void;
  onCheckAnswer: () => void;
  disabled?: boolean;
  quizMode: QuizMode;
}

const QuizCard: React.FC<QuizCardProps> = ({ question, index, onSelectOption, onCheckAnswer, disabled, quizMode }) => {
  const isIdle = question.status === 'idle';
  const isValidating = question.status === 'validating';
  const isValidated = question.status === 'validated';
  const isError = question.status === 'error';
  const isSkipped = question.isSkipped;
  const hasSelection = question.userSelectedOptionIndex !== undefined;

  return (
    <div 
      id={`question-${index}`} 
      className={`bg-white rounded-xl shadow-sm border p-4 md:p-6 transition-all duration-300 scroll-mt-24
      ${isValidated && question.isCorrect ? 'border-green-200 shadow-green-50' : ''} 
      ${isValidated && !question.isCorrect && !isSkipped ? 'border-red-200 shadow-red-50' : ''}
      ${isSkipped ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'}
      ${disabled ? 'opacity-80' : ''}
    `}>
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded ${isSkipped ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
            Question {index + 1}
          </span>
          {isValidating && <span className="text-xs text-indigo-500 flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1"/> Checking...</span>}
          {isError && <span className="text-xs text-red-500">Validation Failed</span>}
          {isSkipped && <span className="text-xs text-orange-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> Skipped</span>}
        </div>
      </div>

      <h3 className="text-base md:text-lg font-medium text-slate-800 mb-4 md:mb-6 leading-relaxed">
        {question.questionText}
      </h3>

      <div className="space-y-2 md:space-y-3">
        {question.options.map((option, idx) => {
          const isSelected = question.userSelectedOptionIndex === idx;
          const isCorrectAnswer = question.correctOptionIndex === idx;
          
          let optionClass = "group relative p-3 md:p-4 rounded-lg border text-sm transition-all duration-200 flex justify-between items-center ";
          
          // Cursor and Pointer Events based on disabled state
          if (!disabled) {
            optionClass += "cursor-pointer ";
          } else {
            optionClass += "cursor-not-allowed ";
          }

          let icon = null;

          if (isValidated) {
            // Validated State
            if (isCorrectAnswer) {
              optionClass += "bg-green-50 border-green-400 text-green-900 ring-1 ring-green-200 font-medium";
              icon = <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />;
            } else if (isSelected && !question.isCorrect) {
              optionClass += "bg-red-50 border-red-300 text-red-900 ring-1 ring-red-100 font-medium";
              icon = <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />;
            } else {
              optionClass += "bg-white border-gray-100 text-gray-400 opacity-60";
            }
          } else {
            // Idle / Selection State
            if (isSelected) {
              optionClass += "bg-indigo-50 border-indigo-400 text-indigo-900 ring-1 ring-indigo-200 shadow-sm";
            } else if (!isValidating) {
              if (!disabled) {
                optionClass += "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50";
              } else {
                optionClass += "bg-white border-slate-200 text-slate-400";
              }
            } else {
               optionClass += "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"; 
            }
          }

          return (
            <div 
              key={idx} 
              onClick={() => !disabled && !isValidated && !isValidating && onSelectOption(idx)}
              className={optionClass}
            >
              <div className="flex items-start">
                 <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 border transition-colors flex-shrink-0 mt-0.5
                    ${isSelected || (isValidated && isCorrectAnswer) ? 'border-current bg-current text-white bg-opacity-100' : 'border-slate-300 text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-500'}
                 `}>
                    {String.fromCharCode(65 + idx)}
                 </span>
                 <span className="flex-1 mr-2 break-words">{option}</span>
              </div>
              {icon}
            </div>
          );
        })}
      </div>

      {/* Action Bar - Only show in Standard Mode */}
      {!isValidated && quizMode === 'standard' && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onCheckAnswer}
            disabled={disabled || !hasSelection || isValidating}
            className={`flex items-center w-full justify-center sm:w-auto px-5 py-2 rounded-lg text-sm font-medium transition-all
                ${hasSelection && !isValidating && !disabled
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg translate-y-0' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
            `}
          >
            {isValidating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
            ) : (
                <><PlayCircle className="w-4 h-4 mr-2" /> Check Answer</>
            )}
          </button>
        </div>
      )}

      {isValidated && (
        <div className={`mt-6 p-4 md:p-5 rounded-lg border animate-in fade-in slide-in-from-top-2 duration-300
            ${isSkipped ? 'bg-orange-50 border-orange-100' : (question.isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100')}
        `}>
          <h4 className={`text-sm font-bold mb-2 flex items-center ${isSkipped ? 'text-orange-800' : (question.isCorrect ? 'text-green-800' : 'text-red-800')}`}>
            {isSkipped ? <AlertCircle className="w-4 h-4 mr-2"/> : (question.isCorrect ? <CheckCircle className="w-4 h-4 mr-2"/> : <XCircle className="w-4 h-4 mr-2"/>)}
            {isSkipped ? 'Skipped (Unanswered)' : (question.isCorrect ? 'Correct!' : 'Incorrect')}
          </h4>
          
          {isSkipped ? (
             <p className="text-sm text-orange-800 mb-2">
                 You did not answer this question.
             </p>
          ) : (
             <>
                {question.explanation && (
                    <p className={`text-sm leading-relaxed ${question.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {question.explanation}
                    </p>
                )}
                {question.reasoningForIncorrect && (
                    <div className={`mt-4 pt-3 border-t ${question.isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                        <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${question.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            Analysis of options
                        </h5>
                        <p className={`text-sm ${question.isCorrect ? 'text-green-800' : 'text-red-800'} opacity-90`}>
                            {question.reasoningForIncorrect}
                        </p>
                    </div>
                )}
             </>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizCard;