package db

import (
	"database/sql"
	"fmt"
	"time"

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
    PaidOnUnix  int64 `json:"paidOn"`
    PaidOn      *time.Time
    CreatedAtUnix int64 `json:"createdAt"`
    CreatedAt   time.Time
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
    q := `SELECT u.id, u.name
            FROM users_to_group AS ug
            LEFT JOIN users AS u ON u.id = ug.user_id
            WHERE ug.group_id = ?`
    rows, err := conn.Query(q, groupId)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []User

    for rows.Next() {
        user := User{Owed: 0.00}
        err = rows.Scan(&user.Id, &user.Name)
        if err != nil {
            return nil, err
        }
        users = append(users, user)
    }
    return users, nil
}

func GetExpenses(groupId string) ([]Expense, error) {
    q := `SELECT id, paid_by_user_id, amount, description, reimbursed_at, paid_on, created_at
            FROM expenses_to_group
            LEFT JOIN expenses ON expense_id = id and group_id = ?`
    rows, err := conn.Query(q, groupId)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    var expenses []Expense
    for rows.Next() {
        e := Expense{}
        var reimbursed_at string
        err = rows.Scan(&e.Id, &e.PaidBy, &e.Amount, &e.Description, &reimbursed_at, &e.PaidOn, &e.CreatedAt)
        if reimbursed_at != "" {
            e.Status = "unpaid"
        } else {
            e.Status = "paid"
        }
        if e.PaidOn != nil {
            e.PaidOnUnix = e.PaidOn.Unix()
        }
        e.CreatedAtUnix = e.CreatedAt.Unix()
        if err != nil {
            return nil, err
        }
        expenses = append(expenses, e)
    }
    return expenses, nil
}

func CreateExpense(e Expense) error {
    q := `INSERT INTO expenses (id, paid_by_user_id, amount, description, paid_on, created_at, split_id)
            VALUES (?, ?, ?, ?, ?, ?, 0)`
    _, err := conn.Exec(q, e.Id, e.PaidBy, e.Amount * 100.0, e.Description, e.PaidOn, e.CreatedAt)
    // TODO: check r.RowsAffected?
    return err
}
