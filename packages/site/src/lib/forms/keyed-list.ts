"use client";
import { useList } from "@uidotdev/usehooks";
import { nanoid } from "nanoid";
import { useCallback } from "react";
import { assert, dbg } from "../utils";
import * as immer from "immer";
import * as zustand from "zustand";

/**
 * A helper for keyed rendering of a list.
 * By using the ids returned from this hook as the `key` prop to a component,
 * you can ensure the component maintains it's state
 * (input element values, toggle states, etc)
 * without a global store or context
 */
export function useKeyedList(initialLen = 1) {
    const [qids, { push: push_, removeAt }] = useList<string>(
        Array.from({ length: initialLen }, () => nanoid()),
    );
    const push = useCallback(() => {
        // FIXME: more efficient way to generate a unique key
        push_(nanoid());
    }, []);
    return [qids, { push, removeAt }] as const;
}

interface KeyedList {
    keys: Array<string>;
    push(): void;
    removeAt(at: number): void;
    moveFromTo(from: number, to: number): void;
}

export function createKeyedList(
    initialLen = 1,
): (
    set: zustand.StoreApi<KeyedList>["setState"],
    get: zustand.StoreApi<KeyedList>["getState"],
) => KeyedList {
    const initialItems = new Array<string>(initialLen);
    for (let i = 0; i < initialLen; i++) {
        initialItems[i] = i.toString();
    }
    return (set, get) => ({
        keys: [...initialItems],
        // TODO: newAt
        push() {
            let keys = get().keys;
            set({ keys: [...keys, generateNewKey(keys.length)] });
        },
        expandToSize(size: number) {
            let keys = get().keys;
            assert(size > keys.length, "expand to size greater than current size")
            let newKeys = [...keys]
            for (let i = keys.length; i < size; i++) {
                newKeys.push(generateNewKey(i))
            }
            set({keys: newKeys})
        },
        removeAt(at: number) {
            let keys = [...get().keys];
            keys.splice(at, 1);
            set({ keys });
        },
        moveFromTo(from: number, to: number) {
            if (from === to) {
                return;
            }
            set({
                keys: immer.produce(get().keys, (keys) => {
                    let item = keys[from];
                    assert(item != null, "item is not null");
                    keys.splice(to, 0, item);
                    let newFrom = from > to ? from + 1 : from;
                    assert(
                        item === keys[newFrom],
                        "index calculated correctly",
                    );
                    keys.splice(newFrom, 1);
                }),
            });
        },
    });
}

function generateNewKey(keyLen: number) {
    return keyLen + nanoid(4)
}
