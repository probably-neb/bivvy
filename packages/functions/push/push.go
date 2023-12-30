package push

import (
	"context"
	"encoding/json"
	"log"
	"sort"

	"github.com/aws/aws-lambda-go/events"
	"github.com/probably-neb/paypals-api/db"
)

type Request = events.APIGatewayV2HTTPRequest
type Response = events.APIGatewayV2HTTPResponse

type Mutation struct {
    Id        int         `json:"id"`
    Name      string      `json:"name"`
    Args      interface{} `json:"args"`
    Timestamp int         `json:"timestamp"`
    ClientId  string      `json:"clientID"`
}

type PushEvent struct {
    ProfileId     string     `json:"profileID"`
    ClientGroupId string     `json:"clientGroupID"`
    Mutations     []Mutation `json:"mutations"`
}

func parse(body string) (PushEvent, error) {
    var push PushEvent

    if err := json.Unmarshal([]byte(body), &push); err != nil {
        log.Println("error unmarshalling push event", err)
        return push, err
    }

    for i, mutation := range push.Mutations {
        push.Mutations[i].Args = ParseArgs(mutation.Name, mutation.Args)
    }
    sort.Slice(push.Mutations, func(i, j int) bool {
        return push.Mutations[i].Id < push.Mutations[j].Id
    })
    return push, nil
}

func doMutations(push PushEvent) error {
    // TODO: get
    uid := "Alice_fjIqVhRO63mS0mu"
    ms := push.Mutations
    ct := db.ClientGroupTable{}
    // TODO: handle error
    _ = ct.Init()
    cg, err := ct.GetClientGroup(push.ClientGroupId)
    if err != nil {
        _, notFound := err.(db.ClientNotFoundError)
        // some other error
        if !notFound {
            return err
        }
        log.Println("creating new client group")
        cg = db.NewClientGroup(push.ClientGroupId, uid)
    }
    for _, m := range ms {
        _, clientExists := cg.Clients[m.ClientId]
        if !clientExists {
            log.Println("creating new client", m.ClientId)
            cg.AddClient(m.ClientId)
        }
        // log.Println("mutation", m)
    }
    ct.PutClientGroup(cg)
    return nil
}

func Handler(ctx context.Context, event Request) (*Response, error) {
    var push, err = parse(event.Body)
    if err != nil {
        return nil, err
    }
    err = doMutations(push)
    return nil, err
}