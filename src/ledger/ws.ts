// @ts-ignore
import window from "global/window";
import WebSocket from "isomorphic-ws";
import { Account } from "iotex-antenna/lib/account/account";
import { Envelop } from "iotex-antenna/lib/action/envelop";
import { SignerPlugin } from "iotex-antenna/lib/action/method";
import { IRequest } from "iotex-antenna/lib/plugin/ws/request";

export class ConcurrentState<T> {
    // @ts-ignoresss
    value: T
    pending = false
    promiseHooks: {resolve: Function, reject: Function}[] = []
    wait () {
      return new Promise<T>((resolve, reject) => {
          this.promiseHooks.push({
             resolve,
             reject
          })
       })
    }
    releaseLock (res: T) {
       this.value = res
       this.promiseHooks.forEach(({resolve}) => {
         resolve(res)
       })
       this.pending = false
    }
    releaseErrorLock (error: Error) {
     this.promiseHooks.forEach(({reject}) => {
         reject(error)
       })
    }
    lock () {
       this.pending = true
    }
 }

// tslint:disable-next-line:insecure-random
let reqId = Math.round(Math.random() * 10000);

export interface WsSignerPluginOptions {
  retryCount: number;
  retryDuration: number;
}

export interface WsRequest {
  // tslint:disable-next-line: no-any
  [key: string]: any;
}

export class WsSignerPlugin implements SignerPlugin {
  // @ts-ignoresss
  public ws: WebSocket;

  private readonly provider: string;

  private readonly options: WsSignerPluginOptions;

  private readonly events:  Record<string, (resp: JSON) => void>

  private readonly accounts: ConcurrentState<Array<Account>>

  constructor(
    provider: string = "ws://local.iotex.io:64102",
    options: WsSignerPluginOptions = { retryCount: 3, retryDuration: 50 }
  ) {
    this.provider = provider;

    this.options = options;
    this.events = {}
    this.accounts = new ConcurrentState()

    this.init();
  }

  private init(): void {
    this.ws = new WebSocket(this.provider);
    this.ws.onerror = (event): void => {
      console.log(event);
      console.log('[antenna-ws] error: ', event);
    }
    this.ws.onopen = (): void => {
      window.console.log("[antenna-ws] connected");
    };
    this.ws.onclose = (): void => {
      window.console.log("[antenna-ws] disconnected");
    };
    this.ws.onmessage = async (event) => {
      if (typeof event.data === "string") {
        const resp = JSON.parse(event.data);
        const callback = this.events[resp.reqId]
        await callback?.(resp)
        delete this.events[resp.reqId]
        return
      }
      throw new Error("Error Response Format")
    }
  }

  // @ts-ignoresss
  private onMessage (id: string | number, callback: (event) => void) {
    this.events[id] = callback
  }

  public send(req: WsRequest): void {
    const readyState = this.ws.readyState;

    if (readyState === 1) {
      console.log(JSON.stringify(req));
      this.ws.send(JSON.stringify(req));
    } else {
      if (readyState === 2 || readyState === 3) {
        this.init();
      }
      this.reconnectAndSend(this.options.retryCount, req);
    }
  }

  private reconnectAndSend(
    retryCount: number,
    req: WsRequest,
    timeoutId?: number
  ): void {
    const readyState = this.ws.readyState;

    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }

    if (retryCount > 0) {
      const id = window.setTimeout(() => {
        if (readyState === 1) {
          this.ws.send(JSON.stringify(req));
          window.clearTimeout(id);
        } else {
          const count = retryCount - 1;
          this.reconnectAndSend(count, req, id);
        }
      }, this.options.retryDuration);
    } else {
      window.console.error(
        "ws plugin connect error, please retry again later."
      );
    }
  }

  public async signAndSend(envelop: Envelop): Promise<string> {
    const id = reqId++;
    console.log(envelop);
    console.log(Buffer.from(envelop.bytestream()).toString("hex"));
    const req: IRequest = {
      reqId: id,
      envelop: Buffer.from(envelop.bytestream()).toString("hex"),
      type: "SIGN_AND_SEND",
      origin: this.getOrigin()
    };
    this.send(req);
    // tslint:disable-next-line:promise-must-complete
    return new Promise<string>(resolve => {
      this.onMessage(id, (resp) => {
        resolve(resp.actionHash);
      })
    });
  }

  public async getAccount(address: string): Promise<Account> {
    const acct = new Account();
    acct.address = address;
    return acct;
  }

  public async getAccounts(): Promise<Array<Account>> {
    console.log('getAccounts------------------')
    if (this.accounts.value) {
      console.log('getAccounts return cache')
       return this.accounts.value
    }
    if (this.accounts.pending) {
      console.log('getAccounts return pending')
       return this.accounts.wait()
    } else {
      this.accounts.lock()
    }
    console.log('requestAccounts------------------')
    const id = reqId++;
    const req = {
      reqId: id,
      type: "GET_ACCOUNTS"
    };
    this.send(req);

    // tslint:disable-next-line:promise-must-complete
    return new Promise<Array<Account>>(resolve => {

      this.onMessage(id, (resp) => {
        resolve(resp.accounts);
        this.accounts.releaseLock(resp.accounts)
      })
    });
  }

  public getOrigin(plugin: string = ""): string {
    let origin: string = "";
    if (
      location !== undefined &&
      location.hasOwnProperty("hostname") &&
      location.hostname.length
    ) {
      origin = location.hostname;
    } else {
      origin = plugin;
    }

    if (origin.substr(0, 4) === "www.") {
      origin = origin.replace("www.", "");
    }
    return origin;
  }

  public async signMessage(
    data: string | Buffer | Uint8Array
  ): Promise<Buffer> {
    console.log('ws request sign------------------')
    const id = reqId++;
    const req: IRequest = {
      reqId: id,
      msg: data,
      type: "SIGN_MSG"
    };
    this.send(req);
    return new Promise<Buffer>(resolve => {
      this.onMessage(id, (resp) => {
        resolve(Buffer.from(resp.sig, "hex"));
      })
    });
  }
}
