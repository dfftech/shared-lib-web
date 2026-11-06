// A real backend menu reply (admin persona): a "Root" group plus Administrator and Settings groups.
import type { MenuResponseType } from "../src/index.ts";

export const adminMenuResponse: MenuResponseType = {
  data: [
    {
      children: [
        { children: [], create: true, delete: true, href: "/dashboard", icon: "layout-dashboard", id: "ADMIN_DASHBOARD", menuGroupId: "ADMIN_ROOT", name: "Dashboard", nameLang: { "en-US": "Dashboard" }, persona: "admin", priority: 1, read: true, type: "link", update: true },
        { children: [], create: true, delete: true, href: "/products", icon: "Package", id: "ADMIN_PRODUCTS", menuGroupId: "ADMIN_ROOT", name: "Products", nameLang: { "en-US": "Products" }, persona: "admin", priority: 2, read: true, type: "link", update: true },
      ],
      create: false, delete: false, icon: "Root", id: "ADMIN_ROOT", name: "Root", nameLang: { "en-US": "Root" }, persona: "admin", priority: 0, read: true, type: "group", update: false,
    },
    {
      children: [
        { children: [], create: true, delete: true, href: "/stores", icon: "Store", id: "ADMIN_ADMINISTRATOR_BRANCHES", menuGroupId: "ADMIN_ADMINISTRATOR", name: "Stores", nameLang: { "en-US": "Stores" }, persona: "admin", priority: 1, read: true, type: "link", update: true },
        { children: [], create: true, delete: true, href: "/profiles", icon: "users", id: "ADMIN_ADMINISTRATOR_PROFILES", menuGroupId: "ADMIN_ADMINISTRATOR", name: "Profiles", nameLang: { "en-US": "Profiles" }, persona: "admin", priority: 1, read: true, type: "link", update: true },
        { children: [], create: true, delete: true, href: "/store-management", icon: "Warehouse", id: "ADMIN_ADMINISTRATOR_BRANCH_MANAGEMENT", menuGroupId: "ADMIN_ADMINISTRATOR", name: "Store Management", nameLang: { "en-US": "Store Management" }, persona: "admin", priority: 1, read: true, type: "link", update: true },
        { children: [], create: true, delete: true, href: "/role-assignor", icon: "UserRoundPen", id: "ADMIN_ADMINISTRATOR_ROLE_ASSIGNOR", menuGroupId: "ADMIN_ADMINISTRATOR", name: "Role Assignor", nameLang: { "en-US": "Role Assignor" }, persona: "admin", priority: 1, read: true, type: "link", update: true },
      ],
      create: false, delete: false, icon: "UserRoundStar", id: "ADMIN_ADMINISTRATOR", name: "Administrator", nameLang: { "en-US": "Administrator" }, persona: "admin", priority: 3, read: true, type: "group", update: false,
    },
    {
      children: [
        { children: [], create: true, delete: true, href: "/menu-management", icon: "menu", id: "ADMIN_SETTINGS_MENU_MANAGEMENT", menuGroupId: "ADMIN_SETTINGS", name: "Menu Management", nameLang: { "en-US": "Menu Management" }, persona: "admin", priority: 1, read: true, type: "link", update: true },
        { children: [], create: true, delete: true, href: "/menu-access", icon: "User-Round-Key", id: "ADMIN_SETTINGS_MENU_ACCESS", menuGroupId: "ADMIN_SETTINGS", name: "Menu Access", nameLang: { "en-US": "Menu Access" }, persona: "admin", priority: 2, read: true, type: "link", update: true },
        { children: [], create: true, delete: true, href: "/app-settings", icon: "Settings", id: "ADMIN_SETTINGS_APP_SETTINGS", menuGroupId: "ADMIN_SETTINGS", name: "App Settings", nameLang: { "en-US": "App Settings" }, persona: "admin", priority: 3, read: true, type: "link", update: true },
      ],
      create: false, delete: false, icon: "settings", id: "ADMIN_SETTINGS", name: "Settings", nameLang: { "en-US": "Settings" }, persona: "admin", priority: 4, read: true, type: "group", update: false,
    },
  ],
  meta: { duration: 16, requestId: "f14be0ef-b5b0-4763-999b-13ca6d74e9cf", timestamp: "2026-11-05T15:03:28.595Z" },
};
