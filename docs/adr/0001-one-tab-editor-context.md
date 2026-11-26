# One React context for the tab editor

The tab editor serves all of its state and commands through a single context (`useTabEditor`), so every consumer re-renders whenever any editor state changes, including on each cursor move and each playback step. We keep it that way. Measured in the dev build, a cursor move costs about 2 ms plus about 0.04 ms per Frame (2.8 ms at 32 Frames, 6.7 ms at 128). The part that grows is the tab display drawing every Frame, and the display reads the Cursor, so it re-renders on every move however the context is divided. Splitting the context would only trim part of the fixed cost, in exchange for a structure every consumer has to learn.

## Considered options

- **Split state from commands, or split by how often things change** (the Cursor apart from the Tab). Rejected: it can't avoid re-rendering the display, which is where the cost scales.
- **Selector subscriptions** (`useSyncExternalStore` with a selector per consumer). Rejected for the same reason, at a higher cost in machinery.

## Consequences

If large tabs ever feel slow, don't start here: have the tab display redraw only the Measures whose Cursor or Selection changed (memoize each Measure). Measure again before revisiting this decision.
