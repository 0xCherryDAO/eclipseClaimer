import {WorkingWallets, WalletsTasks} from "./models";
import {
    CLAIM, SEND_TOKENS,
} from "../../config";
import {DataBaseUtils} from "./utils/dbManager";
import {DataBaseManagerConfig} from "./baseModels/pydanticManager";
import {logger} from "../utils/logger";
import fs from "fs";

export async function clearDatabase(): Promise<void> {
    const repositoryList = [WorkingWallets, WalletsTasks];

    for (const repository of repositoryList) {
        await repository.clear();
    }
    logger("info", "Database cleared.");
}

export interface AddToDbParams {
    privateKey: string;
    evmPrivateKey?: string;
    currentStatus: string;
    taskName?: string;
    proxy?: string;
    twitterToken?: string;
    recipient?: string;
}

export async function generateDatabase(privateKeys: string[], recipients: string[]): Promise<void> {
    await clearDatabase();
    let tasks: any[] = [];

    if (CLAIM) {
        tasks.push('CLAIM');
    }
    if (SEND_TOKENS) {
        tasks.push('SEND_TOKENS')
    }

    const hasClaim = tasks.includes('CLAIM');

    const otherTasks = tasks.filter(
        task => task !== 'CLAIM'
    );

    for (let i = otherTasks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherTasks[i], otherTasks[j]] = [otherTasks[j], otherTasks[i]];
    }

    tasks = [
        ...(hasClaim ? ['CLAIM'] : []),
        ...otherTasks,
    ];

    let proxyIndex = 0;

    for (const privateKey of privateKeys) {
        const filePrivateKeys: string[] = fs.readFileSync('wallets.txt', {encoding: 'utf-8'})
            .split('\n')
            .map(line => line.trim());

        let privateKeyIndex = filePrivateKeys.indexOf(privateKey);

        let recipient = undefined;

        if (SEND_TOKENS) {
            if (privateKeys.length != recipients.length) {
                logger("error", "Number private keys does not match number of recipients");
                return
            }
            recipient = recipients[privateKeyIndex];
        }


        let databaseUtils = new DataBaseUtils(
            new DataBaseManagerConfig('working_wallets')
        );

        let evmPrivateKey = undefined;
        let twitterToken = undefined;

        await databaseUtils.addToDb({
            privateKey: privateKey,
            evmPrivateKey: evmPrivateKey,
            currentStatus: 'pending',
            twitterToken: twitterToken,
            recipient: recipient,
        });

        for (const task of tasks) {
            let databaseUtils = new DataBaseUtils(
                new DataBaseManagerConfig('wallets_tasks')
            );
            await databaseUtils.addToDb({
                privateKey: privateKey,
                currentStatus: 'pending',
                taskName: task,
            })
        }
    }
    logger("info", "Database populated.");
}
