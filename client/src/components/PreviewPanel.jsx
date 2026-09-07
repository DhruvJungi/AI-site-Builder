import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack } from "@codesandbox/sandpack-react";
import { useAppContext } from "../context/AppContext";
import { detectDependencies } from "../utils/sandpackUtils";
import SandpackErrorMonitor from "./SandpackErrorMonitor";

function SandpackFileWatcher({ onLiveFilesChange }) {
  const { sandpack } = useSandpack();
  const { activeProject, updateProjectFiles } = useAppContext();
  const projectRef = useRef(activeProject);

  useEffect(() => { projectRef.current = activeProject; }, [activeProject]);
  useEffect(() => {
    const project = projectRef.current;
    if (!project) return;
    const updatedFiles = Object.fromEntries(Object.entries(sandpack.files).map(([path, file]) => [path, file.code]));
    const hasChanges = Object.entries(updatedFiles).some(([path, code]) => {
      const original = project.files[path];
      return (typeof original === "string" ? original : original?.content) !== code;
    });
    onLiveFilesChange(updatedFiles);
    if (hasChanges) updateProjectFiles(updatedFiles);
  }, [sandpack.files, onLiveFilesChange, updateProjectFiles]);
  return null;
}

const PreviewPanel = ({ project, activeFile, showCode }) => {
  const [showErrorOverlay, setShowErrorOverlay] = useState(true);
  const [liveFiles, setLiveFiles] = useState(project.files || {});
  const projectKey = `${project._id}-${project.version}`;

  useEffect(() => { setLiveFiles(project.files || {}); }, [projectKey, project.files]);
  const handleLiveFilesChange = useCallback((newFiles) => {
    setLiveFiles((previous) => JSON.stringify(previous) === JSON.stringify(newFiles) ? previous : newFiles);
  }, []);
  const sandpackFiles = useMemo(() => Object.fromEntries(Object.entries(liveFiles).map(([path, content]) => [path, { code: typeof content === "string" ? content : content?.content || "", active: path === activeFile }])), [liveFiles, activeFile]);
  const dependencies = useMemo(() => detectDependencies(liveFiles), [liveFiles]);

  return <div className="h-full w-full"><SandpackProvider key={projectKey} template="react" files={sandpackFiles} customSetup={{ dependencies }} options={{ externalResources: ["https://cdn.tailwindcss.com"], classes: { "sp-wrapper": "sp-wrapper", "sp-layout": "sp-layout", "sp-preview": "sp-preview" }, logLevel: 0 }}>
    <SandpackFileWatcher onLiveFilesChange={handleLiveFilesChange} />
    <SandpackErrorMonitor onErrorChange={setShowErrorOverlay} />
    <SandpackLayout style={{ height: "100%", border: "none", borderRadius: 0, background: "transparent" }}>
      {showCode && <SandpackCodeEditor showTabs showLineNumbers showInlineErrors wrapContent style={{ height: "100%", flex: 1, minWidth: 0 }} />}
      <SandpackPreview showNavigator={false} showRefreshButton showOpenInCodeSandbox={false} showSandpackErrorOverlay={showErrorOverlay} style={{ height: "100%", flex: showCode ? 1 : 2, minWidth: 0 }} />
    </SandpackLayout>
  </SandpackProvider></div>;
};

export default PreviewPanel;
