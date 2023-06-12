const { TelegramClient, Api } = require("telegram");
const { StoreSession } = require("telegram/sessions");
const QRCode = require("qrcode");

class ApiService {
    constructor() {
        this.apiId = parseInt(process.env["API_ID"]);
        this.apiHash = process.env["API_HASH"];
        this.client = new TelegramClient(new StoreSession(process.env["SESSION_STORAGE_NAME"]), this.apiId, this.apiHash);
    }

    async connect() {
        await this.client.connect();

        this.client.addEventHandler(this.onMessage.bind(this));

        if (!await this.client.isUserAuthorized()) {
            await this.client.signInUserWithQrCode(
                { apiId: this.apiId, apiHash: this.apiHash },
                {
                    onError: async function(e) {
                        console.log("error", e);
                        return true;
                    },
                    qrCode: async (qr) => {
                        QRCode.toString(`tg://login?token=${btoa(String.fromCharCode(...qr.token))}`, { type: "terminal" }, function (err, qr) {
                            if (err) {
                                console.error(err);
                                return;
                            }

                            console.log(qr);
                        })
                    }
                }
            );
        }

        return this;
    }

    async onMessage(message) {
        console.log(`Handled message "${message.className}"`);

        if (message.className == "UpdateLoginToken") {
            this.client.invoke(new Api.auth.ExportLoginToken({
                apiId: this.apiId,
                apiHash: this.apiHash,
                exceptIds: []
            }))

            return;
        }
    }

    async getEntityByName(name) {
        const result = (await this.client.getDialogs({limit: 30})).filter((d) => d.name == name);

        if (result.length == 0) {
            throw new Error(`Chat/group/chanel with name ${name} not found`);
        }

        return result[0].entity;
    }

    async getMessagesChunk(entity, offsetId) {
        return this.client.getMessages(entity, {
            limit: parseInt(process.env["CHUNK_SIZE"]),
            offsetId
        })
    }
}

module.exports = ApiService;