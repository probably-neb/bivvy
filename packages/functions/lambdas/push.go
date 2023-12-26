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

type Mutation struct {
    Id        int         `json:"id"`
    Name      string      `json:"name"`
    Args      interface{} `json:"args"`
    Timestamp int         `json:"timestamp"`
    ClientId  string      `json:"clientID"`
}

type InvalidMutation struct {}

type PushEvent struct {
    ProfileId     string     `json:"profileID"`
    ClientGroupId string     `json:"clientGroupID"`
    Mutations     []Mutation `json:"mutations"`
}

var mutationParsers = map[string](func(any) (any, error)){
    "addUser": func(args any) (any, error) {
        var user db.User
        var ok = false
        var argsMap map[string]any
        if argsMap, ok = args.(map[string]any); !ok {
            return nil, fmt.Errorf("error unmarshalling addUser args: %v", args)
        }
        user.Id, ok = argsMap["id"].(string)
        if !ok {
            return nil, fmt.Errorf("error unmarshalling addUser id: %v", argsMap["id"])
        }
        user.Name, ok = argsMap["name"].(string)
        if !ok {
            return nil, fmt.Errorf("error unmarshalling addUser name: %v", argsMap["name"])
        }
        return user, nil
    },
    "addExpense": func(args any) (any, error) {
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
    },
}

func parse(body string) (PushEvent, error) {
    var push PushEvent

    if err := json.Unmarshal([]byte(body), &push); err != nil {
        log.Println("error unmarshalling push event", err)
        return push, err
    }

    for i, mutation := range push.Mutations {
        var args = mutation.Args
        push.Mutations[i].Args = InvalidMutation{}
        mutationParser, ok := mutationParsers[mutation.Name]
        if !ok {
            log.Println("no parser for mutation", mutation.Name, mutation.Args)
            continue
        }
        newArgs, err := mutationParser(args)
        if err != nil {
            log.Println("error parsing mutation", mutation.Name, mutation.Args, err)
            continue
        }
        push.Mutations[i].Args = newArgs
    }
    return push, nil
}

func push(ctx context.Context, event Request) (*Response, error) {
    var push, err = parse(event.Body)
    if err != nil {
        return nil, err
    }
    for _, mutation := range push.Mutations {
        log.Println("mutation", mutation)
    }

    return nil, nil
}

func main() {
    lambda.Start(push)
}
