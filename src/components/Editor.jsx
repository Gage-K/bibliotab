import { createContext } from "react";

const EditorContext = createContext();

export default function Editor() {
  return (
    <EditorContext.Provider>
      <p>Editor goes here</p>
    </EditorContext.Provider>
  );
}

export { EditorContext };
