import { AppProvider } from '../appProvider';

export type Options = {
  matches: string[];
  assets: string[];
  gzip?: boolean;
  path: string;
  webpackOptions: any;
  provider: typeof AppProvider;
}
