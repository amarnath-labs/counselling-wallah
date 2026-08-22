import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const required = [
  'src/App.jsx','src/layouts/AppLayout.jsx','src/hooks/useAppState.jsx',
  'src/data/exams.js','src/data/colleges.js','src/data/branches.js','src/data/states.js','src/data/demoData.js',
  'src/services/collegeService.js','src/services/examService.js','src/services/recommendationService.js',
  'src/services/counsellingService.js','src/services/paymentService.js','src/services/authService.js','src/services/choiceListService.js',
];
const missing = required.filter(file => !existsSync(resolve(root, file)));
if (missing.length) throw new Error(`Missing required files: ${missing.join(', ')}`);

const app = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
const routes = ['/','/exams','/profile','/results','/colleges/:id','/compare','/choice-list','/pricing','/dashboard','/counselling','/documents','/login','/register','/account'];
for (const route of routes) if (!app.includes(`path="${route}"`)) throw new Error(`Route missing: ${route}`);

const colleges = readFileSync(resolve(root, 'src/data/colleges.js'), 'utf8');
const exams = readFileSync(resolve(root, 'src/data/exams.js'), 'utf8');
if ((colleges.match(/\{id:'/g) ?? []).length < 20) throw new Error('College dataset looks unexpectedly small.');
if ((exams.match(/\{id:'/g) ?? []).length !== 10) throw new Error('Exam dataset count changed unexpectedly.');

console.log('Counselling Wallah Phase 1 static verification: PASS');
console.log(`College entries detected: ${(colleges.match(/\{id:'/g) ?? []).length}`);
console.log(`Exam entries detected: ${(exams.match(/\{id:'/g) ?? []).length}`);
console.log(`Routes verified: ${routes.length}`);
