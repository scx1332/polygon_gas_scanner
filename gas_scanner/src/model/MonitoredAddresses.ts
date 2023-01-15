export const CURRENT_MONITORED_ADDRESS_VERSION = 6;

export class RecipientInfo {
    transactionCount = 0;
    gasFees = 0;
    glmTransferred = 0;
}

export class MonitoredAddress {
    address = "";
    transactionsLast24hours = 0;
    transactionsLastHour = 0;
    glmTransferredLast24hours = 0;
    gasFeesPaidLast24hours = 0;
    uniqueRecipients: { [address: string]: RecipientInfo } = {};
    version = CURRENT_MONITORED_ADDRESS_VERSION;
}
