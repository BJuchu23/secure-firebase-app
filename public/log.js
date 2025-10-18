// log.js
window.logSecurityEvent = function (type, details) {
  const timestamp = new Date().toISOString();
  const log = { type, details, timestamp };
  console.log("[SECURITY EVENT]", log);
  try {
    const logs = JSON.parse(localStorage.getItem("securityLogs") || "[]");
    logs.push(log);
    localStorage.setItem("securityLogs", JSON.stringify(logs));
  } catch (e) {
    console.warn("No se pudo guardar el log:", e);
  }
};
