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
    case createInviteMutation:
        return createInvite(m.Args)
    default:
        return false, fmt.Errorf("unknown mutation %s", m.Name)
    }
}

func addExpense(args any) (ok bool, err error) {
    expense, ok := args.(db.Expense)
    if !ok {
        return false, fmt.Errorf("addExpense handler did not recieve Expense as args: %v", args)
    }
    ok = true
    err = db.CreateExpense(expense)
    return ok, err
}

func deleteExpense(args any) (ok bool, err error) {
    expense, ok := args.(DeleteArgs)
    if !ok {
        return false, fmt.Errorf("deleteExpense handler did not recieve DeleteArgs as args: %v", args)
    }
    ok = true
    err = db.DeleteExpense(expense.Id)
    return ok, err
}

func createSplit(args any) (ok bool, err error) {
    split, ok := args.(db.Split)
    if !ok {
        return false, fmt.Errorf("createSplit handler did not recieve Split as args: %v", args)
    }
    ok = true
    err = db.CreateSplit(split)
    return ok, err
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
    ok = true
    err = db.CreateGroup(input.Group, input.OwnerId, input.DefaultSplitId)
    return ok, err
}

func createInvite(args any) (ok bool, err error) {
    invite, ok := args.(db.Invite)
    if !ok {
        return false, fmt.Errorf("createInvite handler did not recieve Invite as args: %v", args)
    }
    ok = true
    err = db.CreateInvite(invite)
    return ok, err
}
