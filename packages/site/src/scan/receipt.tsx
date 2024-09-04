import {
    createSignal,
    createResource,
    Show,
    Index,
} from "solid-js";
import { Api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// TODO: support document extract reciept from image
// https://github.com/ColonelParrot/jscanify

type ReceiptInfo = Awaited<ReturnType<typeof Api.scanReceipt>>

type ReceiptInfoItem = ReceiptInfo['items'][number]

export default function Scan() {
    const [file, setFile] = createSignal<File | null>(null);
    const [showModal, setShowModal] = createSignal(false);
    const [res, { refetch }] = createResource(file, async (file) => {
        const res =  await Api.scanReceipt(file)
        console.log(res);
        return res;
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
        setShowModal(false);
    }

    return (
        <div class="container mx-auto p-4">
            <button
                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={[setShowModal, true]}
            >
                Upload Receipt
            </button>

            <Show when={showModal()}>
                (
                <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div class="bg-white p-5 rounded-lg shadow-xl">
                        <h2 class="text-xl mb-4">Upload Receipt</h2>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => onUpload(e.target.files)}
                            class="mb-4"
                        />
                        <button
                            class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            onClick={[setShowModal, false]}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
                )
            </Show>

            <Show when={res.loading}>
                <div class="text-center my-4">Loading...</div>
            </Show>

            <Show when={res.error}>
                <div class="text-center my-4 text-red-500">
                    Error: {res.error.message}
                </div>
            </Show>
            {file() && res() && (
                <div class="flex flex-col md:flex-row gap-4 mt-4">
                    <section class="self-last md:self-first w-full md:w-1/2">
                        <h2 class="text-xl mb-2">Receipt Preview</h2>
                        <button onClick={() => refetch()}>Refetch</button>
                        <RecieptPreview reciept={file()} />
                        <pre class="bg-gray-100 p-4 rounded overflow-x-auto">
                            {JSON.stringify(res(), null, 2)}
                        </pre>
                    </section>
                    <section class="w-full md:w-1/2">
                        <h2 class="text-xl mb-2">Scanned Data</h2>
                            <ReceiptItems items={res()!.items} />
                    </section>
                </div>
            )}
        </div>
    );
}

function RecieptPreview(props: { reciept: File | null }) {
    if (props.reciept == null) {
        return null;
    }
    const blob = URL.createObjectURL(props.reciept);

    return (
        <div class="max-h-[500px] overflow-y-auto">
            <img
                class="w-full object-contain"
                src={blob}
                alt="Receipt preview"
            />
        </div>
    );
}

function ReceiptItems(props: {items: Array<ReceiptInfoItem>}) {
    return <Index each={props.items}>
        {item => (
            <Card>
                <CardHeader>
                    <Input value={item().name.value} />
                </CardHeader>
                <CardContent>
                    <Input value={item().price.value} />
                </CardContent>
            </Card>
        )}
    </Index>
}
