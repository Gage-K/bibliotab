import PropTypes from "prop-types";
import { CaretCircleDown, CaretCircleUp } from "@phosphor-icons/react";

export default function EditorControls({
  handleOpeningEditor,
  isOpen,
  movePrev,
  moveNext,
  duplicate,
  deleteFrame,
  deleteMeasure,
  insertFrame,
  insertMeasure,
}) {
  return (
    <div>
      <button onClick={handleOpeningEditor}>
        {isOpen ? <CaretCircleUp /> : <CaretCircleDown />}
        {isOpen ? " Close Editor" : " Open Editor"}
      </button>
      <button onClick={movePrev}>Previous Position</button>
      <button onClick={moveNext}>Next Position</button>
      <button onClick={duplicate}>Duplicate</button>
      <button onClick={deleteFrame}>Delete Frame</button>
      <button onClick={deleteMeasure}>Delete Measure</button>
      <button onClick={insertFrame}>New Frame</button>
      <button onClick={insertMeasure}>New Measure</button>
    </div>
  );
}

EditorControls.propTypes = {
  handleOpeningEditor: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  movePrev: PropTypes.func.isRequired,
  moveNext: PropTypes.func.isRequired,
  duplicate: PropTypes.func.isRequired,
  deleteFrame: PropTypes.func.isRequired,
  deleteMeasure: PropTypes.func.isRequired,
  insertFrame: PropTypes.func.isRequired,
  insertMeasure: PropTypes.func.isRequired,
};
