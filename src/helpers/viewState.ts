import {isClient} from './isClient';

export let viewState: string = '';
export let dateTime: string = '';
export let token: string = '';
export let baseUrl: string = '';

export const readMeta = (metaId: string) => {
  const element = document.getElementById(metaId);
  if (!element) {
    return null;
  }
  return element.getAttribute('content');
};

(() => {
  if (isClient()) {
    viewState = readMeta('app-view-state');
    token = readMeta('app-token');
    dateTime = readMeta('app-date-time');
    baseUrl = readMeta('app-base-url');
  }
})();
