import { Button, Modal, Text, Link } from "@nextui-org/react";
import { Iotx } from "iotex-antenna/lib/iotx";
import { Account } from "iotex-antenna/lib/account/account";
import { useState } from "react";

interface TransferProps {
  sender: string,
  iotex: Iotx,
}

export default function TransferTriger(props: TransferProps){
  const [hash, setHash] = useState("");
  const [visible, setVisible] = useState(false);

  const transfer = async () => {
    const account = new Account();
    account.address = props.sender;
    const result = await props.iotex.sendTransfer({
      from: props.sender,
      to: props.sender,
      value: "1000000000000000000",
      gasLimit: "10000",
      gasPrice: "1000000000000"
    });
    setHash(result);
    setVisible(true);
  }

  return (
    <div>
      <Button onPress={transfer}>Transfer one IOTX to self</Button>
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
