import { Provider } from './app/provider';
import { clientHandler } from '../src/clientHandler';
import { container } from '../src/dependencyInjection/container';

(() => {
	const hydrate = clientHandler(Provider);
	module.hot && module.hot.accept(hydrate);
})();