package push

import (
    "fmt"

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


func ParseArgs(mutation string, args any) any {
    var tryParse = func(fn (func(a any) (any, error))) any {
        newArgs, err := fn(args)
        if err != nil {
            return Invalid(InvalidReasonArgs)
        }
        return newArgs
    }
    switch mutation {
    case "addUser":
        return tryParse(parseAddUser)
    case "addExpense":
        return tryParse(parseAddExpense)
    default:
        return Invalid(InvalidReasonUnknown)
    }
}

func parseAddUser(args any) (any, error) {
    return Invalid(InvalidReasonIgnore), nil
}

func parseAddExpense(args any) (any, error) {
    var expense db.Expense
    var ok = false
    var argsMap map[string]any
    if argsMap, ok = args.(map[string]any); !ok {
        return nil, fmt.Errorf("error unmarshalling addExpense args: %v", args)
    }
    expense.Id, ok = argsMap["id"].(string)
    if !ok {
        return nil, fmt.Errorf("error unmarshalling addExpense id: %v", argsMap["id"])
    }
    expense.PaidBy, ok = argsMap["paidBy"].(string)
    if !ok {
        return nil, fmt.Errorf("error unmarshalling addExpense paidBy: %v", argsMap["paidBy"])
    }
    expense.Amount, ok = argsMap["amount"].(float64)
    if !ok {
        return nil, fmt.Errorf("error unmarshalling addExpense amount: %v", argsMap["amount"])
    }
    expense.Description, ok = argsMap["description"].(string)
    if !ok {
        return nil, fmt.Errorf("error unmarshalling addExpense description: %v", argsMap["description"])
    }
    expense.Status, ok = argsMap["status"].(string)
    if !ok {
        return nil, fmt.Errorf("error unmarshalling addExpense status: %v", argsMap["status"])
    }
    paidOn, hasPaidOn := argsMap["paidOn"]
    if hasPaidOn {
        var tmp string
        tmp, ok = paidOn.(string)
        if !ok {
            return nil, fmt.Errorf("error unmarshalling addExpense paidOn: %v", argsMap["paidOn"])
        }
        expense.PaidOn = &tmp
    }
    expense.CreatedAt, ok = argsMap["createdAt"].(string)
    if !ok {
        return nil, fmt.Errorf("error unmarshalling addExpense createdAt: %v", argsMap["createdAt"])
    }
    return expense, nil
}
