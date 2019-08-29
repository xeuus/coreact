import { Provider } from './app/provider';
import { clientHandler } from '../src/clientHandler';
const hydrate = clientHandler(Provider);
module.hot && module.hot.accept(hydrate);
