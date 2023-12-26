import { createSignal } from "solid-js";

export const USERS = [
    {
        id: "Alice_fjIqVhRO63mS0mu",
        name: "Alice",
    },
    {
        id: "Bob_oTfjIqVhRO63mS0mv",
        name: "Bob",
    },
    {
        id: "Charlie_123456789ABCD",
        name: "Charlie",
    },
    {
        id: "David_123456789ABCDEF",
        name: "David",
    },
];

export type User = (typeof USERS)[number];

export const [currentUser, setCurrentUser] = createSignal<User>(USERS[0]);
