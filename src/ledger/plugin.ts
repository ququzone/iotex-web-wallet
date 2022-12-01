import { Account } from "iotex-antenna/lib/account/account";
import { Envelop, SealedEnvelop } from "iotex-antenna/lib/action/envelop";
import { SignerPlugin } from "iotex-antenna/lib/action/method";
import IoTeXApp from "./iotex";

export class LedgerPlugin implements SignerPlugin {
    public ledger: IoTeXApp;
    public initialed: boolean;
    private address: { returnCode: number; publicKey: string; address: string; path: string; } | undefined;

    constructor(ledger: IoTeXApp) {
        this.ledger = ledger;
        this.initialed = false;
    }

    public async select(path: string) {
        if (!this.initialed) {
            const address = await this.ledger.getAddress(path);
            if (address.returnCode != 0x9000) {
                throw new Error(`fetch address error ${address}`);
            }
            this.address = address;
            this.initialed = true;
        }
    }

    public async getAccounts(): Promise<Array<Account>> {
        if (!this.initialed) {
            throw new Error("plugin not initial");
        }
        // TODO how to process different path?
        const account = new Account();
        account.address = this.address!.address;
        return [account];
    }

    public async signOnly(envelop: Envelop): Promise<SealedEnvelop> {
        if (!this.initialed) {
            throw new Error("plugin not initial");
        }
        const signed = await this.ledger.signTransaction(this.address!.path, Buffer.from(envelop.bytestream()));
        if (signed.code !== 36864) {
            throw new Error(signed.message || "ledger error");
        }
        return new SealedEnvelop(envelop, Buffer.from(this.address!.publicKey, "hex"), signed.signature!);
    }
}
