import { GradeResult } from '../types';

export const calculateGrade = (percentage: number): GradeResult => {
  if (percentage >= 90) return { grade: 'A+', explanation: 'Excellent, outstanding achievement.', color: 'text-emerald-600' };
  if (percentage >= 80) return { grade: 'A', explanation: 'Very good, but with minor deficiencies.', color: 'text-green-600' };
  if (percentage >= 75) return { grade: 'A-', explanation: 'Good, with some areas for improvement.', color: 'text-lime-600' };
  if (percentage >= 70) return { grade: 'B+', explanation: 'Quite good, still room for improvement.', color: 'text-blue-600' };
  if (percentage >= 65) return { grade: 'B', explanation: 'Adequate, with clear weaknesses but an overall understanding.', color: 'text-sky-600' };
  if (percentage >= 60) return { grade: 'B-', explanation: 'Satisfactory, needs improvement in several areas.', color: 'text-cyan-600' };
  if (percentage >= 55) return { grade: 'C+', explanation: 'Passable, meets minimum requirements but has significant gaps.', color: 'text-yellow-600' };
  if (percentage >= 50) return { grade: 'C', explanation: 'Pass, but with many areas needing improvement.', color: 'text-amber-600' };
  if (percentage >= 40) return { grade: 'D', explanation: 'Unsatisfactory, significant improvement needed.', color: 'text-orange-600' };
  return { grade: 'E', explanation: 'Fail, did not meet the passing standards, requires substantial improvement.', color: 'text-red-600' };
};