/**
 * QuickBooks Online API Types
 */

export interface QuickBooksCompany {
  CompanyName: string;
  CompanyAddr: {
    Line1?: string;
    City?: string;
    State?: string;
    PostalCode?: string;
    Country?: string;
  };
  LegalName?: string;
  CompanyStartDate?: string;
  FiscalYearStartMonth?: string;
  Domain?: string;
  sparse?: boolean;
  Id?: string;
  SyncToken?: string;
  MetaData?: {
    CreateTime?: string;
    LastUpdatedTime?: string;
  };
}

export interface QuickBooksAccount {
  Id: string;
  Name: string;
  AccountType: string;
  AccountSubType?: string;
  Active?: boolean;
  Classification?: string;
  CurrencyRef?: {
    value: string;
    name?: string;
  };
  CurrentBalance?: number;
  CurrentBalanceWithSubAccounts?: number;
  MetaData?: {
    CreateTime?: string;
    LastUpdatedTime?: string;
  };
}

export interface QuickBooksTransaction {
  Id: string;
  TxnDate: string;
  Amount: number;
  PrivateNote?: string;
  TxnType?: string;
  Line?: Array<{
    Id?: string;
    Amount?: number;
    DetailType: string;
    Description?: string;
    AccountRef?: {
      value: string;
      name?: string;
    };
  }>;
  EntityRef?: {
    value: string;
    name?: string;
    type?: string;
  };
  MetaData?: {
    CreateTime?: string;
    LastUpdatedTime?: string;
  };
}

export interface QuickBooksJournalEntry extends QuickBooksTransaction {
  DocNumber?: string;
  Adjustment?: boolean;
  Line: Array<{
    Id?: string;
    Amount: number;
    DetailType: string;
    Description?: string;
    JournalEntryLineDetail: {
      PostingType: 'Debit' | 'Credit';
      AccountRef: {
        value: string;
        name?: string;
      };
      EntityRef?: {
        value: string;
        name?: string;
        type?: string;
      };
    };
  }>;
}

export interface QuickBooksQueryResponse<T> {
  QueryResponse: {
    [key: string]: T[] | number | undefined;
    maxResults?: number;
    startPosition?: number;
  };
  time: string;
}

export interface QuickBooksError {
  Fault: {
    type: string;
    Error: Array<{
      Detail: string;
      code: string;
      element: string;
      Message: string;
    }>;
  };
  time: string;
}

export interface QuickBooksOAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  realmId: string;
}
