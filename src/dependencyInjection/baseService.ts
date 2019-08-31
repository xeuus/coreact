import { RequestContext } from "./requestContext";

export class BaseService {
	context: RequestContext;
	constructor(context: RequestContext){
		this.context = context;
	}
	instantiate(){
	}
	mount(){
	}
	unmount(){
	}
	
}
