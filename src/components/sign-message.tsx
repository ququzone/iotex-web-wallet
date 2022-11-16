import { Button } from "@nextui-org/react";
import IoTeXApp from "../ledger/iotex";

interface MessageProps {
  message: string,
  app: IoTeXApp,
}

export default function SignMessage(props: MessageProps){
  const sign = async () => {
    const result = await props.app.signMessage("44'/304'/0'/0/0", Buffer.from(props.message));
    console.log(result);
  }

  return (
    <div>
      <Button onPress={sign}>Sign Message</Button>
    </div>
  )
}
