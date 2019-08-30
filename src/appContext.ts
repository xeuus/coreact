import React, { useContext } from 'react';

export type ApplicationContext = {
  url?: string;
  services?: any
  [key: string]: any;
};



export const AppContext = React.createContext<ApplicationContext>({});

export type WithContextProps = {
  children: React.ReactNode;
  update: (context: ApplicationContext) => any;
};

export const WithContext = (props: WithContextProps) => {
  const value = useContext(AppContext);
  const { update, children } = props;
  update(value);
  return children;
};

export const AppContextProvider = AppContext.Provider;
export const AppContextConsumer = AppContext.Consumer;
