import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 殼載入遠端 Web（註解：請設環境變數 `CAPACITOR_SERVER_URL` 為正式站 HTTPS；未設則用下方預設）。
 * `allowNavigation`：Clerk／OAuth 網域須列入，否則 Android 會改開系統瀏覽器（三星上很常見）。
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ?? "https://volleyball-team-manager.vercel.app";

const serverHost = (() => {
  try {
    return new URL(serverUrl).hostname;
  } catch {
    return "volleyball-team-manager.vercel.app";
  }
})();

const config: CapacitorConfig = {
  appId: "com.volleyball.teammanager",
  appName: "排球隊管理",
  webDir: "www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    allowNavigation: [
      serverHost,
      "*.vercel.app",
      "*.clerk.accounts.dev",
      "clerk.com",
      "*.clerk.com",
      "accounts.google.com",
      "oauth.google.com",
    ],
  },
  android: {
    allowMixedContent: serverUrl.startsWith("http://"),
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      backgroundColor: "#1e40af",
      launchShowDuration: 2000,
      showSpinner: false,
    },
  },
};

export default config;
