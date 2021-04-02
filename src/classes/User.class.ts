import Document, { processSchemaDeclaration } from "./Document.class"

// La classe dont doivent hériter tous les documents
export default interface User extends Document {
    userName: string;
    password: string;
    roles: number[]
}

// Traite une déclaration de Schema de manière à lui ajouter les propriétés propres à Automaton
export function processUserSchemaDeclaration(schem: {[key: string]: any}) {
    return {
        ...processSchemaDeclaration(schem),
        userName: {type: String, required: true},
        password: {type: String, required: false},
        roles: {type: [Number], default: []}
    }
}