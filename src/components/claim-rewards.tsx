import { Button } from "@nextui-org/react";
import { Iotx } from "iotex-antenna/lib/iotx";
import { Rewarding } from "../services/rewarding";

interface RewardProps {
  sender: string,
  iotex: Iotx,
}

export default function ClaimRewards(props: RewardProps){
  const claim = async () => {
    const rewarding = new Rewarding(props.iotex);
    const rewards = await rewarding.unclaimedBalance(props.sender);

    const result = await props.iotex.claimFromRewardingFund({
      from: props.sender,
      amount: rewards,
      data: Buffer.from(""),
      gasLimit: "10000",
      gasPrice: "1000000000000",
    });
    console.log(result);
  }

  return (
    <div>
      <Button onPress={claim}>Claim Rewards</Button>
    </div>
  )
}
