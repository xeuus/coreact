
import { clientHandler } from '../src';
import Provider from './provider';
const app = clientHandler(Provider)
module.hot && module.hot.accept(app);