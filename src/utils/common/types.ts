import {PublicKey} from "@solana/web3.js";

export interface CreateAtaArgs {
    fundingAddress: PublicKey;
    associatedAccountAddress: PublicKey;
    walletAddress: PublicKey;
    tokenMintAddress: PublicKey;
    tokenProgramId: PublicKey;
    instruction: number;
}