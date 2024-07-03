import { f } from "data-facade";
import { Contact, ContactsHandlers } from "./types";

const CONTACTS = [
  {
    name: "Alice",
    address: "7e5070ea40b3ff7a8c54697084abed1b4dd86c026235eb8d23e6412431a36833",
  },
];

export const contactsDemoHandlers = f.facade<ContactsHandlers>({
  createContact: f.handler.mutation(
    async ({ contact }: { contact: Contact }) => {
      CONTACTS.push(contact);
    },
  ),
  deleteContact: f.handler.mutation(
    async ({ name, contact }: { name: string; contact: Partial<Contact> }) => {
      const index = CONTACTS.findIndex((c) => c.name === name);
      if (index === -1) {
        throw new Error("Contact not found");
      }
      CONTACTS[index] = { ...CONTACTS[index], ...contact };
    },
  ),
  getContact: f.handler.query(
    async (args: { name: string } | { address: string }) => {
      if ("name" in args) {
        return CONTACTS.find((c) => c.name === args.name) ?? null;
      } else {
        return CONTACTS.find((c) => c.address === args.address) ?? null;
      }
    },
  ),
  getContacts: f.handler.query(async ({ search }: { search?: string }) => {
    if (!search) {
      return CONTACTS;
    }
    return CONTACTS.filter(
      (c) => c.name.includes(search) || c.address.includes(search),
    );
  }),
  updateContact: f.handler.mutation(
    async ({ name, contact }: { name: string; contact: Partial<Contact> }) => {
      const index = CONTACTS.findIndex((c) => c.name === name);
      if (index === -1) {
        throw new Error("Contact not found");
      }
      CONTACTS[index] = { ...CONTACTS[index], ...contact };
    },
  ),
});
