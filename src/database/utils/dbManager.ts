import {Repository} from "typeorm";
import {AppDataSource} from "../models";
import {WorkingWallets, WalletsTasks} from "../models";
import {DataBaseManagerConfig} from "../baseModels/pydanticManager";
import {logger} from "../../utils/logger";
import {AddToDbParams} from "../generateDatabase";

export class DataBaseUtils {
    private repository: Repository<WorkingWallets | WalletsTasks>;

    constructor(managerConfig: DataBaseManagerConfig) {
        this.repository = AppDataSource.getRepository(managerConfig.tableObject);
    }

    async addToDb(params: AddToDbParams) {
        const existingEntry = await this.repository.findOne({
            where: {
                private_key: params.privateKey,
                ...(params.taskName && {task_name: params.taskName}),
            },
        });

        if (existingEntry) {
            existingEntry.currentStatus = params.currentStatus;
            await this.repository.save(existingEntry);
            logger('info', `Updated existing entry: ${params.privateKey.slice(0, 5)}...${params.privateKey.slice(-5)}`);
        } else {
            const newEntry = this.repository.create({
                private_key: params.privateKey,
                evmPrivateKey: params.evmPrivateKey,
                currentStatus: params.currentStatus,
                ...(params.proxy && {proxy: params.proxy}),
                ...(params.twitterToken && {twitterToken: params.twitterToken}),
                ...(params.recipient && {recipient: params.recipient}),
                ...(params.taskName && {task_name: params.taskName}),
            });
            await this.repository.save(newEntry);
            if (params.taskName) {
                logger("info", `Added new entry: ${params.privateKey.slice(0, 5)}...${params.privateKey.slice(-5)} | TASK: ${params.taskName}`);
            }
        }
        if (params.taskName && params.currentStatus === 'completed') {
            await this.checkAndUpdateWorkingWallets(params.privateKey);
        }
    }

    private async checkAndUpdateWorkingWallets(privateKey: string): Promise<void> {
        const pendingTasks = await this.repository.find({
            where: {
                private_key: privateKey,
                currentStatus: 'pending',
            },
        });

        if (pendingTasks.length === 0) {
            const workingWallet = await WorkingWallets.findOne({
                where: {private_key: privateKey},
            });

            if (workingWallet) {
                workingWallet.currentStatus = 'completed';
                await WorkingWallets.save(workingWallet);
                logger('info', `Updated WorkingWallets entry to completed for private_key=${privateKey.slice(0, 5)}...${privateKey.slice(-5)}`);
            }
        }
    }

    async getTasksInfo(privateKey: string): Promise<{
        completedTasks: WalletsTasks[];
        pendingTasks: WalletsTasks[];
    }> {
        const pendingTasks = await this.getPendingTasks(privateKey);
        const completedTasks = await this.getCompletedTasks(privateKey);
        return {completedTasks, pendingTasks};
    }

    async getCompletedTasks(privateKey: string): Promise<WalletsTasks[]> {
        const repository = WalletsTasks;
        return await repository.find({
            where: {currentStatus: 'completed', private_key: privateKey},
        })
    }

    async getPendingTasks(privateKey: string): Promise<WalletsTasks[]> {
        const repository = WalletsTasks;
        return await repository.find({
            where: {currentStatus: 'pending', private_key: privateKey},
        })
    }

    async getPendingWallets() {
        return await this.repository.find({
            where: {currentStatus: "pending"},
        });
    }

    async getWalletPendingTasks(privateKey: string) {
        return await WalletsTasks.find({
            where: {
                private_key: privateKey,
                currentStatus: "pending"
            },
        });
    }

    async getWalletsCount(status: string): Promise<number> {
        const repository = WorkingWallets;
        const completedWallets = await repository.find({
            where: {
                currentStatus: status,
            }
        })
        return completedWallets.length
    }


}
