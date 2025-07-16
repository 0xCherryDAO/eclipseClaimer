import {Route} from "../models/route";
import {Claimer} from "../modules/claimer/eclipseClaimer";
import {Account} from "./user/solanaAccount";
import {PublicKey} from "@solana/web3.js";
import {logger} from "./logger";

export async function processClaim(route: Route): Promise<boolean | undefined> {
    const claimer = new Claimer(route.wallet.privateKey, route.wallet.proxy)
    return await claimer.claimTokens()
}

export async function processSendTokens(route: Route): Promise<boolean | undefined> {
    const account = new Account(route.wallet.privateKey, route.wallet.proxy)
    const esBalance = await account.getWalletBalance(
        false, new PublicKey('GnBAskb2SQjrLgpTjtgatz4hEugUsYV7XrWU1idV3oqW')
    )
    if (!route.wallet.recipient) {
        logger('error', `[${account.signer.publicKey}] | Recipient is not provided.`)
        return false
    }
    if (!esBalance?.balance || esBalance.balance === 0) {
        logger('info', `[${account.signer.publicKey}] | ES balance is 0.`)
        return false
    }

    return await account.sendTokens(
        new PublicKey(route.wallet.recipient),
        esBalance.balance,
        esBalance.decimals
    )
}