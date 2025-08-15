import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Ignore specific errors
  beforeSend(event, hint) {
    // Ignore specific server errors
    if (hint.originalException instanceof Error) {
      if (hint.originalException.message.includes('ECONNREFUSED')) {
        return null;
      }
    }
    return event;
  },
  
  // Configure integrations
  integrations: [
    Sentry.nodeTracingIntegration(),
  ],
});
