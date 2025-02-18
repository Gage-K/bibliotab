import PropTypes from "prop-types";

export default function TabDisplay({ tab, position, updatePosition }) {
  console.log(position);
  return (
    // maps over all of the tab and for each moment of tab:
    //      add an onClick that updates position
    //      if position = index of moment, add current class
    //      map over the array of notes in that moment
    //          display the fretted positions in notes array

    <section className="tab-display">
      {tab.map((moment) => (
        <div
          key={moment.id}
          className={
            tab.indexOf(moment) === position
              ? "tab-current-pos tab-moment"
              : "tab-moment"
          }
          onClick={() => updatePosition(tab.indexOf(moment))}>
          {moment.notes.map((note) => (
            <p key={moment.notes.indexOf(note)}>{note.fret}</p>
          ))}
        </div>
      ))}
    </section>
  );
}

TabDisplay.propTypes = {
  tab: PropTypes.array.isRequired,
  position: PropTypes.number.isRequired,
  updatePosition: PropTypes.func.isRequired,
};
