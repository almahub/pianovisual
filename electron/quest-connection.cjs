const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

function parseAdbDevices(output) {
  const devices = String(output).split(/\r?\n/).map((line) => line.match(/^(\S+)\s+(device|unauthorized|offline)(?:\s|$)/)).filter(Boolean);
  const authorized = devices.filter((match) => match[2] === "device").map((match) => match[1]);
  if (authorized.length > 1) return { code: "multiple", message: "Sono collegati piu dispositivi ADB. Lascia collegato solo il Quest da sincronizzare." };
  if (authorized.length === 1) return { code: "ready", serial: authorized[0] };
  if (devices.some((match) => match[2] === "unauthorized")) {
    return { code: "unauthorized", message: "Quest rilevato via ADB, ma non autorizzato. Indossa il visore e conferma la richiesta di debug USB per questo PC." };
  }
  if (devices.some((match) => match[2] === "offline")) {
    return { code: "offline", message: "Dispositivo ADB offline. Scollega e ricollega il cavo USB, poi conferma il debug USB nel visore." };
  }
  return { code: "none", message: "Nessun dispositivo rilevato via ADB. Controlla il cavo, attiva la modalita sviluppatore e il debug USB nel Quest, poi autorizza questo PC nel visore." };
}

async function findWindowsMtpQuest() {
  if (process.platform !== "win32") return null;
  const script = [
    "$shell = New-Object -ComObject Shell.Application",
    "$pc = $shell.Namespace(17)",
    "if ($null -eq $pc) { exit }",
    "foreach ($item in $pc.Items()) {",
    "  if ($item.Path -match 'usb#vid_2833' -or $item.Name -match '^Quest( [0-9]+)?$') { $item.Name; break }",
    "}",
  ].join("\n");
  try {
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], {
      windowsHide: true,
      timeout: 5000,
      maxBuffer: 64 * 1024,
    });
    return stdout.trim().split(/\r?\n/)[0] || null;
  } catch {
    return null;
  }
}

module.exports = { parseAdbDevices, findWindowsMtpQuest };
