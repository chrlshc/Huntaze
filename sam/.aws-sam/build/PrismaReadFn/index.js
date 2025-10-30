// Simple wrapper to export all handlers
module.exports = {
  mockHandler: require('./mock-handler'),
  prismaHandler: require('./prisma-handler'),
  cleanupHandler: require('./cleanup-handler')
};
