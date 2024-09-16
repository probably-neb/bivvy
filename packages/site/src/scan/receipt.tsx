import {
    createSignal,
    createResource,
    Show,
    Index,
    JSX,
    createEffect,
    splitProps,
    For,
    batch,
    ParentProps,
    Accessor,
} from "solid-js";
import { Api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LoadingSpinner from "@/components/loading-spinner";
import { TiUpload } from "solid-icons/ti";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { attrWhen, cn } from "@/lib/utils";
import LabeledInput from "@/components/ui/labeled-input";
import { ToggleButton } from "@/components/ui/toggle";
import { createStore } from "solid-js/store";

// TODO: support document extract reciept from image
// https://github.com/ColonelParrot/jscanify

type ReceiptInfo = Awaited<ReturnType<typeof Api.scanReceipt>>;

type ReceiptInfoItem = ReceiptInfo["items"][number];

export default function Scan() {
    const [file, setFile] = createSignal<File | null>(null);
    const [res, { refetch }] = createResource(file, Api.scanReceipt);

    createEffect(() => {
        console.log("info:", res());
    });

    function onUpload(files: FileList | null) {
        if (!files || files.length < 1) {
            console.error("No Files");
            return;
        }
        if (files.length > 1) {
            alert(
                "Only the first file will be processed. Multiple file upload is not supported yet."
            );
        }
        setFile(files[0]);
    }

    return (
        <div class="container mx-auto p-4 bg-background w-full h-full ring-2 ring-foreground">
            <Show when={file() == null}>
                <FileUpload onFileUpload={onUpload} />
            </Show>
            <Show when={file()}>
                {(file) => (
                    <div class="h-full w-full">
                        <Show
                            when={res()}
                            fallback={
                                <>
                                    <div class="h-[10%]">
                                        <RecieptPreview reciept={file()} />
                                    </div>
                                    <div class="h-[90%]">
                                        <Show when={res.error}>
                                            <div class="text-center my-4 text-red-500">
                                                Error: {res.error.message}
                                            </div>
                                            <button onClick={[refetch, file()]}>
                                                Refetch
                                            </button>
                                        </Show>
                                        <Show when={res.loading}>
                                            <LoadingSpinner />
                                        </Show>
                                    </div>
                                </>
                            }
                        >
                            {(res) => (
                                <ReceiptInfoEdit info={res()}>
                                    <RecieptPreview reciept={file()} />
                                    <JsonPreview json={res()} />
                                </ReceiptInfoEdit>
                            )}
                        </Show>
                        <div class="h-[10%]"></div>
                        <div class="h-[90%]"></div>
                    </div>
                )}
            </Show>
        </div>
    );
}

function FileUpload({
    onFileUpload,
}: {
    onFileUpload: (files: FileList | null) => void;
}) {
    const onDragOver: JSX.EventHandlerUnion<HTMLLabelElement, DragEvent> = (
        event
    ) => {
        event.preventDefault();
        // event.persist();
        event.stopPropagation();

        const hasFiles = isEventWithFiles(event);
        if (hasFiles && event.dataTransfer) {
            try {
                event.dataTransfer.dropEffect = "copy";
            } catch {} /* eslint-disable-line no-empty */
        }

        return false;
    };

    const onDrop: JSX.EventHandlerUnion<HTMLLabelElement, DragEvent> = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
            onFileUpload(e.dataTransfer.files);
        }
    };
    const onChange: JSX.ChangeEventHandlerUnion<HTMLInputElement, Event> = (
        e
    ) => onFileUpload(e.target.files);

    return (
        <div class="grid gap-4">
            <label
                for="file"
                class="flex h-40 w-full items-center justify-center border-2 border-dashed border-foreground px-6 py-10 transition-colors hover:border-primary relative"
                ondragover={onDragOver}
                ondrop={onDrop}
            >
                <div class="absolute select-none font-medium text-foreground top-0 left-4 ring-2 ring-foreground -translate-y-1/2 bg-background px-2">
                    UPLOAD RECEIPT
                </div>
                <div class="absolute flex flex-col items-center space-y-2">
                    <TiUpload class="h-12 w-12 text-foreground" />
                </div>
            </label>
            <input
                type="file"
                id="file"
                name="file"
                class="sr-only"
                onChange={onChange}
                accept="image/*"
            />
        </div>
    );
}

function isEventWithFiles(event: any) {
    if (event == null) return false;
    if (!event.dataTransfer) {
        return !!event.target && !!event.target.files;
    }
    // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/types
    // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Recommended_drag_types#file
    return Array.prototype.some.call(
        event.dataTransfer.types,
        (type) => type === "Files" || type === "application/x-moz-file"
    );
}

