// Stub for @react-native-async-storage/async-storage in browser/Next.js builds
// MetaMask SDK imports this but it's only needed in React Native environments.
module.exports = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
  clear: async () => {},
  getAllKeys: async () => [],
  multiGet: async () => [],
  multiSet: async () => {},
  multiRemove: async () => {},
}
