import mongoose, { FilterQuery, Model, Document as MongooseDocument} from "mongoose";
import User from "./classes/User.class"
import Document from "./classes/Document.class"
import { ObjectId } from ".";
import SocketConnection from "./classes/SocketConnection.class";

//////////////////////////////////////////////////////////////////////////////////////////:
//////////////////////////////////////////////////////////////////////////////////////////:
//////////////////////////////////////////////////////////////////////////////////////////:
//////////////////////////////////////////////////////////////////////////////////////////:
//////////////////////////////////////////////////////////////////////////////////////////:

export declare type RepoControllerType = "post" | "patch" | "remove" | "archive" | "destroy" | "unarchive" | "restore" | "getAll" | "getArchives" | "getRemoved"

export declare type RepoControllersArgumentsTypes<DocType extends Document> = {
	getAll: undefined,
	getArchives: undefined,
	getRemoved: undefined,
	archive: string[]
	unarchive: string[]
	remove: string[]
	restore: string[]
	destroy: string[]
	patch: (Partial<DocType> & {_id: string})[]
	post: (Partial<DocType> & {_id: string})[]
}

export declare type RepoControllersReturnTypes<DocType extends Document> = {
	getAll: (Partial<DocType> & {_id: string})[],
	getArchives: (Partial<DocType> & {_id: string})[],
	getRemoved: (Partial<DocType> & {_id: string})[],
	archive: string[],
	unarchive: string[],
	remove: string[],
	restore: string[],
	destroy: string[],
	patch: (Partial<DocType> & {_id: string})[],
	post: (Partial<DocType> & {_oldId: string, _id: string})[],
}

// Delete a property from a type (used to delete password from user, to send it to the client)
export declare type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>


export declare type SafeUser<UserType extends User> = Omit<UserType, "password"> & {hasPassword: boolean}

// Requêtes

export declare type Method<UserType extends User, RequestData, ResponseData> = (
	request: Request<UserType, RequestData>,
	response: Response<ResponseData>
) => void

/**
 * Les requête sont les objets reçues par tous les controlleurs et contiennent toutes les
 * données envoyées par le client, ainsi que l'objet utilisateur de l'auteur de la requête
 * @typeParam T Type de document
 * @typeParam R Propriétées spécifiques à la requête
 *
 */
export declare type Request<UserType extends User, RequestData> = {
	// L'utilisateur est donné dans la requête si l'authentification est obligatoire
	connection: SocketConnection<UserType>;
	data: RequestData
}


/**
 * La réponse se fait sous forme de promesse.
 * Appeler resolve pour accepter la requête, ou reject pour la refuser.
 */
export declare type Response<ResponseData, DocType = any> = {
	resolve: (result: ResponseData) => void;
	reject: (result: string, errorData?: any) => void;
	dispatch: <DType extends Document, Type extends RepoControllerType>(
		repoName: string,
		type: Type,
		data: RepoControllersReturnTypes<DType>[Type]
	) => void;
};

//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

export declare type PermissionType = "request" | "post" | "patch" | "remove" | "archive" | "destroy";

/**
 * Les permissions des utilisateurs sur une factory.
 */
export declare type Permissions<UserType extends User, DocType extends Document> = {
	/**
	 * Fonction qui renvoie un filtre de recherche en fonction de l'utilisateur afin d'accélérer la recherche pour un getAll, et d'en limiter la taille.
	 * Appelée pour les getAll.
	 * @param user L'utilisateur•trice qui a émit la demande. null si l'utilisateur•ice n'est pas connecté•e.
	 * @returns Un filtre de requête mongoose. null si la requête est refusée. Voir la doc : https://mongoosejs.com/docs/tutorials/query_casting.html
	 */
	requestFilter?: (user: SafeUser<UserType> | null) => Promise<FilterQuery<DocType>>;
	/**
	 * Fonction qui vérifie qu'un•e utilisateur•trice ait bien le droit d'accéder à un document demandé.
	 * @param user L'utilisateur•trice qui a émit la demande. null si l'utilisateur•ice n'est pas connecté•e.
	 * @param doc Le document mongoose demandé.
	 * @returns Le document, ou une partie du document, sous forme d'objet pur javascript. C'est ce qui sera envoyé au client. null si la requête est refusée.
	 */
	request?: (user: SafeUser<UserType> | null, doc: DocType) => Promise<Partial<DocType> | null>;
	/**
	 * Fonction qui vérifie qu'un•e utilisateur•ice ait bien le droit de créer le nouveau document demandé.
	 * @param user L'utilisateur•trice qui a émit la demande. null si l'utilisateur•ice n'est pas connecté•e.
	 * @param doc Le document que l'utilisateur•trice souhaite créer.
	 * @returns Le document, ou une partie du document, sous forme d'objet pur javascript. C'est ce qui sera enregistré sur le serveur. null si la requête est refusée.
	 */
	post?: (user: SafeUser<UserType> | null, doc: (Partial<DocType> & {_id: string})) => Promise<Partial<DocType> | null>;
	/**
	 * Fonction qui vérifie qu'un•e utilisateur•ice ait bien le droit de modifier les propriétés données d'un document donné.
	 * @param user L'utilisateur•trice qui a émit la demande. null si l'utilisateur•ice n'est pas connecté•e.
	 * @param currentDoc Le document que l'utilisateur•trice souhaite modifier, dans son état actuel dans la base de données.
	 * @param patch Les modifications que l'utilisateur•trice souhaite apporter au document.
	 * @returns Les modifications qui sont acceptées. null si la requête est refusée.
	 */
	patch?: (user: SafeUser<UserType> | null, currentDoc: DocType, patch: (Partial<DocType> & {_id: string})) => Promise<Partial<DocType> | null>;
	/**
	 * Fonction qui vérifie qu'un•e utilisateur•ice ait bien le droit de supprimer un document donné.
	 * @param user L'utilisateur•trice qui a émit la demande. null si l'utilisateur•ice n'est pas connecté•e.
	 * @param doc Le document que l'utilisateur•trice souhaite supprimmer.
	 * @returns true si l'utilisateur•ice a le droit de supprimer le document. false ou null si la requête est refusée.
	 */
	remove?: (user: SafeUser<UserType> | null, doc: DocType) => Promise<true | false | null>;
	/**
	 * Fonction qui vérifie qu'un•e utilisateur•ice ait bien le droit d'archiver un document donné.
	 * @param user L'utilisateur•trice qui a émit la demande. null si l'utilisateur•ice n'est pas connecté•e.
	 * @param doc Le document que l'utilisateur•trice souhaite supprimmer.
	 * @returns true si l'utilisateur•ice a le droit de supprimer le document. false ou null si la requête est refusée.
	 */
	archive?: (user: SafeUser<UserType> | null, doc: DocType) => Promise<true | false | null>;
	/**
	 * Fonction qui vérifie qu'un•e utilisateur•ice ait bien le droit de détruire définitivement un document donné.
	 * @param user L'utilisateur•trice qui a émit la demande. null si l'utilisateur•ice n'est pas connecté•e.
	 * @param doc Le document que l'utilisateur•trice souhaite supprimmer.
	 * @returns true si l'utilisateur•ice a le droit de supprimer le document. false ou null si la requête est refusée.
	 */
	destroy?: (user: SafeUser<UserType> | null, doc: DocType) => Promise<true | false | null>;
}

//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

export declare type ModelDeclaration<UserType extends User, DocType extends Document> = {
	name: string;
	model: Model<MongooseDocument<DocType>>
	permissions: Permissions<UserType, DocType>
}

