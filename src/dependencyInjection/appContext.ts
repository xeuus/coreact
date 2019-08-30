import React from 'react';
import { RequestContext } from './requestContext';

export const AppContext = React.createContext<RequestContext>({});
export const AppContextProvider = AppContext.Provider;
export const AppContextConsumer = AppContext.Consumer;
