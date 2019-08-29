import { isClient } from './isClient';

export let viewState: any = null;
export let dateTime: any = null;
export let token: any = null;

export const readMeta = (metaId: string)=>{
  const element = document.getElementById(metaId);
  if (!element) {
    return null;
  }
  return element.getAttribute('content');
}

(()=>{
  if(isClient()) {
    viewState = readMeta('app-view-state');
    token = readMeta('app-token');
    dateTime = readMeta('app-date-time');
  }
})();
