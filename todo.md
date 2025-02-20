# To Do

## Misc.

- [ ] Remove testing defaults (defaultTab.json references)

## App Wide

- [ ] Refactor to allow for measure grouping
  - [x] Update buttons in TabDisplay
  - [x] Update functions in TabForm
  - [x] Update user controls in App
  - [x] fix set position after delete
  - [x] create function to delete measure (and call function when deleted frame is last of measure)
  - [x] Update default data to reflect this
  - [x] Display measure start and end
  - [x] Update position (maybe as measure and then frame)
- [ ] Implement leaving notes feature for measures
- [x] Add comments to checkIfPositionExists() to be more readable (possibly refactor)

## Tab Display

- [ ] Implement note & chord finder
- [ ] Create a max-width for display and add wrapping

- [x] Finish tab display for all tab
- [x] Conditionally render background color based on if current position
- [x] Have current position update onClick
- [x] Add hover styling

## Tab Form

- [ ] Allow for different number of strings to be selected
- [ ] Automatically render fieldsets based on number of strings

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

## Mobile

## a11y

- [ ] Implement a11y to display
