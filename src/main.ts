import expressServer, { Express } from "express"
import socketIo, {Server as IOServer} from "socket.io";
import http from "http";
import dotenv from "dotenv";
import log from "./utils/log";
import processListeners from "./utils/processEvents";
import connectToDB from "./utils/connectToDB";
import controlSession from "./session/controlSession";
import repositoryControllers from "./repositoryControllers";
import { Method, ModelDeclaration, RepoControllersReturnTypes, RepoControllerType } from "./types";
import User from "./classes/User.class";
import SocketConnection from "./classes/SocketConnection.class";
import checkErrorType from './utils/checkErrorType'
import dispatchChanges from "./utils/dispatchChanges";
import Document from "./classes/Document.class"


import cors from 'cors';


/////////////////////////////////////////////////////////////////////////////////////////////////////////

const options = {
	cors: {
		origin: "*"
	}
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////

class Sun<UserType extends User> {
	server: http.Server; // HTTP node server
	app: Express; // Express server
	io: IOServer; // Socket IO server
	connections: SocketConnection<UserType>[] = []; // Liste des connections socket actives
	controllers: {[route: string] : Method<UserType, any, any>} = {}; // Liste des routes/controllers
	repositories: ModelDeclaration<UserType, any>[] = []; // Liste des repositories/modèles

	constructor(dataBaseURL: string, port: number, config?: Partial<socketIo.ServerOptions>) {
		log.lb();
		log.info("✨☀️ SUNRAYS ☀️✨");
		log.lb();

		log.info("Loading environnment variables.");
		dotenv.config(); // Loading environnment variables.

		log.info("Start listening to process events.");
		processListeners(); // Start listening to process events.


		log.info("Connecting to the database.");
		connectToDB(dataBaseURL, (err: Error) => { // Connecting to the database.
			if (err) {
				log.error("Mongoose error : ", err);
			} else {
				log.success("Connected to the database.");
				this.server.listen(port);
				log.success(`Server is listening from http://127.0.0.1:${port}.`)
			}
		});

		this.controllers = {...this.controllers, ...controlSession()} // Prépare les controlleurs de session

		///////////////////////////////////////////////////////////////////////////////////////
		// SOCKETS ////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////

		log.info("Init socket server.");
		this.app = expressServer();
		this.app.use(cors())
		this.app.options("*", cors)

		this.server = http.createServer(this.app);
		this.io = new IOServer(this.server, config || {});


		log.info("Init socket errors middleware.");
		this.io.on("error", (reason: any) => { // Init socket errors middleware.
			log.error(reason); // prints the message associated with the error, e.g. "thou shall not pass" in the example above
		});

		//////////////////////////////////////////////////////////////////////////////////////////

		log.info("Init socket connection middleware.");
		this.io.on("connection", async (socket: socketIo.Socket) => { // on Socket connection
			const newConnection = new SocketConnection<UserType>(socket, socket.id.slice(0, 5)); // Nouvelle classe connection pour suivre la connection de l'utilisateur•trice

			this.connections.push(newConnection); // Enregistre la connection

			log.debug("New client", `🦊\x1b[90m ${newConnection.shortId}\x1b[0m`, "connected. Total :", this.connections.length);

			/////////////////////////////////////////////////////////////////////:

			for(const route in this.controllers) { // Ecoute les routes de tous les controlleurs
				this.listen(newConnection, route, this.controllers[route])
			}

			socket.on("disconnect", () => { // Déconnexion. On retire le client de la liste des sockets connectées
				this.connections = this.connections.filter((c) => c.socket.id !== newConnection.socket.id);
				log.debug("Client", `🦊\x1b[90m ${newConnection.shortId}\x1b[0m`, "disconnected. Total :", this.connections.length);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Handle automatic repository routes
	 * @param modelDeclaration
	 */
	public use(modelDeclaration: ModelDeclaration<UserType, any>): void
	/**
	 * Handle custom controllers
	 * @param route
	 * @param method
	 */
	public use(route: string, method: Method<UserType, any, any>): void
	public use(route_or_modelDeclaration: string | ModelDeclaration<UserType, any>, method?: Method<UserType, any, any>) {
		///////////////////////////////////////////////////////////////////////////////////
		if( // Overload 1 : repository
			typeof route_or_modelDeclaration === "string"
			&& typeof method === "function"
		) {
			const route = route_or_modelDeclaration;

			log.info(`Adding a \x1b[36mcustom controller\x1b[90m to route \x1b[33m${route}\x1b[90m.`);

			this.controllers[route] = method;
		}
		/////////////////////////////////////////////////////////////////////////////////////
		else if ( // Overload 2 : custom controller
			typeof route_or_modelDeclaration === "object"
			&& "name" in route_or_modelDeclaration
			&& "model" in route_or_modelDeclaration
			&& "permissions" in route_or_modelDeclaration
		) {
			const modelDeclaration = route_or_modelDeclaration;

			log.info(`Adding \x1b[33mrepository controllers\x1b[90m to routes \x1b[33m${modelDeclaration.name}/\x1b[33mgetAll\x1b[31m|\x1b[33mgetArchived\x1b[31m|\x1b[33mgetRemoved\x1b[31m|\x1b[33mpost\x1b[31m|\x1b[33mpatch\x1b[31m|\x1b[33mremove\x1b[31m|\x1b[33marchive\x1b[31m|\x1b[33mdestroy\x1b[90m.`, )

			this.repositories.push(modelDeclaration); // Ajoute le modèle/repositories à la liste

			this.controllers = { ...this.controllers, ...repositoryControllers(modelDeclaration) };
		}
		//////////////////////////////////////////////////////////////////////////////////////
		else { // No mathing overload
			throw new Error("No overload matches this call.")
		}
	}

	///////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////

	private listen(
		connection: SocketConnection<UserType>,
		path: string,
		method: Method<UserType, any, any>,
	){
		connection.socket.on(path, async (requestData: any, callback: (result: any) => void) => {
			const requestId = log.request(path, requestData, connection);

			try {
				new Promise((resolve, reject) => {
					try {
						method(
							{
								data: requestData,
								connection
							},
							{
								resolve,
								reject,
								dispatch: <DocType extends Document, ControllerType extends RepoControllerType>(repositoryName: string, controllerType: ControllerType, data: RepoControllersReturnTypes<DocType>[ControllerType]) =>
									dispatchChanges<UserType, DocType, ControllerType>(
										this.getConnections,
										this.getRepositories,
										connection,
										new Date,
										repositoryName,
										controllerType,
										data
									)
							});
					}
					catch (e) {
						log.error("Promisify error", e)
						reject("Erreur inconnue.")
					}
				})
					.then(function (result: any) {
						log.response(requestId, true, result)

						// Envoie le résultat au client.
						callback(result);
					})
					.catch(function (err: string) {
						const error = checkErrorType(err, `Erreur`);
						const response = { error }
						log.response(requestId, false, response, error)
						callback(response);
					});
			} catch (err) {
				const error = checkErrorType(err, `${path} failed`);
				const response = { error }
				log.response(requestId, false, response, error)
				callback(response);
			}
		});
	}

	///////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////

	getConnections = () => {
		return this.connections;
	}

	getRepositories = () => {
		return this.repositories;
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default Sun;
