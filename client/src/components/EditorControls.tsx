import {
  FastForwardIcon,
  RewindIcon,
  CopyIcon,
  PencilSimpleIcon,
  XCircleIcon,
  ColumnsPlusRightIcon,
  PlusIcon,
  TrashIcon,
  FloppyDiskIcon,
  CheckIcon,
  RowsPlusBottomIcon,
  ArrowsDownUpIcon,
} from "@phosphor-icons/react";
import { useTabEditor } from "../context/tabEditorProvider";
import { KeybindDialog } from "./KeybindDialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

export default function EditorControls() {
  const {
    tab,
    position,
    editorIsOpen,
    isEditing,
    isSaving,
    isDemo,
    handleOpeningEditor,
    updatePosition,
    addFrameAndAdvance,
    deleteFrame,
    addNewMeasure,
    addSection,
    moveMeasure,
    saveChanges,
  } = useTabEditor();

  const { section, measure, frame } = position;
  const currentSection = tab.sections[section];
  const measureCount = currentSection?.measures.length ?? 0;

  const movePrev = () => updatePosition(section, measure, frame - 1);
  const moveNext = () => updatePosition(section, measure, frame + 1);
  const duplicate = () => addFrameAndAdvance(section, measure, frame, false);
  const insertFrame = () => addFrameAndAdvance(section, measure, frame, true);
  const insertMeasure = () => addNewMeasure(section, measure + 1);
  const handleDeleteFrame = () => deleteFrame(section, measure, frame);
  const handleAddSection = () =>
    addSection(section + 1, `Section ${tab.sections.length + 1}`);

  // A section always keeps at least one measure, so its only measure can't leave.
  const canMoveOut = measureCount > 1;

  const baseButton =
    "border border-none p-2 font-medium rounded grid place-items-center duration-150 ease-in-out size-8 cursor-pointer";

  const buttonStyles = `${baseButton} hover:bg-foreground/10`;
  const saveButtonStyle = isEditing
    ? `${baseButton} bg-yellow-800 text-yellow-200 hover:bg-yellow-900`
    : `${baseButton}`;
  const editButtonStyle = `${baseButton} bg-secondary text-secondary-foreground hover:bg-secondary/80`;

  const iconSize = 16;
  return (
    <div className="flex justify-between p-2 place-content-center">
      <div className="tf-editor-controls flex flex-wrap gap-3">
        <button className={editButtonStyle} onClick={handleOpeningEditor}>
          {editorIsOpen ? (
            <XCircleIcon size={iconSize} />
          ) : (
            <PencilSimpleIcon size={iconSize} />
          )}
        </button>

        <button className={buttonStyles} onClick={movePrev}>
          <span className="hidden">Previous Position</span>
          <RewindIcon size={iconSize} />
        </button>
        <button className={buttonStyles} onClick={moveNext}>
          <span className="hidden">Next Position</span>
          <FastForwardIcon size={iconSize} />
        </button>
        <button className={buttonStyles} onClick={insertFrame}>
          <span className="hidden">New Frame</span>
          <PlusIcon size={iconSize} />
        </button>
        <button className={buttonStyles} onClick={insertMeasure}>
          <div className="flex">
            <span className="hidden">New Measure</span>
            <ColumnsPlusRightIcon size={iconSize} />
          </div>
        </button>
        <button className={buttonStyles} onClick={duplicate}>
          <span className="hidden">Duplicate Frame</span>
          <CopyIcon size={iconSize} />
        </button>
        <button className={buttonStyles} onClick={handleDeleteFrame}>
          <TrashIcon size={iconSize} />
        </button>

        <button
          className={buttonStyles}
          onClick={handleAddSection}
          title="Add section after this one">
          <span className="sr-only">Add section</span>
          <RowsPlusBottomIcon size={iconSize} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={buttonStyles} title="Move this measure">
              <span className="sr-only">Move measure</span>
              <ArrowsDownUpIcon size={iconSize} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-52">
            <DropdownMenuLabel className="text-xs">
              Move measure {measure + 1}
            </DropdownMenuLabel>
            <DropdownMenuItem
              disabled={measure === 0}
              onSelect={() =>
                moveMeasure(
                  { section, measure },
                  { section, measure: measure - 1 }
                )
              }>
              Earlier in this section
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={measure >= measureCount - 1}
              onSelect={() =>
                moveMeasure(
                  { section, measure },
                  { section, measure: measure + 1 }
                )
              }>
              Later in this section
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">To section</DropdownMenuLabel>
            {tab.sections.map((target, targetIndex) =>
              targetIndex === section ? null : (
                <DropdownMenuItem
                  key={target.id}
                  disabled={!canMoveOut}
                  onSelect={() =>
                    moveMeasure(
                      { section, measure },
                      { section: targetIndex, measure: target.measures.length }
                    )
                  }>
                  {target.name || `Section ${targetIndex + 1}`}
                </DropdownMenuItem>
              )
            )}
            {tab.sections.length === 1 && (
              <DropdownMenuItem disabled>No other sections</DropdownMenuItem>
            )}
            {tab.sections.length > 1 && !canMoveOut && (
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                A section keeps its last measure
              </DropdownMenuLabel>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex gap-2">
        <KeybindDialog />
        {!isDemo && (
          <button
            className={`${saveButtonStyle} ${isSaving && `animate-pulse`} `}
            onClick={() => saveChanges()}
            disabled={!isEditing || isSaving}>
            {isEditing ? (
              <>
                <FloppyDiskIcon size={iconSize} />{" "}
                <span className="sr-only">Save changes</span>
              </>
            ) : (
              <>
                <CheckIcon size={iconSize} />{" "}
                <span className="sr-only">Up to date</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
