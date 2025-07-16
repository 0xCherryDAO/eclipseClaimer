import {Entity, PrimaryGeneratedColumn, Column, BaseEntity, DataSource} from "typeorm";
import {logger} from "../utils/logger";

@Entity("working_wallets")
export class WorkingWallets extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    private_key!: string;

    @Column({nullable: true})
    evmPrivateKey?: string;

    @Column({nullable: true})
    twitterToken?: string;

    @Column({nullable: true})
    proxy?: string;

    @Column({nullable: true})
    recipient?: string;

    @Column()
    currentStatus!: string;
}

@Entity("wallets_tasks")
export class WalletsTasks extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    private_key!: string;

    @Column()
    task_name!: string;

    @Column()
    currentStatus!: string;
}

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "transactions.db",
    synchronize: true,
    logging: false,
    entities: [WorkingWallets, WalletsTasks],
});

export async function initModels() {
    await AppDataSource.initialize();
    logger('debug', "Database initialized");
}
