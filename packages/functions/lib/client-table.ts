import {DynamoDBClient, UpdateItemCommand} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, GetCommand,QueryCommand,  PutCommand} from '@aws-sdk/lib-dynamodb';
import { Resource } from 'sst';

function initClient() {
    const client = new DynamoDBClient({});
    const ddbDocClient = DynamoDBDocumentClient.from(client);
    return ddbDocClient;
}

const TTL = 3 * 24 * 60 * 60; // 3 days

function getExpireAt() {
    return Math.floor(Date.now() / 1000) + TTL;
}

enum ClientStatus {
    NEW = 0,
    CHANGED = 1,
    FOUND = 2,
}

type ClientData = {
    Id: string;
    LastMutationID: number;
    ExpireAt: number;
    status: ClientStatus;
}

type ClientGroupData = {
    Id: string;
    UserId: string;
    Clients: Map<string, ClientData>
}

export class ClientGroupTable {
    TABLE_NAME: string;
    cg: ClientGroupData | null = null;

    constructor(private clientGroupId: string, private client = initClient()) {
        this.TABLE_NAME = Resource.clientTable.name;
    }

    createNewClientGroup(userId: string) {
        if (this.cg != null) {
            console.error('ClientGroup already exists');
        }
        this.cg = {
            Id: this.clientGroupId,
            UserId: userId,
            Clients: new Map(),
        }
    }

    private addClient(clientId: string, lastMutationId: number, expireAt: number = 0) {
        if (this.cg == null) {
            return
        }
        const client = {
            Id: clientId,
            LastMutationID: lastMutationId,
            ExpireAt: expireAt,
            status: ClientStatus.FOUND,
        }
        this.cg.Clients.set(clientId, client)
    }

    addNewClient(clientId: string, lastMutationId: number = 0) {
        if (this.cg == null) {
            return;
        }
        const client = {
            Id: clientId,
            LastMutationID: lastMutationId,
            ExpireAt: getExpireAt(),
            status: ClientStatus.NEW,
        }
        this.cg.Clients.set(clientId, client);
    }

    updateClient(clientId: string, lastMutationId: number) {
        if (this.cg == null) {
            return
        }
        if (!this.cg.Clients.has(clientId)) {
            this.addNewClient(clientId, lastMutationId);
        }
        const client = this.cg.Clients.get(clientId)!;
        client.LastMutationID = lastMutationId;
        client.ExpireAt = getExpireAt();
        client.status = ClientStatus.CHANGED;
    }

    getLastMutations() {
        const lastMutations = new Map<string, number>();
        if (this.cg == null) {
            return lastMutations;
        }
        for (const [clientId, client] of this.cg.Clients) {
            lastMutations.set(clientId, client.LastMutationID);
        }
        return lastMutations;
    }

    hasClient(clientId: string) {
        if (this.cg == null) {
            return false
        }
        return this.cg.Clients.has(clientId);
    }

    markMutationProcessed(clientID: string, mutationId: number) {
        if (this.cg == null) {
            return;
        }
        const client = this.cg.Clients.get(clientID);
        if (client == null) {
            console.error('Client not found');
            return;
        }
        client.LastMutationID = Math.max(mutationId, client.LastMutationID);
        if (client.status === ClientStatus.FOUND) {
            client.ExpireAt = getExpireAt();
            client.status = ClientStatus.CHANGED;
        }
    }

    get ownerUserId() {
        if (this.cg == null) {
            return null;
        }
        return this.cg.UserId;
    }

    async get() {
        const clientTableName = Resource.clientTable.name
        console.log('clientTableName', clientTableName);
        const command = new QueryCommand({
            TableName: clientTableName,
            KeyConditionExpression: 'ClientGroupId = :partitionKeyVal',
            ExpressionAttributeValues: {
                ":partitionKeyVal": this.clientGroupId,
            },
            Select: 'ALL_ATTRIBUTES',
        });

        const result = await this.client.send(command);
        const items = result.Items;
        console.log('items', items);

        if (items == null || items.length == 0) {
            console.error('No ClientGroup found');
            return false;
        }
        const ClientGroupId = items[0].ClientGroupId;
        const UserId = items[0].UserId;
        this.cg = {
            Id: ClientGroupId,
            UserId: UserId,
            Clients: new Map(),
        }
        for (const item of items) {
            const clientId = item.ClientId;
            if (clientId == null) {
                console.error('clientId is null');
                continue
            }
            const lastMutationId = item.LastMutationId;
            if (lastMutationId == null) {
                console.error('lastMutationId is null');
            }
            console.assert(item.ClientGroupId === ClientGroupId, 'Item with different ClientGroupId found');
            console.assert(item.UserId === UserId, 'Item with different UserId found');
            this.addClient(clientId, lastMutationId, item.ExpireAt ?? undefined);
        }

        return true
    }

    private async saveClientUpdate(clientId: string) {
        if (this.cg == null) return
        const client = this.cg.Clients.get(clientId)!;
        const cmd = new UpdateItemCommand({
            TableName: this.TABLE_NAME,
            Key: {
                ClientGroupId: ATTR.String(this.cg.Id),
                ClientId: ATTR.String(clientId),
            },
            UpdateExpression: 'SET LastMutationId = :lastMutationId, ExpireAt = :ttl',
            ExpressionAttributeValues: {
                ':lastMutationId': ATTR.Number(client.LastMutationID),
                ':ttl': ATTR.Number(client.ExpireAt),
            }
        })
        const res = await this.client.send(cmd);
        return res
    }

    private async saveNewClient(clientId: string) {
        if (this.cg == null) return
        const client = this.cg.Clients.get(clientId)!;
        const cmd = new PutCommand({
            TableName: this.TABLE_NAME,
            Item: {
                ClientGroupId: this.cg.Id,
                ClientId: clientId,
                UserId: this.cg.UserId,
                LastMutationId: client.LastMutationID,
                ExpireAt: client.ExpireAt,
            }
        })
        const res = await this.client.send(cmd);
        return res
    }

    async save() {
        if (this.cg == null) {
            return;
        }
        for (const [clientId, client] of this.cg.Clients) {
            switch (client.status) {
                case ClientStatus.FOUND:
                    continue;
                case ClientStatus.NEW:
                    await this.saveNewClient(clientId);
                case ClientStatus.CHANGED:
                    await this.saveClientUpdate(clientId);
            }
        }
    }
}

const ATTR = {
    String(val: string) {
        return { S: val };
    },
    Number(val: number) {
        return { N: val.toString() };
    }
}
