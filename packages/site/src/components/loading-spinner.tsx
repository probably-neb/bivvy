import "./spinner.css";

// export default function LoadingSpinner() {
//     return (
//         <svg class="spinner" viewBox="0 0 50 50">
//             <circle
//                 class="spinner-path"
//                 cx="25"
//                 cy="25"
//                 r="20"
//                 fill="none"
//                 stroke-width="5"
//             ></circle>
//         </svg>
//     );
// }

const style = `
.spinner_9y7u{animation:spinner_fUkk 2.4s linear infinite;animation-delay:-2.4s}.spinner_DF2s{animation-delay:-1.6s}.spinner_q27e{animation-delay:-.8s}@keyframes spinner_fUkk{8.33%{x:13px;y:1px}25%{x:13px;y:1px}33.3%{x:13px;y:13px}50%{x:13px;y:13px}58.33%{x:1px;y:13px}75%{x:1px;y:13px}83.33%{x:1px;y:1px}}
`;
export default function LoadingSpinner() {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <style>{style}</style>
            <rect
                class="spinner_9y7u"
                x="1"
                y="1"
                rx="1"
                width="10"
                height="10"
            />
            <rect
                class="spinner_9y7u spinner_DF2s"
                x="1"
                y="1"
                rx="1"
                width="10"
                height="10"
            />
            <rect
                class="spinner_9y7u spinner_q27e"
                x="1"
                y="1"
                rx="1"
                width="10"
                height="10"
            />
        </svg>
    );
}