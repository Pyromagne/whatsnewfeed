import { createContext, useContext, useEffect } from "react";

const StateContext = createContext();

export const ContextProvider = ({ children }) => {

  useEffect(()=>{
    
  },[])
  
  return (
    <StateContext.Provider
      value={{

      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);