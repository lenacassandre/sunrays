import User from "../classes/User.class";

// Factories base controllers
import { ModelDeclaration } from "../types";

import {Method} from '../types';
import Document from '../classes/Document.class'

import {archive} from './archive'
import {unarchive} from './unarchive'

import {remove} from './remove'
import {restore} from './restore'

import {destroy} from './destroy'
import {getAll} from './getAll'
import {getArchives} from './getArchives'
import {getRemoved} from './getRemoved'
import {patch} from './patch'
import {post} from './post'

// TODO : factoriser les repository controllers qui comportent beaucoup trop d'étapes redondantes

// Pour la connection socket donnée, on écoute toutes les méthodes de toutes les factories,
// En vérifiant à chaque fois les permissions.
export default function controlFactory<UserType extends User, DocType extends Document>(
	modelDeclaration: ModelDeclaration<UserType, DocType>
): {[route: string] : Method<UserType, any, any>} {
	const methods: {[route: string] : Method<UserType, any, any>} = {}

	methods[modelDeclaration.name + '/getAll'] = getAll(modelDeclaration);
	methods[modelDeclaration.name + '/getArchives'] = getArchives(modelDeclaration);
	methods[modelDeclaration.name + '/getRemoved'] = getRemoved(modelDeclaration);

	methods[modelDeclaration.name + '/archive'] = archive(modelDeclaration);
	methods[modelDeclaration.name + '/unarchive'] = unarchive(modelDeclaration);
	methods[modelDeclaration.name + '/remove'] = remove(modelDeclaration);
	methods[modelDeclaration.name + '/restore'] = restore(modelDeclaration);

	methods[modelDeclaration.name + '/post'] = post(modelDeclaration);
	methods[modelDeclaration.name + '/patch'] = patch(modelDeclaration);
	methods[modelDeclaration.name + '/destroy'] = destroy(modelDeclaration);

	return methods
}