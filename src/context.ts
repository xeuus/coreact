import React, { useContext } from 'react';

export type AppContext = {
  [key: string]: any;
};

const Context = React.createContext<AppContext>({});

export type WithContextProps = {
  children: React.ReactNode;
  update: (context: AppContext) => any;
};

export const WithContext = (props: WithContextProps) => {
  const value = useContext(Context);
  const { update, children } = props;
  update(value);
  return children;
};

export const AppContextProvider = Context.Provider;
export const AppContextConsumer = Context.Consumer;
