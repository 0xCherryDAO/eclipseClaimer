import {PublicKey} from "@solana/web3.js";

export function deriveAta(user: PublicKey, tokenMint: PublicKey, tokenProgramId: PublicKey, associatedTokenProgramId: PublicKey): PublicKey {
    const [ata] = PublicKey.findProgramAddressSync(
        [user.toBytes(), tokenProgramId.toBytes(), tokenMint.toBytes()],
        associatedTokenProgramId
    );
    return ata;
}