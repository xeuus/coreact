import {isClient} from './isClient';

export let viewState: string = '';
export let dateTime: string = '';
export let token: string = '';
export let baseUrl: string = '';
export let apiAddress: string = '';
export let apiPrefix: string = '';

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
    apiAddress = readMeta('app-api-address');
    apiPrefix = readMeta('app-api-prefix');
  }
})();
