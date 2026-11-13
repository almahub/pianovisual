import test from "node:test";
import assert from "node:assert/strict";
import { inferArtist, titleWithoutArtist } from "../artist-inference.js";

test("rimuove solo prefissi riconducibili all'artista noto", () => {
  assert.equal(titleWithoutArtist("Capossela - Zampano", "Vinicio Capossela"), "Zampano");
  assert.equal(titleWithoutArtist("Vinicio Capossela - Zampano", "Vinicio Capossela"), "Zampano");
  assert.equal(titleWithoutArtist("Another Artist - Song", "Vinicio Capossela"), "Another Artist - Song");
  assert.equal(titleWithoutArtist("Capossela - Zampano", ""), "Capossela - Zampano");
});

test("riconosce artista esplicito nel nome e nelle varianti", () => {
  assert.equal(inferArtist({ title: "Capossela - Pena Del Alma" }), "Vinicio Capossela");
  assert.equal(inferArtist({ fileName: "caruso-lucio-dalla.json" }), "Lucio Dalla");
  assert.equal(inferArtist({ fileName: "De Andrè - Disamistade-piano.json" }), "Fabrizio De André");
  assert.equal(inferArtist({ fileName: "clair-de-lune-claude-debussy.json" }), "Claude Debussy");
});

test("riconosce titoli univoci senza inventare quelli ambigui", () => {
  assert.equal(inferArtist({ title: "Agnese" }), "Ivan Graziani");
  assert.equal(inferArtist({ fileName: "gocce-di-memoria-easy-version.json" }), "Giorgia");
  assert.equal(inferArtist({ fileName: "almeno-tu-nelluniverso-easy.json" }), "Mia Martini");
  assert.equal(inferArtist({ title: "Bella ciao" }), "");
  assert.equal(inferArtist({ title: "Mad World" }), "");
});
