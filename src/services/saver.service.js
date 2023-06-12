const fs = require("fs");
const path = require("path");

class SaverService {
    constructor() {
        this.filename = `ParsingResult-${new Date().getTime()}.csv`;
        this.directory = path.join(__dirname, "../", "../", "results");
        this.dist = path.join(this.directory, this.filename);
    }

    save(object) {
        if (!fs.existsSync(this.dist)) {
            fs.writeFileSync(this.dist, Object.keys(object).join(",") + "\n");
        }

        fs.appendFileSync(this.dist, Object.values(object).map(e => e == null ? "" : `"${e}"`).join(",") + "\n");
    }
}

module.exports = SaverService;