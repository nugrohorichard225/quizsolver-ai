import { ParsedQuestion } from '../types';

// Fisher-Yates shuffle algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const parseQuizText = (text: string): ParsedQuestion[] => {
  // Split by the "Soal UAS Bot" header or similar delimiters
  // The input format seems to be "Soal UAS Bot, [Date] \n [ Poll : ... ]"
  
  const chunks = text.split(/Soal UAS Bot, \[.*?\]/g);
  const questions: ParsedQuestion[] = [];

  chunks.forEach((chunk, index) => {
    if (!chunk.trim()) return;

    // Extract Question text inside [ Poll : ... ]
    const pollMatch = chunk.match(/\[\s*Poll\s*:\s*(.*?)\s*\]/s);
    
    if (pollMatch) {
      const questionText = pollMatch[1].trim();
      
      // Extract options. Options usually follow the poll title.
      // We look for lines that are not empty and not the poll title line.
      const lines = chunk.split('\n');
      const options: string[] = [];
      let foundPoll = false;

      for (const line of lines) {
        if (line.includes('[ Poll :')) {
          foundPoll = true;
          continue;
        }
        if (!foundPoll) continue;
        
        const trimmed = line.trim();
        if (trimmed) {
            // Remove leading dash if present, though sometimes options might not have dashes
            const cleanOption = trimmed.replace(/^-\s*/, '');
            options.push(cleanOption);
        }
      }

      if (options.length > 0) {
        // Randomize the order of options for this question
        const shuffledOptions = shuffleArray(options);

        questions.push({
          id: `q-${index}-${Date.now()}`,
          questionText,
          options: shuffledOptions,
          rawOriginal: chunk.trim()
        });
      }
    }
  });

  // Randomize the order of the questions themselves
  return shuffleArray(questions);
};