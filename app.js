import { Midi } from "https://cdn.jsdelivr.net/npm/@tonejs/midi@2.0.28/+esm";
import * as Tone from "https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";

const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const el = {
  loadingOverlay: document.getElementById("loadingOverlay"),
  toastRoot: document.getElementById("toastRoot"),
  mainContentScroll: document.querySelector(".main-content-scroll"),
  scrollUpBtn: document.getElementById("scrollUpBtn"),
  scrollDownBtn: document.getElementById("scrollDownBtn"),

  navItems: document.querySelectorAll(".nav-item"),
  studyChips: document.querySelectorAll("[data-study-filter]"),
  viewKicker: document.getElementById("viewKicker"),
  viewTitle: document.getElementById("viewTitle"),
  playlistCount: document.getElementById("playlistCount"),
  importPanel: document.getElementById("importPanel"),
  songsTableBody: document.getElementById("songsTableBody"),
  contentGrid: document.getElementById("contentGrid"),
  playlistsSection: document.getElementById("playlistsSection"),
  playlistsSectionTitle: document.getElementById("playlistsSectionTitle"),
  playlistsCards: document.getElementById("playlistsCards"),
  smartCards: document.getElementById("smartCards"),
  tableWrap: document.getElementById("tableWrap"),
  paginationWrap: document.getElementById("paginationWrap"),
  smartPlaylistsSection: document.getElementById("smartPlaylistsSection"),

  searchInput: document.getElementById("searchInput"),
  searchWrap: document.getElementById("searchWrap"),
  appVersionBadge: document.getElementById("appVersionBadge"),
  updateStatusBtn: document.getElementById("updateStatusBtn"),
  bpmFilter: document.getElementById("bpmFilter"),
  keyFilter: document.getElementById("keyFilter"),
  difficultyFilter: document.getElementById("difficultyFilter"),
  durationFilter: document.getElementById("durationFilter"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),
  filterPanel: document.getElementById("filterPanel"),

  pageSizeSelect: document.getElementById("pageSizeSelect"),
  prevPageBtn: document.getElementById("prevPageBtn"),
  nextPageBtn: document.getElementById("nextPageBtn"),
  pageInfo: document.getElementById("pageInfo"),

  newPlaylistBtn: document.getElementById("newPlaylistBtn"),
  managePlaylistBtn: document.getElementById("managePlaylistBtn"),
  backupBtn: document.getElementById("backupBtn"),
  importArchiveBtn: document.getElementById("importArchiveBtn"),
  openLibraryFolderBtn: document.getElementById("openLibraryFolderBtn"),
  syncLibraryBtn: document.getElementById("syncLibraryBtn"),
  themeLightBtn: document.getElementById("themeLightBtn"),
  themeDarkBtn: document.getElementById("themeDarkBtn"),
  archiveFileInput: document.getElementById("archiveFileInput"),

  midiFileInput: document.getElementById("midiFileInput"),
  remoteUrlInput: document.getElementById("remoteUrlInput"),
  resolveRemoteBtn: document.getElementById("resolveRemoteBtn"),
  metaTitle: document.getElementById("metaTitle"),
  metaArtist: document.getElementById("metaArtist"),
  metaComposer: document.getElementById("metaComposer"),
  metaGenre: document.getElementById("metaGenre"),
  metaDifficulty: document.getElementById("metaDifficulty"),
  metaStudyStatus: document.getElementById("metaStudyStatus"),
  metaTags: document.getElementById("metaTags"),
  metaPlaylist: document.getElementById("metaPlaylist"),
  convertBtn: document.getElementById("convertBtn"),
  saveBatchBtn: document.getElementById("saveBatchBtn"),
  importJsonBtn: document.getElementById("importJsonBtn"),
  importJsonFileInput: document.getElementById("importJsonFileInput"),
  cancelImportBtn: document.getElementById("cancelImportBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  downloadImportReportBtn: document.getElementById("downloadImportReportBtn"),
  duplicatePolicySelect: document.getElementById("duplicatePolicySelect"),
  batchDedupSelect: document.getElementById("batchDedupSelect"),
  archiveConflictPolicySelect: document.getElementById("archiveConflictPolicySelect"),
  archiveDedupPolicySelect: document.getElementById("archiveDedupPolicySelect"),
  batchProgressWrap: document.getElementById("batchProgressWrap"),
  batchProgressLabel: document.getElementById("batchProgressLabel"),
  batchProgressPct: document.getElementById("batchProgressPct"),
  batchProgressBar: document.getElementById("batchProgressBar"),
  importStatus: document.getElementById("importStatus"),
  filenameInsights: document.getElementById("filenameInsights"),
  recognizedTitle: document.getElementById("recognizedTitle"),
  recognizedArtist: document.getElementById("recognizedArtist"),
  recognizedComposer: document.getElementById("recognizedComposer"),
  recognizedOpus: document.getElementById("recognizedOpus"),
  recognizedNumber: document.getElementById("recognizedNumber"),
  recognizedMovement: document.getElementById("recognizedMovement"),
  recognizedCatalog: document.getElementById("recognizedCatalog"),
  recognizedKey: document.getElementById("recognizedKey"),
  applyRecognitionBtn: document.getElementById("applyRecognitionBtn"),
  jsonOutput: document.getElementById("jsonOutput"),

  emptyDetail: document.getElementById("emptyDetail"),
  detailContent: document.getElementById("detailContent"),
  detailPanel: document.getElementById("detailPanel"),
  detailTitle: document.getElementById("detailTitle"),
  detailSubtitle: document.getElementById("detailSubtitle"),
  detailMeta: document.getElementById("detailMeta"),
  detailInstrumentsBadges: document.getElementById("detailInstrumentsBadges"),

  editTitle: document.getElementById("editTitle"),
  editArtist: document.getElementById("editArtist"),
  editComposer: document.getElementById("editComposer"),
  editGenre: document.getElementById("editGenre"),
  editDifficulty: document.getElementById("editDifficulty"),
  editKey: document.getElementById("editKey"),
  editBpm: document.getElementById("editBpm"),
  editDuration: document.getElementById("editDuration"),
  editInstruments: document.getElementById("editInstruments"),
  editTags: document.getElementById("editTags"),
  editCollections: document.getElementById("editCollections"),
  editStudyStatus: document.getElementById("editStudyStatus"),
  editPlaybackSpeed: document.getElementById("editPlaybackSpeed"),

  saveMetadataBtn: document.getElementById("saveMetadataBtn"),
  deleteSongBtn: document.getElementById("deleteSongBtn"),

  playBtn: document.getElementById("playBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  playerSpeedSelect: document.getElementById("playerSpeedSelect"),
  visualizerCanvas: document.getElementById("visualizerCanvas"),
  visualizerLegend: document.getElementById("visualizerLegend"),
  footerTrackTitle: document.getElementById("footerTrackTitle"),
  footerTrackArtist: document.getElementById("footerTrackArtist"),
  miniVisualizer: document.getElementById("miniVisualizer"),

  toggleFavoriteBtn: document.getElementById("toggleFavoriteBtn"),
  exportFilteredJsonBtn: document.getElementById("exportFilteredJsonBtn"),
  addToPlaylistBtn: document.getElementById("addToPlaylistBtn"),
  renamePlaylistBtn: document.getElementById("renamePlaylistBtn"),
  deletePlaylistBtn: document.getElementById("deletePlaylistBtn"),
  createTagBtn: document.getElementById("createTagBtn"),
  renameTagBtn: document.getElementById("renameTagBtn"),
  deleteTagBtn: document.getElementById("deleteTagBtn"),
  duplicateModal: document.getElementById("duplicateModal"),
  duplicateModalBody: document.getElementById("duplicateModalBody"),
  duplicateApplySelectionsBtn: document.getElementById("duplicateApplySelectionsBtn"),
  duplicateOverwriteAllBtn: document.getElementById("duplicateOverwriteAllBtn"),
  duplicateSkipAllBtn: document.getElementById("duplicateSkipAllBtn"),
  duplicateCancelBtn: document.getElementById("duplicateCancelBtn"),
  libraryToolsPanel: document.getElementById("libraryToolsPanel"),
  toolPlaylistSelect: document.getElementById("toolPlaylistSelect"),
  toolPlaylistName: document.getElementById("toolPlaylistName"),
  toolPlaylistCreateBtn: document.getElementById("toolPlaylistCreateBtn"),
  toolPlaylistRenameBtn: document.getElementById("toolPlaylistRenameBtn"),
  toolPlaylistDeleteBtn: document.getElementById("toolPlaylistDeleteBtn"),
  toolTagSelect: document.getElementById("toolTagSelect"),
  toolTagName: document.getElementById("toolTagName"),
  toolTagCreateBtn: document.getElementById("toolTagCreateBtn"),
  toolTagRenameBtn: document.getElementById("toolTagRenameBtn"),
  toolTagDeleteBtn: document.getElementById("toolTagDeleteBtn"),
  playlistQuickMenu: document.getElementById("playlistQuickMenu"),
  playlistQuickList: document.getElementById("playlistQuickList"),
  playlistQuickInput: document.getElementById("playlistQuickInput"),
  playlistQuickCreateBtn: document.getElementById("playlistQuickCreateBtn"),
  selectVisibleBtn: document.getElementById("selectVisibleBtn"),
  clearSelectionBtn: document.getElementById("clearSelectionBtn"),
  downloadSelectedBtn: document.getElementById("downloadSelectedBtn"),
  deleteSelectedBtn: document.getElementById("deleteSelectedBtn"),
  selectAllPageCheckbox: document.getElementById("selectAllPageCheckbox"),

  sortableTh: document.querySelectorAll("th[data-sort-key]"),
};

const state = {
  db: null,
  view: "home",
  studyFilter: "",
  selectedSongId: "",
  sort: { key: "importedAt", dir: "desc" },
  page: 1,
  pageSize: Number(el.pageSizeSelect.value || 10),
  preview: null,
  batchItems: [],
  duplicateCandidates: [],
  duplicateResolution: "ask",
  importCancelled: false,
  lastImportReport: null,
  selectedSongIds: new Set(),
  quickMenuSongId: "",
  selectedPlaylistId: "",
  selectedGenre: "",
  selectedArtist: "",
  theme: "dark",
  appVersion: "",
  updater: {
    isDesktop: false,
    status: "idle",
    detail: "",
  },
  player: {
    synth: null,
    part: null,
    notes: [],
    duration: 0,
    loadedSongId: "",
    loadedSongJsonPath: "",
    raf: 0,
    isPlaying: false,
    miniBars: [5, 10, 8, 14, 6, 11, 7],
    availableInstruments: [],
    activeInstrumentsBySong: {},
    minMidi: 21,
    maxMidi: 108,
    renderCache: {
      windowStart: 0,
      windowEnd: 0,
      lastRenderMs: 0,
      visualizerFps: 30,
    },
  },
};

function round(value, digits = 12) {
  const p = 10 ** digits;
  return Math.round(value * p) / p;
}

function escapeHtml(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeFileName(v) {
  return String(v || "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

function showLoading(on) {
  el.loadingOverlay.classList.toggle("hidden", !on);
}

function applyTheme(theme, persist = true) {
  const next = theme === "light" ? "light" : "dark";
  state.theme = next;
  document.documentElement.setAttribute("data-theme", next);
  el.themeLightBtn?.classList.toggle("active", next === "light");
  el.themeDarkBtn?.classList.toggle("active", next === "dark");
  if (!persist) return;
  try {
    localStorage.setItem("pv_theme", next);
  } catch {}
}

function toast(message, tone = "") {
  const node = document.createElement("div");
  node.className = `toast ${tone}`.trim();
  node.textContent = message;
  el.toastRoot.appendChild(node);
  setTimeout(() => node.remove(), 3400);
}

function setImportStatus(message, tone = "") {
  el.importStatus.className = `status ${tone}`.trim();
  el.importStatus.textContent = message;
}

function showBatchProgress(show) {
  el.batchProgressWrap.classList.toggle("hidden", !show);
  if (!show) {
    el.batchProgressBar.style.width = "0%";
    el.batchProgressPct.textContent = "0%";
    el.batchProgressLabel.textContent = "In attesa";
  }
}

function setBatchProgress(percent, label) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  el.batchProgressBar.style.width = `${p}%`;
  el.batchProgressPct.textContent = `${p}%`;
  if (label) el.batchProgressLabel.textContent = label;
}

async function nextFrame() {
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `${res.status} ${res.statusText}`);
  }
  return data;
}

function renderAppVersion() {
  const version = state.appVersion || "-";
  el.appVersionBadge.textContent = `v${version}`;
}

function setUpdaterStatus(status, detail = "") {
  state.updater.status = status || "idle";
  state.updater.detail = String(detail || "");
  const btn = el.updateStatusBtn;
  if (!btn) return;

  btn.classList.remove("update-ready", "update-error");
  btn.disabled = false;

  if (!state.updater.isDesktop) {
    btn.textContent = "Aggiornamenti (desktop)";
    btn.title = "Disponibile solo nella versione desktop installata";
    return;
  }

  if (status === "checking") {
    btn.textContent = "Controllo update...";
    btn.title = "Verifica aggiornamenti in corso";
    btn.disabled = true;
    return;
  }
  if (status === "available") {
    btn.textContent = `Update disponibile ${detail ? `(${detail})` : ""}`;
    btn.classList.add("update-ready");
    btn.title = "Nuova versione disponibile: download automatico avviato";
    return;
  }
  if (status === "downloading") {
    btn.textContent = `Download update ${detail || ""}`.trim();
    btn.classList.add("update-ready");
    btn.title = "Download aggiornamento in corso";
    return;
  }
  if (status === "downloaded") {
    btn.textContent = "Update pronto (riavvia)";
    btn.classList.add("update-ready");
    btn.title = "Aggiornamento pronto: conferma installazione dal popup";
    return;
  }
  if (status === "error") {
    btn.textContent = "Errore update";
    btn.classList.add("update-error");
    btn.title = detail || "Errore durante la verifica aggiornamenti";
    return;
  }
  if (status === "not-available") {
    btn.textContent = "Aggiornato";
    btn.title = "Sei già all'ultima versione";
    return;
  }

  btn.textContent = "Verifica aggiornamenti";
  btn.title = "Controlla se esiste una nuova versione";
}

async function loadAppVersionAndUpdater() {
  try {
    const meta = await api("/api/version");
    state.appVersion = String(meta?.version || "").trim() || "dev";
  } catch {
    state.appVersion = "dev";
  }
  renderAppVersion();

  const desktopApi = window.pianovisualDesktop;
  state.updater.isDesktop = Boolean(desktopApi && typeof desktopApi.checkUpdates === "function");
  setUpdaterStatus("idle");

  if (!state.updater.isDesktop) return;

  if (typeof desktopApi.onUpdateStatus === "function") {
    desktopApi.onUpdateStatus((payload) => {
      const status = String(payload?.status || "idle");
      const detail = String(payload?.detail || "");
      setUpdaterStatus(status, detail);
      if (status === "available") toast(`Nuova versione disponibile ${detail ? `(${detail})` : ""}`, "ok");
      if (status === "downloaded") toast("Aggiornamento pronto: conferma riavvio dal popup", "ok");
      if (status === "error") toast(`Errore aggiornamento: ${detail || "sconosciuto"}`, "error");
    });
  }

  if (typeof desktopApi.onBackendCrash === "function") {
    desktopApi.onBackendCrash((payload) => {
      toast(payload?.message || "Backend terminato inaspettatamente", "error");
    });
  }
}

function parseTagsInput(value) {
  return String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toTitleCase(raw) {
  return String(raw || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : ""))
    .join(" ");
}

function normalizeText(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mojibakeScore(v) {
  return (String(v || "").match(/[ÐÑÃÂ�]/g) || []).length;
}

function repairMojibake(v) {
  const input = String(v || "");
  if (!input || mojibakeScore(input) === 0) return input;
  try {
    const bytes = Uint8Array.from([...input].map((ch) => ch.charCodeAt(0) & 0xff));
    const fixed = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return mojibakeScore(fixed) < mojibakeScore(input) ? fixed : input;
  } catch {
    return input;
  }
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function inferMusicalTokens(tokens) {
  const info = {
    opus: "",
    number: "",
    movement: "",
    key: "",
    catalog: "",
    consumedIndexes: new Set(),
  };

  const consume = (...idx) => idx.forEach((i) => info.consumedIndexes.add(i));

  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    const next = tokens[i + 1] || "";
    const next2 = tokens[i + 2] || "";

    if ((t === "op" || t === "opus") && /^\d+[a-z]?$/.test(next)) {
      info.opus = next;
      consume(i, i + 1);
    }
    if (/^op\d+[a-z]?$/.test(t)) {
      info.opus = t.replace(/^op/, "");
      consume(i);
    }

    if ((t === "no" || t === "n" || t === "nr") && /^\d+[a-z]?$/.test(next)) {
      info.number = next;
      consume(i, i + 1);
    }
    if (/^no\d+[a-z]?$/.test(t)) {
      info.number = t.replace(/^no/, "");
      consume(i);
    }

    if ((t === "mv" || t === "mov" || t === "movement") && /^\d+$/.test(next)) {
      info.movement = next;
      consume(i, i + 1);
    }
    if (/^mvt\d+$/.test(t)) {
      info.movement = t.replace(/^mvt/, "");
      consume(i);
    }

    if (["k", "kv", "bwv", "rv", "hob", "d", "sz"].includes(t) && /^\d+[a-z]?$/.test(next)) {
      info.catalog = `${t.toUpperCase()} ${next}`;
      consume(i, i + 1);
    }
    if (/^(bwv|kv|rv|hob|d|sz)\d+[a-z]?$/.test(t)) {
      const m = t.match(/^([a-z]+)(\d+[a-z]?)$/);
      if (m) info.catalog = `${m[1].toUpperCase()} ${m[2]}`;
      consume(i);
    }

    if (t === "in" && /^[a-g](#|b)?$/.test(next)) {
      if (next2 === "major" || next2 === "minor") {
        info.key = `${next.toUpperCase()} ${next2}`;
        consume(i, i + 1, i + 2);
      } else {
        info.key = `${next.toUpperCase()} major`;
        consume(i, i + 1);
      }
    }
    if (/^[a-g](#|b)?(major|minor)$/.test(t)) {
      const m = t.match(/^([a-g](#|b)?)(major|minor)$/);
      if (m) info.key = `${m[1].toUpperCase()} ${m[3]}`;
      consume(i);
    }
  }

  return info;
}

const KNOWN_ARTIST_ALIASES = [
  { canonical: "Fabrizio De André", variants: [["de", "andre"], ["deandre"], ["fabrizio", "de", "andre"]] },
  { canonical: "Ludovico Einaudi", variants: [["einaudi"], ["ludovico", "einaudi"]] },
  { canonical: "Yiruma", variants: [["yiruma"]] },
  { canonical: "Yann Tiersen", variants: [["yann", "tiersen"], ["tiersen"]] },
  { canonical: "Ludovico", variants: [["ludovico"]] },
  { canonical: "Vasco Rossi", variants: [["vasco", "rossi"], ["vascorossi"]] },
  { canonical: "Lucio Dalla", variants: [["lucio", "dalla"], ["dalla"]] },
  { canonical: "Franco Battiato", variants: [["franco", "battiato"], ["battiato"]] },
  { canonical: "Vinicio Capossela", variants: [["vinicio", "capossela"], ["capossela"]] },
  { canonical: "Erik Satie", variants: [["erik", "satie"], ["satie"]] },
  { canonical: "Frédéric Chopin", variants: [["chopin"]] },
  { canonical: "Ludwig van Beethoven", variants: [["beethoven"]] },
  { canonical: "Wolfgang Amadeus Mozart", variants: [["mozart"]] },
  { canonical: "Johann Sebastian Bach", variants: [["bach"]] },
  { canonical: "Claude Debussy", variants: [["debussy"]] },
  { canonical: "Pyotr Ilyich Tchaikovsky", variants: [["tchaikovsky"], ["chaikovsky"]] },
];

function parseArtistFromTail(tokens) {
  for (const entry of KNOWN_ARTIST_ALIASES) {
    for (const variant of entry.variants) {
      if (variant.length > tokens.length) continue;
      const tail = tokens.slice(tokens.length - variant.length);
      if (tail.join("-") === variant.join("-")) {
        return { artist: entry.canonical, start: tokens.length - variant.length, end: tokens.length };
      }
    }
  }
  return null;
}

function inferMetadataFromFilename(fileName) {
  const base = String(fileName || "").replace(/\.(mid|midi)$/i, "");
  const normalized = base
    .replace(/([a-z])([0-9])/gi, "$1-$2")
    .replace(/([0-9])([a-z])/gi, "$1-$2")
    .replace(/[_]+/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();
  const tokens = normalized.split("-").filter(Boolean);

  let composer = "";
  let artist = "";
  let titleTokens = [...tokens];

  // Pattern: "...-de-andre" / "...-vasco-rossi" (artist at tail)
  const tailArtist = parseArtistFromTail(tokens);
  if (tailArtist && tailArtist.start > 0) {
    artist = tailArtist.artist;
    composer = tailArtist.artist;
    titleTokens = tokens.slice(0, tailArtist.start);
  }

  const fromIdx = tokens.lastIndexOf("from");
  if (!composer && fromIdx > 0 && fromIdx < tokens.length - 1) {
    const rightTokens = tokens.slice(fromIdx + 1);
    const byTail = parseArtistFromTail(rightTokens);
    if (byTail) {
      composer = byTail.artist;
      artist = byTail.artist;
    } else {
      composer = toTitleCase(rightTokens.join(" "));
      artist = composer;
    }
    titleTokens = tokens.slice(0, fromIdx);
  }

  const byIdx = tokens.lastIndexOf("by");
  if (!composer && byIdx > 0 && byIdx < tokens.length - 1) {
    const rightTokens = tokens.slice(byIdx + 1);
    const byTail = parseArtistFromTail(rightTokens);
    if (byTail) {
      composer = byTail.artist;
      artist = byTail.artist;
    } else {
      composer = toTitleCase(rightTokens.join(" "));
      artist = composer;
    }
    titleTokens = tokens.slice(0, byIdx);
  }

  // Pattern: "la-canzone-di-marinella-de-andre" -> title "...di marinella", artist "De André"
  if (!artist) {
    const diIdx = tokens.lastIndexOf("di");
    if (diIdx > 0 && diIdx < tokens.length - 1) {
      const right = tokens.slice(diIdx + 1);
      const tail = parseArtistFromTail(right);
      if (tail) {
        artist = tail.artist;
        composer = composer || tail.artist;
        titleTokens = [...tokens.slice(0, diIdx + 1), ...right.slice(0, tail.start)].filter(Boolean);
      }
    }
  }

  if (!composer) {
    const maybeComposer = [
      "chopin",
      "mozart",
      "beethoven",
      "tchaikovsky",
      "bach",
      "vivaldi",
      "debussy",
      "schubert",
      "rachmaninoff",
      "liszt",
      "handel",
      "haydn",
    ];
    for (const c of maybeComposer) {
      if (tokens.includes(c)) {
        composer = toTitleCase(c);
        titleTokens = tokens.filter((t) => t !== c);
        break;
      }
    }
  }

  if (!artist && composer) artist = composer;
  const musical = inferMusicalTokens(tokens);
  const structuralWords = new Set([
    "op",
    "opus",
    "no",
    "nr",
    "n",
    "mv",
    "mov",
    "movement",
    "mvt",
    "in",
    "major",
    "minor",
    "by",
    "from",
    "the",
  ]);
  const cleanedTitleTokens = titleTokens.filter((token, idx) => {
    const tokenIdx = tokens.indexOf(token, idx);
    if (musical.consumedIndexes.has(tokenIdx)) return false;
    if (structuralWords.has(token)) return false;
    if (/^\d+[a-z]?$/.test(token)) return false;
    return true;
  });
  const title = toTitleCase(cleanedTitleTokens.join(" "));

  const tags = [];
  if (tokens.includes("waltz")) tags.push("valzer");
  if (tokens.includes("sonata")) tags.push("sonata");
  if (tokens.includes("prelude")) tags.push("preludio");
  if (tokens.includes("fugue")) tags.push("fuga");
  if (tokens.includes("nocturne")) tags.push("notturno");
  if (tokens.includes("etude")) tags.push("studio");
  if (musical.opus) tags.push(`op_${musical.opus}`);
  if (musical.number) tags.push(`no_${musical.number}`);
  if (musical.movement) tags.push(`mov_${musical.movement}`);
  if (musical.catalog) tags.push(musical.catalog.toLowerCase().replace(/\s+/g, "_"));
  if (musical.key) tags.push(musical.key.toLowerCase().replace(/\s+/g, "_"));

  const postfix = [
    musical.opus ? `Op. ${musical.opus}` : "",
    musical.number ? `No. ${musical.number}` : "",
    musical.movement ? `Mov. ${musical.movement}` : "",
    musical.catalog || "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title: [title || toTitleCase(base), postfix].filter(Boolean).join(" ").trim(),
    artist,
    composer,
    tags,
    musical: {
      opus: musical.opus,
      number: musical.number,
      movement: musical.movement,
      key: musical.key,
      catalog: musical.catalog,
    },
  };
}

function setRecognitionFields(meta) {
  const m = meta?.musical || {};
  el.recognizedTitle.value = meta?.title || "";
  el.recognizedArtist.value = meta?.artist || "";
  el.recognizedComposer.value = meta?.composer || "";
  el.recognizedOpus.value = m.opus || "";
  el.recognizedNumber.value = m.number || "";
  el.recognizedMovement.value = m.movement || "";
  el.recognizedCatalog.value = m.catalog || "";
  el.recognizedKey.value = m.key || "";
}

function getRecognitionOverride() {
  const title = el.recognizedTitle.value.trim();
  const artist = el.recognizedArtist.value.trim();
  const composer = el.recognizedComposer.value.trim();
  const musical = {
    opus: el.recognizedOpus.value.trim(),
    number: el.recognizedNumber.value.trim(),
    movement: el.recognizedMovement.value.trim(),
    catalog: el.recognizedCatalog.value.trim(),
    key: el.recognizedKey.value.trim(),
  };
  return { title, artist, composer, musical };
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    bin += String.fromCharCode(...slice);
  }
  return btoa(bin);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function secondsToClock(seconds) {
  const s = Math.max(0, Math.round(Number(seconds || 0)));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function isBlackKeyMidi(midi) {
  const p = midi % 12;
  return p === 1 || p === 3 || p === 6 || p === 8 || p === 10;
}

function colorFromInstrument(name, past = false) {
  const s = String(name || "instrument");
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return past ? `hsl(${hue} 30% 30%)` : `hsl(${hue} 78% 62%)`;
}

function midiToName(midi) {
  const pitch = noteNames[midi % 12] || "C";
  const octave = Math.floor(midi / 12) - 1;
  return {
    noteName: `${pitch}${octave}`,
    notePitch: pitch,
    octave,
  };
}

function durationType(durationTicks, ppq) {
  if (!ppq) return "unknown";
  const beats = durationTicks / ppq;
  if (beats >= 3.5) return "whole";
  if (beats >= 1.5) return "half";
  if (beats >= 0.8) return "quarter";
  if (beats >= 0.35) return "eighth";
  return "sixteenth";
}

function normalizeTempos(header) {
  const tempos = [...(header.tempos || [])]
    .map((t) => ({
      bpm: t.bpm,
      ticks: typeof t.ticks === "number" ? t.ticks : 0,
      time: typeof t.time === "number" ? t.time : 0,
    }))
    .sort((a, b) => a.ticks - b.ticks);

  if (tempos.length === 0 || tempos[0].ticks !== 0) tempos.unshift({ bpm: 120, ticks: 0, time: 0 });
  return tempos;
}

function ticksToSeconds(ticks, tempos, ppq) {
  if (ticks <= 0) return 0;
  let totalSeconds = 0;

  for (let i = 0; i < tempos.length; i += 1) {
    const current = tempos[i];
    const next = tempos[i + 1];
    const segStart = current.ticks;
    const segEnd = next ? next.ticks : ticks;
    if (ticks <= segStart) break;

    const effectiveEnd = Math.min(ticks, segEnd);
    const deltaTicks = Math.max(0, effectiveEnd - segStart);
    if (deltaTicks > 0) totalSeconds += (deltaTicks / ppq) * (60 / current.bpm);
    if (ticks <= segEnd) break;
  }

  return round(totalSeconds, 12);
}

function getMaxTick(tracks) {
  let maxTick = 0;
  for (const track of tracks) {
    for (const note of track.notes || []) {
      const endTick = (note.ticks || 0) + (note.durationTicks || 0);
      if (endTick > maxTick) maxTick = endTick;
    }
  }
  return maxTick;
}

function buildMeasures(header, tracks) {
  const ppq = header.ppq || 480;
  const tempos = normalizeTempos(header);
  const maxTick = Math.max(getMaxTick(tracks), ppq * 4);

  let sigs = [...(header.timeSignatures || [])].sort((a, b) => a.ticks - b.ticks);
  if (sigs.length === 0 || sigs[0].ticks !== 0) sigs = [{ ticks: 0, timeSignature: [4, 4], measures: 0 }, ...sigs];

  const measures = [];
  for (let i = 0; i < sigs.length; i += 1) {
    const sig = sigs[i];
    const next = sigs[i + 1];
    const [num, den] = sig.timeSignature;
    const ticksPerMeasure = (ppq * 4 * num) / den;
    const endTick = next ? next.ticks : maxTick;

    for (let cursor = sig.ticks; cursor < endTick; cursor += ticksPerMeasure) {
      const measureEnd = Math.min(cursor + ticksPerMeasure, endTick);
      let type = 2;
      if (measures.length === 0) type = 0;
      else if (cursor === sig.ticks && i > 0) type = 1;

      measures.push({
        time: ticksToSeconds(cursor, tempos, ppq),
        timeSignature: [num, den],
        ticksPerMeasure: round(ticksPerMeasure, 12),
        ticksStart: round(cursor, 12),
        totalTicks: round(measureEnd - cursor, 12),
        type,
      });
    }
  }

  return measures;
}

function avgPitch(track) {
  if (!track.notes || track.notes.length === 0) return -Infinity;
  return track.notes.reduce((acc, n) => acc + n.midi, 0) / track.notes.length;
}

function splitHands(tracks) {
  const withNotes = tracks.filter((t) => (t.notes || []).length > 0);
  if (withNotes.length === 0) return { rightTrack: null, leftTrack: null, splitSingle: false };
  if (withNotes.length === 1) return { rightTrack: withNotes[0], leftTrack: null, splitSingle: true };
  const sorted = [...withNotes].sort((a, b) => avgPitch(a) - avgPitch(b));
  return { leftTrack: sorted[0], rightTrack: sorted[sorted.length - 1], splitSingle: false };
}

function buildMeasureEntry({ measure, measureIndex, notes, handPrefix, direction, ppq, idStart }) {
  const mappedNotes = notes
    .sort((a, b) => (a.ticks || 0) - (b.ticks || 0))
    .map((note, idx) => {
      const pitch = midiToName(note.midi || 0);
      const ticksStart = note.ticks || 0;
      const durationTicks = note.durationTicks || Math.round((note.duration || 0) * ppq);
      const start = note.time || 0;
      const duration = note.duration || 0;

      return {
        note: note.midi || 0,
        durationTicks,
        noteOffVelocity: 0,
        ticksStart,
        velocity: clamp01(note.velocity ?? 0.7),
        measureBars: round(ticksStart / ppq, 12),
        duration: round(duration, 12),
        noteName: pitch.noteName,
        octave: pitch.octave,
        notePitch: pitch.notePitch,
        start: round(start, 12),
        end: round(start + duration, 12),
        noteLengthType: durationType(durationTicks, ppq),
        group: -1,
        measureInd: measureIndex,
        noteMeasureInd: idx,
        id: `${handPrefix}${idStart + idx}`,
      };
    });

  const max = mappedNotes.length ? Math.max(...mappedNotes.map((n) => n.note)) : 0;
  const min = mappedNotes.length ? Math.min(...mappedNotes.map((n) => n.note)) : 200;

  return {
    direction,
    time: round(measure.time, 12),
    timeEnd: round(measure.time + (measure.totalTicks / ppq) * 0.5, 12),
    timeSignature: measure.timeSignature,
    notes: mappedNotes,
    max,
    min,
    measureTicksStart: round(measure.ticksStart, 12),
    measureTicksEnd: round(measure.ticksStart + measure.totalTicks, 12),
    rests: mappedNotes.length ? [] : [{ time: round(measure.time, 12), noteLengthType: "whole" }],
    groups: [],
  };
}

function buildTracksV2(tracks, measures, ppq) {
  const { rightTrack, leftTrack, splitSingle } = splitHands(tracks);
  const right = [];
  const left = [];
  let rightId = 0;
  let leftId = 0;

  for (let i = 0; i < measures.length; i += 1) {
    const measure = measures[i];
    const mStart = measure.ticksStart;
    const mEnd = measure.ticksStart + measure.totalTicks;

    let rightNotes = [];
    let leftNotes = [];

    if (splitSingle && rightTrack) {
      for (const n of rightTrack.notes || []) {
        if (n.ticks >= mStart && n.ticks < mEnd) {
          if ((n.midi || 0) >= 60) rightNotes.push(n);
          else leftNotes.push(n);
        }
      }
    } else {
      if (rightTrack) rightNotes = (rightTrack.notes || []).filter((n) => n.ticks >= mStart && n.ticks < mEnd);
      if (leftTrack) leftNotes = (leftTrack.notes || []).filter((n) => n.ticks >= mStart && n.ticks < mEnd);
    }

    right.push(
      buildMeasureEntry({
        measure,
        measureIndex: i,
        notes: rightNotes,
        handPrefix: "r",
        direction: "up",
        ppq,
        idStart: rightId,
      }),
    );

    left.push(
      buildMeasureEntry({
        measure,
        measureIndex: i,
        notes: leftNotes,
        handPrefix: "l",
        direction: "down",
        ppq,
        idStart: leftId,
      }),
    );

    rightId += rightNotes.length;
    leftId += leftNotes.length;
  }

  return { right, left };
}

function mapControlChanges(controlChanges) {
  const output = {};
  for (const [cc, values] of Object.entries(controlChanges || {})) {
    output[cc] = (values || []).map((v) => ({
      number: v.number,
      ticks: v.ticks,
      time: v.time,
      value: v.value,
    }));
  }
  return output;
}

function mapOriginal(midi) {
  const header = midi.header || {};
  return {
    header: {
      keySignatures: (header.keySignatures || []).map((k) => ({ key: k.key, scale: k.scale, ticks: k.ticks })),
      meta: [],
      name: header.name || "",
      ppq: header.ppq || 480,
      tempos: normalizeTempos(header).map((t) => ({ bpm: t.bpm, ticks: t.ticks })),
      timeSignatures: (header.timeSignatures || []).map((t) => ({
        ticks: t.ticks,
        timeSignature: t.timeSignature,
        measures: t.measures ?? 0,
      })),
    },
    tracks: (midi.tracks || []).map((track) => {
      const notes = (track.notes || []).map((n) => ({
        duration: round(n.duration || 0, 12),
        durationTicks: n.durationTicks || 0,
        midi: n.midi || 0,
        name: n.name || midiToName(n.midi || 0).noteName,
        ticks: n.ticks || 0,
        time: round(n.time || 0, 12),
        velocity: clamp01(n.velocity ?? 0.7),
      }));

      const endOfTrackTicks = notes.reduce((acc, n) => Math.max(acc, n.ticks + n.durationTicks), 0);
      return {
        channel: track.channel ?? 0,
        controlChanges: mapControlChanges(track.controlChanges),
        pitchBends: track.pitchBends || [],
        instrument: {
          family: track.instrument?.family || "piano",
          number: track.instrument?.number ?? 0,
          name: track.instrument?.name || "acoustic grand piano",
        },
        name: track.name || "",
        notes,
        endOfTrackTicks,
      };
    }),
  };
}

function buildOutput(midi, meta) {
  const header = midi.header || {};
  const tracks = midi.tracks || [];
  const ppq = header.ppq || 480;

  const supportingTracks = tracks
    .filter((t) => (t.notes || []).length > 0)
    .map((track) => ({
      notes: track.notes.map((n) => ({
        midi: n.midi,
        time: round(n.time || 0, 12),
        velocity: clamp01(n.velocity ?? 0.7),
        duration: round(n.duration || 0, 12),
      })),
      myInstrument: -5,
      theirInstrument: 0,
    }));

  const measures = buildMeasures(header, tracks);
  const tracksV2 = buildTracksV2(tracks, measures, ppq);

  const tempos = normalizeTempos(header);
  const maxEnd = tracks.reduce((mx, t) => {
    const tEnd = (t.notes || []).reduce((nmx, n) => Math.max(nmx, (n.time || 0) + (n.duration || 0)), 0);
    return Math.max(mx, tEnd);
  }, 0);

  return {
    supportingTracks,
    start_time: 0,
    song_length: Math.floor(maxEnd),
    resolution: ppq,
    tempos: tempos.map((t) => ({
      bpm: t.bpm,
      ticks: t.ticks,
      time: round(t.time || ticksToSeconds(t.ticks, tempos, ppq), 12),
    })),
    keySignatures: (header.keySignatures || []).map((k) => ({ key: k.key, scale: k.scale, ticks: k.ticks })),
    timeSignatures: (header.timeSignatures || []).map((t) => ({
      ticks: t.ticks,
      timeSignature: t.timeSignature,
      measures: t.measures ?? 0,
    })),
    measures,
    tracksV2,
    original: mapOriginal(midi),
    accompanyingInstruments: tracks.map((t) => t.instrument?.number ?? 0),
    accompanyingChannels: tracks.map((t) => t.channel ?? 0),
    accompanyingTracks: [],
    name: meta.songName || header.name || "",
    artist: meta.artistName || "",
  };
}

function midiMainKey(midi) {
  const k = midi.header?.keySignatures?.[0];
  return k ? `${k.key || "C"} ${k.scale || "major"}` : "C major";
}

function midiBpm(midi) {
  return Math.round(midi.header?.tempos?.[0]?.bpm || 120);
}

function midiDuration(midi) {
  let maxEnd = 0;
  for (const track of midi.tracks || []) {
    for (const n of track.notes || []) {
      const e = (n.time || 0) + (n.duration || 0);
      if (e > maxEnd) maxEnd = e;
    }
  }
  return round(maxEnd, 2);
}

function midiInstruments(midi) {
  const names = new Set();
  for (const track of midi.tracks || []) names.add(track.instrument?.name || "acoustic grand piano");
  return [...names];
}

function getSongById(songId) {
  return state.db?.songs?.find((s) => s.id === songId) || null;
}

function practiceBySong(songId) {
  return state.db?.practiceMeta?.find((p) => p.songId === songId) || null;
}

function tagsForSong(songId) {
  const ids = (state.db.songTags || []).filter((st) => st.songId === songId).map((st) => st.tagId);
  return ids
    .map((id) => (state.db.tags || []).find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => t.name);
}

function instrumentsForSong(song) {
  const raw = Array.isArray(song?.instruments) ? song.instruments : [];
  return [...new Set(raw.map((x) => repairMojibake(String(x || "").trim())).filter(Boolean))];
}

function inferGenreFromSignals(signals) {
  const s = normalizeText(signals.join(" "));
  if (!s) return "";
  if (/\b(classica|classico|barocco|romantico|sonata|nocturne|notturno|preludio|fuga|waltz|valzer|chopin|mozart|beethoven|bach|liszt|tchaikovsky)\b/.test(s)) return "Classica";
  if (/\b(jazz|swing|blues|bebop)\b/.test(s)) return "Jazz";
  if (/\b(pop|synthpop|indie pop)\b/.test(s)) return "Pop";
  if (/\b(rock|metal|punk)\b/.test(s)) return "Rock";
  if (/\b(film|soundtrack|ost|cinematic)\b/.test(s)) return "Soundtrack";
  if (/\b(electronic|edm|house|techno|trance|ambient)\b/.test(s)) return "Electronic";
  if (/\b(folk|traditional)\b/.test(s)) return "Folk";
  return "";
}

function genreForSong(song) {
  const explicit = String(song?.genre || "").trim();
  if (explicit) return explicit;
  const tags = tagsForSong(song.id);
  return inferGenreFromSignals([song?.title || "", song?.artist || "", song?.composer || "", ...tags]);
}

function collectionsForSong(songId) {
  const ids = (state.db.songCollection || []).filter((sc) => sc.songId === songId).map((sc) => sc.collectionId);
  return ids.map((id) => state.db.collections.find((c) => c.id === id)).filter(Boolean);
}

function isFavorite(songId) {
  return (state.db.songCollection || []).some((sc) => sc.songId === songId && sc.collectionId === "col-favorites");
}

function updateKeyFilterOptions() {
  const keys = [...new Set((state.db?.songs || []).map((s) => s.key).filter(Boolean))].sort();
  const selected = el.keyFilter.value;
  el.keyFilter.innerHTML = '<option value="">Tonalita</option>' + keys.map((k) => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join("");
  if (keys.includes(selected)) el.keyFilter.value = selected;
}

function filteredSongs() {
  const isLibraryView = state.view === "library";
  const q = isLibraryView ? el.searchInput.value.trim().toLowerCase() : "";
  const bpmFilter = isLibraryView ? el.bpmFilter.value : "";
  const keyFilter = isLibraryView ? el.keyFilter.value : "";
  const diffFilter = isLibraryView ? el.difficultyFilter.value : "";
  const durFilter = isLibraryView ? el.durationFilter.value : "";

  let list = [...(state.db?.songs || [])];

  if (state.view === "favorites") list = list.filter((s) => isFavorite(s.id));
  if (state.view === "genres") {
    if (state.selectedGenre) {
      const selected = normalizeText(state.selectedGenre);
      list = list.filter((s) => normalizeText(genreForSong(s)) === selected);
    } else {
      list = [];
    }
  }
  if (state.view === "artists") {
    if (state.selectedArtist) {
      const selected = normalizeText(state.selectedArtist);
      list = list.filter((s) => normalizeText(s.artist) === selected);
    } else {
      list = [];
    }
  }
  if (state.view === "playlists") {
    if (state.selectedPlaylistId) {
      list = list.filter((s) =>
        (state.db.songCollection || []).some((sc) => sc.songId === s.id && sc.collectionId === state.selectedPlaylistId),
      );
    } else {
      list = [];
    }
  }
  if (state.view === "import" || state.view === "home") {
    list = [];
  }

  if (state.studyFilter) {
    if (state.studyFilter === "recent") {
      const now = Date.now();
      const THIRTY = 30 * 24 * 60 * 60 * 1000;
      list = list.filter((s) => now - new Date(s.importedAt).getTime() <= THIRTY);
    } else {
      list = list.filter((s) => practiceBySong(s.id)?.studyStatus === state.studyFilter);
    }
  }

  if (q) {
    list = list.filter((song) => {
      const hay = [song.title, song.artist, song.composer, song.genre, song.key, song.difficulty, ...tagsForSong(song.id)]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  if (bpmFilter) {
    list = list.filter((song) => {
      const bpm = Number(song.bpm || 0);
      if (bpmFilter === "lt90") return bpm < 90;
      if (bpmFilter === "90-120") return bpm >= 90 && bpm <= 120;
      if (bpmFilter === "121-150") return bpm >= 121 && bpm <= 150;
      if (bpmFilter === "gt150") return bpm > 150;
      return true;
    });
  }

  if (keyFilter) list = list.filter((song) => song.key === keyFilter);
  if (diffFilter) list = list.filter((song) => song.difficulty === diffFilter);

  if (durFilter) {
    list = list.filter((song) => {
      const d = Number(song.duration || 0);
      if (durFilter === "lt120") return d < 120;
      if (durFilter === "120-300") return d >= 120 && d <= 300;
      if (durFilter === "gt300") return d > 300;
      return true;
    });
  }

  const dir = state.sort.dir === "asc" ? 1 : -1;
  const key = state.sort.key;
  list.sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (key === "importedAt") return (new Date(va).getTime() - new Date(vb).getTime()) * dir;
    if (typeof va === "number" || typeof vb === "number") return (Number(va || 0) - Number(vb || 0)) * dir;
    return String(va || "").localeCompare(String(vb || "")) * dir;
  });

  return list;
}

function pagedSongs(list) {
  const totalPages = Math.max(1, Math.ceil(list.length / state.pageSize));
  state.page = Math.min(totalPages, Math.max(1, state.page));
  const start = (state.page - 1) * state.pageSize;
  return {
    rows: list.slice(start, start + state.pageSize),
    totalPages,
  };
}

function currentPageRows() {
  const list = filteredSongs();
  return pagedSongs(list).rows;
}

function renderTable() {
  const list = filteredSongs();
  const { rows, totalPages } = pagedSongs(list);

  el.pageInfo.textContent = `Pagina ${state.page}/${totalPages}`;
  el.prevPageBtn.disabled = state.page <= 1;
  el.nextPageBtn.disabled = state.page >= totalPages;

  if (rows.length === 0) {
    el.songsTableBody.innerHTML = '<tr><td colspan="8">Nessun brano trovato.</td></tr>';
    if (el.selectAllPageCheckbox) el.selectAllPageCheckbox.checked = false;
    return;
  }

  el.songsTableBody.innerHTML = rows
    .map((song) => {
      const active = song.id === state.selectedSongId ? "active" : "";
      const avatar = (song.title || "?").slice(0, 1).toUpperCase();
      const checked = state.selectedSongIds.has(song.id) ? "checked" : "";
      const playlistAction =
        state.view === "playlists" && state.selectedPlaylistId
          ? `<button class="icon-btn" data-row-action="remove-playlist" data-song-id="${song.id}" title="Rimuovi dalla playlist aperta">−</button>`
          : `<button class="icon-btn" data-row-action="playlist" data-song-id="${song.id}" title="Aggiungi playlist">＋</button>`;
      return `
        <tr data-song-id="${song.id}" class="${active}">
          <td><input type="checkbox" data-row-action="select" data-song-id="${song.id}" ${checked} /></td>
          <td>
            <div class="song-cell">
              <div class="cover">${escapeHtml(avatar)}</div>
              <div>
                <strong>${escapeHtml(song.title || "Senza titolo")}</strong><br />
                <small>${isFavorite(song.id) ? "★ Preferito" : ""}</small>
              </div>
            </div>
          </td>
          <td>${escapeHtml(song.artist || "-")}</td>
          <td>${escapeHtml(song.bpm || "-")}</td>
          <td>${escapeHtml(song.key || "-")}</td>
          <td>${secondsToClock(song.duration || 0)}</td>
          <td>${new Date(song.importedAt).toLocaleDateString("it-IT")}</td>
          <td>
            <div class="row-actions">
              <button class="icon-btn" data-row-action="favorite" data-song-id="${song.id}" title="Preferito">
                ${isFavorite(song.id) ? "♥" : "♡"}
              </button>
              ${playlistAction}
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  if (el.selectAllPageCheckbox) {
    const allSelected = rows.length > 0 && rows.every((s) => state.selectedSongIds.has(s.id));
    el.selectAllPageCheckbox.checked = allSelected;
  }
}

function renderDirectoryPanel() {
  const songs = state.db?.songs || [];
  const manual = (state.db?.collections || []).filter((c) => c.type === "playlist" && !c.smartRule);

  if (state.view === "home") {
    const recentCount = songs
      .filter((s) => Date.now() - new Date(s.importedAt).getTime() <= 30 * 24 * 60 * 60 * 1000)
      .length;
    const toStudyCount = (state.db?.practiceMeta || []).filter((p) => p.studyStatus === "to_study").length;
    el.playlistsSectionTitle.textContent = "Panoramica";
    el.playlistsCards.innerHTML = `
      <article class="smart-card"><strong>Importa nuovi MIDI</strong><p>Apri la sezione import per convertire in JSON.</p><button class="chip" data-nav-target="import">Vai a Importa MIDI</button></article>
      <article class="smart-card"><strong>Preferiti</strong><p>${songs.filter((s) => isFavorite(s.id)).length} brani</p><button class="chip" data-nav-target="favorites">Apri Preferiti</button></article>
      <article class="smart-card"><strong>Playlist</strong><p>${manual.length} playlist create</p><button class="chip" data-nav-target="playlists">Apri Playlist</button></article>
      <article class="smart-card"><strong>Recenti / Da studiare</strong><p>${recentCount} recenti · ${toStudyCount} da studiare</p></article>
    `;
    return;
  }

  if (state.view === "library") {
    const q = el.searchInput.value.trim();
    const hasFilters = Boolean(q || el.bpmFilter.value || el.keyFilter.value || el.difficultyFilter.value || el.durationFilter.value);
    el.playlistsSectionTitle.textContent = "Libreria";
    el.playlistsCards.innerHTML = hasFilters
      ? `<article class="smart-card"><strong>Filtri attivi</strong><p>La tabella mostra i brani filtrati.</p></article>`
      : `<article class="smart-card"><strong>Catalogo completo</strong><p>La tabella mostra tutti i brani. Usa Cerca o i filtri per restringere.</p></article>`;
    return;
  }

  if (state.view === "playlists") {
    el.playlistsSectionTitle.textContent = "Le Tue Playlist";
    el.playlistsCards.innerHTML =
      manual.length === 0
        ? '<article class="smart-card"><strong>Nessuna playlist</strong><p>Crea una playlist con il pulsante in alto.</p></article>'
        : manual
            .map((playlist) => {
              const count = (state.db.songCollection || []).filter((sc) => sc.collectionId === playlist.id).length;
              const active = state.selectedPlaylistId === playlist.id;
              return `<article class="smart-card">
                <strong>${escapeHtml(playlist.name)}</strong>
                <p>${count} brani ·</p>
                <button class="chip ${active ? "active" : ""}" data-open-playlist-id="${playlist.id}">${active ? "Aperta" : "Apri"}</button>
              </article>`;
            })
            .join("");
    return;
  }

  if (state.view === "genres") {
    const counts = new Map();
    for (const song of songs) {
      const g = genreForSong(song);
      if (!g) continue;
      const current = counts.get(g) || { count: 0, inProgress: 0, mastered: 0 };
      current.count += 1;
      const st = practiceBySong(song.id)?.studyStatus || "to_study";
      if (st === "in_progress") current.inProgress += 1;
      if (st === "mastered") current.mastered += 1;
      counts.set(g, current);
    }
    const tags = [...counts.entries()].sort(
      (a, b) =>
        b[1].inProgress + b[1].mastered * 2 - (a[1].inProgress + a[1].mastered * 2) || b[1].count - a[1].count,
    );
    const smart = [
      { name: "Classica lenta", count: songs.filter((s) => normalizeText(genreForSong(s)) === "classica" && Number(s.bpm || 0) < 90).length },
      {
        name: "Studio intermedio",
        count: songs.filter((s) => ["classica", "jazz", "soundtrack"].includes(normalizeText(genreForSong(s))) && s.difficulty === "intermedio")
          .length,
      },
      { name: "Energia alta", count: songs.filter((s) => Number(s.bpm || 0) >= 130).length },
    ].filter((x) => x.count > 0);
    el.playlistsSectionTitle.textContent = "Generi e Tag";
    const genreCards =
      tags.length === 0
        ? '<article class="smart-card"><strong>Nessun genere</strong><p>Aggiungi tag ai brani per navigare per genere.</p></article>'
        : tags
            .map(([name, stats]) => {
              const active = normalizeText(state.selectedGenre) === normalizeText(name);
              const hue = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
              return `<article class="smart-card">
                <div class="cover" style="background: linear-gradient(140deg, hsl(${hue},70%,42%), hsl(${(hue + 38) % 360},70%,34%));">${escapeHtml(
                  name.slice(0, 1).toUpperCase(),
                )}</div>
                <strong>${escapeHtml(name)}</strong>
                <p>${stats.count} brani · in progress ${stats.inProgress} · mastered ${stats.mastered}</p>
                <button class="chip ${active ? "active" : ""}" data-open-genre="${escapeHtml(name)}">${active ? "Aperto" : "Apri"}</button>
              </article>`;
            })
            .join("");
    const smartCards = smart
      .map((x) => `<article class="smart-card"><strong>Smart: ${escapeHtml(x.name)}</strong><p>${x.count} brani</p></article>`)
      .join("");
    el.playlistsCards.innerHTML = `${genreCards}${smartCards}`;
    return;
  }

  if (state.view === "artists") {
    const byArtist = new Map();
    for (const s of songs) {
      const name = (s.artist || "").trim();
      if (!name) continue;
      byArtist.set(name, (byArtist.get(name) || 0) + 1);
    }
    const artists = [...byArtist.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    el.playlistsSectionTitle.textContent = "Artisti";
    el.playlistsCards.innerHTML =
      artists.length === 0
        ? '<article class="smart-card"><strong>Nessun artista</strong><p>Importa brani con metadati artista per popolare questa vista.</p></article>'
        : artists
            .map(([name, count]) => {
              const active = normalizeText(state.selectedArtist) === normalizeText(name);
              return `<article class="smart-card">
                <strong>${escapeHtml(name)}</strong>
                <p>${count} brani</p>
                <button class="chip ${active ? "active" : ""}" data-open-artist="${escapeHtml(name)}">${active ? "Aperto" : "Apri"}</button>
              </article>`;
            })
            .join("");
    return;
  }

  el.playlistsSectionTitle.textContent = "";
  el.playlistsCards.innerHTML = "";
}

function shouldShowTable() {
  if (state.view === "home" || state.view === "import") return false;
  if (state.view === "library") return true;
  if (state.view === "playlists") return Boolean(state.selectedPlaylistId);
  if (state.view === "genres") return Boolean(state.selectedGenre);
  if (state.view === "artists") return Boolean(state.selectedArtist);
  return true;
}

function renderSmartPlaylists() {
  const smart = (state.db.collections || []).filter((c) => c.smartRule);
  el.smartCards.innerHTML = smart
    .map((c) => {
      const count = (state.db.songCollection || []).filter((sc) => sc.collectionId === c.id).length;
      return `<article class="smart-card"><strong>${escapeHtml(c.name)}</strong><p>${count} brani</p></article>`;
    })
    .join("");
}

function renderViewLabels() {
  const map = {
    home: ["Home", "Dashboard Studio"],
    library: ["Libreria", "Archivio Brani"],
    import: ["Import", "Importa MIDI"],
    favorites: ["Preferiti", "Brani Preferiti"],
    playlists: ["Playlist", "Le Tue Playlist"],
    genres: ["Generi", "Tag / Generi"],
    artists: ["Artisti", "Catalogo Artisti"],
  };
  const [k, t] = map[state.view] || map.home;
  el.viewKicker.textContent = k;
  el.viewTitle.textContent = t;
  const manualPlaylists = (state.db?.collections || []).filter((c) => c.type === "playlist" && !c.smartRule).length;
  let context = `Playlist manuali: ${manualPlaylists}`;
  if (state.view === "playlists" && state.selectedPlaylistId) {
    const p = (state.db?.collections || []).find((c) => c.id === state.selectedPlaylistId);
    context = p ? `Playlist aperta: ${p.name}` : context;
  }
  if (state.view === "genres" && state.selectedGenre) context = `Genere aperto: ${state.selectedGenre}`;
  if (state.view === "artists" && state.selectedArtist) context = `Artista aperto: ${state.selectedArtist}`;
  el.playlistCount.textContent = context;
  el.importPanel.classList.toggle("hidden", state.view !== "import");
  el.playlistsSection.classList.toggle("hidden", !["home", "library", "playlists", "genres", "artists"].includes(state.view));
  el.smartPlaylistsSection.classList.toggle("hidden", state.view !== "home");
  const libraryOnly = state.view === "library";
  el.searchWrap.classList.toggle("hidden", !libraryOnly);
  el.filterPanel.classList.toggle("hidden", !libraryOnly);
  el.detailPanel.classList.toggle("hidden", !libraryOnly);
  el.contentGrid.classList.toggle("single-column", !libraryOnly);
  const showTable = shouldShowTable();
  el.tableWrap.classList.toggle("hidden", !showTable);
  el.paginationWrap.classList.toggle("hidden", !showTable);
}

function renderDetail() {
  const song = getSongById(state.selectedSongId);
  if (!song) {
    el.emptyDetail.classList.remove("hidden");
    el.detailContent.classList.add("hidden");
    el.detailInstrumentsBadges.innerHTML = "";
    if (el.visualizerLegend) el.visualizerLegend.innerHTML = "";
    if (el.footerTrackTitle) el.footerTrackTitle.textContent = "Nessun brano";
    if (el.footerTrackArtist) el.footerTrackArtist.textContent = "-";
    return;
  }

  const practice = practiceBySong(song.id) || { studyStatus: "to_study", playbackSpeed: 1, lastPracticePointSec: 0 };
  const tags = tagsForSong(song.id);
  const collections = collectionsForSong(song.id);
  const playlists = collections.filter((c) => c.type === "playlist" && !c.smartRule).map((c) => c.name);
  const instruments = instrumentsForSong(song);
  const activeSet = new Set(state.player.activeInstrumentsBySong[song.id] || instruments);
  const activeCount = instruments.filter((name) => activeSet.has(name)).length;

  el.emptyDetail.classList.add("hidden");
  el.detailContent.classList.remove("hidden");

  el.detailTitle.textContent = song.title || "Senza titolo";
  el.detailSubtitle.textContent = `${song.artist || "Artista sconosciuto"} · ${song.composer || "Compositore n/d"}`;

  el.detailMeta.innerHTML = [
    `<li><strong>Difficolta:</strong> ${escapeHtml(song.difficulty || "-")}</li>`,
    `<li><strong>Genere:</strong> ${escapeHtml(genreForSong(song) || "-")}</li>`,
    `<li><strong>Tonalita:</strong> ${escapeHtml(song.key || "-")}</li>`,
    `<li><strong>BPM:</strong> ${escapeHtml(song.bpm || "-")}</li>`,
    `<li><strong>Durata:</strong> ${secondsToClock(song.duration || 0)}</li>`,
    `<li><strong>Tracce attive:</strong> ${activeCount} / ${instruments.length || 0}</li>`,
    `<li><strong>Strumenti:</strong> ${escapeHtml(instruments.join(", ") || "-")}</li>`,
    `<li><strong>Tag:</strong> ${escapeHtml(tags.join(", ") || "-")}</li>`,
    `<li><strong>Playlist:</strong> ${escapeHtml(playlists.join(", ") || "-")}</li>`,
    `<li><strong>Path JSON:</strong> ${escapeHtml(song.jsonPath || "-")}</li>`,
    `<li><strong>Path MIDI:</strong> ${escapeHtml(song.midiPath || "-")}</li>`,
  ].join("");
  el.detailInstrumentsBadges.innerHTML = instruments.length
    ? instruments
        .map((name) => {
          const active = activeSet.has(name) ? " active" : " inactive";
          return `<button class="instrument-badge${active}" data-instrument-toggle="${escapeHtml(name)}" type="button" title="Attiva/disattiva strumento">${escapeHtml(name)}</button>`;
        })
        .join("")
    : '<span class="instrument-badge muted">Nessuno strumento rilevato</span>';
  renderVisualizerLegend(song.id);

  el.editTitle.value = song.title || "";
  el.editArtist.value = song.artist || "";
  el.editComposer.value = song.composer || "";
  el.editGenre.value = song.genre || "";
  el.editDifficulty.value = song.difficulty || "intermedio";
  el.editKey.value = song.key || "";
  el.editBpm.value = Number(song.bpm || 120);
  el.editDuration.value = Number(song.duration || 0);
  el.editInstruments.value = (song.instruments || []).join(", ");
  el.editTags.value = tags.join(", ");
  el.editCollections.value = collections.filter((c) => c.type === "playlist" && !c.smartRule).map((c) => c.id).join(", ");
  el.editStudyStatus.value = practice.studyStatus || "to_study";
  el.editPlaybackSpeed.value = Number(practice.playbackSpeed || 1);
  el.playerSpeedSelect.value = String(practice.playbackSpeed || 1);
  if (el.footerTrackTitle) el.footerTrackTitle.textContent = song.title || "Senza titolo";
  if (el.footerTrackArtist) el.footerTrackArtist.textContent = song.artist || song.composer || "-";
}

function render() {
  const validSongIds = new Set((state.db?.songs || []).map((s) => s.id));
  state.selectedSongIds = new Set([...state.selectedSongIds].filter((id) => validSongIds.has(id)));
  updateKeyFilterOptions();
  renderViewLabels();
  if (shouldShowTable()) renderTable();
  renderDirectoryPanel();
  renderSmartPlaylists();
  renderDetail();
  updateSelectionInfo();
}

async function refreshDb() {
  showLoading(true);
  try {
    state.db = await api("/api/library");
  } finally {
    showLoading(false);
  }
}

function selectNav(view) {
  state.view = view;
  state.page = 1;
  if (view !== "playlists") state.selectedPlaylistId = "";
  if (view !== "genres") state.selectedGenre = "";
  if (view !== "artists") state.selectedArtist = "";
  for (const item of el.navItems) item.classList.toggle("active", item.dataset.view === view);
  if (view !== "home") {
    state.studyFilter = "";
    for (const chip of el.studyChips) chip.classList.remove("active");
  }
  render();
}

function onDirectoryPanelClick(event) {
  const navBtn = event.target.closest("[data-nav-target]");
  if (navBtn) {
    selectNav(navBtn.dataset.navTarget);
    return;
  }

  const playlistBtn = event.target.closest("[data-open-playlist-id]");
  if (playlistBtn) {
    state.selectedPlaylistId = playlistBtn.dataset.openPlaylistId;
    state.page = 1;
    render();
    return;
  }

  const genreBtn = event.target.closest("[data-open-genre]");
  if (genreBtn) {
    state.selectedGenre = genreBtn.dataset.openGenre;
    state.page = 1;
    render();
    return;
  }

  const artistBtn = event.target.closest("[data-open-artist]");
  if (artistBtn) {
    state.selectedArtist = artistBtn.dataset.openArtist;
    state.page = 1;
    render();
  }
}

async function ensurePlaylist(name) {
  if (!name || !name.trim()) return null;
  const payload = await api("/api/collections", {
    method: "POST",
    body: JSON.stringify({ name: name.trim(), type: "playlist" }),
  });
  return payload.collection;
}

function dedupeBatchItems(items, mode = "keep_first") {
  const kept = [];
  const dropped = [];
  const keyToIndex = new Map();
  const makeKeys = (item) => {
    const keys = [];
    if (item?.fileHash) keys.push(`hash:${item.fileHash}`);
    const t = normalizeText(item?.song?.title || "");
    const a = normalizeText(item?.song?.artist || "");
    if (t && a) keys.push(`ta:${t}||${a}`);
    return keys;
  };

  for (const item of items) {
    const keys = makeKeys(item);
    let conflictIdx = -1;
    for (const k of keys) {
      if (keyToIndex.has(k)) {
        conflictIdx = keyToIndex.get(k);
        break;
      }
    }
    if (conflictIdx === -1) {
      kept.push(item);
      const idx = kept.length - 1;
      for (const k of keys) keyToIndex.set(k, idx);
      continue;
    }

    if (mode === "keep_last") {
      const prev = kept[conflictIdx];
      if (prev) dropped.push({ item: prev, reason: "duplicato batch (tenuto ultimo)" });
      kept[conflictIdx] = item;
      for (const [k, v] of keyToIndex.entries()) {
        if (v === conflictIdx) keyToIndex.delete(k);
      }
      for (const k of keys) keyToIndex.set(k, conflictIdx);
    } else {
      dropped.push({ item, reason: "duplicato batch (tenuto primo)" });
    }
  }

  return { kept, dropped };
}

function dedupeJsonArchiveItems(items, mode = "keep_first") {
  const kept = [];
  const dropped = [];
  const keyToIndex = new Map();

  const buildKeys = (entry) => {
    const keys = [];
    const fileName = normalizeText(entry?.fileName || "");
    if (fileName) keys.push(`file:${fileName}`);
    const data = entry?.jsonData;
    if (data && typeof data === "object") {
      const songName = normalizeText(data?.name || "");
      const artist = normalizeText(data?.artist || "");
      if (songName && artist) keys.push(`ta:${songName}||${artist}`);
      if (songName) keys.push(`title:${songName}`);
    }
    return keys;
  };

  for (const item of items) {
    const keys = buildKeys(item);
    let conflictIdx = -1;
    for (const key of keys) {
      if (keyToIndex.has(key)) {
        conflictIdx = keyToIndex.get(key);
        break;
      }
    }

    if (conflictIdx === -1) {
      kept.push(item);
      const idx = kept.length - 1;
      for (const key of keys) keyToIndex.set(key, idx);
      continue;
    }

    if (mode === "keep_last") {
      const prev = kept[conflictIdx];
      if (prev) dropped.push({ item: prev, reason: "duplicato interno archivio (tenuto ultimo)" });
      kept[conflictIdx] = item;
      for (const [k, v] of keyToIndex.entries()) {
        if (v === conflictIdx) keyToIndex.delete(k);
      }
      for (const key of keys) keyToIndex.set(key, conflictIdx);
    } else {
      dropped.push({ item, reason: "duplicato interno archivio (tenuto primo)" });
    }
  }

  return { kept, dropped };
}

function getExternalDuplicateCandidates(items) {
  return items
    .filter((x) => x?.duplicateInfo?.duplicate)
    .map((x) => ({
      fileName: x.sourceFileName,
      existingSongId: x.duplicateInfo.duplicate?.id || "",
      existingTitle: x.duplicateInfo.duplicate?.title || "-",
      existingArtist: x.duplicateInfo.duplicate?.artist || "-",
      reason: x.duplicateInfo.reason || "duplicato",
    }));
}

function askDuplicatePolicyWithModal(candidates) {
  return new Promise((resolve) => {
    if (!candidates || candidates.length === 0) {
      resolve({ mode: "skip_all", perFile: {} });
      return;
    }
    el.duplicateModalBody.innerHTML = candidates
      .map(
        (d, idx) => `<tr>
          <td>${escapeHtml(d.fileName || "-")}</td>
          <td>${escapeHtml(d.reason || "-")}</td>
          <td>${escapeHtml(`${d.existingTitle || "-"} / ${d.existingArtist || "-"}`)}</td>
          <td>
            <select data-dup-row="${idx}">
              <option value="overwrite">Sovrascrivi</option>
              <option value="skip">Salta</option>
            </select>
          </td>
        </tr>`,
      )
      .join("");
    el.duplicateModal.classList.remove("hidden");

    const cleanup = () => {
      el.duplicateModal.classList.add("hidden");
      el.duplicateApplySelectionsBtn.removeEventListener("click", onApplyPerFile);
      el.duplicateOverwriteAllBtn.removeEventListener("click", onOverwrite);
      el.duplicateSkipAllBtn.removeEventListener("click", onSkip);
      el.duplicateCancelBtn.removeEventListener("click", onCancel);
    };
    const onApplyPerFile = () => {
      const perFile = {};
      const selects = el.duplicateModalBody.querySelectorAll("select[data-dup-row]");
      for (const sel of selects) {
        const idx = Number(sel.getAttribute("data-dup-row"));
        const c = candidates[idx];
        if (!c) continue;
        const key = `${c.fileName}::${c.existingSongId || ""}`;
        perFile[key] = sel.value === "overwrite" ? "overwrite" : "skip";
      }
      cleanup();
      resolve({ mode: "per_file", perFile });
    };
    const onOverwrite = () => {
      cleanup();
      resolve({ mode: "overwrite_all", perFile: {} });
    };
    const onSkip = () => {
      cleanup();
      resolve({ mode: "skip_all", perFile: {} });
    };
    const onCancel = () => {
      cleanup();
      resolve({ mode: "cancel", perFile: {} });
    };

    el.duplicateApplySelectionsBtn.addEventListener("click", onApplyPerFile);
    el.duplicateOverwriteAllBtn.addEventListener("click", onOverwrite);
    el.duplicateSkipAllBtn.addEventListener("click", onSkip);
    el.duplicateCancelBtn.addEventListener("click", onCancel);
  });
}

function detectDuplicateForItem({ fileHash, title, artist }, existingSongs, seenHashes, seenTitleArtist) {
  const duplicateByHash = existingSongs.find((s) => s.fileHash === fileHash);
  const duplicateByTitleArtist = existingSongs.find(
    (s) =>
      normalizeText(artist) &&
      normalizeText(s.title) === normalizeText(title) &&
      normalizeText(s.artist) === normalizeText(artist),
  );
  const duplicate = duplicateByHash || duplicateByTitleArtist;
  const normArtist = normalizeText(artist);
  const batchKey = normArtist ? `${normalizeText(title)}||${normArtist}` : "";
  const duplicateInBatch = seenHashes.has(fileHash) || (batchKey ? seenTitleArtist.has(batchKey) : false);
  if (batchKey) seenTitleArtist.add(batchKey);
  seenHashes.add(fileHash);
  return {
    duplicate,
    duplicateInBatch,
    reason: duplicateInBatch
      ? "duplicato nel batch corrente"
      : duplicateByHash
        ? "hash-file uguale"
        : duplicateByTitleArtist
          ? "titolo+artista uguali"
          : "",
  };
}

async function buildBatchItemFromArrayBuffer({
  sourceName,
  arrBuffer,
  existingSongs,
  seenHashes,
  seenTitleArtist,
  titleOverride = "",
}) {
  const fileHash = await sha256Hex(arrBuffer);
  const midi = new Midi(arrBuffer);
  const baseName = sourceName.replace(/\.(mid|midi)$/i, "");
  const title = repairMojibake(titleOverride || el.metaTitle.value.trim() || baseName);
  const artist = repairMojibake(el.metaArtist.value.trim());
  const composer = repairMojibake(el.metaComposer.value.trim());
  const genre = repairMojibake(el.metaGenre.value.trim());
  const mergedTags = parseTagsInput(el.metaTags.value);
  const finalKey = midiMainKey(midi);
  const jsonData = buildOutput(midi, { songName: title, artistName: artist });
  const dup = detectDuplicateForItem({ fileHash, title, artist }, existingSongs, seenHashes, seenTitleArtist);

  return {
    item: {
      sourceFileName: sourceName,
      fileHash,
      midiBase64: toBase64(arrBuffer),
      jsonData,
      song: {
        title,
        artist,
        composer,
        genre,
        difficulty: el.metaDifficulty.value,
        studyStatus: el.metaStudyStatus.value,
        tags: mergedTags,
        key: finalKey,
        bpm: midiBpm(midi),
        duration: midiDuration(midi),
        instruments: midiInstruments(midi),
        playbackSpeed: 1,
        lastPracticePointSec: 0,
        favoriteLoops: [],
        favorite: false,
        collectionIds: [],
      },
      inferred: {},
      duplicateInfo: dup,
    },
    inferredLine: `${sourceName} -> titolo: ${title} | artista: ${artist || "-"} | compositore: ${composer || "-"}`,
  };
}

async function prepareBatchPreview() {
  const files = [...(el.midiFileInput.files || [])];
  if (files.length === 0) {
    setImportStatus("Seleziona almeno un MIDI.", "error");
    return;
  }

  showBatchProgress(true);
  setBatchProgress(0, "Analisi file...");
  try {
    state.batchItems = [];
    state.duplicateCandidates = [];
    const previewSource = files[0];
    const inferredLines = [];
    const existingSongs = state.db?.songs || [];
    const seenHashes = new Set();
    const seenTitleArtist = new Set();
    const titleOverride = files.length === 1 ? el.metaTitle.value.trim() : "";

    for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
      const file = files[fileIndex];
      setBatchProgress((fileIndex / files.length) * 100, `Parsing ${fileIndex + 1}/${files.length}: ${file.name}`);
      await nextFrame();
      const arr = await file.arrayBuffer();
      const { item, inferredLine } = await buildBatchItemFromArrayBuffer({
        sourceName: file.name,
        arrBuffer: arr,
        existingSongs,
        seenHashes,
        seenTitleArtist,
        titleOverride,
      });

      state.batchItems.push(item);
      inferredLines.push(inferredLine);
    }

    const dedupMode = el.batchDedupSelect?.value || "keep_first";
    const { kept, dropped } = dedupeBatchItems(state.batchItems, dedupMode);
    state.batchItems = kept;
    state.duplicateCandidates = getExternalDuplicateCandidates(state.batchItems);
    if (state.batchItems.length === 0) {
      el.saveBatchBtn.disabled = true;
      el.downloadBtn.disabled = true;
      el.jsonOutput.value = "";
      setImportStatus("Tutti i file sono stati deduplicati/scartati. Seleziona altri MIDI.", "error");
      showBatchProgress(false);
      return;
    }

    const previewItem = state.batchItems.find((x) => x.sourceFileName === previewSource.name) || state.batchItems[0];
    state.preview = previewItem;
    el.jsonOutput.value = JSON.stringify(previewItem.jsonData, null, 2);
    el.filenameInsights.value = inferredLines.join("\n");
    setBatchProgress(100, "Anteprima completata");

    el.saveBatchBtn.disabled = false;
    el.downloadBtn.disabled = false;
    if (dropped.length > 0) {
      toast(`Dedup batch: ${dropped.length} file rimossi (${dedupMode === "keep_last" ? "tenuto ultimo" : "tenuto primo"}).`, "ok");
    }
    if (state.duplicateCandidates.length > 0) {
      toast(`Trovati ${state.duplicateCandidates.length} duplicati in libreria. Scegli la policy prima di importare.`, "ok");
    }
    setImportStatus(`Anteprima pronta. File rilevati: ${files.length}.`, "ok");
  } catch (error) {
    state.batchItems = [];
    state.preview = null;
    state.duplicateCandidates = [];
    el.saveBatchBtn.disabled = true;
    el.downloadBtn.disabled = true;
    el.filenameInsights.value = "";
    setRecognitionFields(null);
    setImportStatus(`Errore conversione: ${error.message}`, "error");
    showBatchProgress(false);
  } finally {
    if (state.batchItems.length > 0) {
      setTimeout(() => showBatchProgress(false), 600);
    }
  }
}

async function saveBatchToLibrary() {
  if (state.batchItems.length === 0) {
    toast("Nessun batch da salvare", "error");
    return;
  }

  showBatchProgress(true);
  setBatchProgress(0, "Preparazione import...");
  try {
    const playlistName = el.metaPlaylist.value.trim();
    const playlist = await ensurePlaylist(playlistName);
    const playlistId = playlist?.id || null;

    let policy = el.duplicatePolicySelect?.value || "ask";
    let perFileDecisions = {};
    const externalDupes = getExternalDuplicateCandidates(state.batchItems);
    if ((policy === "ask" || policy === "per_file") && externalDupes.length > 0) {
      const modalChoice = await askDuplicatePolicyWithModal(externalDupes);
      policy = modalChoice.mode;
      perFileDecisions = modalChoice.perFile || {};
      if (policy === "cancel") {
        showBatchProgress(false);
        setImportStatus("Import annullato dall'utente.", "error");
        return;
      }
    }

    const overwriteAll = policy === "overwrite_all";
    let itemsToImport = state.batchItems.slice();
    if (policy === "skip_all") {
      itemsToImport = state.batchItems.filter((it) => !(it.duplicateInfo && it.duplicateInfo.duplicate));
    } else if (policy === "per_file") {
      const kept = [];
      for (const it of state.batchItems) {
        const dupId = it.duplicateInfo?.duplicate?.id || "";
        if (!dupId) {
          kept.push(it);
          continue;
        }
        const key = `${it.sourceFileName}::${dupId}`;
        const decision = perFileDecisions[key] || "skip";
        if (decision === "overwrite") {
          kept.push(it);
        }
      }
      itemsToImport = kept;
    }

    if (itemsToImport.length === 0) {
      showBatchProgress(false);
      const msg = "Nessun file da importare (tutti saltati).";
      setImportStatus(msg, "ok");
      toast(msg, "ok");
      setLastImportReport({
        kind: "midi-batch",
        createdAt: new Date().toISOString(),
        summary: { total: state.batchItems.length, imported: 0, overwritten: 0, skipped: state.batchItems.length, errored: 0 },
        report: state.batchItems.map((it) => ({
          sourceFileName: it.sourceFileName,
          status: "skipped",
          reason: "policy skip_all/per_file",
        })),
      });
      return;
    }

    const payloadItems = itemsToImport.map((it) => ({
      sourceFileName: it.sourceFileName,
      midiBase64: it.midiBase64,
      jsonData: it.jsonData,
      overwrite: policy === "per_file" && Boolean(it.duplicateInfo?.duplicate),
      overwriteSongId: it.duplicateInfo?.duplicate?.id || "",
      song: {
        ...it.song,
        collectionIds: playlistId ? [playlistId] : [],
      },
    }));

    setBatchProgress(25, `Invio batch al server (${payloadItems.length} file)...`);
    await nextFrame();
    const result = await api("/api/library/import-batch", {
      method: "POST",
      body: JSON.stringify({
        overwrite: overwriteAll,
        batchDuplicatePolicy: el.batchDedupSelect?.value || "keep_first",
        items: payloadItems,
      }),
    });
    setBatchProgress(100, "Import completato");

    await refreshDb();
    render();

    state.batchItems = [];
    state.preview = null;
    state.duplicateCandidates = [];
    el.saveBatchBtn.disabled = true;
    el.downloadBtn.disabled = true;
    el.jsonOutput.value = "";
    el.filenameInsights.value = "";
    setRecognitionFields(null);
    el.midiFileInput.value = "";

    const importedCount = Number(result.importedCount || 0);
    const overwrittenCount = Number(result.overwrittenCount || 0);
    const reportRows = Array.isArray(result.report) ? result.report : [];
    const skippedCount = reportRows.filter((r) => r.status === "skipped").length;
    const erroredCount = reportRows.filter((r) => r.status === "error").length;
    setLastImportReport({
      kind: "midi-batch",
      createdAt: new Date().toISOString(),
      summary: {
        total: payloadItems.length,
        imported: importedCount,
        overwritten: overwrittenCount,
        skipped: skippedCount,
        errored: erroredCount,
      },
      report: reportRows,
    });

    const msg = `Import completato: ${importedCount} salvati, ${overwrittenCount} sovrascritti, ${skippedCount} saltati, ${erroredCount} errori.`;
    setImportStatus(msg, erroredCount > 0 ? "error" : "ok");
    toast(msg, erroredCount > 0 ? "error" : "ok");
  } catch (error) {
    toast(error.message, "error");
    setImportStatus(`Errore import: ${error.message}`, "error");
    showBatchProgress(false);
  } finally {
    state.importCancelled = false;
    el.cancelImportBtn.classList.add("hidden");
    if (el.saveBatchBtn.disabled) {
      setTimeout(() => showBatchProgress(false), 700);
    }
  }
}

async function resolveRemoteUrl() {
  const url = el.remoteUrlInput.value.trim();
  if (!url) {
    toast("Inserisci un URL valido", "error");
    return;
  }

  showBatchProgress(true);
  setBatchProgress(5, "Analisi URL...");
  try {
    const resolved = await api("/api/remote/resolve", {
      method: "POST",
      body: JSON.stringify({ url }),
    });

    const meta = resolved.metadata || {};
    if (meta.title && !el.metaTitle.value.trim()) el.metaTitle.value = meta.title;
    if (meta.artist && !el.metaArtist.value.trim()) el.metaArtist.value = meta.artist;
    if (meta.composer && !el.metaComposer.value.trim()) el.metaComposer.value = meta.composer;

    if (!resolved.midiBase64) {
      setBatchProgress(100, "URL analizzato (metadata)");
      setImportStatus(resolved.message || "Metadata trovati, ma nessun MIDI diretto.", "ok");
      return;
    }

    const sourceName = resolved.fileName || "remote.mid";
    const arr = base64ToArrayBuffer(resolved.midiBase64);
    const existingSongs = state.db?.songs || [];
    const seenHashes = new Set();
    const seenTitleArtist = new Set();
    const titleOverride = el.metaTitle.value.trim();
    const { item, inferredLine } = await buildBatchItemFromArrayBuffer({
      sourceName,
      arrBuffer: arr,
      existingSongs,
      seenHashes,
      seenTitleArtist,
      titleOverride,
    });

    state.batchItems = [item];
    state.preview = item;
    state.duplicateCandidates = getExternalDuplicateCandidates(state.batchItems);
    el.jsonOutput.value = JSON.stringify(item.jsonData, null, 2);
    el.filenameInsights.value = inferredLine;
    el.saveBatchBtn.disabled = false;
    el.downloadBtn.disabled = false;
    setBatchProgress(100, "URL convertito");
    setImportStatus(`MIDI caricato da URL: ${sourceName}`, "ok");
  } catch (error) {
    setImportStatus(`Errore URL: ${error.message}`, "error");
    toast(error.message, "error");
  } finally {
    setTimeout(() => showBatchProgress(false), 600);
  }
}
function downloadPreviewJson() {
  if (!state.preview) return;
  const blob = new Blob([JSON.stringify(state.preview.jsonData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.preview.sourceFileName.replace(/\.(mid|midi)$/i, "")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function trackInstrumentNameFromJson(jsonData, song, idx) {
  const fromOriginal = repairMojibake(String(jsonData?.original?.tracks?.[idx]?.instrument?.name || "").trim());
  if (fromOriginal) return fromOriginal;
  const fromSong = instrumentsForSong(song)[idx];
  if (fromSong) return fromSong;
  return `Track ${idx + 1}`;
}

function filterJsonByActiveInstruments(jsonData, song, activeInstruments) {
  const activeSet = new Set((activeInstruments || []).map((x) => String(x || "").trim()).filter(Boolean));
  const clone = JSON.parse(JSON.stringify(jsonData || {}));
  const originalTracks = Array.isArray(clone?.original?.tracks) ? clone.original.tracks : [];
  const supportingTracks = Array.isArray(clone?.supportingTracks) ? clone.supportingTracks : [];
  const trackCount = Math.max(originalTracks.length, supportingTracks.length);
  const keepIdx = [];

  for (let idx = 0; idx < trackCount; idx += 1) {
    const instrument = trackInstrumentNameFromJson(jsonData, song, idx);
    if (activeSet.has(instrument)) keepIdx.push(idx);
  }

  if (keepIdx.length === 0) {
    throw new Error("Nessuno strumento attivo: impossibile esportare.");
  }

  if (supportingTracks.length) {
    clone.supportingTracks = keepIdx.map((idx) => supportingTracks[idx]).filter(Boolean);
  }
  if (originalTracks.length) {
    clone.original.tracks = keepIdx.map((idx) => originalTracks[idx]).filter(Boolean);
  }
  if (Array.isArray(clone.accompanyingInstruments)) {
    clone.accompanyingInstruments = keepIdx.map((idx) => clone.accompanyingInstruments[idx]).filter((v) => v !== undefined);
  }
  if (Array.isArray(clone.accompanyingChannels)) {
    clone.accompanyingChannels = keepIdx.map((idx) => clone.accompanyingChannels[idx]).filter((v) => v !== undefined);
  }
  clone.filteredByInstruments = [...activeSet];
  clone.filteredAt = new Date().toISOString();

  return clone;
}

async function exportFilteredSongJson() {
  const song = getSongById(state.selectedSongId);
  if (!song) {
    toast("Seleziona un brano", "error");
    return;
  }

  const fallback = instrumentsForSong(song);
  const active = (state.player.activeInstrumentsBySong[song.id] || fallback).filter(Boolean);
  if (active.length === 0) {
    toast("Nessuno strumento attivo da esportare", "error");
    return;
  }

  showLoading(true);
  try {
    const res = await fetch(song.jsonPath);
    if (!res.ok) throw new Error("Impossibile leggere il JSON del brano");
    const jsonData = await res.json();
    const filtered = filterJsonByActiveInstruments(jsonData, song, active);
    const base = sanitizeFileName((song.title || song.id || "song").toLowerCase().replace(/\s+/g, "-"));
    const fileName = `${base}-filtered.json`;
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    downloadBlob(blob, fileName);
    toast(`JSON filtrato esportato (${active.length} strumenti attivi)`, "ok");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

async function saveMetadata() {
  const song = getSongById(state.selectedSongId);
  if (!song) return;

  const songPatch = {
    title: el.editTitle.value.trim(),
    artist: el.editArtist.value.trim(),
    composer: el.editComposer.value.trim(),
    genre: el.editGenre.value.trim(),
    difficulty: el.editDifficulty.value,
    key: el.editKey.value.trim(),
    bpm: Number(el.editBpm.value || 0),
    duration: Number(el.editDuration.value || 0),
    instruments: parseTagsInput(el.editInstruments.value),
    studyStatus: el.editStudyStatus.value,
    playbackSpeed: Number(el.editPlaybackSpeed.value || 1),
  };

  const tags = parseTagsInput(el.editTags.value);
  const collectionIds = parseTagsInput(el.editCollections.value);
  const favorite = isFavorite(song.id);

  showLoading(true);
  try {
    await api(`/api/songs/${song.id}`, {
      method: "PUT",
      body: JSON.stringify({ song: songPatch, tags, collectionIds, favorite }),
    });

    await refreshDb();
    render();
    toast("Metadata salvati", "ok");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

async function deleteSongSelected() {
  const song = getSongById(state.selectedSongId);
  if (!song) return;
  if (!confirm(`Eliminare definitivamente il brano "${song.title}"?`)) return;

  showLoading(true);
  try {
    await api(`/api/songs/${song.id}`, { method: "DELETE" });
    state.selectedSongId = "";
    await refreshDb();
    render();
    toast("Brano eliminato", "ok");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

async function toggleFavoriteSelected() {
  const song = getSongById(state.selectedSongId);
  if (!song) return;
  const favorite = !isFavorite(song.id);

  showLoading(true);
  try {
    await api(`/api/songs/${song.id}`, {
      method: "PUT",
      body: JSON.stringify({ favorite }),
    });
    await refreshDb();
    render();
    toast(favorite ? "Aggiunto ai preferiti" : "Rimosso dai preferiti", "ok");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

async function toggleFavoriteBySongId(songId) {
  const song = getSongById(songId);
  if (!song) return;
  const favorite = !isFavorite(song.id);

  showLoading(true);
  try {
    await api(`/api/songs/${song.id}`, {
      method: "PUT",
      body: JSON.stringify({ favorite }),
    });
    await refreshDb();
    render();
    toast(favorite ? "Aggiunto ai preferiti" : "Rimosso dai preferiti", "ok");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

async function addSelectedToPlaylist() {
  const song = getSongById(state.selectedSongId);
  if (!song) return;
  openPlaylistQuickMenuForSong(song.id, el.addToPlaylistBtn);
}

async function addSongToPlaylistById(songId) {
  const song = getSongById(songId);
  if (!song) return;
  openPlaylistQuickMenuForSong(song.id);
}

async function createPlaylist() {
  const name = ((el.toolPlaylistName?.value || "").trim() || (el.metaPlaylist?.value || "").trim()).trim();
  if (!name) {
    await managePlaylist();
    toast("Inserisci un nome playlist nel pannello gestione", "error");
    return;
  }
  showLoading(true);
  try {
    const created = await ensurePlaylist(name);
    if (created?.name) el.metaPlaylist.value = created.name;
    el.toolPlaylistName.value = "";
    await refreshDb();
    refreshLibraryToolsPanel();
    render();
    toast(`Playlist creata: ${created?.name || name.trim()}`, "ok");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

function listManualPlaylists() {
  return (state.db.collections || []).filter((c) => c.type === "playlist" && !c.smartRule);
}

function refreshLibraryToolsPanel() {
  const prevPlaylistId = el.toolPlaylistSelect?.value || "";
  const prevTagId = el.toolTagSelect?.value || "";
  const playlists = listManualPlaylists();
  el.toolPlaylistSelect.innerHTML = playlists.length
    ? playlists.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("")
    : '<option value="">Nessuna playlist</option>';
  if (prevPlaylistId && playlists.some((p) => p.id === prevPlaylistId)) {
    el.toolPlaylistSelect.value = prevPlaylistId;
  }

  const tags = state.db.tags || [];
  el.toolTagSelect.innerHTML = tags.length
    ? tags.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`).join("")
    : '<option value="">Nessun tag</option>';
  if (prevTagId && tags.some((t) => t.id === prevTagId)) {
    el.toolTagSelect.value = prevTagId;
  }
}

async function addSongToPlaylist(songId, playlistId) {
  const song = getSongById(songId);
  if (!song || !playlistId) return;
  const existing = collectionsForSong(song.id)
    .filter((c) => c.type === "playlist" && !c.smartRule)
    .map((c) => c.id);
  const collectionIds = [...new Set([...existing, playlistId])];
  await api(`/api/songs/${song.id}`, {
    method: "PUT",
    body: JSON.stringify({ collectionIds }),
  });
}

async function removeSongFromPlaylist(songId, playlistId) {
  const song = getSongById(songId);
  if (!song || !playlistId) return;
  const collectionIds = collectionsForSong(song.id)
    .filter((c) => c.type === "playlist" && !c.smartRule)
    .map((c) => c.id)
    .filter((id) => id !== playlistId);
  await api(`/api/songs/${song.id}`, {
    method: "PUT",
    body: JSON.stringify({ collectionIds }),
  });
}

function closePlaylistQuickMenu() {
  el.playlistQuickMenu.classList.add("hidden");
  state.quickMenuSongId = "";
}

function openPlaylistQuickMenuForSong(songId, anchorBtn = null) {
  const song = getSongById(songId);
  if (!song) return;
  state.quickMenuSongId = songId;
  const playlists = listManualPlaylists();
  el.playlistQuickList.innerHTML = playlists.length
    ? playlists
        .map((p) => `<button class="quick-menu-item" data-quick-playlist-id="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button>`)
        .join("")
    : '<div class="mini-note">Nessuna playlist: creane una qui sotto.</div>';

  const rect = anchorBtn?.getBoundingClientRect?.();
  if (rect) {
    el.playlistQuickMenu.style.left = `${Math.max(8, rect.left)}px`;
    el.playlistQuickMenu.style.top = `${Math.min(window.innerHeight - 220, rect.bottom + 6)}px`;
  } else {
    el.playlistQuickMenu.style.left = "24px";
    el.playlistQuickMenu.style.top = "120px";
  }
  el.playlistQuickInput.value = "";
  el.playlistQuickMenu.classList.remove("hidden");
}

async function applyQuickPlaylistSelection(playlistId) {
  if (!playlistId || !state.quickMenuSongId) return;
  showLoading(true);
  try {
    await addSongToPlaylist(state.quickMenuSongId, playlistId);
    await refreshDb();
    render();
    toast("Brano aggiunto alla playlist", "ok");
    closePlaylistQuickMenu();
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

async function createAndAssignQuickPlaylist() {
  const name = (el.playlistQuickInput?.value || "").trim();
  if (!name || !state.quickMenuSongId) return;
  showLoading(true);
  try {
    const created = await ensurePlaylist(name);
    if (!created?.id) {
      toast("Creazione playlist fallita", "error");
      return;
    }
    await addSongToPlaylist(state.quickMenuSongId, created.id);
    await refreshDb();
    render();
    toast(`Playlist creata e brano aggiunto: ${created.name}`, "ok");
    closePlaylistQuickMenu();
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

async function renamePlaylist() {
  const current = listManualPlaylists().find((x) => x.id === el.toolPlaylistSelect.value);
  if (!current) {
    toast("Seleziona una playlist", "error");
    return;
  }

  const name = (el.toolPlaylistName?.value || "").trim();
  if (!name || !name.trim()) return;

  showLoading(true);
  try {
    await api(`/api/collections/${current.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: name.trim() }),
    });
    await refreshDb();
    refreshLibraryToolsPanel();
    render();
    toast("Playlist rinominata", "ok");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

async function deletePlaylist() {
  const current = listManualPlaylists().find((x) => x.id === el.toolPlaylistSelect.value);
  if (!current) {
    toast("Seleziona una playlist", "error");
    return;
  }

  showLoading(true);
  try {
    await api(`/api/collections/${current.id}`, { method: "DELETE" });
    await refreshDb();
    refreshLibraryToolsPanel();
    render();
    toast("Playlist eliminata", "ok");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

function resetVisualizer() {
  const canvas = el.visualizerCanvas;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0d1e2a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#89b6d6";
  ctx.font = "12px Space Grotesk";
  ctx.fillText("Seleziona un brano e premi Play", 12, 20);
  if (el.visualizerLegend) el.visualizerLegend.innerHTML = "";
}

function animateMiniVisualizer() {
  const canvas = el.miniVisualizer;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const bars = state.player.miniBars;
  const barWidth = 8;
  const spacing = 4;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < bars.length; i += 1) {
    const target = state.player.isPlaying ? Math.random() * 18 + 3 : 3;
    bars[i] += (target - bars[i]) * 0.2;
    ctx.fillStyle = "#1db954";
    ctx.fillRect(i * (barWidth + spacing), canvas.height - bars[i], barWidth, bars[i]);
  }
  requestAnimationFrame(animateMiniVisualizer);
}

function extractPlayableTracks(jsonData, fallbackInstruments = []) {
  const originalTracks = Array.isArray(jsonData?.original?.tracks) ? jsonData.original.tracks : [];
  if (originalTracks.length > 0) {
    return originalTracks
      .map((track, idx) => {
        const instrument = repairMojibake(
          String(track?.instrument?.name || fallbackInstruments[idx] || `Track ${idx + 1}`).trim(),
        );
        const notes = (track?.notes || []).map((n) => ({
          midi: Number(n.midi || 60),
          time: Number(n.time || 0),
          duration: Math.max(0.05, Number(n.duration || 0.2)),
          velocity: clamp01(Number(n.velocity || 0.7)),
          instrument,
        }));
        return { instrument, notes };
      })
      .filter((t) => t.notes.length > 0);
  }

  const supportingTracks = Array.isArray(jsonData?.supportingTracks) ? jsonData.supportingTracks : [];
  return supportingTracks
    .map((track, idx) => {
      const instrument = repairMojibake(String(fallbackInstruments[idx] || `Track ${idx + 1}`).trim());
      const notes = (track?.notes || []).map((n) => ({
        midi: Number(n.midi || 60),
        time: Number(n.time || 0),
        duration: Math.max(0.05, Number(n.duration || 0.2)),
        velocity: clamp01(Number(n.velocity || 0.7)),
        instrument,
      }));
      return { instrument, notes };
    })
    .filter((t) => t.notes.length > 0);
}

function buildPlayableNotesFromTracks(trackGroups, activeInstruments) {
  const activeSet = new Set(activeInstruments);
  const notes = [];
  for (const group of trackGroups) {
    if (!activeSet.has(group.instrument)) continue;
    for (const n of group.notes) notes.push(n);
  }
  notes.sort((a, b) => a.time - b.time);
  const duration = notes.reduce((mx, n) => Math.max(mx, n.time + n.duration), 0);
  return { notes, duration };
}

function renderVisualizerLegend(songId) {
  if (!el.visualizerLegend) return;
  const song = getSongById(songId);
  if (!song) {
    el.visualizerLegend.innerHTML = "";
    return;
  }
  const instruments = instrumentsForSong(song);
  if (instruments.length === 0) {
    el.visualizerLegend.innerHTML = '<span class="mini-note">Nessuna traccia strumento disponibile</span>';
    return;
  }
  const active = new Set(state.player.activeInstrumentsBySong[song.id] || instruments);
  el.visualizerLegend.innerHTML = instruments
    .map((name) => {
      const on = active.has(name);
      const swatch = colorFromInstrument(name, false);
      return `<span class="viz-legend-item${on ? " active" : ""}">
        <i style="background:${escapeHtml(swatch)}"></i>
        <span>${escapeHtml(name)}</span>
      </span>`;
    })
    .join("");
}

function lowerBoundNoteTime(notes, target) {
  let lo = 0;
  let hi = notes.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((notes[mid]?.time || 0) < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

async function loadSelectedSongForPlayer(forceReload = false) {
  const song = getSongById(state.selectedSongId);
  if (!song) return false;
  if (!forceReload && state.player.loadedSongId === song.id && state.player.notes.length > 0) return true;

  let jsonData;
  if (!forceReload && state.player.loadedSongId === song.id && state.player.loadedSongJsonPath === song.jsonPath) {
    jsonData = state.player.lastJsonData || null;
  }
  if (!jsonData) {
    const res = await fetch(song.jsonPath);
    if (!res.ok) throw new Error("Impossibile caricare JSON del brano");
    jsonData = await res.json();
    state.player.lastJsonData = jsonData;
  }

  const fallbackInstruments = instrumentsForSong(song);
  const trackGroups = extractPlayableTracks(jsonData, fallbackInstruments);
  const availableInstruments = [...new Set(trackGroups.map((g) => g.instrument).filter(Boolean))];
  const stored = state.player.activeInstrumentsBySong[song.id];
  const activeInstruments = Array.isArray(stored)
    ? stored.filter((name) => availableInstruments.includes(name))
    : availableInstruments.slice();
  const { notes, duration } = buildPlayableNotesFromTracks(trackGroups, activeInstruments);

  state.player.notes = notes;
  state.player.duration = duration;
  state.player.minMidi = notes.length ? Math.min(...notes.map((n) => n.midi)) : 21;
  state.player.maxMidi = notes.length ? Math.max(...notes.map((n) => n.midi)) : 108;
  state.player.loadedSongId = song.id;
  state.player.loadedSongJsonPath = song.jsonPath || "";
  state.player.availableInstruments = availableInstruments;
  state.player.activeInstrumentsBySong[song.id] = activeInstruments;
  return notes.length > 0;
}

function drawVisualizerFrame() {
  const canvas = el.visualizerCanvas;
  const ctx = canvas.getContext("2d");
  const { notes, duration, isPlaying } = state.player;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0d1e2a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!notes.length || duration <= 0) {
    ctx.fillStyle = "#89b6d6";
    ctx.fillText("Nessuna nota nel brano", 12, 20);
    return;
  }

  const current = Tone.Transport.seconds;
  const lookBehind = 1.4;
  const lookAhead = 5.5;
  const startIdx = Math.max(0, lowerBoundNoteTime(notes, current - lookBehind) - 24);
  let endIdx = lowerBoundNoteTime(notes, current + lookAhead);
  endIdx = Math.min(notes.length, endIdx + 48);
  const visibleNotes = notes.slice(startIdx, endIdx);

  const minMidi = state.player.minMidi;
  const maxMidi = state.player.maxMidi;
  const pitchRange = Math.max(1, maxMidi - minMidi + 1);
  const padX = 12;
  const laneWidth = (canvas.width - padX * 2) / pitchRange;
  const keyboardHeight = 52;
  const strikeY = canvas.height - keyboardHeight;
  const pxPerSecond = 92;
  const activeColorByMidi = new Map();
  for (const n of visibleNotes) {
    if (n.time <= current && n.time + n.duration >= current && !activeColorByMidi.has(n.midi)) {
      activeColorByMidi.set(n.midi, colorFromInstrument(n.instrument, false));
    }
  }

  for (let midi = minMidi; midi <= maxMidi; midi += 1) {
    const lane = midi - minMidi;
    const x = padX + lane * laneWidth;
    ctx.fillStyle = isBlackKeyMidi(midi) ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)";
    ctx.fillRect(x, 0, laneWidth, strikeY);
  }

  for (const n of visibleNotes) {
    const x = padX + (n.midi - minMidi) * laneWidth + 1;
    const w = Math.max(3, laneWidth - 2);
    const y = strikeY - (n.time - current) * pxPerSecond;
    const h = Math.max(6, n.duration * pxPerSecond);
    if (y > canvas.height || y + h < 0) continue;

    const past = n.time + n.duration < current;
    ctx.fillStyle = colorFromInstrument(n.instrument, past);
    ctx.fillRect(x, y, w, h);
  }

  ctx.strokeStyle = "#ffb347";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, strikeY);
  ctx.lineTo(canvas.width, strikeY);
  ctx.stroke();

  // Mini keyboard: white keys base, black keys overlay, highlight active notes.
  for (let midi = minMidi; midi <= maxMidi; midi += 1) {
    if (isBlackKeyMidi(midi)) continue;
    const lane = midi - minMidi;
    const x = padX + lane * laneWidth;
    const pressed = activeColorByMidi.get(midi);
    ctx.fillStyle = pressed || "#e8edf5";
    ctx.fillRect(x, strikeY, laneWidth, keyboardHeight);
    ctx.strokeStyle = "rgba(20,30,45,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, strikeY, laneWidth, keyboardHeight);
  }
  for (let midi = minMidi; midi <= maxMidi; midi += 1) {
    if (!isBlackKeyMidi(midi)) continue;
    const lane = midi - minMidi;
    const x = padX + lane * laneWidth + laneWidth * 0.12;
    const w = laneWidth * 0.76;
    const h = keyboardHeight * 0.76;
    const pressed = activeColorByMidi.get(midi);
    ctx.fillStyle = pressed || "#0a1018";
    ctx.fillRect(x, strikeY, w, h);
  }

  ctx.fillStyle = "#d4e8f5";
  ctx.fillText(`${secondsToClock(current)} / ${secondsToClock(duration)}`, 12, 16);
  ctx.fillText("Visualizer verticale: note in caduta", 12, strikeY - 6);

  if (isPlaying && current >= duration + 0.05) {
    pausePlayer();
  }
}

function animateVisualizer() {
  const now = performance.now();
  const frameMs = 1000 / Math.max(8, Number(state.player.renderCache.visualizerFps || 30));
  if (!state.player.renderCache.lastRenderMs || now - state.player.renderCache.lastRenderMs >= frameMs) {
    drawVisualizerFrame();
    state.player.renderCache.lastRenderMs = now;
  }
  if (state.player.isPlaying) state.player.raf = requestAnimationFrame(animateVisualizer);
}

function ensureSynth() {
  if (!state.player.synth) {
    state.player.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.06, sustain: 0.3, release: 0.2 },
    }).toDestination();
  }
}

function clearPlayerPart() {
  if (state.player.part) {
    state.player.part.dispose();
    state.player.part = null;
  }
}

async function playPlayer() {
  try {
    const hasSong = await loadSelectedSongForPlayer();
    if (!hasSong) {
      toast("Brano senza note riproducibili", "error");
      return;
    }

    await Tone.start();
    ensureSynth();

    clearPlayerPart();
    Tone.Transport.cancel(0);

    const speed = Number(el.playerSpeedSelect.value || 1);
    Tone.Transport.playbackRate = speed;

    state.player.part = new Tone.Part((time, n) => {
      state.player.synth.triggerAttackRelease(Tone.Frequency(n.midi, "midi"), n.duration / speed, time, n.velocity);
    }, state.player.notes.map((n) => [n.time / speed, n]));

    state.player.part.start(0);
    Tone.Transport.seconds = 0;
    Tone.Transport.start("+0.02");
    state.player.isPlaying = true;
    if (el.playBtn) el.playBtn.textContent = "⏸";
    if (el.playBtn) el.playBtn.classList.add("primary");
    cancelAnimationFrame(state.player.raf);
    animateVisualizer();
  } catch (error) {
    toast(error.message, "error");
  }
}

function pausePlayer() {
  Tone.Transport.pause();
  state.player.isPlaying = false;
  if (el.playBtn) el.playBtn.textContent = "▶";
  if (el.playBtn) el.playBtn.classList.remove("primary");
  cancelAnimationFrame(state.player.raf);
  drawVisualizerFrame();
}

async function savePlaybackState() {
  const song = getSongById(state.selectedSongId);
  if (!song) return;

  const patch = {
    song: {
      playbackSpeed: Number(el.playerSpeedSelect.value || 1),
      lastPracticePointSec: round(Tone.Transport.seconds, 2),
    },
  };

  try {
    await api(`/api/songs/${song.id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    await refreshDb();
    render();
  } catch {
    // non bloccare UX se fallisce la persistenza stato player
  }
}

function resetFilters() {
  el.searchInput.value = "";
  el.bpmFilter.value = "";
  el.keyFilter.value = "";
  el.difficultyFilter.value = "";
  el.durationFilter.value = "";
  state.studyFilter = "";
  state.page = 1;
  for (const chip of el.studyChips) chip.classList.remove("active");
  render();
}

function updateSort(sortKey) {
  if (state.sort.key === sortKey) {
    state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
  } else {
    state.sort.key = sortKey;
    state.sort.dir = sortKey === "importedAt" ? "desc" : "asc";
  }
  state.page = 1;
  render();
}

function scrollMainBy(delta) {
  if (!el.mainContentScroll) return;
  el.mainContentScroll.scrollBy({ top: delta, behavior: "smooth" });
}

function onTableClick(event) {
  const actionBtn = event.target.closest("[data-row-action]");
  if (actionBtn) {
    const songId = actionBtn.dataset.songId;
    const action = actionBtn.dataset.rowAction;
    if (action === "select") {
      if (actionBtn.checked) state.selectedSongIds.add(songId);
      else state.selectedSongIds.delete(songId);
      const rows = currentPageRows();
      if (el.selectAllPageCheckbox) {
        el.selectAllPageCheckbox.checked = rows.length > 0 && rows.every((s) => state.selectedSongIds.has(s.id));
      }
      return;
    }
    if (action === "favorite") {
      toggleFavoriteBySongId(songId);
      return;
    }
    if (action === "playlist") {
      openPlaylistQuickMenuForSong(songId, actionBtn);
      return;
    }
    if (action === "remove-playlist") {
      if (!state.selectedPlaylistId) return;
      showLoading(true);
      removeSongFromPlaylist(songId, state.selectedPlaylistId)
        .then(async () => {
          await refreshDb();
          render();
          toast("Brano rimosso dalla playlist", "ok");
        })
        .catch((error) => {
          toast(error.message, "error");
        })
        .finally(() => {
          showLoading(false);
        });
      return;
    }
  }

  const tr = event.target.closest("tr[data-song-id]");
  if (!tr) return;
  state.selectedSongId = tr.dataset.songId;
  state.player.loadedSongId = "";
  pausePlayer();
  render();
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function setLastImportReport(report) {
  state.lastImportReport = report || null;
  if (!el.downloadImportReportBtn) return;
  el.downloadImportReportBtn.disabled = !state.lastImportReport;
}

function downloadLastImportReport() {
  if (!state.lastImportReport) {
    toast("Nessun report disponibile", "error");
    return;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `pianovisual-import-report-${stamp}.json`;
  const blob = new Blob([`${JSON.stringify(state.lastImportReport, null, 2)}\n`], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, fileName);
  toast("Report import scaricato", "ok");
}

function updateSelectionInfo() {
  const n = state.selectedSongIds.size;
  const base = el.playlistCount.textContent || "";
  const cleanBase = base.replace(/\s+\|\s+Selezionati:\s+\d+$/, "");
  el.playlistCount.textContent = `${cleanBase} | Selezionati: ${n}`;
  if (el.deleteSelectedBtn) {
    el.deleteSelectedBtn.disabled = n === 0;
    el.deleteSelectedBtn.textContent = n > 0 ? `Elimina selezionati (${n})` : "Elimina selezionati";
  }
}

function selectVisibleSongs() {
  const rows = currentPageRows();
  for (const s of rows) state.selectedSongIds.add(s.id);
  render();
}

function clearSelectedSongs() {
  state.selectedSongIds.clear();
  render();
}

async function downloadSelectedSongsJson() {
  if (state.selectedSongIds.size === 0) {
    toast("Nessun brano selezionato", "error");
    return;
  }
  const selectedSongs = (state.db?.songs || []).filter((s) => state.selectedSongIds.has(s.id));
  if (selectedSongs.length === 0) {
    toast("Selezione non valida", "error");
    return;
  }

  showLoading(true);
  try {
    const zip = new JSZip();
    const folder = zip.folder("json");
    let ok = 0;
    for (const song of selectedSongs) {
      const res = await fetch(song.jsonPath);
      if (!res.ok) continue;
      const content = await res.text();
      const nameFromPath = (song.jsonPath.split("/").pop() || "").trim();
      const fileName = nameFromPath || `${sanitizeFileName(song.title || song.id)}.json`;
      folder.file(fileName, content);
      ok += 1;
    }
    if (ok === 0) {
      toast("Nessun JSON scaricabile tra i selezionati", "error");
      return;
    }
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `pianovisual-selected-${Date.now()}.zip`);
    toast(`Scaricati ${ok} brani selezionati`, "ok");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

async function deleteSelectedSongs() {
  const selectedSongs = (state.db?.songs || []).filter((song) => state.selectedSongIds.has(song.id));
  if (selectedSongs.length === 0) {
    toast("Nessun brano selezionato", "error");
    return;
  }
  const count = selectedSongs.length;
  const label = count === 1 ? "il brano selezionato" : `i ${count} brani selezionati`;
  if (!confirm(`Eliminare definitivamente ${label}? Questa operazione rimuove anche i relativi file JSON.`)) return;

  showLoading(true);
  const failedIds = new Set();
  try {
    for (const song of selectedSongs) {
      try {
        await api(`/api/songs/${song.id}`, { method: "DELETE" });
      } catch {
        failedIds.add(song.id);
      }
    }

    state.selectedSongIds = failedIds;
    if (selectedSongs.some((song) => song.id === state.selectedSongId && !failedIds.has(song.id))) {
      state.selectedSongId = "";
      pausePlayer();
    }
    await refreshDb();
    render();

    const deletedCount = count - failedIds.size;
    if (failedIds.size === 0) {
      toast(`${deletedCount} ${deletedCount === 1 ? "brano eliminato" : "brani eliminati"}`, "ok");
    } else {
      toast(`${deletedCount} eliminati, ${failedIds.size} non eliminati e ancora selezionati`, "error");
    }
  } finally {
    showLoading(false);
  }
}

async function exportBackup() {
  try {
    showLoading(true);
    const payload = await api("/api/library/json-files");
    const files = Array.isArray(payload.files) ? payload.files : [];
    if (files.length === 0) {
      toast("Nessun JSON da esportare", "error");
      return;
    }
    const zip = new JSZip();
    const folder = zip.folder("json");
    for (const file of files) {
      folder.file(file.fileName, file.content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `pianovisual-json-${Date.now()}.zip`);
    toast(`Export completato (${files.length} file)`, "ok");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

async function openLibraryFolder() {
  try {
    if (window.pianovisualDesktop?.openLibraryFolder) {
      const result = await window.pianovisualDesktop.openLibraryFolder();
      if (!result?.ok) {
        throw new Error(result?.error || "Impossibile aprire la cartella libreria");
      }
      toast("Cartella libreria aperta", "ok");
      return;
    }

    const pathInfo = await api("/api/library/path");
    const lib = pathInfo?.libraryDir || "(non disponibile)";
    toast(`Percorso libreria: ${lib}`, "ok");
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(String(lib));
      toast("Percorso copiato negli appunti", "ok");
    }
  } catch (error) {
    toast(`Apri cartella libreria fallito: ${error.message}`, "error");
  }
}

async function syncLibraryFromDisk() {
  showLoading(true);
  try {
    const result = await api("/api/library/sync-from-json", {
      method: "POST",
      body: JSON.stringify({ mode: "add_only" }),
    });
    await refreshDb();
    render();

    const added = Number(result.addedCount || 0);
    const updated = Number(result.updatedCount || 0);
    const skipped = Number(result.skippedCount || 0);
    const errors = Number(result.errorCount || 0);
    const missing = Array.isArray(result.missingOnDisk) ? result.missingOnDisk.length : 0;

    setLastImportReport({
      kind: "library-sync",
      createdAt: new Date().toISOString(),
      summary: {
        total: Number(result.totalFiles || 0),
        added,
        updated,
        skipped,
        errored: errors,
        missingOnDisk: missing,
      },
      report: Array.isArray(result.report) ? result.report : [],
    });

    const msg = `Riallineamento: ${added} aggiunti, ${updated} aggiornati, ${skipped} già presenti, ${errors} errori.`;
    toast(msg, errors > 0 ? "error" : "ok");
    if (missing > 0) {
      toast(`Attenzione: ${missing} voci db senza file su disco`, "error");
    }
  } catch (error) {
    toast(`Riallineamento fallito: ${error.message}`, "error");
  } finally {
    showLoading(false);
  }
}

async function importArchiveFiles(fileList) {
  const files = [...(fileList || [])];
  if (files.length === 0) return;

  showLoading(true);
  try {
    const items = [];
    const readErrors = [];
    for (const file of files) {
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".zip")) {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const entries = Object.values(zip.files);
        for (const entry of entries) {
          if (entry.dir || !entry.name.toLowerCase().endsWith(".json")) continue;
          const content = await entry.async("string");
          const flatName = entry.name.split("/").pop();
          try {
            items.push({ fileName: flatName, jsonData: JSON.parse(content) });
          } catch (error) {
            readErrors.push({ sourceFileName: flatName, status: "error", reason: `JSON parse error: ${error.message}` });
          }
        }
      } else if (lower.endsWith(".json")) {
        const content = await file.text();
        try {
          items.push({ fileName: file.name, jsonData: JSON.parse(content) });
        } catch (error) {
          readErrors.push({ sourceFileName: file.name, status: "error", reason: `JSON parse error: ${error.message}` });
        }
      }
    }

    if (items.length === 0) {
      toast("Archivio non valido: nessun file JSON trovato", "error");
      return;
    }

    const dedupMode = el.archiveDedupPolicySelect?.value || "keep_first";
    const { kept, dropped } = dedupeJsonArchiveItems(items, dedupMode);
    const toImport = kept;
    if (toImport.length === 0) {
      toast("Nessun JSON importabile dopo dedup interno", "error");
      return;
    }

    const result = await api("/api/library/import-json-archive", {
      method: "POST",
      body: JSON.stringify({
        items: toImport,
        conflictPolicy: el.archiveConflictPolicySelect?.value || "skip",
        dedupPolicy: dedupMode,
      }),
    });
    await refreshDb();
    render();
    const reportRows = Array.isArray(result.report) ? result.report : [];
    const skipped = reportRows.filter((r) => r.status === "skipped").length + dropped.length;
    const overwritten = Number(result.overwrittenCount || 0);
    const errored = reportRows.filter((r) => r.status === "error").length + readErrors.length;
    setLastImportReport({
      kind: "json-archive",
      createdAt: new Date().toISOString(),
      summary: {
        total: items.length,
        imported: Number(result.importedCount || 0),
        overwritten,
        skipped,
        errored,
      },
      report: [
        ...reportRows,
        ...dropped.map((d) => ({
          sourceFileName: d.item?.fileName || "-",
          status: "skipped",
          reason: d.reason,
        })),
        ...readErrors,
      ],
    });
    const msg = `Import archivio: ${result.importedCount} importati, ${overwritten} sovrascritti, ${skipped} saltati, ${errored} errori.`;
    toast(msg, errored > 0 ? "error" : "ok");
  } catch (error) {
    toast(`Import archivio fallito: ${error.message}`, "error");
  }
  finally {
    showLoading(false);
    el.archiveFileInput.value = "";
    if (el.importJsonFileInput) el.importJsonFileInput.value = "";
  }
}

async function managePlaylist() {
  el.libraryToolsPanel.classList.remove("hidden");
  refreshLibraryToolsPanel();
}

async function createTag() {
  const name = (el.toolTagName?.value || "").trim().toLowerCase();
  if (!name || !name.trim()) return;
  showLoading(true);
  try {
    await api("/api/tags", {
      method: "POST",
      body: JSON.stringify({ name: name.trim().toLowerCase() }),
    });
    el.toolTagName.value = "";
    await refreshDb();
    refreshLibraryToolsPanel();
    render();
    toast("Tag creato", "ok");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

async function renameTag() {
  const tags = state.db.tags || [];
  const found = tags.find((t) => t.id === el.toolTagSelect.value);
  if (!found) {
    toast("Seleziona un tag", "error");
    return;
  }
  const name = (el.toolTagName?.value || "").trim().toLowerCase();
  if (!name || !name.trim()) return;
  showLoading(true);
  try {
    await api(`/api/tags/${found.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: name.trim().toLowerCase() }),
    });
    await refreshDb();
    refreshLibraryToolsPanel();
    render();
    toast("Tag rinominato", "ok");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

async function deleteTag() {
  const tags = state.db.tags || [];
  const found = tags.find((t) => t.id === el.toolTagSelect.value);
  if (!found) {
    toast("Seleziona un tag", "error");
    return;
  }
  showLoading(true);
  try {
    await api(`/api/tags/${found.id}`, { method: "DELETE" });
    await refreshDb();
    refreshLibraryToolsPanel();
    render();
    toast("Tag eliminato", "ok");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    showLoading(false);
  }
}

function bindEvents() {
  if (el.scrollUpBtn) el.scrollUpBtn.addEventListener("click", () => scrollMainBy(-420));
  if (el.scrollDownBtn) el.scrollDownBtn.addEventListener("click", () => scrollMainBy(420));

  el.navItems.forEach((item) => item.addEventListener("click", () => selectNav(item.dataset.view)));

  el.studyChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = chip.dataset.studyFilter;
      if (state.studyFilter === filter) {
        state.studyFilter = "";
        chip.classList.remove("active");
      } else {
        state.studyFilter = filter;
        for (const c of el.studyChips) c.classList.remove("active");
        chip.classList.add("active");
      }
      state.view = "home";
      for (const item of el.navItems) item.classList.toggle("active", item.dataset.view === "home");
      state.page = 1;
      render();
    });
  });

  el.searchInput.addEventListener("input", () => {
    state.page = 1;
    render();
  });
  el.bpmFilter.addEventListener("change", () => {
    state.page = 1;
    render();
  });
  el.keyFilter.addEventListener("change", () => {
    state.page = 1;
    render();
  });
  el.difficultyFilter.addEventListener("change", () => {
    state.page = 1;
    render();
  });
  el.durationFilter.addEventListener("change", () => {
    state.page = 1;
    render();
  });

  el.clearFiltersBtn.addEventListener("click", resetFilters);
  el.updateStatusBtn.addEventListener("click", async () => {
    if (!state.updater.isDesktop || !window.pianovisualDesktop?.checkUpdates) {
      toast("Verifica aggiornamenti disponibile nella versione desktop installata", "error");
      return;
    }
    try {
      setUpdaterStatus("checking");
      await window.pianovisualDesktop.checkUpdates();
    } catch (error) {
      setUpdaterStatus("error", error.message || "check update fallito");
      toast(`Errore verifica aggiornamenti: ${error.message}`, "error");
    }
  });

  el.detailInstrumentsBadges.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-instrument-toggle]");
    if (!btn) return;
    const song = getSongById(state.selectedSongId);
    if (!song) return;
    const instrument = String(btn.dataset.instrumentToggle || "").trim();
    if (!instrument) return;
    const all = instrumentsForSong(song);
    const active = new Set(state.player.activeInstrumentsBySong[song.id] || all);
    if (active.has(instrument)) active.delete(instrument);
    else active.add(instrument);
    state.player.activeInstrumentsBySong[song.id] = all.filter((name) => active.has(name));
    pausePlayer();
    state.player.loadedSongId = "";
    state.player.notes = [];
    state.player.duration = 0;
    render();
    const on = active.has(instrument);
    toast(`${instrument}: ${on ? "attivato" : "disattivato"}`, "ok");
  });
  el.pageSizeSelect.addEventListener("change", () => {
    state.pageSize = Number(el.pageSizeSelect.value || 10);
    state.page = 1;
    render();
  });
  el.prevPageBtn.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    render();
  });
  el.nextPageBtn.addEventListener("click", () => {
    state.page += 1;
    render();
  });

  el.sortableTh.forEach((th) => th.addEventListener("click", () => updateSort(th.dataset.sortKey)));

  el.songsTableBody.addEventListener("click", onTableClick);
  el.playlistsCards.addEventListener("click", onDirectoryPanelClick);
  el.selectVisibleBtn.addEventListener("click", selectVisibleSongs);
  el.clearSelectionBtn.addEventListener("click", clearSelectedSongs);
  el.downloadSelectedBtn.addEventListener("click", downloadSelectedSongsJson);
  el.deleteSelectedBtn.addEventListener("click", deleteSelectedSongs);
  el.selectAllPageCheckbox.addEventListener("change", () => {
    const rows = currentPageRows();
    if (el.selectAllPageCheckbox.checked) {
      for (const s of rows) state.selectedSongIds.add(s.id);
    } else {
      for (const s of rows) state.selectedSongIds.delete(s.id);
    }
    render();
  });

  el.midiFileInput.addEventListener("change", () => {
    const files = [...(el.midiFileInput.files || [])];
    if (files.length === 0) {
      el.filenameInsights.value = "";
      setRecognitionFields(null);
      return;
    }

    setRecognitionFields(null);

    const insights = files
      .slice(0, 20)
      .map((f) => {
        const base = f.name.replace(/\.(mid|midi)$/i, "");
        return `${f.name} -> titolo: ${base} | artista: (manuale) | compositore: (manuale)`;
      })
      .join("\n");
    el.filenameInsights.value = insights;
  });

  el.applyRecognitionBtn.addEventListener("click", () => {
    const override = getRecognitionOverride();
    if (override.title) el.metaTitle.value = override.title;
    if (override.artist) el.metaArtist.value = override.artist;
    if (override.composer) el.metaComposer.value = override.composer;

    const extraTags = [
      override.musical.opus ? `op_${override.musical.opus}` : "",
      override.musical.number ? `no_${override.musical.number}` : "",
      override.musical.movement ? `mov_${override.musical.movement}` : "",
      override.musical.catalog ? override.musical.catalog.toLowerCase().replace(/\s+/g, "_") : "",
      override.musical.key ? override.musical.key.toLowerCase().replace(/\s+/g, "_") : "",
    ].filter(Boolean);

    const mergedTags = [...new Set([...parseTagsInput(el.metaTags.value), ...extraTags])];
    el.metaTags.value = mergedTags.join(", ");
    toast("Riconoscimento applicato ai campi import", "ok");
  });

  el.batchDedupSelect.addEventListener("change", () => {
    if ((el.midiFileInput.files || []).length > 0) prepareBatchPreview();
  });

  el.convertBtn.addEventListener("click", prepareBatchPreview);
  el.resolveRemoteBtn.addEventListener("click", resolveRemoteUrl);
  el.remoteUrlInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      resolveRemoteUrl();
    }
  });
  el.saveBatchBtn.addEventListener("click", saveBatchToLibrary);
  el.importJsonBtn.addEventListener("click", () => el.importJsonFileInput.click());
  el.importJsonFileInput.addEventListener("change", () => importArchiveFiles(el.importJsonFileInput.files));
  el.cancelImportBtn.addEventListener("click", () => {
    state.importCancelled = true;
    setImportStatus("Annullamento import richiesto...", "error");
  });
  el.downloadBtn.addEventListener("click", downloadPreviewJson);
  el.downloadImportReportBtn.addEventListener("click", downloadLastImportReport);

  el.newPlaylistBtn.addEventListener("click", createPlaylist);
  el.managePlaylistBtn.addEventListener("click", managePlaylist);
  el.backupBtn.addEventListener("click", exportBackup);
  el.openLibraryFolderBtn.addEventListener("click", openLibraryFolder);
  el.syncLibraryBtn.addEventListener("click", syncLibraryFromDisk);
  el.importArchiveBtn.addEventListener("click", () => el.archiveFileInput.click());
  el.archiveFileInput.addEventListener("change", () => importArchiveFiles(el.archiveFileInput.files));
  el.themeLightBtn.addEventListener("click", () => applyTheme("light"));
  el.themeDarkBtn.addEventListener("click", () => applyTheme("dark"));

  el.saveMetadataBtn.addEventListener("click", saveMetadata);
  el.deleteSongBtn.addEventListener("click", deleteSongSelected);
  el.toggleFavoriteBtn.addEventListener("click", toggleFavoriteSelected);
  el.exportFilteredJsonBtn.addEventListener("click", exportFilteredSongJson);
  el.addToPlaylistBtn.addEventListener("click", addSelectedToPlaylist);

  el.renamePlaylistBtn.addEventListener("click", managePlaylist);
  el.deletePlaylistBtn.addEventListener("click", managePlaylist);
  el.createTagBtn.addEventListener("click", managePlaylist);
  el.renameTagBtn.addEventListener("click", managePlaylist);
  el.deleteTagBtn.addEventListener("click", managePlaylist);

  el.toolPlaylistCreateBtn.addEventListener("click", createPlaylist);
  el.toolPlaylistRenameBtn.addEventListener("click", renamePlaylist);
  el.toolPlaylistDeleteBtn.addEventListener("click", deletePlaylist);
  el.toolTagCreateBtn.addEventListener("click", createTag);
  el.toolTagRenameBtn.addEventListener("click", renameTag);
  el.toolTagDeleteBtn.addEventListener("click", deleteTag);

  el.toolPlaylistSelect.addEventListener("change", () => {
    const selected = listManualPlaylists().find((x) => x.id === el.toolPlaylistSelect.value);
    if (selected) el.toolPlaylistName.value = selected.name;
  });
  el.toolTagSelect.addEventListener("change", () => {
    const selected = (state.db.tags || []).find((x) => x.id === el.toolTagSelect.value);
    if (selected) el.toolTagName.value = selected.name;
  });

  el.playlistQuickList.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-quick-playlist-id]");
    if (!btn) return;
    applyQuickPlaylistSelection(btn.dataset.quickPlaylistId);
  });
  el.playlistQuickCreateBtn.addEventListener("click", createAndAssignQuickPlaylist);
  el.playlistQuickInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      createAndAssignQuickPlaylist();
    }
  });
  document.addEventListener("click", (event) => {
    if (el.playlistQuickMenu.classList.contains("hidden")) return;
    if (
      event.target.closest("#playlistQuickMenu") ||
      event.target.closest('[data-row-action="playlist"]') ||
      event.target === el.addToPlaylistBtn
    ) {
      return;
    }
    closePlaylistQuickMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePlaylistQuickMenu();
  });

  el.playBtn.addEventListener("click", playPlayer);
  el.pauseBtn.addEventListener("click", async () => {
    pausePlayer();
    await savePlaybackState();
  });

  el.playerSpeedSelect.addEventListener("change", async () => {
    Tone.Transport.playbackRate = Number(el.playerSpeedSelect.value || 1);
    await savePlaybackState();
  });

  window.addEventListener("beforeunload", () => {
    pausePlayer();
    clearPlayerPart();
  });
}

async function bootstrap() {
  try {
    applyTheme(localStorage.getItem("pv_theme") || "dark", false);
  } catch {
    applyTheme("dark", false);
  }
  resetVisualizer();
  setLastImportReport(null);
  await loadAppVersionAndUpdater();
  animateMiniVisualizer();
  bindEvents();
  await refreshDb();
  render();
}

bootstrap().catch((error) => {
  toast(`Bootstrap error: ${error.message}`, "error");
});
