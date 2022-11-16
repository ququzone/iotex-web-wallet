import { Iotx } from "iotex-antenna/lib/iotx";

export class Rewarding {
  public provider: Iotx;
  
  constructor(provider: Iotx) {
    this.provider = provider;
  }

  public async unclaimedBalance(account: string): Promise<string> {
    const response = await this.provider.readState({
      protocolID: Buffer.from("rewarding"),
      methodName: Buffer.from("UnclaimedBalance"),
      arguments: [Buffer.from(account)],
      height: undefined,
    });
    // @ts-ignore
    return Buffer.from(response.data).toString();
  }
}
