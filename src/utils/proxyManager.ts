import axios from 'axios';
import {logger} from "./logger";

export class Proxy {
    proxyUrl: string;
    changeLink?: string;

    constructor(proxyUrl: string, changeLink?: string) {
        this.proxyUrl = proxyUrl;
        this.changeLink = changeLink;
    }

    public async changeIp(): Promise<void> {
        if (this.changeLink) {
            while (true) {
                try {
                    const response = await axios.get(this.changeLink);
                    if (response.status !== 200) {
                        logger('error', 'failed to change IP');
                        continue;
                    }
                    break;

                } catch (error) {
                    logger('error', 'Failed to change IP');
                    await this.sleep(4000);
                }
            }
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
