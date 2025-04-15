import TabForm from "./TabForm";
import EditorControls from "./EditorControls";
import PropTypes from "prop-types";

export default function Editor({
  tab,
  position,
  editorIsOpen,
  addNewFrame,
  addNewMeasure,
  deleteFrame,
  deleteMeasure,
  getEmptyFrame,
  handleOpeningEditor,
  updatePosition,
  updateTabData,
  isEditing,
  saveChanges,
}) {
  return (
    <section className="sticky top-12 border border-neutral-800 px-1 md:px-3 rounded bg-neutral-800 text-neutral-50 font-medium text-xs z-1 shadow-md">
      <EditorControls
        handleOpeningEditor={handleOpeningEditor}
        isOpen={editorIsOpen}
        movePrev={() => updatePosition(position.measure, position.frame - 1)}
        moveNext={() => updatePosition(position.measure, position.frame + 1)}
        duplicate={() => addNewFrame(position.measure, position.frame, false)}
        deleteFrame={() => deleteFrame(position.frame, position.measure)}
        deleteMeasure={() => deleteMeasure(position.measure)}
        insertFrame={() => addNewFrame(position.measure, position.frame, true)}
        insertMeasure={() => addNewMeasure(position.measure + 1)}
        isEditing={isEditing}
        saveChanges={() => saveChanges()}></EditorControls>

      {editorIsOpen && (
        <TabForm
          tab={tab}
          updateTabData={updateTabData}
          measure={position.measure}
          frame={position.frame}
          getEmptyFrame={getEmptyFrame}
          addNewFrame={addNewFrame}
          deleteTab={deleteFrame}
        />
      )}
    </section>
  );
}

Editor.propTypes = {
  tab: PropTypes.object.isRequired,
  position: PropTypes.object.isRequired,
  editorIsOpen: PropTypes.bool.isRequired,
  addNewFrame: PropTypes.func.isRequired,
  addNewMeasure: PropTypes.func.isRequired,
  deleteFrame: PropTypes.func.isRequired,
  deleteMeasure: PropTypes.func.isRequired,
  getEmptyFrame: PropTypes.func.isRequired,
  handleOpeningEditor: PropTypes.func.isRequired,
  updatePosition: PropTypes.func.isRequired,
  updateTabData: PropTypes.func.isRequired,
};
