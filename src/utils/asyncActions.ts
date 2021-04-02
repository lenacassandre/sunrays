import { AsyncAction } from "../types";

export default function asyncAction(action: string): AsyncAction {
	return {
		DO: `${action}_DO`,
		DONE: `${action}_DONE`,
		FAIL: `${action}_FAIL`,
	};
}
