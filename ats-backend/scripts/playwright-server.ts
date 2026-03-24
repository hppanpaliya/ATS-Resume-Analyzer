import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import {
  authRoutes,
  healthRoutes,
  adminRoutes,
  resumeRoutes,
  analysisRoutes,
  jobDescriptionsRoutes,
  templateRoutes,
  modelsRoutes,
} from '../src/routes/index';
import { errorHandler, notFoundHandler } from '../src/middleware/error.middleware';

const backendDir = path.resolve(__dirname, '..');
const buildDir = path.resolve(backendDir, '../ats-frontend/build');

dotenv.config({
  path: path.resolve(backendDir, '.env'),
});

export const createPlaywrightApp = () => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/resumes', resumeRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api', modelsRoutes);
  app.use('/api', analysisRoutes);
  app.use('/api', jobDescriptionsRoutes);
  app.use('/api', healthRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(express.static(buildDir));

  app.get(/^\/(?!api(?:\/|$)|health(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(buildDir, 'index.html'));
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const startPlaywrightServer = (port = Number(process.env.PORT || '4010')) => {
  const app = createPlaywrightApp();

  return app.listen(port, '127.0.0.1', () => {
    console.log(`[WebServer] Combined server running at http://127.0.0.1:${port}`);
  });
};

if (require.main === module) {
  const server = startPlaywrightServer();

  const shutdown = () => {
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
