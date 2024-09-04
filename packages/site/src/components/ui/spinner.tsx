export default function Spinner() {
    return (
        <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            color="#3f51b5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="spinner-gradient">
                    <stop
                        offset="0%"
                        stop-opacity="1"
                        stop-color="currentColor"
                    />
                    <stop
                        offset="100%"
                        stop-opacity="0.5"
                        stop-color="currentColor"
                    />
                </linearGradient>
            </defs>
            <g stroke-width="8">
                <path
                    stroke="url(#spinner-gradient)"
                    d="M 4 100 A 96 96 0 0 1 196 100"
                />
                <path
                    stroke="url(#spinner-gradient)"
                    d="M 196 100 A 96 96 0 0 1 4 100"
                />
            </g>
            <animateTransform
                from="0 0 0"
                to="360 0 0"
                attributeName="transform"
                type="rotate"
                repeatCount="indefinite"
                dur="1300ms"
            />
        </svg>
    );
}
