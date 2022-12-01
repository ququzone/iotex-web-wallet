import { Button, Text, Modal, Checkbox, Spacer, Radio } from "@nextui-org/react";
import { Iotx } from "iotex-antenna/lib/iotx";
import { fromRau } from "iotex-antenna/lib/account/utils";
import React, { useState } from "react";

import IoTeXApp from "../ledger/iotex";
import BucketList from "./bucket-list";
import { createTransport } from "../ledger/transport";
import ContractTriger from "./contract";
import ClaimRewards from "./claim-rewards";
import DepositRewards from "./deposit-rewards";
import SignMessage from "./sign-message";
import { WsSignerPlugin } from "../ledger/ws";
import TransferTriger from "./transfer";
import CreateBucket from "./create-bucket";
import { LedgerPlugin } from "../ledger/plugin";

interface StakingProps {
}

interface StakingState {
  ledger: IoTeXApp | null,
  iotex: Iotx | null,
  balance: string,
  address: string
}

// @ts-ignore
const ConnectLedgerButton = (props) => {
  const [selectAddressVisible, setSelectAddressVisible] = useState(false);
  const [paths, setPaths] = useState([]);

  const [app, setApp] = useState(null);
  const [checkedAddress, setCheckedAddress] = React.useState("");

  const closeSelectAddress = () => setSelectAddressVisible(false);
  const selectedAddress = async () => {
    try {
      // @ts-ignore
      const plugin = new LedgerPlugin(app);
      await plugin.select(checkedAddress);
      const iotx = new Iotx("https://api.mainnet.iotex.one:443", 1, {
        signer: plugin,
      });
      const addresses = await plugin.getAccounts();
      const account = await iotx.getAccount({address: addresses[0].address});

      props.setLedgerState({
        ledger: app,
        iotex: iotx,
        address: addresses[0].address,
        balance: fromRau(account.accountMeta!.balance, "IOTX"),
      });
      setSelectAddressVisible(false);
    } catch (error) {
      // 0x6b0c unlock ledger
      // 0x6e01 open app
      console.error(`connect ledger error: ${error}`);
    }
  };

  const connectLedger = async () => {
    // TODO need disconnect then export `transport` to state
    const transport = await createTransport();
    const app = new IoTeXApp(transport);
    const paths = [];
    for (let i = 0; i < 10; i++) {
      const path = "44'/304'/0'/0/" + i;
      const address = await app.getAddress(path);
      paths.push({path: path, address: address.address});
    }
    // @ts-ignore
    setPaths(paths);
    // @ts-ignore
    setApp(app);
    setSelectAddressVisible(true);
  }

  return (
    <div>
      <Modal
        closeButton
        aria-labelledby="modal-title"
        width="555px"
        open={selectAddressVisible}
        onClose={closeSelectAddress}
      >
        <Modal.Header>
          <Text id="modal-title" size={18}>
            Select address
          </Text>
        </Modal.Header>
        <Modal.Body>
          <Radio.Group value={checkedAddress} onChange={setCheckedAddress}>
            {paths.map((path: {path: string, address: string}) => <Radio value={path.path}>{path.address}</Radio>)}
          </Radio.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button auto flat color="error" onClick={closeSelectAddress}>
            Close
          </Button>
          <Button auto onClick={selectedAddress}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
      <Button onPress={connectLedger}>Connect with ledger</Button>
    </div>
  )
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

  // @ts-ignore
  setLedgerState = (state) => {
    this.setState(state);
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
          <ConnectLedgerButton setLedgerState={this.setLedgerState} />
          <br />
          <Button onPress={this.connectIoPay}>Connect with ioPay</Button>
        </div>
      );
    }
  }
}
