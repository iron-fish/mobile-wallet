import { Mutation, Query } from "data-facade";

export type VerifiedAssetMetadata = {
  symbol: string;
  decimals?: number;
  logoURI?: string;
  website?: string;
};

export type AssetVerification =
  | { status: "unverified" | "unknown" }
  | ({ status: "verified" } & VerifiedAssetMetadata);

export type Contact = {
  name: string;
  address: string;
};

export type ContactsHandlers = {
  createContact: Mutation<(args: { contact: Contact }) => void>;
  deleteContact: Mutation<(args: { name: string }) => void>;
  getContact: Query<
    (args: { name: string } | { address: string }) => Contact | null
  >;
  getContacts: Query<(args: { search?: string }) => Contact[]>;
  updateContact: Mutation<
    (args: { name: string; contact: Partial<Contact> }) => void
  >;
};
