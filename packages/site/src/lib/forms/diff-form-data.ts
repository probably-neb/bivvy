import { assert } from "../utils";
import { decodeFormData, decodeObjFormData } from "./decode-form-data";
import { EncodedFormData, Primitive } from "./encode-form-data";
import * as R from "remeda";

export type FormDataChange =
    | {
          type: "add";
          path: string;
          value: Primitive;
      }
    | {
          type: "del";
          path: string;
      }
    | {
          type: "mod" /* modify */;
          path: string;
          value: Primitive;
      };

namespace Change {
    export function add(path: string, value: Primitive): FormDataChange {
        return {
            type: "add",
            path,
            value,
        };
    }

    export function del(path: string): FormDataChange {
        return {
            type: "del",
            path,
        };
    }

    export function mod(path: string, value: Primitive): FormDataChange {
        return {
            type: "mod",
            path,
            value,
        };
    }
}

export type FormDataDiff = Array<FormDataChange>;

export function diffFormData(
    original: EncodedFormData,
    updated: EncodedFormData,
): FormDataDiff {
    let diffs = new Array<FormDataChange>();

    assert(
        R.isPlainObject(original) && R.isPlainObject(updated),
        "expected plain objects to diff",
    );

    let deleted = new Array<string>();

    for (let key in original) {
        if (key in updated) {
            continue;
        }
        deleted.push(key);
    }

    console.time("prefix-elim");
    // identifying subtree removal
    if (deleted.length > 0) {
        clearRemovedSubtrees(deleted, Object.keys(updated), diffs);
    }
    console.timeEnd("prefix-elim");

    for (let key in updated) {
        let isKeyInOriginal = key in original;
        let isAdd = !isKeyInOriginal;
        let isMod = isKeyInOriginal && updated[key] !== original[key];
        if (isAdd) {
            diffs.push(Change.add(key, updated[key]));
        }
        if (isMod) {
            diffs.push(Change.mod(key, updated[key]));
        }
    }

    return diffs;
}

export function convertDiffToPartial(diff: FormDataDiff): Record<string, any> {
    const data = R.pipe(
        diff,
        R.map((change): [string, Primitive] => {
            switch (change.type) {
                case "mod":
                case "add":
                    return [change.path, change.value] as const;
                case "del":
                    return [change.path, undefined] as const;
            }
        }),
        R.fromEntries(),
        decodeObjFormData,
    );
    return data;
}

/**
 * Adds Deletion changes to diffs after eliminating paths found
 * in deleted that were part of a subtree that was entirely removed
 *
 * i.e. if the user type was
 * `{name: {first: string, last: string}...}`
 * and `name` was removed, then the deleted would be
 * `['name.first', 'name.last']`
 * this function will only add one deletion change to
 * diffs that has path `name`
 *
 * @param deleted list of keys that were deleted from the original form data
 * @param updatedKeys list of keys present in updated form data
 * @param diffs list of diffs between original and updated to add deletions too
 */
