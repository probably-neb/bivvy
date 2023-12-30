package pull

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/probably-neb/paypals-api/db"
)

type Request = events.APIGatewayV2HTTPRequest
type Response = events.APIGatewayV2HTTPResponse

// export type Cookie =
//   | null
//   | string
//   | number
//   | (ReadonlyJSONValue & {readonly order: number | string});
type Cookie int;

// type PullRequest = {
//   pullVersion: 1;
//   clientGroupID: string;
//   cookie: JSONValue;
//   profileID: string;
//   schemaVersion: string;
// };
type PullRequest struct {
    PullVersion   int         `json:"pullVersion"`
    ClientGroupID string      `json:"clientGroupID"`
    Cookie        Cookie         `json:"cookie"`
    ProfileID     string      `json:"profileID"`
    SchemaVersion string      `json:"schemaVersion"`
}

type PullResponse interface {
    ToResponse() (*Response, error)
}
// export type PullResponse =
//   | PullResponseOK
//   | ClientStateNotFoundResponse
//   | VersionNotSupportedResponse;

// export type PullResponseOK = {
//   cookie: Cookie;
//   lastMutationIDChanges: Record<ClientID, number>;
//   patch: PatchOperation[];
// };
type PullResponseOk struct {
    Cookie Cookie `json:"cookie"`
    LastMutationIDChanges map[string]int `json:"lastMutationIDChanges"`
    Patch []PatchOperation `json:"patch"`
}

func (p PullResponseOk) ToResponse() (*Response, error) {
    b, err := json.Marshal(p)
    if err != nil {
        return nil, err
    }
    r := Response{
        StatusCode: 200,
        Body: string(b),
    }
    return &r, nil
}
//
// /**
//  * In certain scenarios the server can signal that it does not know about the
//  * client. For example, the server might have lost all of its state (this might
//  * happen during the development of the server).
//  */
// export type ClientStateNotFoundResponse = {
//   error: 'ClientStateNotFound';
// };
var ClientStateNotFound = fmt.Errorf("ClientStateNotFound")
type PullResponseClientStateNotFound struct {}

func (p PullResponseClientStateNotFound) ToResponse() (*Response, error) {
    r := Response{
        StatusCode: 400,
        Body: "{ \"error\": \"ClientStateNotFound\"}",
        Headers: map[string]string{
            "Content-Type": "application/json",
        },
    }
    return &r, ClientStateNotFound
}

// /**
//  * The server endpoint may respond with a `VersionNotSupported` error if it does
//  * not know how to handle the {@link pullVersion}, {@link pushVersion} or the
//  * {@link schemaVersion}.
//  */
// export type VersionNotSupportedResponse = {
//   error: 'VersionNotSupported';
//   versionType?: 'pull' | 'push' | 'schema' | undefined;
// };
var VersionNotSupported = fmt.Errorf("VersionNotSupported")
type VersionType string
const (
    PullVersion VersionType = "pull"
    PushVersion VersionType = "push"
    SchemaVersion VersionType = "schema"
)
type PullResponseVersionNotSupported struct {
    Error error `json:"error"`
    VersionType VersionType `json:"versionType"`
}
func (p PullResponseVersionNotSupported) ToResponse() (*Response, error) {
    p.Error = VersionNotSupported
    b, err := json.Marshal(p)
    if err != nil {
        // TODO: do something else here!
        return nil, err
    }
    res := Response{
        StatusCode: 400,
        Body: string(b),
        Headers: map[string]string{
            "Content-Type": "application/json",
        },
    }
    return &res, nil
}

// type PatchOperation =
//   | {
//       op: 'put';
//       key: string;
//       value: JSONValue;
//     }
//   | {op: 'del'; key: string}
//   | {op: 'clear'};
type PatchOp string

const (
    Put PatchOp = "put"
    Del PatchOp = "del"
    Clear PatchOp = "clear"
)

type PatchOperation interface {
    // dummy function for interface
    GetOp() PatchOp
}

