package db

import (
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

type User struct {
    Id   string `json:"id"`
    Name string `json:"name"`
    Owed float64 `json:"owed"`
}

type Expense struct {
    Id          string `json:"id"`
    PaidBy      string `json:"paidBy"`
    Amount      float64 `json:"amount"`
    Description string `json:"description"`
    Status      string `json:"status"`
    PaidOn      *string `json:"paidOn"`
    CreatedAt   string `json:"createdAt"`
}

func getConn() *sql.DB {
    dsn, err := GetSecret("DSN")
    if err != nil {
        panic(fmt.Errorf("Could not get DSN secret: %v", err))
    }
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        panic(fmt.Errorf("Could not connect to db: %v", err))
    }
    return db
}

var conn = getConn();

func GetUsers(groupId string) ([]User, error) {
    rows, err := conn.Query("SELECT u.id, u.name FROM users_to_group AS ug LEFT JOIN users AS u ON u.id = ug.user_id WHERE ug.group_id = ?", groupId)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    users := make([]User, 0)

    for rows.Next() {
        user := User{Owed: 0.00}
        rows.Scan(&user.Id, &user.Name)
        users = append(users, user)
    }
    return users, nil
}

func GetExpenses() []Expense {
    return []Expense{
        {
            Id: "expense_fjIqVhRO63mS0",
            PaidBy: "Alice_fjIqVhRO63mS0mu",
            Amount: 10.00,
            Description: "Dinner",
            Status: "unpaid",
            PaidOn: nil,
            CreatedAt: "2019-01-01T00:00:00Z",
        },
        {
            Id: "expense_fjIqVhRO63mS1",
            PaidBy: "Bob_oTfjIqVhRO63mS0mv",
            Amount: 20.00,
            Description: "Lunch",
            Status: "unpaid",
            PaidOn: nil,
            CreatedAt: "2019-01-02T00:00:00Z",
        },
        {
            Id: "expense_fjIqVhRO63mS2",
            PaidBy: "Charlie_123456789ABCD",
            Amount: 30.00,
            Description: "Breakfast",
            Status: "unpaid",
            PaidOn: nil,
            CreatedAt: "2019-01-03T00:00:00Z",
        },
        {
            Id: "expense_123456789ABCDE",
            PaidBy: "David_123456789ABCDEF",
            Amount: 40.00,
            Description: "Groceries",
            Status: "unpaid",
            PaidOn: nil,
            CreatedAt: "2019-01-04T00:00:00Z",
        },
        {
            Id: "expense_123456789ABCDF",
            PaidBy: "Alice_fjIqVhRO63mS0mu",
            Amount: 50.00,
            Description: "Gas",
            Status: "unpaid",
            PaidOn: nil,
            CreatedAt: "2019-01-05T00:00:00Z",
        },
        {
            Id: "expense_123456789ABCDE",
            PaidBy: "Alice_fjIqVhRO63mS0mu",
            Amount: 60.00,
            Description: "Rent",
            Status: "paid",
            PaidOn: nil,
            CreatedAt: "2019-01-06T00:00:00Z",
        },
        {
            Id: "expense_123456789ABCDF",
            PaidBy: "Bob_oTfjIqVhRO63mS0mv",
            Amount: 70.00,
            Description: "Utilities",
            Status: "unpaid",
            PaidOn: nil,
            CreatedAt: "2019-01-07T00:00:00Z",
        },
        {
            Id: "expense_123456789ABCDE",
            PaidBy: "Charlie_123456789ABCD",
            Amount: 80.00,
            Description: "Phone",
            Status: "paid",
            PaidOn: nil,
            CreatedAt: "2019-01-08T00:00:00Z",
        },
        {
            Id: "expense_123456789ABCDF",
            PaidBy: "David_123456789ABCDEF",
            Amount: 90.00,
            Description: "Internet",
            Status: "unpaid",
            PaidOn: nil,
            CreatedAt: "2019-01-09T00:00:00Z",
        },
        {
            Id: "expense_123456789ABCDE",
            PaidBy: "Alice_fjIqVhRO63mS0mu",
            Amount: 100.00,
            Description: "Insurance",
            Status: "paid",
            PaidOn: nil,
            CreatedAt: "2019-01-10T00:00:00Z",
        },
        {
            Id: "expense_123456789ABCDF",
            PaidBy: "Bob_oTfjIqVhRO63mS0mv",
            Amount: 110.00,
            Description: "Cable",
            Status: "unpaid",
            PaidOn: nil,
            CreatedAt: "2019-01-11T00:00:00Z",
        },
        {
            Id: "expense_123456789ABCDE",
            PaidBy: "Bob_oTfjIqVhRO63mS0mv",
            Amount: 120.00,
            Description: "Gym",
            Status: "paid",
            PaidOn: nil,
            CreatedAt: "2019-01-12T00:00:00Z",
        },
        {
            Id: "expense_123456789ABCDF",
            PaidBy: "David_123456789ABCDEF",
            Amount: 130.00,
            Description: "Transportation",
            Status: "unpaid",
            PaidOn: nil,
            CreatedAt: "2019-01-13T00:00:00Z",
        },
    }
}
