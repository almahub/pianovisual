from __future__ import annotations
import json, math, struct, xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path

NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
MIN_PLAYABLE_CHORD_CONFIDENCE = .5
QUALITIES = {
 'major':(0,4,7),'minor':(0,3,7),'diminished':(0,3,6),'augmented':(0,4,8),
 'sus2':(0,2,7),'sus4':(0,5,7),'6':(0,4,7,9),'minor6':(0,3,7,9),
 '7':(0,4,7,10),'major7':(0,4,7,11),'minor7':(0,3,7,10),
 '9':(0,2,4,7,10),'add9':(0,2,4,7)
}
SUFFIX={'major':'','minor':'m','diminished':'dim','augmented':'aug','minor6':'m6','major7':'maj7','minor7':'m7'}

def note_name(n): return f'{NAMES[n%12]}{n//12-1}'
def clamp(x,a,b): return max(a,min(b,x))
def varlen(data, pos):
    v=0
    while True:
        b=data[pos]; pos+=1; v=(v<<7)|(b&127)
        if not b&128:return v,pos

def inspect_input(path):
    ext=Path(path).suffix.lower()
    if ext in {'.mp3','.wav','.flac','.m4a','.mp4'}: raise ValueError('Audio transcription is not supported in this version; provide MIDI, MusicXML, or MIDI-like JSON.')
    kinds={'.json':'json','.mid':'midi','.midi':'midi','.xml':'musicxml','.musicxml':'musicxml','.mxl':'musicxml'}
    if ext not in kinds: raise ValueError(f'Unsupported input extension: {ext or "(none)"}')
    return kinds[ext]

def normalize_note(n, confidence=1.0):
    midi=n.get('midi',n.get('pitch'))
    if isinstance(midi,str): midi=parse_pitch(midi)
    start=float(n.get('time',n.get('start',0)))
    dur=float(n.get('duration',float(n.get('end',start))-start))
    if midi is None or dur<=0:return None
    out={'midi':int(midi),'name':note_name(int(midi)),'time':round(start,6),'duration':round(dur,6),
         'velocity':round(clamp(float(n.get('velocity',0.75 if confidence<1 else 0.8)),0,1),4),'confidence':confidence}
    for k in ('measure','beat'):
        if k in n: out[k]=n[k]
    return out

def parse_pitch(s):
    import re
    m=re.fullmatch(r'([A-Ga-g])([#b]?)(-?\d+)',s.strip())
    if not m: raise ValueError(f'Invalid pitch: {s}')
    pc={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}[m[1].upper()]+({'#':1,'b':-1}.get(m[2],0))
    return (int(m[3])+1)*12+pc

def parse_json(path):
    text=Path(path).read_text(encoding='utf-8-sig')
    if text.startswith('1{'): text=text[1:]
    d=json.loads(text)
    original=d.get('original') if isinstance(d.get('original'),dict) else None
    header=(original or {}).get('header',{})
    raw=d.get('tracks') or d.get('parts') or (original or {}).get('tracks')
    if not raw and isinstance(d.get('notes'),list): raw=[{'name':'Notes','notes':d['notes']}]
    if not raw: raise ValueError('JSON contains no tracks/parts/notes')
    tracks=[]
    for i,t in enumerate(raw):
        notes=[x for x in (normalize_note(n) for n in t.get('notes',[])) if x]
        inst=t.get('instrument') if isinstance(t.get('instrument'),dict) else {}
        source_name=t.get('name') or t.get('id') or f'Track {i+1}'
        instrument_name=inst.get('name') or inst.get('family') or ''
        name=' - '.join(x for x in (source_name,instrument_name) if x)
        if notes: tracks.append({'name':name,'program':t.get('program',inst.get('number')),'channel':t.get('channel'),'sourceTrackIndex':i,'notes':notes})
    if not tracks: raise ValueError('JSON contains no non-empty note tracks')
    info=d.get('musicalInfo',d.get('header',header)); tempos=info.get('tempos',d.get('tempos',[]))
    tempo=float(info.get('tempo',d.get('tempo',tempos[0].get('bpm',120) if tempos else 120)))
    signatures=info.get('timeSignatures',d.get('timeSignatures',[])); meter=info.get('meter',d.get('meter',signatures[0].get('timeSignature',[4,4]) if signatures else [4,4]))
    ppq=info.get('ppq',d.get('resolution'))
    duration=max(n['time']+n['duration'] for t in tracks for n in t['notes'])
    def tick_time(x): return round(float(x)/(ppq or 1)*60/tempo,6)
    key_sigs=info.get('keySignatures',d.get('keySignatures',[]))
    key=(f"{key_sigs[0].get('key')} {key_sigs[0].get('scale','major')}" if key_sigs else info.get('key'))
    return tracks, {'ppq':ppq,'tempo':tempo,'meter':meter,'key':key,
      'tempoMap':info.get('tempoMap',[{'time':tick_time(x.get('ticks',0)),'bpm':x.get('bpm',tempo)} for x in tempos] or [{'time':0,'bpm':tempo}]),
      'timeSignatureMap':info.get('timeSignatureMap',[{'time':tick_time(x.get('ticks',0)),'numerator':x.get('timeSignature',meter)[0],'denominator':x.get('timeSignature',meter)[1]} for x in signatures] or [{'time':0,'numerator':meter[0],'denominator':meter[1]}]),
      'keySignatureMap':info.get('keySignatureMap',[{'time':tick_time(x.get('ticks',0)),'key':f"{x.get('key')} {x.get('scale','major')}"} for x in key_sigs]),
      'duration':duration,'title':d.get('title',d.get('name',header.get('name',Path(path).stem))),'artist':d.get('artist','')}

