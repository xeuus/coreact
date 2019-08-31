import React from 'react';
import { RequestContext } from './requestContext';

export const AppContext = React.createContext<RequestContext>({
	observers: {},
	services: {},
	url: '/',
});
export const AppContextProvider = AppContext.Provider;
export const AppContextConsumer = AppContext.Consumer;
