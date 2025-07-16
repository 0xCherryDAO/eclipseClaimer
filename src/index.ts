import {randomInt} from "crypto";
import inquirer from 'inquirer';
import {generateDatabase} from "./database/generateDatabase";
import {initModels} from "./database/models";
import {Route} from "./models/route";
import {privateKeys, recipients} from "./utils/data/helper";
import {manageTasks} from "./utils/manageTasks";
import {getRoutes} from "./utils/retrieveRoute";
import {
    processClaim, processSendTokens
} from "./utils/runner";
import {
    PAUSE_BETWEEN_MODULES,
    PAUSE_BETWEEN_WALLETS,
    SHUFFLE_WALLETS,
    TG_BOT_TOKEN,
    TG_USER_ID
} from "../config";
import {logger} from "./utils/logger";
import {RouteResponse} from "./utils/retrieveRoute";
import {TGApp} from "./utils/tgApp/telegram";

async function getModule(): Promise<number> {
    const {module} = await inquirer.prompt([
        {
            type: 'list',
            name: 'module',
            message: 'Выберите модуль',
            choices: [
                {name: '1) Сгенерировать новую базу данных с маршрутами', value: 1},
                {name: '2) Отработать по базе данных', value: 2},
            ]
        }
    ]);
    return module;
}

async function processTask(routes: RouteResponse[]): Promise<void> {
    if (!routes.length) {
        logger("info", "Все задания из базы данных выполнены");
        return;
    }

    const tasks: Promise<void>[] = [];

    for (const route of routes) {
        tasks.push(processRoute(route));

        const timeToPause = Array.isArray(PAUSE_BETWEEN_WALLETS)
            ? randomInt(PAUSE_BETWEEN_WALLETS[0], PAUSE_BETWEEN_WALLETS[1] + 1)
            : PAUSE_BETWEEN_WALLETS;

        logger("info", `Сплю ${timeToPause} секунд перед следующим кошельком...`);
        await new Promise(resolve => setTimeout(resolve, timeToPause * 1000));
    }

    await Promise.all(tasks);
}

async function processRoute(route: Route): Promise<void> {
    const privateKey = route.wallet.privateKey;
    const evmPrivateKey = route.wallet.evmPrivateKey;

    const modulesMapping: { [key: string]: (route: Route) => Promise<boolean | undefined> } = {
        'CLAIM': processClaim,
        'SEND_TOKENS': processSendTokens
    }

    for (const task of route.tasks) {
        let completed: boolean | undefined;

        completed = await modulesMapping[task](route);

        if (completed) {
            await manageTasks(privateKey, task);
        }

        const timeToPause = Array.isArray(PAUSE_BETWEEN_MODULES)
            ? randomInt(PAUSE_BETWEEN_MODULES[0], PAUSE_BETWEEN_MODULES[1] + 1)
            : PAUSE_BETWEEN_MODULES;

        logger("info", `Сплю ${timeToPause} секунд перед следующим модулем...`);
        await new Promise(resolve => setTimeout(resolve, timeToPause * 1000));
    }

    if (TG_BOT_TOKEN && TG_USER_ID) {
        const TG = new TGApp(TG_BOT_TOKEN, TG_USER_ID, privateKey);
        await TG.sendMessage()
    }
}

async function main(): Promise<void> {
    await initModels();
    const module = await getModule();

    if (module === 1) {
        if (SHUFFLE_WALLETS) {
            privateKeys.sort(() => Math.random() - 0.5);
        }
        logger("info", "Генерация новой базы данных с маршрутами...");
        await generateDatabase(privateKeys, recipients);
    } else if (module === 2) {
        logger("info", "Отработка по базе данных...");
        const routes = await getRoutes(privateKeys);
        if (routes) {
            await processTask(routes);
        } else {
            logger("info", "Все кошельки уже отработали");
        }
    } else {
        console.error("Неверный выбор.");
        return;
    }
}

main().catch(error => {
    logger("error", error);
    process.exit(1);
});
