// No-op shim to prevent bundlers from pulling in Firebase Analytics
// Export the common analytics symbols as harmless stubs so imports resolve.
export const getAnalytics = () => undefined;
export const initializeAnalytics = async () => undefined;
export const isSupported = async () => false;
export const logEvent = (_analytics: any, _eventName: string, _params?: any, _options?: any) => {};
export const setAnalyticsCollectionEnabled = async (_analytics: any, _enabled: boolean) => {};
export const setConsent = (_consent: any) => {};
export const setCurrentScreen = async (_analytics: any, _screenName: string, _options?: any) => {};
export const setDefaultEventParameters = (_params: any) => {};
export const getGoogleAnalyticsClientId = async () => undefined;
export const setUserId = async (_analytics: any, _id: string, _options?: any) => {};
export const setUserProperties = async (_analytics: any, _props: any, _options?: any) => {};
export const settings = (_opts: any) => {};
export default undefined;
