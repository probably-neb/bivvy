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
    type MutDecode struct {
        Mutation
        Args json.RawMessage `json:"args"`
    }
    type PushDecode struct {
        PushEvent
        Mutations []MutDecode `json:"mutations"`
    }
    var pushd PushDecode
    if err := json.Unmarshal([]byte(body), &pushd); err != nil {
        log.Println("error unmarshalling push event", err)
        return PushEvent{}, err
    }
    push := pushd.PushEvent
    push.Mutations = make([]Mutation, len(pushd.Mutations))

    for i, mutation := range pushd.Mutations {
        push.Mutations[i] = mutation.Mutation
        push.Mutations[i].Args = ParseArgs(mutation.Name, mutation.Args)
    }
    sort.Slice(push.Mutations, func(i, j int) bool {
        return push.Mutations[i].Id < push.Mutations[j].Id
    })
    return push, nil
}

func doMutations(push PushEvent, session db.UserSession) error {
    // TODO: get
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
        cg = db.NewClientGroup(push.ClientGroupId, session.UserId)
    }
    for _, m := range ms {
        _, clientExists := cg.Clients[m.ClientId]
        if !clientExists {
            log.Println("creating new client", m.ClientId)
            cg.AddClient(m.ClientId)
        }
        ok, err := handle(m)
        if err != nil {
            log.Println("error handling mutation [",m.Name,"]", err)
            break
        }
        if ok {
            log.Println("marking mutation processed", m)
            cg.Clients[m.ClientId].MarkMutationProcessed(m.Id)
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
    _session, err := db.GetSessionFromHeaders(event.Headers)
    if (err != nil) {
        return nil, err
    }
    session, ok := _session.(db.UserSession)
    if !ok {
        log.Fatalf("session was not a user session: %v", session)
    }
    err = doMutations(push, session)
    return nil, err
}
