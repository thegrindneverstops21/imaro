export const INSERT_NOTIFICATION = `INSERT INTO notifications (user_id,email,booking_id,type,title,message)
  VALUES ($1,$2,$3,$4,$5,$6)`;

const OWN_NOTIFICATION = `(n.user_id=u.id OR (n.user_id IS NULL AND lower(n.email)=lower(u.email)))`;

const NOTIFICATION_COLUMNS = `n.id,n.type,n.title,n.message,n.is_read AS "isRead",
  to_char(n.created_at,'YYYY-MM-DD') AS "createdAt",
  (SELECT reference FROM bookings WHERE id=n.booking_id) AS reference`;

export const LIST_NOTIFICATIONS = `SELECT ${NOTIFICATION_COLUMNS} FROM notifications n JOIN users u ON u.id=$1
  WHERE ${OWN_NOTIFICATION} ORDER BY n.created_at DESC,n.id DESC`;
  
export const READ_NOTIFICATION = `UPDATE notifications n SET is_read=true FROM users u
  WHERE u.id=$1 AND n.id=$2 AND ${OWN_NOTIFICATION} RETURNING ${NOTIFICATION_COLUMNS}`;