function RecieptPreview(props: { reciept: File | null }) {
    if (props.reciept == null) {
        return null;
    }
    const blob = URL.createObjectURL(props.reciept);

    const img = (
        <img class="w-full object-contain" src={blob} alt="Receipt preview" />
    );
    const [open, setOpen] = createSignal(false);

    return (
        <Dialog open={open()} onOpenChange={setOpen}>
            <DialogTrigger>
                <Button>RECEIPT</Button>
            </DialogTrigger>
            <DialogContent class="max-w-[80%] max-h-[80%] ring-2 ring-foreground">
                <DialogTitle variant="label">RECEIPT</DialogTitle>
                <div class="h-full w-full overflow-y-auto overflow-x-auto">
                    {img}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function JsonPreview(props: { json: any | null }) {
    if (props.json == null) {
        return null;
    }

    const [open, setOpen] = createSignal(false);

    return (
        <Dialog open={open()} onOpenChange={setOpen}>
            <DialogTrigger>
                <Button>{"{} "}JSON</Button>
            </DialogTrigger>
            <DialogContent class="max-w-[80%] max-h-[80%] ring-2 ring-foreground">
                <DialogTitle variant="label">JSON</DialogTitle>
                <pre class="h-full max-h-full w-full bg-gray-100 p-4 rounded overflow-x-auto overflow-y-auto">
                    {JSON.stringify(props.json, null, 2)}
                </pre>
            </DialogContent>
        </Dialog>
    );
}

function ReceiptInfoEdit(props: ParentProps<{ info: ReceiptInfo }>) {
    const [items, setItems] = createStore<ReceiptInfoItem[]>(props.info.items);
    type ReceiptInfoGroup = {
        splitID: string | null;
        items: Array<ReceiptInfoItem>;
    };
    const [groups, setGroups] = createStore<ReceiptInfoGroup[]>([]);


    function confidenceIndicatorClass(
        confidence: number,
        touched: boolean = false
    ) {
        let color = "bg-green-500";
        if (!touched) {
            if (confidence < 1 && confidence > 0) {
                confidence = confidence * 100;
            }

            if (confidence < 25) {
                color = "bg-red-500";
            } else if (confidence < 50) {
                color = "bg-orange-500";
            } else if (confidence < 75) {
                color = "bg-yellow-500";
            }
        }

        return (
            "w-2 h-2 p-0 rounded-full -translate-y-1/2 -translate-x-1/2 left-0 top-1/2 " +
            color
        );
    }

    return (
        <>
            <div class="h-[10%]">
                {props.children}
                <Show when={items.length > 1}>
                    {(_) => {
                        const [selected, Selected] = createList<boolean>(
                            items.map(() => false)
                        );
                        const [open, setOpen] = createSignal(false);
                        function createGroupFromSelected() {
                            if (selected.length <= 1) return;
                            const selectedItems = items.filter(
                                (_, i) => selected[i]
                            );
                            const unselectedItems = items.filter(
                                (_, i) => !selected[i]
                            );
                            const group = {
                                splitID: null,
                                items: selectedItems,
                            };

                            batch(() => {
                                setGroups((groups) => [...groups, group]);
                                setItems(unselectedItems);
                                Selected.clear();
                                setOpen(false);
                            });
                        }
                        return (
                            <Dialog open={open()} onOpenChange={setOpen}>
                                <DialogTrigger disabled={items.length <= 1}>
                                    CREATE GROUP
                                </DialogTrigger>
                                <DialogContent class="max-w-[80%] h-64 ring-2 ring-foreground">
                                    <DialogTitle variant="label">
                                        <Button
                                            variant="ghost"
                                            disabled={selected.length <= 1}
                                            onClick={createGroupFromSelected}
                                        >
                                            CREATE
                                        </Button>
                                    </DialogTitle>
                                    <div class="h-full w-full overflow-y-scroll space-y-2">
                                        <Index each={items}>
                                            {(item, i) => (
                                                <ToggleButton
                                                    class="w-full flex flex-row data-[pressed]:bg-background data-[pressed]:ring-2 data-[pressed]:ring-foreground data-[pressed]:ring-inset"
                                                    pressed={selected[i]}
                                                    onChange={(pressed) =>
                                                        Selected.set(i, pressed)
                                                    }
                                                >
                                                    <span>
                                                        {item().name.value}
                                                    </span>
                                                    <span>
                                                        {item().price.value}
                                                    </span>
                                                </ToggleButton>
                                            )}
                                        </Index>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        );
                    }}
                </Show>
            </div>
            <section class="h-[90%] flex flex-col md:flex-row gap-4 p-2 overflow-y-auto w-full md:w-1/2">
                <Index each={groups}>
                    {(group) => (
                        <Card>
                            <CardHeader>
                                <LabeledInput label="DESCRIPTION" />
                            </CardHeader>
                            <CardContent class="space-y-4">
                                <Index each={group().items}>
                                    {(item) => (
                                        <>
                                            <LabeledInput
                                                value={item().name.value}
                                                label="ITEM"
                                                rightLabel={null}
                                                rightLabelClass={confidenceIndicatorClass(
                                                    item().name.confidence
                                                )}
                                            />
                                            <LabeledInput
                                                value={item().price.value}
                                                label="PRICE"
                                                rightLabel={null}
                                                rightLabelClass={confidenceIndicatorClass(
                                                    item().price.confidence
                                                )}
                                            />
                                        </>
                                    )}
                                </Index>
                            </CardContent>
                        </Card>
                    )}
                </Index>
                <Index each={items}>
                    {(item) => {
                        return (
                            <Card >
                                <CardContent class="space-y-8 p-4">
                                    <LabeledInput
                                        value={item().name.value}
                                        label="ITEM"
                                        rightLabel={null}
                                        rightLabelClass={confidenceIndicatorClass(
                                            item().name.confidence
                                        )}
                                    />
                                    <LabeledInput
                                        value={item().price.value}
                                        label="PRICE"
                                        rightLabel={null}
                                        rightLabelClass={confidenceIndicatorClass(
                                            item().price.confidence
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        );
                    }}
                </Index>
            </section>
        </>
    );
}

function createList<T>(defaultValue?: Array<T>): [
    Array<T>,
    {
        set(i: number, v: T): void;
        clear(): void;
    }
] {
    const [arr, setArr] = createStore<Array<T>>(defaultValue ?? []);

    return [
        arr,
        {
            set: setArr,
            clear: () => setArr([]),
        },
    ];
}
