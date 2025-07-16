import bs58 from 'bs58'
import {
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import {ECLIPSE} from "../data/chains";
import {Proxy} from "../proxyManager";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction,
    createTransferCheckedInstruction,
    getAssociatedTokenAddress,
    TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token";
import {ES_TOKEN_MINT} from "../../modules/claimer/eclipseClaimer";
import {logger} from "../logger";
import {retry} from "../common/retry";

export class Account {
    connection: Connection;
    signer: Keypair;

    constructor(privateKey: string, proxy?: Proxy, RPC_URL = ECLIPSE.rpc) {
        if (proxy) {
            // const agent = new HttpProxyAgent(proxy.proxyUrl);
            this.connection = new Connection(RPC_URL);
        } else {
            this.connection = new Connection(RPC_URL);
        }
        this.signer = Keypair.fromSecretKey(bs58.decode(privateKey));
    }

    @retry(5, 10, 1.5)
    async sendTokens(recipient: PublicKey, value: number, decimals: number) {
        const sourceAta = await getAssociatedTokenAddress(
            ES_TOKEN_MINT,
            this.signer.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const destAta = await getAssociatedTokenAddress(
            ES_TOKEN_MINT,
            recipient,
            false,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const ixs: TransactionInstruction[] = [];
        const destAccount = await this.connection.getAccountInfo(destAta);
        if (!destAccount) {
            ixs.push(
                createAssociatedTokenAccountInstruction(
                    this.signer.publicKey,
                    destAta,
                    recipient,
                    ES_TOKEN_MINT,
                    TOKEN_2022_PROGRAM_ID,
                    ASSOCIATED_TOKEN_PROGRAM_ID
                )
            );
        }
        ixs.push(
            createTransferCheckedInstruction(
                sourceAta,
                ES_TOKEN_MINT,
                destAta,
                this.signer.publicKey,
                value,
                decimals,
                [],
                TOKEN_2022_PROGRAM_ID
            )
        );
        const transaction = new Transaction().add(...ixs)

        const signature = await sendAndConfirmTransaction(this.connection, transaction, [this.signer]);
        if (signature) {
            logger("info", `Successfully transferred ${value / 10 ** decimals} ES to ${recipient} | TX: https://eclipsescan.xyz/tx/${signature}`);
            return true
        }
    }

    async getWalletBalance(
        isNative: boolean, tokenAddress?: PublicKey
    ): Promise<undefined | { balance: number; decimals: number }> {
        if (isNative) {
            let ACCOUNT_INFO = await this.connection.getAccountInfo(this.signer.publicKey);
            if (ACCOUNT_INFO) {
                const balance: number = ACCOUNT_INFO.lamports
                const decimals: number = 9;
                return {balance, decimals};
            }
        }

        if (tokenAddress) {
            const response = await this.connection.getTokenAccountsByOwner(this.signer.publicKey, {
                mint: tokenAddress,
            });
            if (response.value.length === 0) {
                return;
            }
            const tokenAccount = response.value[0].pubkey;
            const balanceResponse = await this.connection.getTokenAccountBalance(tokenAccount);
            if (balanceResponse.value) {
                const balance = Number(balanceResponse.value.amount);
                const decimals = balanceResponse.value.decimals;
                return {balance, decimals};
            } else {
                return;
            }
        }
    }
}
