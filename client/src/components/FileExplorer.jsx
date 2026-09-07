import { FileCodeIcon, FileTextIcon, FolderOpenIcon } from "lucide-react";
import { useMemo } from "react";

function buildTree(paths) {
  const root = [];
  for (const filePath of [...paths].sort()) {
    const parts = filePath.split("/").filter(Boolean);
    let current = root;
    for (let index = 0; index < parts.length; index += 1) {
      const name = parts[index];
      const isLast = index === parts.length - 1;
      const fullPath = `/${parts.slice(0, index + 1).join("/")}`;
      let existing = current.find((node) => node.name === name);
      if (!existing) {
        existing = { name, path: fullPath, isDir: !isLast, children: [] };
        current.push(existing);
      }
      current = existing.children;
    }
  }
  return root;
}

function getFileIcon(name) {
  if (name.endsWith(".css")) return <FileTextIcon size={14} className="text-sky-500" />;
  if (name.endsWith(".jsx") || name.endsWith(".js")) return <FileCodeIcon size={14} className="text-amber-500" />;
  if (name.endsWith(".json")) return <FileTextIcon size={14} className="text-emerald-500" />;
  return <FileTextIcon size={14} className="text-zinc-400" />;
}

function TreeItem({ node, activeFile, onFileSelect, depth = 0 }) {
  const isActive = node.path === activeFile;
  const indent = { paddingLeft: `${depth * 12 + 8}px` };
  if (node.isDir) return <div><div className="flex items-center gap-2 py-1 px-2 text-xs text-zinc-400 select-none" style={indent}><FolderOpenIcon size={14} className="text-zinc-500 opacity-60" /><span>{node.name}</span></div>{node.children.map((child) => <TreeItem key={child.path} node={child} activeFile={activeFile} onFileSelect={onFileSelect} depth={depth + 1} />)}</div>;
  return <button type="button" onClick={() => onFileSelect(node.path)} className={`w-full flex items-center gap-2 py-1.5 px-2 text-xs transition-colors rounded-md cursor-pointer ${isActive ? "bg-zinc-100 text-zinc-950 font-medium" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"}`} style={indent}>{getFileIcon(node.name)}<span className="truncate">{node.name}</span></button>;
}

const FileExplorer = ({ files = {}, activeFile, onFileSelect }) => {
  const tree = useMemo(() => buildTree(Object.keys(files)), [files]);
  return <div className="py-2 overflow-y-auto hide-scrollbar"><p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Files</p>{tree.map((node) => <TreeItem key={node.path} node={node} activeFile={activeFile} onFileSelect={onFileSelect} />)}</div>;
};

export default FileExplorer;
