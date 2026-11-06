// Shared test config: two LTR and one RTL language, loaders return plain objects.
import type { LocaleModule, UiConfig } from "../src/index";

function loadEnglish(): Promise<LocaleModule> {
  const messages = {
    app: { name: "Test App" },
    nav: { home: "Home page", users: "Users", usersText: "All users of the app", settings: "Settings", group: "Group", secret: "Secret" },
    hello: "Hello {{name}}",
    REQUIRED: "Please fill this in",
  };
  return Promise.resolve({ default: messages });
}

function loadFrench(): Promise<LocaleModule> {
  const messages = { app: { name: "Appli test" }, nav: { users: "Utilisateurs" }, hello: "Bonjour {{name}}" };
  return Promise.resolve(messages);
}

function loadArabic(): Promise<LocaleModule> {
  const messages = { app: { name: "تطبيق" }, nav: { users: "المستخدمون" } };
  return Promise.resolve({ default: messages });
}

export const testConfig: UiConfig = {
  appNameKey: "TEST",
  appName: "app.name",
  defaultLanguage: "en",
  languages: [
    { code: "en", label: "English", load: loadEnglish },
    { code: "fr", label: "Français", load: loadFrench },
    { code: "ar", label: "العربية", load: loadArabic },
  ],
  defaultTheme: "light",
  themes: ["light", "dark", "corporate"],
  navigation: [
    { id: "home", labelKey: "nav.home", path: "/" },
    {
      id: "group",
      labelKey: "nav.group",
      children: [
        { id: "users", labelKey: "nav.users", descriptionKey: "nav.usersText", path: "/group/users", icon: "Users" },
        { id: "secret", labelKey: "nav.secret", path: "/group/secret", permissions: { read: false } },
      ],
    },
    { id: "settings", labelKey: "nav.settings", path: "/settings", permissions: { read: true, delete: false } },
  ],
};
