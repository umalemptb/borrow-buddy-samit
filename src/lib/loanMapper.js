// แปลงระหว่างแถวในตาราง loans (snake_case) กับ Loan ในแอป (camelCase) ที่นี่ที่เดียว

export function fromRow(row) {
  return {
    id: row.id,
    friendName: row.friend_name,
    itemName: row.item_name,
    borrowedDate: row.borrowed_date,
    dueDate: row.due_date,
    returnedDate: row.returned_date ?? null,
  }
}

// ไม่ส่ง id (ฐานข้อมูลสร้างให้) และ owner_id (default auth.uid())
export function toRow(loan) {
  return {
    friend_name: loan.friendName,
    item_name: loan.itemName,
    borrowed_date: loan.borrowedDate,
    due_date: loan.dueDate,
    returned_date: loan.returnedDate ?? null,
  }
}
