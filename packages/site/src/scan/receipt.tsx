import {
    createSignal,
    createResource,
    Show,
    JSX,
    createEffect,
    onCleanup,
} from "solid-js";
import { Api } from "@/lib/api";
import LoadingSpinner from "@/components/loading-spinner";
import { TiUpload } from "solid-icons/ti";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ReceiptInfoEdit } from "./reciept-info-edit";
import { DepressButton } from "@/components/ui/button";

// TODO: support document extract reciept from image
// https://github.com/ColonelParrot/jscanify

export type ReceiptInfo = Awaited<ReturnType<typeof Api.scanReceipt>>;

export type ReceiptInfoItem = ReceiptInfo["items"][number];

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
        <div class="p-4 bg-background w-full h-full ring-2 ring-foreground">
            <Show when={file() == null}>
                <div class="flex justify-center">
                    <div class="w-64">
                        <FileUpload onFileUpload={onUpload} />
                    </div>
                </div>
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
                                        <div class="w-full text-center">
                                            <Show when={res.loading}>
                                                <LoadingMessage />
                                            </Show>
                                        </div>
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

function LoadingMessage() {
    const MAX_DOTS = 4;
    const [dotsCount, setDotsCount] = createSignal(3);

    const timeoutId = setInterval(
        () => setDotsCount((c) => (c + 1) % MAX_DOTS),
        500
    );

    onCleanup(() => clearInterval(timeoutId));
    return <span>Loading{Array(dotsCount()).fill(".").join("")}</span>;
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
                <DepressButton>RECEIPT</DepressButton>
            </DialogTrigger>
            <DialogContent class="max-w-[80%] lg:max-w-md h-96 max-h-[80%] ring-2 ring-foreground">
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
                <DepressButton>{"{} "}JSON</DepressButton>
            </DialogTrigger>
            <DialogContent class="max-w-[80%] lg:max-w-md h-96 max-h-[80%] ring-2 ring-foreground">
                <DialogTitle variant="label">JSON</DialogTitle>
                <pre class="h-full max-h-full w-full bg-gray-100 p-4 rounded overflow-x-auto overflow-y-auto">
                    {JSON.stringify(props.json, null, 2)}
                </pre>
            </DialogContent>
        </Dialog>
    );
}
