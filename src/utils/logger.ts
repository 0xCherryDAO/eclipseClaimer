import winston from 'winston';

const log = winston.createLogger({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({format: 'DD-MM-YYYY HH:mm:ss'},),
        winston.format.printf(({timestamp, level, message}) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console()
    ],
});

export function logger(level: string, message: string) {
    log.log(level, message);
}
