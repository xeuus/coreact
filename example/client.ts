import { Provider } from './provider';
import { clientHandler } from '../src';

module.hot && module.hot.accept(clientHandler(Provider));
