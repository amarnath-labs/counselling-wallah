import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import examsRouter from './routes/exams.js';
import collegesRouter from './routes/colleges.js';
import counsellingRouter from './routes/counselling.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/api', (_req, res) => {
  res.json({ name: 'Counselling Wallah API', phase: 2, status: 'development' });
});
app.use('/api/health', healthRouter);
app.use('/api/exams', examsRouter);
app.use('/api/colleges', collegesRouter);
app.use('/api/counselling', counsellingRouter);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Counselling Wallah API listening on http://localhost:${port}`);
});
