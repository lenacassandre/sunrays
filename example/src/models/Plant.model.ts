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
		request: async (doc, user) => {
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
		post: async (doc, user) => {
			if(user) {
				return doc
			}
			else {
				return null
			}
		},
		patch: async (_currentDoc, patch, user) => {
			if(user) {
				return patch;
			}
			else {
				return null
			}
		},
		remove: async (_doc, user) => {
			if(user) {
				return true
			}
			else {
				return null
			}
		},
		archive: async (doc, user) => true,
		destroy: async (doc, user) => true,
	},
	{}
)
