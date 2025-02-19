# To Do

## Misc.

- [ ] Remove testing defaults (defaultTab.json references)

## App Wide

- [ ] Refactor to allow for measure grouping
  - [x] Update default data to reflect this
  - [ ] Display measure start and end
  - [ ] Update buttons in TabDisplay
  - [ ] Update position (maybe as measure and then frame)
  - [ ] Update functions in TabForm
  - [ ] Update user controls in App

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