def parse_midi(path):
    data=Path(path).read_bytes()
    if data[:4]!=b'MThd': raise ValueError('Invalid MIDI header')
    hlen=struct.unpack('>I',data[4:8])[0]; fmt,ntr,ppq=struct.unpack('>HHH',data[8:14]); pos=8+hlen
    if ppq&0x8000: raise ValueError('SMPTE-timed MIDI is not supported')
    parsed=[]; meta=[]
    for ti in range(ntr):
        if data[pos:pos+4]!=b'MTrk': raise ValueError('Invalid MIDI track chunk')
        ln=struct.unpack('>I',data[pos+4:pos+8])[0]; chunk=data[pos+8:pos+8+ln]; pos+=8+ln
        p=tick=0; running=None; active=defaultdict(list); notes=[]; name=f'Track {ti+1}'; program=None
        while p<len(chunk):
            dt,p=varlen(chunk,p); tick+=dt; status=chunk[p]
            if status<128:
                if running is None: raise ValueError('Invalid MIDI running status')
                status=running
            else: p+=1; running=status if status<240 else running
            if status==255:
                typ=chunk[p]; p+=1; size,p=varlen(chunk,p); val=chunk[p:p+size]; p+=size
                if typ==3: name=val.decode('latin1','replace')
                elif typ==81 and size==3: meta.append((tick,'tempo',int.from_bytes(val,'big')))
                elif typ==88 and size>=2: meta.append((tick,'meter',(val[0],2**val[1])))
                elif typ==89 and size>=2: meta.append((tick,'key',(struct.unpack('b',val[:1])[0],val[1])))
                continue
            if status in (240,247): size,p=varlen(chunk,p); p+=size; continue
            typ=status&240; ch=status&15; size=1 if typ in (192,208) else 2; vals=chunk[p:p+size]; p+=size
            if typ==192: program=vals[0]
            elif typ==144 and vals[1]>0: active[(ch,vals[0])].append((tick,vals[1]))
            elif typ in (128,144):
                key=(ch,vals[0])
                if active[key]:
                    st,vel=active[key].pop(0); notes.append((st,tick,vals[0],vel))
        parsed.append({'name':name,'program':program,'raw':notes})
    tempos=sorted([(0,500000)]+[(t,v) for t,k,v in meta if k=='tempo']); compact=[]
    for x in tempos:
        if compact and compact[-1][0]==x[0]:compact[-1]=x
        else:compact.append(x)
    def sec(t):
        total=0; last=0; us=500000
        for at,val in compact:
            if at>=t: break
            total+=(min(t,at)-last)*us/(ppq*1e6); last=at; us=val
        return total+(t-last)*us/(ppq*1e6)
    tracks=[]
    for tr in parsed:
        ns=[]
        for st,en,pitch,vel in tr['raw']:
            n=normalize_note({'midi':pitch,'time':sec(st),'duration':sec(en)-sec(st),'velocity':vel/127});
            if n:ns.append(n)
        if ns: tracks.append({'name':tr['name'],'program':tr['program'],'notes':ns})
    if not tracks: raise ValueError('MIDI contains no completed note events')
    meters=[(t,v) for t,k,v in meta if k=='meter']; meter=meters[0][1] if meters else (4,4)
    keys=[(t,v) for t,k,v in meta if k=='key']; key=key_name(keys[0][1]) if keys else None
    duration=max(n['time']+n['duration'] for tr in tracks for n in tr['notes'])
    return tracks, {'ppq':ppq,'tempo':60e6/compact[0][1],'meter':list(meter),'key':key,'duration':duration,
      'tempoMap':[{'time':round(sec(t),6),'bpm':round(60e6/us,4)} for t,us in compact],
      'timeSignatureMap':[{'time':round(sec(t),6),'numerator':v[0],'denominator':v[1]} for t,v in meters] or [{'time':0,'numerator':4,'denominator':4}],
      'keySignatureMap':[{'time':round(sec(t),6),'key':key_name(v)} for t,v in keys], 'title':Path(path).stem,'artist':''}

