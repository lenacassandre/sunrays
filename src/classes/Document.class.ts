import {Document as MongooseDocument} from "mongoose"

// La classe dont doivent hériter tous les documents
export default class Document {
    _id: string;
    __v: number;
    color?: string;
    order?: number;
    dev?: boolean;
    archived?: boolean;
    created_at: Date;
    updated_at: Date;

    constructor(doc: Document) {
        this._id = doc._id;
        this.__v = doc.__v;
        this.color = doc.color;
        this.order = doc.order;
        this.dev = doc.dev;
        this.archived = doc.archived;
        this.created_at = doc.created_at;
        this.updated_at = doc.updated_at;
    }
}

// Traite une déclaration de Schema de manière à lui ajouter les propriétés propres à Automaton
export function processSchemaDeclaration(schem: {[key: string]: any}) {
    return {
        ...schem,
        color: String,
        order: Number,
        dev: Boolean,
        archived: Boolean,
        created_at: Date,
        updated_at: Date,
    }
}