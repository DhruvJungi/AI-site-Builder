import { useEffect, useState } from "react";
import { FolderTreeIcon, MessageSquareIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import api from "../api/api";
import { exportProjectZip } from "../utils/exportProject";
import BuilderHeader from "../components/BuilderHeader";
import ChatPanel from "../components/ChatPanel";
import FileExplorer from "../components/FileExplorer";
import Loading from "../components/Loading";
import PreviewPanel from "../components/PreviewPanel";
import PublishModal from "../components/PublishModal";

const BuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeProject, loadingActiveProject, activeFile, showCode, setActiveFile, setShowCode, loadProject, logout, chatLoading, handleChat } = useAppContext();
  const [leftTab, setLeftTab] = useState("chat");
  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState(null);

  useEffect(() => { if (id) loadProject(id); }, [id, loadProject]);
  useEffect(() => {
    if (!id || !activeProject || !["pending", "generating"].includes(activeProject.status)) return undefined;
    const interval = setInterval(() => loadProject(id, true), 1500);
    return () => clearInterval(interval);
  }, [id, loadProject, activeProject]);
  const handlePublish = async () => {
    if (!id) return;
    setPublishing(true);
    try { await api.post(`/api/projects/${id}/publish`); setPublishUrl(`${window.location.origin}/publish/${id}`); }
    catch { toast.error("Failed to publish project."); }
    finally { setPublishing(false); }
  };
  if (loadingActiveProject || !activeProject) return <Loading />;
  return <div className="h-screen flex flex-col bg-white overflow-hidden text-zinc-900 relative"><BuilderHeader projectName={activeProject.name} version={activeProject.version} showCode={showCode} publishing={publishing} onToggleShowCode={() => setShowCode(!showCode)} onOpenPreview={() => window.open(`/preview/${id}`, "_blank", "noopener,noreferrer")} onPublish={handlePublish} onDownload={() => exportProjectZip(activeProject)} onBack={() => navigate("/")} onLogout={logout} /><div className="flex-1 flex overflow-hidden"><div className="w-[320px] shrink-0 flex flex-col border-r border-zinc-200 bg-white"><div className="flex border-b border-zinc-100"><button type="button" onClick={() => setLeftTab("chat")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer ${leftTab === "chat" ? "text-zinc-900 border-b-2 border-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}><MessageSquareIcon size={13} /> Chat</button><button type="button" onClick={() => setLeftTab("files")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer ${leftTab === "files" ? "text-zinc-900 border-b-2 border-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}><FolderTreeIcon size={13} /> Files</button></div><div className="flex-1 overflow-hidden">{leftTab === "chat" ? <ChatPanel messages={activeProject.messages || []} onSend={handleChat} loading={chatLoading} /> : <FileExplorer files={activeProject.files} activeFile={activeFile} onFileSelect={(path) => { setActiveFile(path); setShowCode(true); }} />}</div></div><div className="flex-1 overflow-hidden">{["pending", "generating", "failed"].includes(activeProject.status) ? <Loading /> : <PreviewPanel project={activeProject} activeFile={activeFile} showCode={showCode} />}</div></div><PublishModal publishUrl={publishUrl} onClose={() => setPublishUrl(null)} /></div>;
};

export default BuilderPage;
