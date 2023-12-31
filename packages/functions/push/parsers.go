package push

import (
	"encoding/json"
	"log"

	"github.com/probably-neb/paypals-api/db"
)

type InvalidReason int
const (
    InvalidReasonUnknown InvalidReason = iota
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
    var tryParse = func(fn (func(a json.RawMessage) (any, error))) any {
        newArgs, err := fn(args)
        if err != nil {
            log.Println("error parsing args", err)
            return Invalid(InvalidReasonArgs)
        }
        return newArgs
    }
    switch mutation {
    case "addUser":
        return Invalid(InvalidReasonIgnore)
    case "addExpense":
        return tryParse(parseAddExpense)
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
