import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import { authMiddleware } from './middleware/auth.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Protected route example
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected route', userId: (req as any).userId });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});