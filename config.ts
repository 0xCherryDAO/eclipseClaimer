export const SHUFFLE_WALLETS = true;  // Перемешивать ли кошельки
export const PAUSE_BETWEEN_WALLETS = [1, 4];  // Пауза в секундах [от, до] между стартом кошельков
export const PAUSE_BETWEEN_MODULES = [1, 4];  // Пауза в секундах [от, до] между модулями для кошелька
export const TG_BOT_TOKEN = '' // Токен телеграм бота для уведомлений. Если не нужно использовать, то указываем null
export const TG_USER_ID = 12345 // Цифровой id пользователя, кому отправлять уведомления. Если не нужно использовать, то указываем null

export const CLAIM = false; // Клейм токенов
export const SEND_TOKENS = false; // Отправка токенов на адреса из recipients.txt