function clearRemovedSubtrees(
    deleted: Array<string>,
    updatedKeys: Array<string>,
    diffs: FormDataDiff,
) {
    const commonPrefixMap = groupByCommonPrefix(deleted);

    /**
     * An array that is the same length as deleted
     * where the boolean value at the corresponding index in this list
     * as well as deleted describes
     */
    let deletedKeep = new Array(deleted.length).fill(true);

    /**
     * List of prefixes that describe subtrees that were entirely removed
     * i.e. no keys with a prefix in this list are present in updatedKeys
     *
     * this is the list of prefixes we add deleted changes for into diffs
     * to describe the removal of an entire subtree
     */
    let deletedPrefixes = new Array<string>();

    /** list of prefixes to remove once inner for loop over
     * commonPrefixMap entries finishes
     * this ensures all map entries are iterated over by
     * deferring entry removal until after iteration
     * truncated at the end of each iteration of the while loop
     */
    let prefixRemove = new Array<string>();

    while (commonPrefixMap.size > 0) {
        // prefix is the common prefix shared by all subtrees within subprefixes, and items (leaf nodes) in deletedItems
        for (const [
            prefix,
            [subPrefixes, ...deletedItems],
        ] of commonPrefixMap.entries()) {
            let isPrefixedByDeletedPrefix = false;
            for (
                let deletedPreIndex = 0;
                deletedPreIndex < deletedPrefixes.length &&
                !isPrefixedByDeletedPrefix;
                deletedPreIndex++
            ) {
                let deletedPrefix = deletedPrefixes[deletedPreIndex]!;
                isPrefixedByDeletedPrefix = prefix.startsWith(deletedPrefix);
                assert(
                    !isPrefixedByDeletedPrefix ||
                        prefix.length !== deletedPrefix.length,
                    "no duplicate prefixes",
                );
            }
            if (isPrefixedByDeletedPrefix) {
                // if the current sub tree is prefixed by another
                // (parent) tree in deletedPrefix, handling this prefix
                // is redundant as the existence of a parent tree in
                // the list of sub trees that were completely removed
                // implies this sub-sub tree was also completely removed
                //
                // this early return cut the runtime of this function in half
                // for trivial inputs
                prefixRemove.push(prefix);
                continue;
            }
            let allSubPrefixesHandled = true;
            for (
                let subIndex = 0;
                subIndex < subPrefixes.length && allSubPrefixesHandled;
                subIndex++
            ) {
                allSubPrefixesHandled = !commonPrefixMap.has(
                    subPrefixes[subIndex]!,
                );
            }
            if (!allSubPrefixesHandled) {
                // until all subprefixes are handled,
                // don't handle this prefix
                continue;
            }

            // determine whether all sub items were removed
            // from the original data - i.e. no key has the current
            // prefix as a prefix
            let allSubItemsDeleted = true;
            for (
                let updatedKeyIndex = 0;
                updatedKeyIndex < updatedKeys.length && allSubItemsDeleted;
                updatedKeyIndex++
            ) {
                allSubItemsDeleted =
                    !updatedKeys[updatedKeyIndex]!.startsWith(prefix);
            }

            if (!allSubItemsDeleted) {
                // if not all items from the sub tree were deleted,
                // mark the prefix for removal from the commonPrefixMap
                prefixRemove.push(prefix);
                continue;
            }

            // if all sub items were removed, mark all of the sub items
            // as redundant so we don't add deletion changes for them
            // to diffs
            for (let i = 0; i < deletedItems.length; i++) {
                let item = deletedItems[i]! as string;
                let deletedItemIndex = deleted.indexOf(item);
                assert(
                    deletedItemIndex !== -1,
                    "trying to remove key from deleted keys list that isn't present",
                );
                console.log(
                    "deleting",
                    deletedItemIndex,
                    deleted[deletedItemIndex],
                );
                deletedKeep[deletedItemIndex] = false;
            }

            let isAddDeletedPrefixHandled = false;
            for (
                let deletedPreIndex = 0;
                deletedPreIndex < deletedPrefixes.length;
                deletedPreIndex++
            ) {
                let deletedPrefix = deletedPrefixes[deletedPreIndex]!;
                if (deletedPrefix.startsWith(prefix)) {
                    assert(
                        deletedPrefix.length !== prefix.length,
                        `duplicate prefixes in deletedPrefixes: ${deletedPrefix}, ${prefix}`,
                        // if length is same and one starts with the other
                        // they are equal
                    );

                    // overwrite deletedPreIndex because we know the
                    // entire subtree described by `prefix` was deleted,
                    // therefore if `deletedPrefix` has `prefix` as a
                    // prefix then the information it conveys is that
                    // a subtree `deletedPrefix` of another parent tree
                    // `prefix` that was entirely removed
                    // was also entirely removed which is redundant
                    // as we already know the subtree was removed based
                    // on the fact the parent tree was entirely removed
                    deletedPrefixes[deletedPreIndex] = prefix;
                    isAddDeletedPrefixHandled = true;
                    break;
                }
                assert(
                    !prefix.startsWith(deletedPrefix),
                    `assert that prefix: ${prefix} does not start with deleted prefix: ${deletedPrefix}. if this is false something has gone wrong because this should have been caught by the early return above`,
                );
            }

            if (!isAddDeletedPrefixHandled) {
                // if prefix wasn't skipped or added to deletedPrefixes
                // above then just push it into the deletedPrefix list
                deletedPrefixes.push(prefix);
            }

            // we have now marked all of the keys within the subtree
            // described by `prefix` as redundant
            // therefore mark this prefix for removal from
            // commonPrefixMap
            prefixRemove.push(prefix);
        }

        // remove prefixes we added to prefixRemove from commonPrefixMap
        if (prefixRemove.length > 0) {
            for (const prefix of prefixRemove) {
                commonPrefixMap.delete(prefix);
            }
            // truncate prefixRemove list
            prefixRemove.splice(0, prefixRemove.length);
        }
    }

    for (let deletedIndex = 0; deletedIndex < deleted.length; deletedIndex++) {
        if (deletedKeep[deletedIndex]) {
            diffs.push(Change.del(deleted[deletedIndex]!));
        }
    }

    for (const deletedPrefix of deletedPrefixes) {
        diffs.push(Change.del(deletedPrefix));
    }
}

function groupByCommonPrefix(items: Array<string>) {
    const groups = new Map<string, [Array<string>, ...Array<string>]>();

    for (const item of items) {
        const parts = item.split(/[\.\[]/);
        let currentPath = "";
        let prevPath = "";

        let isItemArrayElem = item.endsWith("]");

        for (let index = 0; index < parts.length; index++) {
            let part = parts[index]!;
            assert(part !== "", "part is empty");

            prevPath = currentPath;
            const sep = part.endsWith("]") ? "[" : index > 0 ? "." : "";
            currentPath += sep + part;

            let isSubFieldOfRepeat = groups.has(prevPath);

            let isObjectFieldOfRepeat =
                isSubFieldOfRepeat &&
                index === parts.length - 1 &&
                !isItemArrayElem;

            if (isObjectFieldOfRepeat) {
                groups.get(prevPath)!.push(currentPath);
                continue;
            } else if (isSubFieldOfRepeat) {
                // TODO: document whats going on here
                let prevPathSubFields = groups.get(prevPath)!;
                let prevPathSubParentFields = prevPathSubFields[0];
                if (!prevPathSubParentFields.includes(currentPath)) {
                    prevPathSubParentFields.push(currentPath);
                }
            }

            let isRepeat = groups.has(currentPath);

            if (!isRepeat) {
                groups.set(currentPath, [[]]);
            }

            // groups[currentPath] += 1
        }
    }

    return groups;
}
