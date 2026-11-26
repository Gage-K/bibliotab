# Bibliotab

A tablature editor: people write, play back, and share guitar-style tabs for songs, one instrument part per track.

## Language

### A tab and its parts

**Tab**:
One song's tablature: its details (song, artist, tempo, default meter), freeform notes, and one or more Tracks. Always has at least one Track.
_Avoid_: Song (that is a field of the Tab), sheet, score

**Track**:
One instrument's part within a Tab, with its own Tuning and its own Sections.
_Avoid_: Part, voice

**Tuning**:
The open note of each string, listed from the highest-pitched string down; its length is the Track's string count.

**Section**:
A named run of consecutive Measures within a Track, such as Intro or Verse. A Track always has at least one Section, and a Section at least one Measure.
_Avoid_: Part, block

**Measure**:
One bar of a Section: an ordered run of Frames, optionally with its own meter overriding the Tab's. Always has at least one Frame.
_Avoid_: Bar

**Frame**:
One moment within a Measure: a Note for every string, plus how long it lasts in beats.
_Avoid_: Column, step, beat

**Note**:
What one string does in a Frame: a fret number (or empty, or muted) and a playing style such as a bend or hammer-on.
_Avoid_: Fret (the fret is the number within a Note)

**Rest**:
A Frame that sounds nothing for its duration, distinct from a Frame that has not been filled in yet.
