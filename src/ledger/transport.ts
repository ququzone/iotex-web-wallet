import type Transport from "@ledgerhq/hw-transport";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
// @ts-ignore
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import platform from 'platform';

const isWebUSBSupported = async () => {
  const isSupported = await TransportWebUSB.isSupported();
  return isSupported && platform.os!.family !== 'Windows' && platform.name !== 'Opera';
}

const isWebHIDSupported = async (): Promise<boolean> => {
  return await TransportWebHID.isSupported();
}

export const createTransport = async (): Promise<Transport> => {
  try {
    if (await isWebHIDSupported()) {
      return await TransportWebHID.create();
    } else {
      return await TransportWebUSB.create();
    }
  } catch(e) {
    try {
      return await TransportWebUSB.create();
    } catch (eu) {
      console.log(`create WebUSB transport error ${eu}`);
      throw e;
    }
  }
}
