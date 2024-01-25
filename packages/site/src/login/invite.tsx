import { routes } from "@/routes";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { createRenderEffect, on } from "solid-js";

export default function Invite() {
    const navigate = useNavigate();

    const [queryParams] = useSearchParams<{ token?: string }>();
    const token = () => queryParams.token;

    // FIXME: validate here (see Api.validateInviteToken for details)

    createRenderEffect(
        on(token, (token) => {
            if (!token) {
                console.log("no token");
                // FIXME: how to handle?
                return
            }
            // FIXME: consider using session storage for automatic redirect
            // just not sure if some browsers will clear on redirect or if oath is opened in new tab
            localStorage.setItem("invite", token);
            navigate(routes.auth);
        }),
    );

    return <div>Invite</div>;
}
