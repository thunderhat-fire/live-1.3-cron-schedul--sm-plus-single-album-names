"use server";

export async function getNftHref() {
  const response = await fetch('/api/user/nft');
  const data = await response.json();
  return data.nftId ? `/nft-detail/${data.nftId}` : '/nft-detail';
}
