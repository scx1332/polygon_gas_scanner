export const CURRENT_ERC20_TRANSACTION_VERSION = 5;

export class TransactionERC20Entry {
    txid = "";
    blockNo = 0;
    gasPrice = "";
    gasUsed = "";
    from = "";
    to = "";
    nonce = 0;
    datetime = "";
    erc20from = "";
    erc20to = "";
    erc20amount = "";
    version = CURRENT_ERC20_TRANSACTION_VERSION;
}
