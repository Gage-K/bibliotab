# bibliotab

A web-based guitar tablature editor with vim-style keybindings. Try it at [bibliotab.com](https://bibliotab.com).

Tablature is a form of notation that tells guitarists exactly which frets and strings to play, removing the ambiguity of traditional sheet music. Bibliotab makes it easy to create, edit, and store tabs from any browser. Plaintext no more!

```text
E|------------0----0-----0----0-------0-----|
C|---4p2p0---0-0--0-----0-0--0-------0-0----|
G|--------0-2----4---5/7----9---10/12-------|
C|-0----------------------------------------|
A|------------------------------------------|
F|------------------------------------------|
```

## Features

- Free and runs entirely in the browser; no downloads or installs needed
- Fast, keyboard-driven editing with vim-style keybindings
- Supports bends, slides, hammer-ons, pull-offs, harmonics, and taps
- Create and save tabs to your account from any device

## Tech stack

**Client:** React, TailwindCSS, Tanstack Query, Radix UI/shadcn, Vite

**Server:** Node.js, Express, PostgreSQL, Passport (JWT)

**Infra:** Docker Compose, Nginx

## Getting started

### Prerequisites

- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) (or a local PostgreSQL instance)

### With Docker

```sh
make docker-up
```

### Local development

```sh
make install
make dev-all    # starts postgres, backend, and frontend
```

Or if Postgres is already running:

```sh
make dev        # starts backend + frontend only
```

The client runs on `http://localhost:5173` and the API on `http://localhost:3000`.

## Keybinds

### Navigation

| Key | Action |
|-----|--------|
| `h` / `j` / `k` / `l` | Move left / down / up / right |
| `w` / `b` | Next / previous measure |
| `Shift+H` / `Shift+L` | Extend selection left / right |
| `Escape` | Clear selection |

### Note entry

| Key | Action |
|-----|--------|
| `0`-`9` | Enter fret digit (two-digit frets up to 24) |
| `x` | Clear note |
| `m` | Mute note |

### Styles

| Key | Action |
|-----|--------|
| `z` | Bend |
| `s` | Slide |
| `v` | Hammer-on |
| `p` | Pull-off |
| `n` | Harmonic |
| `t` | Tap |

### Frames and measures

| Key | Action |
|-----|--------|
| `o` / `O` | Add frame after / before |
| `}` / `{` | Add measure after / before |
| `d` | Duplicate frame |
| `X` | Delete frame |

### Other

| Key | Action |
|-----|--------|
| `Ctrl/Cmd+B` | Toggle sidebar |
