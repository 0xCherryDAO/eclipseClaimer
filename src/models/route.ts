import {ValidateIf, IsString, IsArray} from "class-validator";
import {Proxy} from "../utils/proxyManager";

class Wallet {
    @IsString()
    privateKey!: string;
    evmPrivateKey?: string;
    twitterToken?: string;
    recipient?: string;
    proxy?: Proxy;

    constructor(privateKey: string, evmPrivateKey?: string, twitterToken?: string, proxy?: string) {
        this.privateKey = privateKey;
        this.evmPrivateKey = evmPrivateKey;
        this.twitterToken = twitterToken;

        if (proxy) {
            let proxyUrl: string;
            let changeLink: string | undefined;
            proxyUrl = proxy;
            this.proxy = new Proxy(`http://${proxyUrl}`, changeLink);
        }
    }
}

class Route {
    @IsArray()
    @IsString({each: true})
    tasks!: string[];

    wallet!: Wallet;

    constructor(tasks: string[], wallet: Wallet) {
        this.tasks = tasks;
        this.wallet = wallet;
    }
}

export {Route, Wallet}
