import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import signatureRoutes from './routes/signatureRoutes';
import documentRoutes from './routes/documentRoutes';
import signingRoutes from './routes/signingRoutes';
import userRoutes from './routes/userRoutes';
import pool from './config/database';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'OneX Signature API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/signing', signingRoutes);
app.use('/api/users', userRoutes);

// Static file serving for uploads (authenticated in production)
app.use('/uploads', express.static('uploads'));

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;

const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
