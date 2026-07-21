export default {
  createTransport: () => ({
    sendMail: async () => ({ messageId: 'mock-id' })
  })
};
