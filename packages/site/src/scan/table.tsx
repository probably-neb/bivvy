import {
    createSignal,
    createResource,
    createEffect,
    createMemo,
    Show,
} from "solid-js";
import { Api } from "@/lib/api";
import { Table } from "@/components/ui/table";

// TODO: support document extract reciept from image
// https://github.com/ColonelParrot/jscanify

export default function Scan() {
    const [file, setFile] = createSignal<File | null>(null);
    const [res, { refetch }] = createResource(file, (file) => {
        return Api.scanSpreadsheet(file);
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
            <input
                type="file"
                capture="environment"
                onChange={(e) => onUpload(e.target.files)}
            />
            {res.loading && "loading"}
            {res.error && "error"}
            <div class="flex p-10 gap-4">
                <section class="w-full h-vh">
                    <h2>Spreadsheet</h2>
                    <Show when={res()}>
                        {(res) => <TablePreview data={res} />}
                    </Show>
                </section>
                <section class="w-full">
                    <h2>Found</h2>
                    {res() && JSON.stringify(res())}
                </section>
            </div>
        </div>
    );
}

function TablePreview(props: { data: any }) {
    return <div>
        <textarea contenteditable={false}>
            {JSON.stringify(props.data, null, 2)}
        </textarea>
    </div>
}
