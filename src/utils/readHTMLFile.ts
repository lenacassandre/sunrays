import fs from "fs";

function readHTMLFile(path: string, callback: Function){
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
        }
        else {
            callback(null, html);
        }
    });
}

export default readHTMLFile;