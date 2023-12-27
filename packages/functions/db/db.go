package db

type User struct {
    Id   string `json:"id"`
    Name string `json:"name"`
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

func GetUsers() []User {
    return []User{
    {
        Id: "Alice_fjIqVhRO63mS0mu",
        Name: "Alice",
    },
    {
        Id: "Bob_oTfjIqVhRO63mS0mv",
        Name: "Bob",
    },
    {
        Id: "Charlie_123456789ABCD",
        Name: "Charlie",
    },
    {
        Id: "David_123456789ABCDEF",
        Name: "David",
    },
    }
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
