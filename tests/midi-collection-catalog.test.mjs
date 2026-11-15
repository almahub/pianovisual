import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMidiCollectionResults, parseMidiCollectionArtists, parseMidiCollectionArtistSongs } from '../midi-collection-catalog.js';

test('MIDI Collection indexes artists and parses their own songs', () => {
  const artists = parseMidiCollectionArtists('<div class="artist-grid"><a href="/artist/chopin">Chopin <span class="count">(3)</span></a><a href="https://evil.example/artist/bad">Bad <span class="count">(4)</span></a></div>');
  assert.deepEqual(artists, [{ path: '/artist/chopin', name: 'Chopin', count: 3 }]);
  const songs = parseMidiCollectionArtistSongs('<ul class="songs"><li><button data-midi-id="12" data-url="/midi/song.mid" data-title="Prelude"></button><a href="/song/12/prelude">Song</a></li></ul>', 'Chopin');
  assert.equal(songs[0].title, 'Prelude');
  assert.equal(songs[0].artist, 'Chopin');
});

test('MIDI Collection parses pagination and source metadata without inventing an artist', () => {
  const html = `<p> Result: 93</p><div class="results-wrap" data-page="1" data-total-pages="4"><table>
    <tr data-midi-id="12" data-title="Chopin &amp; piano" data-artist=""><td><button data-midi-id="12" data-url="/midi/MIDI/example.mid"></button></td><td><a href="/song/12/example">Name</a></td></tr>
    <tr data-midi-id="13" data-title="Unknown" data-artist="Artist"><td><button data-midi-id="13" data-url="https://evil.example/midi/bad.mid"></button></td><td><a href="/song/13/name">Name</a></td></tr>
    </table></div>`;
  const result = parseMidiCollectionResults(html);
  assert.equal(result.total, 93);
  assert.equal(result.hasMore, true);
  assert.equal(result.songs.length, 1);
  assert.equal(result.songs[0].title, 'Chopin & piano');
  assert.equal(result.songs[0].artist, '');
  assert.equal(result.songs[0].sourcePageUrl, 'https://midicollection.com/song/12/example');
});

test('MIDI Collection rejects unexpected pages', () => {
  assert.throws(() => parseMidiCollectionResults('<p>access denied</p>'), /non riconosciuti/);
});
