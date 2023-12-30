package push

import (
	"fmt"

	"github.com/probably-neb/paypals-api/db"
)

func handle(m Mutation) (bool, error) {
    switch m.Name {
    case "addUser":
        return true, nil
    case "removeUsers":
        return true, nil
    case "addExpense":
        return addExpense(m.Args)
    default:
        return false, fmt.Errorf("unknown mutation %s", m.Name)
    }
}

func addExpense(args any) (ok bool, err error) {
    expense, ok := args.(db.Expense)
    if !ok {
        return false, fmt.Errorf("error unmarshalling addExpense args: %v", args)
    }
    err = db.CreateExpense(expense)
    if err != nil {
        return false, err
    }
    return true, nil
}
