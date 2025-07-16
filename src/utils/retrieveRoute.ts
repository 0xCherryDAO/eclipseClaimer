import {logger} from "./logger";
import {DataBaseManagerConfig} from "../database/baseModels/pydanticManager";
import {DataBaseUtils} from "../database/utils/dbManager";
import {Wallet} from "../models/route";
import {WorkingWallets} from "../database/models";
import {Proxy} from "./proxyManager";

export interface RouteResponse {
    tasks: string[];
    wallet: Wallet;
}

export async function getRoutes(privateKeys: string[]): Promise<RouteResponse[] | undefined> {
    const dbUtils = new DataBaseUtils(
        new DataBaseManagerConfig(
            'working_wallets',
        )
    );

    const result: WorkingWallets[] = await dbUtils.getPendingWallets();
    if (!result || result.length === 0) {
        logger("info", 'Все кошельки с данной базы данных уже отработали');
        return;
    }

    const routes: RouteResponse[] = [];

    for (const wallet of result) {
        const privateKeyTasks: any = await dbUtils.getWalletPendingTasks(wallet.private_key);
        const tasks: string[] = [];
        for (const task of privateKeyTasks) {
            tasks.push(task.task_name);
        }

        let proxyInstance: Proxy | undefined;
        if (wallet.proxy) {
            proxyInstance = new Proxy(`http://${wallet.proxy}`);
        }

        routes.push({
            tasks,
            wallet: {
                privateKey: wallet.private_key,
                evmPrivateKey: wallet.evmPrivateKey,
                twitterToken: wallet.twitterToken,
                recipient: wallet.recipient,
                proxy: proxyInstance
            },
        });
    }
    return routes;
}
