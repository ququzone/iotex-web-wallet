import { Account } from "iotex-antenna/lib/account/account";
import { StakeAddDepositMethod } from "iotex-antenna/lib/action/method";
import { Iotx } from "iotex-antenna/lib/iotx";
import { 
  IReadStakingDataMethodName,
  IReadStakingDataMethodToBuffer,
  IReadStakingDataRequestToBuffer,
} from "iotex-antenna/lib/rpc-method/types";
import {
  VoteBucketList,
} from "iotex-antenna/protogen/proto/types/state_data_pb";

export class VoteBucket {
  index: number;
  candidateAddress: string;
  stakedAmount: string;
  stakedDuration: number;
  createTime: Date | undefined;
  stakeStartTime: Date | undefined;
  unstakeStartTime: Date | undefined;
  autoStake: boolean;
  owner: string;

  constructor(
    index: number,
    candidateAddress: string,
    stakedAmount: string,
    stakedDuration: number,
    createTime: Date | undefined,
    stakeStartTime: Date | undefined,
    unstakeStartTime: Date | undefined,
    autoStake: boolean,
    owner: string,
  ) {
    this.index = index;
    this.candidateAddress = candidateAddress;
    this.stakedAmount = stakedAmount;
    this.candidateAddress = candidateAddress;
    this.stakedDuration = stakedDuration;
    this.createTime = createTime;
    this.stakeStartTime = stakeStartTime;
    this.unstakeStartTime = unstakeStartTime;
    this.autoStake = autoStake;
    this.owner = owner;
  }

  public canAddStaking(): boolean {
    return this.autoStake && this.unstakeStartTime!.getTime() === 0;
  }

  public canUnstake(): boolean {
    // TODO
    return false;
  }

  public canWithdraw(): boolean {
    // TODO
    return false;
  }
}

export class Staking {
  public provider: Iotx;
  public account: string;

  constructor(provider: Iotx, address: string) {
    this.provider = provider;
    this.account = address;
  }

  public async getBucketList(offset: number, limit: number): Promise<Array<VoteBucket>> {
    const response = await this.provider.readState({
      protocolID: Buffer.from("staking"),
      methodName: IReadStakingDataMethodToBuffer({
        method: IReadStakingDataMethodName.BUCKETS_BY_VOTER
      }),
      arguments: [IReadStakingDataRequestToBuffer({
        bucketsByVoter: {
          voterAddress: this.account,
          pagination: {
            offset,
            limit
          }
        }
      })],
      height: undefined,
    });

    const result = VoteBucketList.deserializeBinary(response.data as Buffer).getBucketsList();

    return result.map(bucket => new VoteBucket(
        bucket.getIndex(),
        bucket.getCandidateaddress(),
        bucket.getStakedamount(),
        bucket.getStakedduration(),
        bucket.hasCreatetime()? bucket.getCreatetime()!.toDate() : undefined,
        bucket.hasStakestarttime()? bucket.getStakestarttime()!.toDate() : undefined,
        bucket.hasUnstakestarttime()? bucket.getUnstakestarttime()!.toDate() : undefined,
        bucket.getAutostake(),
        bucket.getOwner(),
    ))
  }

  public async addStake(index: number, amount: string): Promise<string> {
    const account = new Account();
    account.address = this.account;
    return new StakeAddDepositMethod(
      this.provider,
      account,
      {
        gasLimit: "10000",
        gasPrice: "1000000000000",
        bucketIndex: index,
        amount: amount,
        payload: "",
      },
      { signer: this.provider.signer }
    ).execute();
  }
}
