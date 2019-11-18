import React from 'react';
import aes from 'crypto-js/aes';

export const ServerPortal = (props: { id: string, encrypt: boolean, cipher: string, data: string }) => {
  const {id, data, cipher, encrypt} = props;

  return encrypt ? <input id={id} type="hidden" value={aes.encrypt(data, cipher).toString()}/> : <input id={id} type="hidden" value={data}/>;
};


export const makeCipher = (cipher: string, data: string) => {
  return aes.encrypt(data, cipher).toString();
};
