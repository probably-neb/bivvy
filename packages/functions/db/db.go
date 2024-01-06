package db

import (
	"database/sql"
	"log"
	"strconv"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/probably-neb/paypals-api/util"
)

type Group struct {
    Id string `json:"id"`
    Name string `json:"name"`
    // TODO: createdAt
    // TODO: ownerId
}

type User struct {
    Id   string `json:"id"`
    Name string `json:"name"`
    Owed float64 `json:"owed"`
    // TODO: use this in frontend? (right now frontend doesn't think this key exists)
    GroupId string `json:"groupId"`
}

// TODO: nanoid id type that ensures correct length

type Expense struct {
    Id          string `json:"id"`
    PaidBy      string `json:"paidBy"`
    Amount      float64 `json:"amount"`
    Description string `json:"description"`
    Status      string `json:"status"`
    PaidOn      *unixTimestamp `json:"paidOn"`
    CreatedAt   unixTimestamp `json:"createdAt"`
    GroupId     string `json:"groupId"`
    SplitId     string `json:"splitId"`
}

type Split struct {
    Id string `json:"id"`
    Name string `json:"name"`
    GroupId string `json:"groupId"`
    Portions map[string]float64 `json:"portions"`
    Color *string `json:"color"`
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

func GetGroups(userId string) ([]Group, error) {
    defer util.TimeMe(time.Now(), "GetGroups")
    q := `SELECT g.id, g.name
            FROM users_to_group as ug
            LEFT JOIN groups AS g on g.id = ug.group_id
            WHERE ug.user_id = ?`
    rows, err := conn.Query(q, userId);
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var groups []Group

    for rows.Next() {
        var g Group
        err = rows.Scan(&g.Id, &g.Name)
        if err != nil {
            return nil, err
        }
        groups = append(groups, g)
    }
    err = rows.Err()
    return groups, err
}

func CreateGroup(g Group, ownerId string, defaultSplitId string) error {
    tx, err := conn.Begin()
    if err != nil {
        return err
    }
    gq := `INSERT INTO groups
            (id, name)
            VALUES
            (?, ?)`
    _, err = tx.Exec(gq, g.Id, g.Name)
    if err != nil {
        tx.Rollback()
        return err
    }
    err = addUserToGroup(tx, ownerId, g.Id)
    if err != nil {
        return err
    }
    err = createEvenSplit(tx, defaultSplitId, g.Id)
    return err
}

func addUserToGroup(tx *sql.Tx, userId string, groupId string) error {
    q := `INSERT INTO users_to_group (user_id, group_id) VALUES (?, ?)`
    _, err := tx.Exec(q, userId, groupId)
    return err
}

// NOTE: userId param is not the user to search for, its the user
// whose groups users to get
func GetUsers(userId string) ([]User, error) {
    defer util.TimeMe(time.Now(), "GetUsers")
    q := `SELECT u.id, u.name, ow.amount, ug.group_id
            FROM users AS ou
            LEFT JOIN users_to_group as oug ON oug.user_id = ou.id
            LEFT JOIN users_to_group AS ug ON ug.group_id = oug.group_id
            LEFT JOIN users AS u ON u.id = ug.user_id
            LEFT JOIN owed As ow ON ow.from_user_id = u.id AND ow.to_user_id = ou.id AND ow.group_id = ug.group_id
            WHERE ou.id = ?`
    rows, err := conn.Query(q, userId)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []User

    totalOwed := 0.0
    for rows.Next() {
        var user User
        var owed *float64
        err = rows.Scan(&user.Id, &user.Name, &owed, &user.GroupId)
        // for all other users set owed as one would expect
        if user.Id != userId {
            totalOwed += *owed
            user.Owed = *owed
        }
        if err != nil {
            return nil, err
        }
        users = append(users, user)
    }
    // for the current user set it to the total owed to them
    // this is wierd but prevents needing a separate query, setup, etc
    // for owed in the client
    for i := range users {
        if users[i].Id == userId {
            users[i].Owed = totalOwed
        }
    }
    // Next() returns false on error or EOF.
    // Err should be consulted to distinguish between the two cases.
    err = rows.Err()
    return users, err
}

func getGroupUserIds(tx *sql.Tx, groupId string) ([]string, error) {
    defer util.TimeMe(time.Now(), "getGroupUsers")
    q := `SELECT u.id
            FROM users_to_group AS ug
            LEFT JOIN users as u ON u.id = ug.user_id
            WHERE ug.group_id = ?`
    rows, err := tx.Query(q, groupId)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var userIds []string

    for i := 0; rows.Next(); i++ {
        var userId string
        err = rows.Scan(&userId)
        if err != nil {
            return nil, err
        }
        userIds = append(userIds, userId)
    }
    // Next() returns false on error or EOF.
    // Err should be consulted to distinguish between the two cases.
    err = rows.Err()
    return userIds, err
}

func GetExpenses(userId string) ([]Expense, error) {
    defer util.TimeMe(time.Now(), "GetExpenses")
    q := `SELECT e.id, e.paid_by_user_id, e.amount, e.description, e.reimbursed_at, e.paid_on, e.created_at, e.split_id, e.group_id
            FROM users AS ou
            LEFT JOIN users_to_group as ug ON ug.user_id = ou.id
            LEFT JOIN expenses AS e ON ug.group_id = e.group_id
            WHERE ou.id = ?`
    rows, err := conn.Query(q, userId)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    var expenses []Expense
    for rows.Next() {
        e := Expense{}
        var reimbursed_at *string
        err = rows.Scan(&e.Id, &e.PaidBy, &e.Amount, &e.Description, &reimbursed_at, &e.PaidOn, &e.CreatedAt, &e.SplitId, &e.GroupId)
        if reimbursed_at == nil {
            e.Status = "unpaid"
        } else {
            e.Status = "paid"
        }
        if err != nil {
            return nil, err
        }
        expenses = append(expenses, e)
    }
    // Next() returns false on error or EOF.
    // Err should be consulted to distinguish between the two cases.
    err = rows.Err()
    return expenses, err
}

func CreateExpense(e Expense) error {
    defer util.TimeMe(time.Now(), "CreateExpense")
    // TODO: updated owed table
    tx, err := conn.Begin()
    if err != nil {
        return err
    }
    _, err = tx.Exec(
        `INSERT INTO expenses
    (id, paid_by_user_id, amount, description, paid_on, created_at, split_id, group_id)
    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?)`,
        e.Id, e.PaidBy, e.Amount, e.Description,
        (*time.Time)(e.PaidOn), time.Time(e.CreatedAt), e.SplitId, e.GroupId,
        )
    if err != nil {
        // TODO: what err does Rollback return?
        tx.Rollback()
        return err
    }
    err = createExpenseSideEffects(tx, e)
    if err != nil {
        tx.Rollback()
        return err
    }
    err = tx.Commit()
    // TODO: check r.RowsAffected?
    return err
}

func createExpenseSideEffects(tx *sql.Tx, e Expense) error {
    portions := make(map[string]float64)
    rows, err := tx.Query(
        `SELECT user_id, percentage FROM split_portion_def WHERE split_id = ?`,
        e.SplitId)
    if err != nil {
        return err
    }
    for rows.Next() {
        var userId string
        var percentage float64
        err = rows.Scan(&userId, &percentage)
        if err != nil {
            return err
        }
        // FIXME: how to avoid float errors here?
        owed := e.Amount * percentage
        portions[userId] = owed
    }
    err = rows.Err()
    if err != nil {
        return err
    }
    makeStmt, err := tx.Prepare(
        `INSERT INTO split_portion
        (split_id, expense_id, user_id, total_amount)
        VALUES
        (?, ?, ?, ?)`,
        )
    if err != nil {
        return err
    }
    for userId, owed := range portions {
        _, err = makeStmt.Exec(e.SplitId, e.Id, userId, owed)
        if err != nil {
            return err
        }
    }
    err = updateOwed(tx, e.PaidBy, e.GroupId, portions)
    return err
}

func updateOwed(tx *sql.Tx, paidById, groupId string, portions map[string]float64) error {
    pq := `UPDATE owed SET
    amount = amount + ?
    WHERE from_user_id = ? AND to_user_id = ? AND group_id = ?`
    pqStmt, err := tx.Prepare(pq)
    if err != nil {
        return err
    }
    defer pqStmt.Close()
    for userId, portion := range portions {
        // other user owes paidBy user their portion
        _, err = pqStmt.Exec(portion, userId, paidById, groupId)
        if err != nil {
            return err
        }
        // paidBy user owes other user -portion
        _, err = pqStmt.Exec(-portion, paidById, userId, groupId)
        if err != nil {
            return err
        }
    }
    return err
}

func DeleteExpense(eid string) error {
    defer util.TimeMe(time.Now(), "DeleteExpense")
    tx, err := conn.Begin()
    if err != nil {
        return err
    }
    err = cleanupExpenseSideEffects(tx, eid)
    if err != nil {
        tx.Rollback()
        return err
    }
    _, err = tx.Exec(
        `DELETE FROM expenses WHERE id = ?`,
        eid)
    if err != nil {
        tx.Rollback()
        return err
    }

    err = tx.Commit()
    return err
}

// removes portions and updates owed
func cleanupExpenseSideEffects(tx *sql.Tx, eid string) error {
    row := tx.QueryRow(
        `SELECT group_id, paid_by_user_id FROM expenses WHERE id = ?`,
        eid)
    err := row.Err()
    if err != nil {
        return err
    }
    var groupId, paidById string
    err = row.Scan(&groupId, &paidById)
    if err != nil {
        return err
    }
    portions, err := removeExpensePortions(tx, eid)
    if err != nil {
        return err
    }
    // invert portions so we subtract them from owed
    for portionPaidBy, portion := range portions {
        portions[portionPaidBy] = -portion
    }
    err = updateOwed(tx, paidById, groupId,  portions)
    return err
}

// removes the portions for an expense and returns them
func removeExpensePortions(tx *sql.Tx, eid string) (map[string]float64, error) {
    defer util.TimeMe(time.Now(), "removeExpensePortions")
    rows, err := tx.Query(
        `SELECT user_id, total_amount FROM split_portion WHERE expense_id = ?`,
        eid)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    portions := make(map[string]float64)
    for rows.Next() {
        var userId string
        var percentage float64
        err = rows.Scan(&userId, &percentage)
        if err != nil {
            return nil, err
        }
        portions[userId] = percentage
    }
    err = rows.Err()
    if err != nil {
        return nil, err
    }
    _, err = tx.Exec(
        `DELETE FROM split_portion WHERE expense_id = ?`,
        eid)
    return portions, err
}

func GetSplits(userId string) ([]Split, error) {
    defer util.TimeMe(time.Now(), "GetSplits")
    q := `SELECT s.id, s.name, s.color, sd.user_id, sd.percentage, s.group_id
            FROM users AS ou
            LEFT JOIN users_to_group as ug ON ug.user_id = ou.id
            LEFT JOIN splits AS s ON s.group_id = ug.group_id
            LEFT JOIN split_portion_def AS sd ON sd.split_id = s.id
            WHERE ou.id = ?
            ORDER BY s.id`
    rows, err := conn.Query(q, userId)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    var splits []Split
    var s Split
    for rows.Next() {
        var si Split
        var userId string
        var percentage float64
        err = rows.Scan(&si.Id, &si.Name, &si.Color, &userId, &percentage, &si.GroupId)
        if err != nil {
            return nil, err
        }
        // rows come in lists of the same split with a portion def
        // if we've reached a new split append the current one to the list
        if s.Id != si.Id {
            splits = append(splits, s)
            s = si
            s.Portions = make(map[string]float64)
        }
        s.Portions[userId] = percentage
    }
    // Next() returns false on error or EOF.
    // Err should be consulted to distinguish between the two cases.
    err = rows.Err()

    splits = append(splits, s)
    // skip first split as it's empty always
    splits = splits[1:]
    log.Printf("splits %v", splits)
    return splits, err
}

func createEvenSplit(tx *sql.Tx, id string, groupId string) error {
    userIds, err := getGroupUserIds(tx, groupId)
    if err != nil {
        return err
    }

    percentage := 1.0 / float64(len(userIds))

    portions := make(map[string]float64)
    for _, userId := range userIds {
        portions[userId] = percentage
    }
    split := Split{
        GroupId: groupId,
        Id: id,
        Name: "Evenly",
        Portions: portions,
        // TODO: allow customizing default split when creating group
        Color: nil,
    }
    err = createSplit(tx, split)
    return err
}

func createSplit(tx *sql.Tx, split Split) error {
    sq := `INSERT INTO splits
    (id, name, group_id, color)
    VALUES
    (?, ?, ?, ?)`
    _, err := tx.Exec(sq, split.Id, split.Name, split.GroupId, split.Color)
    if err != nil {
        return err
    }

    err = createSplitPortions(tx, split.Id, split.Portions)
    if err != nil {
        return err
    }
    return err
}

func CreateSplit(split Split) error {
    tx, err := conn.Begin()
    if err != nil {
        return err
    }
    err = createSplit(tx, split)
    if err != nil {
        tx.Rollback()
        return err
    }
    err = tx.Commit()
    if err != nil {
        tx.Rollback()
    }
    return err
}

func createSplitPortions(tx *sql.Tx, splitId string, portions map[string]float64) error {
    //  FIXME: check user id exists
    for userId, percentage := range portions {
        sq := `INSERT INTO split_portion_def
        (split_id, user_id, percentage)
        VALUES
        (?, ?, ?)`
        _, err := tx.Exec(sq, splitId, userId, percentage)
        if err != nil {
            return err
        }
    }
    return nil
}
