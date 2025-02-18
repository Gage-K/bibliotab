# To Do

## Misc.

- [ ] Remove testing defaults (defaultTab.json references)

## Tab Display

- [x] Finish tab display for all tab
- [x] Conditionally render background color based on if current position
- [x] Have current position update onClick
- [x] Add hover styling
- [ ] Implement a11y labels

## Tab Form

- [x] Init Form
- [ ] Create formData state
- [ ] Load tab data into form from current pos
- [ ] Update formData state with tab data
- [ ] Implement `clear`
  - [ ] set formData frets & style to `null`
  - [ ] update formData
- [ ] Impelemnt `save`
  - [ ] set tabData of spec id to formData
- [ ] Implement `delete`
  - [ ] remove tabData of spec id
- [ ] Implement user ability to update formData
  - [ ] onChange event for formData
- [ ] Allow for different number of strings to be selected
  - [ ] Automatically render fieldsets based on number of strings
- [ ] Refactor to have form also save style for each string played
  - [ ] pass style to `updateTabData`
- [ ] Make controlled component for radio more dynamic (can accommodate more than 6 strings; make it not hardcoded)
