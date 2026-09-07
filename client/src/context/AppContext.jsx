import React,{ createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";
import debounce from "lodash.debounce";

const AppContext = createContext(undefined);

export function AppContextProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [loadingActiveProject, setLoadingActiveProject] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [generatingProject, setGeneratingProject] = useState(false);
  const [activeFile, setActiveFile] = useState("/App.js");
  const [showCode, setShowCode] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    setUser(data.user);
    navigate("/");
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/api/auth/register", { name, email, password });
    setUser(data.user);
    navigate("/");
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
      setUser(null);
      setProjects([]);
      setActiveProject(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Unable to log out. Please try again.");
    }
  };

  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      return;
    }

    setLoadingProjects(true);
    try {
      const { data } = await api.get("/api/projects");
      setProjects(data);
    } catch (error) {
      console.error("Failed to list projects:", error);
      toast.error("Failed to load projects.");
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);

  const loadProject = useCallback(async (id, silent = false) => {
    if (!user || !id) return;
    if (!silent) setLoadingActiveProject(true);

    try {
      const { data } = await api.get(`/api/projects/${id}`);
      setActiveProject(data);
      const files = Object.keys(data.files || {});
      if (files.length > 0) {
        setActiveFile((current) => files.includes(current) ? current : files.includes("/App.js") ? "/App.js" : files[0]);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      if (!silent) {
        toast.error("Failed to load project details.");
        navigate("/");
      }
    } finally {
      if (!silent) setLoadingActiveProject(false);
    }
  }, [navigate, user]);

  const handleGenerate = useCallback(async (prompt) => {
    if (!user || !prompt?.trim()) return;

    setGeneratingProject(true);
    try {
      const { data } = await api.post("/api/projects", { prompt });
      await loadProjects();
      navigate(`/builder/${data._id}`);
    } catch (error) {
      console.error("Failed to generate project:", error);
      toast.error("Failed to generate project.");
    } finally {
      setGeneratingProject(false);
    }
  }, [loadProjects, navigate, user]);

  const handleDelete = useCallback(async (id) => {
    if (!user || !id) return;

    try {
      await api.delete(`/api/projects/${id}`);
      setProjects((current) => current.filter((project) => project._id !== id));
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project.");
    }
  }, [user]);

  const handleChat = useCallback(
    async (prompt)=>{
      if(!activeProject || !user) return;
      setChatLoading(true)
      try {
        const { data } = await api.post(`/api/projects/${activeProject._id}/chat`, {prompt});
        setActiveProject(data)
        if(data.errors && data.errors.length > 0 ){
          toast.error(`${data.errors.length} revision patch(es) failed`);
        } else{
          toast.success(`Updated to version ${data.version}`);
        }
      }catch (err){
        console.error("Revision request failed:", err);
        toast.error(err?.response?.data?.error || "Revision request failed");
      }finally{
        setChatLoading(false)
      }

    },[activeProject, user]
  )

  const debouncedSave = React.useMemo(
    ()=>debounce(async (files, id) => {
      try {
        await api.put(`/api/projects/${id}/files`, { files });
      } catch (err) {
        console.error("Failed to auto-save files:", err);
        toast.error("Failed to save code modification");
      }
    },1000),[],
  )

  useEffect(() => {
    return ()=>{
      debouncedSave.cancel();
    }
  }, [debouncedSave]);

  const updateProjectFiles = useCallback(
    async (files) => {
      if(!activeProject || !user ) return;
      debouncedSave(files, activeProject._id)
    },[activeProject, user, debouncedSave]
  )

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      loadingUser,
      login,
      register,
      logout,
      projects,
      loadingProjects,
      loadProjects,
      activeProject,
      loadingActiveProject,
      loadProject,
      chatLoading,
      setChatLoading,
      handleChat,
      generatingProject,
      handleGenerate,
      handleDelete,
      activeFile,
      setActiveFile,
      showCode,
      setShowCode,
      updateProjectFiles
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
