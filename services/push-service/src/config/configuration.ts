export default () => ({
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE_PUSH || 'push.queue',
  },
  fcm: {
    projectId: process.env.FCM_PROJECT_ID || '',
    privateKey: process.env.FCM_PRIVATE_KEY || '',
    clientEmail: process.env.FCM_CLIENT_EMAIL || '',
  },
  retry: {
    maxAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
    backoffSeconds: parseInt(process.env.RETRY_BACKOFF_SECONDS || '5', 10),
  },
});
