import {Account} from "../../utils/user/solanaAccount";
import {PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction} from "@solana/web3.js";
import {logger} from "../../utils/logger";
import {Proxy} from "../../utils/proxyManager";
import {retry} from "../../utils/common/retry";
import {createAta} from "../../utils/common/instructions";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {deriveAta} from "../../utils/common/ata";

export const CUSTOM_PROGRAM_ID = new PublicKey("juisB1CnHDC6PkA4SnidQwB3fm3ESiPC3SNpRNC2hKy");
export const ES_TOKEN_MINT = new PublicKey("GnBAskb2SQjrLgpTjtgatz4hEugUsYV7XrWU1idV3oqW");
export const AIRDROP_STATE = new PublicKey("6hQQtAMoWb16scTd9aZSPhDcMFevj6zDCqsydA5k4sMM");

export class Claimer extends Account {
    constructor(privateKey: string, proxy?: Proxy) {
        super(privateKey);
    }

    toString(): string {
        return `[${this.signer.publicKey}] | Claiming ES...`
    }

    async getTokenInfo(
        {
            token,
            address,
            associatedToken,
        }: {
            token?: string;
            address?: PublicKey;
            associatedToken?: PublicKey;
        }
    ): Promise<{ uiAmount: number; value: number; decimals: number }> {
        if (!address) throw new Error("address is required");

        const isSol = !token || token === "ETH";

        let balance = 0;
        let decimals = 9;

        if (!isSol) {
            const mint = ES_TOKEN_MINT;

            if (!associatedToken) {
                return {
                    uiAmount: 0,
                    value: 0,
                    decimals: 0
                };
            }

            try {
                const accountInfo = await this.connection.getTokenAccountBalance(associatedToken);
                balance = parseInt(accountInfo.value.amount, 10);
                decimals = accountInfo.value.decimals;
            } catch {
                const parsed = await this.connection.getParsedAccountInfo(mint);
                const data = parsed.value?.data as any;
                decimals = data?.parsed?.info?.decimals ?? 0;
                balance = 0;
            }
        } else {
            const accountInfo = await this.connection.getAccountInfo(address);
            balance = accountInfo?.lamports ?? 0;
            decimals = 9;
        }

        return {
            uiAmount: balance / 10 ** decimals,
            value: balance,
            decimals,
        };
    }

    async getClaimableBalance(dropOwner: PublicKey) {
        const tokenAccounts: any = await this.connection.getTokenAccountsByOwner(dropOwner, {
            mint: ES_TOKEN_MINT
        });
        if (tokenAccounts.value.length > 0) {
            const tokenAccountPubkey: PublicKey = tokenAccounts.value[0].pubkey;

            const tokenInfo = await this.getTokenInfo({
                address: this.signer.publicKey,
                token: "ES",
                associatedToken: tokenAccountPubkey,
            });

            return tokenInfo;
        }
    }

    @retry(5, 10, 1.5)
    async claimTokens() {
        const [dropOwner] = PublicKey.findProgramAddressSync(
            [Buffer.from("claim"), this.signer.publicKey.toBuffer()],
            CUSTOM_PROGRAM_ID
        );

        const tokenInfo = await this.getClaimableBalance(dropOwner)
        if (!tokenInfo) {
            logger("info", `[${this.signer.publicKey}] | Wallet address is not eligible`)
            return undefined;
        }
        let ixs = [];
        let ata = deriveAta(
            this.signer.publicKey,
            ES_TOKEN_MINT,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const [claimToken] = PublicKey.findProgramAddressSync(
            [Buffer.from("claim_token"), this.signer.publicKey.toBuffer()],
            CUSTOM_PROGRAM_ID
        );

        const accountInfo = await this.connection.getAccountInfo(ata);
        if (!accountInfo) {
            ixs.push(
                createAta({
                    fundingAddress: this.signer.publicKey,
                    associatedAccountAddress: ata,
                    walletAddress: this.signer.publicKey,
                    tokenMintAddress: ES_TOKEN_MINT,
                    tokenProgramId: TOKEN_2022_PROGRAM_ID,
                    instruction: 1
                })
            );
        }

        ixs.push(
            new TransactionInstruction({
                programId: CUSTOM_PROGRAM_ID,
                data: Buffer.from("3ec6d6c1d59f6cd2", "hex"),
                keys: [
                    {pubkey: AIRDROP_STATE, isSigner: false, isWritable: false},
                    {pubkey: dropOwner, isSigner: false, isWritable: true},
                    {pubkey: claimToken, isSigner: false, isWritable: true},
                    {pubkey: this.signer.publicKey, isSigner: true, isWritable: true},
                    {pubkey: ata, isSigner: false, isWritable: true},
                    {pubkey: ES_TOKEN_MINT, isSigner: false, isWritable: false},
                    {pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false},
                ],
            })
        );
        const transaction = new Transaction().add(...ixs)

        const signature = await sendAndConfirmTransaction(this.connection, transaction, [this.signer]);
        if (signature) {
            logger("info", `Successfully claimed ${tokenInfo.uiAmount} ES | TX: https://eclipsescan.xyz/tx/${signature}`);
            return true
        }
    }
}