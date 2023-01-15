export const CURRENT_MONITORED_ADDRESS_VERSION = 6;

export class RecipientInfo {
    transactionCount: number = 0;
    gasFees: number = 0;
    glmTransferred: number = 0;
}

export class MonitoredAddress {
    address: string = "";
    transactionsLast24hours: number = 0;
    transactionsLastHour: number = 0;
    glmTransferredLast24hours: number = 0;
    gasFeesPaidLast24hours: number = 0;
    uniqueRecipients: { [address: string]: RecipientInfo } = {};
    version = CURRENT_MONITORED_ADDRESS_VERSION;
}
