// env.js — runtime settings of the deployed app (no rebuild needed to change them).
// Names: REACT_APP_ + config.appNameKey + _ + KEY. Read with readEnvData("ORG", "API_BASE_URL").
// Empty here, so AppHttp uses config.http.baseUrl ("/api" on this site).
// Used when this MFE runs alone (npm run dev). Inside the shell the shell's env.js is used.
window.env = {
  // REACT_APP_ORG_API_BASE_URL: "https://api-np.example.com/api",
  REACT_APP_BOTNBOLT_API_BASE_URL: 'https://api-np.deeptechfoundry.ca/api',
};
