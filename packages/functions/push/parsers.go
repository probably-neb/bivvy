package push

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/probably-neb/paypals-api/db"
)

type InvalidReason int
const (
    InvalidReasonUnknown InvalidReason = iota
    // InvalidReasonArgs intentionally does not include the reason as errors should
    // be checked in the frontend and verified on the backend. Therefore any errors here
    // are likely the result of a malicious user or a bug
    InvalidReasonArgs
    InvalidReasonIgnore
)

type InvalidMutation struct {
    reason InvalidReason
}

func Invalid(r InvalidReason) InvalidMutation {
    return InvalidMutation{reason: r}
}


func ParseArgs(mutation string, args json.RawMessage) any {
    // repetitive logic for returing InvalidMutation if parse fails
    var tryParse = func(fn (func(a json.RawMessage) (any, error))) any {
        newArgs, err := fn(args)
        if err != nil {
            log.Printf("error parsing %s args %v:%v", mutation, string(args), err)
            return Invalid(InvalidReasonArgs)
        }
        return newArgs
    }
    switch mutation {
    case "addExpense":
        return tryParse(parseAddExpense)
    case "deleteExpense":
        return tryParse(parseDeleteExpense)
    case "createSplit":
        return tryParse(parseCreateSplit)
    default:
        return Invalid(InvalidReasonUnknown)
    }
}

func parseAddExpense(args json.RawMessage) (any, error) {
    var expense db.Expense
    if err := json.Unmarshal(args, &expense); err != nil {
        return nil, err
    }
    log.Println("parsed expense", expense)
    return expense, nil
}

type DeleteArgs struct {
    Id string `json:"id"`
    GroupId string `json:"groupId"`
}

func parseDeleteExpense(args json.RawMessage) (any, error) {
    // NOTE: although GroupId isn't strictly necessary for deleting the expense itself
    // it is necessary on the frontend for the expense key and is saves an extra query
    // when this patch is applied to get the groupId for updating the owed amounts
    var dargs DeleteArgs
    if err := json.Unmarshal(args, &dargs); err != nil {
        return nil, err
    }
    log.Println("parsed expense id to delete", dargs)
    return dargs, nil
}

func parseCreateSplit(args json.RawMessage) (any, error) {
    var split db.Split
    if err := json.Unmarshal(args, &split); err != nil {
        return nil, err
    }
    for _, portion := range split.Portions {
        if portion < 0 || portion > 1 {
            return Invalid(InvalidReasonArgs), fmt.Errorf("invalid portion")
        }
    }
    log.Println("parsed split", split)
    return split, nil
}
