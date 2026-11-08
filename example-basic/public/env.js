// env.js — runtime settings of the deployed app (no rebuild needed to change them).
// Names: REACT_APP_ + config.appNameKey + _ + KEY. Read with AppStorage.envData("API_BASE_URL").
// Empty here, so AppHttp uses config.http.baseUrl ("/api").
window.env = {
  // REACT_APP_ORG_API_BASE_URL: "https://api-np.example.com/api",
  REACT_APP_ORGAPP_API_BASE_URL: 'https://api-np.rndpro.in/api',
};