type PatchPutOperation struct {
    Op PatchOp `json:"op"`
    Key string `json:"key"`
    Value interface{} `json:"value"`
}
func (p PatchPutOperation) GetOp() PatchOp {
    return Put
}
func NewPutOp(key string, value interface{}) PatchPutOperation {
    return PatchPutOperation{
        Op: Put,
        Key: key,
        Value: value,
    }
}

type PatchDelOperation struct {
    Op PatchOp `json:"op"`
    Key string `json:"key"`
}
func (p PatchDelOperation) GetOp() PatchOp {
    return Del
}
func NewDelOp(key string) PatchDelOperation {
    return PatchDelOperation{
        Op: Del,
        Key: key,
    }
}


type PatchClearOperation struct {
    Op PatchOp `json:"op"`
}
func (p PatchClearOperation) GetOp() PatchOp  {
    return Clear
}
func NewClearOp() PatchClearOperation {
    return PatchClearOperation{
        Op: Clear,
    }
}


func groupKey(groupID string) string {
    return fmt.Sprintf("group/%s", groupID)
}

func expenseKey(groupID string, expenseID string) string {
    return fmt.Sprintf("group-%s/expense/%s", groupID, expenseID)
}

func userKey(groupID string, userID string) string {
    return fmt.Sprintf("group-%s/user/%s", groupID, userID)
}

func parse(body string) (PullRequest, error) {
    pr := PullRequest{}
    err := json.Unmarshal([]byte(body), &pr)
    if err != nil {
        return pr, err
    }
    return pr, nil
}

func custructPatches() []PatchOperation {
    var devGroupId = "______dev_group______"

    users, err := db.GetUsers(devGroupId)
    if err != nil {
        // TODO: handle error
        log.Fatalf("Could not get users: %v", err)
    }
    expenses, err := db.GetExpenses(devGroupId)
    if err != nil {
        log.Fatalf("Could not get expenses: %v", err)
    }
    patches := make([]PatchOperation, 1 + len(users) + len(expenses))

    // reset strategy
    patches[0] = NewClearOp()
    i := 1;

    for ui := 0; ui < len(users); ui++ {
        u := users[ui]
        patches[ui + i] = NewPutOp(
            userKey(devGroupId, u.Id),
            u,
        )
    }
    i = i + len(users)

    for ei := 0; ei < len(expenses); ei++ {
        e := expenses[ei]
        patches[i + ei] = NewPutOp(
            expenseKey(devGroupId, e.Id),
            e,
        )
    }
    return patches
}

func getLastMutations(cgid string, uid string) (map[string]int, error) {

    var ct db.ClientGroupTable
    err := ct.Init()
    if err != nil {
        return nil, err
    }
    cg, err := ct.GetClientGroup(cgid);
    if err != nil {
        return nil, err
    }

    updates := make(map[string]int)
    for _, c := range cg.Clients {
        updates[c.Id] = c.LastMutationId
    }

    return updates, nil
}

func Handler(ctx context.Context, event Request) (*Response, error) {
    var req, err = parse(event.Body)
    if err != nil {
        return nil, err
    }

    var res PullResponse
    // TODO: check versions
    // TODO: check client state
    // TODO: validate client group id
    // - this can be done by including the cgid,cid in the user session
    // and verifying they are the same
    // although this may cause problems depending on how replicache assigns ids

    patches := custructPatches()

    // TODO: get
    uid := "Alice_fjIqVhRO63mS0mu"
    lastMutations, err := getLastMutations(req.ClientGroupID, uid)
    if err != nil {
        _, notFound := err.(db.ClientNotFoundError)
        if notFound {
            res = PullResponseClientStateNotFound{}
            return res.ToResponse()
        }
        // TODO: how to handle error here? probably should return ClientStateNotFound anyway
        log.Printf("error getting last mutations: %v", err)
        lastMutations = make(map[string]int)
    }

    res = PullResponseOk{
        Cookie: req.Cookie + 1,
        LastMutationIDChanges: lastMutations,
        Patch: patches,
    }
    // for _, p := range patches {
    //     log.Printf("patch: %+v", p)
    // }
    return res.ToResponse()
}
