import PropTypes from "prop-types";

export default function TabDisplay({ tab }) {
  console.log(tab[0]);
  return (
    // maps over all of the tab
    // for each moment of the tab, map over the array of notes in that moment
    // display the fretted positions in notes array
    <section className="tab-display">
      {tab.map((moment) => (
        <div key={moment.id}>
          {moment.notes.map((note) => (
            <p key={moment.notes.indexOf(note)} className="tab-moment">
              {note.fret}
            </p>
          ))}
        </div>
      ))}
    </section>
  );
}

TabDisplay.propTypes = {
  tab: PropTypes.array.isRequired,
};
