import { createModel, User as BaseUserInterface } from "../../../lib";

export interface User extends BaseUserInterface {
    firstName: string;
    lastName: string;
}

export default createModel<User, User>(
	"user",
	{
		firstName: {type: String},
		lastName: {type: String},
	},
	{
		requestFilter: async (_user) => {
			return {}
		},
		request: async (doc, user) => {
			if(user) {
				return {
					userName: doc.userName,
					firstName: doc.firstName,
					lastName: doc.lastName,
					roles: doc.roles,
					created_at: doc.created_at
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
