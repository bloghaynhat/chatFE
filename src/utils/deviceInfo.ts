const getUserAgent = () => {
  if (typeof navigator === "undefined") return "Browser";
  return navigator.userAgent || "Browser";
};

const detectBrowser = (userAgent: string) => {
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/OPR\//.test(userAgent)) return "Opera";
  if (/Chrome\//.test(userAgent)) return "Chrome";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Safari\//.test(userAgent)) return "Safari";
  return "Browser";
};

const detectOs = (userAgent: string) => {
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Android/i.test(userAgent)) return "Android";
  if (/(iPhone|iPad|iPod)/i.test(userAgent)) return "iOS";
  if (/Mac OS X|Macintosh/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Unknown OS";
};

const detectDeviceKind = (userAgent: string) => {
  if (/iPad|Tablet/i.test(userAgent)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) return "mobile";
  return "desktop";
};

export const getClientDeviceInfo = (deviceId?: string) => {
  const userAgent = getUserAgent();
  const deviceKind = detectDeviceKind(userAgent);
  const browser = detectBrowser(userAgent);
  const os = detectOs(userAgent);

  return {
    deviceId,
    userAgent,
    platform: "web",
    deviceType: `${deviceKind}-web`,
    displayLabel: `${browser} - ${os}`,
  };
};

export const getClientDeviceHeaders = (deviceId: string) => {
  const deviceInfo = getClientDeviceInfo(deviceId);

  return {
    "X-Device-Id": deviceId,
    "X-Device-Type": deviceInfo.deviceType,
    "X-Device-Platform": deviceInfo.platform,
    "X-Display-Label": deviceInfo.displayLabel,
  };
};
