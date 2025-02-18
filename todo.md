# To Do

## Misc.

- [ ] Remove testing defaults (defaultTab.json references)

## Tab Display

- [ ] Implement a11y labels
- [ ] Implement note & chord finder

- [x] Finish tab display for all tab
- [x] Conditionally render background color based on if current position
- [x] Have current position update onClick
- [x] Add hover styling

## Tab Form

- [ ] Implement `clear`
  - [ ] set formData frets & style to `null`
  - [ ] update formData
- [ ] Implement `delete`
  - [ ] remove tabData of spec id
- [ ] Allow for different number of strings to be selected
- [ ] Automatically render fieldsets based on number of strings

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
