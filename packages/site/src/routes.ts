// moved to seperate file to avoid circular dependencies
export const routes = {
    auth: "/login",
    groups: "/groups",
    group(id: string) {
        return `/groups/${id}`;
    },
    scanReceipt(groupId: string) {
        return `${routes.group(groupId)}/scan/receipt`
    },
    scanSpreadsheet(groupId: string) {
        return `${routes.group(groupId)}/scan/table`
    },

};

