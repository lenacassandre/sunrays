import socketIo from "socket.io";
import log from "./log";
import User from "../classes/User.class";

// Factories base controllers
import { ModelDeclaration } from "../types";

import {Request, Response, Method} from '../types';
import Document from '../classes/Document.class'


// Pour la connection socket donnée, on écoute toutes les méthodes de toutes les factories,
// En vérifiant à chaque fois les permissions.
export default function controlFactory<UserType extends User, DocType extends Document>(
	modelDeclaration: ModelDeclaration<UserType, DocType>
): {[route: string] : Method<UserType, any, any>} {
	const methods: {[route: string] : Method<UserType, any, any>} = {}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////:
	//////////////////////////////////////////////////////////////////////////////////////////////////////////:
	//////////////////////////////////////////////////////////////////////////////////////////////////////////:
	//////////////////////////////////////////////////////////////////////////////////////////////////////////:
	//////////////////////////////////////////////////////////////////////////////////////////////////////////:
	// GET ALL

	methods[modelDeclaration.name + '/getAll'] = async (
		req: Request<UserType, undefined>,
		res: Response<(Partial<DocType> & {_id: string})[]>
	) => {
		try {
			let queryFilter = {};

			if(modelDeclaration.permissions.requestFilter) {
				queryFilter = await modelDeclaration.permissions.requestFilter(req.connection.user); // Demande un query filter pour accélérer la requête
			}

			if(queryFilter === null) { // La requête a été refusée.
				return res.resolve([]); // On renvoi un tableau vide.
			}

			modelDeclaration.model.find(queryFilter).lean<DocType>().exec(async (err: any, docs: DocType[]) => { // On recherche les document demandée par le queryFilter
				if(err) {
					log.error(`Error in ${modelDeclaration.name}/getAll.`, err); // Une erreur inconnue s'est produite.
					return res.resolve([]); // On retourne un tableau vide
				}
				else {
					const result: (Partial<DocType> & {_id: string})[] = []; // Le tableau qui contient tous les objects qu'on va envoyer au client.

					for(const doc of docs) { // Pour tous les documents que mongoogse a trouvé.
						try {
							const docObject = await modelDeclaration.permissions.request(req.connection.user, doc); // On laisse la fonction de permission de request de la factory nous dire si l'utilisateur•trice a le droit d'y accéder. La fonction peut également retirer certaines parties du document.

							if(docObject) { // Si un objet a été retourné, on l'ajoute au tableau des résultats.
								docObject._id = doc._id; // L'ID doit obligatoirement être envoyé
								result.push(<(Partial<DocType> & {_id: string})>docObject)
							}
						}
						catch(e) {
							log.error(`Error in ${modelDeclaration.name}/getAll en appelant ${modelDeclaration.name}.permissions.request.`, e); // Une erreur s'est produite.
						}
					}

					res.resolve(result); // On envoie le résultat au client.
				}
			})
		}
		catch(e) {
			log.error(`Error in ${modelDeclaration.name}/getAll.`, e); // Une erreur s'est produite.
			return res.resolve([]); // On renvoie un tableau vide au client.
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////////:
	/////////////////////////////////////////////////////////////////////////////////////////////////////////:
	/////////////////////////////////////////////////////////////////////////////////////////////////////////:
	/////////////////////////////////////////////////////////////////////////////////////////////////////////:
	/////////////////////////////////////////////////////////////////////////////////////////////////////////:
	// POST
	// Renvoie tous les objets que le serveur a accepté d'enregistrer. Avec la propriété "_oldId" qui permettra au client de faire le lien entre les objets qu'il a envoyé, et ceux enregistrés sur le serveur.
	methods[modelDeclaration.name + '/post'] = async (
		req: Request<UserType, {docs: (Partial<DocType> & {_id: string})[]}>,
		res: Response<{docs: (Partial<DocType> & {_oldId: string})[]}>
	) => {
		try {
			const newDocsObjects: (Partial<DocType> & {_oldId: string})[] = []; // Le tableau des nouveaux documents qui auront été acceptés par le serveur. On les renverra au client.

			for(const newDoc of req.data.docs) {
				if(newDoc._id) { // And temporary Id must have been provided.
					try {
						const newDocObject = await modelDeclaration.permissions.post(req.connection.user, newDoc); // La fonction de permission va renvoyer null, ou un objet qui devra ensuite être enregistré.


						if(newDocObject) {
							newDocObject._id = newDoc._id; // The id must be sent back

							const objectWithoutId: any = {...newDocObject};
							delete objectWithoutId._id;
							const newDocument = new modelDeclaration.model(objectWithoutId); // On crée le nouveau document mongoose.
							const savedDocument = await newDocument.save(); // On enregistre le document.

							if(!savedDocument) { // Si le document n'a pas été sauvegardé, une erreur est envoyée.
								return log.warn(`Erreur lors de la sauvegade d'un document dans ${modelDeclaration.name}/post.`)
							}

							const objectResult = {...newDocObject, _oldId : newDocObject._id}
							//@ts-ignore
							objectResult._id = savedDocument._id; // Bug Typescript/mongoose ? Le type de _id est bizarre.

							//@ts-ignore
							newDocsObjects.push(objectResult); // On ajoute la relation entre l'ancien ID et le nouveau au tableau.
						}
					}
					catch(e) {
						log.error(`Error in ${modelDeclaration.name}/post en appelant ${modelDeclaration.name}.permissions.post.`, e); // Une erreur s'est produite.
						return res.reject("Erreur."); // On renvoie un tableau vide au client.
					}
				}
			}

			if(newDocsObjects.length > 0) {
				res.resolve({docs: newDocsObjects}); // On renvie le tableau des nouveau documents avec leur propriété _oldId pour que le client les reconnaisse.
				res.dispatch<DocType>(modelDeclaration.name, "post", newDocsObjects); // On envoie le résultat aux autres clients
			} else {
				res.reject("Non autorisé")
			}
		} catch(e) {
			log.error(`Error in ${modelDeclaration.name}/post.`, e); // Une erreur s'est produite.
			return res.reject("Erreur."); // On renvoie une erreur.
		}
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////:
	//////////////////////////////////////////////////////////////////////////////////////////////////////////:
	//////////////////////////////////////////////////////////////////////////////////////////////////////////:
	//////////////////////////////////////////////////////////////////////////////////////////////////////////:
	//////////////////////////////////////////////////////////////////////////////////////////////////////////:
	// PATCH
	methods[modelDeclaration.name + '/patch'] = async (
		req: Request<UserType, {patches: (Partial<DocType> & {_id: string})[]}>,
		res: Response<{patches: (Partial<DocType> & {_id: string})[]}>
	) => {
		try {
			const docsIdsToFind = req.data.patches.map(doc => doc._id);

			const docsToPatch = await modelDeclaration.model.find()
				.where("_id")
				.in(docsIdsToFind)
				.lean<DocType>()
				.exec()

			const patches: (Partial<DocType> & {_id: string})[] = []; // Le tableau de toutes modifications qui ont été acceptées.

			for(const currentDoc of docsToPatch) {
				const patch = req.data.patches.find(p => p._id === currentDoc._id.toString())

				if(patch) {
					try {
						const authorizedPatch = await modelDeclaration.permissions.patch(req.connection.user, currentDoc, patch);

						if(authorizedPatch) {
							authorizedPatch._id = currentDoc._id
							const patchClone: any = {...authorizedPatch}
							delete patchClone._id

							await modelDeclaration.model.findByIdAndUpdate(authorizedPatch._id, patchClone); // On retire l'ID.

							patches.push(<(Partial<DocType> & {_id: string})>authorizedPatch); // On enregistre que la modification ait bien été faite.
						}
					}
					catch(e) {
						log.error(`Error in ${modelDeclaration.name}/patch en appelant ${modelDeclaration.name}.permissions.patch.`, e); // Une erreur s'est produite.
						return res.reject("Erreur."); // On renvoie un tableau vide au client.
					}
				}
			}

			if(patches.length > 0) {
				res.resolve({patches}); // On renvoie le tableau de toutes les modifications qui ont été acceptées.
				res.dispatch<DocType>(modelDeclaration.name, "patch", patches); // On envoie le résultat aux autres clients
			} else {
				res.reject("Non autorisé.");
			}
		}
		catch(e) {
			log.error(`Error in ${modelDeclaration.name}/patch.`, e); // Une erreur s'est produite.
			return res.reject("Erreur."); // On renvoie une erreur.
		}
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// DELETE
	// Renvoie un tableau des ids qui ont bien été supprimés.
	methods[modelDeclaration.name + '/delete'] = async (
		req: Request<UserType, {ids: string[], cascade?: boolean}>,
		res: Response<{ids: string[]}>
	) => {
		try {
			const docsToDelete = await modelDeclaration.model.find()
				.where("_id")
				.in(req.data.ids)
				.lean<DocType>()
				.exec()

			const deletedDocs: DocType[] = []

			for(const doc of docsToDelete) {
				try {
					const authorizedDelete = await modelDeclaration.permissions.delete(req.connection.user, doc);

					if(authorizedDelete) {
						const deletedDoc = await modelDeclaration.model.findOneAndDelete({_id: doc._id});

						if(deletedDoc) {
							deletedDocs.push(doc);
						}
					}
				}
				catch(e) {
					log.error(`Error in ${modelDeclaration.name}/delete en appelant ${modelDeclaration.name}.permissions.delete.`, e); // Une erreur s'est produite.
					return res.reject("Erreur."); // On renvoie un tableau vide au client.
				}
			}

			if(deletedDocs.length > 0) {
				res.resolve({ids: deletedDocs.map(doc => String(doc._id))})
				res.dispatch<DocType>(modelDeclaration.name, "delete", deletedDocs); // On envoie le résultat aux autres clients
			} else {
				res.reject("Non autorisé.")
			}
		}
		catch(e) {
			log.error(`Error in ${modelDeclaration.name}/delete.`, e); // Une erreur s'est produite.
			return res.reject("Erreur."); // On renvoie une erreur.
		}
	}

	return methods;
}

