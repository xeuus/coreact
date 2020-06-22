import {useContext, useEffect, useRef, useState} from "react";
import {RequestContext} from "./requestContext";
import {CoreContext} from "./context";
import {metadataOf} from "./shared";
import throttle from "lodash/throttle";
export function useService<T>(target: { new(container?: RequestContext): T }, passive: boolean = false): T {
  if(!passive)
	  useBus([target]);
	const container = useContext(CoreContext);
	const meta = metadataOf(target.prototype);
	return container ? container.services[meta.id] : null;
}

export function useBus(types?: { new(container?: RequestContext): any }[]) {
	const container = useContext(CoreContext);
	const upd = useState(0);
	const ref = useRef({
		released: false,
		toRelease: [],
	}).current;
	const update = useRef(throttle(() => {
		if (ref.released)
			return;
		upd[1](a => a + 1)
	}, 50)).current;

	useEffect(() => {
		if (types && types.length > 0) {
			types.forEach(typ => {
				const {id} = metadataOf(typ.prototype);
				const {observer} = metadataOf(container.services[id]);
				const listener = observer.listen(() => {
					if (ref.released || !update)
						return;
					update();
				});
				ref.toRelease.push(listener);
			});
		}
		return () => {
			ref.released = true;
			ref.toRelease.forEach(func => func());
		}
		// eslint-disable-next-line
	}, []);

}
