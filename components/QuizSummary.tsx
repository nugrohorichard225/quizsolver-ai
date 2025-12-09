import React from 'react';
import { QuizResult } from '../types';
import { Trophy, CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react';

interface QuizSummaryProps {
  result: QuizResult;
  onClose: () => void;
  onRestart: () => void;
}

const QuizSummary: React.FC<QuizSummaryProps> = ({ result, onClose, onRestart }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-indigo-600 p-6 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="relative z-10">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-indigo-100" />
            <h2 className="text-2xl font-bold">Quiz Complete!</h2>
            <p className="text-indigo-100 opacity-90 text-sm mt-1">Here is your performance report</p>
          </div>
        </div>

        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="text-center flex-1 border-r border-slate-100">
                    <span className={`block text-5xl font-extrabold ${result.gradeDetails.color}`}>
                        {result.gradeDetails.grade}
                    </span>
                    <span className="text-sm text-slate-400 font-medium mt-1">Grade</span>
                </div>
                <div className="text-center flex-1">
                     <span className="block text-4xl font-bold text-slate-800">
                        {Math.round(result.score)}%
                    </span>
                    <span className="text-sm text-slate-400 font-medium mt-1">Total Score</span>
                </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                <p className={`text-center font-medium ${result.gradeDetails.color}`}>
                    "{result.gradeDetails.explanation}"
                </p>
            </div>

            {result.skippedCount > 0 && (
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-6 text-center">
                    <p className="text-orange-800 text-sm font-medium">
                        You have skipped {result.skippedCount} questions. These will be marked as unanswered.
                    </p>
                </div>
            )}

            <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center text-green-700 font-medium">
                        <CheckCircle className="w-5 h-5 mr-3" /> Correct
                    </div>
                    <span className="font-bold text-green-700">{result.correctCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center text-red-700 font-medium">
                        <XCircle className="w-5 h-5 mr-3" /> Incorrect
                    </div>
                    <span className="font-bold text-red-700">{result.incorrectCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex items-center text-orange-700 font-medium">
                        <AlertCircle className="w-5 h-5 mr-3" /> Skipped
                    </div>
                    <span className="font-bold text-orange-700">{result.skippedCount}</span>
                </div>
            </div>

            <div className="flex space-x-3">
                <button 
                    onClick={onRestart}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center"
                >
                    <RotateCcw className="w-4 h-4 mr-2" /> Start Over
                </button>
                <button 
                    onClick={onClose}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    Review Answers
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSummary;