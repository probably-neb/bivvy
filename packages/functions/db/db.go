package db

import (
	"database/sql"
	"log"
	"strconv"
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
    PaidOn      *unixTimestamp `json:"paidOn"`
    CreatedAt   unixTimestamp `json:"createdAt"`
    GroupId     string `json:"groupId"`
}

type unixTimestamp time.Time

// TODO: these may need to be divided by 1000 because
// js gives unix in ms not s
func (ut unixTimestamp) MarshalJSON() ([]byte, error) {
    s := strconv.Itoa(int(time.Time(ut).UnixMilli()))
    return []byte(s), nil
}

func (ut *unixTimestamp) UnmarshalJSON(dat []byte) error {
    unix, err := strconv.Atoi(string(dat))
    if err != nil {
        return err
    }
    if unix < 0 {
        *ut = unixTimestamp(time.Now())
        return nil
    }
    *ut = unixTimestamp(time.UnixMilli(int64(unix)))
    return nil
}

// FIXME: create indexes

func getConn() *sql.DB {
    dsn, err := GetSecret("DSN")
    if err != nil {
        log.Fatalf("Could not get DSN secret: %v", err)
    }
    // https://pliutau.com/working-with-db-time-in-go/
    dsn = dsn + "&parseTime=true"
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        log.Fatalf("Could not connect to db: %v", err)
    }
    return db
}

// TODO: create db wrapper like dynamo and have prepare pull/push functions

var conn = getConn();

// FIXME: store owed in db per group
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
        var reimbursed_at *string
        err = rows.Scan(&e.Id, &e.PaidBy, &e.Amount, &e.Description, &reimbursed_at, &e.PaidOn, &e.CreatedAt)
        if reimbursed_at == nil {
            e.Status = "unpaid"
        } else {
            e.Status = "paid"
        }
        e.Amount = e.Amount / 100.0
        if err != nil {
            return nil, err
        }
        expenses = append(expenses, e)
    }
    return expenses, nil
}

func CreateExpense(e Expense) error {
    // TODO: updated owed table
    // FIXME: split id (0 in values)
    eq := `INSERT INTO expenses (id, paid_by_user_id, amount, description, paid_on, created_at, split_id)
            VALUES (?, ?, ?, ?, ?, ?, 0)`
    gq := `INSERT INTO expenses_to_group (group_id, expense_id) VALUES (?, ?)`
    tx, err := conn.Begin()
    if err != nil {
        return err
    }
    _, err = tx.Exec(eq, e.Id, e.PaidBy, e.Amount * 100.0, e.Description, (*time.Time)(e.PaidOn), time.Time(e.CreatedAt))
    if err != nil {
        // TODO: what err does Rollback return?
        tx.Rollback()
        return err
    }
    _, err = tx.Exec(gq, e.GroupId, e.Id)
    if err != nil {
        tx.Rollback()
        return err
    }
    err = tx.Commit()
    // TODO: check r.RowsAffected?
    return err
}
