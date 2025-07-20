import { createContext, useContext, useEffect, useState } from "react";

const StateContext = createContext();

export const ContextProvider = ({ children }) => {
  const [isURI, setIsURI] = useState(false);
  const [isGrid, setIsGrid] = useState(true);
  const [recentReleases, setRecentReleases] = useState([]);

  useEffect(()=>{
    
  },[])
  
  return (
    <StateContext.Provider
      value={{
        isURI, setIsURI,
        isGrid, setIsGrid,
        recentReleases, setRecentReleases,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);