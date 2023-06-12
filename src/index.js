require("dotenv").config();

const ApiService = require("./services/api.service");
const ParserService = require("./services/parser.service");
const SaverService = require("./services/saver.service");

async function main() {
    try {
        const parserService = new ParserService(await (new ApiService()).connect(), new SaverService())

        await parserService.start();
    } catch(e) {
        console.error(e);
    }
}

main().catch(console.error);