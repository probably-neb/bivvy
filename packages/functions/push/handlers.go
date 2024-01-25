package push

import (
	"fmt"

	"github.com/probably-neb/paypals-api/db"
)

func handle(m Mutation, session db.UserSession) (bool, error) {
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
    case acceptInviteMutation:
        return acceptInvite(m.Args, session)
    default:
        return true, fmt.Errorf("unknown mutation %s", m.Name)
    }
}

func addExpense(args any) (ok bool, err error) {
    expense, ok := args.(db.Expense)
    if !ok {
        return true, fmt.Errorf("addExpense handler did not recieve Expense as args: %v", args)
    }
    ok = true
    err = db.CreateExpense(expense)
    return ok, err
}

func deleteExpense(args any) (ok bool, err error) {
    expense, ok := args.(DeleteArgs)
    if !ok {
        return true, fmt.Errorf("deleteExpense handler did not recieve DeleteArgs as args: %v", args)
    }
    ok = true
    err = db.DeleteExpense(expense.Id)
    return ok, err
}

func createSplit(args any) (ok bool, err error) {
    split, ok := args.(db.Split)
    if !ok {
        return true, fmt.Errorf("createSplit handler did not recieve Split as args: %v", args)
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
        return true, fmt.Errorf("createGroup handler did not recieve GroupInput as args: %v", args)
    }
    ok = true
    err = db.CreateGroup(input.Group, input.OwnerId, input.DefaultSplitId)
    return ok, err
}

func createInvite(args any) (ok bool, err error) {
    invite, ok := args.(db.Invite)
    if !ok {
        return true, fmt.Errorf("createInvite handler did not recieve Invite as args: %v", args)
    }
    ok = true
    err = db.CreateInvite(invite)
    return ok, err
}

func acceptInvite(args any, session db.UserSession) (ok bool, err error) {
    id, ok := args.(string)
    if !ok {
        return true, fmt.Errorf("acceptInvite handler did not recieve string as args: %v", args)
    }
    ok = true
    err = db.AcceptInvite(session.UserId, id)
    return ok, err
}
