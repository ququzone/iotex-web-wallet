import { Button } from "@nextui-org/react";
import { Iotx } from "iotex-antenna/lib/iotx";

interface DepositProps {
  sender: string,
  iotex: Iotx,
}

export default function DepositRewards(props: DepositProps){
  const claim = async () => {
    const result = await props.iotex.depositToRewardingFund({
      from: props.sender,
      amount: "1000000000000000000",
      data: Buffer.from(""),
      gasLimit: "10000",
      gasPrice: "1000000000000",
    });
    console.log(result);
  }

  return (
    <div>
      <Button onPress={claim}>Deposit Rewards</Button>
    </div>
  )
}
