import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

function runPython(source, t) {
  const candidates = process.platform === 'win32' ? [['python'], ['py', '-3'], ['python3']] : [['python3'], ['python']];
  for (const [command, ...prefix] of candidates) {
    const probe = spawnSync(command, [...prefix, '--version'], { encoding: 'utf8' });
    if (probe.error || probe.status !== 0) continue;
    const result = spawnSync(command, [...prefix, '-c', source], { cwd: process.cwd(), encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    return;
  }
  t.skip('Python non disponibile');
}

test('adjacent chords do not falsely exceed left hand polyphony; real overlaps are rejected', (t) => {
  runPython(`
import sys
sys.path.insert(0,'skill/music-to-piano-json/scripts')
import core
def chord(time,duration):
 return {'time':time,'duration':duration,'confidence':.9,'pitchClasses':[0,4,7],'root':0,'bassPitchClass':0,'quality':'major'}
def validate(chords):
 h,b=core._easy_left_hand(chords)
 return core.validate({'format':'piano_reduction_v2','arrangementMode':'piano_voice','tracks':[{'role':'melody','notes':[]},{'role':'harmony','notes':h},{'role':'bass','notes':b}],'chords':chords,'sections':[]})
assert validate([chord(.1,.2),chord(.3,.2)])
try: validate([chord(.1,.21),chord(.3,.2)])
except ValueError as e: assert 'left hand exceeds four simultaneous notes' in str(e)
else: raise AssertionError('real overlap was accepted')
`, t);
});

test('fallback bass keeps the lowest attack and clips overlaps without mutating the source', (t) => {
  runPython(`
import sys
sys.path.insert(0,'skill/music-to-piano-json/scripts')
import core
notes=[{'time':0,'duration':2,'midi':48},{'time':0,'duration':2,'midi':40},{'time':1,'duration':1,'midi':43}]
out=core._monophonic_bass(notes)
assert [(n['midi'],n['time'],n['duration']) for n in out]==[(40,0,1),(43,1,1)]
assert notes[1]['duration']==2
`, t);
});

test('low-register lines are not preferred as melody merely because they are monophonic', (t) => {
  runPython(`
import sys
sys.path.insert(0,'skill/music-to-piano-json/scripts')
import core
def line(name,pitch):
 return {'name':name,'notes':[{'time':i*.4,'duration':.3,'midi':pitch+(i%3)} for i in range(100)]}
tracks=[line('Cello',36),line('Guitar',65)]
assert core.classify(tracks)[0]==1
`, t);
});
