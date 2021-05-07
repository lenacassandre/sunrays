import { createModel, Document } from "../../../";
import {User} from './User.model'

export interface Organization extends Document {
    name: string;
}

export default createModel<User, Organization>(
	"organization",
	{
		name: {type: String},
	},
	{
		requestFilter: async (_user) => {
			return {}
		},
		request: async (user, doc) => {
			if(user) {
				return {
					name: doc.name,
				}
			}
			else {
				return null;
			}
		},
		post: async (user, doc) => {
			if(user) {
				return doc
			}
			else {
				return null
			}
		},
		patch: async (user, _currentDoc, patch) => {
			if(user) {
				return patch;
			}
			else {
				return null
			}
		},
		remove: async (user, _doc) => {
			if(user) {
				return true
			}
			else {
				return null
			}
		},
		archive: async (user, doc) => true,
		destroy: async (user, doc) => true,
	},
	{}
)
