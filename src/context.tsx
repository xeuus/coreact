import React, {createContext, ReactNode} from "react";
import {RequestContext} from "./requestContext";

export const CoreContext = createContext<RequestContext>({} as RequestContext);
export const ContextConsumer = CoreContext.Consumer;


export function ContextProvider(props: { context: RequestContext; children: ReactNode }) {
  return <CoreContext.Provider value={props.context}>
    {props.children}
  </CoreContext.Provider>;
}
