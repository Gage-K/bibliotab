# tablab

Tablab is a full-stack web application for creating guitar tablature. Tablab relies on React (with TailwindCSS) in the frontend and Node.js, Express, and PostgreSQL in the backend. Authentication is handled via JSON Web Tokens (via HTTP cookies) with Passport.

**For visitors who want to try out the app, use the following credentials to go into the sandbox:**:
```text
username: testsandbox
password: Test1234!
```

## Features

- Tablature editor usable on all devices and screen sizes in the browser
- All tabs are saved online
- Editor is clean, simple, and easy-to-use

## Background

Tablature is a form of musical notation popular among guitarists and musicians who play similar instruments (e.g., bass guitar, ukulele, etc.). Traditional sheet music represents note pitches and length. However, guitars typically have at least 6 strings and 20 frets, so a guitarist can play the same notes or chords in numerous different ways. As a result, relying on traditional sheet music alone can create ambiguity in how a piece of music should be played on guitar. Tablature solves this problem by representing the fingerings needed to play a piece of music. Guitarists (and bassists!) will 'tab' music by indicating the frets, strings, style (e.g., bend, slide, harmonic), and order that the notes are played.

Guitarists can find creating digital tablature tedious. Desktop tools exist like [TuxGuitar](https://github.com/helge17/tuxguitar/) exist, but it lacks convenient web storage. Or, proprietary online software exist like GuitarPro, but it may be too expensive for students, teachers, or hobbyists to use. Lastly, writing plain text files is the most popular, accessible, and free option to create tablature. Usually, tablature in this form will look like the following:

```text
Guitar 1

E|------------0----0-----0----0-------0-----|
C|---4p2p0---0-0--0-----0-0--0-------0-0----|
G|--------0-2----4---5/7----9---10/12-------|
C|-0----------------------------------------|
A|------------------------------------------|
F|------------------------------------------|
```

Using plain text certainly works, but it requires musicians to painstakingly edit raw text files and all of its formatting pains. And, plain text is not very accessible. A screen reader will read the file line by line for each string, but guitarists read tablature from left-right for all strings at once. Needless to say, plain text tabs are not the most pleasant to look at.

Enter Tablab. Tablab aims to resolve all of the previous frustrations of creating guitar tablature. Tablab is free, accessible on all devices via the web browser, and has a clean, easy-to-use interface.

## How to use Tablab

### Create an account

Navigate to the Register page to create an account with a username and password. Login using your credentials.

### Create a new tab

Navigate to the `tabs` page where you will find your dashboard. Click the 'Create New Tab' button to create a new tab which will redirect you to the editor.

### Edit your tab

You can now begin creating your tab! In the editor bar, you will find a button at the end which looks like a check mark. The `check` indicates that your tab is current and has been saved. Anytime you edit your tab, this button will appear as a flopping disk to indicate that you have unsaved changes. Clicking the `save` button will save your changes, you should then see `check` again.

#### Song information

Update the artist, name of the song, and tuning by clicking the 'edit' button. Save your changes with the `save` button in the editor bar.

#### Tablature

The editor bar contains all of the controls needed to edit your tab. A `frame` refers to a discrete moment in a tab. A `measure` refers to an ordered set of `frames`, following its conventional meaning and usage in music composition.

Edit and view your tab using the following controls:

- `Edit/Close`: open the editor to change the notes and style for each string at the current frame
- `Forward`: move forward one frame in the tab
- `Back`: move backward one frame in the tab
- `Add frame`: Add a frame immediately after the current frame
- `Add measure`: Add a measure immediately after the measure of the current frame
- `Duplicate`: Duplicate the current frame
- `Delete frame`: Delete the current frame
- `Save`: Save changes (the button will show a `check` if the tab is current)

You can also click on different locations of the displayed tab to change your location in the editor. When you click on a frame, the editor will automatically populate the current fret values of that frame of their respective strings.

## Upcoming features and improvements

The following improvements are in the pipeline:

- [ ] Note & Chord recognition
- [ ] Select multiple frames at once for duplication
- [ ] Measure notes
- [ ] Dark mode
- [ ] Recovery email
- [ ] Improved error UX
