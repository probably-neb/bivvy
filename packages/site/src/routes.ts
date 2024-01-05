// moved to seperate file to avoid circular dependencies
export const routes = {
    auth: "/login",
    groups: "/groups",
    group(id: string) {
        return `/groups/${id}`;
    },
};

