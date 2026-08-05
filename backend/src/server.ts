import { app, initApp } from './app';
import { isSupabaseEnabled } from './config/supabaseClient';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await initApp();

  app.listen(PORT, () => {
    logger.info(`Shield Protocol API running on http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Email provider: ${process.env.EMAIL_PROVIDER || 'gmail'}`);
    logger.info(`Supabase integration: ${isSupabaseEnabled() ? 'ENABLED' : 'DISABLED'}`);
  });
}

bootstrap().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
