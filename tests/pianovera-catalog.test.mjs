import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePianoveraCatalog } from '../pianovera-catalog.js';

test('PianoVera catalog preserves titles, composers and only accepts local MIDI links', () => {
  const html = `<article class="card midi-card"><h3><a href="/en/midi/ballade-1-chopin/">Ballade &amp; No. 1</a></h3>
    <p class="mc-comp">Frédéric Chopin</p><a href="/assets/partitions/ballade/test.mid" download>MIDI</a></article>
    <article class="midi-card"><h3><a href="/en/midi/bad/">Bad</a></h3><p class="mc-comp">Unknown</p>
    <a href="https://evil.example/test.mid">MIDI</a></article>
    <article class="midi-card"><h3><a href="https://evil.example/en/midi/bad/">Bad</a></h3><p class="mc-comp">Unknown</p>
    <a href="/midi/files/test.mid">MIDI</a></article>`;
  const songs = parsePianoveraCatalog(html);
  assert.equal(songs.length, 1);
  assert.equal(songs[0].title, 'Ballade & No. 1');
  assert.equal(songs[0].composer, 'Frédéric Chopin');
  assert.equal(songs[0].path, '/assets/partitions/ballade/test.mid');
  assert.equal(songs[0].sourcePageUrl, 'https://pianovera.com/en/midi/ballade-1-chopin/');
});
