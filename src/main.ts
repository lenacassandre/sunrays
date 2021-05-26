import express, { Express  } from "express"
import socketIo, {Server as IOServer} from "socket.io";
import http from "http";
import dotenv from "dotenv";
import log from "./utils/log";
import processListeners from "./utils/processEvents";
import connectToDB from "./utils/connectToDB";
import controlSession from "./session/controlSession";
import repositoryControllers from "./repositoryControllers";
import { Files, Method, ModelDeclaration, RepoControllersReturnTypes, RepoControllerType, SafeUser } from "./types";
import User from "./classes/User.class";
import Connection from "./classes/Connection.class";
import checkErrorType from './utils/checkErrorType'
import dispatchChanges from "./utils/dispatchChanges";
import Document from "./classes/Document.class"

import cors from 'cors';
import getUserFromToken from "./session/utils/getUserFromToken";


/////////////////////////////////////////////////////////////////////////////////////////////////////////

const options = {
	cors: {
		origin: "*"
	}
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////

class Sun<U extends User> {
	server: http.Server; // HTTP node server
	app: Express; // Express server
	io: IOServer; // Socket IO server
	private connections: Connection<"socket", U>[] = []; // Liste des connections socket actives
	private controllers: {[route: string] : Method<U, any, any>} = {}; // Liste des routes/controllers
	private repositories: ModelDeclaration<U, any>[] = []; // Liste des repositories/modèles

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
			}
		});

		//////////////////////////////////////////////////////////////////////////////////////
		// SERVER ////////////////////////////////////////////////////////////////////////////
		//////////////////////////////////////////////////////////////////////////////////////

		log.info("Init socket server.");

		// EXPRESS
		this.app = express();
		this.app.use(cors());
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));
		this.app.options("*", cors);

		// HTTP
		this.server = http.createServer(this.app);
		this.server.listen(port);
		log.success(`Server is listening from http://127.0.0.1:${port}.`)

		// SOCKET IO
		this.io = new IOServer(this.server, config || {});

		//////////////////////////////////////////////////////////////////////////////////////
		// NATIVE CONTROLLERS ////////////////////////////////////////////////////////////////
		//////////////////////////////////////////////////////////////////////////////////////

		const sessionControllers = controlSession();

		for(let route in sessionControllers) {
			// @ts-ignore flemme
			this.saveController(route, sessionControllers[route]);
		}

		///////////////////////////////////////////////////////////////////////////////////////
		// SOCKETS ////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////

		log.info("Init socket errors middleware.");
		this.io.on("error", (reason: any) => { // Init socket errors middleware.
			log.error(reason); // prints the message associated with the error, e.g. "thou shall not pass" in the example above
		});

		//////////////////////////////////////////////////////////////////////////////////////////

		log.info("Init socket connection middleware.");
		this.io.on("connection", async (socket: socketIo.Socket) => { // on Socket connection
			const newConnection = new Connection<"socket", U>("socket", socket); // Nouvelle classe connection pour suivre la connection de l'utilisateur•trice

			this.connections.push(newConnection); // Enregistre la connection

			log.debug("New client", `🦊\x1b[90m ${newConnection.shortId}\x1b[0m`, "connected. Total :", this.connections.length);

			/////////////////////////////////////////////////////////////////////:

			for(const route in this.controllers) { // Ecoute les routes de tous les controlleurs
				this.socketListen(newConnection, route, this.controllers[route])
			}

			socket.on("disconnect", () => { // Déconnexion. On retire le client de la liste des sockets connectées
				this.connections = this.connections.filter((c) => c.socket.id !== newConnection.socket.id);
				log.debug("Client", `🦊\x1b[90m ${newConnection.shortId}\x1b[0m`, "disconnected. Total :", this.connections.length);
			});
		});
	}

	///////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////

	// Permet de gérer facilement le callback des controllers, même si on perd pas mal de features, notamment tout ce qui tourne autour de HTTP, comme les status. TODO: À améliorer pour permettre une réponse HTTP plus précise
	private wrapController(
		connection: Connection<any, U>,
		path: string,
		method: Method<U, any, any>,
	){
		return async (req: {body: any; files?: Files, file?: Express.Multer.File}, callback: (result: any) => void) => {
			const requestId = log.request(path, req, connection);

			try {
				new Promise((resolve, reject) => {
					try {
						method(
							{
								...req,
								connection
							},
							{
								resolve,
								reject,
								dispatch: <DocType extends Document, ControllerType extends RepoControllerType>(repositoryName: string, controllerType: ControllerType, data: RepoControllersReturnTypes<DocType>[ControllerType]) =>
									dispatchChanges<U, DocType, ControllerType>(
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
		}
	}

	// Make a socket connection listen for a route
	private socketListen(
		connection: Connection<"socket", U>,
		path: string,
		method: Method<U, any, any>,
	){
		const wrappedController = this.wrapController(connection, path, method);
		connection.socket.on(path, (body, callback) => wrappedController({body}, callback))
	}

	// Make the server listen for this route with HTTP
	private httpListen(route: string, controller: Method<U, any, any>) {
		log.info(`🌐 Listening \x1b[33m${route}\x1b[90m with HTTP.`);

		this.app.use<any, any>(`/${route}`, async (req, res) => {
			const connection = new Connection<"http", U>("http")

			const token = req.headers?.authorization?.split(" ")[1];

			if(token) {
				const user = await getUserFromToken<U>(token);

				if(user) {
					connection.connectUser(user);
				}
			}

			const wrappedController = this.wrapController(connection, route, controller);

			const files = req.files;
			const file = req. file;

			wrappedController({body: req.body, files, file,}, (response) => {
				if(response.error) {
					res.status(403);
				} else {
					res.status(200)
				}

				res.send(response);
			})
		})
	}

	// Save a controller to make every socket connections listen to it, and immediatly ask to the server to listen to it with HTTP
	private saveController(route : string, controller: Method<U, any, any>) {
		// Save route/controller to make each socket connection listen to it
		this.controllers[route] = controller;

		this.httpListen(route, controller)
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
	public use(modelDeclaration: ModelDeclaration<U, any>): void
	/**
	 * Handle custom controllers
	 * @param route
	 * @param method
	 */
	public use(route: string, controller: Method<U, any, any>): void
	public use(route_or_modelDeclaration: string | ModelDeclaration<U, any>, controller?: Method<U, any, any>) {
		log.lb();

		///////////////////////////////////////////////////////////////////////////////////
		if( // Overload 1 : Custom rontroller
			typeof route_or_modelDeclaration === "string"
			&& typeof controller === "function"
		) {
			const route = route_or_modelDeclaration;

			log.info(`Adding a \x1b[36mcustom controller\x1b[90m to route \x1b[33m${route}\x1b[90m.`);

			// Enregistre le controller
			this.saveController(route, controller)
		}
		/////////////////////////////////////////////////////////////////////////////////////
		else if ( // Overload 2 : Repository controller
			typeof route_or_modelDeclaration === "object"
			&& "name" in route_or_modelDeclaration
			&& "model" in route_or_modelDeclaration
			&& "permissions" in route_or_modelDeclaration
		) {
			const modelDeclaration = route_or_modelDeclaration;

			log.info(`Adding \x1b[33mrepository controllers\x1b[90m to routes \x1b[33m${modelDeclaration.name}/\x1b[33mgetAll\x1b[31m|\x1b[33mgetArchived\x1b[31m|\x1b[33mgetRemoved\x1b[31m|\x1b[33mpost\x1b[31m|\x1b[33mpatch\x1b[31m|\x1b[33mremove\x1b[31m|\x1b[33marchive\x1b[31m|\x1b[33mdestroy\x1b[90m.`, )

			this.repositories.push(modelDeclaration); // Ajoute le modèle/repositories à la liste

			// Enregistres tous les controlleurs du repo
			const repoControllers = repositoryControllers(modelDeclaration);

			for(let route in repoControllers) {
				this.saveController(route, repoControllers[route]);
			}
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

	public getConnections = () => {
		return this.connections;
	}

	public getRepositories = () => {
		return this.repositories;
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default Sun;