def key_name(v):
    sf,minor=v; majors=['Cb','Gb','Db','Ab','Eb','Bb','F','C','G','D','A','E','B','F#','C#']; root=majors[sf+7]
    if minor: root=['Ab','Eb','Bb','F','C','G','D','A','E','B','F#','C#','G#','D#','A#'][sf+7]
    return root+(' minor' if minor else ' major')

def parse_musicxml(path):
    if Path(path).suffix.lower()=='.mxl': raise ValueError('Compressed MXL must be extracted before conversion')
    root=ET.parse(path).getroot(); ns='}' if root.tag.startswith('{') else ''
    def tag(x): return x.split('}',1)[-1]
    names={x.attrib.get('id'):next((c.text for c in x.iter() if tag(c.tag)=='part-name'),'Part') for x in root.iter() if tag(x.tag)=='score-part'}
    tracks=[]; tempo=120.; meter=[4,4]; key=None
    for part in [x for x in root if tag(x.tag)=='part']:
        divisions=1; qpos=0.; notes=[]; last_start=0.; measure_no=0
        for meas in part:
            if tag(meas.tag)!='measure':continue
            measure_no+=1
            for el in meas:
                tt=tag(el.tag)
                if tt=='attributes':
                    d=next((x for x in el if tag(x.tag)=='divisions'),None)
                    if d is not None:divisions=int(d.text)
                    tm=next((x for x in el if tag(x.tag)=='time'),None)
                    if tm is not None:
                        vals={tag(x.tag):x.text for x in tm}; meter=[int(vals.get('beats',4)),int(vals.get('beat-type',4))]
                    ky=next((x for x in el if tag(x.tag)=='key'),None)
                    if ky is not None:
                        vals={tag(x.tag):x.text for x in ky}; key=key_name((int(vals.get('fifths',0)),vals.get('mode','major')=='minor'))
                elif tt=='direction':
                    snd=next((x for x in el.iter() if tag(x.tag)=='sound' and x.get('tempo')),None)
                    if snd is not None:tempo=float(snd.get('tempo'))
                elif tt=='backup': qpos-=float(next(x.text for x in el if tag(x.tag)=='duration'))/divisions
                elif tt=='forward': qpos+=float(next(x.text for x in el if tag(x.tag)=='duration'))/divisions
                elif tt=='note':
                    dur_el=next((x for x in el if tag(x.tag)=='duration'),None); durq=float(dur_el.text)/divisions if dur_el is not None else 0
                    chord=any(tag(x.tag)=='chord' for x in el); rest=any(tag(x.tag)=='rest' for x in el); startq=last_start if chord else qpos
                    if not rest:
                        p=next((x for x in el if tag(x.tag)=='pitch'),None)
                        if p is not None:
                            v={tag(x.tag):x.text for x in p}; midi=(int(v['octave'])+1)*12+{'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}[v['step']]+int(v.get('alter',0))
                            secq=60/tempo; notes.append(normalize_note({'midi':midi,'time':startq*secq,'duration':max(durq*secq,.001),'measure':measure_no,'beat':1+(startq%(meter[0]*4/meter[1]))},1.0))
                    if not chord:last_start=startq; qpos+=durq
        if notes:tracks.append({'name':names.get(part.attrib.get('id'),'Part'),'program':None,'notes':notes})
    if not tracks:raise ValueError('MusicXML contains no readable pitched notes')
    duration=max(n['time']+n['duration'] for tr in tracks for n in tr['notes'])
    return tracks,{'ppq':None,'tempo':tempo,'meter':meter,'key':key,'duration':duration,'tempoMap':[{'time':0,'bpm':tempo}],
      'timeSignatureMap':[{'time':0,'numerator':meter[0],'denominator':meter[1]}],'keySignatureMap':([{'time':0,'key':key}] if key else []),'title':Path(path).stem,'artist':''}

def track_features(tr):
    ns=sorted(tr['notes'],key=lambda n:(n['time'],n['midi'])); count=len(ns); mean=sum(n['midi'] for n in ns)/count
    overlaps=sum(1 for a,b in zip(ns,ns[1:]) if b['time']<a['time']+a['duration']-.02)/max(1,count-1)
    intervals=[abs(b['midi']-a['midi']) for a,b in zip(ns,ns[1:])]; continuity=1-min(1,(sum(intervals)/max(1,len(intervals)))/12)
    name=tr['name'].lower(); percussion=tr.get('channel')==9 or any(x in name for x in ('drum','percussion','drumkit','drum kit'))
    melody_hint=1 if any(x in name for x in ('melody','vocal','voice','lead','oboe','flute','clarinet','sax')) else 0
    bass_hint=1 if 'bass' in name else 0
    mono=1-overlaps; reg=clamp((mean-52)/28,0,1); low=clamp((60-mean)/24,0,1)
    density_score=min(1,count/100); role_penalty=(.28 if bass_hint else 0)+(.12 if 'guitar' in name else 0)+(.20 if count<32 else 0)
    melody=.30*mono+.15*reg+.20*continuity+.15*density_score+.10*melody_hint+.10*(1-overlaps)-role_penalty
    if percussion:melody=0
    return {'melody':clamp(melody,0,1),
      'bass':0 if percussion else .35*low+.25*mono+.20*bass_hint+.20*(1-overlaps),
      'harmony':0 if percussion else .45*overlaps+.30*(1-abs(mean-60)/36)+.25*(1-mono),'mean':mean,'support':percussion}

def classify(tracks):
    fs=[track_features(t) for t in tracks]; eligible=[i for i in range(len(tracks)) if not fs[i].get('support')] or list(range(len(tracks)))
    mi=max(eligible,key=lambda i:fs[i]['melody']); remaining=[i for i in eligible if i!=mi]
    bi=max(remaining or [mi],key=lambda i:fs[i]['bass']); hi=max([i for i in remaining if i!=bi] or remaining or [mi],key=lambda i:fs[i]['harmony'])
    return mi,hi,bi,fs

def infer_chords(tracks,info,bass_track=None):
    beat=60/info['tempo']*4/info['meter'][1]; alln=[n for tr in tracks for n in tr['notes']]; out=[]; t=0; previous=None
    while t<info['duration']-.001:
        active=[n for n in alln if n['time']<t+beat and n['time']+n['duration']>t]; weights=Counter()
        for n in active:
            overlap=max(0,min(t+beat,n['time']+n['duration'])-max(t,n['time']))
            weights[n['midi']%12]+=overlap*max(.2,float(n.get('velocity',.8)))
        if len(weights)>=2:
            bass_active=[n for n in (bass_track or {}).get('notes',[]) if n['time']<t+beat and n['time']+n['duration']>t]
            observed_bass=min(bass_active,key=lambda n:n['midi'])['midi']%12 if bass_active else None
            best=None
            for root in range(12):
                for q,ints in QUALITIES.items():
                    pcs={(root+i)%12 for i in ints}; hit=sum(weights[p] for p in pcs); extra=sum(v for p,v in weights.items() if p not in pcs)
                    bass_bonus=.18*sum(weights.values()) if observed_bass in pcs else (-.20*sum(weights.values()) if observed_bass is not None else 0)
                    continuity_bonus=.08*sum(weights.values()) if previous and previous[:2]==(root,q) else 0
                    score=hit-.42*extra-.05*len(pcs)+bass_bonus+continuity_bonus
                    if best is None or score>best[0]:best=(score,root,q,pcs,hit,extra)
            _,root,q,pcs,hit,extra=best; conf=clamp(hit/(hit+extra+1e-9)*.9,0.35,.95)
            bass=observed_bass if observed_bass in pcs else root; previous=(root,q)
            sym=NAMES[root]+SUFFIX.get(q,q)+(f'/{NAMES[bass]}' if bass!=root else '')
            out.append({'time':round(t,6),'duration':round(min(beat,info['duration']-t),6),'measure':int(t/(beat*info['meter'][0]))+1,
              'beat':int((t/beat)%info['meter'][0])+1,'symbol':sym,'root':root,'quality':q,'bass':NAMES[bass],
              'bassPitchClass':bass,'pitchClasses':sorted(pcs),'confidence':round(conf,3)})
        t+=beat
    # Suppress a single low-confidence beat that disagrees with equal neighbors.
    for i in range(1,len(out)-1):
        before,current,after=out[i-1],out[i],out[i+1]
        contiguous=abs(before['time']+before['duration']-current['time'])<1e-4 and abs(current['time']+current['duration']-after['time'])<1e-4
        if contiguous and before['root']==after['root'] and before['quality']==after['quality'] and (current['root'],current['quality'])!=(before['root'],before['quality']) and current['confidence']<.72:
            for key in ('root','quality','bass','bassPitchClass','pitchClasses','symbol'):
                current[key]=before[key]
            current['confidence']=round(min(before['confidence'],after['confidence'])*.9,3)
    merged=[]
    for c in out:
        if merged and merged[-1]['symbol']==c['symbol'] and abs(merged[-1]['time']+merged[-1]['duration']-c['time'])<1e-4:merged[-1]['duration']=round(merged[-1]['duration']+c['duration'],6)
        else:merged.append(c)
    return merged

def _nearest_chord_pitch(original, pitch_classes, low, high, colliding=None):
    candidates=[pitch for pitch in range(low,high+1) if pitch%12 in pitch_classes]
    if not candidates:return int(clamp(original,low,high))
    same_pitch_class=[pitch for pitch in candidates if pitch%12==original%12]
    if same_pitch_class:candidates=same_pitch_class
    colliding=colliding or []
    def score(pitch):
        collision=any(-3<=pitch-note['midi']<=1 for note in colliding)
        return (100 if collision else 0)+abs(pitch-original)+abs(pitch-(low+high)/2)*.03
    return min(candidates,key=score)

def _align_notes_to_chords(notes,chords,low,high,melody=None):
    if not chords:
        out=[]
        for source in notes:
            n=dict(source)
            while n['midi']<low:n['midi']+=12
            while n['midi']>high:n['midi']-=12
            n['name']=note_name(n['midi']);out.append(n)
        return out
    aligned=[];seen=set();melody=melody or []
    for source in notes:
        note_start=float(source['time']);note_end=note_start+float(source['duration'])
        overlaps=sorted((c for c in chords if c['time']<note_end-1e-6 and c['time']+c['duration']>note_start+1e-6),key=lambda c:c['time'])
        segments=[];cursor=note_start
        for chord in overlaps:
            chord_start=max(note_start,float(chord['time']));chord_end=min(note_end,float(chord['time'])+float(chord['duration']))
            if chord_start>cursor+1e-6:segments.append((cursor,chord_start,None))
            segments.append((chord_start,chord_end,chord));cursor=max(cursor,chord_end)
        if cursor<note_end-1e-6:segments.append((cursor,note_end,None))
        if not segments:segments=[(note_start,note_end,None)]
        for start,end,chord in segments:
            if end-start<=1e-6:continue
            simultaneous=[m for m in melody if m['time']<end-1e-6 and m['time']+m['duration']>start+1e-6]
            pitch_classes=set(chord['pitchClasses']) if chord else {int(source['midi'])%12}
            pitch=_nearest_chord_pitch(int(source['midi']),pitch_classes,low,high,simultaneous)
            key=(round(start,6),round(end-start,6),pitch)
            if key in seen:continue
            seen.add(key);n=dict(source);n['midi']=pitch;n['name']=note_name(pitch)
            n['time']=round(start,6);n['duration']=round(end-start,6);aligned.append(n)
    return sorted(aligned,key=lambda n:(n['time'],n['midi']))

def _chord_voicings(chords,melody=None):
    melody=melody or []; out=[]; previous=[]
    for chord in chords:
        if float(chord.get('confidence',0))<MIN_PLAYABLE_CHORD_CONFIDENCE:continue
        pcs=set(chord['pitchClasses']); candidates=[pitch for pitch in range(48,73) if pitch%12 in pcs]
        target_count=min(3,len(pcs)); best=None
        from itertools import combinations
        for voicing in combinations(candidates,target_count):
            if any(b-a<3 for a,b in zip(voicing,voicing[1:])):continue
            simultaneous=[n for n in melody if n['time']<chord['time']+chord['duration'] and n['time']+n['duration']>chord['time']]
            collisions=sum(1 for pitch in voicing for note in simultaneous if -3<=pitch-note['midi']<=1)
            movement=sum(min(abs(pitch-old) for old in previous) for pitch in voicing) if previous else sum(abs(pitch-60) for pitch in voicing)
            score=collisions*100+movement+max(voicing)-min(voicing)
            if best is None or score<best[0]:best=(score,voicing)
        voicing=list(best[1]) if best else sorted(candidates,key=lambda pitch:abs(pitch-60))[:target_count]
        previous=voicing
        for pitch in voicing:
            out.append({'midi':pitch,'name':note_name(pitch),'time':chord['time'],'duration':chord['duration'],
              'velocity':.62,'confidence':chord['confidence']})
    return out

def _align_bass_to_chords(notes,chords):
    if not chords:return _align_notes_to_chords(notes,[],36,60)
    aligned=[];seen=set()
    for source in notes:
        note_start=float(source['time']);note_end=note_start+float(source['duration'])
        overlaps=[c for c in chords if c['time']<note_end-1e-6 and c['time']+c['duration']>note_start+1e-6]
        for chord in overlaps:
            if float(chord.get('confidence',0))<MIN_PLAYABLE_CHORD_CONFIDENCE:continue
            start=max(note_start,float(chord['time']));end=min(note_end,float(chord['time'])+float(chord['duration']))
            target_pc=int(chord.get('bassPitchClass',chord['root']))
            candidates=[pitch for pitch in range(36,61) if pitch%12==target_pc]
            pitch=min(candidates,key=lambda value:abs(value-int(source['midi'])))
            key=(round(start,6),round(end-start,6),pitch)
            if key in seen or end-start<=1e-6:continue
            seen.add(key);n=dict(source);n.update({'midi':pitch,'name':note_name(pitch),'time':round(start,6),'duration':round(end-start,6),
              'confidence':min(float(source.get('confidence',1)),float(chord['confidence']))});aligned.append(n)
    return sorted(aligned,key=lambda n:(n['time'],n['midi']))

def reduce(tracks,info,chords=None,classification=None,arrangement_mode='piano_voice'):
    mi,hi,bi,fs=classification or classify(tracks); melody=[dict(n) for n in tracks[mi]['notes']]
    # A reduction must remain playable: use the strongest harmonic source instead
    # of stacking every orchestral accompaniment track into one piano hand.
    source_h=[] if len(tracks)==1 else [dict(n) for n in tracks[hi]['notes']]
    source_b=[] if len(tracks)==1 else [dict(n) for n in tracks[bi]['notes']]
    if hi==bi and len(tracks)>1:
        source_h=[n for n in source_h if n['midi']>=48]
        source_b=[n for n in source_b if n['midi']<60]
    harmony=_chord_voicings(chords or [],melody if arrangement_mode=='piano_solo' else []) if source_h else []
    bass=_align_bass_to_chords(source_b,chords or [])
    return [
      {'id':'melody','name':'Voce / Melodia','role':'melody','hand':'right' if arrangement_mode=='piano_solo' else 'none','instrument':'piano' if arrangement_mode=='piano_solo' else 'voice','sourceTrackIndex':tracks[mi].get('sourceTrackIndex',mi),'confidence':round(fs[mi]['melody'],3),'notes':melody},
      {'id':'harmony','name':'Armonia pianistica','role':'harmony','hand':'right','instrument':'piano','sourceTrackIndex':tracks[hi].get('sourceTrackIndex',hi),'confidence':round(fs[hi]['harmony'],3),'notes':harmony},
      {'id':'bass','name':'Basso','role':'bass','hand':'left','instrument':'piano','sourceTrackIndex':tracks[bi].get('sourceTrackIndex',bi),'confidence':round(fs[bi]['bass'],3),'notes':bass}]

def sections(chords,info):
    bar=60/info['tempo']*4/info['meter'][1]*info['meter'][0]; dur=info['duration']; spans=[]; size=bar*4; t=0
    while t<dur:
        fp=tuple((c['root'],c['quality']) for c in chords if t<=c['time']<min(t+size,dur)); spans.append([t,min(t+size,dur),fp]);t+=size
    groups=defaultdict(list)
    for i,s in enumerate(spans):
        if s[2]:groups[s[2]].append(i)
    fam={i:f'family_{j+1}' for j,g in enumerate(v for v in groups.values() if len(v)>1) for i in g}
    out=[]
    for i,(a,b,fp) in enumerate(spans):
        typ='intro' if i==0 else ('outro' if i==len(spans)-1 and len(spans)>1 else 'section'); ident=typ if typ!='section' else f'section_{i+1}'
        x={'id':ident,'type':typ,'start':round(a,6),'end':round(b,6),'confidence':0.55 if i in fam else 0.4}
        if i in fam:x['family']=fam[i]
        out.append(x)
    return out

def crop(tracks,info,start,end):
    end=info['duration'] if end is None else min(end,info['duration']); start=max(0,start or 0)
    if end<=start:raise ValueError('Excerpt end must be after start')
    for tr in tracks:
        ns=[]
        for n in tr['notes']:
            a=max(start,n['time']);b=min(end,n['time']+n['duration'])
            if b>a:
                x=dict(n);x['time']=round(a-start,6);x['duration']=round(b-a,6);ns.append(x)
        tr['notes']=ns
    info['duration']=end-start
    return tracks,info

def build(path,start=0,end=None,title=None,artist=None,arrangement_mode='piano_voice'):
    kind=inspect_input(path); parser={'json':parse_json,'midi':parse_midi,'musicxml':parse_musicxml}[kind]; tracks,info=parser(path)
    tracks,info=crop(tracks,info,start,end); tracks=[t for t in tracks if t['notes']]
    if not tracks:raise ValueError('Selected interval contains no notes')
    classification=classify(tracks);melody_index=classification[0]
    bass_index=classification[2];harmonic_tracks=[track for index,track in enumerate(tracks) if index!=melody_index and not classification[3][index].get('support')]
    chords=infer_chords(harmonic_tracks,info,tracks[bass_index] if harmonic_tracks else None) if harmonic_tracks else []; reduced=reduce(tracks,info,chords,classification,arrangement_mode)
    return {'format':'piano_reduction_v2','title':title or info.pop('title',Path(path).stem),'artist':artist if artist is not None else info.pop('artist',''),
      'source':{'filename':Path(path).name,'type':kind,'analysis_mode':'structured','confidence':1.0},'musicalInfo':info,
      'arrangementMode':arrangement_mode,'sections':sections(chords,info),'chords':chords,'tracks':reduced}

def validate(d):
    errors=[]
    if d.get('format')!='piano_reduction_v2':errors.append('wrong format')
    roles=[t.get('role') for t in d.get('tracks',[])]
    if roles!=['melody','harmony','bass']:errors.append('tracks must be melody, harmony, bass')
    if d.get('arrangementMode') not in ('piano_solo','piano_voice'):errors.append('invalid arrangement mode')
    for tr in d.get('tracks',[]):
        for n in tr.get('notes',[]):
            if not 0<=n.get('midi',-1)<=127 or n.get('duration',0)<=0:errors.append(f'invalid note in {tr.get("id")}')
    chords=d.get('chords',[])
    for role in ('harmony','bass'):
        tr=next((item for item in d.get('tracks',[]) if item.get('role')==role),{'notes':[]})
        for note in tr['notes']:
            active=[chord for chord in chords if chord['time']<note['time']+note['duration']-1e-6 and chord['time']+chord['duration']>note['time']+1e-6]
            if active and any(note['midi']%12 not in chord['pitchClasses'] for chord in active):errors.append(f'{role} note outside active chord')
            if role=='bass' and active and any(note['midi']%12!=chord.get('bassPitchClass',chord['root']) for chord in active):errors.append('bass note does not match chord bass')
    for s in d.get('sections',[]):
        if s['end']<=s['start']:errors.append(f'invalid section {s["id"]}')
    if errors:raise ValueError('; '.join(errors))
    return True
