import {WorkingWallets, WalletsTasks} from "../models";

export class DataBaseManagerConfig {
    action!: string;
    tableObject!: typeof WorkingWallets | typeof WalletsTasks;

    constructor(action: string) {
        const tableMapping: any = {
            working_wallets: WorkingWallets,
            wallets_tasks: WalletsTasks,
        };

        if (!tableMapping[action]) {
            throw new Error("Invalid action");
        }

        this.action = action;
        this.tableObject = tableMapping[action];
    }
}
