class Chain {
    chainId: number;
    rpc: string;
    scan: string;
    nativeToken: string;

    constructor(chainId: number, rpc: string, scan: string, nativeToken: string) {
        this.chainId = chainId;
        this.rpc = rpc;
        this.scan = scan;
        this.nativeToken = nativeToken;
    }
}

const BASE = new Chain(
    8453,
    "https://base-pokt.nodies.app",
    "https://basescan.org/tx",
    "ETH"
);

const ECLIPSE = new Chain(
    9286185,
    'https://eclipse.helius-rpc.com',
    'https://eclipsescan.xyz/tx/',
    'ETH'
)

const ARB = new Chain(
    42161,
    'https://arb-pokt.nodies.app',
    'https://arbiscan.io/tx/',
    'ETH'
)

const OP = new Chain(
    10,
    'https://op-pokt.nodies.app',
    'https://optimistic.etherscan.io/tx/',
    'ETH'
)

const ERC20 = new Chain(
    1,
    'https://ethereum-rpc.publicnode.com',
    'https://etherscan.io/tx/',
    'ETH'
)

const CHAIN_MAPPING: Record<string, Chain> = {
    'Arbitrum One': ARB,
    'ARBITRUM ONE': ARB,
    ECLIPSE: ECLIPSE,
    BASE: BASE,
    Base: BASE,
    OP: OP,
    Optimism: OP,
    OPTIMISM: OP,
    ARB: ARB,
    ARBITRUM: ARB,
    ETH: ERC20,
    ERC20: ERC20,
}

export {BASE, ECLIPSE, CHAIN_MAPPING};
