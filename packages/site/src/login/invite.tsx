import { Api } from "@/lib/api";
import { routes } from "@/routes";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { createEffect, createResource, on } from "solid-js";

export default function Invite() {
    const navigate = useNavigate();

    const [queryParams] = useSearchParams<{ token?: string }>();
    const token = () => queryParams.token;

    // TODO: handle no token
    const [inviteValidation] = createResource(token, (token) =>
        Api.validateInviteToken(token),
    );

    createEffect(
        on(inviteValidation, (validation) => {
            if (!validation) {
                // TODO: how to handle?
                console.log("no validation");
                return;
            }
            if (!validation.ok) {
                // TODO: how to handle?
                console.log("invite invalid");
                return;
            }
            // FIXME: consider using session storage for automatic redirect
            // just not sure if some browsers will clear on redirect or if oath is opened in new tab
            localStorage.setItem("invite", token()!);
            navigate(routes.auth);
        }),
    );

    return <div>Invite</div>;
}
