import PropTypes from "prop-types";
import {
  FastForward,
  Rewind,
  Copy,
  PencilSimple,
  XCircle,
  ColumnsPlusRight,
  Plus,
  Trash,
} from "@phosphor-icons/react";

export default function EditorControls({
  handleOpeningEditor,
  isOpen,
  movePrev,
  moveNext,
  duplicate,
  deleteFrame,
  insertFrame,
  insertMeasure,
}) {
  const baseButton =
    "border border-none p-2 font-medium rounded grid place-items-center duration-150 ease-in-out";

  const buttonStyles = `${baseButton} hover:bg-neutral-700`;
  const editButtonStyle = `${baseButton} bg-neutral-100 text-neutral-700 hover:text-neutral-700 hover:bg-neutral-300`;

  const iconSize = 16;
  return (
    <div className="tf-editor-controls flex flex-wrap gap-4 my-2 place-content-center">
      <button className={editButtonStyle} onClick={handleOpeningEditor}>
        {isOpen ? (
          <XCircle size={iconSize} />
        ) : (
          <PencilSimple size={iconSize} />
        )}
      </button>

      <button className={buttonStyles} onClick={movePrev}>
        <span className="hidden">Previous Position</span>
        <Rewind size={iconSize} />
      </button>
      <button className={buttonStyles} onClick={moveNext}>
        <span className="hidden">Next Position</span>
        <FastForward size={iconSize} />
      </button>
      <button className={buttonStyles} onClick={insertFrame}>
        <span className="hidden">New Frame</span>
        <Plus size={iconSize} />
      </button>
      <button className={buttonStyles} onClick={insertMeasure}>
        <div className="flex">
          <span className="hidden">New Measure</span>
          <ColumnsPlusRight size={iconSize} />
        </div>
      </button>
      <button className={buttonStyles} onClick={duplicate}>
        <span className="hidden">Duplicate Frame</span>
        <Copy size={iconSize} />
      </button>
      <button className={buttonStyles} onClick={deleteFrame}>
        <Trash size={iconSize} />
      </button>
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
