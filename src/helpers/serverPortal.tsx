import React from 'react';
import aes from 'crypto-js/aes';

export const ServerPortal = (props: { id: string, cipher: string, data: string }) => {
	const { id, data, cipher } = props;
	return <input id={id} type="hidden" value={aes.encrypt(data, cipher).toString()}/>;
};


export const makeCipher = (cipher: string, data: string) => {
	return aes.encrypt(data, cipher).toString();
};
