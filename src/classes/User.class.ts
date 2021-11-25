import Document, { processSchemaDeclaration } from "./Document.class"
import { ObjectId } from ".."

// La classe dont doivent hériter tous les documents
export default interface User extends Document {
    userName: string;
    password: string;
    roles: string[]; // Une liste de nombre. Le 1 signifie toujours superadmin. Les autres sont arbitraires et à utiliser comme on le souhaite.
}

// Traite une déclaration de Schema de manière à lui ajouter les propriétés propres à Automaton
export function processUserSchemaDeclaration(schem: {[key: string]: any}) {
    return {
        ...processSchemaDeclaration(schem),
        userName: {type: String, required: true},
        password: {type: String, required: false},
        roles: {type: [String], default: []},
    }
}