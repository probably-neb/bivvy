package pull

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/probably-neb/paypals-api/db"
	"github.com/probably-neb/paypals-api/util"
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
    Cookie        Cookie      `json:"cookie"`
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
    Value any `json:"value"`
}
func (p PatchPutOperation) GetOp() PatchOp {
    return Put
}
func NewPutOp(key string, value any) PatchPutOperation {
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
    return fmt.Sprintf("groups/%s", groupID)
}

func expenseKey(groupID string, expenseID string) string {
    return fmt.Sprintf("group/%s/expense/%s", groupID, expenseID)
}

type GroupUser struct {
    UserId string `json:"userId"`
    Owed float64 `json:"owed"`
}

func groupUserKey(groupID string, userID string) string {
    return fmt.Sprintf("group/%s/user/%s", groupID, userID)
}

func userKey(userID string) string {
    return fmt.Sprintf("user/%s", userID)
}

func splitKey(groupID string, splitID string) string {
    return fmt.Sprintf("group/%s/split/%s", groupID, splitID)
}

func parse(body string) (PullRequest, error) {
    pr := PullRequest{}
    err := json.Unmarshal([]byte(body), &pr)
    if err != nil {
        return pr, err
    }
    return pr, nil
}


func custructPatches(userId string) []PatchOperation {
    defer util.TimeMe(time.Now(), "custructPatches")

    // 1 for clear op
    numPatches := 1

    groups, err := db.GetGroups(userId);
    if err != nil {
        log.Fatalf("Could not get groups: %v", err)
    }
    numPatches += len(groups)

    users, err := db.GetUsers(userId)
    if err != nil {
        log.Fatalf("Could not get users: %v", err)
    }
    // * 2 for groupUserKey and userKey
    numPatches += len(users) * 2

    expenses, err := db.GetExpenses(userId)
    if err != nil {
        log.Fatalf("Could not get expenses: %v", err)
    }
    numPatches += len(expenses)

    splits, err := db.GetSplits(userId)
    if err != nil {
        log.Fatalf("Could not get splits: %v", err)
    }
    numPatches += len(splits)

    patches := make([]PatchOperation, numPatches)

    // reset strategy
    patches[0] = NewClearOp()
    i := 1;
    for gi := 0; gi < len(groups); gi++ {
        g := groups[gi]
        patches[gi + i] = NewPutOp(
            groupKey(g.Id),
            g,
            )
    }
    i = i + len(groups)

    for ui := 0; ui < len(users); ui++ {
        u := users[ui]
        patches[ui + i] = NewPutOp(
            // TODO: store current user at known key
            userKey(u.Id),
            u,
            )
        patches[ui + i + len(users)] = NewPutOp(
            groupUserKey(u.GroupId, u.Id),
            // FIXME: figure out how to get owed per user per group
            GroupUser{
                UserId: u.Id,
                Owed: u.Owed,
            },
            )
    }
    i = i + len(users) * 2

    for ei := 0; ei < len(expenses); ei++ {
        e := expenses[ei]
        patches[i + ei] = NewPutOp(
            expenseKey(e.GroupId, e.Id),
            e,
            )
    }
    i = i + len(expenses)

    for si := 0; si < len(splits); si++ {
        s := splits[si]
        patches[i + si] = NewPutOp(
            splitKey(s.GroupId, s.Id),
            s,
            )
    }
    return patches
}

type LastMutations map[string]int

func getLastMutations(cgid, userId string) (LastMutations, error) {
    defer util.TimeMe(time.Now(), "getLastMutations")
    var ct db.ClientGroupTable
    err := ct.Init()
    if err != nil {
        return nil, err
    }
    cg, err := ct.GetClientGroup(cgid);
    if err != nil {
        _, isNotFound := err.(db.ClientNotFoundError)
        if isNotFound {
            // client group won't be created until user pushes
            // a mutation, once they do the client will be created
            // and we can tell them which mutations we handled
            // when they pull next
            return make(LastMutations), nil
        }
        return nil, err
    }
    if cg.UserId != userId {
        return nil, fmt.Errorf("client group does not belong to user")
    }

    handled := make(LastMutations)
    for _, c := range cg.Clients {
        handled[c.Id] = c.LastMutationId
    }

    return handled, nil
}

func Handler(ctx context.Context, event Request) (*Response, error) {
    var req, err = parse(event.Body)
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
    log.Println("session", session)

    var res PullResponse
    // TODO: check versions
    // TODO: check client state
    // TODO: validate client group id
    // - this can be done by including the cgid,cid in the user session
    // and verifying they are the same
    // although this may cause problems depending on how replicache assigns ids

    patches := custructPatches(session.UserId)

    lastMutations, err := getLastMutations(req.ClientGroupID, session.UserId)
    if err != nil {
        return nil, err
    }

    res = PullResponseOk{
        Cookie: req.Cookie + 1,
        LastMutationIDChanges: lastMutations,
        Patch: patches,
    }
    return res.ToResponse()
}
