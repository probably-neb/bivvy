import { createSignal, createResource, createEffect } from "solid-js";
import { Api } from "./lib/api";

export default function Scan() {
    const [file, setFile] = createSignal<File | null>(null);
    const [res] = createResource(file, (file) => {
        return Api.scanReceipt(file)
    })
    createEffect(() => {
        console.log(res())
    })
    return <div>
        <input type="file" capture="environment" onChange={
            (e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                    console.log("got file")
                    setFile(files[0]);
                }
            }
        }/>
        {res.loading && "loading"}
        {res.error && "error"}
        {res() && JSON.stringify(res())}
    </div>
}
