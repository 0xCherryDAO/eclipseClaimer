import {DataBaseUtils} from "../database/utils/dbManager";
import {DataBaseManagerConfig} from "../database/baseModels/pydanticManager";

export async function manageTasks(privateKey: string, task: string) {
    const dbUtils = new DataBaseUtils(
        new DataBaseManagerConfig(
            'wallets_tasks'
        )
    )
    await dbUtils.addToDb({
        privateKey: privateKey,
        taskName: task,
        currentStatus: 'completed'
    });
}