"""Preserve and validate the piano-program JSON container used by tracksV2 files."""
from __future__ import annotations
import json
from bisect import bisect_right
from pathlib import Path

REQUIRED = (
    'supportingTracks', 'start_time', 'song_length', 'resolution', 'tempos',
    'keySignatures', 'timeSignatures', 'measures', 'tracksV2', 'original',
    'accompanyingInstruments', 'accompanyingChannels', 'accompanyingTracks',
    'name', 'artist'
)

def load_compatible(path):
    text=Path(path).read_text(encoding='utf-8-sig')
    repaired=False
    try:
        data=json.loads(text)
    except json.JSONDecodeError:
        # Observed export defect: one stray ASCII "1" immediately before the
        # root object. Repair only this exact, unambiguous case.
        if text.startswith('1{'):
            data=json.loads(text[1:]); repaired=True
        else:
            raise
    validate_compatible(data)
    return data,repaired

def looks_compatible(path):
    try:
        load_compatible(path); return True
    except (OSError,UnicodeError,json.JSONDecodeError,ValueError,TypeError):
        return False

def validate_compatible(data):
    if not isinstance(data,dict): raise ValueError('Program-compatible JSON root must be an object')
    missing=[k for k in REQUIRED if k not in data]
    if missing: raise ValueError('Missing program-compatible fields: '+', '.join(missing))
    if not isinstance(data['measures'],list) or not data['measures']:
        raise ValueError('measures must be a non-empty array')
    tv2=data['tracksV2']
    if not isinstance(tv2,dict) or not isinstance(tv2.get('right'),list) or not isinstance(tv2.get('left'),list):
        raise ValueError('tracksV2 must contain right and left arrays')
    count=len(data['measures'])
    if len(tv2['right'])!=count or len(tv2['left'])!=count:
        raise ValueError('tracksV2 hand arrays must match measures length')
    original=data['original']
    if not isinstance(original,dict) or not isinstance(original.get('header'),dict) or not isinstance(original.get('tracks'),list):
        raise ValueError('original must contain header and tracks')
    for hand in ('right','left'):
        for i,measure in enumerate(tv2[hand]):
            if not isinstance(measure,dict) or not isinstance(measure.get('notes'),list):
                raise ValueError(f'tracksV2.{hand}[{i}] has no notes array')
    return True

PITCHES=('C','C#','D','D#','E','F','F#','G','G#','A','A#','B')

def _length_type(ticks,ppq):
    choices=((4,'whole'),(2,'half'),(1,'quarter'),(.5,'eighth'),(.25,'sixteenth'),(.125,'thirty-second'))
    ratio=ticks/ppq
    return min(choices,key=lambda x:abs(x[0]-ratio))[1]

def _tempo_segments(data):
    ppq=float(data['resolution']); raw=sorted(data.get('tempos') or [{'ticks':0,'bpm':120}],key=lambda x:x.get('ticks',0))
    segments=[]; elapsed=0.; last_tick=0.; bpm=float(raw[0].get('bpm',120))
    for item in raw:
        tick=float(item.get('ticks',0))
        if tick>last_tick: elapsed+=(tick-last_tick)/ppq*60/bpm
        bpm=float(item.get('bpm',bpm)); segments.append((elapsed,tick,bpm));last_tick=tick
    def seconds_to_ticks(seconds):
        i=max(0,bisect_right([x[0] for x in segments],seconds)-1); sec0,tick0,bpm0=segments[i]
        return int(round(tick0+(seconds-sec0)*ppq*bpm0/60))
    return seconds_to_ticks

def rebuild_tracks_v2(data,source,arrangement_mode='piano_voice'):
    from core import build
    reduction=build(source,arrangement_mode=arrangement_mode); roles={x['role']:x['notes'] for x in reduction['tracks']}
    right=roles['harmony'] if arrangement_mode=='piano_voice' else roles['melody']+roles['harmony']
    hands={'right':right,'left':roles['bass']}
    to_ticks=_tempo_segments(data); measures=data['measures']; starts=[int(x['ticksStart']) for x in measures]; ppq=int(data['resolution'])
    rebuilt={}
    for hand,notes in hands.items():
        by_measure=[[] for _ in measures]; serial=0
        for n in sorted(notes,key=lambda x:(x['time'],x['midi'])):
            start=float(n['time']); end=start+float(n['duration']); tick=to_ticks(start); end_tick=max(tick+1,to_ticks(end))
            mi=max(0,min(len(measures)-1,bisect_right(starts,tick)-1)); pitch=int(n['midi'])
            item={'note':pitch,'durationTicks':end_tick-tick,'noteOffVelocity':0,'ticksStart':tick,'velocity':float(n.get('velocity',.8)),
              'measureBars':tick/ppq,'duration':float(n['duration']),'noteName':f'{PITCHES[pitch%12]}{pitch//12-1}',
              'octave':pitch//12-1,'notePitch':PITCHES[pitch%12],'start':start,'end':end,
              'noteLengthType':_length_type(end_tick-tick,ppq),'group':-1,'measureInd':mi,
              'noteMeasureInd':len(by_measure[mi]),'id':f'{hand[0]}{serial}'}
            by_measure[mi].append(item);serial+=1
        hand_measures=[]
        bpm=float((data.get('tempos') or [{'bpm':120}])[0]['bpm'])
        for i,m in enumerate(measures):
            ns=by_measure[i]; time=float(m['time']); next_time=float(measures[i+1]['time']) if i+1<len(measures) else time+float(m['totalTicks'])/ppq*60/bpm
            hand_measures.append({'direction':'up' if hand=='right' else 'down','time':time,'timeEnd':next_time,
              'timeSignature':m['timeSignature'],'notes':ns,'max':max((x['note'] for x in ns),default=0),
              'min':min((x['note'] for x in ns),default=200),'measureTicksStart':m['ticksStart'],
              'measureTicksEnd':m['ticksStart']+m['totalTicks'],'rests':[],'groups':[]})
        rebuilt[hand]=hand_measures
    data['tracksV2']=rebuilt
    return reduction

def export_compatible(source,output,rebuild=True,arrangement_mode='piano_voice'):
    data,repaired=load_compatible(source)
    reduction=rebuild_tracks_v2(data,source,arrangement_mode) if rebuild else None
    Path(output).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    check=json.loads(Path(output).read_text(encoding='utf-8'))
    validate_compatible(check)
    return data,repaired,reduction
