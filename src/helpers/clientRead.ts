import AES from 'crypto-js/aes';
import enc from 'crypto-js/enc-utf8';
import { dateTime, viewState } from './viewState';


export const clientRead = (id: string) => {
	const element = document.getElementById(id) as HTMLInputElement;
	if (!element) {
		return null;
	}
	return AES.decrypt(element.value, viewState + dateTime).toString(enc);
};

export const clientEncrypt = (content: string, key: string) => {
	return AES.encrypt(content, key).toString();
};

export const clientDecrypt = (content: string, key: string) => {
	return AES.decrypt(content, key).toString(enc);
};
