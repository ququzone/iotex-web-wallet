import { Button } from "@nextui-org/react";
import { Iotx } from "iotex-antenna/lib/iotx";
import { fromRau } from "iotex-antenna/lib/account/utils";
import React from "react";

import IoTeXApp from "../ledger/iotex";
import BucketList from "./bucket-list";
import { LedgerPlugin } from "../ledger/plugin";
import { createTransport } from "../ledger/transport";
import ContractTriger from "./contract";
import ClaimRewards from "./claim-rewards";
import DepositRewards from "./deposit-rewards";
import SignMessage from "./sign-message";
import { WsSignerPlugin } from "../ledger/ws";
import TransferTriger from "./transfer";
import CreateBucket from "./create-bucket";

interface StakingProps {
}

interface StakingState {
  ledger: IoTeXApp | null,
  iotex: Iotx | null,
  balance: string,
  address: string,
}

export default class Staking extends React.Component<StakingProps, StakingState> {
  constructor(props: StakingProps) {
    super(props);
    this.state = {
      ledger: null,
      iotex: null,
      balance: "",
      address: "",
    }
  }

  connectIoPay = async () => {
    try {
      const plugin = new WsSignerPlugin("wss://local.iotex.io:64102");
      const iotx = new Iotx("https://api.iotex.one:443", 1, {
        signer: plugin,
      });
      const addresses = await plugin.getAccounts();
      const account = await iotx.getAccount({address: addresses[0].address});

      this.setState({
        iotex: iotx,
        address: addresses[0].address,
        balance: fromRau(account.accountMeta!.balance, "IOTX"),
      });
    } catch (error) {
      console.error(`connect ioPay error: ${error}`);
    }
  }

  connectLedger = async () => {
    // TODO need disconnect then export `transport` to state
    const transport = await createTransport();
    const app = new IoTeXApp(transport);
    this.setState({
      ledger: app,
    });
    try {
      const plugin = new LedgerPlugin(app);
      await plugin.init();
      const iotx = new Iotx("https://api.mainnet.iotex.one:443", 1, {
        signer: plugin,
      });
      const addresses = await plugin.getAccounts();
      const account = await iotx.getAccount({address: addresses[0].address});

      this.setState({
        iotex: iotx,
        address: addresses[0].address,
        balance: fromRau(account.accountMeta!.balance, "IOTX"),
      });
    } catch (error) {
      // 0x6b0c unlock ledger
      // 0x6e01 open app
      console.error(`connect ledger error: ${error}`);
    }
  }

  render() {
    if (this.state.address !== "") {
      return (
        <div>
          <p>Your account {this.state.address} with {this.state.balance} IOTX</p>
          <p><TransferTriger sender={this.state.address} iotex={this.state.iotex!} /></p>
          <p><ContractTriger sender={this.state.address} iotex={this.state.iotex!} /></p>
          <p><DepositRewards sender={this.state.address} iotex={this.state.iotex!} /></p>
          <p><ClaimRewards sender={this.state.address} iotex={this.state.iotex!} /></p>
          <p><CreateBucket sender={this.state.address} iotex={this.state.iotex!} /></p>
          <p><SignMessage message={"hello worldhello worldhello worldhello worldhello worldhello worldhello worldhello worldhello worldhello worldhello worldhello worldhello worldhello worldhello worldhello worldhello worldhello worldhello worldhello world"} app={this.state.ledger!} /></p>
          <BucketList address={this.state.address} iotex={this.state.iotex!} />
        </div>
      );
    } else {
      return (
        <div>
          <Button onPress={this.connectLedger}>Connect with ledger</Button>
          <br />
          <Button onPress={this.connectIoPay}>Connect with ioPay</Button>
        </div>
      );
    }
  }
}
