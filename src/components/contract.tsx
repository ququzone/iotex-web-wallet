import { Button, Link, Modal, Popover, Text } from "@nextui-org/react";
import { Iotx } from "iotex-antenna/lib/iotx";
import { Contract } from "iotex-antenna/lib/contract/contract";
import * as ERC20 from "../abis/ERC20.json";
import { Account } from "iotex-antenna/lib/account/account";
import { useState } from "react";

interface ContractProps {
  sender: string,
  iotex: Iotx,
}

export default function ContractTriger(props: ContractProps){
  const [hash, setHash] = useState("");
  const [visible, setVisible] = useState(false);

  const transfer = async () => {
    const contract = new Contract(
      ERC20, "io1hp6y4eqr90j7tmul4w2wa8pm7wx462hq0mg4tw", { provider: props.iotex, signer: props.iotex.signer });
    
    const account = new Account();
    account.address = props.sender;
    const result = await contract.methods.transfer(props.sender, "1000000000000000000", {
      account: account,
      gasLimit: "1000000",
      gasPrice: "1000000000000"
    });
    setHash(result);
    setVisible(true);
  }

  return (
    <div>
      <Button onPress={transfer}>Transfer one VITA to self</Button>
      <Modal
        closeButton
        aria-labelledby="modal-title"
        open={visible}
      >
        <Modal.Body>
          <Text>Transfer hash: <Link href={"https://iotexscan.io/tx/" + hash} target="_blank">{hash}</Link></Text>
        </Modal.Body>
      </Modal>
    </div>
  )
}
