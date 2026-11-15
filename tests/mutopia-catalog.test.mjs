import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMutopiaResults, parseMutopiaComposers } from '../mutopia-catalog.js';

test('Mutopia indexes composers by their real source identifiers', () => {
  const artists = parseMutopiaComposers('<select name="Composer"><option value="">All</option><option value="ChopinFF">F. F. Chopin</option><option value="../evil">Invalid</option></select>');
  assert.deepEqual(artists, [{ path: 'ChopinFF', name: 'F. F. Chopin' }]);
});

test('Mutopia parses MIDI, composer, opus and next page while ignoring unsafe links', () => {
  const html = `<table class="table-bordered result-table"><tr><td>Ballade</td><td>by F. F. Chopin (1810–1849)</td><td>Op.23</td></tr>
    <tr><td><a href="piece-info.cgi?id=1959">More Information</a></td></tr>
    <tr><td><a href="https://www.mutopiaproject.org/ftp/Chopin/op23.mid">MIDI</a></td></tr></table>
    <table class="result-table"><tr><td>Unsafe</td><td>by Someone</td><td>Op 1</td></tr>
    <tr><td><a href="piece-info.cgi?id=1">Info</a><a href="https://evil.example/ftp/bad.mid">MIDI</a></td></tr></table>
    <a href="?startat=10">Next 10</a>`;
  const result = parseMutopiaResults(html);
  assert.equal(result.hasMore, true);
  assert.equal(result.songs.length, 1);
  assert.equal(result.songs[0].title, 'Ballade (Op.23)');
  assert.equal(result.songs[0].composer, 'F. F. Chopin');
  assert.equal(result.songs[0].path, '/ftp/Chopin/op23.mid');
  assert.equal(result.songs[0].sourcePageUrl, 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1959');
});

test('Mutopia does not repeat opus already present in a title', () => {
  const html = `<table class="result-table"><tr><td>Mazurka Op.6, No.1</td><td>by Chopin</td><td>Op. 6, No. 1</td></tr>
    <tr><td><a href="piece-info.cgi?id=1">Info</a><a href="/ftp/x/test.mid">MIDI</a></td></tr></table>`;
  assert.equal(parseMutopiaResults(html).songs[0].title, 'Mazurka Op.6, No.1');
  assert.equal(parseMutopiaResults(html).hasMore, false);
});
