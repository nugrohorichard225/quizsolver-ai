import React, { useState, useRef } from 'react';
import { Upload, FileText, Clipboard, Timer, Sword } from 'lucide-react';
import { QuizMode } from '../types';

interface FileUploadProps {
  onTextLoaded: (text: string, mode: QuizMode) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onTextLoaded }) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setText(content);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (mode: QuizMode) => {
    if (text.trim()) {
      onTextLoaded(text, mode);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 max-w-3xl mx-auto border border-slate-100">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Upload Quiz Data</h2>
        <p className="text-sm md:text-base text-slate-500">Paste your raw quiz text or upload a .txt file.</p>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <textarea
            className="w-full h-48 md:h-64 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 bg-slate-50 text-xs md:text-sm font-mono transition-all outline-none resize-none"
            placeholder="Paste your quiz content here... (e.g., Soal UAS Bot...)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="absolute bottom-4 right-4 flex space-x-2">
            <button 
                onClick={() => {
                    navigator.clipboard.readText().then(t => setText(prev => prev + t));
                }}
                className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-md flex items-center shadow-sm"
            >
                <Clipboard className="w-3 h-3 mr-1.5" /> Paste
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
           <div className="flex items-center justify-center md:justify-start">
             <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".txt"
                onChange={handleFileChange}
             />
             <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full md:w-auto flex items-center justify-center text-sm text-slate-600 hover:text-indigo-600 font-medium px-4 py-3 md:py-2 rounded-lg border border-dashed border-slate-300 hover:border-indigo-300 hover:bg-slate-50 transition-all"
             >
                <Upload className="w-4 h-4 mr-2" />
                Upload .txt File
             </button>
           </div>

           <div className="flex flex-col sm:flex-row gap-3">
             <button
               onClick={() => handleSubmit('standard')}
               disabled={!text.trim()}
               className={`flex items-center justify-center px-5 py-2.5 rounded-lg text-white font-medium shadow-md transition-all transform hover:scale-105 active:scale-95 ${
                  !text.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
               }`}
             >
               <FileText className="w-4 h-4 mr-2" />
               Standard Mode
             </button>
             
             <button
               onClick={() => handleSubmit('challenge')}
               disabled={!text.trim()}
               className={`flex items-center justify-center px-5 py-2.5 rounded-lg text-white font-medium shadow-md transition-all transform hover:scale-105 active:scale-95 ${
                  !text.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
               }`}
               title="50 Questions, 60 Minutes"
             >
               <Sword className="w-4 h-4 mr-2" />
               Challenge
             </button>
           </div>
        </div>
        
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-start space-x-3">
            <Timer className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
                <h4 className="text-sm font-bold text-slate-800">Challenge Mode</h4>
                <p className="text-xs text-slate-500 mt-1">
                    Randomly selects <strong>50 questions</strong>. You have <strong>60 minutes</strong> to complete them. 
                    Once time is up, the quiz locks.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;