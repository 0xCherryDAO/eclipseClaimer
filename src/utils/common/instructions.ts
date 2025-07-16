import {SystemProgram, TransactionInstruction} from "@solana/web3.js";
import {ASSOCIATED_TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {CreateAtaArgs} from "./types";

export function createAta(args: CreateAtaArgs): TransactionInstruction {
    return new TransactionInstruction({
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        keys: [
            {pubkey: args.fundingAddress, isSigner: true, isWritable: true},
            {pubkey: args.associatedAccountAddress, isSigner: false, isWritable: true},
            {pubkey: args.walletAddress, isSigner: false, isWritable: false},
            {pubkey: args.tokenMintAddress, isSigner: false, isWritable: false},
            {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
            {pubkey: args.tokenProgramId, isSigner: false, isWritable: false},
        ],
        data: Buffer.from([args.instruction]),
    });
}