import * as R from "remeda"

/**
 * A function that takes a batch fn which takes an array of items,
 * and returns a new function that takes a single item, adding it to
 * an array of items which will be "flushed" to the batch function
 * either when a timeout is reached (maxWait) or a certain number of items
 * is reached (maxSize)
 */
export function createBatcher<Item, BatchFn extends (items: Array<Item>) => void>(
    batchFunction: BatchFn,
    { maxSize = 10, maxWait = 1000 } = {},
): (item: Item) => void {
    let batch: Array<Item> = [];
    let timeout: NodeJS.Timeout | null = null;

    function flush() {
        if (batch.length > 0) {
            batchFunction(batch);
            batch = [];
        }
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    }

    return function (item) {
        batch.push(item);

        if (batch.length >= maxSize) {
            flush();
        } else if (!timeout) {
            timeout = setTimeout(flush, maxWait);
        }
    };
}

/**
 * Wrapper around createBatcher that maps the incoming items
 * to something else before passing them to the single fn
 */
export function createMappedBatcher<
    Item,
    SubItem,
    BatchFn extends (items: Array<SubItem>) => void,
>(
    mapFn: (item: Item) => SubItem,
    batchFunction: BatchFn,
    opts: Parameters<typeof createBatcher>[1],
): (item: Item) => void {
    return R.piped(mapFn, createBatcher<SubItem, BatchFn>(batchFunction, opts));
}
