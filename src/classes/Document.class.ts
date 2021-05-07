import mongoose from "mongoose"
import ObjectId = mongoose.Types.ObjectId;

// La classe dont doivent hériter tous les documents
export default class Document {
    _id: ObjectId;
    organizations: ObjectId[]; // Organisation. Un utilisateur peut faire partie de plusieurs organisation mais un objet ne peut faire partie que d'une organisation. Un utilisateur ne reçoit que les document des organisations dont il fait partie. Seul le superadmin peut recevoir les objets sans organisation.
    color?: string; // Tout objet peut avoir une couleur attribuée
    order?: number; // Order. Feature à venir. TODO : s'occuper de la feature doc.order.
    dev?: boolean; // Visible uniquement en version de developpement. TODO : s'occuper de la feature doc.dev.
    archived?: boolean; // Archivé. Ne sera pas envoyé dans les requêtes get, le document doit être demandé manuellement.
    removed?: boolean; // À la suppression d'un document, removed devient true. Un document ne peut être définitivement supprimé que si deleted = true
    created_at: Date; // Date de création
    updated_at: Date; // Date de la dernière modificaiton du document
    __v: number; // Version du document

    constructor(doc: Document) {
        this._id = doc._id;
        this.organizations = doc.organizations || [];
        this.color = doc.color;
        this.order = doc.order;
        this.dev = doc.dev;
        this.archived = doc.archived;
        this.removed = doc.removed;
        this.created_at = doc.created_at;
        this.updated_at = doc.updated_at;
        this.__v = doc.__v;
    }
}

// Traite une déclaration de Schema de manière à lui ajouter les propriétés propres à Sunrays
export function processSchemaDeclaration(schema: {[key: string]: any}) {
    return {
        ...schema,
        organizations: {type: [ObjectId], default: [], required: true},
        color: String,
        order: Number,
        dev: Boolean,
        archived: Boolean,
        removed: Boolean,
        created_at: Date,
        updated_at: Date,
    }
}