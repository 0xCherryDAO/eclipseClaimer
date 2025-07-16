import {Account} from "../user/solanaAccount";
import {DataBaseUtils} from "../../database/utils/dbManager";
import {DataBaseManagerConfig} from "../../database/baseModels/pydanticManager";
import axios from "axios";

class TGApp {
    private account: Account;
    private token: string;
    private tgId: number;
    private dbUtils: DataBaseUtils;
    private privateKey: string;

    constructor(token: string, tgId: number, privateKey: string) {
        this.account = new Account(privateKey);

        this.token = token;
        this.tgId = tgId;
        this.privateKey = privateKey;

        this.dbUtils = new DataBaseUtils(
            new DataBaseManagerConfig('wallets_tasks')
        );
    }

    private async getText(): Promise<any> {
        const {
            completedTasks: completedTasks,
            pendingTasks: uncompletedTasks
        } = await this.dbUtils.getTasksInfo(this.privateKey);

        const completedTasksList = completedTasks.length > 0
            ? completedTasks.map(task => `- ${task.task_name}`).join("\n")
            : "No tasks completed.";
        const uncompletedTasksList = uncompletedTasks.length > 0
            ? uncompletedTasks.map(task => `- ${task.task_name}`).join("\n")
            : "All tasks completed.";

        const completedWalletsCount = await this.dbUtils.getWalletsCount('completed');
        const pendingWalletsCount = await this.dbUtils.getWalletsCount('pending');
        const totalWalletsCount = completedWalletsCount + pendingWalletsCount;

        const escapedCompletedTasksList = this.escapeMarkdownV2(completedTasksList);
        const escapedUncompletedTasksList = this.escapeMarkdownV2(uncompletedTasksList);

        return (
            `💼 **Wallet completed its work:**\n` +
            `\`${this.account.signer.publicKey.toString()}\`\n\n` +
            `📋 **Task Summary:**\n` +
            `✅ **Completed Tasks:** ${completedTasks.length}\n` +
            `❌ **Uncompleted Tasks:** ${uncompletedTasks.length}\n\n` +
            `🔍 **Details:**\n\n` +
            `**Completed Tasks:**\n${escapedCompletedTasksList}\n\n` +
            `**Uncompleted Tasks:**\n${escapedUncompletedTasksList}\n\n` +
            `📊 **Overall Progress:**\n` +
            `**Completed Wallets:** ${completedWalletsCount}/${totalWalletsCount}`
        );
    }

    private escapeMarkdownV2(text: string): string {
        const specials = "_-*[]()~`>#+=|{}.!";
        return [...text].map(char => (specials.includes(char) ? `\\${char}` : char)).join("");
    }

    public async sendMessage(): Promise<void> {
        const text = await this.getText();
        await axios.get(
            `https://api.telegram.org/bot${this.token}/sendMessage`,
            {
                params: {
                    parse_mode: "MarkdownV2",
                    disable_web_page_preview: 1,
                    chat_id: this.tgId,
                    text
                }
            }
        );
    }
}

export {TGApp};
