import { createSignal, createResource, createEffect, createMemo, Show } from "solid-js";
import { Api } from "@/lib/api";

export default function Scan() {
    const [file, setFile] = createSignal<File | null>(null);
    const [res, { refetch }] = createResource(file, (file) => {
        return Api.scanReceipt(file);
    });
    createEffect(() => {
        console.log(res());
    });

    function onUpload(files: FileList | null) {
        if (!files || files.length < 1) {
            console.error("No Files");
            return;
        }
        // FIXME: give warning to user if multiple files are uploaded that
        // only the first will be used
        // then add support for multiple files
        setFile(files[0]);
    }
    return (
        <div>
            <button onClick={() => refetch()}>refetch</button>
                <input type="file" capture="environment" onChange={(e) => onUpload(e.target.files)} />
            {res.loading && "loading"}
            {res.error && "error"}
            <div class="flex p-10 gap-4">
                <section class="w-full h-vh">
                    <h2>Reciept</h2>
                    <RecieptPreview reciept={file()} />
                </section>
                <section class="w-full">
                    <h2>Found</h2>
                    {res() && JSON.stringify(res())}
                </section>
            </div>
        </div>
    );
}

function RecieptPreview(props: {reciept: File | null}) {
    const blob = createMemo(() => {
        if (!props.reciept) return;
        return URL.createObjectURL(props.reciept);
    })
    return <Show when={blob()}>
        {(blob) => <img class="object-contain" src={blob()} />}
    </Show>
}
