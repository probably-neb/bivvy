package push

import (
	"fmt"

	"github.com/probably-neb/paypals-api/db"
)

func handle(m Mutation) (bool, error) {
    switch m.Name {
    case addExpenseMutation:
        return addExpense(m.Args)
    case deleteExpenseMutation:
        return deleteExpense(m.Args)
    case createSplitMutation:
        return createSplit(m.Args)
    case createGroupMutation:
        return createGroup(m.Args)
    default:
        return false, fmt.Errorf("unknown mutation %s", m.Name)
    }
}

func addExpense(args any) (ok bool, err error) {
    expense, ok := args.(db.Expense)
    if !ok {
        return false, fmt.Errorf("addExpense handler did not recieve Expense as args: %v", args)
    }
    err = db.CreateExpense(expense)
    if err != nil {
        return false, err
    }
    return true, nil
}

// TODO: 1/1/24 : update delete expense code to update owed
//                implement splits and portions + use portions when calculating owed
func deleteExpense(args any) (ok bool, err error) {
    expense, ok := args.(DeleteArgs)
    if !ok {
        return false, fmt.Errorf("deleteExpense handler did not recieve DeleteArgs as args: %v", args)
    }
    err = db.DeleteExpense(expense.Id)
    if err != nil {
        return false, err
    }
    return true, nil
}

func createSplit(args any) (ok bool, err error) {
    split, ok := args.(db.Split)
    if !ok {
        return false, fmt.Errorf("createSplit handler did not recieve Split as args: %v", args)
    }
    err = db.CreateSplit(split)
    if err != nil {
        return false, err
    }
    return true, nil
}

type GroupInput struct {
    db.Group
    OwnerId string `json:"ownerId"`
    DefaultSplitId string `json:"defaultSplitId"`
}

func createGroup(args any) (ok bool, err error) {
    input, ok := args.(GroupInput)
    if !ok {
        return false, fmt.Errorf("createGroup handler did not recieve GroupInput as args: %v", args)
    }
    err = db.CreateGroup(input.Group, input.OwnerId, input.DefaultSplitId)
    if err != nil {
        return false, err
    }
    return true, nil
}
