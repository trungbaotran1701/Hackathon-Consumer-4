import {
  IDL,
  NETWORK_URL,
  WORMHOLE_ETH_ABI,
  WORMHOLE_ETH_SM_ADDRESS,
  ETH_NODE_URL,
} from '@/config/config';
import { ethers } from 'ethers';
import { NextApiRequest, NextApiResponse } from 'next';
import * as anchor from '@project-serum/anchor';
import { createHellowormProgramInterface } from '@/needed';

const ETH_PRIVATE_KEY =
  '07bb8829d8dd4f2d92b6369e15945da6cbea4c1ddb38f2a2559282649c482279';

interface sqData {
  data: number[];
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      msg: 'Invalid method',
    });
  }

  try {
    const connection = new anchor.web3.Connection(
      anchor.web3.clusterApiUrl('devnet')
    );

    const programId = new anchor.web3.PublicKey(
      'GsTfE4Ndievuh8G5EWAPcS7aixwKyN5YdZNymq2cVfNV'
    );

    const program = createHellowormProgramInterface(connection, programId);

    const sequence = new anchor.web3.PublicKey(
      '6k4HrdhZdULGRrztGi4fGs5HrJkVjJ5FS5pz76muMLX6'
    );

    console.log(sequence);
    program.provider.connection.getAccountInfo(sequence).then((y) => {
      if (y !== null) {
        const numberSq = JSON.parse(JSON.stringify(y?.data)) as sqData;

        console.log('debug2');
        getDataFromWormHole((numberSq.data[0] - 1).toString()).then(
          (result) => {
            console.log(result);
            if (result.vaaBytes !== undefined) {
              const hexString = `0x${Buffer.from(
                result.vaaBytes,
                'base64'
              ).toString('hex')}`;

              console.log('debug3');
              res.status(200).send('Finished');
              const privateKey = ETH_PRIVATE_KEY as string;
              const provider = new ethers.providers.WebSocketProvider(
                ETH_NODE_URL
              );
              const signer = new ethers.Wallet(privateKey, provider);
              const contract = new ethers.Contract(
                WORMHOLE_ETH_SM_ADDRESS,
                WORMHOLE_ETH_ABI,
                signer
              );

              console.log('debug4');
              res.status(200).send('Finished');
              contract.receiveMessage(hexString).then((tx: any) => {
                console.log('debug5');
                res.status(200).send('Finished');
                tx.wait().then((txResult: any) => console.log(txResult));
              });
            } else {
              console.log('con cai nit');
            }
          }
        );
      }
    });
  } catch (error) {
    console.log('exc', error);
  }
  return res.status(200).send('Finished');
}

export interface WormholeResProps {
  vaaBytes: string | undefined;
}
async function getDataFromWormHole(
  sequence: string
): Promise<WormholeResProps> {
  const url = `https://wormhole-v2-testnet-api.certus.one/v1/signed_vaa/1/48f36f42900d19f2c974355483d9fb397907481c344904bc2c56bd659890d867/${sequence}`;
  const response = await fetch(url, {
    method: 'GET',
  });
  const result = await response.json();
  return result;
}
