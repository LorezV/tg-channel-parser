class ParserService {
    constructor(apiService, saverService) {
        this.apiService = apiService;
        this.saverService = saverService;
    }

    async start() {
        const date = (new Date()).getTime();

        let lastID = process.env["LAST_MESSAGE_ID"];
        if (lastID) {
            lastID = parseInt(lastID);
        }

        await this.parseMessages(await this.apiService.getEntityByName(process.env["CHANNEL_NAME"]), lastID);
    }

    async parseMessages(entity, offsetId = null, countMessages = 0) {
        const messages = await this.apiService.getMessagesChunk(entity, offsetId);

        if (messages.length > 0) {
            for (const ms of messages) {
                if (!ms.message || !this.isValidText(ms.message)) continue;

                const data = {
                    locations: this.getLocations(ms.message),
                    owner: this.getOwner(ms.message),
                    description: this.getDescription(ms.message),
                    assortment: this.getAssortment(ms.message),
                    services: this.getServices(ms.message),
                    orders: this.getOrders(ms.message),
                    capacity: this.getCapacity(ms.message),
                    contacts: this.getContacts(ms.message)
                }
                
                this.saverService.save(data);

                console.log(ms)
            }

            console.log(`Parsed chunk with last message id: ${messages[messages.length - 1].id}`);

            await new Promise((resolve) => setTimeout(resolve, parseInt(process.env["REQUEST_DELAY"])));
            return this.parseMessages(entity, messages[messages.length - 1].id, countMessages += messages.length);
        }

        console.log(`Parsing is finished. ${countMessages} messages were processed.`)
        return;
    }

    isValidText(text) {
        text = text.toLowerCase()
        return text.includes("ассортимент")
            || text.includes("услуги")
            || text.includes("заказ")
            || text.includes("мощность")
            || text.includes("контакты")
    }

    getLocations(text) {
        const s = text.split("\n").at(0);

        return s.split(" ").map(h => {
            return h.replace("#", "").replace("_", " ").trim();
        })
    }

    getOwner(text) {
        return text.split("\n").at(1).trim()
    }

    getDescription(text) {
        return text.split("\n").at(2).trim()
    }

    getAssortment(text) {
        let s = /^Ассортимент(.+)$/gmiu.exec(text);

        if (s) {
            s = s[1].replace("#", "").trim();

            return s.split(" #").slice(1).map(e => {
                return e.replace("_", " ")
            })
        }

        return null;
    }

    getServices(text) {
        let s = /^УСЛУГИ(.+)$/gmiu.exec(text);

        if (s) {
            s = s[1].replace(":", "").trim();

            while (s.includes("#")) {
                s = s.replace("#", "").replace("_", " ");
            }

            return s;
        }

        return null;
    }

    getOrders(text) {
        let s = /^ЗАКАЗЫ(.+)$/gmiu.exec(text);

        if (s) {
            return s[1].replace(":", "").trim();
        }

        return null;
    }

    getCapacity(text) {
        let s = /^МОЩНОСТЬ(.+)$/gmiu.exec(text);

        if (!s) s = /^МОЩНОСТЬ производства(.+)$/gmiu.exec(text)

        if (s) {
            return s[1].replace(":", "").trim();
        }

        return null;
    }

    getContacts(text) {
        let index = text.search(/^Контакты/gmiu);

        if (index > 0) {
            let s = text.slice(index).replace(/^Контакты/gmiu, "").trim();

            while (s.includes("\n")) {
                s = s.replace("\n", " ")
            }
        }

        return null;
    }
}

module.exports = ParserService;