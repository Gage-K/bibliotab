# To Do

## Features

### Priority 1

- [ ] Note & chord finder
- [ ] Dark mode

### Priority 2

- [ ] Allow for different number of strings to be selected
- [ ] Automatically render fieldsets based on number of strings

## Content

- [ ] Guide Page
- [ ] Updates Page
- [ ] Home Page
- [ ] Footer

## Bugs

## a11y

- [ ] Review display a11y

## Minor Fixes & Changes

- [ ] Remove testing defaults (defaultTab.json references)
- [ ] Code Review

## Completed Graveyard:

- [x] Improve styling of song details
- [x] Improve styling of editor controls
- [x] Remove duplicated editor control buttons
- [x] Make editor controls sticky (maybe reconsider how to structure html)
- [x] Make a wrapper for the entire header of the tablature app
- [x] On delete, keep position if it exists; if not, move back 1;
- [x] Add further controls:
  - [x] Insert next/prev measure
  - [x] Insert next/prev frame
- [x] Review need for useMemo in tab form
- [x] Consider a way to manage chunk calculation based on number of measures in chunk
- [x] If in the last frame of a measure is deleted, app breaks (has to do with updatePosition handling in deleteFrame())
- [x] Add comments to checkIfPositionExists() to be more readable (possibly refactor)
- [x] Refactor to allow for measure grouping
  - [x] Update buttons in TabDisplay
  - [x] Update functions in TabForm
  - [x] Update user controls in App
  - [x] fix set position after delete
  - [x] create function to delete measure (and call function when deleted frame is last of measure)
  - [x] Update default data to reflect this
  - [x] Display measure start and end
  - [x] Update position (maybe as measure and then frame)
- [x] Create a max-width for display and add wrapping
- [x] Finish tab display for all tab
- [x] Conditionally render background color based on if current position
- [x] Have current position update onClick
- [x] Add hover styling
- [x] Implement `clear`
  - [x] set formData frets & style to `null`
  - [x] update formData
- [x] Implement `delete`
  - [x] remove tabData of spec id
- [x] Init Form
- [x] Create formData state
- [x] Load tab data into form from current pos
- [x] Update formData state with tab data
- [x] Refactor to have form also save style for each string played
  - [x] pass style to `updateTabData`
- [x] Make controlled component for radio more dynamic (can accommodate more than 6 strings; make it not hardcoded)
- [x] Implement user ability to update formData
  - [x] onChange event for formData
- [x] Impelemnt `save`

  - [x] set tabData of spec id to formData

- [x] Create grid layout for each string of form to enable x-axis scrolling
- [x] Implement style affectation into display interpreter
- [x] Allow editing
- [x] implement update fret style
- [x] Implement leaving notes feature for measures
- [x] Set up useContext()
- [x] Refactor for data structure of multiple tabs
- [x] remove fieldset styling
- [x] Fix header sizing
- [x] improve mobile experience
- [x] improve responsiveness css
  - [x] Padding/margins on all pages
  - [x] Create some kind of consistent container for everything
  - [x] Mobile tab menu
  - [x] Improve header in tab layout
    - [x] Back to dashboard
    - [x] top margin/padding
    - [x] two <main>'s in the body
- [x] Add defualt for when no tabs exist
