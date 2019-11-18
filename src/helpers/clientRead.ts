import AES from 'crypto-js/aes';
import enc from 'crypto-js/enc-utf8';
import {dateTime, viewState} from './viewState';


export const clientRead = (id: string, encrypt: boolean) => {
  const element = document.getElementById(id) as HTMLInputElement;
  if (!element) {
    return null;
  }
  return encrypt  ? AES.decrypt(element.value, viewState + dateTime).toString(enc) : element.value;
};

export const clientEncrypt = (content: string, key: string, encrypt: boolean) => {
  return encrypt ? AES.encrypt(content, key).toString() : content;
};

export const clientDecrypt = (content: string, key: string, encrypt: boolean) => {
  return encrypt ? AES.decrypt(content, key).toString(enc) : content;
};
