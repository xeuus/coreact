import { fetch, save, service } from '../src';

@service
export class Home {
	@fetch(async function () {
		return 34;
	})
	index: number = 0;

	@fetch(async function () {
		this.hello = 23;
		return 'as Nolan';
	})
	name: string = 'home';


	@save hello: string = '234';
}

