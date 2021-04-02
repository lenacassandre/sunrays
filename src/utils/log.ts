import JSONcolorizer from "json-colorizer";
import path from "path";

const appDir = path.dirname(require.main?.filename || "");

const COLORS = {
	colors: {
		BRACE: "grey",
		BRACKET: "grey",
		COLON: "grey",
		COMMA: "grey",
		STRING_KEY: "white",
		STRING_LITERAL: "yellow",
		NUMBER_LITERAL: "magenta",
		BOOLEAN_LITERAL: "magenta",
		NULL_LITERAL: "magenta",
	},
};

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Cut a string if too long, fill it if too short
function ellipsis(string: string, length: number) {
	string = string.trim();

	if(string.length > length) {
		return string.slice(0, length - 3) + "..."
	}

	while(string.length < length) {
		string += " ";
	}

	return string;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Renvoie une string formatée d'une date donnée
function getTimeString(time: number) {
	if(time < 1000) {
	  	return `${time}ms`
	} else {
		const milliseconds = time % 1000;
		const seconds = (time - milliseconds) / 1000;
		return `${seconds}.${milliseconds}s`
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Renvoie la taille des données /////////////////////////////////////////////////////////////////////////////
function getDataSize(data: any) {
	const string = JSON.stringify(data)
	const size = string.length;
	if(size < 1000) {
		return `${size}b`;
	}
	else if(size < 1000000) {
		return `${(size/1000).toFixed(1)}kb`
	}
	else {
		return `${(size/1000000).toFixed(1)}mb`
	}
}

// Permet d'identifier l'origine de l'erreur.
function getStackTrace() {
	let obj = { stack: "" };
	Error.captureStackTrace(obj, getStackTrace);
	let origin = obj.stack.split("\n")[2];

	// Renvoie la ligne de code d'où provient l'erreur si elle ne provient pas d'un module
	if (origin && origin.includes("dist")) {
		origin = origin.trim().replace(appDir, "").replace("at ", "");
		return origin;
	}

	return obj.stack;
}

// Ajoute des zéros devant les chiffres pour qu'ils apparaissent tous de la même longueur dans la console.
function pad(num: number, size: number) {
	var s = "000" + String(num);
	return s.substr(s.length - size);
}

// Retourne une string de la date actuelle avec millisecondes
function getDateString() {
	const date = new Date();
	return `\x1b[30m${pad(date.getDate(), 2)}/${pad(date.getMonth() + 1, 2)}/${date.getFullYear()} ${pad(
		date.getHours(),
		2
	)}h${pad(date.getMinutes(), 2)} ${pad(date.getSeconds(), 2)}.${pad(date.getMilliseconds(), 3)}s`;
}

// Récupère un nombre indéfini de variables indéfinies et les converti en une string
function messagesToString(color: string, ...messages: any) {
	let string = "";
	messages.forEach((m: any, i: number, a: Array<any>) => {
		string +=
			(typeof m === "string"
				? `${color}${m}\x1b[0m`
				: JSONcolorizer(
						JSON.stringify(
							m,
							function (key, value) {
								if (typeof value === "function") {
									return `${value.toString().split(" {")[0]}`;
								} else {
									return value;
								}
							},
							4
						),
						COLORS
				  )) + " ";
	});
	return string;
}

////////////////////////////////////////////////////////////////////////////////////////

export function success(...messages: any) {
	console.info(`🍯  \x1b[42m\xa0${getDateString()} \x1b[0m \x1b[32m${messagesToString("\x1b[32m", ...messages)}\x1b[0m`);
}

export function info(...messages: any) {
	console.info(
		`🌲  \x1b[100m\xa0${getDateString()} \x1b[0m \x1b[90m${messagesToString("\x1b[90m", ...messages)}\x1b[0m`
	);
}

export function warn(...messages: any) {
	console.warn(`🦉  \x1b[43m\xa0${getDateString()} \x1b[0m \x1b[33m${messagesToString("\x1b[33m", ...messages)}\x1b[0m`);
}

export function error(...messages: any) {
	console.error(
		`🐻  \x1b[41m\xa0${getDateString()} \x1b[0m \x1b[31mErreur de ${getStackTrace()} : ${messagesToString(
			"\x1b[31m",
			...messages
		)}\x1b[0m`
	);
}

export function debug(...messages: any) {
	if (process.env.DEBUG && process.env.DEBUG.toLowerCase() === "true") {
		console.debug(
			`🐼  \x1b[44m\xa0${getDateString()} \x1b[0m \x1b[34m${messagesToString("\x1b[34m", ...messages)}\x1b[0m`
		);
	}
}

export function dispatch(path: string, count: number) {
	if (process.env.DEBUG && process.env.DEBUG.toLowerCase() === "true") {
		console.debug(
			`🐝  \x1b[45m\xa0${getDateString()} \x1b[0m \x1b[35m--> ${ellipsis(path, 15)}\x1b[0m\x1b[90m Dispatched changes to \x1b[35m${count}\x1b[90m clients.\x1b[0m`
		);
	}
}

export function trace() {
	console.trace();
}

export function linebreak() {
	console.log();
}

//////////////////////////////////////////////////////////////////////////////////////////////:

function beeMessage(message: string, color: number = 7) {
	console.info(`🐝  \x1b[4${color}m\xa0${getDateString()} \x1b[0m ${message}\x1b[0m`);
}

type Request = {
	id: string;
	date:number;
	route: string;
	connectionShortId: string;
}

const pendingRequests: Request[] = []

export function request(route: string, data: any, connectionShortId: string): string {
	const dataSize = getDataSize(data);

	beeMessage(`\x1b[90m<--\x1b[37m ${ellipsis(route, 15)}\x1b[0m ${connectionShortId ? ` 🦊\x1b[90m ${connectionShortId}\x1b[0m` : ""}\x1b[90m  📦 ${ellipsis(dataSize, 5)}`)

	const id = String(Math.random())

	pendingRequests.push({
		id,
		date: Date.now(),
		route,
		connectionShortId
	})

	return id;
}

export function response(id: string, success: boolean, responseData?: any, message?: string) {
	const pendingRequest = pendingRequests.find(pr => pr.id === id)

	if(pendingRequest) {
		const dataSize = getDataSize(responseData);
		const timeDelta = Date.now() - pendingRequest.date;
		const deltaTimeString = getTimeString(timeDelta);

		beeMessage(
			`\x1b[${
				success ? 32 : 31
			}m-->\x1b[${
				success ? 92 : 91
			}m ${
				ellipsis(pendingRequest.route, 15)
			}\x1b[0m ${
				pendingRequest.connectionShortId
					? ` 🦊\x1b[90m ${pendingRequest.connectionShortId}\x1b[0m`
					: ""
			}\x1b[0m\x1b[90m${
				responseData
					? `  📦 ${ellipsis(dataSize, 5)}`
					: ""
			} ⏱ \x1b[90m${
				deltaTimeString
			}${message ? `  \x1b[${
				success ? 92 : 91
			}m${
				message
			}` : ""}`
		)
	}
}

function clear() {
	console.clear()
}

const log = {
	response,
	request,
	dispatch,
	success,
	info,
	warn,
	error,
	debug,
	linebreak,
	// alias
	lb: linebreak,
	trace,
	clear,
};

export default log;
