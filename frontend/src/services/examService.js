import { EXAMS } from '../data/exams';
export const getExamById = id => EXAMS.find(e=>e.id===id);
export const getExamName = id => getExamById(id)?.name || 'JEE Main';
export const searchExams = query => EXAMS.filter(e=>e.name.toLowerCase().includes(query.trim().toLowerCase()));
