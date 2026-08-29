#!/usr/bin/env python3
import argparse, json, sys
from pathlib import Path
from core import build, validate
from program_compatible import export_compatible, looks_compatible

def write_analysis(path, reduction):
    if not path:
        return
    role_sources={}
    for track in reduction.get('tracks',[]):
        index=track.get('sourceTrackIndex')
        if isinstance(index,int) and index>=0:
            role_sources[track.get('role','')]=index
    Path(path).write_text(json.dumps({
      'arrangementMode':reduction.get('arrangementMode','piano_voice'),
      'roleSourceIndices':role_sources,
      'chords':reduction.get('chords',[]),
    },ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def main():
    p=argparse.ArgumentParser(description='Convert structured music to piano_reduction_v2 JSON')
    p.add_argument('input');p.add_argument('-o','--output',required=True);p.add_argument('--start',type=float,default=0);p.add_argument('--end',type=float)
    p.add_argument('--title');p.add_argument('--artist')
    p.add_argument('--format',choices=('auto','normalized','program-compatible'),default='auto',
                   help='auto preserves recognized tracksV2 program JSON; normalized emits piano_reduction_v2')
    p.add_argument('--analysis-output',help='write role/source-track metadata to a separate JSON sidecar')
    p.add_argument('--arrangement-mode',choices=('piano_voice','piano_solo'),default='piano_voice',
                   help='piano_voice keeps melody/voice separate; piano_solo includes melody in the right hand')
    a=p.parse_args()
    if Path(a.input).resolve()==Path(a.output).resolve():p.error('output must differ from input')
    try:
        compatible=a.format=='program-compatible' or (a.format=='auto' and Path(a.input).suffix.lower()=='.json' and looks_compatible(a.input))
        if compatible:
            if a.start or a.end is not None:
                raise ValueError('Excerpt cropping is not yet safe in program-compatible mode; use --format normalized')
            d,repaired,reduction=export_compatible(a.input,a.output,arrangement_mode=a.arrangement_mode)
            write_analysis(a.analysis_output,reduction)
            notes_right=sum(len(x['notes']) for x in d['tracksV2']['right'])
            notes_left=sum(len(x['notes']) for x in d['tracksV2']['left'])
            repair='; removed stray leading 1' if repaired else ''
            melody=len(next(x for x in reduction['tracks'] if x['role']=='melody')['notes'])
            harmony=len(next(x for x in reduction['tracks'] if x['role']=='harmony')['notes'])
            print(f"Created: {a.output}\nFormat: program-compatible{repair}\nMeasures: {len(d['measures'])}\nMelody: {melody} notes\nHarmony: {harmony} notes\nRight hand: {notes_right} notes\nLeft hand: {notes_left} notes")
            return 0
        d=build(a.input,a.start,a.end,a.title,a.artist,a.arrangement_mode);validate(d)
        Path(a.output).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        write_analysis(a.analysis_output,d)
        tr={x['role']:x for x in d['tracks']}; types=' / '.join(x['type'] for x in d['sections'])
        print(f"Created: {a.output}\nMelody: {len(tr['melody']['notes'])} notes\nChords: {len(d['chords'])}\nBass: {len(tr['bass']['notes'])} notes\nStructure: {types}\nTempo: {d['musicalInfo']['tempo']} BPM\nKey: {d['musicalInfo'].get('key') or 'not supplied'}")
    except Exception as e: print(f'Error: {e}',file=sys.stderr);return 1
    return 0
if __name__=='__main__':raise SystemExit(main())
