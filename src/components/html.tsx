import React from 'react';
import { checkRtl } from '../helpers/checkRtl';

export type HtmlProps = {
  id?: string;
  beginHead?: React.ReactNode;
  endHead?: React.ReactNode;
  beginBody?: React.ReactNode;
  endBody?: React.ReactNode;
  baseUrl?: string;
  children?: string | React.ReactNode;
  locale?: string;
}

export const Html = (props: HtmlProps) => {
  const { id = 'app', locale = 'en', beginHead, endHead, beginBody, endBody, baseUrl, children } = props;
  return <html lang={locale} dir={checkRtl(locale) ? 'rtl' : 'ltr'}>
  <head>
    {beginHead}
    <meta charSet="utf-8"/>
    <meta name="baseUrl" content={baseUrl || ''}/>
    {endHead}
  </head>
  <body>
  {beginBody}
  <main id={id} dangerouslySetInnerHTML={typeof children === 'string' ? { __html: children } : undefined}>{typeof children !== 'string' ? children : undefined}</main>
  {endBody}
  </body>
  </html>;
};
