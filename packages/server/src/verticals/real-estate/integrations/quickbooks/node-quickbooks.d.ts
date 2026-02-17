declare module 'node-quickbooks' {
  class QuickBooks {
    constructor(
      consumerKey: string,
      consumerSecret: string,
      token: string,
      tokenSecret: boolean,
      realmId: string,
      useSandbox: boolean,
      debug: boolean,
      minorversion: number | null,
      oauthversion: string,
      refreshToken: string
    );

    getCompanyInfo(
      realmId: string,
      callback: (err: any, companyInfo: any) => void
    ): void;

    findAccounts(
      criteria: any,
      callback: (err: any, accounts: any) => void
    ): void;

    getAccount(
      id: string,
      callback: (err: any, account: any) => void
    ): void;

    findInvoices(
      criteria: any,
      callback: (err: any, invoices: any) => void
    ): void;

    getInvoice(
      id: string,
      callback: (err: any, invoice: any) => void
    ): void;

    findPayments(
      criteria: any,
      callback: (err: any, payments: any) => void
    ): void;

    getPayment(
      id: string,
      callback: (err: any, payment: any) => void
    ): void;

    findBills(
      criteria: any,
      callback: (err: any, bills: any) => void
    ): void;

    getBill(
      id: string,
      callback: (err: any, bill: any) => void
    ): void;
  }

  export = QuickBooks;
}
