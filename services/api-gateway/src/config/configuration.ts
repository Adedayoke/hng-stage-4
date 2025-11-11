export default () => ({
  port: parseInt(process.env.PORT || '3000', 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'notifications.direct',
    queues: {
      email: process.env.RABBITMQ_QUEUE_EMAIL || 'email.queue',
      push: process.env.RABBITMQ_QUEUE_PUSH || 'push.queue',
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
  },
  services: {
    userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    templateService: process.env.TEMPLATE_SERVICE_URL || 'http://localhost:3004',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
  },
});