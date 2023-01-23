import { captureException } from '@sentry/react-native';
import { SIMPLEHASH_API_KEY } from 'react-native-dotenv';
import { rainbowFetch, RainbowFetchClient } from '../rainbow-fetch';

import { UniqueAsset } from '@/entities';
import { Network } from '@/helpers';
import { parseSimplehashNfts } from '@/parsers';
import { queryClient } from '@/react-query/queryClient';

import { logger } from '@/utils';
import { qs } from 'url-parse';
import { POAP_ADDRESS } from '@/parsers/uniqueTokens';

interface SimplehashMarketplace {
  marketplace_id: string;
  marketplace_name: string;
  marketplace_collection_id: string;
  nft_url: string;
  collection_url: string;
  verified: boolean;
}

interface SimplehashCollection {
  collection_id: string;
  name: string;
  description: string;
  image_url: string | null;
  banner_image_url: string | null;
  external_url: string | null;
  twitter_username: string | null;
  discord_url: string | null;
  marketplace_pages: SimplehashMarketplace[];
  spam_score: number;
}

export interface SimplehashNft {
  nft_id: string;
  chain: Network;
  contract_address: string;
  token_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  model_url: string | null;
  previews: {
    image_small_url: string | null;
    image_medium_url: string | null;
    image_large_url: string | null;
    image_opengraph_url: string | null;
    blurhash: string | null;
  };
  background_color: string | null;
  external_url: string | null;
  created_date: string | null;
  status: string;
  token_count: number;
  owner_count: number;
  contract: {
    type: string;
    name: string;
    symbol: string;
  };
  collection: SimplehashCollection;
  extra_metadata: any | null;
}

const chains = {
  arbitrum: 'arbitrum',
  bsc: 'bsc',
  ethereum: 'ethereum',
  gnosis: 'gnosis',
  optimism: 'optimism',
  polygon: 'polygon',
} as const;
type SimpleHashChain = keyof typeof chains;

const START_CURSOR = 'start';

const simplehashApi = new RainbowFetchClient({
  baseURL: 'https://api.simplehash.com/api',
});

export async function getNFTByTokenId({
  chain = chains.ethereum,
  contractAddress,
  tokenId,
}: {
  chain?: SimpleHashChain;
  contractAddress: string;
  tokenId: string;
}) {
  try {
    const response = await simplehashApi.get(
      `/v0/nfts/${chain}/${contractAddress}/${tokenId}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': SIMPLEHASH_API_KEY,
        },
      }
    );
    return response.data;
  } catch (error) {
    logger.sentry(`Error fetching simplehash NFT: ${error}`);
    captureException(error);
  }
}

export async function getNftsByWalletAddressStart({walletAddress, cursor}: {walletAddress: string, cursor?: string}) {
  let rawResponseNfts: SimplehashNft[] = [];
  console.log('fetching with cursor: ', cursor);
  try {
<<<<<<< Updated upstream
    const chainsParam = `${Network.arbitrum},${Network.optimism},${Network.polygon},${chains.ethereum}`;
=======
    const chainsParam = `${chains.ethereum},${chains.arbitrum},${chains.optimism},${
      chains.polygon
    },${chains.bsc},${(chains.gnosis)}`;
>>>>>>> Stashed changes

      const response = await simplehashApi.get(`/v0/nfts/owners`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': SIMPLEHASH_API_KEY,
        },
        params: {
          chains: chainsParam,
          ...(cursor !== START_CURSOR && { cursor }),
          wallet_addresses: walletAddress,
        },
      });
      console.log('response: ', response.data.next);
      const newCursor = (qs.parse(response.data.next) as any)?.cursor;
      console.log('new cursor: ', newCursor)
      if (response.data?.nfts?.length > 0) {
        rawResponseNfts = rawResponseNfts.concat(response.data.nfts);
      }

        // TODO(jxom): migrate this to Async State RFC architecture once it's merged in.
  const polygonAllowlist = await queryClient.fetchQuery(
    ['polygon-allowlist'],
    async () => {
      return (
        await rainbowFetch(
          'https://metadata.p.rainbow.me/token-list/137-allowlist.json',
          { method: 'get' }
        )
      ).data.data.addresses;
    },
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
    }
  );

<<<<<<< Updated upstream
  return parseSimplehashNfts(rawResponseNfts).filter(
    (token: UniqueAsset) => {
      if (token.network !== Network.polygon  &&   token?.spamScore <= 85) {
        return true
      }
      
      else if (false && polygonAllowlist.includes(token.asset_contract?.address?.toLowerCase())){
        return true;
      }

      return false;
     
    }
  );
=======

      const parsedNfts: UniqueAsset[] = parseSimplehashNfts(rawResponseNfts).filter((nft: UniqueAsset)=>{
        if (nft.collection.name === null) return false;

        // filter out spam
        if (nft.spamScore >= 85) return false;
    
        // filter gnosis NFTs that are not POAPs
        if (
          nft.network === Network.gnosis &&
          nft.asset_contract && 
          nft?.asset_contract?.address.toLowerCase() !== POAP_ADDRESS
        )
          return false;
    
          if (nft.network == Network.polygon &&
            !polygonAllowlist.includes(nft.asset_contract?.address?.toLowerCase())){
              return false;
            }
    
        return true;
      });
      console.log('is it the same ? ', cursor === newCursor)
    return { nfts: parsedNfts, cursor: newCursor}
  } catch (error) {
    logger.sentry(
      `Error fetching simplehash NFTs for wallet address: ${walletAddress} - ${error}`
    );
    captureException(error);
  }
>>>>>>> Stashed changes
}

export async function getNftsByWalletAddress(walletAddress: string, cursor: string) {
  let rawResponseNfts: SimplehashNft[] = [];
  try {
    const chainsParam = `${chains.arbitrum},${chains.optimism},${
      chains.polygon
    },${chains.bsc},${chains.gnosis}`;

    let cursor = START_CURSOR;
    while (cursor) {
      const response = await simplehashApi.get(`/v0/nfts/owners`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': SIMPLEHASH_API_KEY,
        },
        params: {
          chains: chainsParam,
          ...(cursor !== START_CURSOR && { cursor }),
          wallet_addresses: walletAddress,
        },
      });
      cursor = (qs.parse(response.data.next) as any)['cursor'];
      if (response.data?.nfts?.length > 0) {
        rawResponseNfts = rawResponseNfts.concat(response.data.nfts);
      }
    }
  } catch (error) {
    logger.sentry(
      `Error fetching simplehash NFTs for wallet address: ${walletAddress} - ${error}`
    );
    captureException(error);
  }

  return parseSimplehashNfts(rawResponseNfts);
};