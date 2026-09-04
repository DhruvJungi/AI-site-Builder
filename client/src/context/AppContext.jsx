import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const AppContext = createContext(undefined);

export function AppCOntextProvider({ children }) {

    // Auth States
    const [user, setUser] = useState(null)
    const [loadingUser, setLoadingUser] = useState(true);

    // Auth Actions
    const checkSession = async () =>{
        try {
            const { data } = await api.get("/api/auth/me");
            setUser(data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setLoadingUser(false);
        }
    }

    useEffect(() => {
        checkSession()
    }, [])

  return (
    <AppContext.Provider value={{
        user,
        loadingUser,
        setUser
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within a AppContextProvider");
  }
  return context;
}
