// env.js — runtime settings of the deployed app (no rebuild needed to change them).
// Names: REACT_APP_ + config.appNameKey + _ + KEY. Read with readEnvData("ORG", "API_BASE_URL").
// Empty here, so AppHttp uses config.http.baseUrl ("/api" on this site).
// The shell loads it first (index.html), so every MFE inside the shell reads these same values.
window.env = {
  // REACT_APP_ORG_API_BASE_URL: "https://api-np.example.com/api",
};
