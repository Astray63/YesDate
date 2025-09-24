import express from 'express';
import cors from 'cors';
import { generateDateIdeas } from './routes/dates';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/dates', generateDateIdeas);

app.get('/health', (req: any, res: any) => {
  res.json({ status: 'OK', message: 'L\'API YesDate est en cours d\'exécution' });
});

app.listen(port, () => {
console.log(`Serveur en cours d'exécution sur le port ${port}`);
});
