package db

import (
	"database/sql"
	"fmt"
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
    // TODO: updatedAt
    // TODO: ownerId
    // TODO: patternName + patternColor
}

type User struct {
    Id   string `json:"id"`
    Name string `json:"name"`
    Owed float64 `json:"owed"`
    // TODO: use this in frontend? (right now frontend doesn't think this key exists)
    GroupId string `json:"groupId"`
    // TODO: createdAt
    // TODO: updatedAt
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
    SplitId     string `json:"splitId"`
}

type Split struct {
    Id string `json:"id"`
    Name string `json:"name"`
    GroupId string `json:"groupId"`
    Portions map[string]float64 `json:"portions"`
    Color *string `json:"color"`
}

type Debt struct {
    FromUserId string `json:"fromUserId"`
    GroupId string `json:"groupId"`
    Amount float64 `json:"amount"`
}

type Invite struct {
    Id string `json:"id"`
    GroupId string `json:"groupId"`
    CreatedAt unixTimestamp `json:"createdAt"`
    AcceptedAt *unixTimestamp `json:"acceptedAt"`
}

type unixTimestamp time.Time

func (ut unixTimestamp) MarshalJSON() ([]byte, error) {
    // unixMilli to mirror js Date.getTime()
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

var conn = getConn();

func GetGroups(userId string) ([]Group, error) {
    defer util.TimeMe(time.Now(), "GetGroups")
    q := `SELECT g.id, g.name
            FROM users_to_group as ug
            RIGHT JOIN groups AS g on g.id = ug.group_id
            WHERE ug.user_id = ?`
    stmt, err := conn.Prepare(q)
    if err != nil {
        return nil, err
    }
    rows, err := stmt.Query(userId);
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
    stmt, err := tx.Prepare(gq)
    if err != nil {
        tx.Rollback()
        return err
    }
    _, err = stmt.Exec(g.Id, g.Name)
    if err != nil {
        tx.Rollback()
        return err
    }
    err = addUserToGroup(tx, ownerId, g.Id)
    if err != nil {
        tx.Rollback()
        return err
    }
    err = createEvenSplit(tx, defaultSplitId, g.Id)
    if err != nil {
        tx.Rollback()
        return err
    }
    err = tx.Commit()
    return err
}

func addUserToGroup(tx *sql.Tx, userId string, groupId string) error {
    q := `INSERT INTO users_to_group (user_id, group_id) VALUES (?, ?)`
    stmt, err := tx.Prepare(q)
    if err != nil {
        return err
    }
    _, err = stmt.Exec(userId, groupId)
    if err != nil {
        return err
    }
    err = addUserToGroupOwed(tx, userId, groupId)
    return err
}

func addUserToGroupOwed(tx *sql.Tx, userId string, groupId string) error {
    userIds, err := getGroupUserIds(tx, groupId)
    if err != nil {
        return err
    }
    owedStmt := `INSERT INTO owed (from_user_id, to_user_id, group_id, amount) VALUES`
    for i, otherUserId := range userIds {
        if otherUserId == userId {
            continue
        }
        leadingComma := ""
        if i > 0 {
            leadingComma = ","
        }
        owedStmt += fmt.Sprintf("%s('%s', '%s', '%s', 0),",leadingComma, userId, otherUserId, groupId)
        owedStmt += fmt.Sprintf("('%s', '%s', '%s', 0)", otherUserId, userId, groupId)
    }
    _, err = tx.Exec(owedStmt)
    return err
}

// NOTE: userId param is not the user to search for, its the user
// whose groups users to get
// TODO: split out owed
func GetUsers(userId string) ([]User, error) {
    defer util.TimeMe(time.Now(), "GetUsers")
    q := `SELECT u.id, u.name, ow.amount, ug.group_id
            FROM users AS ou
            LEFT JOIN users_to_group as oug ON oug.user_id = ou.id
            LEFT JOIN users_to_group AS ug ON ug.group_id = oug.group_id
            RIGHT JOIN users AS u ON u.id = ug.user_id
            LEFT JOIN owed As ow ON ow.from_user_id = u.id AND ow.to_user_id = ou.id AND ow.group_id = ug.group_id
            WHERE ou.id = ?`
    stmt, err := conn.Prepare(q)
    if err != nil {
        return nil, err
    }
    rows, err := stmt.Query(userId)
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

func GetDebts(userId string) ([]Debt, error) {
    defer util.TimeMe(time.Now(), "GetDebts")
    q := `SELECT ow.from_user_id, ow.group_id, ow.amount
    FROM owed as ow
    WHERE ow.to_user_id = ?`
    stmt, err := conn.Prepare(q)
    if err != nil {
        return nil, err
    }
    rows, err := stmt.Query(userId)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var debts []Debt
    totals := make(map[string]float64)

    for rows.Next() {
        var debt Debt
        err = rows.Scan(&debt.FromUserId, &debt.GroupId, &debt.Amount)
        if err != nil {
            return nil, err
        }
        if _, ok := totals[debt.GroupId]; !ok {
            totals[debt.GroupId] = 0
        }
        totals[debt.GroupId] += debt.Amount
        debts = append(debts, debt)
    }
    // Next() returns false on error or EOF.
    // Err should be consulted to distinguish between the two cases.
    err = rows.Err()
    if err != nil {
        return nil, err
    }
    for groupId, total := range totals {
        debt := Debt{
            FromUserId: userId,
            GroupId: groupId,
            Amount: total,
        }
        debts = append(debts, debt)
    }
    return debts, err
}

func getGroupUserIds(tx *sql.Tx, groupId string) ([]string, error) {
    defer util.TimeMe(time.Now(), "getGroupUsers")
    q := `SELECT u.id
            FROM users_to_group AS ug
            RIGHT JOIN users as u ON u.id = ug.user_id
            WHERE ug.group_id = ?`
    stmt, err := tx.Prepare(q)
    if err != nil {
        return nil, err
    }
    rows, err := stmt.Query(groupId)
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
            RIGHT JOIN expenses AS e ON ug.group_id = e.group_id
            WHERE ou.id = ?`
    stmt, err := conn.Prepare(q)
    if err != nil {
        return nil, err
    }
    rows, err := stmt.Query(userId)
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
    stmt, err := tx.Prepare(
        `INSERT INTO expenses
        (id, paid_by_user_id, amount, description, paid_on, created_at, split_id, group_id)
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
    if err != nil {
        // TODO: what err does Rollback return?
        tx.Rollback()
        return err
    }
    _, err = stmt.Exec(
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
    getUsers, err := tx.Prepare(
        `SELECT user_id, parts, total_parts FROM split_portion_def WHERE split_id = ?`,
        )
    if err != nil {
        return err
    }
    rows, err := getUsers.Query(e.SplitId)
    if err != nil {
        return err
    }
    for rows.Next() {
        var userId string
        var parts float64
        var totalParts float64
        err = rows.Scan(&userId, &parts, &totalParts)
        if err != nil {
            return err
        }
        // FIXME: how to avoid float errors here?
        owed := e.Amount * parts / totalParts
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
    stmt, err := tx.Prepare(
        `DELETE FROM expenses WHERE id = ?`,
        )
    if err != nil {
        tx.Rollback()
        return err
    }
    _, err = stmt.Exec(eid)
    if err != nil {
        tx.Rollback()
        return err
    }

    err = tx.Commit()
    return err
}

// removes portions and updates owed
func cleanupExpenseSideEffects(tx *sql.Tx, eid string) error {
    stmt, err := tx.Prepare(
        `SELECT group_id, paid_by_user_id FROM expenses WHERE id = ?`,
    );
    if err != nil {
        return err
    }
    row := stmt.QueryRow(eid)
    err = row.Err()
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
    getInfo, err := tx.Prepare(
        `SELECT user_id, total_amount FROM split_portion WHERE expense_id = ?`,
    );
    if err != nil {
        return nil, err
    }
    rows, err := getInfo.Query(eid)
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
    deletePortion, err := tx.Prepare(
        `DELETE FROM split_portion WHERE expense_id = ?`,
    )
    if err != nil {
        return nil, err
    }
    _, err = deletePortion.Exec(eid)
    return portions, err
}

func GetSplits(userId string) ([]Split, error) {
    defer util.TimeMe(time.Now(), "GetSplits")
    stmt, err := conn.Prepare(
        `SELECT s.id, s.name, s.color, sd.user_id, sd.parts, sd.total_parts, s.group_id
        FROM users AS ou
        LEFT JOIN users_to_group as ug ON ug.user_id = ou.id
        RIGHT JOIN splits AS s ON s.group_id = ug.group_id
        LEFT JOIN split_portion_def AS sd ON sd.split_id = s.id
        WHERE ou.id = ?
        ORDER BY s.id`,
        )
    if err != nil {
        return nil, err
    }
    rows, err := stmt.Query(userId)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    var splits []Split
    var s Split
    for rows.Next() {
        var si Split
        var userId string
        var parts float64
        var total_parts float64
        err = rows.Scan(&si.Id, &si.Name, &si.Color, &userId, &parts, &total_parts, &si.GroupId)
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
        // FIXME: pass parts back to frontend
        s.Portions[userId] = parts / total_parts
    }
    // Next() returns false on error or EOF.
    // Err should be consulted to distinguish between the two cases.
    err = rows.Err()

    splits = append(splits, s)
    // skip first split as it's empty always
    splits = splits[1:]
    return splits, err
}

func createEvenSplit(tx *sql.Tx, id string, groupId string) error {
    userIds, err := getGroupUserIds(tx, groupId)
    if err != nil {
        return err
    }

    part := 1.0
    portions := make(map[string]float64)
    for _, userId := range userIds {
        portions[userId] = part
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
    stmt, err := tx.Prepare(
        `INSERT INTO splits
        (id, name, group_id, color)
        VALUES
        (?, ?, ?, ?)`,
    )
    if err != nil {
        return err
    }
    _, err = stmt.Exec(split.Id, split.Name, split.GroupId, split.Color)
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
    totalParts := 0.0
    allLessThanOne := true
    for _, parts := range portions {
        totalParts += parts
        allLessThanOne = allLessThanOne && parts <= 1
    }
    if allLessThanOne {
        totalParts = 1
    }
    stmt, err := tx.Prepare(
        `INSERT INTO split_portion_def
        (split_id, user_id, parts, total_parts)
        VALUES
        (?, ?, ?, ?)`,
        );
    if (err != nil) {
        return err
    }
    for userId, parts := range portions {
        _, err := stmt.Exec(splitId, userId, parts, totalParts)
        if err != nil {
            return err
        }
    }
    return nil
}

func CreateInvite(invite Invite) error {
    stmt, err := conn.Prepare(
        `INSERT INTO invites
        (id, group_id, created_at, accepted_at)
        VALUES
        (?, ?, ?, ?)`,
    );
    if err != nil {
        return err
    }
    _, err = stmt.Exec(invite.Id, invite.GroupId, time.Time(invite.CreatedAt), (*time.Time)(invite.AcceptedAt))
    return err
}

func GetInvites(userId string) ([]Invite, error) {
    stmt, err := conn.Prepare(
        `SELECT i.id, i.group_id, i.created_at, i.accepted_at
        FROM users_to_group AS ug
        RIGHT JOIN users_to_group AS ag ON ag.group_id = ug.group_id
        RIGHT JOIN invites AS i ON i.group_id = ag.group_id
        WHERE ug.user_id = ?`,
        )
    if err != nil {
        return nil, err
    }
    rows, err := stmt.Query(userId)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    invites := make([]Invite, 0)
    for rows.Next() {
        var i Invite
        err = rows.Scan(&i.Id, &i.GroupId, &i.CreatedAt, &i.AcceptedAt)
        if err != nil {
            return nil, err
        }
        invites = append(invites, i)
    }
    err = rows.Err()
    return invites, err
}

func AcceptInvite(userId string, inviteId string) error {
    tx, err := conn.Begin()
    if err != nil {
        return err
    }
    invite, err := getInvite(tx, inviteId)
    if err != nil {
        tx.Rollback()
        return err
    }
    alreadyInGroup, err := isUserMemberOfGroup(tx, userId, invite.GroupId)
    if err != nil {
        tx.Rollback()
        return err
    }
    if alreadyInGroup {
        tx.Rollback()
        return fmt.Errorf("user %s is already a member of group %s", userId, invite.GroupId)
    }
    err = addUserToGroup(tx, userId, invite.GroupId)
    if err != nil {
        tx.Rollback()
        return err
    }
    err = markInviteAccepted(tx, inviteId, userId)
    if err != nil {
        tx.Rollback()
        return err
    }

    err = tx.Commit()
    return err
}

func markInviteAccepted(tx *sql.Tx, inviteId string, userId string) error {
    // TODO: create seperate table for invite accepts
    q := `UPDATE invites SET accepted_at = ? WHERE id = ?`
    stmt, err := tx.Prepare(q)
    if err != nil {
        return err
    }
    _, err = stmt.Exec(time.Now(), inviteId)
    if err != nil {
        return err
    }
    return nil
}

func isUserMemberOfGroup(tx *sql.Tx, userId string, groupId string) (bool, error) {
    q := `SELECT COUNT(*) FROM users_to_group WHERE user_id = ? AND group_id = ?`
    stmt, err := tx.Prepare(q)
    if err != nil {
        return false, err
    }
    row := stmt.QueryRow(userId, groupId)
    err = row.Err()
    if err != nil {
        return false, err
    }
    var count int
    err = row.Scan(&count)
    if err != nil {
        return false, err
    }
    return count > 0, nil
}

func getInvite(tx *sql.Tx, inviteId string) (Invite, error) {
    var invite Invite

    stmt, err := tx.Prepare(
        `SELECT id, group_id FROM invites WHERE id = ?`,
    )
    if err != nil {
        return invite, err
    }
    row := stmt.QueryRow(inviteId)
    err = row.Err()
    if err != nil {
        return invite, err
    }
    err = row.Scan(&invite.Id, &invite.GroupId)
    if err != nil {
        return invite, err
    }
    return invite, nil
}
