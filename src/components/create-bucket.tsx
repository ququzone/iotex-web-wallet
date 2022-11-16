import { Button } from "@nextui-org/react";
import { StakeCreateMethod } from "iotex-antenna/lib/action/method";
import { Iotx } from "iotex-antenna/lib/iotx";
import { StakeCreate } from "iotex-antenna/protogen/proto/types/action_pb";

interface CreateBucket {
  sender: string,
  iotex: Iotx,
}

export default function CreateBucket(props: CreateBucket){
  const create = async () => {
    console.log(props.sender);
    const method = new StakeCreateMethod(
      props.iotex,
      // @ts-ignore
      {address: "io13eslm0ae6mdrj2uz7c260aj670wkdywtaye3gk"},
      {
        gasLimit: "10000",
        gasPrice: "1000000000000",
        candidateName: "unifi",
        stakedAmount: "200000000000000000000",
        stakedDuration: 0,
        autoStake: true,
        payload: ""
      },
      {signer: props.iotex.signer}
    );
    console.log(method.account);
    const result = await method.execute();
    console.log(result);
  }

  return (
    <div>
      <Button onPress={create}>Create 200 IOTX to unifi</Button>
    </div>
  )
}
