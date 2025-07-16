import {logger} from "../logger";

export function retry(retries: number, delay: number, backoff: number) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            for (let i = 0; i <= retries; i++) {
                try {
                    return await originalMethod.apply(this, args);
                } catch (ex) {
                    if (i === retries) {
                        logger("error", `${ex}`);
                    } else {
                        await new Promise(resolve => setTimeout(resolve, delay * (backoff ** i)));
                    }
                }
            }
        };

        return descriptor;
    };
}
