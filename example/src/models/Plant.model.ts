import { createModel, Document } from "../../../";
import {User} from './User.model'

export interface Plant extends Document {
    name: string;
    leafAmount: number;
}

export default createModel<User, Plant>(
	"plant",
	{
		name: {type: String},
        leafAmount: {type: Number}
	},
	{
		requestFilter: async (_user) => {
			return {}
		},
		request: async (user, doc) => {
			if(user) {
				return {
					name: doc.name,
                    leafAmount: doc.leafAmount
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
