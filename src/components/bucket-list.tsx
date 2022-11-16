import { Button, Card, Input, Modal, Row, Text } from "@nextui-org/react";
import { fromRau } from "iotex-antenna/lib/account/utils";
import { Iotx } from "iotex-antenna/lib/iotx";
import { useEffect, useRef, useState } from "react";
import { VoteBucket, Staking } from "../services/staking";

interface BucketProps {
  address: string,
  iotex: Iotx,
}

function Bucket(props: {
  bucket: VoteBucket,
  staking: Staking,
}) {
  const addStakeAmountRef = useRef(null);
  const [addStakeVisible, setAddStakeVisible] = useState(false);
  const [currentBucket, setCurrentBucket] = useState<VoteBucket | undefined>(undefined);
  const handleAddStake = (bucket: VoteBucket) => {
    setAddStakeVisible(true);
    setCurrentBucket(bucket);
  }
  const closeAddStake = () => setAddStakeVisible(false);
  const addStake = async () => {
    const hash = await props.staking.addStake(
      currentBucket!.index,
      // @ts-ignore
      addStakeAmountRef.current.value
    );
    setAddStakeVisible(false);
  }

  return (
    <div>
      <Modal
        closeButton
        aria-labelledby="modal-title"
        open={addStakeVisible}
        onClose={closeAddStake}
      >
        <Modal.Header>
          <Text id="modal-title" size={18}>
            Add stake to #{currentBucket?.index}
          </Text>
        </Modal.Header>
        <Modal.Body>
          <Input
            ref={addStakeAmountRef}
            clearable
            bordered
            fullWidth
            color="primary"
            size="lg"
            placeholder="Amount"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button auto flat color="error" onClick={closeAddStake}>
            Close
          </Button>
          <Button auto onClick={addStake}>
            Add Stake
          </Button>
        </Modal.Footer>
      </Modal>
      <Card css={{ mw: "600px" }}>
        <Card.Header>
          <Text b>Bucket #{props.bucket.index}{props.bucket.autoStake && " - Auto Stake"}</Text>
        </Card.Header>
        <Card.Divider />
        <Card.Body css={{ py: "$10" }}>
          <Text>
            Staking {fromRau(props.bucket.stakedAmount, "IOTX")} to {props.bucket.candidateAddress} with {props.bucket.stakedDuration} days.
          </Text>
          <Text>
            Staking starting at {props.bucket.stakeStartTime!.toLocaleString()}.
          </Text>
        </Card.Body>
        <Card.Divider />
        <Card.Footer>
          <Row justify="flex-end">
            <Button.Group>
              <Button size="sm">Switch Delegate</Button>
              {props.bucket.canAddStaking() && <Button size="sm" onPress={() => handleAddStake(props.bucket)}>Add Stake</Button>}
              <Button size="sm">Restake</Button>
              <Button size="sm">Reassign</Button>
            </Button.Group>
          </Row>
        </Card.Footer>
      </Card>
    </div>
  )
}

export default function BucketList(props: BucketProps){
  const [buckets, setBuckets] = useState<VoteBucket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const staking = new Staking(props.iotex, props.address);

  useEffect(() => {
    fetchBuckets()
  }, []);

  const fetchBuckets = async () => {
    setIsLoading(true);
    const result = await staking.getBucketList(0, 100);
    setBuckets(result);
    setIsLoading(false);
  }

  return (
    <div>
      {isLoading && <p>Loading buckets...</p>}
      {buckets.length > 0 && (
        <ul>
          {buckets.map(bucket => (
            <li key={bucket.index}>
              <Bucket bucket={bucket} staking={staking} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
