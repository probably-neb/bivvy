package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
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
    Error error `json:"error" default:"VersionNotSupported"`
    VersionType VersionType `json:"versionType"`
}
func (p PullResponseVersionNotSupported) ToResponse() (*Response, error) {
    b, err := json.Marshal(p)
    if err != nil {
        return nil, err
    }
    res := Response{
        StatusCode: 400,
        Body: string(b),
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
    SetOp() PatchOperation
}

type PatchPutOperation struct {
    Op PatchOp `json:"op"`
    Key string `json:"key"`
    Value interface{} `json:"value"`
}
func (p PatchPutOperation) SetOp() PatchOperation {
    p.Op = Put
    return p
}

type PatchDelOperation struct {
    Op PatchOp `json:"op"`
    Key string `json:"key"`
}
func (p PatchDelOperation) SetOp() PatchOperation {
    p.Op = Del
    return p
}


type PatchClearOperation struct {
    Op PatchOp `json:"op"`
}
func (p PatchClearOperation) SetOp() PatchOperation  {
    p.Op = Clear
    return p
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



func pull(ctx context.Context, event Request) (*Response, error) {
    var req, err = parse(event.Body)
    if err != nil {
        return nil, err
    }
    var res PullResponse
    // TODO: check versions
    // TODO: check client state
    patches := []PatchOperation{PatchClearOperation{}}

    var devGroupId = "______dev_group______"
    for _, u := range db.GetUsers() {
        patch := PatchPutOperation{
            Key: userKey(devGroupId, u.Id),
            Value: u,
        }
        patches = append(patches, patch)
    }
    for _, e := range db.GetExpenses() {
        patch := PatchPutOperation{
            Key: expenseKey(devGroupId, e.Id),
            Value: e,
        }
        patches = append(patches, patch)
    }
    for i, patch := range patches {
        patches[i] = patch.SetOp()
    }
    res = PullResponseOk{
        Cookie: req.Cookie + 1,
        LastMutationIDChanges: map[string]int{
            // FIXME: use dynamo to store client id info
            // and create cron to wipe old data when table gets big
        },
        Patch: patches,
    }
    log.Printf("res: %+v", res)
    return res.ToResponse()
}

func main() {
    lambda.Start(pull)
}
